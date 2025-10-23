
// session_store.js

const fs = require('fs');
const gFilePath = './user_sessions.json';

function x_saveSessions(
    pSessions
) {
    fs.writeFileSync(
        gFilePath,
        JSON.stringify(pSessions, null, 4)
    );
}

function x_loadSessions() {
    if (!fs.existsSync(gFilePath)) {
        return {};
    }

    let lData = fs.readFileSync(gFilePath);
    return JSON.parse(lData);
}

module.exports = {
    x_saveSessions,
    x_loadSessions
};
