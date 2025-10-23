// test_jf_pygmallion.js

const assert = require('assert');
// const sinon = require('sinon');
const {
    x_processInput
} = require('./jf_pygmallion');
const {
    x_getUserState,
    x_initUser,
    x_setUserState,
    x_removeUser
} = require('./user_context');

describe('State Machine: jf_pygmallion', function () {

    let lConsoleStub;

    beforeEach(function () {
        lConsoleStub = sinon.stub(console, 'log');
    });

    afterEach(function () {
        lConsoleStub.restore();
    });

    function i_testTransition(
        pUserId,
        pInput,
        pExpectedState,
        pExpectedOutput
    ) {
        x_processInput(pUserId, pInput);
        let lState = x_getUserState(pUserId);
        assert.strictEqual(lState, pExpectedState);

        if (pExpectedOutput) {
            let lOutputFound = lConsoleStub.calledWithMatch(pExpectedOutput);
            assert.ok(lOutputFound, `Expected output: ${pExpectedOutput}`);
        }
    }

    it('should handle W -> W transition with sineTaylor', function () {
        let lUserId = 'userW1';
        x_initUser(lUserId);
        i_testTransition(
            lUserId,
            'ww1',
            'W',
            'The result was'
        );
    });

    it('should handle W -> A transition with print', function () {
        let lUserId = 'userW2';
        x_initUser(lUserId);
        i_testTransition(
            lUserId,
            'ww2',
            'A',
            'Trigger incoming'
        );
    });

    it('should handle A -> E with randomChoice', function () {
        let lUserId = 'userA1';
        x_setUserState(lUserId, 'A');
        i_testTransition(
            lUserId,
            'aa1',
            'E',
            'The result was'
        );
    });

    it('should handle A -> B with print', function () {
        let lUserId = 'userA2';
        x_setUserState(lUserId, 'A');
        i_testTransition(
            lUserId,
            'aa2',
            'B',
            'aa2'
        );
    });

    it('should handle A -> B with average', function () {
        let lUserId = 'userA3';
        x_setUserState(lUserId, 'A');
        i_testTransition(
            lUserId,
            'aa3',
            'B',
            'The result was'
        );
    });

    it('should handle B -> C with harmonicMean * 2', function () {
        let lUserId = 'userB1';
        x_setUserState(lUserId, 'B');
        i_testTransition(
            lUserId,
            'bb1',
            'C',
            'The result was'
        );
    });

    it('should handle B -> D with geometricMean', function () {
        let lUserId = 'userB2';
        x_setUserState(lUserId, 'B');
        i_testTransition(
            lUserId,
            'bb2',
            'D',
            'Geo Mean'
        );
    });

    it('should handle C -> F with contraHarmonicMean', function () {
        let lUserId = 'userC1';
        x_setUserState(lUserId, 'C');
        i_testTransition(
            lUserId,
            'cc1',
            'F',
            'The result was'
        );
    });

    it('should handle C -> D with print', function () {
        let lUserId = 'userC2';
        x_setUserState(lUserId, 'C');
        i_testTransition(
            lUserId,
            'cc2',
            'D',
            'cc2'
        );
    });

    it('should handle D -> W with variance', function () {
        let lUserId = 'userD1';
        x_setUserState(lUserId, 'D');
        i_testTransition(
            lUserId,
            'dd1',
            'W',
            'Var of'
        );
    });

    it('should handle D -> A with print', function () {
        let lUserId = 'userD2';
        x_setUserState(lUserId, 'D');
        i_testTransition(
            lUserId,
            'dd2',
            'A',
            'dd2'
        );
    });

    it('should handle D -> B with standardDeviation', function () {
        let lUserId = 'userD3';
        x_setUserState(lUserId, 'D');
        i_testTransition(
            lUserId,
            'dd3',
            'B',
            'STD of'
        );
    });

    it('should handle D -> C with sineTaylor', function () {
        let lUserId = 'userD4';
        x_setUserState(lUserId, 'D');
        i_testTransition(
            lUserId,
            'dd4',
            'C',
            'The result was'
        );
    });

    it('should handle E -> B with randomChoice', function () {
        let lUserId = 'userE1';
        x_setUserState(lUserId, 'E');
        i_testTransition(
            lUserId,
            'ee1',
            'B',
            'The result was'
        );
    });

    it('should handle E -> W with harmonicMean * 2', function () {
        let lUserId = 'userE2';
        x_setUserState(lUserId, 'E');
        i_testTransition(
            lUserId,
            'ee2',
            'W',
            'The result was'
        );
    });

    it('should handle F -> C with print', function () {
        let lUserId = 'userF1';
        x_setUserState(lUserId, 'F');
        i_testTransition(
            lUserId,
            'ff1',
            'C',
            'ff1'
        );
    });

    it('should handle F -> D with print', function () {
        let lUserId = 'userF2';
        x_setUserState(lUserId, 'F');
        i_testTransition(
            lUserId,
            'ff2',
            'D',
            'ff2'
        );
    });

    it('should handle F -> A with geometricMean', function () {
        let lUserId = 'userF3';
        x_setUserState(lUserId, 'F');
        i_testTransition(
            lUserId,
            'ff3',
            'A',
            'Geo Mean'
        );
    });

    it('should reject invalid input', function () {
        let lUserId = 'userBad';
        x_initUser(lUserId);
        x_processInput(lUserId, 'invalid');
        let lState = x_getUserState(lUserId);
        assert.strictEqual(lState, 'W');
        assert.ok(
            lConsoleStub.calledWithMatch('Invalid input'),
            'Expected invalid input message'
        );
    });

});
