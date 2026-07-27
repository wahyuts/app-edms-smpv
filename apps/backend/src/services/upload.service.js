const crypto = require('node:crypto');
const path = require('node:path');
const env = require('../config/env');
const logger = require('../config/logger');
const { STORAGE_DIRECTORIES } = require('../constants/storage.constants');
const temporaryUploadRepository = require('../repositories/temporaryUpload.repository');
const storageService = require('./storage.service');
const { sanitizeFileName } = require('../utils/fileName');
const { validateUploadedFile } = require('../validators/upload.validator');

const buildPhysicalFileName = (temporaryFileId, originalFileName) => {
  const safeOriginalFileName = sanitizeFileName(originalFileName);
  const extension = path.extname(safeOriginalFileName);
  const baseName = path.basename(safeOriginalFileName, extension).replace(/\s+/g, '_');
  const physicalFileName = sanitizeFileName(`${temporaryFileId}_${baseName}${extension}`).replace(/\s+/g, '_');

  return physicalFileName;
};

const buildTemporaryStorageKey = ({ temporaryFileId, physicalFileName }) => {
  return `${STORAGE_DIRECTORIES.TEMPORARY}/${temporaryFileId}/${physicalFileName}`;
};

const buildChecksum = (buffer) => {
  return crypto.createHash('sha256').update(buffer).digest('hex');
};

const uploadTemporaryFile = async ({ actorUserId, file }) => {
  const validatedFile = validateUploadedFile(file);
  const temporaryFileId = crypto.randomUUID();
  const physicalFileName = buildPhysicalFileName(temporaryFileId, validatedFile.originalFileName);
  const storageKey = buildTemporaryStorageKey({ temporaryFileId, physicalFileName });
  const checksum = buildChecksum(validatedFile.buffer);

  try {
    await storageService.putTemporary(storageKey, validatedFile.buffer);
  } catch (error) {
    logger.error('[UPLOAD] Temporary upload storage failure');
    logger.error(error.code || error.name || 'UploadStorageError');

    const uploadError = new Error('Gagal menyimpan file upload');
    uploadError.statusCode = 500;
    throw uploadError;
  }

  try {
    const metadata = await temporaryUploadRepository.createTemporaryUpload({
      id: `TMP-${temporaryFileId}`,
      temporaryFileId,
      originalFileName: validatedFile.originalFileName,
      physicalFileName,
      mimeType: validatedFile.mimeType,
      extension: validatedFile.extension,
      fileSize: validatedFile.fileSize,
      storageKey,
      checksum,
      expiresInHours: env.upload.temporaryTtlHours,
      createdByUserId: actorUserId,
    });

    logger.log('[UPLOAD] Temporary file uploaded');

    return metadata;
  } catch (error) {
    await storageService.deleteTemporary(storageKey).catch(() => {});
    logger.error('[UPLOAD] Temporary upload metadata persistence failure');
    logger.error(error.code || error.name || 'UploadMetadataError');
    throw error;
  }
};

const getTemporaryUploadMetadata = async (temporaryFileId) => {
  return temporaryUploadRepository.findAvailableTemporaryUploadByTemporaryFileId(temporaryFileId);
};

const consumeTemporaryUploadMetadata = async (connection, temporaryFileId) => {
  return temporaryUploadRepository.markTemporaryUploadConsumed(connection, { temporaryFileId });
};

module.exports = {
  consumeTemporaryUploadMetadata,
  getTemporaryUploadMetadata,
  uploadTemporaryFile,
};
