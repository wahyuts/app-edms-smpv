const {
  DOCUMENT_LIFECYCLE_STATUS,
  DOCUMENT_MESSAGES,
  DOCUMENT_RESPONSIBLE_ROLE,
  DOCUMENT_REVISION_LABEL,
  DOCUMENT_WORKFLOW_ACTION,
  DOCUMENT_WORKFLOW_STATUS,
} = require('../constants/document.constants');
const documentRepository = require('../repositories/document.repository');
const fileAccessRepository = require('../repositories/fileAccess.repository');
const projectMembershipRepository = require('../repositories/projectMembership.repository');
const storageService = require('./storage.service');
const { createEntityId, createHttpError } = require('../utils/administration');
const {
  buildCanonicalPhysicalFileName,
  buildRevisionStorageKey,
} = require('../utils/storageKeyBuilder');
const { validateStoredFileCapacity } = require('../utils/storageMetadataCapacity');

const workflowTransitionMatrix = Object.freeze({
  [DOCUMENT_WORKFLOW_STATUS.PROCESS_REVIEW]: Object.freeze({
    [DOCUMENT_WORKFLOW_ACTION.APPROVAL_A]: DOCUMENT_WORKFLOW_STATUS.PROJECT_REVIEW,
    [DOCUMENT_WORKFLOW_ACTION.APPROVAL_B]: DOCUMENT_WORKFLOW_STATUS.PROCESS_COMMENT,
    [DOCUMENT_WORKFLOW_ACTION.APPROVAL_C]: DOCUMENT_WORKFLOW_STATUS.PROCESS_REJECT,
  }),
  [DOCUMENT_WORKFLOW_STATUS.PROJECT_REVIEW]: Object.freeze({
    [DOCUMENT_WORKFLOW_ACTION.APPROVAL_A]: DOCUMENT_WORKFLOW_STATUS.APPROVED,
    [DOCUMENT_WORKFLOW_ACTION.APPROVAL_B]: DOCUMENT_WORKFLOW_STATUS.PROJECT_COMMENT,
    [DOCUMENT_WORKFLOW_ACTION.APPROVAL_C]: DOCUMENT_WORKFLOW_STATUS.PROJECT_REJECT,
  }),
});

const responsibleRoleByStatus = Object.freeze({
  [DOCUMENT_WORKFLOW_STATUS.PROCESS_REVIEW]: DOCUMENT_RESPONSIBLE_ROLE.TEAM_PROCESS,
  [DOCUMENT_WORKFLOW_STATUS.PROCESS_COMMENT]: DOCUMENT_RESPONSIBLE_ROLE.DOCUMENT_OWNER,
  [DOCUMENT_WORKFLOW_STATUS.PROCESS_REJECT]: DOCUMENT_RESPONSIBLE_ROLE.DOCUMENT_OWNER,
  [DOCUMENT_WORKFLOW_STATUS.PROJECT_REVIEW]: DOCUMENT_RESPONSIBLE_ROLE.TEAM_PROJECT,
  [DOCUMENT_WORKFLOW_STATUS.PROJECT_COMMENT]: DOCUMENT_RESPONSIBLE_ROLE.DOCUMENT_OWNER,
  [DOCUMENT_WORKFLOW_STATUS.PROJECT_REJECT]: DOCUMENT_RESPONSIBLE_ROLE.DOCUMENT_OWNER,
  [DOCUMENT_WORKFLOW_STATUS.APPROVED]: DOCUMENT_RESPONSIBLE_ROLE.NONE,
});

