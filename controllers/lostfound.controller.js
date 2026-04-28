const { eq, desc, sql } = require('drizzle-orm');
const db = require('../config/db');
const { lostFoundItems, users } = require('../db/schema');
const { asyncHandler } = require('../middleware/errorHandler');
const { invalidateCache } = require('../middleware/cache');
const { cloudinary, uploadToCloudinary, uploadDocumentToCloudinary } = require('../config/cloudinary');
const logger = require('../config/logger');

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
        try {
            // Prefer streaming upload helpers for buffers (handles images and documents)
            const isImage = /^image\//.test(req.file.mimetype || '');
            if (isImage) {
                const result = await uploadToCloudinary(req.file.buffer, 'campus_connect/lost_found');
                image_url = result.url || result.secure_url || null;
            } else {
                const result = await uploadDocumentToCloudinary(req.file.buffer, 'campus_connect/lost_found');
                image_url = result.url || result.secure_url || null;
            }
        } catch (err) {
            console.error('LostFound: Cloudinary upload failed:', err && err.message ? err.message : err);
            // Surface a clearer client error rather than an opaque 500 when uploads fail
            return res.status(502).json({ error: 'File upload failed. Please try again later.' });
        }
    }

    let item;
    try {
        const resInsert = await db.insert(lostFoundItems).values({
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
        item = resInsert[0];
    } catch (err) {
        logger.error('LostFound: DB insert failed', err, { userId: req.user?.id });
        return res.status(500).json({ error: 'Unable to save lost/found item. Please try again later.' });
    }

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

    let updatedItem;
    try {
        const resUpdate = await db.update(lostFoundItems)
            .set({ status, updated_at: new Date() })
            .where(eq(lostFoundItems.id, id))
            .returning();
        updatedItem = resUpdate[0];
    } catch (err) {
        logger.error('LostFound: DB update failed', err, { itemId: id, userId: req.user?.id });
        return res.status(500).json({ error: 'Unable to update item status. Please try again later.' });
    }

    if (!updatedItem) {
        return res.status(404).json({ error: 'Item not found.' });
    }

    await invalidateCache('cache:/api/v1/lost-found');
    res.json({
        item: {
            ...updatedItem,
            found_lost_date: updatedItem.found_lost_date ? updatedItem.found_lost_date.toISOString() : null,
        },
    });
});

module.exports = { getItems, createItem, updateItemStatus };
