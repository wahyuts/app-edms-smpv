const SAFE_IDENTIFIER_PATTERN = /^[A-Za-z0-9_-]+$/;

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

module.exports = {
  validateProjectCode,
  validateDocumentCode,
};
