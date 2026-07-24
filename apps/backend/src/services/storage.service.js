const fs = require('node:fs/promises');
const path = require('node:path');
const logger = require('../config/logger');
const {
  getStorageRootPath,
  getProjectsRootPath,
  getRevisionDirectoryPath,
  getWorkflowAttachmentDirectoryPath,
  ensurePathInsideStorage,
} = require('../utils/storagePath');

const initializeStorage = async () => {
  try {
    await fs.mkdir(getStorageRootPath(), { recursive: true });
    await fs.mkdir(getProjectsRootPath(), { recursive: true });
    logger.log('[STORAGE] Storage initialized');
  } catch (error) {
    logger.error('[STORAGE] Unable to initialize storage');
    logger.error(error.code || error.name || 'StorageInitializationError');
    throw new Error('Storage initialization failed');
  }
};

const testStorageAccess = async () => {
  const tempFilePath = ensurePathInsideStorage(
    path.join(getStorageRootPath(), `.storage-healthcheck-${Date.now()}.tmp`)
  );

  try {
    await fs.mkdir(getStorageRootPath(), { recursive: true });
    await fs.writeFile(tempFilePath, 'ok', { flag: 'wx' });
    logger.log('[STORAGE] Storage access verified');

    return true;
  } catch (error) {
    logger.error('[STORAGE] Storage health check failed');
    logger.error(error.code || error.name || 'StorageAccessError');
    throw new Error('Storage access verification failed');
  } finally {
    try {
      await fs.unlink(tempFilePath);
    } catch (error) {
      if (error.code !== 'ENOENT') {
        logger.error('[STORAGE] Unable to clean storage health check file');
        logger.error(error.code || error.name || 'StorageCleanupError');
      }
    }
  }
};

const checkStorageHealth = async () => {
  try {
    await testStorageAccess();

    return {
      service: 'storage',
      status: 'up',
    };
  } catch (error) {
    return {
      service: 'storage',
      status: 'down',
    };
  }
};

const ensureDocumentStorageDirectories = async (projectCode, documentCode) => {
  const revisionDirectoryPath = getRevisionDirectoryPath(projectCode, documentCode);
  const workflowAttachmentDirectoryPath = getWorkflowAttachmentDirectoryPath(projectCode, documentCode);

  await fs.mkdir(revisionDirectoryPath, { recursive: true });
  await fs.mkdir(workflowAttachmentDirectoryPath, { recursive: true });
  logger.log('[STORAGE] Document storage directories ensured');

  return {
    revisionDirectoryPath,
    workflowAttachmentDirectoryPath,
  };
};

module.exports = {
  initializeStorage,
  testStorageAccess,
  checkStorageHealth,
  ensureDocumentStorageDirectories,
};
