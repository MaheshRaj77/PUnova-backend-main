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
