
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

function dateStr() {
    const date = new Date();
    const year = date.getFullYear(), month = zeroPad(date.getMonth() + 1, 2), day = zeroPad(date.getDate(), 2);
    const hour = date.getHours(), minute = zeroPad(date.getMinutes(), 2), second = zeroPad(date.getSeconds(), 2);
    const offset = date.getTimezoneOffset();
    const timezone = zeroPad(((o) => Math.floor(o / 60) * 100 + offset % 60)(Math.abs(offset)), 4);
    const tzsig = offset < 0 ? '+' : '-';

    return `${year}-${month}-${day}T${hour}:${minute}:${second}${tzsig}${timezone}`;
}

async function clearOldLogs() {
    const now = Date.now();
    const files = await readdir(LOG_DIR);
    await Promise.all(files.filter(f => {
        const t = new Date(f.split('.')[0]).getTime();
        return now - t > 7 * 86400 * 1000;
    }).map(f => unlink(path.join(LOG_DIR, f))));
}

async function initLog() {
    await mkdir(LOG_DIR, {recursive: true});
    await clearOldLogs();

    const log = createWriteStream(path.join(LOG_DIR, `${dateStr()}.${process.pid}.log`), {flags: 'a'});
    const write = o => (f => (...args) => (log.write(...args), f(...args)))(o.write.bind(o));
    process.stdout.write = write(process.stdout);
    process.stderr.write = write(process.stderr);
}
exports.initLog = initLog;

const log = (tag) => function(msg, ...args) {
    console.log(`${dateStr()} [${tag}] ${msg}`, ...args);
};

exports.debug = log('DEBUG');
exports.info = log('INFO');
exports.warn = log('WARN');
exports.error = log('ERROR');

async function currentLog() {
    const suffix = `.${process.pid}.log`;
    const files = await readdir(LOG_DIR);
    const time = files.filter(f => f.endsWith(suffix))
        .map(f => f.slice(0, -suffix.length))
        .reduce((a, b) => Date.parse(a) > Date.parse(b) ? a : b, 0);

    if (!time) return;

    return path.join(LOG_DIR, time + suffix);
}
exports.currentLog = currentLog;
