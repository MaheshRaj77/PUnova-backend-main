const logger = require('../config/logger');

/**
 * Wraps an async route handler to catch errors automatically.
 * @param {Function} fn — async (req, res, next) => ...
 */
const asyncHandler = (fn) => (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
};

/**
 * Global error handler middleware.
 * Logs errors securely and never exposes stack traces in production.
 */
const errorHandler = (err, req, res, _next) => {
    const NODE_ENV = process.env.NODE_ENV || 'development';
    const statusCode = err.statusCode || err.status || 500;
    
    // Log error
    logger.error(err.message || 'Internal server error', err, {
      statusCode,
      path: req.path,
      method: req.method,
      userId: req.user?.id,
    });

    // Production response - never expose details
    if (NODE_ENV === 'production') {
        return res.status(statusCode).json({
            error: statusCode === 500
              ? 'Internal server error. Please try again later.'
              : err.message || 'An error occurred.',
        });
    }

    // Development response - include stack trace for debugging
    res.status(statusCode).json({
        error: err.message || 'Internal server error',
        stack: err.stack,
        ...(req.user && { userId: req.user.id }),
    });
};

module.exports = { asyncHandler, errorHandler };
