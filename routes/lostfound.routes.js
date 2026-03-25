const router = require('express').Router();
const { authenticate } = require('../middleware/auth');
const { cache } = require('../middleware/cache');
const { upload } = require('../middleware/upload');
const { getItems, createItem } = require('../controllers/lostfound.controller');

router.get('/', cache(120), getItems);
router.post('/', authenticate, upload.single('image'), createItem);

module.exports = router;
