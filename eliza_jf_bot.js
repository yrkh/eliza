/*
  ELIZA/JF — Job Finder Chatbot (FULL UPDATED)
  -------------------------------------------------
  A stateful, prompt-driven chatbot that collects candidate info
  using regex pattern mapping + light normalization, then emits a
  structured profile and (optionally) calls a stubbed matcher.

  Usage (Node):
    const bot = new ElizaJF({ assumedCity: "Lyndhurst", assumedState: "NJ" });
    const { reply } = bot.start();
    console.log("JF:", reply);
    // -> send candidate messages to bot.handle(candidateText)

  Exports:
    - ElizaJF (class)
    - createDefaultBot(options)
*/

class ElizaJF {
  constructor(options = {}) {
    this.options = {
      assumedCity: options.assumedCity || "Lyndhurst",
      assumedState: options.assumedState || "NJ",
      hourlyDefault: true,
      locale: options.locale || "en-US",
    };

    this.reset();
  }

  reset() {
    this.state = "INIT"; // conversation step
    this.data = {
      name: { first: "", last: "" },
      skills: [],
      companies: [],
      travel_options: [],
      salary_expectation: null, // {amount, period, qualifier}
      home_location_confirmed: null,
      home_location_override: null, // {city, state}
      availability_days: [],
      availability_notes: [],
      hours_per_week_total: null,
      hours_per_day: [],
    };
  }

  start() {
    this.state = "ASK_NAME";
    return { reply: "Hello, how are you? Can I have your name first?", done: false };
  }

