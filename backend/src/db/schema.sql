-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Drop existing types/tables for clean re-run
DROP VIEW IF EXISTS sales_performance_metrics CASCADE;
DROP VIEW IF EXISTS pm_performance_metrics CASCADE;
DROP TABLE IF EXISTS project_status_history CASCADE;
DROP TABLE IF EXISTS proposal_status_history CASCADE;
DROP TABLE IF EXISTS lead_status_history CASCADE;
DROP TABLE IF EXISTS invoice_schedules CASCADE;
DROP TABLE IF EXISTS project_assignments CASCADE;
DROP TABLE IF EXISTS projects CASCADE;
DROP TABLE IF EXISTS proposals CASCADE;
DROP TABLE IF EXISTS lead_assignments CASCADE;
DROP TABLE IF EXISTS leads CASCADE;
DROP TABLE IF EXISTS industry_areas CASCADE;
DROP TABLE IF EXISTS client_contacts CASCADE;
DROP TABLE IF EXISTS clients CASCADE;
DROP TABLE IF EXISTS employee_roles CASCADE;
DROP TABLE IF EXISTS employees CASCADE;
DROP TYPE IF EXISTS emp_role CASCADE;
DROP TYPE IF EXISTS lead_state CASCADE;
DROP TYPE IF EXISTS prop_state CASCADE;
DROP TYPE IF EXISTS proj_state CASCADE;
DROP TYPE IF EXISTS inv_state CASCADE;

-- 1. ENUM DEFINITIONS (Strict Database-Level Typing)
CREATE TYPE emp_role AS ENUM ('Admin', 'Sales Lead', 'Project Manager', 'Tech Lead', 'Account Manager', 'Finance');
CREATE TYPE lead_state AS ENUM ('Active', 'Cancelled', 'Accepted');
CREATE TYPE prop_state AS ENUM ('In Proposal', 'Submitted', 'Cancelled', 'Won', 'Lost');
CREATE TYPE proj_state AS ENUM ('Kickoff', 'In Progress', 'Completed', 'On Hold');
CREATE TYPE inv_state AS ENUM ('Pending', 'Invoiced', 'Paid');

-- 2. EMPLOYEES
CREATE TABLE employees (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    full_name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255),
    is_active BOOLEAN DEFAULT TRUE
);

CREATE TABLE employee_roles (
    employee_id UUID REFERENCES employees(id) ON DELETE CASCADE,
    role emp_role NOT NULL,
    PRIMARY KEY (employee_id, role)
);

-- 3. CLIENTS & CONTACTS
CREATE TABLE clients (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    client_name VARCHAR(255) NOT NULL UNIQUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_by UUID REFERENCES employees(id)
);

CREATE TABLE client_contacts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    client_id UUID NOT NULL REFERENCES clients(id) ON DELETE RESTRICT,
    contact_name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    phone_no VARCHAR(50) NOT NULL
);

-- 4. INDUSTRY AREAS
CREATE TABLE industry_areas (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    area_name VARCHAR(100) NOT NULL UNIQUE
);

-- 5. LEADS
CREATE TABLE leads (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    client_id UUID NOT NULL REFERENCES clients(id) ON DELETE RESTRICT,
    contact_id UUID NOT NULL REFERENCES client_contacts(id) ON DELETE RESTRICT,
    area_id UUID NOT NULL REFERENCES industry_areas(id) ON DELETE RESTRICT,
    topic VARCHAR(255) NOT NULL,
    estimated_value DECIMAL(15, 2) NOT NULL CHECK (estimated_value >= 0),
    status lead_state NOT NULL DEFAULT 'Active',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_by UUID NOT NULL REFERENCES employees(id),
    updated_by UUID REFERENCES employees(id)
);

-- 6. LEAD ASSIGNMENTS
CREATE TABLE lead_assignments (
    lead_id UUID NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
    employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
    assignment_role emp_role NOT NULL,
    assigned_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (lead_id, employee_id, assignment_role)
);

-- 7. PROPOSALS
CREATE TABLE proposals (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    lead_id UUID NOT NULL UNIQUE REFERENCES leads(id) ON DELETE RESTRICT,
    status prop_state NOT NULL DEFAULT 'In Proposal',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_by UUID NOT NULL REFERENCES employees(id),
    updated_by UUID REFERENCES employees(id)
);

