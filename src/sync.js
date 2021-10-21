const { createClient } = require('webdav');
const { getUserDB } = require('./database');
const { wait, compareVersions, parseCSV, getSys, toCSV, setSys, getMainWin } = require('./utils');
const migrateCloud = require('./migrateCloud');
const { getSettings, getSetting } = require('./settings');
const { app } = require('electron');
const log = require('./log');

const lockPath = key => `/.lock-${key}`;
const wordsPath = id => `/words/${id}`;

const nullable = f => v => v === null || v === undefined ? '' : f(v);
const emptiable = f => v => v === '' ? null : f(v);
const int2str = i => i.toString();

const wordFields = [
    { name: 'word', stringify: w => w, parse: w => w },
    { name: 'time', stringify: int2str, parse: parseInt },
    { name: 'paraphrase', stringify: p => p, parse : p => p },
    { name: 'show_paraphrase', stringify: nullable(v => v ? '1' : '0'), parse: emptiable(s => s === '1') },
    { name: 'color', stringify: nullable(c => c), parse: emptiable(c => c) },
    { name: 'status', stringify: int2str, parse: parseInt },
    { name: 'version', stringify: int2str, parse: parseInt },
    { name: 'deleted', stringify: d => d ? '1' : '0', parse: s => s === '1' },
];

const planFields = [
    { name: 'id', stringify: i => i, parse: i => i },
    { name: 'name', stringify: i => i, parse: i => i },
    { name: 'version', stringify: int2str, parse: parseInt },
    { name: 'deleted', stringify: d => d ? '1' : '0', parse: s => s === '1' },
];

function initSync(dwords) {
    dwords.syncing = false;
    dwords.syncErr = undefined;
    dwords.syncTime = 0;
    dwords.migrated = false;

    autoSync(dwords);
}

async function autoSync(dwords) {
    const {syncURL, username, password} = await getSettings('syncURL', 'username', 'password');
    if (!syncURL || !username || !password) return;
    await synchronize(dwords);

    const interval = await getSetting('syncInterval') * 1000;
    setTimeout(() => autoSync(dwords), interval);
}

function setSyncStatus(dwords, syncing, err = undefined) {
    dwords.syncing = syncing;
    dwords.syncErr = err;
    if (!err) dwords.syncTime = Date.now();
    const win = getMainWin();
    if (win) {
        win.webContents.send('syncStatus', syncing, err, dwords.syncTime);
    }
}

function tryForceUnlock(dav, path) {
    log.info('try force unlocking %s', path);
    return withLock(dav, path.substr(2), 10000, async () => {
        const now = Date.now();
        const time = Number(await dav.getFileContents(path, {format: 'text'}));
        if (now - time > 10 * 60 * 1000) {
            await dav.putFileContents(path, now.toString(), {overwrite: true});
            log.info('force unlock %s succeed', path);
            return true;
        } else {
            log.info('force unlock %s failed', path);
            return false;
        }
    });
}

async function lock(dav, key, timeout = Infinity) {
    const path = lockPath(key);
    const option = {overwrite: false};
    const now = Date.now();
    while (timeout > 0 && !(await dav.putFileContents(path, now.toString(), option))) {
        await wait(1000);
        timeout -= Date.now() - now;
    }
    if (timeout <= 0) {
        if (!await tryForceUnlock(dav, path)) {
            const e = Error(`Timeout when locking ${key}, try again latter.`);
            e.name = 'lock';
            throw e;
        }
    }
}

async function unlock(dav, key) {
    await dav.deleteFile(lockPath(key));
}

function withLock(dav, key, timeout, fn) {
    return lock(dav, key, timeout)
        .then(fn)
        .then(r => (unlock(dav, key), r))
        .catch(async e => {
            if (e.name !== 'lock') {
                await unlock(dav, key);
            }
            throw e;
        });
}

async function migrate(dav) {
    log.info('migrate cloud...');
    let version = '0';
    try {
        version = await dav.getFileContents('/version', {format: 'text'});
    } catch (e) {
        if (e.status !== 404) {
            throw e;
        }
    }

    const appVersion = app.getVersion();
    if (compareVersions(appVersion, version) < 0) {
        throw Error(`Current version (${appVersion}) is older the cloud version (${version}), please update DWords.`);
    }

    const versions = Object.keys(migrateCloud).sort(compareVersions);
    if (compareVersions(version, versions[versions.length - 1]) >= 0) {
        log.info('cloud up to date');
        return;
    }

    await withLock(dav, 'migrate', 10000, async () => {
        for (const v of versions) {
            if (compareVersions(v, version) > 0) {
                log.info('migrate cloud version: %s', v);
                await migrateCloud[v](dav);
            }
        }
        await dav.putFileContents('/version', versions[versions.length - 1]);
    });
}

