const { eq, asc } = require('drizzle-orm');
const db = require('../config/db');
const { timetable } = require('../db/schema');
const { asyncHandler } = require('../middleware/errorHandler');

const DAY_ORDER = {
    'Monday': 1, 'Tuesday': 2, 'Wednesday': 3,
    'Thursday': 4, 'Friday': 5, 'Saturday': 6, 'Sunday': 7,
};

const getTimetable = asyncHandler(async (req, res) => {
    const { day } = req.query;

    let query = db.select().from(timetable);
    if (day) {
        query = query.where(eq(timetable.day_of_week, day));
    }

    let entries = await query.orderBy(asc(timetable.start_time));

    // Sort by day order then start_time for "all days" view
    if (!day) {
        entries.sort((a, b) => {
            const dayDiff = (DAY_ORDER[a.day_of_week] || 8) - (DAY_ORDER[b.day_of_week] || 8);
            if (dayDiff !== 0) return dayDiff;
            return (a.start_time || '').localeCompare(b.start_time || '');
        });
    }

    res.json({ timetable: entries });
});

const createEntry = asyncHandler(async (req, res) => {
    const { day_of_week, subject_name, subject_code, instructor, room, start_time, end_time } = req.body;
    if (!day_of_week || !subject_name || !start_time || !end_time) {
        return res.status(400).json({ error: 'day_of_week, subject_name, start_time, and end_time are required.' });
    }

    const [entry] = await db.insert(timetable).values({
        day_of_week,
        subject_name,
        subject_code: subject_code || null,
        instructor: instructor || null,
        room: room || null,
        start_time,
        end_time,
    }).returning();

    res.status(201).json({ entry });
});

module.exports = { getTimetable, createEntry };
