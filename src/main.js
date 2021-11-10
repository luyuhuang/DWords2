const { app } = require('electron');
const { initDB } = require('./database');
const { initDWords } = require('./dwords');
const { initLog } = require('./log');

if (!app.requestSingleInstanceLock()) app.quit();

initLog().then(initDB).then(app.whenReady).then(() => {
    exports.dwords = initDWords();
});
