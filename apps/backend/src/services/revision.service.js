const {
  DOCUMENT_RESPONSIBLE_ROLE,
  DOCUMENT_LIFECYCLE_STATUS,
  DOCUMENT_REVISION_LABEL,
  DOCUMENT_WORKFLOW_STATUS,
  STORED_FILE_CATEGORY,
} = require('../constants/document.constants');
const documentRepository = require('../repositories/document.repository');
const projectMembershipRepository = require('../repositories/projectMembership.repository');
const auditService = require('./audit.service');
const notificationService = require('./notification.service');
const realtimeDocumentPublisher = require('./realtimeDocumentPublisher.service');
const slaNotificationProducer = require('./slaNotificationProducer.service');
const storageService = require('./storage.service');
const uploadService = require('./upload.service');
const workflowEngine = require('./workflowEngine.service');
const { createEntityId, createHttpError } = require('../utils/administration');
const {
  buildCanonicalPhysicalFileName,
  buildRevisionStorageKey,
} = require('../utils/storageKeyBuilder');
const { validateStoredFileCapacity } = require('../utils/storageMetadataCapacity');

const uploadRevisionTransitionMatrix = Object.freeze({
  [DOCUMENT_WORKFLOW_STATUS.PROCESS_COMMENT]: DOCUMENT_WORKFLOW_STATUS.PROCESS_REVIEW,
  [DOCUMENT_WORKFLOW_STATUS.PROCESS_REJECT]: DOCUMENT_WORKFLOW_STATUS.PROCESS_REVIEW,
  [DOCUMENT_WORKFLOW_STATUS.PROJECT_COMMENT]: DOCUMENT_WORKFLOW_STATUS.PROJECT_REVIEW,
  [DOCUMENT_WORKFLOW_STATUS.PROJECT_REJECT]: DOCUMENT_WORKFLOW_STATUS.PROJECT_REVIEW,
});

const createRevisionConflict = ({ conflictType, document, expectedState }) =>
  createHttpError(
    'Dokumen telah diperbarui oleh pengguna lain.',
    409,
    [{ field: 'document', message: 'Dokumen telah diperbarui oleh pengguna lain.' }],
    {
      code: 'REVISION_CONFLICT',
      data: {
        actualActiveRevisionId: document?.activeRevisionId || null,
        actualCurrentAssigneeUserId: document?.currentAssigneeUserId || null,
        actualWorkflowStatus: document?.status || document?.workflowStatus || null,
        conflictType,
        documentId: document?.id || expectedState?.documentId || null,
        expectedActiveRevisionId: expectedState?.activeRevisionId || null,
        expectedCurrentAssigneeUserId: expectedState?.currentAssigneeUserId || null,
        expectedWorkflowStatus: expectedState?.workflowStatus || null,
      },
    }
  );

