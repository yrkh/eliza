// jf_turing.js
const statesArray = require('./jf_talk.js');

// Global module var for states map, for quick lookup by id.
let gStates = new Map();
// Global module var for check functions, keyed by check name.
let gCheckFunctions = {};
// Global module var for active sessions, keyed by session id.
let gSessions = new Map();
// Global module var for next session id, incremental counter.
let gNextSessionId = 0;
// Global module var for fake phone db, map phone to {name, age}.
let gPhoneDb = new Map();

// Populate states map from imported array.
statesArray.forEach(function(pState) {
    gStates.set(pState.id, pState);
});

// Define phoneExists check function.
gCheckFunctions.phoneExists = function(pVariables) {
    // Check if phone key exists in db map.
    if (gPhoneDb.has(pVariables.phoneNumber)) {
        // Get data object for phone.
        let lData = gPhoneDb.get(pVariables.phoneNumber);
        // Assign name to variables.
        pVariables.client_name = lData.name;
        // Assign age if present in data.
        if (lData.age) {
            pVariables.client_age = lData.age;
        }
        // Return true for exists.
        return true;
    }
    // Return false if not found.
    return false;
};

// Internal func to get state object by id.
function i_getState(pId) {
    // Lookup in map and return.
    return gStates.get(pId);
}

// Internal func to replace {var} in prompt with values.
function i_interpolatePrompt(
    pPrompt,
    pVariables
) {
    // Use replace with callback for each {key}.
    return pPrompt.replace(/{([^}]+)}/g, function(pMatch, pKey) {
        // Return value or 'unknown' if missing.
        return pVariables[pKey] || 'unknown';
    });
}

// Internal func to process user input against current state.
function i_processInput(
    pSession,
    pInput
) {
    // Get current state.
    let lState = i_getState(pSession.currentState);
    // Skip if not prompt or no responses.
    if (!lState || lState.type !== 'prompt' || !lState.responses) {
        return;
    }
    // Get responses array.
    let lResponses = lState.responses;
    // Flag for match found.
    let lMatched = false;
    // Loop over each response option.
    for (let lIndex = 0; lIndex < lResponses.length; lIndex++) {
        // Get current response obj.
        let lResp = lResponses[lIndex];
        // Handle null regex as always match.
        if (lResp.regex === null) {
            // If has saveAs, save whole input (rare).
            if (lResp.saveAs) {
                pSession.variables[lResp.saveAs] = pInput;
            }
            // Set next state.
            pSession.currentState = lResp.next;
            // Set matched flag.
            lMatched = true;
            // Break loop.
            break;
        } else {
            // Exec regex on input.
            let lMatch = lResp.regex.exec(pInput);
            // If matched.
            if (lMatch) {
                // If has extract and saveAs.
                if (lResp.extract && lResp.saveAs) {
                    // Create func to eval extract string.
                    let lExtractFunc = new Function('match',
                        'return ' + lResp.extract);
                    // Get value from match.
                    let lValue = lExtractFunc(lMatch);
                    // Save to variables.
                    pSession.variables[lResp.saveAs] = lValue;
                }
                // Set next state.
                pSession.currentState = lResp.next;
                // Set matched flag.
                lMatched = true;
                // Break loop.
                break;
            }
        }
    }
    // If no match, state unchanged, will repeat prompt.
}

// Internal func to get next prompt, handling chains.
function i_getNextPrompt(pSession) {
    // Array to collect chained prompts.
    let lPrompts = [];
    // Loop until break condition.
    while (true) {
        // Get current state.
        let lState = i_getState(pSession.currentState);
        // Null if invalid state.
        if (!lState) {
            return null;
        }
        // Handle condition type.
        if (lState.type === 'condition') {
            // Get check func by name.
            let lCheckFunc = gCheckFunctions[lState.check];
            // Null if no func.
            if (!lCheckFunc) {
                return null;
            }
            // Call check with variables.
            let lResult = lCheckFunc(pSession.variables);
            // Set state based on result.
            pSession.currentState = lResult ? lState.then : lState.else;
            // Continue loop.
            continue;
        } else if (lState.type === 'end') {
            // Return joined or null.
            return lPrompts.join('\n') || null;
        } else if (lState.type === 'prompt') {
            // Interpolate prompt.
            let lPrompt = i_interpolatePrompt(lState.prompt,
                pSession.variables);
            // Add to array.
            lPrompts.push(lPrompt);
            // Check if has responses.
            if (lState.responses && lState.responses.length > 0) {
                // Return joined, wait here.
                return lPrompts.join('\n');
            } else {
                // Set next or default end.
                pSession.currentState = lState.next || 'g';
                // Continue loop.
                continue;
            }
        } else {
            // Unknown type, null.
            return null;
        }
    }
}

// Exported func to start a new conversation.
function x_startConversation(
    pPhoneNumber
) {
    // Generate string id.
    let lSessionId = '' + gNextSessionId++;
    // Create variables obj.
    let lVariables = {
        phoneNumber: pPhoneNumber
    };
    // Create session obj.
    let lSession = {
        currentState: 'start',
        variables: lVariables
    };
    // Add to sessions map.
    gSessions.set(lSessionId, lSession);
    // Get first prompt.
    let lPrompt = i_getNextPrompt(lSession);
    // Return id and prompt.
    return {
        sessionId: lSessionId,
        prompt: lPrompt
    };
}

// Exported func to process user response.
function x_processResponse(
    pSessionId,
    pInput
) {
    // Get session by id.
    let lSession = gSessions.get(pSessionId);
    // Null if not found.
    if (!lSession) {
        return null;
    }
    // Process the input.
    i_processInput(lSession, pInput);
    // Get next prompt.
    let lPrompt = i_getNextPrompt(lSession);
    // If null, end session with no prompt.
    if (lPrompt === null) {
        gSessions.delete(pSessionId);
        return { prompt: null, ended: true };
    }
    // If current state is an end state, end the session but still return the final prompt.
    const lStateNow = i_getState(lSession.currentState);
    if (lStateNow && lStateNow.type === 'end') {
        gSessions.delete(pSessionId);
        return { prompt: lPrompt, ended: true };
    }
    // Otherwise continue.
    return { prompt: lPrompt, ended: false };
}

// Exported func to set phone db for testing.
function x_setPhoneDb(
    pPhone,
    pName,
    pAge = null
) {
    // Set data in map.
    gPhoneDb.set(pPhone, {
        name: pName,
        age: pAge
    });
}

// Exported func to get session variables for testing.
function x_getSessionVariables(
    pSessionId
) {
    // Get session.
    let lSession = gSessions.get(pSessionId);
    // Return variables if exists.
    if (lSession) {
        return lSession.variables;
    }
    // Null otherwise.
    return null;
}

module.exports = {
    x_startConversation,
    x_processResponse,
    x_setPhoneDb,
    x_getSessionVariables
};
