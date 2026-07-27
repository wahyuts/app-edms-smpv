const path = require('node:path');
const {
  DOCUMENT_LIFECYCLE_STATUS,
  DOCUMENT_MESSAGES,
  DOCUMENT_RESPONSIBLE_ROLE,
  DOCUMENT_REVISION_LABEL,
  DOCUMENT_WORKFLOW_STATUS,
  STORED_FILE_CATEGORY,
} = require('../constants/document.constants');
const { PROJECT_STATUS } = require('../constants/administration.constants');
const documentRepository = require('../repositories/document.repository');
const projectRepository = require('../repositories/project.repository');
const storageService = require('./storage.service');
const uploadService = require('./upload.service');
const { createEntityId, createHttpError, mapDuplicateError } = require('../utils/administration');
const { sanitizeFileName } = require('../utils/fileName');

const toStorageSafeSegment = (value) => {
  const sanitized = sanitizeFileName(value)
    .replace(/\s+/g, '_')
    .replace(/[^A-Za-z0-9._-]/g, '_')
    .replace(/_+/g, '_')
    .replace(/^_+|_+$/g, '');

  return sanitized || 'file';
};

const buildPermanentPhysicalFileName = ({ documentNumber, fileId, originalFileName, revisionLabel }) => {
  const extension = path.extname(originalFileName);
  const baseName = path.basename(originalFileName, extension);
  const shortFileId = fileId.split('-')[1]?.slice(0, 8) || fileId.slice(0, 8);

  return toStorageSafeSegment(`${documentNumber}_${revisionLabel}_${shortFileId}_${baseName}${extension}`);
};

const buildPermanentStorageKey = ({ documentId, physicalFileName, projectId, revisionId }) => {
  return `projects/${projectId}/documents/${documentId}/revisions/${revisionId}/${physicalFileName}`;
};

const assertTemporaryUploadAvailable = async (temporaryFileId) => {
  const temporaryMetadata = await uploadService.getTemporaryUploadMetadata(temporaryFileId);

  if (!temporaryMetadata) {
    throw createHttpError(DOCUMENT_MESSAGES.TEMPORARY_NOT_FOUND, 404, [
      { field: 'temporaryFileId', message: DOCUMENT_MESSAGES.TEMPORARY_NOT_FOUND },
    ]);
  }

  if (!(await storageService.exists(temporaryMetadata.storageKey))) {
    throw createHttpError('Temporary upload file tidak ditemukan di storage', 409, [
      { field: 'temporaryFileId', message: 'Temporary upload file tidak ditemukan di storage' },
    ]);
  }

  return temporaryMetadata;
};

const resolveProjectId = ({ activeProject, payload }) => {
  return payload.projectId || activeProject?.id || null;
};

const assertActiveProject = async (projectId) => {
  if (!projectId) {
    throw createHttpError('Project Aktif Wajib Dipilih', 422, [
      { field: 'projectId', message: 'Project Aktif Wajib Dipilih' },
    ]);
  }

  const project = await projectRepository.findProjectById(projectId);
  if (!project) {
    throw createHttpError('Project Tidak Ditemukan', 404);
  }

  if (project.status !== PROJECT_STATUS.ACTIVE) {
    throw createHttpError('Project Harus Active', 422, [
      { field: 'projectId', message: 'Project Harus Active' },
    ]);
  }

  return project;
};

const assertDocumentNumberUnique = async ({ documentNumber, projectId }) => {
  const existingDocument = await documentRepository.findDocumentByProjectAndNumber({
    documentNumber,
    projectId,
  });

  if (existingDocument) {
    throw createHttpError(DOCUMENT_MESSAGES.DUPLICATE_DOCUMENT, 409, [
      { field: 'documentNumber', message: DOCUMENT_MESSAGES.DUPLICATE_DOCUMENT },
    ]);
  }
};

