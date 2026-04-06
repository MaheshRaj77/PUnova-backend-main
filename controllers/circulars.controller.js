const { desc } = require('drizzle-orm');
const db = require('../config/db');
const { circulars } = require('../db/schema');
const { asyncHandler } = require('../middleware/errorHandler');
const { invalidateCache } = require('../middleware/cache');

const getCirculars = asyncHandler(async (req, res) => {
    const rows = await db.select().from(circulars).orderBy(desc(circulars.published_date));
    res.json({ circulars: rows });
});

const createCircular = asyncHandler(async (req, res) => {
    const { title, description, is_important } = req.body;
    if (!title) {
        return res.status(400).json({ error: 'Title is required.' });
    }

    const [circular] = await db.insert(circulars).values({
        title,
        description: description || null,
        is_important: is_important || false,
        published_date: new Date().toISOString().split('T')[0],
    }).returning();

    await invalidateCache('cache:/api/v1/circulars');
    res.status(201).json({ circular });
});

module.exports = { getCirculars, createCircular };
