const express = require('express');
const realtimeController = require('../controllers/realtime.controller');
const authenticate = require('../middlewares/authenticate');

const router = express.Router();

router.get('/', authenticate, realtimeController.openEvents);

module.exports = router;
