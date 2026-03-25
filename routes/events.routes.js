const router = require('express').Router();
const { authenticate } = require('../middleware/auth');
const { cache } = require('../middleware/cache');
const { getEvents, createEvent } = require('../controllers/events.controller');

router.get('/', cache(300), getEvents);
router.post('/', authenticate, createEvent);

module.exports = router;
