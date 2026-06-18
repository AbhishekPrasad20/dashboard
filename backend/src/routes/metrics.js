// backend/src/routes/metrics.js
const express = require('express');
const router = express.Router();
const db = require('../db');
const { authenticateToken } = require('../middleware/auth');

router.use(authenticateToken);

// GET /api/metrics/sales
router.get('/sales', async (req, res, next) => {
    try {
        const result = await db.query('SELECT * FROM sales_performance_metrics ORDER BY total_revenue_secured DESC');
        res.json(result.rows);
    } catch (err) {
        next(err);
    }
});

// GET /api/metrics/company
router.get('/company', async (req, res, next) => {
    try {
        const result = await db.query(`
            SELECT 
                (SELECT COALESCE(SUM(estimated_value), 0) FROM leads l JOIN proposals p ON l.id = p.lead_id WHERE p.status = 'Won') as total_revenue,
                (SELECT COUNT(*) FROM leads) as total_leads,
                (SELECT COUNT(*) FROM proposals WHERE status = 'Won') as total_won,
                (SELECT COUNT(*) FROM projects WHERE status != 'Completed') as active_projects
        `);
        res.json(result.rows[0]);
    } catch (err) {
        next(err);
    }
});

// GET /api/metrics/pm
router.get('/pm', async (req, res, next) => {
    try {
        const result = await db.query('SELECT * FROM pm_performance_metrics ORDER BY invoice_collection_rate DESC');
        res.json(result.rows);
    } catch (err) {
        next(err);
    }
});

module.exports = router;
