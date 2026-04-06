const { eq, desc } = require('drizzle-orm');
const db = require('../config/db');
const { alerts } = require('../db/schema');
const { asyncHandler } = require('../middleware/errorHandler');
const { invalidateCache } = require('../middleware/cache');

const getAlerts = asyncHandler(async (req, res) => {
    const { category } = req.query;

    let query = db.select().from(alerts);
    if (category && category !== 'all') {
        query = query.where(eq(alerts.category, category));
    }

    const rows = await query.orderBy(desc(alerts.created_at));
    res.json({ alerts: rows });
});

const createAlert = asyncHandler(async (req, res) => {
    const { title, description, category, priority } = req.body;
    if (!title || !category) {
        return res.status(400).json({ error: 'Title and category are required.' });
    }

    const [alert] = await db.insert(alerts).values({
        title,
        description: description || null,
        category,
        priority: priority || 'normal',
    }).returning();

    await invalidateCache('cache:/api/v1/alerts');
    res.status(201).json({ alert });
});

module.exports = { getAlerts, createAlert };
