const path = require('node:path');
const {
  DOCUMENT_RESPONSIBLE_ROLE,
  DOCUMENT_REVISION_LABEL,
  DOCUMENT_WORKFLOW_STATUS,
  STORED_FILE_CATEGORY,
} = require('../constants/document.constants');
const documentRepository = require('../repositories/document.repository');
const projectMembershipRepository = require('../repositories/projectMembership.repository');
const auditService = require('./audit.service');
const notificationService = require('./notification.service');
const storageService = require('./storage.service');
const workflowEngine = require('./workflowEngine.service');
const { createEntityId, createHttpError } = require('../utils/administration');
const { sanitizeFileName } = require('../utils/fileName');
const { validateUploadedFile } = require('../validators/upload.validator');

const uploadRevisionTransitionMatrix = Object.freeze({
  [DOCUMENT_WORKFLOW_STATUS.PROCESS_COMMENT]: DOCUMENT_WORKFLOW_STATUS.PROCESS_REVIEW,
  [DOCUMENT_WORKFLOW_STATUS.PROCESS_REJECT]: DOCUMENT_WORKFLOW_STATUS.PROCESS_REVIEW,
  [DOCUMENT_WORKFLOW_STATUS.PROJECT_COMMENT]: DOCUMENT_WORKFLOW_STATUS.PROJECT_REVIEW,
  [DOCUMENT_WORKFLOW_STATUS.PROJECT_REJECT]: DOCUMENT_WORKFLOW_STATUS.PROJECT_REVIEW,
});

const toStorageSafeSegment = (value) => {
  const sanitized = sanitizeFileName(value)
    .replace(/\s+/g, '_')
    .replace(/[^A-Za-z0-9._-]/g, '_')
    .replace(/_+/g, '_')
    .replace(/^_+|_+$/g, '');

  return sanitized || 'file';
};

const buildRevisionPhysicalFileName = ({ documentNumber, fileId, originalFileName, revisionLabel }) => {
  const extension = path.extname(originalFileName);
  const baseName = path.basename(originalFileName, extension);
  const shortFileId = fileId.split('-')[1]?.slice(0, 8) || fileId.slice(0, 8);

  return toStorageSafeSegment(`${documentNumber}_${revisionLabel}_${shortFileId}_${baseName}${extension}`);
};

const assertActorCanUploadRevision = async ({ document, userId }) => {
  const membership = await projectMembershipRepository.findActiveMembershipByProjectAndUser({
    projectId: document.projectId,
    userId,
  });

  if (!membership) {
    throw createHttpError('User Tidak Memiliki Akses Project', 403);
  }

  if (![DOCUMENT_RESPONSIBLE_ROLE.DOCUMENT_OWNER, 'Admin'].includes(membership.officialRole)) {
    throw createHttpError('Official Role Tidak Sesuai Untuk Upload Revision', 403);
  }

  return membership;
};

