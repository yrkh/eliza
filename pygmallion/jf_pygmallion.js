// jf_pygmallion.js

const gStates = require('./jf_talk');
const {
    x_sineTaylor,
    x_average,
    x_harmonicMean,
    x_geometricMean,
    x_contraHarmonicMean,
    x_variance,
    x_standardDeviation,
    x_randomChoice
} = require('./math_utils');
const {
    x_initUser,
    x_getUserState,
    x_setUserState,
    x_isUserInitialized
} = require('./user_context');

// Executes the action defined in the transition
function i_executeAction(
    pAction,
    pArgs,
    pPrefix,
    pPostProcess
) {
    let lResult = null;

    if (pAction === 'sineTaylor') {
        lResult = x_sineTaylor(pArgs[0]);
    } else if (pAction === 'average') {
        lResult = x_average(pArgs);
    } else if (pAction === 'harmonicMean') {
        lResult = x_harmonicMean(pArgs);
    } else if (pAction === 'geometricMean') {
        lResult = x_geometricMean(pArgs);
    } else if (pAction === 'contraHarmonicMean') {
        lResult = x_contraHarmonicMean(pArgs);
    } else if (pAction === 'variance') {
        lResult = x_variance(pArgs);
    } else if (pAction === 'standardDeviation') {
        lResult = x_standardDeviation(pArgs);
    } else if (pAction === 'randomChoice') {
        lResult = x_randomChoice(pArgs);
    } else if (pAction === 'print') {
        console.log(pArgs[0]);
        return;
    }

    if (pPostProcess === 'multiplyBy2') {
        lResult *= 2;
    }

    if (pPrefix) {
        const lLabel = String(pPrefix).trimEnd();
        console.log(lLabel, lResult);
        return;
    }

    console.log('The result was', lResult);
}

// Processes input for a given user
function x_processInput(
    pUserId,
    pInput
) {
    if (!x_isUserInitialized(pUserId)) {
        x_initUser(pUserId);
    }

    let lCurrentState = x_getUserState(pUserId);

    let lStateObj = gStates.find(
        lState => lState.m_stateId === lCurrentState
    );

    if (!lStateObj) {
        console.error('State not found:', lCurrentState);
        return;
    }

    let lTransition = lStateObj.m_transitions[pInput];

    if (!lTransition) {
        console.log('Invalid input:', pInput);
        return;
    }

    i_executeAction(
        lTransition.m_action,
        lTransition.m_args,
        lTransition.m_prefix,
        lTransition.m_postProcess
    );

    x_setUserState(
        pUserId,
        lTransition.m_next
    );
}

module.exports = {
    x_processInput
};
