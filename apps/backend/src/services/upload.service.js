const crypto = require('node:crypto');
const path = require('node:path');
const env = require('../config/env');
const logger = require('../config/logger');
const { STORAGE_DIRECTORIES } = require('../constants/storage.constants');
const temporaryUploadRepository = require('../repositories/temporaryUpload.repository');
const storageService = require('./storage.service');
const { sanitizeFileName } = require('../utils/fileName');
const { toStorageSafeSegment } = require('../utils/storageKeyBuilder');
const { UploadInspectionStream } = require('../utils/uploadStream');
const { validateUploadedFileMetadata } = require('../validators/upload.validator');

const buildPhysicalFileName = (temporaryFileId, originalFileName) => {
  const safeOriginalFileName = sanitizeFileName(originalFileName);
  const extension = path.extname(safeOriginalFileName);
  const baseName = path.basename(safeOriginalFileName, extension).replace(/\s+/g, '_');
  const physicalFileName = toStorageSafeSegment(`${temporaryFileId}_${baseName}${extension}`);

  return physicalFileName;
};

const buildTemporaryStorageKey = ({ temporaryFileId, physicalFileName }) => {
  return `${STORAGE_DIRECTORIES.TEMPORARY}/${temporaryFileId}/${physicalFileName}`;
};

const uploadTemporaryFileStream = async ({
  actorUserId,
  contentLength,
  fileStream,
  mimeType,
  originalFileName,
}) => {
  const validatedFile = validateUploadedFileMetadata({
    mimetype: mimeType,
    originalname: originalFileName,
  });
  const temporaryFileId = crypto.randomUUID();
  const physicalFileName = buildPhysicalFileName(temporaryFileId, validatedFile.originalFileName);
  const storageKey = buildTemporaryStorageKey({ temporaryFileId, physicalFileName });
  const inspectionStream = new UploadInspectionStream({
    extension: validatedFile.extension,
  });
  inspectionStream.on('error', (error) => {
    fileStream.destroy(error);
  });

  try {
    await storageService.putTemporaryStream(storageKey, fileStream.pipe(inspectionStream), {
      contentLength,
      contentType: validatedFile.mimeType,
    });
  } catch (error) {
    if (error.statusCode) {
      throw error;
    }

    logger.error('[UPLOAD] Temporary upload stream storage failure');
    logger.error(error.code || error.name || 'UploadStreamStorageError');

    const uploadError = new Error('Gagal menyimpan file upload');
    uploadError.statusCode = 500;
    throw uploadError;
  }

  const streamResult = inspectionStream.getResult();

  try {
    const metadata = await temporaryUploadRepository.createTemporaryUpload({
      id: `TMP-${temporaryFileId}`,
      temporaryFileId,
      originalFileName: validatedFile.originalFileName,
      physicalFileName,
      mimeType: validatedFile.mimeType,
      extension: validatedFile.extension,
      fileSize: streamResult.fileSize,
      storageKey,
      checksum: streamResult.checksum,
      expiresInHours: env.upload.temporaryTtlHours,
      createdByUserId: actorUserId,
    });

    logger.log('[UPLOAD] Temporary file uploaded');

    return metadata;
  } catch (error) {
    await storageService.deleteTemporary(storageKey).catch(() => {});
    logger.error('[UPLOAD] Temporary upload stream metadata persistence failure');
    logger.error(error.code || error.name || 'UploadStreamMetadataError');
    throw error;
  }
};

const getTemporaryUploadMetadata = async (temporaryFileId) => {
  return temporaryUploadRepository.findAvailableTemporaryUploadByTemporaryFileId(temporaryFileId);
};

const assertTemporaryUploadConsumable = async ({ actorUserId, temporaryFileId }) => {
  const temporaryMetadata = await getTemporaryUploadMetadata(temporaryFileId);

  if (!temporaryMetadata) {
    const error = new Error('Temporary upload tidak ditemukan atau sudah digunakan');
    error.statusCode = 404;
    error.errors = [{ field: 'temporaryFileId', message: 'Temporary upload tidak ditemukan atau sudah digunakan' }];
    throw error;
  }

  if (temporaryMetadata.createdByUserId !== actorUserId) {
    const error = new Error('Temporary upload tidak dapat digunakan oleh user ini');
    error.statusCode = 403;
    error.errors = [{ field: 'temporaryFileId', message: 'Temporary upload tidak dapat digunakan oleh user ini' }];
    throw error;
  }

  if (!(await storageService.exists(temporaryMetadata.storageKey))) {
    const error = new Error('Temporary upload file tidak ditemukan di storage');
    error.statusCode = 409;
    error.errors = [{ field: 'temporaryFileId', message: 'Temporary upload file tidak ditemukan di storage' }];
    throw error;
  }

  return temporaryMetadata;
};

const consumeTemporaryUploadMetadata = async (connection, temporaryFileId) => {
  return temporaryUploadRepository.deleteAvailableTemporaryUpload(connection, { temporaryFileId });
};

const discardTemporaryUpload = async (temporaryMetadata) => {
  if (!temporaryMetadata?.temporaryFileId) return;

  await temporaryUploadRepository
    .deleteAvailableTemporaryUpload(null, { temporaryFileId: temporaryMetadata.temporaryFileId })
    .catch(() => {});

  if (temporaryMetadata.storageKey) {
    await storageService.deleteTemporary(temporaryMetadata.storageKey).catch(() => {});
  }
};

module.exports = {
  assertTemporaryUploadConsumable,
  consumeTemporaryUploadMetadata,
  discardTemporaryUpload,
  getTemporaryUploadMetadata,
  uploadTemporaryFileStream,
};
