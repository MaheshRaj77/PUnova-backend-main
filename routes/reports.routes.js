const router = require('express').Router();
const { authenticate } = require('../middleware/auth');
const { authorize, requireAdmin } = require('../middleware/authorize');
const {
    getAcademicReport,
    getCampusStatistics,
    getUserPerformanceReport,
} = require('../controllers/reports.controller');

// ── User's Own Reports ──────────────────────────────────────────────
router.get('/me/academic', authenticate, getUserPerformanceReport);
router.get('/me/performance', authenticate, getUserPerformanceReport);

// ── User's Academic Report (By ID) ─────────────────────────────────
router.get('/:userId/academic', authenticate, getAcademicReport);

// ── Campus Statistics (Admin Only) ──────────────────────────────────
router.get('/campus/statistics', authenticate, requireAdmin, getCampusStatistics);

module.exports = router;
