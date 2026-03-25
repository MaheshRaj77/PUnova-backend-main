const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { eq } = require('drizzle-orm');
const db = require('../config/db');
const { users } = require('../db/schema');
const { uploadToCloudinary, deleteFromCloudinary } = require('../config/cloudinary');
const { asyncHandler } = require('../middleware/errorHandler');

// ── Validation Helpers ───────────────────────────────────────────────
function validateEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

function validatePassword(password) {
  // Require: min 8 chars, uppercase, lowercase, digit, special char
  if (password.length < 8) return 'Password must be at least 8 characters';
  if (!/[A-Z]/.test(password)) return 'Password must contain an uppercase letter';
  if (!/[a-z]/.test(password)) return 'Password must contain a lowercase letter';
  if (!/\d/.test(password)) return 'Password must contain a number';
  if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
    return 'Password must contain a special character';
  }
  return null;
}

// Helper to strip sensitive fields from user row
function sanitizeUser(row) {
    if (!row) return null;
    const { password_hash, avatar_public_id, ...safe } = row;
    return safe;
}

const register = asyncHandler(async (req, res) => {
    const { email, password, full_name, department, year, semester, roll_number } = req.body;

    // Validate inputs
    if (!email || !password || !full_name) {
        return res.status(400).json({ error: 'Email, password, and full_name are required.' });
    }

    // Validate email format
    if (!validateEmail(email)) {
        return res.status(400).json({ error: 'Invalid email format.' });
    }

    // Validate password strength
    const passwordValidationError = validatePassword(password);
    if (passwordValidationError) {
        return res.status(400).json({ error: passwordValidationError });
    }

    // Validate full_name length
    if (full_name.length < 2 || full_name.length > 100) {
        return res.status(400).json({ error: 'Full name must be between 2 and 100 characters.' });
    }

    // Check if email already exists
    const [existing] = await db.select({ id: users.id }).from(users).where(eq(users.email, email.toLowerCase()));
    if (existing) {
        return res.status(409).json({ error: 'Email already registered.' });
    }

    const password_hash = await bcrypt.hash(password, 10);

    const [user] = await db.insert(users).values({
        email: email.toLowerCase(),
        password_hash,
        full_name,
        department: department || null,
        year: year || null,
        semester: semester || null,
        roll_number: roll_number || null,
        role: 'student', // Default role
    }).returning();

    // Generate tokens
    const accessToken = jwt.sign(
        { id: user.id, email: user.email, role: user.role },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRY || '7d' }
    );

    const refreshToken = jwt.sign(
        { id: user.id, email: user.email },
        process.env.REFRESH_TOKEN_SECRET,
        { expiresIn: process.env.REFRESH_TOKEN_EXPIRY || '30d' }
    );

    res.status(201).json({
      user: sanitizeUser(user),
      accessToken,
      refreshToken,
    });
});

const login = asyncHandler(async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ error: 'Email and password are required.' });
    }

    if (!validateEmail(email)) {
        return res.status(400).json({ error: 'Invalid email format.' });
    }

    const [user] = await db.select().from(users).where(eq(users.email, email.toLowerCase()));
    if (!user) {
        return res.status(401).json({ error: 'Invalid email or password.' });
    }

    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) {
        return res.status(401).json({ error: 'Invalid email or password.' });
    }

    // Generate tokens
    const accessToken = jwt.sign(
        { id: user.id, email: user.email, role: user.role },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRY || '7d' }
    );

    const refreshToken = jwt.sign(
        { id: user.id, email: user.email },
        process.env.REFRESH_TOKEN_SECRET,
        { expiresIn: process.env.REFRESH_TOKEN_EXPIRY || '30d' }
    );

    res.json({
      user: sanitizeUser(user),
      accessToken,
      refreshToken,
    });
});

const getProfile = asyncHandler(async (req, res) => {
    const [user] = await db.select().from(users).where(eq(users.id, req.user.id));
    if (!user) {
        return res.status(404).json({ error: 'User not found.' });
    }

    res.json({ user: sanitizeUser(user) });
});

const updateProfile = asyncHandler(async (req, res) => {
    const { full_name, department, year, semester, roll_number, bio } = req.body;

    const updates = {};
    if (full_name) updates.full_name = full_name;
    if (department) updates.department = department;
    if (year) updates.year = year;
    if (semester) updates.semester = semester;
    if (roll_number) updates.roll_number = roll_number;
    if (bio !== undefined) updates.bio = bio;
    updates.updated_at = new Date();

    const [user] = await db.update(users).set(updates).where(eq(users.id, req.user.id)).returning();
    if (!user) {
        return res.status(404).json({ error: 'User not found.' });
    }

    res.json({ user: sanitizeUser(user) });
});

