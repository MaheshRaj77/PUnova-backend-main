const { eq, desc, sql } = require('drizzle-orm');
const db = require('../config/db');
const { lostFoundItems, users } = require('../db/schema');
const { asyncHandler } = require('../middleware/errorHandler');
const { invalidateCache } = require('../middleware/cache');
const { cloudinary } = require('../config/cloudinary');

const getItems = asyncHandler(async (req, res) => {
    const { type } = req.query;

    let query = db.select({
        id: lostFoundItems.id,
        reported_by: lostFoundItems.reported_by,
        item_type: lostFoundItems.item_type,
        title: lostFoundItems.title,
        description: lostFoundItems.description,
        category: lostFoundItems.category,
        item_name: lostFoundItems.item_name,
        location: lostFoundItems.location,
        found_lost_date: lostFoundItems.found_lost_date,
        contact_info: lostFoundItems.contact_info,
        image_url: lostFoundItems.image_url,
        status: lostFoundItems.status,
        created_at: lostFoundItems.created_at,
        updated_at: lostFoundItems.updated_at,
        reporter_name: users.full_name,
    })
    .from(lostFoundItems)
    .leftJoin(users, eq(lostFoundItems.reported_by, users.id));

    if (type && (type === 'lost' || type === 'found')) {
        query = query.where(eq(lostFoundItems.item_type, type));
    }

    const rows = await query.orderBy(desc(lostFoundItems.created_at));

    // Format dates
    const items = rows.map(item => ({
        ...item,
        found_lost_date: item.found_lost_date ? item.found_lost_date.toISOString() : null,
    }));

    res.json({ items });
});

const createItem = asyncHandler(async (req, res) => {
    const { item_type, title, description, category, item_name, location, found_lost_date, contact_info } = req.body;
    if (!item_type || !title || !description) {
        return res.status(400).json({ error: 'item_type, title, and description are required.' });
    }

    let image_url = null;
    if (req.file) {
        const b64 = req.file.buffer.toString('base64');
        const dataURI = `data:${req.file.mimetype};base64,${b64}`;
        const result = await cloudinary.uploader.upload(dataURI, {
            folder: 'campus_connect/lost_found',
        });
        image_url = result.secure_url;
    }

    const [item] = await db.insert(lostFoundItems).values({
        reported_by: req.user.id,
        item_type,
        title,
        description,
        category: category || 'general',
        item_name: item_name || null,
        location: location || null,
        found_lost_date: found_lost_date ? new Date(found_lost_date) : null,
        contact_info: contact_info || null,
        image_url,
    }).returning();

    await invalidateCache('cache:/api/v1/lost-found');
    res.status(201).json({
        item: {
            ...item,
            found_lost_date: item.found_lost_date ? item.found_lost_date.toISOString() : null,
        },
    });
});

const updateItemStatus = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { status } = req.body;
    if (!status) {
        return res.status(400).json({ error: 'status is required.' });
    }

    const [item] = await db.update(lostFoundItems)
        .set({ status, updated_at: new Date() })
        .where(eq(lostFoundItems.id, id))
        .returning();

    if (!item) {
        return res.status(404).json({ error: 'Item not found.' });
    }

    await invalidateCache('cache:/api/v1/lost-found');
    res.json({
        item: {
            ...item,
            found_lost_date: item.found_lost_date ? item.found_lost_date.toISOString() : null,
        },
    });
});

module.exports = { getItems, createItem, updateItemStatus };
