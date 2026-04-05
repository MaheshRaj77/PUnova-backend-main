const router = require('express').Router();
const { authenticate } = require('../middleware/auth');
const { authorize } = require('../middleware/authorize');
const { cache } = require('../middleware/cache');
const { getTimetable, createEntry } = require('../controllers/timetable.controller');

router.get('/', authenticate, cache(600), getTimetable);
router.post('/', authenticate, authorize('admin', 'faculty'), createEntry);

module.exports = router;
