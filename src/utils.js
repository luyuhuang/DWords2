const { BrowserWindow } = require("electron");

function getWinByWebContentsID(id) {
    return BrowserWindow.getAllWindows().find(win => win.webContents.id === id)
}

function getMainWin() {
    return BrowserWindow.getAllWindows().find(win => win.getTitle() === 'DWords');
}

function getDanmakuWins() {
    return BrowserWindow.getAllWindows().filter(win => win.getTitle().startsWith('Danmaku'));
}

module.exports = {
    getWinByWebContentsID, getMainWin, getDanmakuWins,
}
