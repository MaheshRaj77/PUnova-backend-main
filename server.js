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
const allowedOrigins = (process.env.ALLOWED_ORIGINS || '')
      .split(',')
      .map(origin => origin.trim())
      .filter(Boolean);

const corsOptions = {
  origin: (origin, callback) => {
    // Allow requests with no origin (mobile apps, curl, server-to-server)
    // Allow all origins if none are configured
    if (!origin || allowedOrigins.length === 0 || allowedOrigins.includes('*') || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(null, false);
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
// ── Database Status Check (Admin only, not exposed publicly) ─────────
app.get('/api/v1/db-status', require('./middleware/auth').authenticate, async (req, res) => {
    if (req.user.role !== 'admin') {
        return res.status(403).json({ error: 'Forbidden.' });
    }
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

    // ── Seed admin / faculty accounts from env vars ───────────────────
    // ADMIN_EMAILS and FACULTY_EMAILS are comma-separated lists.
    // SEED_PASSWORD is the shared password for all seeded accounts.
    try {
      const seedPassword = process.env.SEED_PASSWORD;
      if (seedPassword) {
        const bcryptSeed = require('bcryptjs');
        const { eq: eqSeed } = require('drizzle-orm');
        const dbSeed = require('./config/db');
        const { users: usersTable } = require('./db/schema');

        const toSeed = [
          ...(process.env.ADMIN_EMAILS || '').split(',').map(e => ({ email: e.trim(), role: 'admin' })),
          ...(process.env.FACULTY_EMAILS || '').split(',').map(e => ({ email: e.trim(), role: 'faculty' })),
        ].filter(u => u.email);

        if (toSeed.length) {
          const hash = await bcryptSeed.hash(seedPassword, 10);
          for (const u of toSeed) {
            const [existing] = await dbSeed.select({ id: usersTable.id }).from(usersTable).where(eqSeed(usersTable.email, u.email));
            if (existing) {
              await dbSeed.update(usersTable).set({ role: u.role, password_hash: hash }).where(eqSeed(usersTable.email, u.email));
              logger.info(`✅ Promoted ${u.email} → ${u.role}`);
            } else {
              const namePart = u.email.split('@')[0];
              await dbSeed.insert(usersTable).values({ email: u.email, password_hash: hash, full_name: namePart, role: u.role });
              logger.info(`✅ Created ${u.role} account: ${u.email}`);
            }
          }
        }
      }
    } catch (seedErr) {
      logger.error('⚠️  Admin seed error:', seedErr.message);
    }
});

module.exports = app;