const createDocument = async ({ activeProject, actorUserId, payload }) => {
  const projectId = resolveProjectId({ activeProject, payload });
  await assertActiveProject(projectId);
  await assertDocumentNumberUnique({ documentNumber: payload.documentNumber, projectId });

  const temporaryMetadata = await assertTemporaryUploadAvailable(payload.temporaryFileId);
  const documentType = await documentRepository.findDocumentTypeByDrawing(payload.drawing);
  const documentId = createEntityId(payload.drawing === 'PFD' ? 'DOC-PFD' : 'DOC-PID');
  const revisionId = createEntityId('REV');
  const fileId = createEntityId('FILE');
  const revisionLabel = DOCUMENT_REVISION_LABEL.IFR_SUBMITTED;
  const physicalFileName = buildPermanentPhysicalFileName({
    documentNumber: payload.documentNumber,
    fileId,
    originalFileName: temporaryMetadata.originalFileName,
    revisionLabel,
  });
  const permanentStorageKey = buildPermanentStorageKey({
    documentId,
    physicalFileName,
    projectId,
    revisionId,
  });

  let finalized = false;

  try {
    await documentRepository.runInTransaction(async (connection) => {
      await documentRepository.insertDocument(connection, {
        id: documentId,
        projectId,
        documentTypeId: documentType?.id || null,
        documentNumber: payload.documentNumber,
        description: payload.description,
        drawing: payload.drawing,
        area: payload.area,
        daysUntilValidation: payload.daysUntilValidation,
        workflowStatus: DOCUMENT_WORKFLOW_STATUS.PROCESS_REVIEW,
        lifecycleStatus: DOCUMENT_LIFECYCLE_STATUS.ACTIVE,
        revisionLabel,
        responsibleRole: DOCUMENT_RESPONSIBLE_ROLE.TEAM_PROCESS,
        currentAssigneeUserId: null,
        createdByUserId: actorUserId,
      });
      await documentRepository.insertStoredFile(connection, {
        fileId,
        projectId,
        documentId,
        originalFileName: temporaryMetadata.originalFileName,
        physicalFileName,
        extension: temporaryMetadata.extension,
        mimeType: temporaryMetadata.mimeType,
        fileSize: temporaryMetadata.fileSize,
        storageKey: permanentStorageKey,
        relativePath: permanentStorageKey,
        fileCategory: STORED_FILE_CATEGORY.REVISION_FILE,
        checksum: temporaryMetadata.checksum || null,
        uploadedByUserId: actorUserId,
        isActive: true,
      });
      await documentRepository.insertRevision(connection, {
        id: revisionId,
        projectId,
        documentId,
        revisionLabel,
        revisionSequence: 1,
        fileId,
        storagePathLegacy: permanentStorageKey,
        isActive: true,
        sourceStatus: null,
        resultStatus: DOCUMENT_WORKFLOW_STATUS.PROCESS_REVIEW,
        createdByUserId: actorUserId,
      });
      await documentRepository.updateDocumentActivePointers(connection, {
        activeFileId: fileId,
        activeRevisionId: revisionId,
        documentId,
        updatedByUserId: actorUserId,
      });

      const consumedRows = await uploadService.consumeTemporaryUploadMetadata(connection, payload.temporaryFileId);
      if (consumedRows !== 1) {
        throw createHttpError(DOCUMENT_MESSAGES.TEMPORARY_NOT_FOUND, 409, [
          { field: 'temporaryFileId', message: DOCUMENT_MESSAGES.TEMPORARY_NOT_FOUND },
        ]);
      }
      await storageService.finalize(temporaryMetadata.storageKey, permanentStorageKey);
      finalized = true;
    });
  } catch (error) {
    if (finalized) {
      await storageService.delete(permanentStorageKey).catch(() => {});
    }

    const duplicateError = mapDuplicateError(error, DOCUMENT_MESSAGES.DUPLICATE_DOCUMENT, 'documentNumber');
    throw duplicateError || error;
  }

  return documentRepository.findDocumentFoundationById(documentId);
};

module.exports = {
  createDocument,
};
