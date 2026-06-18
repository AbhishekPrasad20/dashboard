-- ═══════════════════════════════════════════════════════
-- SEED DATA — 6 Employees, 50+ relational rows
-- Updated to match current schema (employee_roles table, password hashes)
-- ═══════════════════════════════════════════════════════

-- ── Employees (with password hashes for bcrypt 'Nexus@Admin1') ──
INSERT INTO employees (id, full_name, email, password_hash) VALUES
('11111111-aaaa-aaaa-aaaa-111111111111', 'Priya Sharma',   'priya@nexuscrm.com',   '$2b$10$1iluyZm4XGJ9KVfpa2x8FerpyjLolmZVvq287JI5UptmF51dn3vIG'),
('22222222-bbbb-bbbb-bbbb-222222222222', 'Alice Monroe',   'alice@nexuscrm.com',   '$2b$10$1iluyZm4XGJ9KVfpa2x8FerpyjLolmZVvq287JI5UptmF51dn3vIG'),
('33333333-cccc-cccc-cccc-333333333333', 'Bob Karim',      'bob@nexuscrm.com',     '$2b$10$1iluyZm4XGJ9KVfpa2x8FerpyjLolmZVvq287JI5UptmF51dn3vIG'),
('44444444-dddd-dddd-dddd-444444444444', 'Charlie Reyes',  'charlie@nexuscrm.com', '$2b$10$1iluyZm4XGJ9KVfpa2x8FerpyjLolmZVvq287JI5UptmF51dn3vIG'),
('55555555-eeee-eeee-eeee-555555555555', 'Diana Chen',     'diana@nexuscrm.com',   '$2b$10$1iluyZm4XGJ9KVfpa2x8FerpyjLolmZVvq287JI5UptmF51dn3vIG'),
('66666666-ffff-ffff-ffff-666666666666', 'Evan Okafor',    'evan@nexuscrm.com',    '$2b$10$1iluyZm4XGJ9KVfpa2x8FerpyjLolmZVvq287JI5UptmF51dn3vIG');

-- ── Employee Roles (using the employee_roles join table) ──
INSERT INTO employee_roles (employee_id, role) VALUES
('11111111-aaaa-aaaa-aaaa-111111111111', 'Admin'),
('22222222-bbbb-bbbb-bbbb-222222222222', 'Sales Lead'),
('33333333-cccc-cccc-cccc-333333333333', 'Sales Lead'),
('44444444-dddd-dddd-dddd-444444444444', 'Sales Lead'),
('55555555-eeee-eeee-eeee-555555555555', 'Project Manager'),
('66666666-ffff-ffff-ffff-666666666666', 'Project Manager');

-- ── Industry Areas ─────────────────────────────────────
INSERT INTO industry_areas (id, area_name) VALUES
('aaaaaaaa-1111-1111-1111-aaaaaaaaaaaa', 'Enterprise Software'),
('bbbbbbbb-2222-2222-2222-bbbbbbbbbbbb', 'Healthcare IT'),
('cccccccc-3333-3333-3333-cccccccccccc', 'Fintech'),
('dddddddd-4444-4444-4444-dddddddddddd', 'E-Commerce'),
('eeeeeeee-5555-5555-5555-eeeeeeeeeeee', 'Cybersecurity');

-- ── Clients ────────────────────────────────────────────
INSERT INTO clients (id, client_name, created_by) VALUES
('11111111-1111-1111-1111-111111111111', 'Vertex Technologies',  '22222222-bbbb-bbbb-bbbb-222222222222'),
('22222222-2222-2222-2222-222222222222', 'MedSync Health',       '33333333-cccc-cccc-cccc-333333333333'),
('33333333-3333-3333-3333-333333333333', 'PayFlow Finance',      '44444444-dddd-dddd-dddd-444444444444'),
('44444444-4444-4444-4444-444444444444', 'ShopNova Retail',      '22222222-bbbb-bbbb-bbbb-222222222222'),
('55555555-5555-5555-5555-555555555555', 'CyberVault Inc.',      '33333333-cccc-cccc-cccc-333333333333');

-- ── Client Contacts ────────────────────────────────────
INSERT INTO client_contacts (id, client_id, contact_name, email, phone_no) VALUES
('aa111111-1111-1111-1111-111111111111', '11111111-1111-1111-1111-111111111111', 'Ravi Kumar',     'ravi@vertex.com',     '+91-9876543210'),
('bb222222-2222-2222-2222-222222222222', '22222222-2222-2222-2222-222222222222', 'Sarah Mitchell', 'sarah@medsync.com',   '+1-555-0101'),
('cc333333-3333-3333-3333-333333333333', '33333333-3333-3333-3333-333333333333', 'James Okonkwo', 'james@payflow.com',   '+44-7700-900123'),
('dd444444-4444-4444-4444-444444444444', '44444444-4444-4444-4444-444444444444', 'Mei Lin',       'mei@shopnova.com',    '+86-139-0000-1234'),
('ee555555-5555-5555-5555-555555555555', '55555555-5555-5555-5555-555555555555', 'Tom Bradley',   'tom@cybervault.com',  '+1-555-0202');

