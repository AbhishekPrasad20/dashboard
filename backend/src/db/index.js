// backend/src/db/index.js
const { Pool } = require('pg');

const pool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST || 'localhost',
    database: process.env.DB_NAME || 'crm_db',
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT || 5432,
});

module.exports = {
    query: (text, params) => pool.query(text, params),
    // Use getClient() for transactions — ensures BEGIN/COMMIT/ROLLBACK
    // all execute on the same connection. Always call client.release() in finally.
    getClient: () => pool.connect(),
};

