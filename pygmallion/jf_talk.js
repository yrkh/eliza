// jf_talk.js
// Finite State Machine (FSM) configuration used by jf_pygmallion.js.
// Each object defines a state (m_stateId) and a map of allowed transitions (m_transitions).
// A transition key (e.g., 'ww2') is the input token expected by the engine.
// Each transition specifies:
//   - m_resultId: identifier of the logical result of the transition
//   - m_action:   action label to execute (currently just logged)
//   - m_next:     the next state's ID after this transition
module.exports = [
    {
        // WAIT state
        m_stateId: 'W',
        m_transitions: {
            // remain waiting
            ww1: { m_resultId: 'W.R.1', m_action: 'waiting for trigger', m_next: 'W' },
            // trigger detected -> go to A
            ww2: { m_resultId: 'W.R.2', m_action: 'Trigger incoming', m_next: 'A' }
        }
    },
    {
        m_stateId: 'A',
        m_transitions: {
            aa1: { m_resultId: 'A.R.1', m_action: 'aa1', m_next: 'E' },
            aa2: { m_resultId: 'A.R.2', m_action: 'aa2', m_next: 'B' },
            aa3: { m_resultId: 'A.R.3', m_action: 'aa3', m_next: 'B' }
        }
    },
    {
        m_stateId: 'B',
        m_transitions: {
            bb1: { m_resultId: 'B.R.1', m_action: 'bb1', m_next: 'C' },
            bb2: { m_resultId: 'B.R.2', m_action: 'bb2', m_next: 'D' }
        }
    },
    {
        m_stateId: 'C',
        m_transitions: {
            cc1: { m_resultId: 'C.R.1', m_action: 'cc1', m_next: 'F' },
            cc2: { m_resultId: 'C.R.2', m_action: 'cc2', m_next: 'D' }
        }
    },
    {
        m_stateId: 'D',
        m_transitions: {
            dd1: { m_resultId: 'D.R.1', m_action: 'dd1', m_next: 'W' },
            dd2: { m_resultId: 'D.R.2', m_action: 'dd2', m_next: 'A' },
            dd3: { m_resultId: 'D.R.3', m_action: 'dd3', m_next: 'B' },
            dd4: { m_resultId: 'D.R.4', m_action: 'dd4', m_next: 'C' }
        }
    },
    {
        m_stateId: 'E',
        m_transitions: {
            ee1: { m_resultId: 'E.R.1', m_action: 'ee1', m_next: 'B' },
            ee2: { m_resultId: 'E.R.2', m_action: 'ee2', m_next: 'W' }
        }
    },
    {
        m_stateId: 'F',
        m_transitions: {
            ff1: { m_resultId: 'F.R.1', m_action: 'ff1', m_next: 'C' },
            ff2: { m_resultId: 'F.R.2', m_action: 'ff2', m_next: 'D' },
            ff3: { m_resultId: 'F.R.3', m_action: 'ff3', m_next: 'A' }
        }
    }
];

