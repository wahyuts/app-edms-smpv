const path = require('node:path');
const storageConfig = require('../config/storage');
const { STORAGE_DIRECTORIES } = require('../constants/storage.constants');
const { validateProjectCode, validateDocumentCode } = require('../validators/storage.validator');

const ensurePathInsideStorage = (targetPath) => {
  const storageRoot = path.resolve(storageConfig.rootPath);
  const resolvedTargetPath = path.resolve(targetPath);
  const relativePath = path.relative(storageRoot, resolvedTargetPath);
  const isOutside = relativePath.startsWith('..') || path.isAbsolute(relativePath);

  if (isOutside) {
    throw new Error('[STORAGE] Resolved path is outside storage root');
  }

  return resolvedTargetPath;
};

const getStorageRootPath = () => {
  return ensurePathInsideStorage(storageConfig.rootPath);
};

const getProjectsRootPath = () => {
  return ensurePathInsideStorage(storageConfig.projectsPath);
};

const getProjectPath = (projectCode) => {
  const safeProjectCode = validateProjectCode(projectCode);

  return ensurePathInsideStorage(path.join(getProjectsRootPath(), safeProjectCode));
};

const getDocumentPath = (projectCode, documentCode) => {
  const safeDocumentCode = validateDocumentCode(documentCode);

  return ensurePathInsideStorage(
    path.join(getProjectPath(projectCode), STORAGE_DIRECTORIES.DOCUMENTS, safeDocumentCode)
  );
};

const getRevisionDirectoryPath = (projectCode, documentCode) => {
  return ensurePathInsideStorage(
    path.join(getDocumentPath(projectCode, documentCode), STORAGE_DIRECTORIES.REVISIONS)
  );
};

const getWorkflowAttachmentDirectoryPath = (projectCode, documentCode) => {
  return ensurePathInsideStorage(
    path.join(getDocumentPath(projectCode, documentCode), STORAGE_DIRECTORIES.WORKFLOW_ATTACHMENTS)
  );
};

module.exports = {
  ensurePathInsideStorage,
  getStorageRootPath,
  getProjectsRootPath,
  getProjectPath,
  getDocumentPath,
  getRevisionDirectoryPath,
  getWorkflowAttachmentDirectoryPath,
};
