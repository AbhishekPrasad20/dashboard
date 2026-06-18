const jwt = require('jsonwebtoken');
const db = require('../db');

const authenticateToken = async (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) return res.status(401).json({ error: 'Access denied. No token provided.' });

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        
        const result = await db.query(`
            SELECT e.is_active, 
                   COALESCE(array_agg(er.role::varchar) FILTER (WHERE er.role IS NOT NULL), ARRAY[]::varchar[]) AS system_roles 
            FROM employees e 
            LEFT JOIN employee_roles er ON e.id = er.employee_id 
            WHERE e.id = $1 
            GROUP BY e.id
        `, [decoded.id]);

        if (result.rows.length === 0 || !result.rows[0].is_active) {
            return res.status(403).json({ error: 'Account deactivated or deleted.' });
        }

        req.user = {
            id: decoded.id,
            email: decoded.email,
            system_roles: result.rows[0].system_roles
        };
        next();
    } catch (err) {
        return res.status(403).json({ error: 'Invalid or expired token.' });
    }
};

const requireRole = (role) => {
    return (req, res, next) => {
        if (!req.user || !req.user.system_roles) {
            return res.status(403).json({ error: 'Access denied. User role not found.' });
        }
        
        if (req.user.system_roles.includes(role)) {
            next();
        } else {
            res.status(403).json({ error: `Access denied. Requires ${role} role.` });
        }
    };
};

module.exports = {
    authenticateToken,
    requireRole
};
