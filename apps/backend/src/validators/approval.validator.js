const { normalizeText } = require('../utils/administration');

const validateApprovalPayload = (body = {}, { requireComment = false } = {}) => {
  const comment = normalizeText(body.comment ?? body.workflowComment ?? body.reason);
  const temporaryFileId = normalizeText(body.temporaryFileId);
  const errors = [];

  if (requireComment && !comment) {
    errors.push({ field: 'comment', message: 'Workflow Comment Wajib Diisi' });
  }

  return {
    errors,
    isValid: errors.length === 0,
    value: {
      comment,
      temporaryFileId: temporaryFileId || null,
    },
  };
};

module.exports = {
  validateApprovalPayload,
};
