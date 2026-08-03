const { normalizeText } = require('../utils/administration');

const validateApprovalPayload = (body = {}, { requireComment = false } = {}) => {
  const comment = normalizeText(body.comment ?? body.workflowComment ?? body.reason);
  const expectedActiveRevisionId = normalizeText(body.expectedActiveRevisionId);
  const expectedCurrentAssigneeUserId = normalizeText(body.expectedCurrentAssigneeUserId);
  const expectedWorkflowStatus = normalizeText(body.expectedWorkflowStatus);
  const temporaryFileId = normalizeText(body.temporaryFileId);
  const errors = [];

  if (requireComment && !comment) {
    errors.push({ field: 'comment', message: 'Workflow Comment Wajib Diisi' });
  }
  if (!expectedWorkflowStatus) {
    errors.push({ field: 'expectedWorkflowStatus', message: 'Expected Workflow Status Wajib Diisi' });
  }
  if (!expectedActiveRevisionId) {
    errors.push({ field: 'expectedActiveRevisionId', message: 'Expected Active Revision Wajib Diisi' });
  }

  return {
    errors,
    isValid: errors.length === 0,
    value: {
      comment,
      expectedActiveRevisionId,
      expectedCurrentAssigneeUserId: expectedCurrentAssigneeUserId || null,
      expectedWorkflowStatus,
      temporaryFileId: temporaryFileId || null,
    },
  };
};

module.exports = {
  validateApprovalPayload,
};
