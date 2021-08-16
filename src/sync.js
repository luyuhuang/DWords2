const { createClient } = require('webdav');
const { getUserDB } = require('./database');
const { wait, compareVersions, parseCSV, getSys, toCSV, setSys } = require('./utils');
const migrateCloud = require('./migrateCloud');

const lockPath = key => `/.lock-${key}`;
const planPath = id => `/plans/${id}`;

async function lock(dav, key, timeout=Infinity) {
    const path = lockPath(key);
    const option = {overwrite: false};
    const now = Date.now();
    while (timeout > 0 && !(await dav.putFileContents(path, '.', option))) {
        wait(1000);
        timeout -= Date.now() - now;
    }
    if (timeout <= 0) {
        throw Error(`Timeout when locking ${key}`);
    }
}

async function unlock(dav, key) {
    await dav.deleteFile(lockPath(key));
}

function withLock(dav, key, timeout, fn) {
    return lock(dav, key, timeout)
        .then(fn)
        .finally(() => unlock(dav, key));
}

async function migrate(dav) {
    let version = '0'
    try {
        version = await dav.getFileContents('/version', {format: 'text'});
    } catch (e) {
        if (e.status !== 404) {
            throw e;
        }
    }

    const versions = Object.keys(migrateCloud).sort(compareVersions);
    await withLock(dav, 'migrate', 10000, async () => {
        for (const v of versions) {
            if (compareVersions(v, version) > 0) {
                await migrateCloud[v](dav);
            }
        }
        await dav.putFileContents('/version', versions[versions.length - 1]);
    });
}

const dataFields = ['word', 'time', 'paraphrase', 'show_paraphrase', 'color', 'status', 'version'];
async function pullFullData(dav, plan, version) {
    const path = `${planPath(plan.id)}/data.csv`;
    const data = await dav.getFileContents(path, {format: 'text'});
    for (const row of parseCSV(dataFields, data)) {
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
    const index = [...increments.keys()].sort();
    let num = 0;
    const sequence = await planSequence(plan.id);
    for (const i of index) {
        const increment = increments.get(i);
        if (num + increment.num > sequence) {
            const data = await dav.getFileContents(increment.path, {format: 'text'});
            const records = [...parseCSV(dataFields, data)];
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
    let i = 0, n = 0;
    if (increments.size > 0) {
        n = Math.max(...increments.keys());
        const increment = increments.get(n);
        let records = increment.records;
        if (!records) {
            const data = await dav.getFileContents(increment.path, {format: 'text'});
            records = [...parseCSV(dataFields, data)];
        }

        while (i < words.length && records.length < INCREMENT_CAPACITY) {
            records.push(words[i++]);
        }

        await dav.putFileContents(increment.path, toCSV(dataFields, records), {overwrite: true});
    }

    while (i < words.length) {
        const records = [];
        while (i < words.length && records.length < INCREMENT_CAPACITY) {
            records.push(words[i++]);
        }
        const path = `${planPath(plan.id)}/increment.${INCREMENT_CAPACITY}.${++n}.csv`;
        await dav.putFileContents(path, toCSV(dataFields, records));
    }

    await getUserDB().run(`update sync set sequence = sequence + ? where plan_id = ?`, i, plan.id);
}

async function pushFullData(dav, plan, increments) {
    const path = `${planPath(plan.id)}/data.csv`;
    const words = await getUserDB().all(`select * from words where plan_id = ?`, plan.id);
    await dav.putFileContents(path, toCSV(dataFields, words), {overwrite: true});
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

async function syncPlan(dav, plan) {
    const path = planPath(plan.id);
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

        const version = await planVersion(plan.id);
        if (cloudVersion && cloudVersion !== version) {
            await pullFullData(dav, plan, cloudVersion);
        }
        await pullIncrements(dav, plan, increments);

        if (calc_increment_num(words, increments) <= INCREMENT_NUM) {
            await pushIncrements(dav, plan, increments, words);
        } else {
            await pushFullData(dav, plan, increments);
        }

        await setSys('syncVersion', Date.now());
    });
}

async function synchronize() {
    const dav = createClient('', {
        username: '',
        password: ''
    });

    // await migrate(dav);

    const plans = await getUserDB().all(`select * from plans`);
    await Promise.all(plans.map(plan => syncPlan(dav, plan)));

    console.log(`synchronize done`);
}

module.exports = {
    synchronize,
}
