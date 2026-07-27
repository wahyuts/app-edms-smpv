const DOCUMENT_PERMISSION = Object.freeze({
  APPROVAL_A: 'approval.a',
  APPROVAL_B: 'approval.b',
  APPROVAL_C: 'approval.c',
  ARCHIVE: 'document-register.archive',
  CREATE: 'document-register.create',
  DOWNLOAD: 'document-register.download',
  EDIT: 'document-register.edit',
  UPLOAD: 'document-register.upload',
  VIEW: 'document-register.view',
});

const DOCUMENT_WORKFLOW_ACTION = Object.freeze({
  APPROVAL_A: 'Approval A',
  APPROVAL_B: 'Approval B',
  APPROVAL_C: 'Approval C',
});

const DOCUMENT_DRAWINGS = Object.freeze(['PFD', 'P&ID']);

const DOCUMENT_WORKFLOW_STATUS = Object.freeze({
  APPROVED: 'Approved',
  PROCESS_COMMENT: 'Process Comment',
  PROCESS_REJECT: 'Process Reject',
  PROCESS_REVIEW: 'Process Review',
  PROJECT_COMMENT: 'Project Comment',
  PROJECT_REJECT: 'Project Reject',
  PROJECT_REVIEW: 'Project Review',
});

const DOCUMENT_LIFECYCLE_STATUS = Object.freeze({
  ACTIVE: 'Active',
  ARCHIVED: 'Archived',
});

const DOCUMENT_REVISION_LABEL = Object.freeze({
  AS_BUILT: 'AS-Built',
  IFA_SUBMITTED: 'IFA-Submitted',
  IFR_SUBMITTED: 'IFR-Submitted',
});

const DOCUMENT_RESPONSIBLE_ROLE = Object.freeze({
  DOCUMENT_OWNER: 'Document Owner',
  NONE: 'None',
  TEAM_PROCESS: 'Team Process',
  TEAM_PROJECT: 'Team Project',
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
  HISTORY_LOADED: 'Riwayat Document Berhasil Dimuat',
  WORKFLOW_TRANSITION_NOT_ALLOWED: 'Workflow Transition Tidak Diizinkan',
});

module.exports = {
  DOCUMENT_DRAWINGS,
  DOCUMENT_LIFECYCLE_STATUS,
  DOCUMENT_MESSAGES,
  DOCUMENT_PERMISSION,
  DOCUMENT_RESPONSIBLE_ROLE,
  DOCUMENT_REVISION_LABEL,
  DOCUMENT_WORKFLOW_ACTION,
  DOCUMENT_WORKFLOW_STATUS,
  STORED_FILE_CATEGORY,
};
