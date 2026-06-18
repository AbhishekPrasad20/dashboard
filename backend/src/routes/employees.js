// backend/src/routes/employees.js
const express = require('express');
const router = express.Router();
const db = require('../db');
const { authenticateToken } = require('../middleware/auth');

router.use(authenticateToken);

// GET /api/employees/:id/history
router.get('/:id/history', async (req, res, next) => {
    const employeeId = req.params.id;
    try {
        const empRes = await db.query('SELECT role FROM employee_roles WHERE employee_id = $1', [employeeId]);
        if (empRes.rows.length === 0) {
            return res.status(404).json({ error: 'Employee roles not found' });
        }
        const roles = empRes.rows.map(r => r.role);

        let leads = [];
        let projects = [];

        if (roles.includes('Sales Lead')) {
            const leadsRes = await db.query(`
                SELECT l.id as lead_id, c.client_name, l.topic, l.status, l.estimated_value, la.assigned_at
                FROM lead_assignments la
                JOIN leads l ON la.lead_id = l.id
                JOIN clients c ON l.client_id = c.id
                WHERE la.employee_id = $1 AND la.assignment_role = 'Sales Lead'
                ORDER BY la.assigned_at DESC
            `, [employeeId]);
            leads = leadsRes.rows;
        } 
        
        if (roles.includes('Project Manager')) {
            const projectsRes = await db.query(`
                SELECT pj.id as project_id, pj.status, l.topic, l.estimated_value, pa.assigned_at
                FROM project_assignments pa
                JOIN projects pj ON pa.project_id = pj.id
                JOIN proposals pr ON pj.proposal_id = pr.id
                JOIN leads l ON pr.lead_id = l.id
                WHERE pa.employee_id = $1 AND pa.assignment_role = 'Project Manager'
                ORDER BY pa.assigned_at DESC
            `, [employeeId]);
            projects = projectsRes.rows;
        }

        // Return separate arrays + combined history for backward compat
        res.json({ roles, leads, projects, history: [...leads, ...projects] });
    } catch (err) {
        next(err);
    }
});

module.exports = router;