-- ── Leads (8 leads across clients) ─────────────────────
INSERT INTO leads (id, client_id, contact_id, area_id, topic, estimated_value, status, created_by) VALUES
('11aaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '11111111-1111-1111-1111-111111111111', 'aa111111-1111-1111-1111-111111111111', 'aaaaaaaa-1111-1111-1111-aaaaaaaaaaaa', 'ERP Migration Platform',        250000, 'Accepted', '22222222-bbbb-bbbb-bbbb-222222222222'),
('22bbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', '22222222-2222-2222-2222-222222222222', 'bb222222-2222-2222-2222-222222222222', 'bbbbbbbb-2222-2222-2222-bbbbbbbbbbbb', 'Patient Portal Redesign',       180000, 'Accepted', '33333333-cccc-cccc-cccc-333333333333'),
('33cccccc-cccc-cccc-cccc-cccccccccccc', '33333333-3333-3333-3333-333333333333', 'cc333333-3333-3333-3333-333333333333', 'cccccccc-3333-3333-3333-cccccccccccc', 'Payment Gateway Integration',   320000, 'Active',   '44444444-dddd-dddd-dddd-444444444444'),
('44dddddd-dddd-dddd-dddd-dddddddddddd', '44444444-4444-4444-4444-444444444444', 'dd444444-4444-4444-4444-444444444444', 'dddddddd-4444-4444-4444-dddddddddddd', 'Marketplace Analytics Suite',   95000,  'Active',   '22222222-bbbb-bbbb-bbbb-222222222222'),
('55eeeeee-eeee-eeee-eeee-eeeeeeeeeeee', '55555555-5555-5555-5555-555555555555', 'ee555555-5555-5555-5555-555555555555', 'eeeeeeee-5555-5555-5555-eeeeeeeeeeee', 'Zero Trust Architecture Audit', 410000, 'Accepted', '33333333-cccc-cccc-cccc-333333333333'),
('66ffffff-ffff-ffff-ffff-ffffffffffff', '11111111-1111-1111-1111-111111111111', 'aa111111-1111-1111-1111-111111111111', 'aaaaaaaa-1111-1111-1111-aaaaaaaaaaaa', 'Cloud Infrastructure Setup',    175000, 'Active',   '22222222-bbbb-bbbb-bbbb-222222222222'),
('77aabbcc-aabb-aabb-aabb-aabbccddee11', '22222222-2222-2222-2222-222222222222', 'bb222222-2222-2222-2222-222222222222', 'bbbbbbbb-2222-2222-2222-bbbbbbbbbbbb', 'Telemedicine Module',           140000, 'Cancelled','33333333-cccc-cccc-cccc-333333333333'),
('88ddeeff-ddee-ddee-ddee-ddeeff112233', '33333333-3333-3333-3333-333333333333', 'cc333333-3333-3333-3333-333333333333', 'cccccccc-3333-3333-3333-cccccccccccc', 'Fraud Detection ML Pipeline',  280000, 'Active',   '44444444-dddd-dddd-dddd-444444444444');

-- ── Lead Assignments ───────────────────────────────────
INSERT INTO lead_assignments (lead_id, employee_id, assignment_role) VALUES
('11aaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '22222222-bbbb-bbbb-bbbb-222222222222', 'Sales Lead'),
('22bbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', '33333333-cccc-cccc-cccc-333333333333', 'Sales Lead'),
('33cccccc-cccc-cccc-cccc-cccccccccccc', '44444444-dddd-dddd-dddd-444444444444', 'Sales Lead'),
('44dddddd-dddd-dddd-dddd-dddddddddddd', '22222222-bbbb-bbbb-bbbb-222222222222', 'Sales Lead'),
('55eeeeee-eeee-eeee-eeee-eeeeeeeeeeee', '33333333-cccc-cccc-cccc-333333333333', 'Sales Lead'),
('66ffffff-ffff-ffff-ffff-ffffffffffff', '22222222-bbbb-bbbb-bbbb-222222222222', 'Sales Lead'),
('77aabbcc-aabb-aabb-aabb-aabbccddee11', '33333333-cccc-cccc-cccc-333333333333', 'Sales Lead'),
('88ddeeff-ddee-ddee-ddee-ddeeff112233', '44444444-dddd-dddd-dddd-444444444444', 'Sales Lead');

-- ── Proposals ──────────────────────────────────────────
INSERT INTO proposals (id, lead_id, status, created_by) VALUES
('aaa11111-1111-1111-1111-111111111111', '11aaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Won',         '22222222-bbbb-bbbb-bbbb-222222222222'),
('bbb22222-2222-2222-2222-222222222222', '22bbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'Won',         '33333333-cccc-cccc-cccc-333333333333'),
('ccc33333-3333-3333-3333-333333333333', '33cccccc-cccc-cccc-cccc-cccccccccccc', 'In Proposal', '44444444-dddd-dddd-dddd-444444444444'),
('ddd44444-4444-4444-4444-444444444444', '55eeeeee-eeee-eeee-eeee-eeeeeeeeeeee', 'Won',         '33333333-cccc-cccc-cccc-333333333333'),
('eee55555-5555-5555-5555-555555555555', '77aabbcc-aabb-aabb-aabb-aabbccddee11', 'Lost',        '33333333-cccc-cccc-cccc-333333333333');

-- ── Projects (from Won proposals) ──────────────────────
INSERT INTO projects (id, proposal_id, status, created_by) VALUES
('abcdefab-1111-1111-1111-abcdefabcdef', 'aaa11111-1111-1111-1111-111111111111', 'In Progress', '55555555-eeee-eeee-eeee-555555555555'),
('abcdefab-2222-2222-2222-abcdefabcdef', 'bbb22222-2222-2222-2222-222222222222', 'Completed',   '66666666-ffff-ffff-ffff-666666666666'),
('abcdefab-3333-3333-3333-abcdefabcdef', 'ddd44444-4444-4444-4444-444444444444', 'Kickoff',     '55555555-eeee-eeee-eeee-555555555555');

-- ── Project Assignments ────────────────────────────────
INSERT INTO project_assignments (project_id, employee_id, assignment_role) VALUES
('abcdefab-1111-1111-1111-abcdefabcdef', '55555555-eeee-eeee-eeee-555555555555', 'Project Manager'),
('abcdefab-2222-2222-2222-abcdefabcdef', '66666666-ffff-ffff-ffff-666666666666', 'Project Manager'),
('abcdefab-3333-3333-3333-abcdefabcdef', '55555555-eeee-eeee-eeee-555555555555', 'Project Manager');

-- ── Invoice Schedules ──────────────────────────────────
INSERT INTO invoice_schedules (id, project_id, milestone_name, milestone_order, amount, status) VALUES
-- Project 1: ERP Migration (value: 250k)
('11112222-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'abcdefab-1111-1111-1111-abcdefabcdef', 'Requirements Sign-off',  1, 75000,  'Paid'),
('11113333-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'abcdefab-1111-1111-1111-abcdefabcdef', 'Beta Delivery',          2, 100000, 'Invoiced'),
('11114444-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'abcdefab-1111-1111-1111-abcdefabcdef', 'Go-Live & Handover',     3, 75000,  'Pending'),
-- Project 2: Patient Portal (value: 180k)
('22221111-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'abcdefab-2222-2222-2222-abcdefabcdef', 'UI/UX Approval',         1, 54000,  'Paid'),
('22222211-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'abcdefab-2222-2222-2222-abcdefabcdef', 'Development Complete',   2, 72000,  'Paid'),
('22223311-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'abcdefab-2222-2222-2222-abcdefabcdef', 'Final Deployment',       3, 54000,  'Paid'),
-- Project 3: Zero Trust Audit (value: 410k)
('33331111-cccc-cccc-cccc-cccccccccccc', 'abcdefab-3333-3333-3333-abcdefabcdef', 'Kickoff & Scope Lock',   1, 123000, 'Pending'),
('33332222-cccc-cccc-cccc-cccccccccccc', 'abcdefab-3333-3333-3333-abcdefabcdef', 'Assessment Report',      2, 164000, 'Pending'),
('33333311-cccc-cccc-cccc-cccccccccccc', 'abcdefab-3333-3333-3333-abcdefabcdef', 'Remediation & Close',    3, 123000, 'Pending');

-- ── Status History Samples ─────────────────────────────
INSERT INTO lead_status_history (lead_id, previous_status, new_status, changed_by) VALUES
('11aaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Active',    'Accepted',  '22222222-bbbb-bbbb-bbbb-222222222222'),
('22bbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'Active',    'Accepted',  '33333333-cccc-cccc-cccc-333333333333'),
('55eeeeee-eeee-eeee-eeee-eeeeeeeeeeee', 'Active',    'Accepted',  '33333333-cccc-cccc-cccc-333333333333'),
('77aabbcc-aabb-aabb-aabb-aabbccddee11', 'Active',    'Cancelled', '33333333-cccc-cccc-cccc-333333333333');

INSERT INTO proposal_status_history (proposal_id, previous_status, new_status, changed_by) VALUES
('aaa11111-1111-1111-1111-111111111111', 'In Proposal', 'Won',  '22222222-bbbb-bbbb-bbbb-222222222222'),
('bbb22222-2222-2222-2222-222222222222', 'Submitted',   'Won',  '33333333-cccc-cccc-cccc-333333333333'),
('ddd44444-4444-4444-4444-444444444444', 'In Proposal', 'Won',  '33333333-cccc-cccc-cccc-333333333333'),
('eee55555-5555-5555-5555-555555555555', 'Submitted',   'Lost', '33333333-cccc-cccc-cccc-333333333333');

INSERT INTO project_status_history (project_id, previous_status, new_status, changed_by) VALUES
('abcdefab-2222-2222-2222-abcdefabcdef', 'In Progress', 'Completed', '66666666-ffff-ffff-ffff-666666666666');
