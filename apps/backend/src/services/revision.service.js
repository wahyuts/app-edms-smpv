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
const admission = require('./documentAdmission.service');
const { createEntityId, createHttpError } = require('../utils/administration');
const {
  buildCanonicalPhysicalFileName,
  buildRevisionStorageKey,
} = require('../utils/storageKeyBuilder');
const { validateStoredFileCapacity } = require('../utils/storageMetadataCapacity');

const uploadRevisionTransitionMatrix = Object.freeze({
  [DOCUMENT_WORKFLOW_STATUS.PROCESS_COMMENT]: DOCUMENT_WORKFLOW_STATUS.PROJECT_REVIEW,
  [DOCUMENT_WORKFLOW_STATUS.PROCESS_REJECT]: DOCUMENT_WORKFLOW_STATUS.PROCESS_REVIEW,
  [DOCUMENT_WORKFLOW_STATUS.PROJECT_COMMENT]: DOCUMENT_WORKFLOW_STATUS.APPROVED,
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

const isApprovalBStatus = status => [DOCUMENT_WORKFLOW_STATUS.PROCESS_COMMENT,
  DOCUMENT_WORKFLOW_STATUS.PROJECT_COMMENT].includes(status);

const assertApprovalBRevisionEvidence = (document, { revision, decisions, history }) => {
  const process = document.status === DOCUMENT_WORKFLOW_STATUS.PROCESS_COMMENT;
  const stage = process ? DOCUMENT_REVISION_LABEL.IFR_SUBMITTED : DOCUMENT_REVISION_LABEL.IFA_SUBMITTED;
  const decision = decisions[0];
  const latestHistory = history[0];
  const fail = () => { throw createHttpError('Bukti Approval B atau revisi aktif tidak konsisten.', 409, [],
    { code: 'APPROVAL_B_REVISION_EVIDENCE_UNVERIFIED' }); };
  if (document.revision !== stage || document.responsibleRole !== DOCUMENT_RESPONSIBLE_ROLE.DOCUMENT_OWNER ||
    !document.activeFileId || !revision || revision.id !== document.activeRevisionId ||
    revision.project_id !== document.projectId || revision.document_id !== document.id ||
    revision.file_id !== document.activeFileId || Number(revision.is_active) !== 1 ||
    revision.revision_label !== stage || revision.file_project_id !== document.projectId ||
    revision.file_document_id !== document.id || Number(revision.file_is_active) !== 1 ||
    !decision || decision.revision_id !== document.activeRevisionId || decision.workflow_action !== 'Approval B' ||
    decision.created_by_user_id == null || !decision.decision_time ||
    decision.created_by_official_role_snapshot !== (process ? 'Team Process' : 'Team Project') ||
    (decisions[1] && decisions[1].decision_time === decision.decision_time) ||
    !latestHistory || !latestHistory.history_time || latestHistory.workflow_status !== document.status ||
    latestHistory.revision_label !== stage || (history[1] && history[1].history_time === latestHistory.history_time)) fail();
  // Metadata-only edits preserve the decision; timestamps are never used to match actors/events.
  if (latestHistory.activity === 'Edit Document' && latestHistory.workflow_event === 'Document Updated') return;
  if (latestHistory.activity !== 'Approval B' || latestHistory.workflow_event !== 'Approval B Completed' ||
    String(latestHistory.created_by_user_id) !== String(decision.created_by_user_id)) fail();
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
  if (!activeProject?.id || activeProject.id !== document.projectId) {
    throw createHttpError('Dokumen tidak berada pada project aktif.', 403);
  }
  actorOfficialRole = membership.officialRole;
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
  let revisionSequence = null;
  const historyId = createEntityId('DTH');
  let nextStatus = null;
  let nextAssignee = null;
  let revisionLabel = null;
  const submittedAt = new Date();
  let physicalFileName = null;
  let storageKey = null;
  const nextMetadata = metadata || {
    ...(payload.rev !== undefined ? { rev: payload.rev } : {}),
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

    await documentRepository.runInTransaction(async (connection) => {
      const lockedDocument = await documentRepository.lockDocumentForEdit(connection, document.id);
      if (!lockedDocument) throw createHttpError('Document Tidak Ditemukan', 404);
      assertEditState(lockedDocument);
      Object.assign(document, lockedDocument);
      if (document.projectId !== activeProject.id) throw createHttpError('Dokumen tidak berada pada project aktif.', 403);
      if (temporaryMetadata && isApprovalBStatus(document.status)) {
        assertApprovalBRevisionEvidence(document, await documentRepository.lockApprovalBRevisionEvidence(connection, {
          documentId: document.id, projectId: document.projectId, revisionId: document.activeRevisionId,
        }));
      }

      const returnsToReview = Object.hasOwn(uploadRevisionTransitionMatrix, document.status);
      nextStatus = isAdmin && (!returnsToReview || (!temporaryMetadata && isApprovalBStatus(document.status)))
        ? document.status : uploadRevisionTransitionMatrix[document.status];
      if (!nextStatus) {
        throw createHttpError('Upload Revision Tidak Diizinkan Pada Status Ini', 422, [
          { field: 'status', message: 'Upload Revision Tidak Diizinkan Pada Status Ini' },
        ]);
      }

      const transitionsWorkflow = nextStatus !== document.status;
      const isFinal = nextStatus === DOCUMENT_WORKFLOW_STATUS.APPROVED;
      nextAssignee = transitionsWorkflow ? isFinal ? null : await workflowEngine.resolveCurrentAssigneeForStatus({
        projectId: document.projectId,
        status: nextStatus,
      }, { connection }) : { userId: document.currentAssigneeUserId || null };

      if (!nextAssignee && !isFinal) {
        throw createHttpError('Current Assignee Tidak Tersedia Untuk Status Tujuan', 409);
      }

      // Metadata-only edits never relabel the existing physical revision.
      revisionLabel = !temporaryMetadata || !transitionsWorkflow ? document.revision
        : workflowEngine.getRevisionForTargetStatus({ currentRevision: document.revision, targetStatus: nextStatus });
      if (temporaryMetadata) {
        revisionSequence = await documentRepository.getNextRevisionSequence(document.id, { connection });
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

      // Status-preserving Admin edits lock the row without writing workflow/SLA fields.
      if (!(isAdmin && !transitionsWorkflow)) {
        const workflowAffectedRows = await documentRepository.updateDocumentWorkflowState(connection, {
          currentAssigneeUserId: nextAssignee?.userId || null,
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
          slaStoppedAtExpression: transitionsWorkflow ? isFinal ? 'UTC_TIMESTAMP(3)' : 'NULL' : null,
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
        await documentRepository.completeStoredFileProvenance(connection, fileId);
        if (isApprovalBStatus(document.status) && nextStatus !== document.status) {
          const uploader = await projectMembershipRepository.findActiveMembershipByProjectAndUser({
            projectId: document.projectId, userId: actorUserId,
          }, { connection });
          const fullName = String(uploader?.userName || '').trim();
          if (!fullName || uploader?.officialRole !== actorOfficialRole ||
            !['Admin', 'Document Owner'].includes(uploader?.officialRole)) {
            throw createHttpError('Identitas uploader untuk Response to Approval B tidak lengkap.', 409);
          }
          await documentRepository.insertWorkflowComment(connection, {
            id: createEntityId('WFC'), projectId: document.projectId, documentId: document.id,
            revisionId, workflowAction: 'Response to Approval B',
            workflowComment: nextStatus === DOCUMENT_WORKFLOW_STATUS.APPROVED
              ? 'The requirements necessary for this document to meet the criteria for Approval B have been fulfilled. The document has been re-uploaded, and its status has been changed to Approved.'
              : 'The requirements necessary for this document to meet the criteria for Approval B have been fulfilled. The document has been re-uploaded and immediately forwarded to the Project Team for review.',
            createdByUserId: actorUserId, createdByNameSnapshot: fullName,
            createdByOfficialRoleSnapshot: uploader.officialRole,
          });
        }
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
  const completesApprovalB = Boolean(temporaryMetadata && isApprovalBStatus(document.status) && transitionsWorkflow);
  const finalizesApprovalB = completesApprovalB && nextStatus === DOCUMENT_WORKFLOW_STATUS.APPROVED;
  if (transitionsWorkflow) {
    await notificationService.createDocumentNotificationsForOfficialRoles({
      document: updatedDocument,
      eventType: finalizesApprovalB ? notificationService.NOTIFICATION_EVENT_TYPE.DOCUMENT_APPROVED
        : temporaryMetadata ? notificationService.NOTIFICATION_EVENT_TYPE.REVISION_UPLOADED : 'Document Updated',
      dictionaryOverride: completesApprovalB ? {
        title: finalizesApprovalB ? 'Document Approved' : 'Revision Ready for Project Review',
        message: finalizesApprovalB ? 'The document has been approved after completing the Approval B revision.'
          : 'The revised document has entered Project Review.',
      } : temporaryMetadata ? undefined : {
        title: 'Metadata Document Updated',
        message: 'Document metadata has been updated without uploading a new revised version of the document.',
      },
      identityBasis: revisionId || historyId,
      officialRoles: finalizesApprovalB ? ['Admin', 'Document Owner'] : [updatedDocument.responsibleRole],
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
      sourceSubmissionStage: document.revision,
      resultSubmissionStage: revisionLabel,
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
  uploadRevision: admission.documentWriter((args) => saveDocumentRevision(args), 'UPLOAD_REVISION'),
  editDocumentAsAdmin: admission.documentWriter((args) => saveDocumentRevision(args, true), 'ADMIN_EDIT'),
  uploadRevisionTransitionMatrix,
};
