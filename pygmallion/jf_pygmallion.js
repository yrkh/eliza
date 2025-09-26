// jf_pygmallion.js
// Simple per-user finite state machine (FSM) engine.
// - Uses ./jf_talk.js for the FSM configuration (states and transitions).
// - Tracks each user's current state in-memory via a Map.
// - Consumes input tokens (e.g., 'ww2', 'aa1') that must match transition keys
//   defined under the current state's m_transitions.
// - Executes the transition's action (currently just console.log) and advances
//   the user to the transition's m_next state.
//
// Usage example:
//   const { xInitializeUser, xProcessInput } = require('./jf_pygmallion');
//   xInitializeUser('user1');        // sets state to 'W'
//   xProcessInput('user1', 'ww2');   // logs 'Trigger incoming', moves to 'A'
//   xProcessInput('user1', 'aa2');   // logs 'aa2', moves to 'B'

// Load state definitions from external file
const gStateDefinitions = require('./jf_talk');

// Map to track each user's current state (userId -> stateId)
const gUserStates = new Map();

/**
 * Exported function to initialize a user session.
 * Sets the user's state to 'W' (WAIT).
 */
function xInitializeUser(
    pUserId
) {
    gUserStates.set(pUserId, 'W');
}

/**
 * Exported function to process user input.
 * Determines next state and action based on input.
 */
function xProcessInput(
    pUserId,
    pInput
) {
    const lCurrentState = gUserStates.get(pUserId);

    if (!lCurrentState) {
        throw new Error('User not initialized');
    }

    const lStateObj = iFindStateDefinition(lCurrentState);

    if (!lStateObj) {
        throw new Error('Invalid state: ' + lCurrentState);
    }

    const lTransition = iFindTransition(
        lStateObj,
        pInput
    );

    if (!lTransition) {
        throw new Error('Invalid input for state: ' + pInput);
    }

    iExecuteAction(lTransition.m_action);

    gUserStates.set(
        pUserId,
        lTransition.m_next
    );

    return {
        resultId: lTransition.m_resultId,
        action: lTransition.m_action,
        nextState: lTransition.m_next
    };
}

/**
 * Internal function to find state definition.
 */
function iFindStateDefinition(
    pStateId
) {
    for (
        let lIndex = 0;
        lIndex < gStateDefinitions.length;
        lIndex++
    ) {
        const lState = gStateDefinitions[lIndex];

        if (lState.m_stateId === pStateId) {
            return lState;
        }
    }

    return null;
}

/**
 * Internal function to find transition for input.
 */
function iFindTransition(
    pStateObj,
    pInput
) {
    if (
        pStateObj &&
        pStateObj.m_transitions &&
        pStateObj.m_transitions[pInput]
    ) {
        return pStateObj.m_transitions[pInput];
    }

    return null;
}

/**
 * Internal function to execute action.
 * Currently prints to console.
 */
function iExecuteAction(
    pAction
) {
    console.log(pAction);
}

module.exports = {
    xInitializeUser,
    xProcessInput
};

