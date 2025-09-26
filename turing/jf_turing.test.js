// jf_turing.test.js
// Self-contained Node test runner (no mocha/jest required).
// Run: node turing/jf_turing.test.js
const assert = require('assert');
const {
    x_startConversation,
    x_processResponse,
    x_setPhoneDb,
    x_getSessionVariables
} = require('./jf_turing.js');

const tests = [];
function test(name, fn) { tests.push({ name, fn }); }
function beforeAll(fn) { beforeAll._fn = fn; }

function run() {
    let passed = 0;
    let failed = 0;
    try { if (beforeAll._fn) beforeAll._fn(); } catch (e) { console.error('beforeAll failed:', e); process.exit(1); }
    for (const t of tests) {
        try {
            t.fn();
            console.log('✓', t.name);
            passed++;
        } catch (e) {
            console.error('✗', t.name);
            console.error(e.stack || e);
            failed++;
        }
    }
    console.log(`\nSummary: ${passed} passed, ${failed} failed.`);
    process.exit(failed ? 1 : 0);
}

beforeAll(function() {
    // Set up database with sample numbers.
    x_setPhoneDb('201-729-3040', 'John', 35);
    x_setPhoneDb('201-345-1566', 'Jane', 28);
});

test('path 1: caller not in db, yes mood, happy, loop with topic, exit', function() {
        // Use non-existing phone.
        let lStart = x_startConversation('201-729-3038');
        // Check name prompt.
        assert.strictEqual(lStart.prompt, "I don't have you on my record. Can we start by giving me your name first?");
        let lSessionId = lStart.sessionId;
        // Give name.
        let lResp = x_processResponse(lSessionId, 'My name is NewUser');
        assert.strictEqual(lResp.prompt, 'Can I have your age please before we continue?');
        // Give age.
        lResp = x_processResponse(lSessionId, '25');
        assert.strictEqual(lResp.prompt, 'How are you, would you like to talk about your mood today?');
        // Yes.
        lResp = x_processResponse(lSessionId, 'yes');
        assert.strictEqual(lResp.prompt, "Great!  Let's talk about your mood today.  How do you feel today?");
        // Happy.
        lResp = x_processResponse(lSessionId, 'happy');
        assert.strictEqual(lResp.prompt, "Oh! Let's talk about why you feel happy today, let's talk about that.  Shall we?");
        // Any.
        lResp = x_processResponse(lSessionId, 'sure');
        assert.strictEqual(lResp.prompt, 'Please continue.');
        // Response for topic.
        lResp = x_processResponse(lSessionId, 'Family gathering');
        assert.strictEqual(lResp.prompt, 'That sounds interesting.');
        // Check topic.
        let lVars = x_getSessionVariables(lSessionId);
        assert.strictEqual(lVars.curr_topic, 'Family');
        // Not exit, loop back.
        lResp = x_processResponse(lSessionId, 'more');
        assert.strictEqual(lResp.prompt, 'Please continue.');
        // Another topic.
        lResp = x_processResponse(lSessionId, 'Promotion');
        assert.strictEqual(lResp.prompt, 'That sounds interesting.');
        lVars = x_getSessionVariables(lSessionId);
        assert.strictEqual(lVars.curr_topic, 'Promotion');
        // Exit.
        lResp = x_processResponse(lSessionId, 'bye');
        assert.strictEqual(lResp.prompt, 'Well, sorry to see you go so soon, but come back anytime soon.');
        assert.strictEqual(lResp.ended, true);
    });

