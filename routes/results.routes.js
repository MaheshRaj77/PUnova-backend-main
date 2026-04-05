const router = require('express').Router();
const { authenticate } = require('../middleware/auth');
const { authorize } = require('../middleware/authorize');
const { cache } = require('../middleware/cache');
const { getResults, addResult } = require('../controllers/results.controller');

router.get('/', authenticate, cache(600), getResults);
router.post('/', authenticate, authorize('admin', 'faculty'), addResult);

module.exports = router;
