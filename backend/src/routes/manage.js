// backend/src/routes/manage.js
const express = require('express');
const router = express.Router();
const db = require('../db');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { authenticateToken, requireRole } = require('../middleware/auth');

// ── Auth ───────────────────────────────────────────────
router.post('/login', async (req, res, next) => {
    try {
        const { email, password } = req.body;
        if (!email || !password) return res.status(400).json({ error: 'Email and password are required' });
        
        const result = await db.query(`
            SELECT e.*, COALESCE(array_agg(er.role::varchar) FILTER (WHERE er.role IS NOT NULL), ARRAY[]::varchar[]) AS system_roles 
            FROM employees e 
            LEFT JOIN employee_roles er ON e.id = er.employee_id 
            WHERE e.email = $1 
            GROUP BY e.id
        `, [email]);
        if (result.rows.length === 0) {
            return res.status(401).json({ error: 'Invalid email or password' });
        }
        
        const user = result.rows[0];
        if (!user.is_active) {
            return res.status(401).json({ error: 'Invalid email or password' });
        }

        if (!user.password_hash) {
            return res.status(401).json({ error: 'Invalid email or password' });
        }

        const isValid = await bcrypt.compare(password, user.password_hash);
        if (!isValid) {
            return res.status(401).json({ error: 'Invalid email or password' });
        }

        // Don't send the password hash back to the client
        delete user.password_hash;

        const token = jwt.sign(
            { id: user.id, email: user.email, system_roles: user.system_roles },
            process.env.JWT_SECRET,
            { expiresIn: '24h' }
        );

        res.json({ user, token });
    } catch (err) { next(err); }
});

// Protect all following routes
router.use(authenticateToken);

// ── Aggregate Lookups ──────────────────────────────────
router.get('/lookups', async (req, res, next) => {
    try {
        const [
            employeesRes, clientsRes, contactsRes,
            industriesRes, leadsRes, proposalsRes, projectsRes, invoicesRes
        ] = await Promise.all([
            db.query(`SELECT e.id, e.full_name, e.email, e.is_active, COALESCE(array_agg(er.role::varchar) FILTER (WHERE er.role IS NOT NULL), ARRAY[]::varchar[]) AS system_roles FROM employees e LEFT JOIN employee_roles er ON e.id = er.employee_id GROUP BY e.id ORDER BY e.full_name ASC`),
            db.query(`SELECT c.*, e.full_name as created_by_name FROM clients c LEFT JOIN employees e ON c.created_by = e.id ORDER BY c.created_at DESC`),
            db.query(`SELECT cc.*, c.client_name FROM client_contacts cc JOIN clients c ON cc.client_id = c.id ORDER BY cc.contact_name`),
            db.query(`SELECT * FROM industry_areas ORDER BY area_name`),
            db.query(`SELECT l.*, c.client_name, cc.contact_name, ia.area_name FROM leads l JOIN clients c ON l.client_id = c.id JOIN client_contacts cc ON l.contact_id = cc.id JOIN industry_areas ia ON l.area_id = ia.id ORDER BY l.created_at DESC`),
            db.query(`SELECT p.*, l.topic, c.client_name FROM proposals p JOIN leads l ON p.lead_id = l.id JOIN clients c ON l.client_id = c.id ORDER BY p.created_at DESC`),
            db.query(`SELECT pj.*, l.topic, c.client_name, l.estimated_value FROM projects pj JOIN proposals pr ON pj.proposal_id = pr.id JOIN leads l ON pr.lead_id = l.id JOIN clients c ON l.client_id = c.id ORDER BY pj.created_at DESC`),
            db.query(`SELECT i.*, l.topic as project_name, c.client_name FROM invoice_schedules i JOIN projects pj ON i.project_id = pj.id JOIN proposals pr ON pj.proposal_id = pr.id JOIN leads l ON pr.lead_id = l.id JOIN clients c ON l.client_id = c.id ORDER BY pj.created_at DESC, i.milestone_order ASC`)
        ]);

        res.json({
            employees: employeesRes.rows,
            clients: clientsRes.rows,
            contacts: contactsRes.rows,
            industries: industriesRes.rows,
            leads: leadsRes.rows,
            proposals: proposalsRes.rows,
            projects: projectsRes.rows,
            invoices: invoicesRes.rows
        });
    } catch (err) { next(err); }
});

