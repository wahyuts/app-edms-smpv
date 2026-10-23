const {
  DOCUMENT_RESPONSIBLE_ROLE,
  DOCUMENT_LIFECYCLE_STATUS,
  DOCUMENT_REVISION_LABEL,
  DOCUMENT_WORKFLOW_STATUS,
  STORED_FILE_CATEGORY,
} = require('../constants/document.constants');
const documentRepository = require('../repositories/document.repository');
const projectMembershipRepository = require('../repositories/projectMembership.repository');
const projectRepository = require('../repositories/project.repository');
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

const saveDocumentRevision = async ({ activeProject, actorOfficialRole, actorUserFullName, actorUserId, documentId, metadata, payload }, adminEdit = false) => {
  const temporaryFileId = payload.temporaryFileId;
  const expectedState = {
    activeRevisionId: payload.expectedActiveRevisionId,
    currentAssigneeUserId: payload.expectedCurrentAssigneeUserId,
    workflowStatus: payload.expectedWorkflowStatus,
  };
  const temporaryMetadata = temporaryFileId ? await uploadService.assertTemporaryUploadConsumable({
    actorUserId,
    temporaryFileId,
  }) : null;
  const document = await documentRepository.findDocumentRegisterById(documentId);

  if (!document) {
    throw createHttpError('Document Tidak Ditemukan', 404);
  }

  const membership = await assertActorCanUploadRevision({ document, userId: actorUserId });
  const isAdmin = membership.officialRole === 'Admin';
  if (adminEdit && !isAdmin) {
    throw createHttpError('Edit administratif hanya diizinkan untuk Admin project aktif.', 403);
  }
  if (!temporaryMetadata && !adminEdit) {
    throw createHttpError('Temporary File Wajib Diisi', 422);
  }
  if (isAdmin) {
    if (!activeProject?.id || activeProject.id !== document.projectId) {
      throw createHttpError('Dokumen tidak berada pada project aktif.', 403);
    }
    const project = await projectRepository.findProjectById(document.projectId);
    if (project?.status !== 'Active') {
      throw createHttpError('Project harus aktif.', 422);
    }
    if (!Object.values(DOCUMENT_WORKFLOW_STATUS).includes(document.status)) {
      throw createHttpError('Status workflow dokumen tidak valid.', 422);
    }
    actorOfficialRole = membership.officialRole;
  }

  const revisionId = temporaryMetadata ? createEntityId('REV') : null;
  const fileId = temporaryMetadata ? createEntityId('FILE') : null;
  const revisionSequence = temporaryMetadata ? await documentRepository.getNextRevisionSequence(document.id) : null;
  const historyId = createEntityId('DTH');
  let nextStatus = null;
  let nextAssignee = null;
  let revisionLabel = null;
  const submittedAt = new Date();
  let physicalFileName = null;
  let storageKey = null;
  const nextMetadata = metadata || {
    area: payload.area ?? document.area,
    daysUntilValidation: payload.daysUntilValidation ?? document.daysUntilValidation,
    description: payload.description ?? document.description,
    documentTypeId: document.documentTypeId || null,
    drawing: document.drawing,
  };
  let finalized = false;
  const assertEditState = (currentDocument) => {
    assertExpectedRevisionState({ document: currentDocument, expectedState });
    if (isAdmin && String(currentDocument.currentAssigneeUserId ?? '') !== String(expectedState.currentAssigneeUserId ?? '')) {
      throw createRevisionConflict({ conflictType: 'CURRENT_ASSIGNEE_CHANGED', document: currentDocument, expectedState });
    }
  };

  try {
    assertEditState(document);

    const returnsToReview = [
      DOCUMENT_WORKFLOW_STATUS.PROCESS_COMMENT,
      DOCUMENT_WORKFLOW_STATUS.PROCESS_REJECT,
      DOCUMENT_WORKFLOW_STATUS.PROJECT_COMMENT,
      DOCUMENT_WORKFLOW_STATUS.PROJECT_REJECT,
    ].includes(document.status);
    nextStatus = isAdmin && !returnsToReview ? document.status : uploadRevisionTransitionMatrix[document.status];
    if (!nextStatus) {
      throw createHttpError('Upload Revision Tidak Diizinkan Pada Status Ini', 422, [
        { field: 'status', message: 'Upload Revision Tidak Diizinkan Pada Status Ini' },
      ]);
    }

    const transitionsWorkflow = nextStatus !== document.status;
    nextAssignee = transitionsWorkflow ? await workflowEngine.resolveCurrentAssigneeForStatus({
      projectId: document.projectId,
      status: nextStatus,
    }) : { userId: document.currentAssigneeUserId || null };

    if (!nextAssignee) {
      throw createHttpError('Current Assignee Tidak Tersedia Untuk Status Tujuan', 409);
    }

    // Metadata-only edits never relabel the existing physical revision.
    revisionLabel = !temporaryMetadata || !transitionsWorkflow ? document.revision : nextStatus === DOCUMENT_WORKFLOW_STATUS.PROJECT_REVIEW
      ? DOCUMENT_REVISION_LABEL.IFA_SUBMITTED
      : DOCUMENT_REVISION_LABEL.IFR_SUBMITTED;
    if (temporaryMetadata) {
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
    }

    await documentRepository.runInTransaction(async (connection) => {
      // Status-preserving Admin edits lock the row without writing workflow/SLA fields.
      if (isAdmin && !transitionsWorkflow) {
        const lockedDocument = await documentRepository.lockDocumentForEdit(connection, document.id);
        if (!lockedDocument) throw createHttpError('Document Tidak Ditemukan', 404);
        assertEditState(lockedDocument);
      } else {
        const workflowAffectedRows = await documentRepository.updateDocumentWorkflowState(connection, {
          currentAssigneeUserId: nextAssignee.userId,
          documentId: document.id,
          expectedState: {
            activeRevisionId: expectedState.activeRevisionId,
            currentAssigneeUserId: document.currentAssigneeUserId || null,
            lifecycleStatus: DOCUMENT_LIFECYCLE_STATUS.ACTIVE,
            workflowStatus: expectedState.workflowStatus,
          },
          responsibleRole: transitionsWorkflow ? workflowEngine.getResponsibleRoleForStatus(nextStatus) : document.responsibleRole,
          revisionLabel,
          resetSla: transitionsWorkflow,
          slaStoppedAtExpression: transitionsWorkflow ? 'NULL' : null,
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
      }
      await documentRepository.updateDocumentMetadata(connection, {
        ...nextMetadata,
        documentId: document.id,
        updatedByUserId: actorUserId,
      });
      if (temporaryMetadata) {
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
      }
      await documentRepository.insertDocumentHistory(connection, {
        id: historyId,
        projectId: document.projectId,
        documentId: document.id,
        workflowEvent: temporaryMetadata ? 'Upload Revision Completed' : 'Document Updated',
        activity: temporaryMetadata ? 'Upload Revision' : 'Edit Document',
        workflowStatus: nextStatus,
        revisionLabel,
        lifecycleStatus: document.lifecycle,
        reason: isAdmin && document.status === DOCUMENT_WORKFLOW_STATUS.APPROVED && temporaryMetadata
          ? 'Revisi administratif oleh Admin tanpa approval ulang.'
          : !temporaryMetadata && transitionsWorkflow ? 'Transisi review oleh Admin tanpa file revisi baru.' : null,
        createdByUserId: actorUserId,
        createdByNameSnapshot: actorUserFullName || null,
        createdByOfficialRoleSnapshot: actorOfficialRole || DOCUMENT_RESPONSIBLE_ROLE.DOCUMENT_OWNER,
      });

      if (temporaryMetadata) {
        const consumedRows = await uploadService.consumeTemporaryUploadMetadata(connection, temporaryFileId);
        if (consumedRows !== 1) {
          throw createHttpError('Temporary upload tidak ditemukan atau sudah digunakan', 409, [
            { field: 'temporaryFileId', message: 'Temporary upload tidak ditemukan atau sudah digunakan' },
          ]);
        }
        await storageService.finalize(temporaryMetadata.storageKey, storageKey);
        finalized = true;
      }
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
  const transitionsWorkflow = nextStatus !== document.status;
  if (transitionsWorkflow) {
    await notificationService.createDocumentNotificationsForOfficialRoles({
      document: updatedDocument,
      eventType: temporaryMetadata ? notificationService.NOTIFICATION_EVENT_TYPE.REVISION_UPLOADED : 'Document Updated',
      dictionaryOverride: temporaryMetadata ? undefined : {
        title: 'Metadata Document Updated',
        message: 'Document metadata has been updated without uploading a new revised version of the document.',
      },
      identityBasis: revisionId || historyId,
      officialRoles: [updatedDocument.responsibleRole],
    });
  }
  if (transitionsWorkflow || payload.daysUntilValidation !== undefined) {
    await slaNotificationProducer.evaluateDocumentForSlaNotifications({
      document: updatedDocument,
      triggerSource: transitionsWorkflow ? 'revision_upload' : 'days_until_validation_update',
    });
  }
  await auditService.recordActivitySafely({
    action: temporaryMetadata ? 'Upload Revision' : 'Edit Document',
    actorOfficialRole,
    actorUserFullName,
    actorUserId,
    identityKey: [temporaryMetadata ? 'Upload Revision' : 'Edit Document', updatedDocument.projectId, updatedDocument.id, revisionId || historyId].join(':'),
    metadata: {
      nextStatus,
      previousStatus: document.status,
      revision: revisionLabel,
      revisionSequence,
      ...(isAdmin ? {
        administrativeEdit: true,
        fileUploaded: Boolean(temporaryMetadata),
        approvalRepeated: false,
        fields: ['description', 'area', 'daysUntilValidation', 'drawing'].filter((field) => Object.prototype.hasOwnProperty.call(payload, field)),
      } : {}),
    },
    projectId: updatedDocument.projectId,
    reference: updatedDocument.documentNumber,
    resourceId: revisionId || updatedDocument.id,
    resourceType: 'Document',
  });
  if (temporaryMetadata) realtimeDocumentPublisher.publishRevisionUploaded({
    actorUserId,
    document: updatedDocument,
    revisionId,
  });
  else if (transitionsWorkflow) realtimeDocumentPublisher.publishWorkflowChanged({ actorUserId, document: updatedDocument });
  else realtimeDocumentPublisher.publishDocumentUpdated({
    actorUserId,
    document: updatedDocument,
    reason: payload.daysUntilValidation !== undefined ? 'document_updated_days_until_validation' : 'document_updated',
  });

  return updatedDocument;
};

module.exports = {
  uploadRevision: (args) => saveDocumentRevision(args),
  editDocumentAsAdmin: (args) => saveDocumentRevision(args, true),
  uploadRevisionTransitionMatrix,
};
