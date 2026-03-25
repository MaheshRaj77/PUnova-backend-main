require('dotenv').config();

// ── Environment Validation (MUST run before everything) ──────────────
const { validateEnvironment } = require('./config/env.validation');
validateEnvironment();

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const { rateLimiter } = require('./middleware/rateLimiter');
const { errorHandler } = require('./middleware/errorHandler');
const logger = require('./config/logger');

// Import db to trigger connection log on startup
require('./config/db');

const app = express();
const PORT = process.env.PORT || 3000;
const NODE_ENV = process.env.NODE_ENV || 'development';

// ── Security: CORS Configuration with Whitelist ──────────────────────
const allowedOrigins = (process.env.ALLOWED_ORIGINS || 'http://localhost:3000')
  .split(',')
  .map(origin => origin.trim());

const corsOptions = {
  origin: (origin, callback) => {
    // Allow requests with no origin (like mobile apps)
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  optionsSuccessStatus: 200,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
};

// ── Core Middleware ──────────────────────────────────────────────
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", 'data:', 'https:'],
    },
  },
}));
app.use(cors(corsOptions));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// ── Rate Limiting (Upstash Redis) ────────────────────────────────
app.use(rateLimiter);

// ── Health Check ─────────────────────────────────────────────────
app.get('/api/v1/health', (req, res) => {
    res.json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      environment: NODE_ENV,
      uptime: process.uptime(),
    });
});

// ── API Routes ───────────────────────────────────────────────────
app.use('/api/v1/auth', require('./routes/auth.routes'));
app.use('/api/v1/forum', require('./routes/forum.routes'));
app.use('/api/v1/events', require('./routes/events.routes'));
app.use('/api/v1/circulars', require('./routes/circulars.routes'));
app.use('/api/v1/alerts', require('./routes/alerts.routes'));
app.use('/api/v1/lost-found', require('./routes/lostfound.routes'));
app.use('/api/v1/timetable', require('./routes/timetable.routes'));
app.use('/api/v1/results', require('./routes/results.routes'));
app.use('/api/v1/services', require('./routes/services.routes'));app.use('/api/v1/reports', require('./routes/reports.routes')); // ✅ NEW
// ── 404 ──────────────────────────────────────────────────────────
app.use((req, res) => {
    res.status(404).json({ error: 'Route not found' });
});

// ── Global Error Handler ─────────────────────────────────────────
app.use(errorHandler);

// ── Start Server (Neon is serverless — no connection step needed) ─
app.listen(PORT, () => {
    logger.info(`🚀 PUnova API Server Started`, {
      port: PORT,
      environment: NODE_ENV,
      uptime: process.uptime(),
    });
    logger.info(`📋 Health Check: http://localhost:${PORT}/api/v1/health`);
    logger.info(`💾 Database: Connected to PostgreSQL (Neon)`);
    logger.info(`📍 CORS Origins: ${allowedOrigins.join(', ')}`);
});

module.exports = app;
