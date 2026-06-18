// backend/src/index.js
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

if (!process.env.JWT_SECRET) {
    console.error('FATAL ERROR: JWT_SECRET is not defined in environment variables.');
    process.exit(1);
}
if (!process.env.DB_PASSWORD) {
    console.error('FATAL ERROR: DB_PASSWORD is not defined in environment variables.');
    process.exit(1);
}
if (!process.env.DB_USER) {
    console.error('FATAL ERROR: DB_USER is not defined in environment variables.');
    process.exit(1);
}

const metricsRoutes = require('./routes/metrics');
const employeeRoutes = require('./routes/employees');
const manageRoutes = require('./routes/manage');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(helmet());
app.use(cors({
    origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
    methods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json({ limit: '10kb' }));

const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 1000, // limit each IP to 1000 requests per windowMs
    message: { error: 'Too many requests from this IP, please try again after 15 minutes' }
});

const loginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 10, // 10 failed login attempts
    message: { error: 'Too many login attempts, please try again after 15 minutes' }
});

app.use('/api/manage/login', loginLimiter);
app.use('/api', apiLimiter);

// Routes
app.use('/api/metrics', metricsRoutes);
app.use('/api/employees', employeeRoutes);
app.use('/api/manage', manageRoutes);

// Health check
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok' });
});

// 404 catch-all
app.use((req, res) => {
    res.status(404).json({ error: 'Endpoint not found' });
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ error: 'Internal Server Error' });
});

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
