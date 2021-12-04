const { BrowserWindow } = require('electron');
const { getUserDB, getDictDB } = require('./database');
const { v1 } = require('uuid');
const { getSetting } = require('./settings');
const { DICTIONARIES } = require('./common');

function wait(t) {
    return new Promise(resolve => setTimeout(resolve, t));
}

function getWinByWebContentsID(id) {
    return BrowserWindow.getAllWindows().find(win => win.webContents.id === id);
}

function findWinByTitle(title) {
    return BrowserWindow.getAllWindows().find(win => win.getTitle() === title);
}

function getMainWin() {
    return findWinByTitle('DWords');
}

function getDanmakuWins() {
    return BrowserWindow.getAllWindows().filter(win => win.getTitle().startsWith('Danmaku'));
}

function toCSV(fields, list) {
    return list.map(entry => fields.map(field => {
        let value = field.stringify(entry[field.name]);
        if (value.search(/[,"\r\n]/) >= 0) {
            value = value.replace(/"/g, '""');
            value = '"' + value + '"';
        }
        return value;
    }).join(',')).join('\n');
}

function isNewLine(csv, i) {
    return csv[i] === '\n' || csv.substr(i, 2) === '\r\n';
}

function parseCSVField(csv, i) {
    if (csv[i] === '"') {
        ++i;
        let j = i, ans = '';
        do {
            while (i < csv.length && csv[i] !== '"') {
                ++i;
            }
            ans += csv.substr(j, i - j);
            while (i + 1 < csv.length && csv[i] === '"' && csv[i + 1] === '"') {
                ans += '"';
                j = (i += 2);
            }
        } while (i < csv.length && csv[i] !== '"');

        if (i >= csv.length || csv[i] !== '"') {
            throw new Error(`invalid CSV: unclosed quote at ${i}`);
        }
        ++i;
        if (i < csv.length && csv[i] !== ',' && !isNewLine(csv, i)) {
            throw Error(`invalid CSV: except ',' at ${i}`);
        }
        return [ans, i];
    } else {
        const j = i;
        while (i < csv.length && csv[i] !== ',' && !isNewLine(csv, i)) {
            ++i;
        }
        return [csv.substr(j, i - j), i];
    }
}

function* parseCSV(fields, csv) {
    const set = (o, f, v) => f ? o[f.name] = f.parse(v) : f;

    for (let i = 0; i < csv.length; ++i) {
        const obj = {};
        let index = 0;
        while (i < csv.length && !isNewLine(csv, i)) {
            const [value, j] = parseCSVField(csv, i);
            set(obj, fields[index++], value);
            i = j;
            if (i < csv.length && csv[i] === ',') {
                ++i;
                if (i >= csv.length || isNewLine(csv, i)) {
                    set(obj, fields[index++], '');
                }
            }
        }
        yield obj;
    }
}

function compareVersions(v1, v2) {
    const a1 = v1.split('.');
    const a2 = v2.split('.');
    const N = Math.max(a1.length, a2.length);
    for (let i = 0; i < N; ++i) {
        const d = Number(a1[i] || 0) - Number(a2[i] || 0);
        if (d !== 0) {
            return d;
        }
    }
    return 0;
}

async function getSys(key) {
    const res = await getUserDB().get(`select value from sys where key = ?`, key);
    return res && JSON.parse(res.value);
}

async function setSys(key, value) {
    if (value !== undefined) {
        await getUserDB().run(`insert or replace into sys values (?, ?)`, key, JSON.stringify(value));
    } else {
        await getUserDB().run(`delete from sys where key = ?`, key);
    }
}

function genUUID() {
    const srcAlphabet = '0123456789abcdef';
    const dstAlphabet = `0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ.-_`;
    const fromBase = srcAlphabet.length;
    const toBase = dstAlphabet.length;

    const number = v1().replace(/-/g, '');
    let length = number.length;
    const numberMap = {};
    for (let i = 0; i < length; i++) {
        numberMap[i] = srcAlphabet.indexOf(number[i]);
    }

    let divide, newlen, result = '';
    do {
        divide = 0, newlen = 0;
        for (let i = 0; i < length; i++) {
            divide = divide * fromBase + numberMap[i];
            if (divide >= toBase) {
                numberMap[newlen++] = parseInt(divide / toBase, 10);
                divide = divide % toBase;
            } else if (newlen > 0) {
                numberMap[newlen++] = 0;
            }
        }
        length = newlen;
        result = dstAlphabet.slice(divide, divide + 1).concat(result);
    } while (newlen !== 0);

    return result;
}

async function consultDictionary(word) {
    const id = await getSetting('dictionary');
    const dict = DICTIONARIES[id];
    const res = await getDictDB().get(`select *, ${dict.field} as paraphrase from ${dict.table} where word = ?`, word);
    return res;
}

module.exports = {
    getWinByWebContentsID, getMainWin, getDanmakuWins, toCSV, parseCSV, wait,
    compareVersions, getSys, setSys, genUUID, consultDictionary, findWinByTitle,
};
