const express = require('express');
const profileController = require('../controllers/profile.controller');
const authenticate = require('../middlewares/authenticate');
const { authorizeAnyPermission } = require('../middlewares/authorizePermissions');

const PROFILE_PERMISSION = 'profile.view';

const router = express.Router();

router.use(authenticate, authorizeAnyPermission(PROFILE_PERMISSION));

router.patch('/', profileController.updateCurrentProfile);

module.exports = router;
