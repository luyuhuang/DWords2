const { open } = require("sqlite");
const { Database } = require("sqlite3");

let userDB, dictDB;

async function initDB() {
    userDB = await open({filename: 'dwords.db', driver: Database});
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
