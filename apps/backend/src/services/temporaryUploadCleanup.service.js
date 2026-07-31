const logger = require('../config/logger');
const { STORAGE_DIRECTORIES } = require('../constants/storage.constants');
const temporaryUploadRepository = require('../repositories/temporaryUpload.repository');
const storageService = require('./storage.service');

const isTemporaryStorageKey = (storageKey) => (
  typeof storageKey === 'string' && storageKey.startsWith(`${STORAGE_DIRECTORIES.TEMPORARY}/`)
);

const cleanupExpiredTemporaryUploads = async ({ limit = 100, dryRun = false } = {}) => {
  const candidates = await temporaryUploadRepository.listExpiredUnconsumedTemporaryUploads({ limit });
  const summary = {
    candidates: candidates.length,
    deletedMetadata: 0,
    deletedObjects: 0,
    dryRun: Boolean(dryRun),
    failed: 0,
    skipped: 0,
  };
  const results = [];

  for (const candidate of candidates) {
    if (!isTemporaryStorageKey(candidate.storageKey)) {
      summary.skipped += 1;
      results.push({
        id: candidate.id,
        status: 'skipped',
        temporaryFileId: candidate.temporaryFileId,
      });
      continue;
    }

    try {
      if (dryRun) {
        results.push({
          id: candidate.id,
          status: 'dry-run',
          temporaryFileId: candidate.temporaryFileId,
        });
        continue;
      }

      const deletedObject = await storageService.deleteTemporary(candidate.storageKey);
      const deletedRows = await temporaryUploadRepository.deleteExpiredTemporaryUploadById(candidate.id);

      summary.deletedObjects += deletedObject ? 1 : 0;
      summary.deletedMetadata += deletedRows;
      results.push({
        id: candidate.id,
        status: 'deleted',
        storageObjectDeleted: Boolean(deletedObject),
        temporaryFileId: candidate.temporaryFileId,
      });
    } catch (error) {
      summary.failed += 1;
      logger.error('[UPLOAD CLEANUP] Failed to cleanup expired temporary upload');
      logger.error(error.code || error.name || 'TemporaryUploadCleanupError');
      results.push({
        id: candidate.id,
        status: 'failed',
        temporaryFileId: candidate.temporaryFileId,
      });
    }
  }

  return {
    ...summary,
    results,
  };
};

module.exports = {
  cleanupExpiredTemporaryUploads,
};
