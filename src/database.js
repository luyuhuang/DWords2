const { open } = require('sqlite');
const { Database } = require('sqlite3');
const path = require('path');
const { DATA_DIR } = require('./common');
const { mkdir } = require('fs/promises');

let userDB, dictDB;

async function initDB() {
    await mkdir(DATA_DIR, {recursive: true});
    userDB = await open({filename: path.join(DATA_DIR, 'dwords.db'), driver: Database});
    await userDB.migrate({
        table: 'migrations',
        migrationsPath: './migrations',
    });

    dictDB = await open({filename: 'assets/data/dict.db', driver: Database});
}

function getUserDB() {
    return userDB;
}

function getDictDB() {
    return dictDB;
}

module.exports = {
    initDB, getUserDB, getDictDB,
};
