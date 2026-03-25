const router = require('express').Router();
const { authenticate } = require('../middleware/auth');
const { cache } = require('../middleware/cache');
const { getAlerts, createAlert } = require('../controllers/alerts.controller');

router.get('/', cache(180), getAlerts);
router.post('/', authenticate, createAlert);

module.exports = router;
