const { open } = require('sqlite');
const { Database } = require('sqlite3');
const path = require('path');
const { DATA_DIR } = require('./common');
const { mkdir } = require('fs/promises');

let userDB, dictDB;

async function initDB() {
    await mkdir(DATA_DIR, {recursive: true});
    userDB = await open({filename: path.join(DATA_DIR, 'user.db'), driver: Database});
    await userDB.migrate({
        table: 'migrations',
        migrationsPath: path.join(__dirname, '../migrations'),
    });

    dictDB = await open({
        filename: path.join(__dirname, '../assets/data/dict.db'),
        driver: Database
    });
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
