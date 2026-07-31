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
const uploadService = require('./upload.service');
const workflowEngine = require('./workflowEngine.service');
const { createEntityId, createHttpError } = require('../utils/administration');
const {
  buildCanonicalPhysicalFileName,
  buildRevisionStorageKey,
} = require('../utils/storageKeyBuilder');

const uploadRevisionTransitionMatrix = Object.freeze({
  [DOCUMENT_WORKFLOW_STATUS.PROCESS_COMMENT]: DOCUMENT_WORKFLOW_STATUS.PROCESS_REVIEW,
  [DOCUMENT_WORKFLOW_STATUS.PROCESS_REJECT]: DOCUMENT_WORKFLOW_STATUS.PROCESS_REVIEW,
  [DOCUMENT_WORKFLOW_STATUS.PROJECT_COMMENT]: DOCUMENT_WORKFLOW_STATUS.PROJECT_REVIEW,
  [DOCUMENT_WORKFLOW_STATUS.PROJECT_REJECT]: DOCUMENT_WORKFLOW_STATUS.PROJECT_REVIEW,
});

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

const uploadRevision = async ({ actorOfficialRole, actorUserFullName, actorUserId, documentId, payload }) => {
  const temporaryFileId = payload.temporaryFileId;
  const temporaryMetadata = await uploadService.assertTemporaryUploadConsumable({
    actorUserId,
    temporaryFileId,
  });
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
  const submittedAt = new Date();
  const physicalFileName = buildCanonicalPhysicalFileName({
    documentNumber: document.documentNumber,
    fileId,
    originalFileName: temporaryMetadata.originalFileName,
    revisionLabel,
    submittedAt,
  });
  const storageKey = buildRevisionStorageKey({
    documentNumber: document.documentNumber,
    physicalFileName,
    projectCode: document.projectCode,
    revisionLabel,
  });
  const nextMetadata = {
    area: payload.area ?? document.area,
    daysUntilValidation: payload.daysUntilValidation ?? document.daysUntilValidation,
    description: payload.description ?? document.description,
    documentTypeId: document.documentTypeId || null,
    drawing: document.drawing,
  };
  let finalized = false;

  try {
    await documentRepository.runInTransaction(async (connection) => {
      await documentRepository.updateDocumentMetadata(connection, {
        ...nextMetadata,
        documentId: document.id,
        updatedByUserId: actorUserId,
      });
      await documentRepository.deactivateDocumentRevisions(connection, document.id);
      await documentRepository.deactivateDocumentRevisionFiles(connection, document.id);
      await documentRepository.insertStoredFile(connection, {
        fileId,
        projectId: document.projectId,
        documentId: document.id,
        originalFileName: temporaryMetadata.originalFileName,
        physicalFileName,
        extension: temporaryMetadata.extension,
        mimeType: temporaryMetadata.mimeType,
        fileSize: temporaryMetadata.fileSize,
        storageKey,
        relativePath: storageKey,
        fileCategory: STORED_FILE_CATEGORY.REVISION_FILE,
        checksum: temporaryMetadata.checksum || null,
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

      const consumedRows = await uploadService.consumeTemporaryUploadMetadata(connection, temporaryFileId);
      if (consumedRows !== 1) {
        throw createHttpError('Temporary upload tidak ditemukan atau sudah digunakan', 409, [
          { field: 'temporaryFileId', message: 'Temporary upload tidak ditemukan atau sudah digunakan' },
        ]);
      }
      await storageService.finalize(temporaryMetadata.storageKey, storageKey);
      finalized = true;
    });
  } catch (error) {
    if (finalized) {
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
