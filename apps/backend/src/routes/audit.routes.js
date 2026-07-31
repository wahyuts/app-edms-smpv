const express = require('express');
const auditController = require('../controllers/audit.controller');
const authenticate = require('../middlewares/authenticate');
const { authorizeAnyPermission } = require('../middlewares/authorizePermissions');

const router = express.Router();

router.use(authenticate);
router.use(authorizeAnyPermission('audit-trail.view'));

router.get('/', auditController.listAuditRecords);
router.get('/summary', auditController.getSummary);
router.get('/filter-options', auditController.getFilterOptions);
router.patch('/:auditId/hide', auditController.hideAuditRecord);

module.exports = router;
