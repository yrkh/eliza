// Importing required Node.js built-in module for regular expressions
//:wqconst gRegex = require('regex');

// Global array to store pattern-response pairs for Eliza's conversation
let gPatterns = [
    {
        pattern: new RegExp('my name is (.*)', 'i'),
        responses: ['Hi $1?', 'Hello $1.']
    },
    {
        pattern: new RegExp('i (?:worked in|worked at|did|have experience with|Have experience in) (.*)', 'i'),
        responses: ['you did the following $1.', 'you have $1 experiences.']
    },
    {
        pattern: new RegExp('(.*) (?:by|via) (?:bus|train|bike|car|subway|bicycle|walk)', 'i'),
        responses: ['you want to work $1 from home', 'you are willing to travel $1']
    },
    {
        pattern: new RegExp('(.*) (?:drive|driving)', 'i'),
        responses: ['You are willing to drive $1', 'you can work $1 away']
    },
    {
        pattern: new RegExp('i (?:want|need|looking for|at least|around) (.*)', 'i'),
        responses: ['you want $1', 'You want to make $1']
    },
    {
        pattern: new RegExp('i (?:can work|am available|free) (.*)', 'i'),
        responses: ['you want to work the following days $1', '$1 are the days']
    },
    {
        pattern: new RegExp('i\\\'m (?:available|free) (.*)', 'i'),
        responses: ['you want to work the following days $1', '$1 are the days']
    },
    {
        pattern: new RegExp('(.*)', 'i'),
        responses: ['you entered $1', '$1']
    }

];

// Internal function to select a random response from an array
// pResponses: Array of possible response strings
// Returns: A randomly selected response string
function i_selectRandomResponse(pResponses) {
    let lRandomIndex = Math.floor(Math.random() * pResponses.length);
    return pResponses[lRandomIndex];
}

// Internal function to match input against patterns
// pInput: User input string to match
// Returns: Object with matched pattern and response or null
function i_matchPattern(pInput) {
    let lMatch = null;
    let lResponse = null;
    for (let lPattern of gPatterns) {
        lMatch = pInput.match(lPattern.pattern);
        if (lMatch) {
            lResponse = i_selectRandomResponse(lPattern.responses);
            return {match: lMatch, response: lResponse};
        }
    }
    return null;
}

// Internal function to replace placeholders in response
// pMatch: Regex match object
// pResponse: Response string with placeholders
// Returns: Formatted response string
function i_formatResponse(
    pMatch,
    pResponse
) {
    let lFormatted = pResponse;
    for (let lIndex = 1; lIndex < pMatch.length; lIndex++) {
        let lPlaceholder = `$${lIndex}`;
        let lValue = pMatch[lIndex] || '';
        lFormatted = lFormatted.replace(lPlaceholder, lValue);
    }
    return lFormatted;
}

// Exported function to process user input and generate response
// pUserInput: String input from the user
// Returns: String response from Eliza
function x_processInput(pUserInput) {
    let lInput = pUserInput.trim();
    if (lInput.length === 0) {
        return 'Please say something.';
    }
    let lResult = i_matchPattern(lInput);
    if (!lResult) {
        return 'I don’t understand, please tell me more.';
    }
    return i_formatResponse(lResult.match, lResult.response);
}

module.exports = {x_processInput};
