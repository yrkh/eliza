# ELIZA iMessage Chat — How to run

This repo includes:
- `index.html`: a one‑page React app (via CDN) styled like iPhone iMessage.
- `jf_eliza_2.js`: the ELIZA engine usable in both browser and Node.js.

You can run it in two simple ways.

## 1) Run the browser UI (recommended)

Fastest way: just open the HTML file in a modern browser (Chrome, Edge, Firefox, Safari).

- Option A — Double‑click:
  1. Locate `index.html` in this folder.
  2. Double‑click it to open in your default browser.
  3. Start chatting: type in the input bar and press Enter or click Send.

- Option B — Serve it locally (if your browser or extensions block local files):
  - Using Python 3: `python3 -m http.server 8080` then open http://localhost:8080/
  - Using Node (npx): `npx serve .` and open the printed URL.
  - Using VS Code: install the “Live Server” extension and click “Go Live”.

Notes:
- The page includes React and ReactDOM via CDN; no build step is required.
- The ELIZA engine is available as `window.Eliza.xGenerateReply(text)` and is loaded by a regular `<script>` tag.

## 2) Run the Node.js CLI chat (terminal)

You can also chat with ELIZA in the terminal using Node.js (v14+ recommended).

1. Open a terminal in this folder.
2. Run:
   ```bash
   node jf_eliza_2.js
   ```
3. You should see:
   ```
   ELIZA: Hello. How are you feeling today?
   You: 
   ```
4. Type messages and press Enter to get responses. Press Ctrl+C to exit.

## Troubleshooting
- “module is not defined” in the browser: fixed — `jf_eliza_2.js` guards `module.exports` and also attaches to `window.Eliza`.
- Blank page or network/CORS warnings for CDN scripts: ensure you are online or use a local server (see Option B above).
- Nothing happens when I press Enter: make sure the text field is focused; Enter without Shift submits messages.
- Node errors: check Node version with `node -v`. Try Node 14 or newer.

## File overview
- `index.html`: Renders the iMessage-like UI, wires input to `window.Eliza.xGenerateReply()`.
- `jf_eliza_2.js`: Pattern-based ELIZA engine with simple keyword rules and a built-in CLI runner.

# ELIZA iMessage Chat — How to run

This repo includes:
- `index.html`: a one‑page React app (via CDN) styled like iPhone iMessage.
- `jf_eliza_2.js`: the ELIZA engine usable in both browser and Node.js.
- `console.html`: a one‑page React read‑only console that displays the communication/logs between the UI and the ELIZA engine.

You can run it in two simple ways.

## 1) Run the browser UI (recommended)

Fastest way: just open the HTML file in a modern browser (Chrome, Edge, Firefox, Safari).

- Option A — Double‑click:
  1. Locate `index.html` in this folder.
  2. Double‑click it to open in your default browser.
  3. Start chatting: type in the input bar and press Enter or click Send.

- Option B — Serve it locally (if your browser or extensions block local files):
  - Using Python 3: `python3 -m http.server 8080` then open http://localhost:8080/
  - Using Node (npx): `npx serve .` and open the printed URL.
  - Using VS Code: install the “Live Server” extension and click “Go Live”.

Notes:
- The page includes React and ReactDOM via CDN; no build step is required.
- The ELIZA engine is available as `window.Eliza.xGenerateReply(text)` and is loaded by a regular `<script>` tag.

## 2) Run the Node.js CLI chat (terminal)

You can also chat with ELIZA in the terminal using Node.js (v14+ recommended).

1. Open a terminal in this folder.
2. Run:
   ```bash
   node jf_eliza_2.js
   ```
3. You should see:
   ```
   ELIZA: Hello. How are you feeling today?
   You: 
   ```
4. Type messages and press Enter to get responses. Press Ctrl+C to exit.

## 3) Open the read‑only Console Monitor (optional)

`console.html` shows a live, read‑only stream of events flowing between the chat UI (`index.html`) and the ELIZA engine (`jf_eliza_2.js`). It uses the BroadcastChannel API (supported by most modern browsers) to receive events.

How to use:
- Open `console.html` in a second tab/window (ideally side‑by‑side with `index.html`).
- Then open `index.html` and start chatting.
- You will see log entries like:
  - `ui_request_sent`: the UI is about to call the engine with the user input.
  - `request_received`: the engine received the sanitized input.
  - `matched`: the engine found a matching pattern (includes regex, captured text, template info).
  - `fallback`: the engine didn’t match any pattern and selected a fallback response.
  - `response_sent`: the engine produced the final response.
  - `ui_response_received`: the UI received the response and rendered it.

Notes:
- If your browser does not support `BroadcastChannel`, the console will show a warning and remain empty.
- No interaction is required in the console; it is purely read‑only.

