const { Client } = require('pg');
const c = new Client({ connectionString: 'postgres://postgres:Abhi1234!@localhost:5432/postgres' });
c.connect()
.then(() => Promise.all([
    c.query(SELECT e.id, e.full_name, e.email, e.is_active, COALESCE(array_agg(er.role::varchar) FILTER (WHERE er.role IS NOT NULL), ARRAY[]::varchar[]) AS system_roles FROM employees e LEFT JOIN employee_roles er ON e.id = er.employee_id GROUP BY e.id ORDER BY e.full_name ASC),
    c.query(SELECT c.*, e.full_name as created_by_name FROM clients c LEFT JOIN employees e ON c.created_by = e.id ORDER BY c.created_at DESC),
    c.query(SELECT cc.*, c.client_name FROM client_contacts cc JOIN clients c ON cc.client_id = c.id ORDER BY cc.contact_name),
    c.query(SELECT * FROM industry_areas ORDER BY area_name),
    c.query(SELECT l.*, c.client_name, cc.contact_name, ia.area_name FROM leads l JOIN clients c ON l.client_id = c.id JOIN client_contacts cc ON l.contact_id = cc.id JOIN industry_areas ia ON l.area_id = ia.id ORDER BY l.created_at DESC),
    c.query(SELECT p.*, l.topic, c.client_name FROM proposals p JOIN leads l ON p.lead_id = l.id JOIN clients c ON l.client_id = c.id ORDER BY p.created_at DESC),
    c.query(SELECT pj.*, l.topic, c.client_name, l.estimated_value FROM projects pj JOIN proposals pr ON pj.proposal_id = pr.id JOIN leads l ON pr.lead_id = l.id JOIN clients c ON l.client_id = c.id ORDER BY pj.created_at DESC),
    c.query(SELECT i.*, l.topic as project_name, c.client_name FROM invoice_schedules i JOIN projects pj ON i.project_id = pj.id JOIN proposals pr ON pj.proposal_id = pr.id JOIN leads l ON pr.lead_id = l.id JOIN clients c ON l.client_id = c.id ORDER BY i.created_at DESC)
]))
.then(() => console.log('All queries succeeded'))
.catch(err => console.error('Query failed:', err.message))
.finally(() => c.end());
