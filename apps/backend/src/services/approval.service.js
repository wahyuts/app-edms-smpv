const path = require('node:path');
const {
  DOCUMENT_WORKFLOW_ACTION,
  STORED_FILE_CATEGORY,
} = require('../constants/document.constants');
const documentRepository = require('../repositories/document.repository');
const auditService = require('./audit.service');
const notificationService = require('./notification.service');
const storageService = require('./storage.service');
const workflowEngine = require('./workflowEngine.service');
const { createEntityId, createHttpError } = require('../utils/administration');
const { sanitizeFileName } = require('../utils/fileName');
const { validateUploadedFile } = require('../validators/upload.validator');

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

const toStorageSafeSegment = (value) => {
  const sanitized = sanitizeFileName(value)
    .replace(/\s+/g, '_')
    .replace(/[^A-Za-z0-9._-]/g, '_')
    .replace(/_+/g, '_')
    .replace(/^_+|_+$/g, '');

  return sanitized || 'file';
};

const buildAttachmentPhysicalFileName = ({ attachmentId, originalFileName }) => {
  const extension = path.extname(originalFileName);
  const baseName = path.basename(originalFileName, extension);
  const shortAttachmentId = attachmentId.split('-')[1]?.slice(0, 8) || attachmentId.slice(0, 8);

  return toStorageSafeSegment(`${shortAttachmentId}_${baseName}${extension}`);
};

const buildAttachmentStorageKey = ({ attachmentId, documentId, physicalFileName, projectId }) => {
  return `projects/${projectId}/documents/${documentId}/workflow-attachments/${attachmentId}/${physicalFileName}`;
};

const processApproval = async ({
  actorOfficialRole,
  actorUserFullName,
  actorUserId,
  comment = '',
  documentId,
  file = null,
  type,
}) => {
  const config = approvalConfig[type];

  if (!config) {
    throw createHttpError('Approval Action Tidak Valid', 422);
  }

  const document = await documentRepository.findDocumentRegisterById(documentId);
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
  let storageWritten = false;

  if (file) {
    if (!workflowComment) {
      throw createHttpError('Workflow Attachment hanya tersedia untuk Approval B/C', 422, [
        { field: 'file', message: 'Workflow Attachment hanya tersedia untuk Approval B/C' },
      ]);
    }

    const validatedFile = validateUploadedFile(file);
    const attachmentId = createEntityId('WFA');
    const fileId = createEntityId('FILE');
    const physicalFileName = buildAttachmentPhysicalFileName({
      attachmentId,
      originalFileName: validatedFile.originalFileName,
    });
    const storageKey = buildAttachmentStorageKey({
      attachmentId,
      documentId: document.id,
      physicalFileName,
      projectId: document.projectId,
    });

    workflowAttachment = {
      attachmentId,
      checksum: null,
      extension: validatedFile.extension,
      fileCategory: STORED_FILE_CATEGORY.WORKFLOW_ATTACHMENT,
      fileId,
      fileSize: validatedFile.fileSize,
      mimeType: validatedFile.mimeType,
      originalFileName: validatedFile.originalFileName,
      physicalFileName,
      storageKey,
    };
    await storageService.put(storageKey, validatedFile.buffer);
    storageWritten = true;
  }

  let updatedDocument;

  try {
    updatedDocument = await workflowEngine.applyWorkflowTransition({
      action: config.action,
      actorOfficialRole,
      actorUserFullName,
      actorUserId,
      document,
      reason,
      workflowAttachment,
      workflowComment,
    });
  } catch (error) {
    if (storageWritten && workflowAttachment?.storageKey) {
      await storageService.delete(workflowAttachment.storageKey).catch(() => {});
    }
    throw error;
  }
  const notificationEventType = updatedDocument.status === 'Approved'
    ? notificationService.NOTIFICATION_EVENT_TYPE.DOCUMENT_APPROVED
    : config.eventType;

  await notificationService.createDocumentNotification({
    document: updatedDocument,
    eventType: notificationEventType,
    identityBasis: workflowComment?.id || updatedDocument.activeRevisionId || updatedDocument.updatedAt,
    recipientOfficialRole: updatedDocument.status === 'Approved' ? 'Document Owner' : updatedDocument.responsibleRole,
    recipientUserId: updatedDocument.currentAssigneeUserId,
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
