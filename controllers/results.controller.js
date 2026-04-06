const { eq, and, asc } = require('drizzle-orm');
const db = require('../config/db');
const { results } = require('../db/schema');
const { asyncHandler } = require('../middleware/errorHandler');
const { invalidateCache } = require('../middleware/cache');

const getResults = asyncHandler(async (req, res) => {
    const userId = req.user.id;
    const { semester } = req.query;

    const conditions = [eq(results.user_id, userId)];
    if (semester) {
        conditions.push(eq(results.semester, parseInt(semester, 10)));
    }

    const rows = await db.select().from(results).where(and(...conditions)).orderBy(asc(results.semester));

    // Group by semester and calculate GPA
    const grouped = {};
    rows.forEach(r => {
        if (!grouped[r.semester]) grouped[r.semester] = [];
        grouped[r.semester].push(r);
    });

    const semesters = Object.keys(grouped).sort((a, b) => a - b).map(sem => {
        const subjects = grouped[sem];
        let totalCredits = 0;
        let totalPoints = 0;
        subjects.forEach(s => {
            totalCredits += s.credits || 0;
            totalPoints += (s.grade_point || 0) * (s.credits || 0);
        });
        const gpa = totalCredits > 0 ? (totalPoints / totalCredits).toFixed(2) : '0.00';
        return { semester: parseInt(sem, 10), subjects, gpa: parseFloat(gpa) };
    });

    res.json({ semesters });
});

const addResult = asyncHandler(async (req, res) => {
    const { semester, subject_code, subject_name, credits, grade, grade_point } = req.body;
    if (!semester || !subject_code || !subject_name) {
        return res.status(400).json({ error: 'semester, subject_code, and subject_name are required.' });
    }

    const [result] = await db.insert(results).values({
        user_id: req.user.id,
        semester: parseInt(semester, 10),
        subject_code,
        subject_name,
        credits: credits ? parseInt(credits, 10) : 0,
        grade: grade || null,
        grade_point: grade_point ? parseFloat(grade_point) : 0,
    }).returning();

    await invalidateCache('cache:/api/v1/results');
    res.status(201).json({ result });
});

module.exports = { getResults, addResult };
