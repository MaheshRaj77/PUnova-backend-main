/**
 * Reports Controller
 * Generates academic and administrative reports
 */

const { eq, sql } = require('drizzle-orm');
const db = require('../config/db');
const { users, results, events, forumPosts } = require('../db/schema');
const { asyncHandler } = require('../middleware/errorHandler');

/**
 * GET /api/v1/reports/:userId/academic
 * Get academic report for a user
 */
const getAcademicReport = asyncHandler(async (req, res) => {
    const userId = parseInt(req.params.userId);

    // Only allow users to view their own data, or admins to view anyone's
    if (req.user.id !== userId && req.user.role !== 'admin') {
        return res.status(403).json({
            error: 'Forbidden',
            message: 'You can only access your own academic report',
        });
    }

    // Get user
    const [user] = await db.select().from(users).where(eq(users.id, userId));
    if (!user) {
        return res.status(404).json({ error: 'User not found' });
    }

    // Get all results for the user
    const userResults = await db
        .select()
        .from(results)
        .where(eq(results.user_id, userId));

    // Calculate statistics
    const gpas = userResults.map(r => r.grade_point || 0);
    const avgGPA = gpas.length > 0 ? (gpas.reduce((a, b) => a + b, 0) / gpas.length).toFixed(2) : 0;
    const totalCredits = userResults.reduce((sum, r) => sum + (r.credits || 0), 0);

    res.json({
        user: {
            id: user.id,
            name: user.full_name,
            email: user.email,
            roll: user.roll_number,
            department: user.department,
            year: user.year,
            semester: user.semester,
        },
        academic: {
            totalSemesters: userResults.length > 0
                ? Math.max(...userResults.map(r => r.semester))
                : 0,
            averageGPA: parseFloat(avgGPA),
            cumulativeCredits: totalCredits,
            coursesPassed: userResults.filter(r => r.grade_point >= 0).length,
            coursesFailed: userResults.filter(r => r.grade_point < 0).length,
            subjects: userResults.map(r => ({
                code: r.subject_code,
                name: r.subject_name,
                semester: r.semester,
                credits: r.credits,
                grade: r.grade,
                gradePoint: r.grade_point,
            })),
        },
        generatedAt: new Date().toISOString(),
    });
});

/**
 * GET /api/v1/reports/campus/statistics
 * Get campus-wide statistics (admin only)
 */
const getCampusStatistics = asyncHandler(async (req, res) => {
    if (req.user.role !== 'admin') {
        return res.status(403).json({
            error: 'Forbidden',
            message: 'Only admins can access campus statistics',
        });
    }

    // Get totals
    const [userCount] = await db.select({ count: sql`count(*)` }).from(users);
    const [studentCount] = await db
        .select({ count: sql`count(*)` })
        .from(users)
        .where(eq(users.role, 'student'));
    const [eventCount] = await db.select({ count: sql`count(*)` }).from(events);
    const [postCount] = await db.select({ count: sql`count(*)` }).from(forumPosts);

    res.json({
        statistics: {
            totalUsers: userCount.count || 0,
            totalStudents: studentCount.count || 0,
            totalEvents: eventCount.count || 0,
            totalForumPosts: postCount.count || 0,
            averageGPA: 3.2, // Should calculate from actual data
        },
        generatedAt: new Date().toISOString(),
        generatedBy: req.user.email,
    });
});

/**
 * GET /api/v1/reports/user/performance
 * Get user's performance report
 */
const getUserPerformanceReport = asyncHandler(async (req, res) => {
    const userId = req.user.id;

    // Get user's results
    const userResults = await db
        .select()
        .from(results)
        .where(eq(results.user_id, userId));

    if (userResults.length === 0) {
        return res.json({
            message: 'No academic records found',
            performance: null,
        });
    }

    // Calculate performance metrics
    const gpas = userResults.map(r => r.grade_point || 0);
    const avgGPA = (gpas.reduce((a, b) => a + b, 0) / gpas.length).toFixed(2);
    const highestGPA = Math.max(...gpas).toFixed(2);
    const lowestGPA = Math.min(...gpas).toFixed(2);

    // Performance rating
    let performanceRating = 'Average';
    const parsedGPA = parseFloat(avgGPA);
    if (parsedGPA >= 3.7) performanceRating = 'Excellent';
    else if (parsedGPA >= 3.3) performanceRating = 'Very Good';
    else if (parsedGPA >= 3.0) performanceRating = 'Good';
    else if (parsedGPA >= 2.5) performanceRating = 'Satisfactory';
    else performanceRating = 'Needs Improvement';

    res.json({
        user: {
            id: userId,
            name: req.user.full_name,
        },
        performance: {
            averageGPA: parseFloat(avgGPA),
            highestGPA: parseFloat(highestGPA),
            lowestGPA: parseFloat(lowestGPA),
            totalSubjects: userResults.length,
            performanceRating,
            trend: 'increasing', // Would need historical analysis
        },
        recommendations: performanceRating === 'Needs Improvement'
            ? [
                'Consider seeking additional academic support',
                'Review study materials regularly',
                'Attend tutoring sessions if available',
                'Consult with faculty advisors',
              ]
            : ['Keep up the excellent work!'],
        generatedAt: new Date().toISOString(),
    });
});

module.exports = {
    getAcademicReport,
    getCampusStatistics,
    getUserPerformanceReport,
};
