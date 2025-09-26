// jf_talk.js
// This is a db file
// In the debug window, display the id and the type. Put up in the response field what's expected, regex, if that exists
// expected response
module.exports = [
    {
        id: 'start',
        type: 'condition',
        check: 'phoneExists',
        then: 'h',
        else: 'j'
    },
    {
        id: 'g',
        type: 'end'
    },
    {
        id: 'h',
        type: 'prompt',
        prompt: 'Hi, {client_name}',
        responses: [],
        next: 'k'
    },
    {
        id: 'j',
        type: 'prompt',
        prompt: "I don't have you on my record. Can we start by giving me your name first?",
        responses: [
            {
                regex: new RegExp('\\b(?:I am|My name is|Call me)\\s+([a-zA-Z]+(?:\\s[a-zA-Z]+)*)', 'i'),
                extract: 'match[1]',
                saveAs: 'client_name',
                next: 'j1'
            }
        ]
    },
    {
        id: 'j1',
        type: 'prompt',
        prompt: 'Can I have your age please before we continue?',
        responses: [
            {
                regex: new RegExp('(?<!\\d)\\d+(?!\\d)'),
                extract: 'match[0]',
                saveAs: 'client_age',
                next: 'k'
            }
        ]
    },
    {
        id: 'k',
        type: 'prompt',
        prompt: 'How are you, would you like to talk about your mood today?',
        responses: [
            {
                regex: new RegExp('\\b(yes|y|aye|yeah)\\b', 'i'),
                next: 'k1a'
            },
            {
                regex: new RegExp('\\b(no|nah|n|nay)\\b', 'i'),
                next: 'k1b'
            }
        ]
    },
    {
        id: 'k1a',
        type: 'prompt',
        prompt: "Great!  Let's talk about your mood today.  How do you feel today?",
        responses: [
            {
                regex: new RegExp('\\b(stressed|tired|relieved|happy)\\b', 'i'),
                extract: 'match[0]',
                saveAs: 'curr_mood',
                next: 'k1a1'
            }
        ]
    },
    {
        id: 'k1b',
        type: 'prompt',
        prompt: 'What do you have in mind?',
        responses: [
            {
                regex: new RegExp('\\b(want to talk about|how about)\\s+(.+)', 'i'),
                extract: 'match[2]',
                saveAs: 'curr_mood',
                next: 'k1a1'
            }
        ]
    },
    {
        id: 'k1a1',
        type: 'prompt',
        prompt: "Oh! Let's talk about why you feel {curr_mood} today, let's talk about that.  Shall we?",
        responses: [
            {
                regex: null,
                next: 'k1a1b'
            }
        ]
    },
    {
        id: 'k1a1b',
        type: 'prompt',
        prompt: 'Please continue.',
        responses: [
            {
                regex: new RegExp('\\b(have to go|quit|exit|bye)\\b', 'i'),
                next: 'bye'
            },
            {
                regex: new RegExp('^[^\\s.,!?;:]+'),
                extract: 'match[0]',
                saveAs: 'curr_topic',
                next: 'k1a1c'
            }
        ]
    },
    {
        id: 'k1a1c',
        type: 'prompt',
        prompt: 'That sounds interesting.',
        responses: [
            {
                regex: new RegExp('\\b(have to go|quit|exit|bye)\\b', 'i'),
                next: 'bye'
            },
            {
                regex: null,
                next: 'k1a1b'
            }
        ]
    },
    {
        id: 'bye',
        type: 'prompt',
        prompt: 'Well, sorry to see you go so soon, but come back anytime soon.',
        responses: [],
        next: 'g'
    }
];