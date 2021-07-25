const { BrowserWindow } = require("electron")

function getWinByWebContentsID(id) {
    return BrowserWindow.getAllWindows().find(win => win.webContents.id === id)
}

function getMainWin() {
    return BrowserWindow.getAllWindows().find(win => win.getTitle() === 'DWords');
}

module.exports = {
    getWinByWebContentsID, getMainWin,
}
