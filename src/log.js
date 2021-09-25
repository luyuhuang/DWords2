
const { createWriteStream } = require('fs');
const { mkdir, readdir, unlink } = require('fs/promises');
const path = require('path');
const { LOG_DIR } = require('./common');

function zeroPad(n, l) {
    n = n.toString();
    for (l = l - n.length; l > 0; --l) {
        n = '0' + n;
    }
    return n;
}

async function clearOldLogs() {
    const now = Date.now();
    const files = await readdir(LOG_DIR);
    await Promise.all(files.filter(f => {
        const t = new Date(f.split('.')[0]).getTime();
        return now - t > 7 * 86400 * 1000;
    }).map(f => unlink(path.join(LOG_DIR, f))));
}

let logPath;
async function initLog() {
    await mkdir(LOG_DIR, {recursive: true});
    await clearOldLogs();

    const date = new Date();
    const year = date.getFullYear(), month = zeroPad(date.getMonth() + 1, 2), day = zeroPad(date.getDate(), 2);
    logPath = path.join(LOG_DIR, `${year}-${month}-${day}.log`);

    const log = createWriteStream(logPath, {flags: 'a'});
    const write = o => (f => (...args) => (log.write(...args), f(...args)))(o.write.bind(o));
    process.stdout.write = write(process.stdout);
    process.stderr.write = write(process.stderr);
}
exports.initLog = initLog;

const log = (tag) => function(msg, ...args) {
    const date = new Date().toLocaleString();
    console.log(`${date} [${tag}] ${msg}`, ...args);
};

exports.debug = log('DEBUG');
exports.info = log('INFO');
exports.warn = log('WARN');
exports.error = log('ERROR');

exports.currentLogPath = () => logPath;