const uploadAvatar = asyncHandler(async (req, res) => {
    if (!req.file) {
        return res.status(400).json({ error: 'No image file provided.' });
    }

    const [user] = await db.select().from(users).where(eq(users.id, req.user.id));
    if (!user) {
        return res.status(404).json({ error: 'User not found.' });
    }

    if (user.avatar_public_id) {
        await deleteFromCloudinary(user.avatar_public_id).catch(() => {});
    }

    const { url, publicId } = await uploadToCloudinary(req.file.buffer, 'punova/avatars');

    const [updated] = await db.update(users).set({
        avatar_url: url,
        avatar_public_id: publicId,
        updated_at: new Date(),
    }).where(eq(users.id, req.user.id)).returning();

    res.json({ user: sanitizeUser(updated) });
});

const changePassword = asyncHandler(async (req, res) => {
    const { current_password, new_password } = req.body;

    if (!current_password || !new_password) {
        return res.status(400).json({ error: 'current_password and new_password are required.' });
    }

    // Validate new password strength
    const passwordValidationError = validatePassword(new_password);
    if (passwordValidationError) {
        return res.status(400).json({ error: passwordValidationError });
    }

    const [user] = await db.select().from(users).where(eq(users.id, req.user.id));
    if (!user) {
        return res.status(404).json({ error: 'User not found.' });
    }

    const valid = await bcrypt.compare(current_password, user.password_hash);
    if (!valid) {
        return res.status(401).json({ error: 'Current password is incorrect.' });
    }

    await db.update(users).set({
        password_hash: await bcrypt.hash(new_password, 10),
        updated_at: new Date(),
    }).where(eq(users.id, req.user.id));

    res.json({ message: 'Password changed successfully.' });
});

// ── NEW: Refresh Token Endpoint ──────────────────────────────────────
const refreshToken = asyncHandler(async (req, res) => {
    const { refreshToken: token } = req.body;

    if (!token) {
        return res.status(400).json({ error: 'Refresh token is required.' });
    }

    try {
        const decoded = jwt.verify(token, process.env.REFRESH_TOKEN_SECRET);

        // Generate new access token
        const accessToken = jwt.sign(
            { id: decoded.id, email: decoded.email },
            process.env.JWT_SECRET,
            { expiresIn: process.env.JWT_EXPIRY || '7d' }
        );

        // Generate new refresh token
        const newRefreshToken = jwt.sign(
            { id: decoded.id, email: decoded.email },
            process.env.REFRESH_TOKEN_SECRET,
            { expiresIn: process.env.REFRESH_TOKEN_EXPIRY || '30d' }
        );

        res.json({ accessToken, refreshToken: newRefreshToken });
    } catch (error) {
        res.status(401).json({ error: 'Invalid or expired refresh token.' });
    }
});

// ── NEW: Logout Endpoint ─────────────────────────────────────────────
const logout = asyncHandler(async (req, res) => {
    // Token blacklisting would go here if using a cache
    // For now, logout is handled on frontend by clearing tokens
    res.json({ message: 'Logged out successfully. Please clear tokens on client.' });
});

// ── NEW: Delete Account Endpoint ─────────────────────────────────────
const deleteAccount = asyncHandler(async (req, res) => {
    const { password } = req.body;

    if (!password) {
        return res.status(400).json({ error: 'Password is required to delete account.' });
    }

    const [user] = await db.select().from(users).where(eq(users.id, req.user.id));
    if (!user) {
        return res.status(404).json({ error: 'User not found.' });
    }

    // Verify password before deletion
    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) {
        return res.status(401).json({ error: 'Invalid password.' });
    }

    // Delete user avatar if exists
    if (user.avatar_public_id) {
        await deleteFromCloudinary(user.avatar_public_id).catch(() => {});
    }

    // Delete user from database
    await db.delete(users).where(eq(users.id, req.user.id));

    res.json({ message: 'Account deleted successfully.' });
});

module.exports = {
    register,
    login,
    getProfile,
    updateProfile,
    uploadAvatar,
    changePassword,
    refreshToken,
    logout,
    deleteAccount,
};
