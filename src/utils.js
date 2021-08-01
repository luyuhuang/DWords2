const { BrowserWindow } = require("electron");
const { DEFAULT_SETTINGS } = require("./common");
const { getUserDB } = require("./database");

function getWinByWebContentsID(id) {
    return BrowserWindow.getAllWindows().find(win => win.webContents.id === id)
}

function getMainWin() {
    return BrowserWindow.getAllWindows().find(win => win.getTitle() === 'DWords');
}

function getDanmakuWins() {
    return BrowserWindow.getAllWindows().filter(win => win.getTitle().startsWith('Danmaku'));
}

async function getSetting(key) {
    const res = await getUserDB().get(`select * from settings where key = ?`, key);
    if (res) {
        return JSON.parse(res.value);
    } else {
        return DEFAULT_SETTINGS[key];
    }
}

module.exports = {
    getWinByWebContentsID, getMainWin, getSetting, getDanmakuWins,
}
