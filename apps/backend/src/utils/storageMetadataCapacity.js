const { createHttpError } = require('./administration');

const FILE_NAME_TOO_LONG_CODE = 'FILE_NAME_TOO_LONG';
const FILE_NAME_TOO_LONG_MESSAGE = 'Nama file terlalu panjang untuk diproses. Silakan gunakan nama file yang lebih pendek.';

const TEMPORARY_UPLOAD_CAPACITY = Object.freeze({
  originalFileName: 255,
  physicalFileName: 255,
  storageKey: 255,
});

const STORED_FILE_CAPACITY = Object.freeze({
  originalFileName: 255,
  physicalFileName: 255,
  relativePath: 1024,
  storageKey: 255,
});

const createFileNameTooLongError = (errors) =>
  createHttpError(FILE_NAME_TOO_LONG_MESSAGE, 422, errors, {
    code: FILE_NAME_TOO_LONG_CODE,
  });

const validateStorageMetadataCapacity = (metadata = {}, capacity = {}) => {
  const errors = Object.entries(capacity)
    .filter(([field, maxLength]) => {
      const value = metadata[field];
      return typeof value === 'string' && value.length > maxLength;
    })
    .map(([field]) => ({
      field,
      message: FILE_NAME_TOO_LONG_MESSAGE,
    }));

  if (errors.length > 0) {
    throw createFileNameTooLongError(errors);
  }
};

const validateTemporaryUploadCapacity = (metadata = {}) =>
  validateStorageMetadataCapacity(metadata, TEMPORARY_UPLOAD_CAPACITY);

const validateStoredFileCapacity = (metadata = {}) =>
  validateStorageMetadataCapacity(metadata, STORED_FILE_CAPACITY);

module.exports = {
  FILE_NAME_TOO_LONG_CODE,
  FILE_NAME_TOO_LONG_MESSAGE,
  STORED_FILE_CAPACITY,
  TEMPORARY_UPLOAD_CAPACITY,
  validateStorageMetadataCapacity,
  validateStoredFileCapacity,
  validateTemporaryUploadCapacity,
};