const assertExpectedRevisionState = ({ document, expectedState }) => {
  if (!expectedState?.workflowStatus || !expectedState?.activeRevisionId) {
    throw createRevisionConflict({
      conflictType: 'EXPECTED_STATE_REQUIRED',
      document,
      expectedState,
    });
  }
  if (document.lifecycle !== DOCUMENT_LIFECYCLE_STATUS.ACTIVE) {
    throw createRevisionConflict({
      conflictType: 'DOCUMENT_ALREADY_PROCESSED',
      document,
      expectedState,
    });
  }
  if (document.status !== expectedState.workflowStatus) {
    throw createRevisionConflict({
      conflictType: 'WORKFLOW_STATE_CHANGED',
      document,
      expectedState,
    });
  }
  if (document.activeRevisionId !== expectedState.activeRevisionId) {
    throw createRevisionConflict({
      conflictType: 'ACTIVE_REVISION_CHANGED',
      document,
      expectedState,
    });
  }
  if (
    expectedState.currentAssigneeUserId &&
    String(document.currentAssigneeUserId) !== String(expectedState.currentAssigneeUserId)
  ) {
    throw createRevisionConflict({
      conflictType: 'CURRENT_ASSIGNEE_CHANGED',
      document,
      expectedState,
    });
  }
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

const uploadRevision = async ({ actorOfficialRole, actorUserFullName, actorUserId, documentId, payload }) => {
  const temporaryFileId = payload.temporaryFileId;
  const expectedState = {
    activeRevisionId: payload.expectedActiveRevisionId,
    currentAssigneeUserId: payload.expectedCurrentAssigneeUserId,
    workflowStatus: payload.expectedWorkflowStatus,
  };
  const temporaryMetadata = await uploadService.assertTemporaryUploadConsumable({
    actorUserId,
    temporaryFileId,
  });
  const document = await documentRepository.findDocumentRegisterById(documentId);

  if (!document) {
    throw createHttpError('Document Tidak Ditemukan', 404);
  }

  await assertActorCanUploadRevision({ document, userId: actorUserId });

  const revisionId = createEntityId('REV');
  const fileId = createEntityId('FILE');
  const revisionSequence = await documentRepository.getNextRevisionSequence(document.id);
  let nextStatus = null;
  let nextAssignee = null;
  let revisionLabel = null;
  const submittedAt = new Date();
  let physicalFileName = null;
  let storageKey = null;
  const nextMetadata = {
    area: payload.area ?? document.area,
    daysUntilValidation: payload.daysUntilValidation ?? document.daysUntilValidation,
    description: payload.description ?? document.description,
    documentTypeId: document.documentTypeId || null,
    drawing: document.drawing,
  };
  let finalized = false;

  try {
    assertExpectedRevisionState({ document, expectedState });

    nextStatus = uploadRevisionTransitionMatrix[document.status];
    if (!nextStatus) {
      throw createHttpError('Upload Revision Tidak Diizinkan Pada Status Ini', 422, [
        { field: 'status', message: 'Upload Revision Tidak Diizinkan Pada Status Ini' },
      ]);
    }

    nextAssignee = await workflowEngine.resolveCurrentAssigneeForStatus({
      projectId: document.projectId,
      status: nextStatus,
    });

    if (!nextAssignee) {
      throw createHttpError('Current Assignee Tidak Tersedia Untuk Status Tujuan', 409);
    }

    revisionLabel = nextStatus === DOCUMENT_WORKFLOW_STATUS.PROJECT_REVIEW
      ? DOCUMENT_REVISION_LABEL.IFA_SUBMITTED
      : DOCUMENT_REVISION_LABEL.IFR_SUBMITTED;
    physicalFileName = buildCanonicalPhysicalFileName({
      documentNumber: document.documentNumber,
      fileId,
      originalFileName: temporaryMetadata.originalFileName,
      revisionLabel,
      submittedAt,
    });
    storageKey = buildRevisionStorageKey({
      documentNumber: document.documentNumber,
      physicalFileName,
      projectCode: document.projectCode,
      revisionLabel,
    });
    validateStoredFileCapacity({
      originalFileName: temporaryMetadata.originalFileName,
      physicalFileName,
      relativePath: storageKey,
      storageKey,
    });

    await documentRepository.runInTransaction(async (connection) => {
      const workflowAffectedRows = await documentRepository.updateDocumentWorkflowState(connection, {
        currentAssigneeUserId: nextAssignee.userId,
        documentId: document.id,
        expectedState: {
          activeRevisionId: expectedState.activeRevisionId,
          currentAssigneeUserId: document.currentAssigneeUserId || null,
          lifecycleStatus: DOCUMENT_LIFECYCLE_STATUS.ACTIVE,
          workflowStatus: expectedState.workflowStatus,
        },
        responsibleRole: workflowEngine.getResponsibleRoleForStatus(nextStatus),
        revisionLabel,
        resetSla: true,
        slaStoppedAtExpression: 'NULL',
        updatedByUserId: actorUserId,
        workflowStatus: nextStatus,
      });

      if (workflowAffectedRows !== 1) {
        throw createRevisionConflict({
          conflictType: 'ACTIVE_REVISION_CHANGED',
          document,
          expectedState,
        });
      }
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
    if (!finalized && temporaryMetadata && error?.code === 'REVISION_CONFLICT') {
      await uploadService.discardTemporaryUpload(temporaryMetadata);
    }
    throw error;
  }

  const updatedDocument = await documentRepository.findDocumentRegisterById(document.id);
  await notificationService.createDocumentNotificationsForOfficialRoles({
    document: updatedDocument,
    eventType: notificationService.NOTIFICATION_EVENT_TYPE.REVISION_UPLOADED,
    identityBasis: revisionId,
    officialRoles: [updatedDocument.responsibleRole],
  });
  await slaNotificationProducer.evaluateDocumentForSlaNotifications({
    document: updatedDocument,
    triggerSource: 'revision_upload',
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
  realtimeDocumentPublisher.publishRevisionUploaded({
    actorUserId,
    document: updatedDocument,
    revisionId,
  });

  return updatedDocument;
};

module.exports = {
  uploadRevision,
  uploadRevisionTransitionMatrix,
};
