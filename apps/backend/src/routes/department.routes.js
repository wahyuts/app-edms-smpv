const express = require('express');
const departmentController = require('../controllers/department.controller');
const authenticate = require('../middlewares/authenticate');
const { authorizeAnyPermission } = require('../middlewares/authorizePermissions');
const { ADMINISTRATION_PERMISSION } = require('../constants/administration.constants');

const router = express.Router();

router.use(authenticate, authorizeAnyPermission(ADMINISTRATION_PERMISSION));

router.get('/', departmentController.listDepartments);
router.post('/', departmentController.createDepartment);
router.get('/:id', departmentController.getDepartmentDetail);
router.put('/:id', departmentController.updateDepartment);
router.patch('/:id/activate', departmentController.activateDepartment);
router.patch('/:id/deactivate', departmentController.deactivateDepartment);

module.exports = router;
