const { eq, asc } = require('drizzle-orm');
const db = require('../config/db');
const { services } = require('../db/schema');
const { asyncHandler } = require('../middleware/errorHandler');

const getServices = asyncHandler(async (req, res) => {
    const rows = await db.select().from(services)
        .where(eq(services.is_active, true))
        .orderBy(asc(services.sort_order));

    res.json({ services: rows });
});

const createService = asyncHandler(async (req, res) => {
    const { name, description, category, contact_info, location, website_url, timings, sort_order, icon_name, subtitle, gradient_start, gradient_end } = req.body;
    if (!name) {
        return res.status(400).json({ error: 'Service name is required.' });
    }

    const [service] = await db.insert(services).values({
        name,
        description: description || null,
        category: category || 'general',
        contact_info: contact_info || null,
        location: location || null,
        website_url: website_url || null,
        timings: timings || null,
        sort_order: sort_order ? parseInt(sort_order, 10) : 0,
        icon_name: icon_name || null,
        subtitle: subtitle || null,
        gradient_start: gradient_start || null,
        gradient_end: gradient_end || null,
    }).returning();

    res.status(201).json({ service });
});

module.exports = { getServices, createService };
