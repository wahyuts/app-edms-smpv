const path = require('node:path');
const { STORAGE_DIRECTORIES } = require('../constants/storage.constants');
const { sanitizeFileName } = require('./fileName');

const toStorageSafeSegment = (value) => {
  const sanitized = sanitizeFileName(String(value || ''))
    .replace(/\s+/g, '_')
    .replace(/[^A-Za-z0-9._-]/g, '_')
    .replace(/_+/g, '_')
    .replace(/^_+|_+$/g, '');

  return sanitized || 'file';
};

const formatSubmitDate = (date = new Date()) => {
  const submittedAt = date instanceof Date ? date : new Date(date);

  if (Number.isNaN(submittedAt.getTime())) {
    throw new Error('[STORAGE] submit date is invalid');
  }

  return submittedAt.toISOString().slice(0, 10).replace(/-/g, '');
};

const getShortFileId = (fileId) => {
  const normalizedFileId = String(fileId || '').trim();
  const stableIdentity = normalizedFileId.includes('-')
    ? normalizedFileId.split('-').find((segment) => segment.length >= 8) || normalizedFileId
    : normalizedFileId;

  return toStorageSafeSegment(stableIdentity.slice(0, 8) || normalizedFileId.slice(0, 8));
};

const buildCanonicalPhysicalFileName = ({
  documentNumber,
  fileId,
  originalFileName,
  revisionLabel,
  submittedAt = new Date(),
}) => {
  const safeOriginalFileName = sanitizeFileName(originalFileName);
  const extension = path.extname(safeOriginalFileName);
  const baseName = path.basename(safeOriginalFileName, extension);
  const submitDate = formatSubmitDate(submittedAt);
  const shortFileId = getShortFileId(fileId);

  return toStorageSafeSegment(
    `${documentNumber}_${revisionLabel}_${submitDate}_${shortFileId}_${baseName}${extension}`
  );
};

const buildRevisionStorageKey = ({
  documentNumber,
  physicalFileName,
  projectCode,
  revisionLabel,
}) => {
  return [
    STORAGE_DIRECTORIES.PROJECTS,
    toStorageSafeSegment(projectCode),
    STORAGE_DIRECTORIES.DOCUMENTS,
    toStorageSafeSegment(documentNumber),
    STORAGE_DIRECTORIES.REVISIONS,
    toStorageSafeSegment(revisionLabel),
    physicalFileName,
  ].join('/');
};

const getAttachmentDirectoryForWorkflowStatus = (workflowStatus) => {
  return String(workflowStatus || '').startsWith('Project')
    ? STORAGE_DIRECTORIES.PROJECT_COMMENTS
    : STORAGE_DIRECTORIES.PROCESS_COMMENTS;
};

const buildAttachmentPhysicalFileName = ({ attachmentId, originalFileName }) => {
  const safeOriginalFileName = sanitizeFileName(originalFileName);
  const extension = path.extname(safeOriginalFileName);
  const baseName = path.basename(safeOriginalFileName, extension);
  const shortAttachmentId = getShortFileId(attachmentId);

  return toStorageSafeSegment(`${shortAttachmentId}_${baseName}${extension}`);
};

const buildAttachmentStorageKey = ({
  documentNumber,
  physicalFileName,
  projectCode,
  workflowStatus,
}) => {
  return [
    STORAGE_DIRECTORIES.PROJECTS,
    toStorageSafeSegment(projectCode),
    STORAGE_DIRECTORIES.DOCUMENTS,
    toStorageSafeSegment(documentNumber),
    STORAGE_DIRECTORIES.ATTACHMENTS,
    getAttachmentDirectoryForWorkflowStatus(workflowStatus),
    physicalFileName,
  ].join('/');
};

module.exports = {
  buildAttachmentPhysicalFileName,
  buildAttachmentStorageKey,
  buildCanonicalPhysicalFileName,
  buildRevisionStorageKey,
  formatSubmitDate,
  getAttachmentDirectoryForWorkflowStatus,
  getShortFileId,
  toStorageSafeSegment,
};
