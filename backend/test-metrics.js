require('dotenv').config();
const { Pool } = require('pg');
const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || 'crm_db',
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT || 5432
});

async function run() {
  const q1 = await pool.query("SELECT * FROM sales_performance_metrics");
  console.log("Sales:", q1.rows);
  const q2 = await pool.query("SELECT * FROM pm_performance_metrics");
  console.log("PM:", q2.rows);
  process.exit(0);
}
run().catch(e => console.error(e));
