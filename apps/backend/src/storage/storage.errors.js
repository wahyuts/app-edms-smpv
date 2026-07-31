class StorageError extends Error {
  constructor(message, code = 'STORAGE_ERROR', cause) {
    super(message);
    this.name = 'StorageError';
    this.code = code;
    this.cause = cause;
  }
}

const normalizeStorageError = (error, operation) => {
  if (error instanceof StorageError) {
    return error;
  }

  return new StorageError(`[STORAGE] ${operation} failed`, 'STORAGE_PROVIDER_ERROR', error);
};

module.exports = {
  StorageError,
  normalizeStorageError,
};