async function pullFullData(dav, plan, version) {
    log.info('pull full data...');
    const path = `${wordsPath(plan.id)}/data.csv`;
    const data = await dav.getFileContents(path, {format: 'text'});
    for (const row of parseCSV(wordFields, data)) {
        await updateWord(row, plan.id);
    }
    await getUserDB().run(`update sync set version = ?, sequence = 0 where plan_id = ?`,
        version, plan.id);
}

async function updateWord(word, planID) {
    const w = await getUserDB().get(`select word from words
        where word = ? and plan_id = ?`, word.word, planID);

    if (w) {
        await getUserDB().run(`update words set
            time = ?, paraphrase = ?, show_paraphrase = ?, color = ?, status = ?, version = ?
            where word = ? and plan_id = ? and version < ?`,
            word.time, word.paraphrase, word.show_paraphrase, word.color, word.status, word.version,
            word.word, planID, word.version);
    } else {
        await getUserDB().run(`insert into words
            (word, plan_id, time, paraphrase, show_paraphrase, color, status, version)
            values (?, ?, ?, ?, ?, ?, ?, ?)`,
            word.word, planID, word.time, word.paraphrase, word.show_paraphrase, word.color, word.status, word.version);
    }
}

async function pullIncrements(dav, plan, increments) {
    log.info('pull increments...');
    const index = [...increments.keys()].sort();
    let num = 0;
    const sequence = await planSequence(plan.id);
    for (const i of index) {
        const increment = increments.get(i);
        if (num + increment.num > sequence) {
            log.info('pull increment %s', increment.path);
            const data = await dav.getFileContents(increment.path, {format: 'text'});
            const records = [...parseCSV(wordFields, data)];
            for (let i = 0; i < records.length; ++i) {
                if (num + i >= sequence) {
                    await updateWord(records[i], plan.id);
                }
            }
            num += records.length;
            increment.records = records;
        } else {
            num += increment.num;
        }
    }
    await getUserDB().run(`update sync set sequence = ? where plan_id = ?`,
        num, plan.id);
}

const INCREMENT_CAPACITY = 100;
const INCREMENT_NUM = 10;

function calc_increment_num(words, increments) {
    return Math.ceil(words.length / INCREMENT_CAPACITY) + increments.size;
}

async function pushIncrements(dav, plan, increments, words) {
    log.info('push increments...');
    let i = 0, n = 0;
    if (increments.size > 0) {
        n = Math.max(...increments.keys());
        const increment = increments.get(n);
        log.info('update increment %s', increment.path);

        let records = increment.records;
        if (!records) {
            const data = await dav.getFileContents(increment.path, {format: 'text'});
            records = [...parseCSV(wordFields, data)];
        }

        while (i < words.length && records.length < increment.num) {
            records.push(words[i++]);
        }

        await dav.putFileContents(increment.path, toCSV(wordFields, records), {overwrite: true});
    }

    while (i < words.length) {
        const records = [];
        while (i < words.length && records.length < INCREMENT_CAPACITY) {
            records.push(words[i++]);
        }
        const path = `${wordsPath(plan.id)}/increment.${INCREMENT_CAPACITY}.${++n}.csv`;
        log.info('new increment %s', path);
        await dav.putFileContents(path, toCSV(wordFields, records));
    }

    await getUserDB().run(`update sync set sequence = sequence + ? where plan_id = ?`, i, plan.id);
}

async function pushFullData(dav, plan, increments) {
    log.info('push full data');
    const path = `${wordsPath(plan.id)}/data.csv`;
    const words = await getUserDB().all(`select * from words where plan_id = ?`, plan.id);
    await dav.putFileContents(path, toCSV(wordFields, words), {overwrite: true});
    await Promise.all([...increments.values()].map(inc => dav.deleteFile(inc.path)));

    const stat = await dav.stat(path);
    await getUserDB().run(`update sync set version = ?, sequence = 0 where plan_id = ?`,
        stat.etag || stat.lastmod, plan.id);
}

