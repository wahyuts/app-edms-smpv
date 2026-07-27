const express = require('express');
const userController = require('../controllers/user.controller');
const authenticate = require('../middlewares/authenticate');
const { authorizeAnyPermission } = require('../middlewares/authorizePermissions');
const { ADMINISTRATION_PERMISSION } = require('../constants/administration.constants');

const router = express.Router();

router.use(authenticate, authorizeAnyPermission(ADMINISTRATION_PERMISSION));

router.get('/', userController.listUsers);
router.post('/', userController.createUser);
router.get('/:id', userController.getUserDetail);
router.put('/:id', userController.updateUser);
router.patch('/:id/activate', userController.activateUser);
router.patch('/:id/deactivate', userController.deactivateUser);

module.exports = router;