-- 8. PROJECTS
CREATE TABLE projects (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    proposal_id UUID NOT NULL UNIQUE REFERENCES proposals(id) ON DELETE RESTRICT,
    status proj_state NOT NULL DEFAULT 'Kickoff',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_by UUID NOT NULL REFERENCES employees(id),
    updated_by UUID REFERENCES employees(id)
);

CREATE TABLE project_assignments (
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
    assignment_role emp_role NOT NULL,
    assigned_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (project_id, employee_id, assignment_role)
);

-- 9. INVOICE SCHEDULES
CREATE TABLE invoice_schedules (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    milestone_name VARCHAR(100) NOT NULL,
    milestone_order INT NOT NULL,
    amount DECIMAL(15, 2) NOT NULL CHECK (amount > 0),
    status inv_state NOT NULL DEFAULT 'Pending',
    UNIQUE (project_id, milestone_order)
);

-- 10. STATUS HISTORY TABLES (Audit Trail)
CREATE TABLE lead_status_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    lead_id UUID NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
    previous_status lead_state,
    new_status lead_state NOT NULL,
    changed_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    changed_by UUID NOT NULL REFERENCES employees(id)
);

CREATE TABLE proposal_status_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    proposal_id UUID NOT NULL REFERENCES proposals(id) ON DELETE CASCADE,
    previous_status prop_state,
    new_status prop_state NOT NULL,
    changed_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    changed_by UUID NOT NULL REFERENCES employees(id)
);

CREATE TABLE project_status_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    previous_status proj_state,
    new_status proj_state NOT NULL,
    changed_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    changed_by UUID NOT NULL REFERENCES employees(id)
);

-- ═══════════════════════════════════════════════════════
-- ANALYTICS VIEWS
-- ═══════════════════════════════════════════════════════

-- Sales Performance: For employees assigned to leads with role 'Sales Lead'
-- Pre-aggregate to one row per employee/lead so revenue is counted once per lead.
CREATE OR REPLACE VIEW sales_performance_metrics AS
WITH sales_lead_data AS (
    SELECT DISTINCT
        la.employee_id,
        la.lead_id,
        l.estimated_value,
        pr.status AS proposal_status
    FROM lead_assignments la
    JOIN leads l ON la.lead_id = l.id
    LEFT JOIN proposals pr ON l.id = pr.lead_id
    WHERE la.assignment_role = 'Sales Lead'
),
sales_summary AS (
    SELECT
        employee_id,
        COUNT(DISTINCT lead_id) AS total_leads_assigned,
        COUNT(DISTINCT CASE WHEN proposal_status = 'Won' THEN lead_id END) AS deals_won,
        COALESCE(SUM(CASE WHEN proposal_status = 'Won' THEN estimated_value ELSE 0 END), 0) AS total_revenue_secured
    FROM sales_lead_data
    GROUP BY employee_id
)
SELECT
    e.id AS employee_id,
    e.full_name AS employee_name,
    COALESCE(ss.total_leads_assigned, 0) AS total_leads_assigned,
    COALESCE(ss.deals_won, 0) AS deals_won,
    CASE
        WHEN COALESCE(ss.total_leads_assigned, 0) = 0 THEN 0
        ELSE ROUND((COALESCE(ss.deals_won, 0)::NUMERIC / ss.total_leads_assigned) * 100, 2)
    END AS win_rate_percentage,
    COALESCE(ss.total_revenue_secured, 0) AS total_revenue_secured
FROM employees e
INNER JOIN employee_roles er ON e.id = er.employee_id
LEFT JOIN sales_summary ss ON e.id = ss.employee_id
WHERE er.role = 'Sales Lead';

-- PM Performance: For employees assigned to projects with role 'Project Manager'
-- Aggregate projects and invoices separately to avoid cross-product inflation.
CREATE OR REPLACE VIEW pm_performance_metrics AS
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
        COALESCE(SUM(CASE WHEN project_status = 'Completed' THEN estimated_value ELSE 0 END), 0) AS total_revenue_managed
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

