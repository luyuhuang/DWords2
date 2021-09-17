const { app } = require('electron');
const { initDB } = require('./database');
const { initDWords } = require('./dwords');

initDB().then(app.whenReady).then(() => {
    exports.dwords = initDWords();
});
