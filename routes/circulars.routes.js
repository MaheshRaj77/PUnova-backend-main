const router = require('express').Router();
const { authenticate } = require('../middleware/auth');
const { authorize } = require('../middleware/authorize');
const { cache } = require('../middleware/cache');
const { getCirculars, createCircular } = require('../controllers/circulars.controller');

router.get('/', cache(300), getCirculars);
router.post('/', authenticate, authorize('admin', 'faculty'), createCircular);

module.exports = router;
