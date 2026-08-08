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

const streamToBuffer = async (stream) => {
  const chunks = [];

  for await (const chunk of stream) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  }

  return Buffer.concat(chunks);
};

const runStorageSmokeValidation = async ({ namespace = '__storage-healthcheck__' } = {}) => {
  const startedAt = new Date();
  const token = `${Date.now()}-${Math.random().toString(16).slice(2)}`;
  const temporaryKey = `${STORAGE_DIRECTORIES.TEMPORARY}/${namespace}/${token}.tmp`;
  const permanentKey = `${namespace}/${token}.tmp`;
  const content = Buffer.from(`edms-storage-smoke:${token}`);
  const result = {
    cleanup: false,
    delete: false,
    driver: activeDriver.name,
    exists: false,
    finalize: false,
    get: false,
    getStream: false,
    putTemporary: false,
    startedAt: startedAt.toISOString(),
  };

  try {
    await activeDriver.putTemporary(temporaryKey, content);
    result.putTemporary = true;

    result.exists = await activeDriver.exists(temporaryKey);
    if (!result.exists) {
      throw new Error('[STORAGE] smoke temporary object was not found after put');
    }

    const readBuffer = await activeDriver.get(temporaryKey);
    result.get = Buffer.compare(readBuffer, content) === 0;
    if (!result.get) {
      throw new Error('[STORAGE] smoke get content mismatch');
    }

    await activeDriver.finalize(temporaryKey, permanentKey);
    result.finalize = await activeDriver.exists(permanentKey);
    if (!result.finalize) {
      throw new Error('[STORAGE] smoke permanent object was not found after finalize');
    }

    const streamBuffer = await streamToBuffer(await activeDriver.getStream(permanentKey));
    result.getStream = Buffer.compare(streamBuffer, content) === 0;
    if (!result.getStream) {
      throw new Error('[STORAGE] smoke stream content mismatch');
    }

    result.delete = await activeDriver.delete(permanentKey);
    result.completedAt = new Date().toISOString();
    result.status = 'PASS';

    return result;
  } catch (error) {
    throw normalizeStorageError(error, 'run storage smoke validation');
  } finally {
    await activeDriver.deleteTemporary(temporaryKey).catch(() => {});
    await activeDriver.delete(permanentKey).catch(() => {});
    result.cleanup = true;
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

const putTemporaryStream = async (storageKey, stream, options = {}) => {
  if (typeof activeDriver.putTemporaryStream !== 'function') {
    throw new Error('[STORAGE] active driver does not support temporary stream upload');
  }

  return activeDriver.putTemporaryStream(normalizeKey(storageKey, 'temporaryStorageKey'), stream, options);
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

const cleanupEmptyTemporaryDirectories = async ({ limit = 100 } = {}) => {
  if (typeof activeDriver.cleanupEmptyTemporaryDirectories !== 'function') {
    return {
      deletedDirectories: 0,
      driver: activeDriver.name,
      failed: 0,
      scannedDirectories: 0,
      skippedDirectories: 0,
      supported: false,
    };
  }

  return activeDriver.cleanupEmptyTemporaryDirectories({ limit });
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
  runStorageSmokeValidation,
  ensureDocumentStorageDirectories,
  putTemporary,
  putTemporaryStream,
  finalize,
  put,
  get,
  getStream,
  exists,
  copy,
  move,
  delete: deleteObject,
  deleteTemporary,
  cleanupEmptyTemporaryDirectories,
  getActiveStorageDriver,
};