test('path 2: caller not in db, no mood, provide topic, loop', function() {
        // Non-existing phone.
        let lStart = x_startConversation('201-729-3038');
        let lSessionId = lStart.sessionId;
        let lResp = x_processResponse(lSessionId, 'Call me NewUser2');
        lResp = x_processResponse(lSessionId, '30');
        // No.
        lResp = x_processResponse(lSessionId, 'no');
        assert.strictEqual(lResp.prompt, 'What do you have in mind?');
        // Provide topic.
        lResp = x_processResponse(lSessionId, 'want to talk about hobbies');
        assert.strictEqual(lResp.prompt, "Oh! Let's talk about why you feel hobbies today, let's talk about that.  Shall we?");
        let lVars = x_getSessionVariables(lSessionId);
        assert.strictEqual(lVars.curr_mood, 'hobbies');
        // Any.
        lResp = x_processResponse(lSessionId, 'ok');
        assert.strictEqual(lResp.prompt, 'Please continue.');
        // Topic.
        lResp = x_processResponse(lSessionId, 'Gardening');
        assert.strictEqual(lResp.prompt, 'That sounds interesting.');
        lVars = x_getSessionVariables(lSessionId);
        assert.strictEqual(lVars.curr_topic, 'Gardening');
        // Exit.
        lResp = x_processResponse(lSessionId, 'quit');
        assert.strictEqual(lResp.ended, true);
    });

test('path 3: caller in db with age, yes path', function() {
        // Existing phone.
        let lStart = x_startConversation('201-729-3040');
        assert.strictEqual(lStart.prompt, 'Hi, John\nHow are you, would you like to talk about your mood today?');
        let lSessionId = lStart.sessionId;
        let lVars = x_getSessionVariables(lSessionId);
        assert.strictEqual(lVars.client_name, 'John');
        assert.strictEqual(lVars.client_age, 35);
        // Yes.
        let lResp = x_processResponse(lSessionId, 'yeah');
        assert.strictEqual(lResp.prompt, "Great!  Let's talk about your mood today.  How do you feel today?");
        // Relieved.
        lResp = x_processResponse(lSessionId, 'relieved');
        assert.strictEqual(lResp.prompt, "Oh! Let's talk about why you feel relieved today, let's talk about that.  Shall we?");
        // Any.
        lResp = x_processResponse(lSessionId, 'yes');
        assert.strictEqual(lResp.prompt, 'Please continue.');
        // Topic.
        lResp = x_processResponse(lSessionId, 'Vacation started');
        assert.strictEqual(lResp.prompt, 'That sounds interesting.');
        // Exit.
        lResp = x_processResponse(lSessionId, 'exit');
        assert.strictEqual(lResp.ended, true);
    });

test('path 4: caller in db without age, no path', function() {
        // Set without age.
        x_setPhoneDb('201-345-1566', 'Jane'); // Override age to null.
        let lStart = x_startConversation('201-345-1566');
        assert.strictEqual(lStart.prompt, 'Hi, Jane\nHow are you, would you like to talk about your mood today?');
        let lSessionId = lStart.sessionId;
        let lVars = x_getSessionVariables(lSessionId);
        assert.strictEqual(lVars.client_name, 'Jane');
        assert.strictEqual(lVars.client_age, undefined);
        // No.
        let lResp = x_processResponse(lSessionId, 'nah');
        assert.strictEqual(lResp.prompt, 'What do you have in mind?');
        // Topic.
        lResp = x_processResponse(lSessionId, 'how about travel');
        assert.strictEqual(lResp.prompt, "Oh! Let's talk about why you feel travel today, let's talk about that.  Shall we?");
        lVars = x_getSessionVariables(lSessionId);
        assert.strictEqual(lVars.curr_mood, 'travel');
        // Any.
        lResp = x_processResponse(lSessionId, 'sure');
        assert.strictEqual(lResp.prompt, 'Please continue.');
        // Topic.
        lResp = x_processResponse(lSessionId, 'Europe');
        assert.strictEqual(lResp.prompt, 'That sounds interesting.');
        // Exit.
        lResp = x_processResponse(lSessionId, 'have to go');
        assert.strictEqual(lResp.ended, true);
    });

