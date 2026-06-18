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
  const res = await pool.query("SELECT * FROM sales_performance_metrics"); 
  console.log('Metrics before:', res.rows); 
  
  const e = await pool.query("SELECT id FROM employees LIMIT 1"); 
  const empId = e.rows[0].id; 
  
  const c = await pool.query("INSERT INTO clients (client_name) VALUES ('Test Client ' || gen_random_uuid()) RETURNING id"); 
  const cId = c.rows[0].id; 
  
  const con = await pool.query("INSERT INTO client_contacts (client_id, contact_name, email, phone_no) VALUES ($1, 'Test Contact', 'test@test.com' || gen_random_uuid(), '1234') RETURNING id", [cId]); 
  const conId = con.rows[0].id; 
  
  const a = await pool.query("INSERT INTO industry_areas (area_name) VALUES ('Test Area ' || gen_random_uuid()) RETURNING id"); 
  const aId = a.rows[0].id; 
  
  const l = await pool.query("INSERT INTO leads (client_id, contact_id, area_id, topic, estimated_value, created_by) VALUES ($1, $2, $3, 'Test Lead', 50000, $4) RETURNING id", [cId, conId, aId, empId]); 
  const lId = l.rows[0].id; 
  
  await pool.query("INSERT INTO lead_assignments (lead_id, employee_id, assignment_role) VALUES ($1, $2, 'Sales Lead')", [lId, empId]); 
  await pool.query("INSERT INTO proposals (lead_id, status, created_by) VALUES ($1, 'Won', $2)", [lId, empId]); 
  
  const res2 = await pool.query("SELECT * FROM sales_performance_metrics"); 
  console.log('Metrics after:', res2.rows); 
  process.exit(0); 
} 
run().catch(console.error);
