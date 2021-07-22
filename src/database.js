const { open } = require("sqlite");
const { Database } = require("sqlite3");

async function initDB() {
    const db = await open({filename: "dwords.db", driver: Database});
    await db.migrate({
        table: 'migrations',
        migrationsPath: './migrations',
    })
}

module.exports = {
    initDB,
};
