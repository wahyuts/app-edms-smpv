const { DOCUMENT_DRAWINGS } = require('../constants/document.constants');
const { normalizeText } = require('../utils/administration');

const toNonNegativeInteger = (value) => {
  const numericValue = Number(value);

  return Number.isInteger(numericValue) && numericValue >= 0 ? numericValue : null;
};

const validateDocumentCreate = (body = {}) => {
  const errors = [];
  const documentNumber = normalizeText(body.documentNumber);
  const description = normalizeText(body.description);
  const drawing = normalizeText(body.drawing);
  const area = normalizeText(body.area);
  const temporaryFileId = normalizeText(body.temporaryFileId);
  const daysUntilValidation = toNonNegativeInteger(body.daysUntilValidation ?? 0);

  if (!temporaryFileId) {
    errors.push({ field: 'temporaryFileId', message: 'Temporary File Wajib Diisi' });
  }

  if (!documentNumber) {
    errors.push({ field: 'documentNumber', message: 'Document Number Wajib Diisi' });
  }

  if (!DOCUMENT_DRAWINGS.includes(drawing)) {
    errors.push({ field: 'drawing', message: 'Drawing Tidak Valid' });
  }

  if (!area) {
    errors.push({ field: 'area', message: 'Area Wajib Diisi' });
  }

  if (daysUntilValidation === null) {
    errors.push({ field: 'daysUntilValidation', message: 'Days Until Validation Tidak Valid' });
  }

  return {
    isValid: errors.length === 0,
    errors,
    value: {
      area,
      daysUntilValidation: daysUntilValidation ?? 0,
      description,
      documentNumber,
      drawing,
      temporaryFileId,
    },
  };
};

const validateDocumentUpdate = (body = {}) => {
  const errors = [];
  const value = {};

  if (Object.prototype.hasOwnProperty.call(body, 'description')) {
    value.description = normalizeText(body.description);
  }
  if (Object.prototype.hasOwnProperty.call(body, 'drawing')) {
    value.drawing = normalizeText(body.drawing);
    if (!DOCUMENT_DRAWINGS.includes(value.drawing)) {
      errors.push({ field: 'drawing', message: 'Drawing Tidak Valid' });
    }
  }
  if (Object.prototype.hasOwnProperty.call(body, 'area')) {
    value.area = normalizeText(body.area);
    if (!value.area) {
      errors.push({ field: 'area', message: 'Area Wajib Diisi' });
    }
  }
  if (Object.prototype.hasOwnProperty.call(body, 'daysUntilValidation')) {
    value.daysUntilValidation = toNonNegativeInteger(body.daysUntilValidation);
    if (value.daysUntilValidation === null) {
      errors.push({ field: 'daysUntilValidation', message: 'Days Until Validation Tidak Valid' });
    }
  }

  if (Object.keys(value).length === 0) {
    errors.push({ field: 'document', message: 'Tidak ada metadata Document yang diperbarui' });
  }

  return {
    isValid: errors.length === 0,
    errors,
    value,
  };
};

const validateArchivePayload = (body = {}) => ({
  errors: [],
  isValid: true,
  value: {
    reason: normalizeText(body.reason ?? body.archiveReason),
  },
});

const validateTemporaryFilePayload = (body = {}) => {
  const temporaryFileId = normalizeText(body.temporaryFileId);
  const errors = [];

  if (!temporaryFileId) {
    errors.push({ field: 'temporaryFileId', message: 'Temporary File Wajib Diisi' });
  }

  return {
    errors,
    isValid: errors.length === 0,
    value: {
      temporaryFileId,
    },
  };
};

const validateWorkflowAttachmentPayload = (body = {}) => {
  const commentId = normalizeText(body.commentId);
  const temporaryFileId = normalizeText(body.temporaryFileId);
  const errors = [];

  if (!commentId) {
    errors.push({ field: 'commentId', message: 'Workflow Comment Wajib Diisi' });
  }

  if (!temporaryFileId) {
    errors.push({ field: 'temporaryFileId', message: 'Temporary File Wajib Diisi' });
  }

  return {
    errors,
    isValid: errors.length === 0,
    value: {
      commentId,
      temporaryFileId,
    },
  };
};

module.exports = {
  validateDocumentCreate,
  validateDocumentUpdate,
  validateTemporaryFilePayload,
  validateWorkflowAttachmentPayload,
  validateArchivePayload,
};