// ── Employees ──────────────────────────────────────────
router.get('/employees', async (req, res, next) => {
    try {
        const result = await db.query(`
            SELECT e.id, e.full_name, e.email, e.is_active, 
                   COALESCE(array_agg(er.role::varchar) FILTER (WHERE er.role IS NOT NULL), ARRAY[]::varchar[]) AS system_roles 
            FROM employees e 
            LEFT JOIN employee_roles er ON e.id = er.employee_id 
            GROUP BY e.id 
            ORDER BY e.full_name ASC
        `);
        res.json(result.rows);
    } catch (err) { next(err); }
});

router.post('/employees', requireRole('Admin'), async (req, res, next) => {
    const { full_name, email, system_roles, password } = req.body;
    if (!full_name || !email || !system_roles || !Array.isArray(system_roles) || !password) return res.status(400).json({ error: 'full_name, email, system_roles array, and password are required' });
    
    if (password.length < 8) return res.status(400).json({ error: 'Password must be at least 8 characters long' });
    const plainPassword = password;
    
    const client = await db.getClient();
    try {
        await client.query('BEGIN');
        const passwordHash = await bcrypt.hash(plainPassword, 10);
        const result = await client.query(
            'INSERT INTO employees (full_name, email, password_hash) VALUES ($1, $2, $3) RETURNING *',
            [full_name, email, passwordHash]
        );
        const emp = result.rows[0];
        
        for (const role of system_roles) {
            await client.query('INSERT INTO employee_roles (employee_id, role) VALUES ($1, $2)', [emp.id, role]);
        }
        await client.query('COMMIT');
        
        delete emp.password_hash;
        emp.system_roles = system_roles;
        res.status(201).json(emp);
    } catch (err) { 
        await client.query('ROLLBACK');
        if (err.code === '23505') return res.status(400).json({ error: 'An employee with this email already exists.' });
        next(err); 
    } finally {
        client.release();
    }
});

router.patch('/employees/:id/toggle-active', requireRole('Admin'), async (req, res, next) => {
    if (req.params.id === req.user.id) {
        return res.status(400).json({ error: 'Cannot deactivate your own account' });
    }
    try {
        const result = await db.query(
            'UPDATE employees SET is_active = NOT is_active WHERE id = $1 RETURNING *',
            [req.params.id]
        );
        if (result.rows.length === 0) return res.status(404).json({ error: 'Employee not found' });
        delete result.rows[0].password_hash;
        res.json(result.rows[0]);
    } catch (err) { next(err); }
});

router.delete('/employees/:id', requireRole('Admin'), async (req, res, next) => {
    if (req.params.id === req.user.id) {
        return res.status(400).json({ error: 'Cannot delete your own account' });
    }
    try {
        // Prevent deleting any Admin
        const emp = await db.query('SELECT role FROM employee_roles WHERE employee_id = $1', [req.params.id]);
        if (emp.rows.some(r => r.role === 'Admin')) {
            return res.status(403).json({ error: 'Cannot delete an Admin account' });
        }

        await db.query('DELETE FROM employees WHERE id = $1', [req.params.id]);
        res.json({ success: true, message: 'Employee permanently deleted' });
    } catch (err) {
        if (err.code === '23503') { 
            // Foreign key violation, do a soft delete instead
            await db.query('UPDATE employees SET is_active = false WHERE id = $1', [req.params.id]);
            res.json({ success: true, softDeleted: true, message: 'Employee has linked records and was deactivated instead.' });
        } else {
            next(err);
        }
    }
});

// ── Clients ────────────────────────────────────────────
router.get('/clients', async (req, res, next) => {
    try {
        const result = await db.query(`
            SELECT c.*, e.full_name as created_by_name
            FROM clients c
            LEFT JOIN employees e ON c.created_by = e.id
            ORDER BY c.created_at DESC
        `);
        res.json(result.rows);
    } catch (err) { next(err); }
});

router.post('/clients', async (req, res, next) => {
    const { client_name } = req.body;
    if (!client_name) return res.status(400).json({ error: 'client_name is required' });
    try {
        const result = await db.query(
            'INSERT INTO clients (client_name, created_by) VALUES ($1, $2) RETURNING *',
            [client_name, req.user.id]
        );
        res.status(201).json(result.rows[0]);
    } catch (err) { 
        if (err.code === '23505') return res.status(400).json({ error: 'A client with this name already exists.' });
        next(err); 
    }
});