const uploadRevision = async ({ actorOfficialRole, actorUserFullName, actorUserId, documentId, file }) => {
  const validatedFile = validateUploadedFile(file);
  const document = await documentRepository.findDocumentRegisterById(documentId);

  if (!document) {
    throw createHttpError('Document Tidak Ditemukan', 404);
  }

  const nextStatus = uploadRevisionTransitionMatrix[document.status];
  if (!nextStatus) {
    throw createHttpError('Upload Revision Tidak Diizinkan Pada Status Ini', 422, [
      { field: 'status', message: 'Upload Revision Tidak Diizinkan Pada Status Ini' },
    ]);
  }

  await assertActorCanUploadRevision({ document, userId: actorUserId });

  const nextAssignee = await workflowEngine.resolveCurrentAssigneeForStatus({
    projectId: document.projectId,
    status: nextStatus,
  });

  if (!nextAssignee) {
    throw createHttpError('Current Assignee Tidak Tersedia Untuk Status Tujuan', 409);
  }

  const revisionId = createEntityId('REV');
  const fileId = createEntityId('FILE');
  const revisionSequence = await documentRepository.getNextRevisionSequence(document.id);
  const revisionLabel = nextStatus === DOCUMENT_WORKFLOW_STATUS.PROJECT_REVIEW
    ? DOCUMENT_REVISION_LABEL.IFA_SUBMITTED
    : DOCUMENT_REVISION_LABEL.IFR_SUBMITTED;
  const physicalFileName = buildRevisionPhysicalFileName({
    documentNumber: document.documentNumber,
    fileId,
    originalFileName: validatedFile.originalFileName,
    revisionLabel,
  });
  const storageKey = `projects/${document.projectId}/documents/${document.id}/revisions/${revisionId}/${physicalFileName}`;
  let storageWritten = false;

  try {
    await storageService.put(storageKey, validatedFile.buffer);
    storageWritten = true;

    await documentRepository.runInTransaction(async (connection) => {
      await documentRepository.deactivateDocumentRevisions(connection, document.id);
      await documentRepository.deactivateDocumentRevisionFiles(connection, document.id);
      await documentRepository.insertStoredFile(connection, {
        fileId,
        projectId: document.projectId,
        documentId: document.id,
        originalFileName: validatedFile.originalFileName,
        physicalFileName,
        extension: validatedFile.extension,
        mimeType: validatedFile.mimeType,
        fileSize: validatedFile.fileSize,
        storageKey,
        relativePath: storageKey,
        fileCategory: STORED_FILE_CATEGORY.REVISION_FILE,
        checksum: null,
        uploadedByUserId: actorUserId,
        isActive: true,
      });
      await documentRepository.insertRevision(connection, {
        id: revisionId,
        projectId: document.projectId,
        documentId: document.id,
        revisionLabel,
        revisionSequence,
        fileId,
        storagePathLegacy: storageKey,
        isActive: true,
        sourceStatus: document.status,
        resultStatus: nextStatus,
        createdByUserId: actorUserId,
      });
      await documentRepository.updateDocumentActivePointers(connection, {
        activeFileId: fileId,
        activeRevisionId: revisionId,
        documentId: document.id,
        updatedByUserId: actorUserId,
      });
      await documentRepository.updateDocumentWorkflowState(connection, {
        currentAssigneeUserId: nextAssignee.userId,
        documentId: document.id,
        responsibleRole: workflowEngine.getResponsibleRoleForStatus(nextStatus),
        revisionLabel,
        resetSla: true,
        slaStoppedAtExpression: 'NULL',
        updatedByUserId: actorUserId,
        workflowStatus: nextStatus,
      });
      await documentRepository.insertDocumentHistory(connection, {
        id: createEntityId('DTH'),
        projectId: document.projectId,
        documentId: document.id,
        workflowEvent: 'Upload Revision Completed',
        activity: 'Upload Revision',
        workflowStatus: nextStatus,
        revisionLabel,
        lifecycleStatus: document.lifecycle,
        reason: null,
        createdByUserId: actorUserId,
        createdByNameSnapshot: actorUserFullName || null,
        createdByOfficialRoleSnapshot: actorOfficialRole || DOCUMENT_RESPONSIBLE_ROLE.DOCUMENT_OWNER,
      });
    });
  } catch (error) {
    if (storageWritten) {
      await storageService.delete(storageKey).catch(() => {});
    }
    throw error;
  }

  const updatedDocument = await documentRepository.findDocumentRegisterById(document.id);
  await notificationService.createDocumentNotification({
    document: updatedDocument,
    eventType: notificationService.NOTIFICATION_EVENT_TYPE.REVISION_UPLOADED,
    identityBasis: revisionId,
    recipientUserId: updatedDocument.currentAssigneeUserId,
  });
  await auditService.recordActivitySafely({
    action: 'Upload Revision',
    actorOfficialRole,
    actorUserFullName,
    actorUserId,
    identityKey: ['Upload Revision', updatedDocument.projectId, updatedDocument.id, revisionId].join(':'),
    metadata: {
      nextStatus,
      previousStatus: document.status,
      revision: revisionLabel,
      revisionSequence,
    },
    projectId: updatedDocument.projectId,
    reference: updatedDocument.documentNumber,
    resourceId: revisionId,
    resourceType: 'Document',
  });

  return updatedDocument;
};

module.exports = {
  uploadRevision,
  uploadRevisionTransitionMatrix,
};
