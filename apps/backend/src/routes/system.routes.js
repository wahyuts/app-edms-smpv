const express = require('express');
const timeController = require('../controllers/time.controller');

const router = express.Router();

router.get('/time', timeController.getServerTime);

module.exports = router;