const revisionByTargetStatus = Object.freeze({
  [DOCUMENT_WORKFLOW_STATUS.PROJECT_REVIEW]: DOCUMENT_REVISION_LABEL.IFA_SUBMITTED,
  [DOCUMENT_WORKFLOW_STATUS.PROCESS_COMMENT]: DOCUMENT_REVISION_LABEL.IFR_SUBMITTED,
  [DOCUMENT_WORKFLOW_STATUS.PROCESS_REJECT]: DOCUMENT_REVISION_LABEL.IFR_SUBMITTED,
  [DOCUMENT_WORKFLOW_STATUS.PROJECT_COMMENT]: DOCUMENT_REVISION_LABEL.IFA_SUBMITTED,
  [DOCUMENT_WORKFLOW_STATUS.PROJECT_REJECT]: DOCUMENT_REVISION_LABEL.IFA_SUBMITTED,
  [DOCUMENT_WORKFLOW_STATUS.APPROVED]: DOCUMENT_REVISION_LABEL.AS_BUILT,
});

const workflowEventByAction = Object.freeze({
  [DOCUMENT_WORKFLOW_ACTION.APPROVAL_A]: 'Approval A Completed',
  [DOCUMENT_WORKFLOW_ACTION.APPROVAL_B]: 'Approval B Completed',
  [DOCUMENT_WORKFLOW_ACTION.APPROVAL_C]: 'Approval C Completed',
});

