const STORAGE_DIRECTORIES = {
  TEMPORARY: 'temporary',
  PROJECTS: 'projects',
  DOCUMENTS: 'documents',
  REVISIONS: 'revisions',
  WORKFLOW_ATTACHMENTS: 'workflow-attachments',
};

const STORAGE_DRIVERS = {
  LOCAL: 'local',
  R2: 'r2',
};

const UPLOAD_FILE_FIELD = 'file';

const UPLOAD_ALLOWED_MIME_TYPES = Object.freeze({
  '.pdf': ['application/pdf'],
  '.png': ['image/png'],
  '.jpg': ['image/jpeg'],
  '.jpeg': ['image/jpeg'],
  '.docx': ['application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
  '.xlsx': ['application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'],
});

const UPLOAD_MESSAGES = Object.freeze({
  VALIDATION_ERROR: 'File upload tidak valid',
  UPLOAD_SUCCESSFUL: 'File berhasil diunggah ke temporary storage',
  STORAGE_FAILURE: 'Gagal menyimpan file upload',
});

module.exports = {
  STORAGE_DIRECTORIES,
  STORAGE_DRIVERS,
  UPLOAD_ALLOWED_MIME_TYPES,
  UPLOAD_FILE_FIELD,
  UPLOAD_MESSAGES,
};
