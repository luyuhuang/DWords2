const { app } = require('electron');
const { initDB } = require('./database');
const { initDWords } = require('./dwords');
const { createWriteStream } = require('fs');
const { mkdir, readdir, unlink } = require('fs/promises');
const path = require('path');
const { LOG_DIR } = require('./common');

async function clearOldLogs() {
    const now = Date.now();
    const files = await readdir(LOG_DIR);
    await Promise.all(files.filter(f => {
        const [t] = f.split('-');
        return now - t > 7 * 86400 * 1000;
    }).map(f => unlink(path.join(LOG_DIR, f))));
}

async function initLog() {
    await mkdir(LOG_DIR, {recursive: true});
    await clearOldLogs();
    const log = createWriteStream(path.join(LOG_DIR, `${Date.now()}-${process.pid}.log`), {flags: 'a'});
    const write = o => (f => (...args) => (log.write(...args), f(...args)))(o.write.bind(o));
    process.stdout.write = write(process.stdout);
    process.stderr.write = write(process.stderr);
}

initLog().then(initDB).then(app.whenReady).then(() => {
    exports.dwords = initDWords();
});
