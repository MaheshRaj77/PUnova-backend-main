const router = require('express').Router();
const { authenticate } = require('../middleware/auth');
const { authorize } = require('../middleware/authorize');
const { cache } = require('../middleware/cache');
const { getAlerts, createAlert } = require('../controllers/alerts.controller');

router.get('/', cache(180), getAlerts);
router.post('/', authenticate, authorize('admin', 'faculty'), createAlert);

module.exports = router;
