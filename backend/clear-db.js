require('dotenv').config();
const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');

const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || 'crm_db',
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT || 5432
});

async function clearDB() {
  try {
    console.log('Reading schema.sql...');
    const schemaSql = fs.readFileSync(path.join(__dirname, 'src', 'db', 'schema.sql'), 'utf8');
    
    console.log('Executing schema.sql...');
    await pool.query(schemaSql);
    
    console.log('Updating views from update-views.js...');
    // We already have update-views.js, but we can just run it using child_process or copy its SQL
    const updateViewsSql = `
DROP VIEW IF EXISTS pm_performance_metrics;

CREATE VIEW pm_performance_metrics AS
WITH pm_project_data AS (
    SELECT DISTINCT
        pa.employee_id,
        pa.project_id,
        pj.status AS project_status,
        l.estimated_value
    FROM project_assignments pa
    JOIN projects pj ON pa.project_id = pj.id
    JOIN proposals pr ON pj.proposal_id = pr.id
    JOIN leads l ON pr.lead_id = l.id
    WHERE pa.assignment_role = 'Project Manager'
),
pm_project_summary AS (
    SELECT
        employee_id,
        COUNT(DISTINCT project_id) AS total_projects_managed,
        COUNT(DISTINCT CASE WHEN project_status = 'Completed' THEN project_id END) AS completed_projects,
        COUNT(DISTINCT CASE WHEN project_status = 'On Hold' THEN project_id END) AS stalled_projects,
        COUNT(DISTINCT CASE WHEN project_status IN ('Kickoff', 'In Progress') THEN project_id END) AS active_projects,
        COALESCE(SUM(estimated_value), 0) AS total_revenue_managed
    FROM pm_project_data
    GROUP BY employee_id
),
pm_invoice_data AS (
    SELECT DISTINCT
        pa.employee_id,
        inv.id AS invoice_id,
        inv.status AS invoice_status
    FROM project_assignments pa
    JOIN invoice_schedules inv ON pa.project_id = inv.project_id
    WHERE pa.assignment_role = 'Project Manager'
),
pm_invoice_summary AS (
    SELECT
        employee_id,
        COUNT(DISTINCT invoice_id) AS total_invoices,
        COUNT(DISTINCT CASE WHEN invoice_status = 'Paid' THEN invoice_id END) AS paid_invoices
    FROM pm_invoice_data
    GROUP BY employee_id
)
SELECT
    e.id AS employee_id,
    e.full_name AS employee_name,
    COALESCE(ps.total_projects_managed, 0) AS total_projects_managed,
    COALESCE(ps.completed_projects, 0) AS completed_projects,
    COALESCE(ps.stalled_projects, 0) AS stalled_projects,
    COALESCE(ps.active_projects, 0) AS active_projects,
    COALESCE(ps.total_revenue_managed, 0) AS total_revenue_managed,
    CASE
        WHEN COALESCE(isum.total_invoices, 0) = 0 THEN 0
        ELSE ROUND((COALESCE(isum.paid_invoices, 0)::NUMERIC / isum.total_invoices) * 100, 2)
    END AS invoice_collection_rate
FROM employees e
INNER JOIN employee_roles er ON e.id = er.employee_id
LEFT JOIN pm_project_summary ps ON e.id = ps.employee_id
LEFT JOIN pm_invoice_summary isum ON e.id = isum.employee_id
WHERE er.role = 'Project Manager';
    `;
    await pool.query(updateViewsSql);
    
    console.log('Inserting default Admin account...');
    const hash = await bcrypt.hash('Nexus123!', 10);
    const adminRes = await pool.query(
      `INSERT INTO employees (full_name, email, password_hash) VALUES ('System Admin', 'admin@nexus.com', $1) RETURNING id`,
      [hash]
    );
    const adminId = adminRes.rows[0].id;
    await pool.query(
      `INSERT INTO employee_roles (employee_id, role) VALUES ($1, 'Admin')`,
      [adminId]
    );
    
    console.log('Database cleared and initialized successfully.');
    process.exit(0);
  } catch (err) {
    console.error('Error clearing database:', err);
    process.exit(1);
  }
}

clearDB();
