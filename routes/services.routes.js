const router = require('express').Router();
const { cache } = require('../middleware/cache');
const { getServices } = require('../controllers/services.controller');

router.get('/', cache(600), getServices);

module.exports = router;
