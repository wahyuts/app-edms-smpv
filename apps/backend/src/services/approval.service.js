const {
  DOCUMENT_WORKFLOW_ACTION,
  STORED_FILE_CATEGORY,
} = require('../constants/document.constants');
const documentRepository = require('../repositories/document.repository');
const auditService = require('./audit.service');
const notificationService = require('./notification.service');
const realtimeDocumentPublisher = require('./realtimeDocumentPublisher.service');
const slaNotificationProducer = require('./slaNotificationProducer.service');
const storageService = require('./storage.service');
const uploadService = require('./upload.service');
const workflowEngine = require('./workflowEngine.service');
const { createEntityId, createHttpError } = require('../utils/administration');
const {
  buildAttachmentPhysicalFileName,
  buildAttachmentStorageKey,
} = require('../utils/storageKeyBuilder');

const approvalConfig = Object.freeze({
  approve: Object.freeze({
    action: DOCUMENT_WORKFLOW_ACTION.APPROVAL_A,
    defaultReason: null,
    eventType: notificationService.NOTIFICATION_EVENT_TYPE.APPROVAL_A_COMPLETED,
  }),
  approveWithComment: Object.freeze({
    action: DOCUMENT_WORKFLOW_ACTION.APPROVAL_B,
    defaultReason: null,
    eventType: notificationService.NOTIFICATION_EVENT_TYPE.APPROVAL_B_COMPLETED,
  }),
  reject: Object.freeze({
    action: DOCUMENT_WORKFLOW_ACTION.APPROVAL_C,
    defaultReason: 'Document is not approved',
    eventType: notificationService.NOTIFICATION_EVENT_TYPE.APPROVAL_C_COMPLETED,
  }),
});

const resolveApprovalNotificationOverride = ({ action, document }) => {
  if (action !== DOCUMENT_WORKFLOW_ACTION.APPROVAL_C) return null;

  return {
    title: document.status === 'Project Review'
      ? 'Document Not Approved By Team Project'
      : 'Document Not Approved By Team Process',
  };
};

