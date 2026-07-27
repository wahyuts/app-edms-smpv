const express = require('express');
const dashboardController = require('../controllers/dashboard.controller');
const authenticate = require('../middlewares/authenticate');
const { authorizeAnyPermission } = require('../middlewares/authorizePermissions');

const router = express.Router();

router.use(authenticate);
router.use(authorizeAnyPermission('dashboard.view'));

router.get('/summary', dashboardController.getSummary);
router.get('/statistics', dashboardController.getStatistics);
router.get('/recent-activities', dashboardController.getRecentActivities);

module.exports = router;
