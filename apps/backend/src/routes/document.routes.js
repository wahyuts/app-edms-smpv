const express = require('express');
const documentController = require('../controllers/document.controller');
const authenticate = require('../middlewares/authenticate');
const { authorizeAnyPermission } = require('../middlewares/authorizePermissions');
const { DOCUMENT_PERMISSION } = require('../constants/document.constants');
const uploadMiddleware = require('../middlewares/upload.middleware');

const router = express.Router();

router.use(authenticate);

router.post('/', authorizeAnyPermission(DOCUMENT_PERMISSION.CREATE), documentController.createDocument);
router.get('/:documentId/view', authorizeAnyPermission(DOCUMENT_PERMISSION.VIEW), documentController.viewDocumentFile);
router.get('/:documentId/download', authorizeAnyPermission(DOCUMENT_PERMISSION.DOWNLOAD), documentController.downloadDocumentFile);
router.get(
  '/:documentId/revisions/:revisionId/view',
  authorizeAnyPermission(DOCUMENT_PERMISSION.VIEW),
  documentController.viewDocumentFile
);
router.get(
  '/:documentId/revisions/:revisionId/download',
  authorizeAnyPermission(DOCUMENT_PERMISSION.DOWNLOAD),
  documentController.downloadDocumentFile
);
router.post(
  '/:documentId/workflow-attachments',
  authorizeAnyPermission('storage.view'),
  uploadMiddleware,
  documentController.uploadWorkflowAttachment
);
router.get(
  '/:documentId/workflow-attachments/:attachmentId/download',
  authorizeAnyPermission('storage.view'),
  documentController.downloadWorkflowAttachment
);

module.exports = router;