## Troubleshooting
- “module is not defined” in the browser: fixed — `jf_eliza_2.js` guards `module.exports` and also attaches to `window.Eliza`.
- Blank page or network/CORS warnings for CDN scripts: ensure you are online or use a local server (see Option B above).
- Nothing happens when I press Enter: make sure the text field is focused; Enter without Shift submits messages.
- Node errors: check Node version with `node -v`. Try Node 14 or newer.

## File overview
- `index.html`: Renders the iMessage-like UI, wires input to `window.Eliza.xGenerateReply()`.
- `console.html`: Renders the read‑only event stream from the UI and engine via BroadcastChannel.
- `jf_eliza_2.js`: Pattern-based ELIZA engine with simple keyword rules and a built-in CLI runner.
- `turing/jf_talk.js`: A declarative conversation flow definition (no classes). It is an array of state objects that describe a finite-state dialogue graph:
  - Each state has an `id` and a `type` of `condition`, `prompt`, or `end`.
  - `condition` uses a named check (e.g., `phoneExists`) to branch to `then`/`else`.
  - `prompt` contains a `prompt` string with placeholders like `{client_name}` and an optional `responses` array with regex-based transitions. A `response` may capture parts of the input (`extract`) and save them into variables (`saveAs`) before moving to `next`.
  - `end` marks the terminal state.
- `turing/jf_turing.js`: The runtime engine that executes the flow defined in `jf_talk.js`. Key exported functions:
  - `x_startConversation(phoneNumber)`: starts a session, evaluates initial conditions/prompts, and returns `{ sessionId, prompt }`.
  - `x_processResponse(sessionId, input)`: feeds user input to the current state, advances the dialogue, and returns `{ prompt, ended }` when appropriate.
  - `x_setPhoneDb(phone, name, age?)`: seeds a simple in-memory phone directory used by the `phoneExists` condition to greet known callers.
  - `x_getSessionVariables(sessionId)`: returns the current variable bag for tests/inspection.
  Internally, the engine maintains:
  - `gStates`: a Map of state id -> state object for O(1) lookup.
  - `gSessions`: active session id -> { currentState, variables }.
  - `gCheckFunctions`: condition checks (currently `phoneExists`).
  - Helpers to interpolate prompts and walk the state machine until it reaches a prompt awaiting input or an end state.
- `turing/jf_turing.test.js`: A comprehensive Node.js test suite (uses Node's built-in `assert`) that demonstrates typical and edge-case conversation paths, including simultaneous sessions.

## How to run the Turing conversation engine

You can exercise the Turing modules directly via Node.js using the test file or by a short REPL snippet.

Option A — Run the tests (recommended):
1. Ensure Node.js v14+ is installed: `node -v`.
2. From the repo root (`eliza` folder), run: `node turing/jf_turing.test.js`
   - The test file is self-contained and uses `assert`; no mocha/jest is required.
   - If it finishes without throwing, all scenarios passed.

Option B — Try it manually in Node REPL:
1. In terminal, run `node` and then:
   ```js
   const t = require('./turing/jf_turing.js');
   t.x_setPhoneDb('201-345-1566','Jane',28);
   let start = t.x_startConversation('201-345-1566');
   console.log(start);
   let r = t.x_processResponse(start.sessionId, 'yes');
   console.log(r);
   r = t.x_processResponse(start.sessionId, 'happy');
   console.log(r);
   r = t.x_processResponse(start.sessionId, 'ok');
   console.log(r);
   r = t.x_processResponse(start.sessionId, 'Family');
   console.log(r);
   r = t.x_processResponse(start.sessionId, 'bye');
   console.log(r);
   ```
   - You should see prompts advancing and `ended: true` after saying `bye`.

Notes:
- The Turing engine is separate from the ELIZA UI and can be used independently.
- The dialogue flow is easy to extend by adding new state objects to `turing/jf_talk.js` and, if needed, new check functions in `turing/jf_turing.js`.



## JSON-driven Flow UI (iMessage style)

A separate one-page React app that reads turing_new/conversation_flow_complete.json and drives the conversation is available here:

- Open turing_new/flow_chat.html directly in a browser, or serve the folder and visit /turing_new/flow_chat.html.

Notes:
- No server required: the page embeds the JSON in a <script type="application/json" id="flow-json"> tag to avoid file:// CORS issues. When served over http(s), it will also work by fetching turing_new/conversation_flow_complete.json.
- The app evaluates the initial condition (phone_exists and is_applicant) using two checkboxes in the top bar.
- Prompts render with variable placeholders like {app_name} replaced from prior answers.
- User inputs are matched against the regex patterns defined in the JSON. If a response defines extract/saveAs, the captured value is stored into the context.
- When the flow reaches get_app_match, the app prints a short summary of the collected info.
