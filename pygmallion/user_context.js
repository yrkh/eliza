
// user_context.js

// Global object to store user states

const {
    x_saveSessions,
    x_loadSessions
} = require('./session_store');

let gUserStates = x_loadSessions();
// Initializes a new user with default state 'W'
function x_initUser(
    pUserId
) {
    gUserStates[pUserId] = 'W';
}

// Retrieves the current state of a user
function x_getUserState(
    pUserId
) {
    return gUserStates[pUserId];
}

// Updates the user's state to the next state
function x_setUserState(
    pUserId,
    pNextState
) {
    gUserStates[pUserId] = pNextState;
    x_saveSessions(gUserStates);
}

// Checks if a user is already initialized
function x_isUserInitialized(
    pUserId
) {
    return gUserStates.hasOwnProperty(pUserId);
}

// Removes a user from the state tracking
function x_removeUser(
    pUserId
) {
    delete gUserStates[pUserId];
}

// Lists all active users
function x_listUsers() {
    return Object.keys(gUserStates);
}

module.exports = {
    x_initUser,
    x_getUserState,
    x_setUserState,
    x_isUserInitialized,
    x_removeUser,
    x_listUsers
};
