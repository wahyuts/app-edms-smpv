const express = require('express');
const storageController = require('../controllers/storage.controller');
const authenticate = require('../middlewares/authenticate');
const { authorizeAnyPermission } = require('../middlewares/authorizePermissions');
const { DOCUMENT_PERMISSION } = require('../constants/document.constants');
const uploadMiddleware = require('../middlewares/upload.middleware');

const STORAGE_PERMISSION = 'storage.view';

const router = express.Router();

router.use(authenticate);

router.post(
  '/temporary-uploads',
  authorizeAnyPermission(
    STORAGE_PERMISSION,
    DOCUMENT_PERMISSION.CREATE,
    DOCUMENT_PERMISSION.EDIT,
    DOCUMENT_PERMISSION.APPROVAL_B,
    DOCUMENT_PERMISSION.APPROVAL_C
  ),
  uploadMiddleware,
  storageController.createTemporaryUpload
);

module.exports = router;
