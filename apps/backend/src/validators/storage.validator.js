const SAFE_IDENTIFIER_PATTERN = /^[A-Za-z0-9_-]+$/;
const SAFE_STORAGE_KEY_SEGMENT_PATTERN = /^[A-Za-z0-9._-]+$/;

const validateStorageIdentifier = (value, fieldName) => {
  if (typeof value !== 'string' || value.trim() === '') {
    throw new Error(`[STORAGE] ${fieldName} must be a non-empty string`);
  }

  if (
    value.includes('..') ||
    value.includes('/') ||
    value.includes('\\') ||
    value.includes('\0') ||
    !SAFE_IDENTIFIER_PATTERN.test(value)
  ) {
    throw new Error(`[STORAGE] ${fieldName} contains unsafe characters`);
  }

  return value;
};

const validateProjectCode = (projectCode) => {
  return validateStorageIdentifier(projectCode, 'projectCode');
};

const validateDocumentCode = (documentCode) => {
  return validateStorageIdentifier(documentCode, 'documentCode');
};

const validateStorageKey = (storageKey, fieldName = 'storageKey') => {
  if (typeof storageKey !== 'string' || storageKey.trim() === '') {
    throw new Error(`[STORAGE] ${fieldName} must be a non-empty relative key`);
  }

  const normalizedKey = storageKey.replace(/\\/g, '/').trim();
  const segments = normalizedKey.split('/');

  if (
    normalizedKey.includes('\0') ||
    normalizedKey.startsWith('/') ||
    normalizedKey.includes('//') ||
    /^[A-Za-z]:\//.test(normalizedKey) ||
    segments.some((segment) => {
      return segment === '' || segment === '.' || segment === '..' || !SAFE_STORAGE_KEY_SEGMENT_PATTERN.test(segment);
    })
  ) {
    throw new Error(`[STORAGE] ${fieldName} is invalid`);
  }

  return normalizedKey;
};

module.exports = {
  validateProjectCode,
  validateDocumentCode,
  validateStorageKey,
};
