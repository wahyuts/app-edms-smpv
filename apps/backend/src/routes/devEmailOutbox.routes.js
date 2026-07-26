const express = require('express');
const devEmailOutboxController = require('../controllers/devEmailOutbox.controller');

const router = express.Router();

router.get('/', devEmailOutboxController.index);
router.get('/:emailId', devEmailOutboxController.show);

module.exports = router;