const processApproval = async ({
  actorOfficialRole,
  actorUserFullName,
  actorUserId,
  comment = '',
  documentId,
  expectedState,
  temporaryFileId = null,
  type,
}) => {
  const config = approvalConfig[type];

  if (!config) {
    throw createHttpError('Approval Action Tidak Valid', 422);
  }

  const document = await documentRepository.findDocumentRegisterById(documentId);
  if (!document) {
    throw createHttpError('Document Tidak Ditemukan', 404);
  }

  const reason = comment || config.defaultReason;
  const shouldCreateWorkflowComment = [
    DOCUMENT_WORKFLOW_ACTION.APPROVAL_B,
    DOCUMENT_WORKFLOW_ACTION.APPROVAL_C,
  ].includes(config.action);
  const workflowComment = shouldCreateWorkflowComment
    ? {
        id: createEntityId('WFC'),
        comment: reason,
      }
    : null;
  let workflowAttachment = null;
  let finalized = false;
  let temporaryMetadata = null;

  if (temporaryFileId) {
    if (!workflowComment) {
      throw createHttpError('Workflow Attachment hanya tersedia untuk Approval B/C', 422, [
        { field: 'temporaryFileId', message: 'Workflow Attachment hanya tersedia untuk Approval B/C' },
      ]);
    }

    temporaryMetadata = await uploadService.assertTemporaryUploadConsumable({
      actorUserId,
      temporaryFileId,
    });
    const attachmentId = createEntityId('WFA');
    const fileId = createEntityId('FILE');
    const physicalFileName = buildAttachmentPhysicalFileName({
      attachmentId,
      originalFileName: temporaryMetadata.originalFileName,
    });
    const storageKey = buildAttachmentStorageKey({
      documentNumber: document.documentNumber,
      physicalFileName,
      projectCode: document.projectCode,
      workflowStatus: document.status,
    });

    workflowAttachment = {
      attachmentId,
      checksum: temporaryMetadata.checksum || null,
      extension: temporaryMetadata.extension,
      fileCategory: STORED_FILE_CATEGORY.WORKFLOW_ATTACHMENT,
      fileId,
      fileSize: temporaryMetadata.fileSize,
      mimeType: temporaryMetadata.mimeType,
      originalFileName: temporaryMetadata.originalFileName,
      physicalFileName,
      storageKey,
    };
  }

  let updatedDocument;

  try {
    updatedDocument = await workflowEngine.applyWorkflowTransition({
      action: config.action,
      actorOfficialRole,
      actorUserFullName,
      actorUserId,
      document,
      expectedState,
      reason,
      transactionHook: temporaryFileId ? async (connection) => {
        const consumedRows = await uploadService.consumeTemporaryUploadMetadata(connection, temporaryFileId);
        if (consumedRows !== 1) {
          throw createHttpError('Temporary upload tidak ditemukan atau sudah digunakan', 409, [
            { field: 'temporaryFileId', message: 'Temporary upload tidak ditemukan atau sudah digunakan' },
          ]);
        }
        await storageService.finalize(temporaryMetadata.storageKey, workflowAttachment.storageKey);
        finalized = true;
      } : null,
      workflowAttachment,
      workflowComment,
    });
  } catch (error) {
    if (finalized && workflowAttachment?.storageKey) {
      await storageService.delete(workflowAttachment.storageKey).catch(() => {});
    }
    if (!finalized && temporaryMetadata && error?.code === 'WORKFLOW_CONFLICT') {
      await uploadService.discardTemporaryUpload(temporaryMetadata);
    }
    throw error;
  }
  const notificationEventType = updatedDocument.status === 'Approved'
    ? notificationService.NOTIFICATION_EVENT_TYPE.DOCUMENT_APPROVED
    : config.eventType;
  const notificationIdentityBasis = workflowComment?.id || updatedDocument.activeRevisionId || updatedDocument.updatedAt;
  const shouldNotifyAdminAndOwner = [
    notificationService.NOTIFICATION_EVENT_TYPE.APPROVAL_B_COMPLETED,
    notificationService.NOTIFICATION_EVENT_TYPE.APPROVAL_C_COMPLETED,
    notificationService.NOTIFICATION_EVENT_TYPE.DOCUMENT_APPROVED,
  ].includes(notificationEventType);

  if (shouldNotifyAdminAndOwner) {
    await notificationService.createDocumentNotificationsForOfficialRoles({
      dictionaryOverride: resolveApprovalNotificationOverride({
        action: config.action,
        document,
      }),
      document: updatedDocument,
      eventType: notificationEventType,
      identityBasis: notificationIdentityBasis,
      officialRoles: ['Admin', 'Document Owner'],
    });
  } else {
    await notificationService.createDocumentNotificationsForOfficialRoles({
      document: updatedDocument,
      eventType: notificationEventType,
      identityBasis: notificationIdentityBasis,
      officialRoles: [updatedDocument.responsibleRole],
    });
  }
  await slaNotificationProducer.evaluateDocumentForSlaNotifications({
    document: updatedDocument,
    triggerSource: 'approval_transition',
  });
  await auditService.recordActivitySafely({
    action: config.action,
    actorOfficialRole,
    actorUserFullName,
    actorUserId,
    identityKey: [
      config.action,
      document.projectId,
      document.id,
      workflowComment?.id || updatedDocument.updatedAt,
    ].join(':'),
    metadata: {
      nextStatus: updatedDocument.status,
      previousStatus: document.status,
      revision: updatedDocument.revision,
    },
    projectId: updatedDocument.projectId,
    reference: updatedDocument.documentNumber,
    resourceId: updatedDocument.id,
    resourceType: 'Document',
  });
  if (updatedDocument.status === 'Approved') {
    await auditService.recordActivitySafely({
      action: 'Document Approved',
      actorOfficialRole,
      actorUserFullName,
      actorUserId,
      identityKey: ['Document Approved', updatedDocument.projectId, updatedDocument.id, updatedDocument.activeRevisionId].join(':'),
      projectId: updatedDocument.projectId,
      reference: updatedDocument.documentNumber,
      resourceId: updatedDocument.id,
      resourceType: 'Document',
    });
  }
  if (workflowAttachment) {
    await auditService.recordActivitySafely({
      action: 'Workflow Attachment',
      actorOfficialRole,
      actorUserFullName,
      actorUserId,
      identityKey: ['Workflow Attachment', updatedDocument.projectId, updatedDocument.id, workflowAttachment.attachmentId].join(':'),
      metadata: {
        attachmentName: workflowAttachment.originalFileName,
        commentId: workflowComment.id,
        workflowAction: config.action,
      },
      projectId: updatedDocument.projectId,
      reference: updatedDocument.documentNumber,
      resourceId: workflowAttachment.attachmentId,
      resourceType: 'Workflow Attachment',
    });
  }
  realtimeDocumentPublisher.publishWorkflowChanged({
    actorUserId,
    document: updatedDocument,
  });

  return workflowComment
    ? {
        ...updatedDocument,
        workflowComment: {
          attachment: workflowAttachment ? {
            attachmentId: workflowAttachment.attachmentId,
            fileId: workflowAttachment.fileId,
            fileSize: workflowAttachment.fileSize,
            mimeType: workflowAttachment.mimeType,
            originalFileName: workflowAttachment.originalFileName,
          } : null,
          id: workflowComment.id,
          workflowAction: config.action,
          workflowComment: workflowComment.comment,
        },
      }
    : updatedDocument;
};

module.exports = {
  processApproval,
};