async function planVersion(id) {
    const res = await getUserDB().get(`select version from sync where plan_id = ?`, id);
    if (!res) {
        await getUserDB().run(`insert into sync (plan_id, sequence) values (?, 0)`, id);
        return null;
    }
    return res.version;
}

async function planSequence(id) {
    const res = await getUserDB().get(`select sequence from sync where plan_id = ?`, id);
    if (!res) {
        await getUserDB().run(`insert into sync (plan_id, sequence) values (?, 0)`, id);
    }
    return res.sequence;
}

async function syncWords(dav, plan) {
    log.info('sync words, plan: %s', plan.id);
    const path = wordsPath(plan.id);
    const syncVersion = await getSys('syncVersion') || 0;
    const words = await getUserDB().all(`select * from words where plan_id = ? and version > ?`,
        plan.id, syncVersion);

    await withLock(dav, `sync-${plan.id}`, 10000, async () => {
        if (!(await dav.exists(path))) {
            await dav.createDirectory(path);
        }

        const files = await dav.getDirectoryContents(path);
        let cloudVersion = undefined;
        const increments = new Map;
        for (const file of files) {
            if (file.basename === 'data.csv') {
                cloudVersion = file.etag || file.lastmod;
            } else {
                const m = file.basename.match(/increment\.(\d+)\.(\d+)\.csv/);
                if (m) {
                    let [, num, i] = m;
                    num = Number(num), i = Number(i);
                    increments.set(i, {path: file.filename, i, num});
                }
            }
        }

        // pull
        const version = await planVersion(plan.id);
        if (cloudVersion && cloudVersion !== version) {
            await pullFullData(dav, plan, cloudVersion);
        }
        await pullIncrements(dav, plan, increments);

        // push
        if (words.length > 0) {
            if (calc_increment_num(words, increments) <= INCREMENT_NUM) {
                await pushIncrements(dav, plan, increments, words);
            } else {
                await pushFullData(dav, plan, increments);
            }
        }

    });
}

async function updatePlan(id, name, version, deleted) {
    const p = await getUserDB().get(`select id from plans where id = ?`, id);

    if (p) {
        await getUserDB().run(`update plans set name = ?, version = ?, deleted = ?
            where id = ? and version < ?`, name, version, deleted, id, version);
    } else {
        await getUserDB().run(`insert into plans (id, name, version, deleted)
            values (?, ?, ?, ?)`, id, name, version, deleted);
    }
}

async function syncPlans(dav) {
    log.info('sync plans...');

    await withLock(dav, 'sync-plans', 10000, async () => {
        let data;
        try {
            data = await dav.getFileContents('/plans.csv', {format: 'text'});
        } catch (e) {
            if (e.status !== 404) {
                throw e;
            }
        }

        // pull
        if (data) {
            let newID;
            for (const {id, name, version, deleted} of parseCSV(planFields, data)) {
                if (!newID && !deleted) {
                    newID = id;
                }
                await updatePlan(id, name, version, deleted);
            }
            if (!(await getSys('currentPlan'))) {
                await setSys('currentPlan', newID);
            }
        }

        // push
        const plans = await getUserDB().all(`select * from plans`);
        await dav.putFileContents('/plans.csv', toCSV(planFields, plans), {overwrite: true});
    });
}

async function synchronize(dwords) {
    if (dwords.syncing) return;
    setSyncStatus(dwords, true);

    let err;
    try {
        log.info('synchronizing...');

        const {syncURL, username, password} = await getSettings('syncURL', 'username', 'password');
        if (!syncURL || !username || !password) {
            throw Error(`syncURL, username and password must be set`);
        }

        const dav = createClient(syncURL, {username, password});

        if (!dwords.migrate) {
            await migrate(dav);
            dwords.migrate = true;
        }

        await syncPlans(dav);

        const plans = await getUserDB().all(`select * from plans where not deleted`);
        await Promise.all(plans.map(plan => syncWords(dav, plan)));

        await setSys('syncVersion', Date.now()); // TODO: deal with modifications during sync

        log.info(`synchronize done`);
    } catch (e) {
        err = e;
        log.error('sync err', e);
    }

    setSyncStatus(dwords, false, err);
    const win = getMainWin();
    if (win) {
        win.webContents.send('refreshList');
    }
    return err;
}

module.exports = {
    initSync, synchronize,
};