  // ---------- Regex helpers ----------
  static get patterns() {
    return {
      name: [
        /\b(?:my name is|i am|i'm|this is)\s+(?<name>[A-Za-z][A-Za-z' -]+)\b/i,
        /^(?<name>[A-Za-z][A-Za-z' -]+)$/i,
      ],
      skillsList: [/^\s*(?<list>[^.?!]+?)\s*$/i],
      companyWork: /\bworked\s+(?:at|in|for)\s+(?<company>[A-Za-z0-9&.' -]{2,})\b/i,
      travelTimeMode: /(?<minutes>\d{1,3})\s*(?:min|minutes)\s*(?:by\s*)?(?<mode>car|bus|train|subway|metro|bike|bicycle|walk|walking|uber|lyft|rideshare|taxi)/gi,
      travelMiles: /(?:up to|within|up\s*to)?\s*(?<miles>\d{1,2})\s*(?:mi|miles)\b/gi,
      anywhere: /\b(anywhere|no limit|open anywhere)\b/i,
      salary: /(?:at\s*least|minimum|min)?\s*\$?\s*(?<amount>\d+(?:\.\d{1,2})?)\s*(?:\/|per|an)?\s*(?<period>hour|hr|day|week|month|year|yr|annum)?/i,
      salaryOpen: /\b(negotiable|open)\b/i,
      salaryMinWage: /\b(minimum wage)\b/i,
      yes: /^(y|yes|yeah|yep|correct|right|that's fine|sure)\b/i,
      no: /^(n|no|nope|not (?:correct|right)|wrong)\b/i,
      overrideCity: /\b(?:i (?:live|am|i'm) in|from)\s+(?<city>[A-Za-z .'-]+?)(?:,\s*(?<state>[A-Z]{2}|[A-Za-z .'-]+))?\b/i,
      numDays: /\b(?<num>\d{1,2})\s*(?:day|days)\b/i,
      dayToken: /\b(?<day>mon(?:day)?|tue(?:sday)?|wed(?:nesday)?|thu(?:rsday)?|fri(?:day)?|sat(?:urday)?|sun(?:day)?|weekends?|weekdays?)\b/gi,
      dayRange: /\b(?<start>mon|tue|wed|thu|fri|sat|sun)[—–-](?<end>mon|tue|wed|thu|fri|sat|sun)\b/gi,
      todNotes: /\b(mornings?|afternoons?|evenings?|nights?)\b/gi,
      totalWeekHours: /\b(?<total>\d+(?:\.\d+)?)\s*(?:h|hr|hrs|hour|hours)\s*(?:per|a|\/)\s*week\b/i,
      perDay: /\b(?<hours>\d+(?:\.\d+)?)\s*(?:h|hr|hrs|hour|hours)\s*(?:on|for)?\s*(?<day>mon(?:day)?|tue(?:sday)?|wed(?:nesday)?|thu(?:rsday)?|fri(?:day)?|sat(?:urday)?|sun(?:day)?)\b/gi,
      proceedYes: /\b(yes|great|ok|okay|sounds good|let's go|go ahead|sure|proceed|fine)\b/i,
      proceedNo: /\b(no|stop|not now|later|hold on|wait)\b/i,
    };
  }

  // ---------- Normalizers ----------
  static titleCase(s) {
    return s.replace(/\b([A-Za-z][A-Za-z']*)/g, (m) => m[0].toUpperCase() + m.slice(1).toLowerCase());
  }

  static splitName(full) {
    const tokens = full.trim().split(/\s+/);
    if (tokens.length === 1) return { first: ElizaJF.titleCase(tokens[0]), last: "" };
    const last = tokens.pop();
    return { first: ElizaJF.titleCase(tokens[0]), last: ElizaJF.titleCase(last) };
  }

  static normalizeSkill(s) {
    const x = s.trim().toLowerCase();
    const map = [
      [/cashiers?\b/, "cashier"],
      [/baristas?\b/, "barista"],
      [/servers?\b/, "server"],
      [/cooks?\b/, "cook"],
    ];
    for (const [rx, repl] of map) if (rx.test(x)) return repl;
    return x;
  }

  static modeEnum(modeRaw) {
    const m = modeRaw.toLowerCase();
    if (["walk", "walking"].includes(m)) return "walk";
    if (["bike", "bicycle"].includes(m)) return "bike";
    if (["hr"].includes(m)) return "hour"; // not a mode, guard
    return m;
  }

  static dayShort(d) {
    const m = d.toLowerCase().slice(0, 3);
    return { mon: "Mon", tue: "Tue", wed: "Wed", thu: "Thu", fri: "Fri", sat: "Sat", sun: "Sun" }[m] || null;
  }

  static expandRange(start, end) {
    const order = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
    const si = order.indexOf(start);
    const ei = order.indexOf(end);
    if (si === -1 || ei === -1) return [];
    if (si <= ei) return order.slice(si, ei + 1);
    return order.slice(ei, si + 1);
  }

  static uniq(arr) {
    return [...new Set(arr)];
  }

  // ---------- Intent handlers per state ----------
  handle(inputRaw) {
    const input = String(inputRaw || "").trim();
    if (!input) return { reply: "Could you type that again?", done: false };

    switch (this.state) {
      case "ASK_NAME":
        return this._handleName(input);
      case "ASK_SKILLS":
        return this._handleSkills(input);
      case "ASK_TRAVEL":
        return this._handleTravel(input);
      case "ASK_SALARY":
        return this._handleSalary(input);
      case "ASK_LOCATION_CONFIRM":
        return this._handleLocationConfirm(input);
      case "ASK_AVAILABILITY":
        return this._handleAvailability(input);
      case "ASK_HOURS":
        return this._handleHours(input);
      case "MATCHING":
        return this._handleMatching(input);
      default:
        return { reply: "Let's start over.", done: false };
    }
  }

  _handleName(text) {
    const P = ElizaJF.patterns;
    let nameStr = null;
    for (const rx of P.name) {
      const m = rx.exec(text);
      if (m?.groups?.name) { nameStr = m.groups.name; break; }
    }

    if (!nameStr) {
      return { reply: "Sorry, what's your name? (e.g., 'My name is Joe')", done: false };
    }

    const name = ElizaJF.splitName(nameStr);
    this.data.name = name;
    this.state = "ASK_SKILLS";
    return { reply: `Great, ${name.first}. Tell me what you like to do — or list your skills or job experience (separated by commas, please).`, done: false };
  }

  _handleSkills(text) {
    const P = ElizaJF.patterns;

    const cm = P.companyWork.exec(text);
    if (cm?.groups?.company) {
      this.data.companies.push(ElizaJF.titleCase(cm.groups.company.trim()));
    }

    const m = P.skillsList[0].exec(text);
    if (m?.groups?.list) {
      const items = m.groups.list.split(/[,;/]|\band\b/gi).map(s => s.trim()).filter(Boolean);
      const skills = items.map(ElizaJF.normalizeSkill).filter(Boolean);
      this.data.skills = ElizaJF.uniq([...(this.data.skills || []), ...skills]);
    }

    if (!this.data.skills.length && !this.data.companies.length) {
      return { reply: "Could you list a couple skills or places you've worked? (e.g., 'Cashier, worked at Acme')", done: false };
    }

    this.state = "ASK_TRAVEL";
    return { reply: "How far are you willing to travel for work, and what transportation would you use?", done: false };
  }

  _handleTravel(text) {
    const P = ElizaJF.patterns;
    let found = false;

    let tm;
    P.travelTimeMode.lastIndex = 0; 
    while ((tm = P.travelTimeMode.exec(text)) !== null) {
      const minutes = parseInt(tm.groups.minutes, 10);
      const mode = ElizaJF.modeEnum(tm.groups.mode);
      if (!isNaN(minutes)) {
        found = true;
        this.data.travel_options.push({ mode, minutes });
      }
    }

    let mm;
    P.travelMiles.lastIndex = 0;
    while ((mm = P.travelMiles.exec(text)) !== null) {
      const miles = parseInt(mm.groups.miles, 10);
      if (!isNaN(miles)) {
        found = true;
        this.data.travel_options.push({ miles });
      }
    }

    if (P.anywhere.test(text)) {
      found = true;
      this.data.travel_options.push({ anywhere: true });
    }

    if (!found) {
      return { reply: "You can say '30 minutes by car' or '10 miles' or '40 minutes by bus'.", done: false };
    }

    this.state = "ASK_SALARY";
    return { reply: "What kind of salary are you looking for?", done: false };
  }

  _handleSalary(text) {
    const P = ElizaJF.patterns;

    if (P.salaryMinWage.test(text)) {
      this.data.salary_expectation = { minimum_wage: true };
    } else if (P.salaryOpen.test(text)) {
      this.data.salary_expectation = { qualifier: "open" };
    } else {
      const m = P.salary.exec(text);
      if (m?.groups?.amount) {
        const amount = parseFloat(m.groups.amount);
        let period = (m.groups.period || (this.options.hourlyDefault ? "hour" : null) || "hour").toLowerCase();
        if (period === "hr") period = "hour";
        const qualifier = /(?:at\s*least|min(?:imum)?)/i.test(text) ? "at_least" : undefined;
        this.data.salary_expectation = { amount, period, ...(qualifier ? { qualifier } : {}) };
      }
    }

    if (!this.data.salary_expectation) {
      return { reply: "Got it. You can say '$15 an hour' or 'minimum wage' or 'open'.", done: false };
    }

    this.state = "ASK_LOCATION_CONFIRM";
    return { reply: `Can I assume you're traveling from ${this.options.assumedCity}, ${this.options.assumedState}, based on your phone number?`, done: false };
  }

  _handleLocationConfirm(text) {
    const P = ElizaJF.patterns;

    if (P.yes.test(text)) {
      this.data.home_location_confirmed = true;
    } else if (P.no.test(text)) {
      this.data.home_location_confirmed = false;
      const m = P.overrideCity.exec(text);
      if (m?.groups?.city) {
        const city = ElizaJF.titleCase(m.groups.city.trim());
        const state = m.groups.state ? m.groups.state.trim().toUpperCase() : undefined;
        this.data.home_location_override = { city, ...(state ? { state } : {}) };
      }
    } else {
      const m = P.overrideCity.exec(text);
      if (m?.groups?.city) {
        this.data.home_location_confirmed = false;
        const city = ElizaJF.titleCase(m.groups.city.trim());
        const state = m.groups.state ? m.groups.state.trim().toUpperCase() : undefined;
        this.data.home_location_override = { city, ...(state ? { state } : {}) };
      }
    }

    if (this.data.home_location_confirmed === null && !this.data.home_location_override) {
      return { reply: "Please say 'yes' or 'no' (and tell me your city if 'no').", done: false };
    }

    this.state = "ASK_AVAILABILITY";
    return { reply: "Ok, just two more questions and we’re done. How many days a week do you want to work, or which days?", done: false };
  }

  _handleAvailability(text) {
    const P = ElizaJF.patterns;

    let n;
    while ((n = P.todNotes.exec(text)) !== null) {
      this.data.availability_notes.push(n[0].toLowerCase());
    }

    let r;
    while ((r = P.dayRange.exec(text)) !== null) {
      const start = ElizaJF.dayShort(r.groups.start);
      const end = ElizaJF.dayShort(r.groups.end);
      const ex = ElizaJF.expandRange(start, end);
      this.data.availability_days.push(...ex);
    }

    let d;
    while ((d = P.dayToken.exec(text)) !== null) {
      const token = d.groups.day.toLowerCase();
      if (token.startsWith("weekend")) this.data.availability_days.push("Sat", "Sun");
      else if (token.startsWith("weekday")) this.data.availability_days.push("Mon", "Tue", "Wed", "Thu", "Fri");
      else this.data.availability_days.push(ElizaJF.dayShort(token));
    }

    const nd = P.numDays.exec(text);
    if (nd?.groups?.num) this.data.availability_num_days = parseInt(nd.groups.num, 10);

    this.data.availability_days = ElizaJF.uniq(this.data.availability_days.filter(Boolean));

    if (!this.data.availability_days.length && !this.data.availability_num_days) {
      return { reply: "You can say 'Mon–Tue', 'Weekends', or '3 days'.", done: false };
    }

    this.state = "ASK_HOURS";
    return { reply: "Last question — how many hours per week do you want to work? (You can say '2 hours on Monday, 5 on Tuesday' too)", done: false };
  }

  _handleHours(text) {
    const P = ElizaJF.patterns;

    // Reset lastIndex on globals to avoid skipping matches across calls
    P.perDay.lastIndex = 0;
    P.totalWeekHours.lastIndex = 0;

    // Total per week
    const tw = P.totalWeekHours.exec(text);
    if (tw?.groups?.total) {
      this.data.hours_per_week_total = parseFloat(tw.groups.total);
    }

    // Per-day entries
    let pd;
    while ((pd = P.perDay.exec(text)) !== null) {
      const hours = parseFloat(pd.groups.hours);
      const day = ElizaJF.dayShort(pd.groups.day);
      if (!isNaN(hours) && day) this.data.hours_per_day.push({ day, hours });
    }

    // Derive total if missing
    if (!this.data.hours_per_week_total && this.data.hours_per_day.length) {
      this.data.hours_per_week_total = this.data.hours_per_day.reduce((s, r) => s + (r.hours || 0), 0);
    }

    // If we have hours info, proceed to matching
    if (this.data.hours_per_week_total || this.data.hours_per_day.length) {
      this.state = "MATCHING";
      return this._handleMatching("proceed");
    }

    return { reply: "You can say '20 hours per week' or give a breakdown like '2 hours on Monday, 5 on Tuesday'.", done: false };
  }

  _handleMatching(text) {
    if (!/proceed|ok|yes|great|go/i.test(text)) {
      return { reply: "Shall I look for matches now?", done: false };
    }

    const profile = JSON.parse(JSON.stringify(this.data));

    const matches = this._fakeMatch(profile);
    const reply = matches.length
      ? "🎉 Great news — we found some matching employers! We can go through them one at a time."
      : "I didn't find an immediate match, but I can keep looking and alert you when something comes up.";

    return { reply, done: true, profile, matches };
  }

  // ---------- Demo matcher (stub) ----------
  _fakeMatch(profile) {
    const wantsCashier = profile.skills.includes("cashier");
    const okMinutes = (profile.travel_options || []).some(o => typeof o.minutes === 'number' && o.minutes <= 40);
    const minPay = profile.salary_expectation?.amount || 0;

    if (wantsCashier && okMinutes && minPay <= 18) {
      return [
        { id: 1, company: "Acme Market", role: "Cashier", pay: 16.5, city: this.options.assumedCity, state: this.options.assumedState },
        { id: 2, company: "Corner Foods", role: "Cashier", pay: 15.75, city: this.options.assumedCity, state: this.options.assumedState },
      ];
    }
    return [];
  }
}

function createDefaultBot(opts) { return new ElizaJF(opts); }

// -------------- Optional: CLI demo --------------
if (require.main === module) {
  const readline = require('readline');
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  const bot = new ElizaJF({ assumedCity: "Lyndhurst", assumedState: "NJ" });

  const ask = (prompt) => new Promise(res => rl.question(prompt + "\n> ", ans => res(ans)));

  (async () => {
    let { reply, done } = bot.start();
    console.log("JF:", reply);
    while (!done) {
      const user = await ask("C:");
      const out = bot.handle(user);
      console.log("JF:", out.reply);
      done = !!out.done;
      if (out.done) {
        console.log("\n--- PROFILE ---\n", JSON.stringify(out.profile, null, 2));
        console.log("\n--- MATCHES ---\n", JSON.stringify(out.matches, null, 2));
        rl.close();
      }
    }
  })();
}

module.exports = { ElizaJF, createDefaultBot };
