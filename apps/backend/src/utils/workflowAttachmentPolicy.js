const { createHttpError } = require('./administration');

const ACTION = 'Emergency Workflow Attachment';
const validateWorkflowAttachment = (file) => {
  const types = { pdf: ['application/pdf'], png: ['image/png'], jpg: ['image/jpeg'], jpeg: ['image/jpeg'] };
  const extension = String(file?.extension || '').replace(/^\./, '').toLowerCase();
  if (!types[extension]?.includes(file?.mimeType) || !Number.isSafeInteger(file?.fileSize) ||
    file.fileSize <= 0 || file.fileSize > 100 * 1024 * 1024) {
    throw createHttpError('Attachment harus PDF, JPG, atau PNG dengan ukuran maksimal 100 MB.', 422);
  }
};

module.exports = { EMERGENCY_ACTION: ACTION, validateWorkflowAttachment };
