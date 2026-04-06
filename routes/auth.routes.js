const router = require('express').Router();
const { authenticate } = require('../middleware/auth');
const { upload } = require('../middleware/upload');
const {
  register,
  login,
  getProfile,
  updateProfile,
  uploadAvatar,
  changePassword,
  refreshToken,
  logout,
  deleteAccount,
} = require('../controllers/auth.controller');
const { validate } = require('../middleware/validate');

// ── Auth Rate Limiting (Applied globally in server.js, but more strict here) ─
const authLimiter = require('../middleware/rateLimiter').createLimiter(10, 900000); // 10 req/15min

// Validation Schemas
const registerSchema = {
  body: {
    email: { required: true, type: 'email' },
    password: { required: true, type: 'string', minLength: 8 },
    full_name: { required: true, type: 'string', minLength: 2, maxLength: 100 },
    department: { required: false, type: 'string', maxLength: 100 },
    year: { required: false, type: 'string', maxLength: 20 },
    semester: { required: false, type: 'string', maxLength: 10 },
    roll_number: { required: false, type: 'string', maxLength: 50 },
  },
};

const loginSchema = {
  body: {
    email: { required: true, type: 'email' },
    password: { required: true, type: 'string' },
  },
};

const changePasswordSchema = {
  body: {
    current_password: { required: true, type: 'string' },
    new_password: { required: true, type: 'string', minLength: 8 },
  },
};

const updateProfileSchema = {
  body: {
    full_name: { required: false, type: 'string', minLength: 2, maxLength: 100 },
    department: { required: false, type: 'string', maxLength: 100 },
    year: { required: false, type: 'string', maxLength: 20 },
    semester: { required: false, type: 'string', maxLength: 10 },
    roll_number: { required: false, type: 'string', maxLength: 50 },
    bio: { required: false, type: 'string', maxLength: 500 },
  },
};

// ── Public Routes ────────────────────────────────────────────────────
router.post('/register', validate(registerSchema), register);
router.post('/login', validate(loginSchema), login);

// ── One-time role promotion (secured by SEED_PASSWORD env var) ───────
router.post('/setup-roles', async (req, res) => {
  const { secret } = req.body;
  if (!secret || !process.env.SEED_PASSWORD || secret !== process.env.SEED_PASSWORD) {
    return res.status(403).json({ error: 'Forbidden.' });
  }
  try {
    const bcryptSeed = require('bcryptjs');
    const { eq } = require('drizzle-orm');
    const db = require('../config/db');
    const { users } = require('../db/schema');
    const hash = await bcryptSeed.hash(process.env.SEED_PASSWORD, 10);
    const toSeed = [
      ...(process.env.ADMIN_EMAILS || '').split(',').map(e => ({ email: e.trim(), role: 'admin' })),
      ...(process.env.FACULTY_EMAILS || '').split(',').map(e => ({ email: e.trim(), role: 'faculty' })),
    ].filter(u => u.email);
    const results = [];
    for (const u of toSeed) {
      const [existing] = await db.select({ id: users.id }).from(users).where(eq(users.email, u.email));
      if (existing) {
        await db.update(users).set({ role: u.role, password_hash: hash }).where(eq(users.email, u.email));
        results.push({ email: u.email, role: u.role, action: 'updated' });
      } else {
        const namePart = u.email.split('@')[0];
        await db.insert(users).values({ email: u.email, password_hash: hash, full_name: namePart, role: u.role });
        results.push({ email: u.email, role: u.role, action: 'created' });
      }
    }
    return res.json({ success: true, results });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

// ── Token Routes ────────────────────────────────────────────────────
router.post('/refresh-token', refreshToken); // No auth needed for refresh
router.post('/logout', authenticate, logout);

// ── Protected Routes (Requires Authentication) ──────────────────────
router.get('/profile', authenticate, getProfile);
router.put('/profile', authenticate, validate(updateProfileSchema), updateProfile);
router.put('/change-password', authenticate, validate(changePasswordSchema), changePassword);
router.post('/profile/avatar', authenticate, upload.single('avatar'), uploadAvatar);
router.delete('/account', authenticate, deleteAccount);

module.exports = router;
