const express = require('express');
const slaController = require('../controllers/sla.controller');
const authenticate = require('../middlewares/authenticate');
const { authorizeAnyPermission } = require('../middlewares/authorizePermissions');

const router = express.Router();

router.use(authenticate);

router.get('/', authorizeAnyPermission('sla-monitoring.view'), slaController.listSlaDocuments);

module.exports = router;
