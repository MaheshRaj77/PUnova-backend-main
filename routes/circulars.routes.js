const router = require('express').Router();
const { authenticate } = require('../middleware/auth');
const { cache } = require('../middleware/cache');
const { getCirculars, createCircular } = require('../controllers/circulars.controller');

router.get('/', cache(300), getCirculars);
router.post('/', authenticate, createCircular);

module.exports = router;