// ── Client Contacts ────────────────────────────────────
router.get('/contacts', async (req, res, next) => {
    try {
        const result = await db.query(`
            SELECT cc.*, c.client_name
            FROM client_contacts cc
            JOIN clients c ON cc.client_id = c.id
            ORDER BY cc.contact_name
        `);
        res.json(result.rows);
    } catch (err) { next(err); }
});

router.post('/contacts', async (req, res, next) => {
    const { client_id, contact_name, email, phone_no } = req.body;
    if (!client_id || !contact_name || !email || !phone_no) return res.status(400).json({ error: 'client_id, contact_name, email, and phone_no are required' });
    try {
        const result = await db.query(
            'INSERT INTO client_contacts (client_id, contact_name, email, phone_no) VALUES ($1, $2, $3, $4) RETURNING *',
            [client_id, contact_name, email, phone_no]
        );
        res.status(201).json(result.rows[0]);
    } catch (err) { 
        if (err.code === '23505') return res.status(400).json({ error: 'A contact with this email already exists.' });
        next(err); 
    }
});

// ── Industries ─────────────────────────────────────────
router.get('/industries', async (req, res, next) => {
    try {
        const result = await db.query('SELECT * FROM industry_areas ORDER BY area_name');
        res.json(result.rows);
    } catch (err) { next(err); }
});

router.post('/industries', async (req, res, next) => {
    const { area_name } = req.body;
    if (!area_name) return res.status(400).json({ error: 'area_name is required' });
    try {
        const result = await db.query('INSERT INTO industry_areas (area_name) VALUES ($1) RETURNING *', [area_name]);
        res.status(201).json(result.rows[0]);
    } catch (err) { 
        if (err.code === '23505') return res.status(400).json({ error: 'An industry with this name already exists.' });
        next(err); 
    }
});

// ── Leads ──────────────────────────────────────────────
router.get('/leads', async (req, res, next) => {
    try {
        const result = await db.query(`
            SELECT l.*, c.client_name, cc.contact_name, ia.area_name
            FROM leads l
            JOIN clients c ON l.client_id = c.id
            JOIN client_contacts cc ON l.contact_id = cc.id
            JOIN industry_areas ia ON l.area_id = ia.id
            ORDER BY l.created_at DESC
        `);
        res.json(result.rows);
    } catch (err) { next(err); }
});

