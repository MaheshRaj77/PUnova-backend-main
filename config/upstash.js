const { Redis } = require('@upstash/redis');
const { Ratelimit } = require('@upstash/ratelimit');

// Upstash Redis client
const redis = new Redis({
    url: process.env.UPSTASH_REDIS_REST_URL,
    token: process.env.UPSTASH_REDIS_REST_TOKEN,
});

// Rate limiter: 100 requests per 60 seconds (sliding window)
const ratelimit = new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(100, '60 s'),
    analytics: true,
});

module.exports = { redis, ratelimit };
