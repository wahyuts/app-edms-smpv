const logger = require('../config/logger');
const storageConfig = require('../config/storage');
const { STORAGE_DIRECTORIES } = require('../constants/storage.constants');
const { createStorageDriver } = require('../storage/storageDriver.factory');
const { normalizeStorageError } = require('../storage/storage.errors');
const { validateStorageKey, validateProjectCode, validateDocumentCode } = require('../validators/storage.validator');

const activeDriver = createStorageDriver();

const normalizeKey = (storageKey, fieldName) => {
  return validateStorageKey(storageKey, fieldName);
};

const initializeStorage = async () => {
  try {
    await activeDriver.initialize();
    logger.log(`[STORAGE] Storage initialized using ${activeDriver.name} driver`);
  } catch (error) {
    logger.error('[STORAGE] Unable to initialize storage');
    logger.error(error.code || error.name || 'StorageInitializationError');
    throw normalizeStorageError(error, 'initialize storage');
  }
};

const testStorageAccess = async () => {
  const healthcheckKey = `${STORAGE_DIRECTORIES.TEMPORARY}/healthcheck-${Date.now()}.tmp`;

  try {
    await activeDriver.putTemporary(healthcheckKey, Buffer.from('ok'));
    await activeDriver.get(healthcheckKey);
    await activeDriver.deleteTemporary(healthcheckKey);
    logger.log('[STORAGE] Storage access verified');

    return true;
  } catch (error) {
    logger.error('[STORAGE] Storage health check failed');
    logger.error(error.code || error.name || 'StorageAccessError');
    await activeDriver.deleteTemporary(healthcheckKey).catch((cleanupError) => {
      logger.error('[STORAGE] Unable to clean storage health check file');
      logger.error(cleanupError.code || cleanupError.name || 'StorageCleanupError');
    });
    throw normalizeStorageError(error, 'verify storage access');
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
  const safeProjectCode = validateProjectCode(projectCode);
  const safeDocumentCode = validateDocumentCode(documentCode);
  const revisionDirectoryPath = `${STORAGE_DIRECTORIES.PROJECTS}/${safeProjectCode}/${STORAGE_DIRECTORIES.DOCUMENTS}/${safeDocumentCode}/${STORAGE_DIRECTORIES.REVISIONS}`;
  const workflowAttachmentDirectoryPath = `${STORAGE_DIRECTORIES.PROJECTS}/${safeProjectCode}/${STORAGE_DIRECTORIES.DOCUMENTS}/${safeDocumentCode}/${STORAGE_DIRECTORIES.ATTACHMENTS}`;

  logger.log('[STORAGE] Document storage directories ensured');

  return {
    revisionDirectoryPath,
    workflowAttachmentDirectoryPath,
  };
};

const putTemporary = async (storageKey, content) => {
  return activeDriver.putTemporary(normalizeKey(storageKey, 'temporaryStorageKey'), content);
};

const finalize = async (temporaryStorageKey, permanentStorageKey) => {
  return activeDriver.finalize(
    normalizeKey(temporaryStorageKey, 'temporaryStorageKey'),
    normalizeKey(permanentStorageKey, 'permanentStorageKey')
  );
};

const put = async (storageKey, content) => {
  return activeDriver.put(normalizeKey(storageKey), content);
};

const get = async (storageKey) => {
  return activeDriver.get(normalizeKey(storageKey));
};

const getStream = async (storageKey) => {
  return activeDriver.getStream(normalizeKey(storageKey));
};

const exists = async (storageKey) => {
  return activeDriver.exists(normalizeKey(storageKey));
};

const copy = async (sourceStorageKey, targetStorageKey) => {
  return activeDriver.copy(normalizeKey(sourceStorageKey, 'sourceStorageKey'), normalizeKey(targetStorageKey, 'targetStorageKey'));
};

const move = async (sourceStorageKey, targetStorageKey) => {
  return activeDriver.move(normalizeKey(sourceStorageKey, 'sourceStorageKey'), normalizeKey(targetStorageKey, 'targetStorageKey'));
};

const deleteObject = async (storageKey) => {
  return activeDriver.delete(normalizeKey(storageKey));
};

const deleteTemporary = async (storageKey) => {
  return activeDriver.deleteTemporary(normalizeKey(storageKey, 'temporaryStorageKey'));
};

const getActiveStorageDriver = () => {
  return {
    driver: activeDriver.name,
    rootPath: storageConfig.driver === 'local' ? storageConfig.rootPath : undefined,
  };
};

module.exports = {
  initializeStorage,
  testStorageAccess,
  checkStorageHealth,
  ensureDocumentStorageDirectories,
  putTemporary,
  finalize,
  put,
  get,
  getStream,
  exists,
  copy,
  move,
  delete: deleteObject,
  deleteTemporary,
  getActiveStorageDriver,
};