const createWorkflowConflict = ({ conflictType, document, expectedState }) =>
  createHttpError(
    'Dokumen telah diperbarui oleh pengguna lain.',
    409,
    [{ field: 'document', message: 'Dokumen telah diperbarui oleh pengguna lain.' }],
    {
      code: 'WORKFLOW_CONFLICT',
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

const assertExpectedWorkflowState = ({ document, expectedState }) => {
  if (!expectedState?.workflowStatus || !expectedState?.activeRevisionId) {
    throw createWorkflowConflict({
      conflictType: 'EXPECTED_STATE_REQUIRED',
      document,
      expectedState,
    });
  }

  if (document.lifecycle !== DOCUMENT_LIFECYCLE_STATUS.ACTIVE) {
    throw createWorkflowConflict({
      conflictType: 'DOCUMENT_ALREADY_PROCESSED',
      document,
      expectedState,
    });
  }

  if (document.status !== expectedState.workflowStatus) {
    throw createWorkflowConflict({
      conflictType: 'WORKFLOW_STATE_CHANGED',
      document,
      expectedState,
    });
  }

  if (document.activeRevisionId !== expectedState.activeRevisionId) {
    throw createWorkflowConflict({
      conflictType: 'ACTIVE_REVISION_CHANGED',
      document,
      expectedState,
    });
  }

  if (
    expectedState.currentAssigneeUserId &&
    String(document.currentAssigneeUserId) !== String(expectedState.currentAssigneeUserId)
  ) {
    throw createWorkflowConflict({
      conflictType: 'CURRENT_ASSIGNEE_CHANGED',
      document,
      expectedState,
    });
  }
};

const getNextWorkflowStatus = ({ action, currentStatus }) => {
  return workflowTransitionMatrix[currentStatus]?.[action] || null;
};

const getResponsibleRoleForStatus = (status) => responsibleRoleByStatus[status] || null;

const getRevisionForTargetStatus = ({ currentRevision, targetStatus }) => {
  return revisionByTargetStatus[targetStatus] || currentRevision;
};

const resolveCurrentAssigneeForStatus = async ({ projectId, status }) => {
  const responsibleRole = getResponsibleRoleForStatus(status);

  if (!responsibleRole || responsibleRole === DOCUMENT_RESPONSIBLE_ROLE.NONE) {
    return null;
  }

  return projectMembershipRepository.findActiveMembershipByProjectAndOfficialRole({
    officialRole: responsibleRole,
    projectId,
  });
};

const assertWorkflowTransition = ({ action, document }) => {
  if (!document) {
    throw createHttpError('Document Tidak Ditemukan', 404);
  }

  if (document.lifecycle !== DOCUMENT_LIFECYCLE_STATUS.ACTIVE) {
    throw createHttpError('Archived Document Tidak Dapat Menjalankan Workflow Action', 409);
  }

  const nextStatus = getNextWorkflowStatus({
    action,
    currentStatus: document.status,
  });

  if (!nextStatus) {
    throw createHttpError(DOCUMENT_MESSAGES.WORKFLOW_TRANSITION_NOT_ALLOWED, 422, [
      { field: 'workflowAction', message: DOCUMENT_MESSAGES.WORKFLOW_TRANSITION_NOT_ALLOWED },
    ]);
  }

  return nextStatus;
};

const assertActorCanTransition = async ({ document, requiredRole, userId }) => {
  const membership = await projectMembershipRepository.findActiveMembershipByProjectAndUser({
    projectId: document.projectId,
    userId,
  });

  if (!membership) {
    throw createHttpError('User Tidak Memiliki Akses Project', 403);
  }

  if (membership.officialRole !== requiredRole) {
    throw createHttpError('Official Role Tidak Sesuai Untuk Workflow Status Ini', 403);
  }

  return membership;
};

const applyWorkflowTransition = async ({
  action,
  actorOfficialRole,
  actorUserFullName,
  actorUserId,
  document,
  expectedState,
  reason = null,
  transactionHook = null,
  workflowAttachment = null,
  workflowComment = null,
}) => {
  assertExpectedWorkflowState({ document, expectedState });

  const nextStatus = assertWorkflowTransition({ action, document });
  const requiredRole = getResponsibleRoleForStatus(document.status);
  const actorMembership = await assertActorCanTransition({
    document,
    requiredRole,
    userId: actorUserId,
  });

  const nextResponsibleRole = getResponsibleRoleForStatus(nextStatus);
  const nextAssignee = await resolveCurrentAssigneeForStatus({
    projectId: document.projectId,
    status: nextStatus,
  });

  if (nextResponsibleRole !== DOCUMENT_RESPONSIBLE_ROLE.NONE && !nextAssignee) {
    throw createHttpError('Current Assignee Tidak Tersedia Untuk Status Tujuan', 409);
  }

  const nextRevision = getRevisionForTargetStatus({
    currentRevision: document.revision,
    targetStatus: nextStatus,
  });
  const activeDocumentFile = nextRevision !== document.revision
    ? await fileAccessRepository.findActiveDocumentFile(document.id)
    : null;
  const revisionStorageMove = activeDocumentFile?.storedFile
    ? (() => {
        const physicalFileName = buildCanonicalPhysicalFileName({
          documentNumber: document.documentNumber,
          fileId: activeDocumentFile.storedFile.fileId,
          originalFileName: activeDocumentFile.storedFile.originalFileName,
          revisionLabel: nextRevision,
          submittedAt: activeDocumentFile.storedFile.uploadedAt || new Date(),
        });
        const storageKey = buildRevisionStorageKey({
          documentNumber: document.documentNumber,
          physicalFileName,
          projectCode: document.projectCode,
          revisionLabel: nextRevision,
        });
        validateStoredFileCapacity({
          originalFileName: activeDocumentFile.storedFile.originalFileName,
          physicalFileName,
          relativePath: storageKey,
          storageKey,
        });

        if (storageKey === activeDocumentFile.storedFile.storageKey) {
          return null;
        }

        return {
          fileId: activeDocumentFile.storedFile.fileId,
          fromStorageKey: activeDocumentFile.storedFile.storageKey,
          physicalFileName,
          storageKey,
        };
      })()
    : null;
  let storageMoved = false;

  try {
    await documentRepository.runInTransaction(async (connection) => {
      const workflowAffectedRows = await documentRepository.updateDocumentWorkflowState(connection, {
        currentAssigneeUserId: nextAssignee?.userId || null,
        documentId: document.id,
        expectedState: {
          activeRevisionId: expectedState.activeRevisionId,
          currentAssigneeUserId: expectedState.currentAssigneeUserId || document.currentAssigneeUserId || null,
          lifecycleStatus: DOCUMENT_LIFECYCLE_STATUS.ACTIVE,
          workflowStatus: expectedState.workflowStatus,
        },
        responsibleRole: nextResponsibleRole,
        revisionLabel: nextRevision,
        resetSla: true,
        slaStoppedAtExpression: nextStatus === DOCUMENT_WORKFLOW_STATUS.APPROVED ? 'UTC_TIMESTAMP(3)' : null,
        updatedByUserId: actorUserId,
        workflowStatus: nextStatus,
      });

      if (workflowAffectedRows !== 1) {
        throw createWorkflowConflict({
          conflictType: 'WORKFLOW_STATE_CHANGED',
          document,
          expectedState,
        });
      }

      await documentRepository.updateRevisionLabel(connection, {
        revisionId: document.activeRevisionId,
        revisionLabel: nextRevision,
      });
      if (revisionStorageMove) {
        await documentRepository.updateStoredFileStorageMetadata(connection, {
          fileId: revisionStorageMove.fileId,
          physicalFileName: revisionStorageMove.physicalFileName,
          storageKey: revisionStorageMove.storageKey,
        });
        await documentRepository.updateRevisionStoragePath(connection, {
          revisionId: document.activeRevisionId,
          storagePathLegacy: revisionStorageMove.storageKey,
        });
        await storageService.move(revisionStorageMove.fromStorageKey, revisionStorageMove.storageKey);
        storageMoved = true;
      }
      await documentRepository.insertDocumentHistory(connection, {
        id: createEntityId('DTH'),
        projectId: document.projectId,
        documentId: document.id,
        workflowEvent: workflowEventByAction[action] || `${action} Completed`,
        activity: action,
        workflowStatus: nextStatus,
        revisionLabel: nextRevision,
        lifecycleStatus: document.lifecycle,
        reason,
        createdByUserId: actorUserId,
        createdByNameSnapshot: actorUserFullName || null,
        createdByOfficialRoleSnapshot: actorOfficialRole || actorMembership.officialRole,
      });
      if (workflowComment) {
        await documentRepository.insertWorkflowComment(connection, {
          id: workflowComment.id || createEntityId('WFC'),
          projectId: document.projectId,
          documentId: document.id,
          revisionId: document.activeRevisionId,
          workflowAction: action,
          workflowComment: workflowComment.comment,
          createdByUserId: actorUserId,
          createdByNameSnapshot: actorUserFullName || null,
          createdByOfficialRoleSnapshot: actorOfficialRole || actorMembership.officialRole,
        });
      }
      if (workflowAttachment) {
        await documentRepository.insertStoredFile(connection, {
          fileId: workflowAttachment.fileId,
          projectId: document.projectId,
          documentId: document.id,
          originalFileName: workflowAttachment.originalFileName,
          physicalFileName: workflowAttachment.physicalFileName,
          extension: workflowAttachment.extension,
          mimeType: workflowAttachment.mimeType,
          fileSize: workflowAttachment.fileSize,
          storageKey: workflowAttachment.storageKey,
          relativePath: workflowAttachment.storageKey,
          fileCategory: workflowAttachment.fileCategory,
          checksum: workflowAttachment.checksum || null,
          uploadedByUserId: actorUserId,
          isActive: true,
        });
        await fileAccessRepository.insertWorkflowAttachment(connection, {
          attachmentId: workflowAttachment.attachmentId,
          commentId: workflowComment.id,
          projectId: document.projectId,
          documentId: document.id,
          fileId: workflowAttachment.fileId,
          uploadedByUserId: actorUserId,
        });
      }
      if (transactionHook) {
        await transactionHook(connection);
      }
    });
  } catch (error) {
    if (storageMoved && revisionStorageMove) {
      await storageService.move(revisionStorageMove.storageKey, revisionStorageMove.fromStorageKey).catch(() => {});
    }
    throw error;
  }

  return documentRepository.findDocumentRegisterById(document.id);
};

module.exports = {
  applyWorkflowTransition,
  assertWorkflowTransition,
  getNextWorkflowStatus,
  getResponsibleRoleForStatus,
  getRevisionForTargetStatus,
  resolveCurrentAssigneeForStatus,
  responsibleRoleByStatus,
  revisionByTargetStatus,
  workflowTransitionMatrix,
};
