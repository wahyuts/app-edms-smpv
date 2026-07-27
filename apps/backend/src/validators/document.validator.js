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

module.exports = {
  validateDocumentCreate,
};
