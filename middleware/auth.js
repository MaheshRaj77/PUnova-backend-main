const jwt = require('jsonwebtoken');

/**
 * JWT authentication middleware.
 * Expects header: Authorization: Bearer <token>
 * Attaches decoded user to req.user
 */
const authenticate = (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'Access denied. No token provided.' });
    }

    const token = authHeader.split(' ')[1];
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded;
        next();
    } catch (err) {
        return res.status(401).json({ error: 'Invalid or expired token.' });
    }
};

/**
 * Optional auth — attaches user if token exists, but doesn't block.
 */
const optionalAuth = (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
        try {
            req.user = jwt.verify(authHeader.split(' ')[1], process.env.JWT_SECRET);
        } catch (_) {
            // Token invalid — continue without user
        }
    }
    next();
};

module.exports = { authenticate, optionalAuth };
