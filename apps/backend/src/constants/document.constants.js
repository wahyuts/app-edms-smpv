const DOCUMENT_PERMISSION = Object.freeze({
  CREATE: 'document-register.create',
  DOWNLOAD: 'document-register.download',
  VIEW: 'document-register.view',
});

const DOCUMENT_DRAWINGS = Object.freeze(['PFD', 'P&ID']);

const DOCUMENT_WORKFLOW_STATUS = Object.freeze({
  PROCESS_REVIEW: 'Process Review',
});

const DOCUMENT_LIFECYCLE_STATUS = Object.freeze({
  ACTIVE: 'Active',
});

const DOCUMENT_REVISION_LABEL = Object.freeze({
  IFR_SUBMITTED: 'IFR-Submitted',
});

const DOCUMENT_RESPONSIBLE_ROLE = Object.freeze({
  TEAM_PROCESS: 'Team Process',
});

const STORED_FILE_CATEGORY = Object.freeze({
  REVISION_FILE: 'Revision File',
  WORKFLOW_ATTACHMENT: 'Workflow Attachment',
});

const DOCUMENT_MESSAGES = Object.freeze({
  CREATED: 'Document berhasil dibuat',
  VALIDATION_ERROR: 'Data Document tidak valid',
  TEMPORARY_NOT_FOUND: 'Temporary upload tidak ditemukan',
  DUPLICATE_DOCUMENT: 'Document Number sudah digunakan pada Project ini',
});

module.exports = {
  DOCUMENT_DRAWINGS,
  DOCUMENT_LIFECYCLE_STATUS,
  DOCUMENT_MESSAGES,
  DOCUMENT_PERMISSION,
  DOCUMENT_RESPONSIBLE_ROLE,
  DOCUMENT_REVISION_LABEL,
  DOCUMENT_WORKFLOW_STATUS,
  STORED_FILE_CATEGORY,
};
