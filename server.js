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
const HOST = process.env.HOST || '0.0.0.0';  // ✅ Listen on all interfaces
const NODE_ENV = process.env.NODE_ENV || 'development';

// ── Security: CORS Configuration with Whitelist ──────────────────────
const allowedOrigins = NODE_ENV === 'development'
  ? ['*']  // In development: Allow all origins (including IP addresses)
  : (process.env.ALLOWED_ORIGINS || 'http://localhost:3000')
      .split(',')
      .map(origin => origin.trim());

const corsOptions = {
  origin: (origin, callback) => {
    // Development: Allow all origins
    if (NODE_ENV === 'development') {
      callback(null, true);
    }
    // Production: Allow requests with no origin (like mobile apps) or whitelisted origins
    else if (!origin || allowedOrigins.includes(origin)) {
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
// ── Database Status Check (For Debugging) ────────────────────────
app.get('/api/v1/db-status', async (req, res) => {
    try {
      const dbInstance = require('./config/db');
      // Try to query the users table to verify it exists
      const result = await dbInstance.select().from(require('./db/schema').users).limit(1);
      res.json({
        status: 'connected',
        database: 'Supabase PostgreSQL',
        tables_accessible: true,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      logger.error('Database check failed', error);
      res.status(500).json({
        status: 'error',
        database: 'Supabase PostgreSQL',
        error: error.message,
        timestamp: new Date().toISOString(),
      });
    }
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
app.use('/api/v1/services', require('./routes/services.routes'));
app.use('/api/v1/reports', require('./routes/reports.routes'));
// ── 404 ──────────────────────────────────────────────────────────
app.use((req, res) => {
    res.status(404).json({ error: 'Route not found' });
});

// ── Global Error Handler ─────────────────────────────────────────
app.use(errorHandler);

// ── Start Server (Listen on all interfaces for external access) ─
app.listen(PORT, HOST, async () => {
    logger.info(`🚀 PUnova API Server Started`, {
      host: HOST,
      port: PORT,
      environment: NODE_ENV,
      uptime: process.uptime(),
    });
    logger.info(`📋 Health Check: http://localhost:${PORT}/api/v1/health`);
    logger.info(`💾 Database: Connected to PostgreSQL (Supabase)`);
    logger.info(`📍 CORS Origins: ${allowedOrigins.join(', ')}`);
    
    // ── Run migrations if DB is fresh ────────────────────────────────
    if (NODE_ENV === 'production') {
      try {
        // Try to check if tables exist
        const dbInstance = require('./config/db');
        const { users } = require('./db/schema');
        await dbInstance.select().from(users).limit(1);
        logger.info('✅ Database schema verified - tables exist');
      } catch (err) {
        logger.warn('⚠️  Database tables may not exist, attempting migration...');
        try {
          const { execSync } = require('child_process');
          execSync('npm run migrate', { stdio: 'inherit' });
          logger.info('✅ Database migration completed');
        } catch (migError) {
          logger.error('❌ Failed to run migration:', migError.message);
        }
      }
    }
});

module.exports = app;
