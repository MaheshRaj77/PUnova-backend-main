const { desc } = require('drizzle-orm');
const db = require('../config/db');
const { circulars } = require('../db/schema');
const { asyncHandler } = require('../middleware/errorHandler');
const { invalidateCache } = require('../middleware/cache');
const { uploadDocumentToCloudinary } = require('../config/cloudinary');

const IMAGE_MIMES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

const getCirculars = asyncHandler(async (req, res) => {
    const rows = await db.select().from(circulars).orderBy(desc(circulars.published_date));
    res.json({ circulars: rows });
});

const createCircular = asyncHandler(async (req, res) => {
    const { title, description, is_important } = req.body;
    if (!title) {
        return res.status(400).json({ error: 'Title is required.' });
    }

    let attachment_url = null;

    // Accept attachment_url directly from JSON body (uploaded by frontend)
    if (req.body.attachment_url) {
        attachment_url = req.body.attachment_url;
    } else if (req.file) {
        const isImage = IMAGE_MIMES.includes(req.file.mimetype);
        if (isImage) {
            // Images: use the standard image uploader with transformations
            const { uploadToCloudinary } = require('../config/cloudinary');
            const result = await uploadToCloudinary(req.file.buffer, 'punova/circulars');
            attachment_url = result.url;
        } else {
            // PDFs / Word / Excel: upload as raw document
            const result = await uploadDocumentToCloudinary(req.file.buffer, 'punova/circulars');
            attachment_url = result.url;
        }
    }

    const [circular] = await db.insert(circulars).values({
        title,
        description: description || null,
        is_important: is_important === 'true' || is_important === true,
        attachment_url,
        published_date: new Date().toISOString().split('T')[0],
    }).returning();

    await invalidateCache('cache:/api/v1/circulars');
    res.status(201).json({ circular });
});

module.exports = { getCirculars, createCircular };
