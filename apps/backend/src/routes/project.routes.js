const express = require('express');
const projectController = require('../controllers/project.controller');
const authenticate = require('../middlewares/authenticate');
const { authorizeAnyPermission } = require('../middlewares/authorizePermissions');
const authorizeRoles = require('../middlewares/authorizeRoles');
const { ADMINISTRATION_PERMISSION } = require('../constants/administration.constants');
const { ROLES } = require('../constants/role.constants');

const router = express.Router();

router.use(authenticate, authorizeAnyPermission(ADMINISTRATION_PERMISSION));

router.get('/', projectController.listProjects);
router.post('/', projectController.createProject);
router.get('/:id', projectController.getProjectDetail);
router.put('/:id', projectController.updateProject);
router.patch('/:id/activate', projectController.activateProject);
router.patch('/:id/deactivate', projectController.deactivateProject);
router.get('/:id/closure-summary', projectController.getProjectClosureSummary);
router.post('/:id/close', authorizeRoles(ROLES.ADMIN), projectController.closeProject);

module.exports = router;
