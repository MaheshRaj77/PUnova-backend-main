const router = require('express').Router();
const { authenticate } = require('../middleware/auth');
const { cache } = require('../middleware/cache');
const { getResults } = require('../controllers/results.controller');

router.get('/', authenticate, cache(600), getResults);

module.exports = router;