router.post('/leads', async (req, res, next) => {
    const { client_name, contact_name, contact_email, contact_phone, area_id, topic, estimated_value, status } = req.body;
    if (!client_name || !contact_name || !contact_email || !contact_phone || !area_id || !topic || estimated_value === undefined) {
        return res.status(400).json({ error: 'client_name, contact_name, contact_email, contact_phone, area_id, topic, and estimated_value are required' });
    }
    const created_by = req.user.id;
    const client = await db.getClient();
    try {
        await client.query('BEGIN');

        // Upsert client: find existing or create new
        let clientRes = await client.query('SELECT id FROM clients WHERE client_name = $1', [client_name]);
        let clientId;
        if (clientRes.rows.length > 0) {
            clientId = clientRes.rows[0].id;
        } else {
            const newClient = await client.query(
                'INSERT INTO clients (client_name, created_by) VALUES ($1, $2) RETURNING id',
                [client_name, created_by]
            );
            clientId = newClient.rows[0].id;
        }

        // Upsert contact: find existing by email or create new
        let contactRes = await client.query('SELECT id FROM client_contacts WHERE email = $1', [contact_email]);
        let contactId;
        if (contactRes.rows.length > 0) {
            contactId = contactRes.rows[0].id;
        } else {
            const newContact = await client.query(
                'INSERT INTO client_contacts (client_id, contact_name, email, phone_no) VALUES ($1, $2, $3, $4) RETURNING id',
                [clientId, contact_name, contact_email, contact_phone]
            );
            contactId = newContact.rows[0].id;
        }

        const result = await client.query(
            `INSERT INTO leads (client_id, contact_id, area_id, topic, estimated_value, status, created_by)
             VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
            [clientId, contactId, area_id, topic, estimated_value, status || 'Active', created_by]
        );
        // Log to status history
        await client.query(
            'INSERT INTO lead_status_history (lead_id, new_status, changed_by) VALUES ($1, $2, $3)',
            [result.rows[0].id, status || 'Active', created_by]
        );

        await client.query('COMMIT');
        res.status(201).json(result.rows[0]);
    } catch (err) {
        await client.query('ROLLBACK');
        next(err);
    } finally {
        client.release();
    }
});

// Valid lead status transitions
const LEAD_TRANSITIONS = {
    'Active': ['Accepted', 'Rejected', 'Nurture', 'Cancelled'],
    'Nurture': ['Active', 'Cancelled'],
    'Accepted': [], // terminal
    'Rejected': [], // terminal
    'Cancelled': [] // terminal
};

router.patch('/leads/:id/status', async (req, res, next) => {
    const { status } = req.body;
    if (!status) return res.status(400).json({ error: 'status is required' });
    const changed_by = req.user.id;
    const client = await db.getClient();
    try {
        await client.query('BEGIN');
        const current = await client.query('SELECT status FROM leads WHERE id = $1', [req.params.id]);
        if (current.rows.length === 0) {
            await client.query('ROLLBACK');
            return res.status(404).json({ error: 'Lead not found' });
        }

        const currentStatus = current.rows[0].status;
        if (currentStatus === status) {
            await client.query('ROLLBACK');
            return res.json(current.rows[0]);
        }

        const allowed = LEAD_TRANSITIONS[currentStatus] || [];
        if (!allowed.includes(status)) {
            await client.query('ROLLBACK');
            return res.status(400).json({ error: `Cannot transition from '${currentStatus}' to '${status}'. Allowed: ${allowed.join(', ') || 'none (terminal state)'}` });
        }

        const result = await client.query(
            'UPDATE leads SET status = $1, updated_at = CURRENT_TIMESTAMP, updated_by = $2 WHERE id = $3 RETURNING *',
            [status, changed_by, req.params.id]
        );
        await client.query(
            'INSERT INTO lead_status_history (lead_id, previous_status, new_status, changed_by) VALUES ($1, $2, $3, $4)',
            [req.params.id, currentStatus, status, changed_by]
        );
        await client.query('COMMIT');
        res.json(result.rows[0]);
    } catch (err) {
        await client.query('ROLLBACK');
        next(err);
    } finally {
        client.release();
    }
});

// ── Lead Assignments ───────────────────────────────────
router.post('/assign-lead', async (req, res, next) => {
    const { lead_id, employee_id, assignment_role } = req.body;
    if (!lead_id || !employee_id || !assignment_role) return res.status(400).json({ error: 'lead_id, employee_id, and assignment_role are required' });
    try {
        const result = await db.query(
            'INSERT INTO lead_assignments (lead_id, employee_id, assignment_role) VALUES ($1, $2, $3) RETURNING *',
            [lead_id, employee_id, assignment_role]
        );
        res.status(201).json(result.rows[0]);
    } catch (err) { 
        if (err.code === '23505') return res.status(400).json({ error: 'Employee is already assigned to this role for this lead.' });
        next(err); 
    }
});

// ── Proposals ──────────────────────────────────────────
router.get('/proposals', async (req, res, next) => {
    try {
        const result = await db.query(`
            SELECT p.*, l.topic, c.client_name
            FROM proposals p
            JOIN leads l ON p.lead_id = l.id
            JOIN clients c ON l.client_id = c.id
            ORDER BY p.created_at DESC
        `);
        res.json(result.rows);
    } catch (err) { next(err); }
});

router.post('/proposals', async (req, res, next) => {
    const { lead_id, status } = req.body;
    if (!lead_id) return res.status(400).json({ error: 'lead_id is required' });
    const created_by = req.user.id;
    const client = await db.getClient();
    try {
        await client.query('BEGIN');
        const result = await client.query(
            'INSERT INTO proposals (lead_id, status, created_by) VALUES ($1, $2, $3) RETURNING *',
            [lead_id, status || 'In Proposal', created_by]
        );
        await client.query(
            'INSERT INTO proposal_status_history (proposal_id, new_status, changed_by) VALUES ($1, $2, $3)',
            [result.rows[0].id, status || 'In Proposal', created_by]
        );
        await client.query('COMMIT');
        res.status(201).json(result.rows[0]);
    } catch (err) {
        await client.query('ROLLBACK');
        if (err.code === '23505') return res.status(400).json({ error: 'A proposal already exists for this lead.' });
        next(err);
    } finally {
        client.release();
    }
});

// Valid proposal status transitions
const PROPOSAL_TRANSITIONS = {
    'In Proposal': ['Submitted', 'Cancelled'],
    'Submitted': ['Won', 'Lost', 'Cancelled'],
    'Won': [],      // terminal
    'Lost': [],     // terminal
    'Cancelled': [] // terminal
};

router.patch('/proposals/:id/status', async (req, res, next) => {
    const { status } = req.body;
    if (!status) return res.status(400).json({ error: 'status is required' });
    const changed_by = req.user.id;
    const client = await db.getClient();
    try {
        await client.query('BEGIN');
        const current = await client.query('SELECT status FROM proposals WHERE id = $1', [req.params.id]);
        if (current.rows.length === 0) {
            await client.query('ROLLBACK');
            return res.status(404).json({ error: 'Proposal not found' });
        }

        const currentStatus = current.rows[0].status;
        if (currentStatus === status) {
            await client.query('ROLLBACK');
            return res.json(current.rows[0]);
        }

        const allowed = PROPOSAL_TRANSITIONS[currentStatus] || [];
        if (!allowed.includes(status)) {
            await client.query('ROLLBACK');
            return res.status(400).json({ error: `Cannot transition from '${currentStatus}' to '${status}'. Allowed: ${allowed.join(', ') || 'none (terminal state)'}` });
        }

        const result = await client.query(
            'UPDATE proposals SET status = $1, updated_at = CURRENT_TIMESTAMP, updated_by = $2 WHERE id = $3 RETURNING *',
            [status, changed_by, req.params.id]
        );
        await client.query(
            'INSERT INTO proposal_status_history (proposal_id, previous_status, new_status, changed_by) VALUES ($1, $2, $3, $4)',
            [req.params.id, currentStatus, status, changed_by]
        );
        await client.query('COMMIT');
        res.json(result.rows[0]);
    } catch (err) {
        await client.query('ROLLBACK');
        next(err);
    } finally {
        client.release();
    }
});

// ── Projects ───────────────────────────────────────────
router.get('/projects', async (req, res, next) => {
    try {
        const result = await db.query(`
            SELECT pj.*, l.topic, c.client_name, l.estimated_value
            FROM projects pj
            JOIN proposals pr ON pj.proposal_id = pr.id
            JOIN leads l ON pr.lead_id = l.id
            JOIN clients c ON l.client_id = c.id
            ORDER BY pj.created_at DESC
        `);
        res.json(result.rows);
    } catch (err) { next(err); }
});

router.post('/projects', async (req, res, next) => {
    const { proposal_id, status } = req.body;
    if (!proposal_id) return res.status(400).json({ error: 'proposal_id is required' });
    const created_by = req.user.id;
    const client = await db.getClient();
    try {
        await client.query('BEGIN');
        // Only allow creating projects from Won proposals
        const proposal = await client.query('SELECT status FROM proposals WHERE id = $1', [proposal_id]);
        if (proposal.rows.length === 0) {
            await client.query('ROLLBACK');
            return res.status(404).json({ error: 'Proposal not found' });
        }
        if (proposal.rows[0].status !== 'Won') {
            await client.query('ROLLBACK');
            return res.status(400).json({ error: 'Can only create projects from Won proposals' });
        }

        const result = await client.query(
            'INSERT INTO projects (proposal_id, status, created_by) VALUES ($1, $2, $3) RETURNING *',
            [proposal_id, status || 'Kickoff', created_by]
        );
        await client.query(
            'INSERT INTO project_status_history (project_id, new_status, changed_by) VALUES ($1, $2, $3)',
            [result.rows[0].id, status || 'Kickoff', created_by]
        );
        await client.query('COMMIT');
        res.status(201).json(result.rows[0]);
    } catch (err) {
        await client.query('ROLLBACK');
        if (err.code === '23505') return res.status(400).json({ error: 'A project already exists for this proposal.' });
        next(err);
    } finally {
        client.release();
    }
});

// Valid project status transitions
const PROJECT_TRANSITIONS = {
    'Kickoff': ['In Progress'],
    'In Progress': ['Completed', 'On Hold'],
    'On Hold': ['In Progress'],
    'Completed': [] // terminal state
};

router.patch('/projects/:id/status', async (req, res, next) => {
    const { status } = req.body;
    if (!status) return res.status(400).json({ error: 'status is required' });
    const changed_by = req.user.id;
    const client = await db.getClient();
    try {
        await client.query('BEGIN');
        // Fetch current status for state machine validation
        const current = await client.query('SELECT status FROM projects WHERE id = $1', [req.params.id]);
        if (current.rows.length === 0) {
            await client.query('ROLLBACK');
            return res.status(404).json({ error: 'Project not found' });
        }

        const currentStatus = current.rows[0].status;
        if (currentStatus === status) {
            await client.query('ROLLBACK');
            return res.json(current.rows[0]);
        }

        const allowed = PROJECT_TRANSITIONS[currentStatus] || [];
        if (!allowed.includes(status)) {
            await client.query('ROLLBACK');
            return res.status(400).json({ error: `Cannot transition from '${currentStatus}' to '${status}'. Allowed: ${allowed.join(', ') || 'none (terminal state)'}` });
        }

        const result = await client.query(
            'UPDATE projects SET status = $1 WHERE id = $2 RETURNING *',
            [status, req.params.id]
        );
        
        await client.query(
            'INSERT INTO project_status_history (project_id, new_status, changed_by) VALUES ($1, $2, $3)',
            [req.params.id, status, changed_by]
        );
        await client.query('COMMIT');
        res.json(result.rows[0]);
    } catch (err) {
        await client.query('ROLLBACK');
        next(err);
    } finally {
        client.release();
    }
});

// ── Project Assignments ────────────────────────────────
router.post('/assign-project', async (req, res, next) => {
    const { project_id, employee_id, assignment_role } = req.body;
    if (!project_id || !employee_id || !assignment_role) return res.status(400).json({ error: 'project_id, employee_id, and assignment_role are required' });
    try {
        const result = await db.query(
            'INSERT INTO project_assignments (project_id, employee_id, assignment_role) VALUES ($1, $2, $3) RETURNING *',
            [project_id, employee_id, assignment_role]
        );
        res.status(201).json(result.rows[0]);
    } catch (err) { 
        if (err.code === '23505') return res.status(400).json({ error: 'Employee is already assigned to this role for this project.' });
        next(err); 
    }
});

// ── Invoices ───────────────────────────────────────────
router.post('/invoices', async (req, res, next) => {
    const { project_id, milestone_name, milestone_order, amount, status } = req.body;
    if (!project_id || !milestone_name || !milestone_order || !amount) {
        return res.status(400).json({ error: 'project_id, milestone_name, milestone_order, and amount are required' });
    }
    try {
        const result = await db.query(
            'INSERT INTO invoice_schedules (project_id, milestone_name, milestone_order, amount, status) VALUES ($1, $2, $3, $4, $5) RETURNING *',
            [project_id, milestone_name, milestone_order, amount, status || 'Pending']
        );
        res.status(201).json(result.rows[0]);
    } catch (err) { 
        if (err.code === '23505') return res.status(400).json({ error: 'An invoice with this milestone order already exists for this project.' });
        next(err); 
    }
});

router.get('/invoices', async (req, res, next) => {
    try {
        const result = await db.query(`
            SELECT i.*, l.topic as project_name, c.client_name 
            FROM invoice_schedules i 
            JOIN projects pj ON i.project_id = pj.id 
            JOIN proposals pr ON pj.proposal_id = pr.id 
            JOIN leads l ON pr.lead_id = l.id 
            JOIN clients c ON l.client_id = c.id 
            ORDER BY pj.created_at DESC, i.milestone_order ASC
        `);
        res.json(result.rows);
    } catch (err) { next(err); }
});

// Valid invoice status transitions
const INVOICE_TRANSITIONS = {
    'Pending': ['Invoiced'],
    'Invoiced': ['Paid'],
    'Paid': [] // terminal state
};

router.patch('/invoices/:id/status', async (req, res, next) => {
    const { status } = req.body;
    if (!status) return res.status(400).json({ error: 'status is required' });
    try {
        const current = await db.query('SELECT status FROM invoice_schedules WHERE id = $1', [req.params.id]);
        if (current.rows.length === 0) return res.status(404).json({ error: 'Invoice not found' });

        const currentStatus = current.rows[0].status;
        if (currentStatus === status) return res.json(current.rows[0]);

        const allowed = INVOICE_TRANSITIONS[currentStatus] || [];
        if (!allowed.includes(status)) {
            return res.status(400).json({ error: `Cannot transition from '${currentStatus}' to '${status}'. Allowed: ${allowed.join(', ') || 'none (terminal state)'}` });
        }

        const result = await db.query(
            'UPDATE invoice_schedules SET status = $1 WHERE id = $2 RETURNING *',
            [status, req.params.id]
        );
        res.json(result.rows[0]);
    } catch (err) { next(err); }
});

module.exports = router;
