const { open } = require("sqlite");
const { Database } = require("sqlite3");

let userDB;

async function initDB() {
    userDB = await open({filename: "dwords.db", driver: Database});
    await userDB.migrate({
        table: 'migrations',
        migrationsPath: './migrations',
    });
}

function getUserDB() {
    return userDB;
}

module.exports = {
    initDB, getUserDB,
};
