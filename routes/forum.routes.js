const router = require('express').Router();
const { authenticate } = require('../middleware/auth');
const { cache } = require('../middleware/cache');
const { getPosts, createPost, toggleLike, getReplies, createReply } = require('../controllers/forum.controller');

router.get('/', cache(120), getPosts);
router.post('/', authenticate, createPost);
router.post('/:id/like', authenticate, toggleLike);
router.get('/:id/replies', cache(60), getReplies);
router.post('/:id/replies', authenticate, createReply);

module.exports = router;
