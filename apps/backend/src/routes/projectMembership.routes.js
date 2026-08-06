const express = require('express');
const projectMembershipController = require('../controllers/projectMembership.controller');
const authenticate = require('../middlewares/authenticate');
const { authorizeAnyPermission } = require('../middlewares/authorizePermissions');
const { ADMINISTRATION_PERMISSION } = require('../constants/administration.constants');

const router = express.Router();

router.use(authenticate, authorizeAnyPermission(ADMINISTRATION_PERMISSION));

router.get('/', projectMembershipController.listMemberships);
router.post('/', projectMembershipController.createMembership);
router.get('/:id', projectMembershipController.getMembershipDetail);
router.put('/:id', projectMembershipController.updateMembership);
router.patch('/:id/activate', projectMembershipController.activateMembership);
router.patch('/:id/deactivate', projectMembershipController.deactivateMembership);

module.exports = router;
