const express = require('express');
const developmentResetController = require('../controllers/developmentReset.controller');
const authenticate = require('../middlewares/authenticate');
const authorizeRoles = require('../middlewares/authorizeRoles');
const { authorizeAnyPermission } = require('../middlewares/authorizePermissions');

const router = express.Router();

router.use(authenticate);

router.post(
  '/reset',
  authorizeAnyPermission('user-management.view'),
  authorizeRoles('Admin'),
  developmentResetController.resetDevelopmentEnvironment
);

module.exports = router;
