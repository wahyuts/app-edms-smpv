const express = require('express');
const storageController = require('../controllers/storage.controller');
const authenticate = require('../middlewares/authenticate');
const { authorizeAnyPermission } = require('../middlewares/authorizePermissions');
const uploadMiddleware = require('../middlewares/upload.middleware');

const STORAGE_PERMISSION = 'storage.view';

const router = express.Router();

router.use(authenticate, authorizeAnyPermission(STORAGE_PERMISSION));

router.post('/temporary-uploads', uploadMiddleware, storageController.createTemporaryUpload);

module.exports = router;