test('path 5: invalid responses, repeats, not in db', function() {
        let lStart = x_startConversation('201-729-3038');
        let lSessionId = lStart.sessionId;
        // Invalid name.
        let lResp = x_processResponse(lSessionId, 'hi');
        assert.strictEqual(lResp.prompt, "I don't have you on my record. Can we start by giving me your name first?");
        // Valid.
        lResp = x_processResponse(lSessionId, 'I am TestInvalid');
        assert.strictEqual(lResp.prompt, 'Can I have your age please before we continue?');
        // Invalid age.
        lResp = x_processResponse(lSessionId, 'old');
        assert.strictEqual(lResp.prompt, 'Can I have your age please before we continue?');
        // Valid.
        lResp = x_processResponse(lSessionId, '40');
        assert.strictEqual(lResp.prompt, 'How are you, would you like to talk about your mood today?');
        // Invalid yes/no.
        lResp = x_processResponse(lSessionId, 'perhaps');
        assert.strictEqual(lResp.prompt, 'How are you, would you like to talk about your mood today?');
        // Yes.
        lResp = x_processResponse(lSessionId, 'aye');
        assert.strictEqual(lResp.prompt, "Great!  Let's talk about your mood today.  How do you feel today?");
        // Invalid mood.
        lResp = x_processResponse(lSessionId, 'sad');
        assert.strictEqual(lResp.prompt, "Great!  Let's talk about your mood today.  How do you feel today?");
        // Valid.
        lResp = x_processResponse(lSessionId, 'tired');
        assert.strictEqual(lResp.prompt, "Oh! Let's talk about why you feel tired today, let's talk about that.  Shall we?");
        // Any.
        lResp = x_processResponse(lSessionId, 'ok');
        assert.strictEqual(lResp.prompt, 'Please continue.');
        // Invalid topic (starts with space or punct).
        lResp = x_processResponse(lSessionId, ' ,work');
        assert.strictEqual(lResp.prompt, 'Please continue.');
        // Valid.
        lResp = x_processResponse(lSessionId, 'Long day');
        assert.strictEqual(lResp.prompt, 'That sounds interesting.');
        // Not exit.
        lResp = x_processResponse(lSessionId, 'continue');
        assert.strictEqual(lResp.prompt, 'Please continue.');
        // Exit.
        lResp = x_processResponse(lSessionId, 'bye');
        assert.strictEqual(lResp.ended, true);
    });

test('path 6: no path invalid, in db', function() {
        let lStart = x_startConversation('201-729-3040');
        let lSessionId = lStart.sessionId;
        let lResp = x_processResponse(lSessionId, 'n');
        assert.strictEqual(lResp.prompt, 'What do you have in mind?');
        // Invalid.
        lResp = x_processResponse(lSessionId, 'nothing');
        assert.strictEqual(lResp.prompt, 'What do you have in mind?');
        // Valid.
        lResp = x_processResponse(lSessionId, 'want to talk about weather');
        assert.strictEqual(lResp.prompt, "Oh! Let's talk about why you feel weather today, let's talk about that.  Shall we?");
    });

test('path 7: multiple simultaneous sessions', function() {
        // Session 1: not in db.
        let lStart1 = x_startConversation('201-729-3038');
        let lSession1 = lStart1.sessionId;
        assert.strictEqual(lStart1.prompt, "I don't have you on my record. Can we start by giving me your name first?");
        // Session 2: in db.
        let lStart2 = x_startConversation('201-345-1566');
        let lSession2 = lStart2.sessionId;
        assert.strictEqual(lStart2.prompt, 'Hi, Jane\nHow are you, would you like to talk about your mood today?');
        // Process session 1.
        let lResp1 = x_processResponse(lSession1, 'My name is Multi1');
        assert.strictEqual(lResp1.prompt, 'Can I have your age please before we continue?');
        // Process session 2.
        let lResp2 = x_processResponse(lSession2, 'yes');
        assert.strictEqual(lResp2.prompt, "Great!  Let's talk about your mood today.  How do you feel today?");
        // Continue session 1.
        lResp1 = x_processResponse(lSession1, '22');
        assert.strictEqual(lResp1.prompt, 'How are you, would you like to talk about your mood today?');
        // Continue session 2.
        lResp2 = x_processResponse(lSession2, 'stressed');
        assert.strictEqual(lResp2.prompt, "Oh! Let's talk about why you feel stressed today, let's talk about that.  Shall we?");
        // End session 1.
        lResp1 = x_processResponse(lSession1, 'no');
        assert.strictEqual(lResp1.prompt, 'What do you have in mind?');
        // Note: not ending yet, but shows independent.
        // Can continue or end as needed.
    });

run();