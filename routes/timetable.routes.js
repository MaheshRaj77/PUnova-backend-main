const router = require('express').Router();
const { cache } = require('../middleware/cache');
const { getTimetable } = require('../controllers/timetable.controller');

router.get('/', cache(600), getTimetable);

module.exports = router;
