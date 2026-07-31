const express = require('express');
const escalationController = require('../controllers/escalation.controller');
const authenticate = require('../middlewares/authenticate');
const { authorizeAnyPermission } = require('../middlewares/authorizePermissions');

const router = express.Router();

router.use(authenticate);

router.get('/', authorizeAnyPermission('escalation.view'), escalationController.listEscalations);

module.exports = router;
