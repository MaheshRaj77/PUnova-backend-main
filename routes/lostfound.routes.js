const router = require('express').Router();
const { authenticate } = require('../middleware/auth');
const { cache } = require('../middleware/cache');
const { upload } = require('../middleware/upload');
const { getItems, createItem, updateItemStatus } = require('../controllers/lostfound.controller');

router.get('/', cache(120), getItems);
router.post('/', authenticate, upload.single('image'), createItem);
router.patch('/:id/status', authenticate, updateItemStatus);

module.exports = router;
