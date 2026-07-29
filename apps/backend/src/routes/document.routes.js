const express = require('express');
const documentController = require('../controllers/document.controller');
const authenticate = require('../middlewares/authenticate');
const { authorizeAnyPermission } = require('../middlewares/authorizePermissions');
const { DOCUMENT_PERMISSION } = require('../constants/document.constants');

const router = express.Router();

router.use(authenticate);

router.get('/', authorizeAnyPermission(DOCUMENT_PERMISSION.VIEW), documentController.listDocuments);
router.post('/', authorizeAnyPermission(DOCUMENT_PERMISSION.CREATE), documentController.createDocument);
router.patch('/:documentId', authorizeAnyPermission(DOCUMENT_PERMISSION.EDIT), documentController.updateDocument);
router.patch('/:documentId/archive', authorizeAnyPermission(DOCUMENT_PERMISSION.ARCHIVE), documentController.archiveDocument);
router.patch('/:documentId/restore', authorizeAnyPermission(DOCUMENT_PERMISSION.ARCHIVE), documentController.restoreDocument);
router.post(
  '/:documentId/approve',
  authorizeAnyPermission(DOCUMENT_PERMISSION.APPROVAL_A),
  documentController.approveDocument
);
router.post(
  '/:documentId/approve-with-comment',
  authorizeAnyPermission(DOCUMENT_PERMISSION.APPROVAL_B),
  documentController.approveDocumentWithComment
);
router.post(
  '/:documentId/reject',
  authorizeAnyPermission(DOCUMENT_PERMISSION.APPROVAL_C),
  documentController.rejectDocument
);
router.post(
  '/:documentId/revisions',
  authorizeAnyPermission(DOCUMENT_PERMISSION.EDIT),
  documentController.uploadRevision
);
router.get('/:documentId/revisions', authorizeAnyPermission(DOCUMENT_PERMISSION.VIEW), documentController.listDocumentRevisions);
router.get('/:documentId/history', authorizeAnyPermission(DOCUMENT_PERMISSION.VIEW), documentController.getDocumentHistory);
router.get('/:documentId/comments', authorizeAnyPermission(DOCUMENT_PERMISSION.VIEW), documentController.getWorkflowComments);
router.patch('/:documentId/comments/read', authorizeAnyPermission(DOCUMENT_PERMISSION.VIEW), documentController.markWorkflowCommentsRead);
router.get('/:documentId', authorizeAnyPermission(DOCUMENT_PERMISSION.VIEW), documentController.getDocumentDetail);
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
  authorizeAnyPermission(
    'storage.view',
    DOCUMENT_PERMISSION.EDIT,
    DOCUMENT_PERMISSION.APPROVAL_B,
    DOCUMENT_PERMISSION.APPROVAL_C
  ),
  documentController.uploadWorkflowAttachment
);
router.get(
  '/:documentId/workflow-attachments/:attachmentId/download',
  authorizeAnyPermission('storage.view', DOCUMENT_PERMISSION.VIEW, DOCUMENT_PERMISSION.DOWNLOAD),
  documentController.downloadWorkflowAttachment
);

module.exports = router;
