require('dotenv').config();
const { Pool } = require('pg');
const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || 'crm_db',
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT || 5432
});
pool.query("SELECT pg_get_viewdef('sales_performance_metrics', true)").then(r => {
  console.log(r.rows[0].pg_get_viewdef);
  process.exit(0);
}).catch(e => {
  console.error(e);
  process.exit(1);
});
