const { asc } = require('drizzle-orm');
const db = require('../config/db');
const { events } = require('../db/schema');
const { asyncHandler } = require('../middleware/errorHandler');

const getEvents = asyncHandler(async (req, res) => {
    const rows = await db.select().from(events).orderBy(asc(events.event_date));

    // Convert event_date to ISO string for consistency
    const result = rows.map(e => ({
        ...e,
        event_date: e.event_date?.toISOString() || null,
    }));

    res.json({ events: result });
});

const createEvent = asyncHandler(async (req, res) => {
    const { title, description, event_date, venue, category } = req.body;
    if (!title || !event_date) {
        return res.status(400).json({ error: 'Title and event_date are required.' });
    }

    const [event] = await db.insert(events).values({
        title,
        description: description || null,
        event_date: new Date(event_date),
        venue: venue || null,
        category: category || 'general',
    }).returning();

    res.status(201).json({
        event: {
            ...event,
            event_date: event.event_date?.toISOString() || null,
        },
    });
});

module.exports = { getEvents, createEvent };
