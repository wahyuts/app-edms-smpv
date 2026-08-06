const express = require('express');
const timeController = require('../controllers/time.controller');
const slaNotificationJobController = require('../controllers/slaNotificationJob.controller');

const router = express.Router();

router.get('/time', timeController.getServerTime);
router.post('/sla-notifications/evaluate', slaNotificationJobController.runSlaNotificationEvaluation);

module.exports = router;
