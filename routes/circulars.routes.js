const router = require('express').Router();
const { authenticate } = require('../middleware/auth');
const { authorize } = require('../middleware/authorize');
const { cache } = require('../middleware/cache');
const { upload } = require('../middleware/upload');
const { getCirculars, createCircular } = require('../controllers/circulars.controller');

router.get('/', cache(300), getCirculars);
router.post('/', authenticate, authorize('admin', 'faculty'), upload.single('attachment'), createCircular);

module.exports = router;
