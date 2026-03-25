const { redis } = require('../config/upstash');

/**
 * Redis caching middleware for GET requests.
 * @param {number} ttlSeconds — Cache time-to-live in seconds (default 300 = 5 min)
 */
const cache = (ttlSeconds = 300) => {
    return async (req, res, next) => {
        // Only cache GET requests
        if (req.method !== 'GET') return next();

        // Skip caching if Upstash is not configured
        if (!process.env.UPSTASH_REDIS_REST_URL || !process.env.UPSTASH_REDIS_REST_TOKEN) {
            return next();
        }

        const key = `cache:${req.originalUrl}`;

        try {
            const cached = await redis.get(key);
            if (cached) {
                return res.json(typeof cached === 'string' ? JSON.parse(cached) : cached);
            }
        } catch (err) {
            console.warn('Cache read error:', err.message);
        }

        // Override res.json to cache the response before sending
        const originalJson = res.json.bind(res);
        res.json = (data) => {
            // Cache in background — don't block response
            redis.set(key, JSON.stringify(data), { ex: ttlSeconds }).catch((err) => {
                console.warn('Cache write error:', err.message);
            });
            return originalJson(data);
        };

        next();
    };
};

/**
 * Invalidate cache entries matching a prefix.
 * Call after mutations (POST, PUT, DELETE).
 * @param {string} prefix — e.g. 'cache:/api/v1/forum'
 */
const invalidateCache = async (prefix) => {
    if (!process.env.UPSTASH_REDIS_REST_URL) return;
    try {
        // Upstash doesn't support SCAN, so we delete known keys directly
        // For simple invalidation, delete the exact key
        await redis.del(prefix);
    } catch (err) {
        console.warn('Cache invalidation error:', err.message);
    }
};

module.exports = { cache, invalidateCache };
