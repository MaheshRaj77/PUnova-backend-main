const { Ratelimit } = require('@upstash/ratelimit');
const { Redis } = require('@upstash/redis');

/**
 * Create a custom rate limiter with specific limits
 * @param {number} requests - Number of allowed requests
 * @param {number} window - Time window in milliseconds
 * @returns {Function} Express middleware
 */
function createLimiter(requests = 100, window = 60000) {
  return async (req, res, next) => {
    // Skip if Upstash not configured
    if (!process.env.UPSTASH_REDIS_REST_URL || !process.env.UPSTASH_REDIS_REST_TOKEN) {
      return next();
    }

    try {
      const redis = new Redis({
        url: process.env.UPSTASH_REDIS_REST_URL,
        token: process.env.UPSTASH_REDIS_REST_TOKEN,
      });

      const ratelimit = new Ratelimit({
        redis,
        limiter: Ratelimit.slidingWindow(requests, `${window}ms`),
      });

      const identifier = req.ip || req.headers['x-forwarded-for'] || req.socket.remoteAddress || 'anonymous';
      const { success, limit, remaining, reset, pending } = await ratelimit.limit(identifier);

      res.setHeader('X-RateLimit-Limit', limit);
      res.setHeader('X-RateLimit-Remaining', Math.max(0, remaining));
      res.setHeader('X-RateLimit-Reset', new Date(reset).toISOString());

      if (!success) {
        return res.status(429).json({
          error: 'Too many requests. Please try again later.',
          retryAfter: Math.ceil((reset - Date.now()) / 1000),
        });
      }

      next();
    } catch (err) {
      console.warn('Rate limiter error (allowing request):', err.message);
      next();
    }
  };
}

/**
 * Default rate limiter middleware
 */
const rateLimiter = createLimiter(
  parseInt(process.env.RATE_LIMIT_REQUESTS) || 100,
  parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 60000
);

module.exports = { rateLimiter, createLimiter };
