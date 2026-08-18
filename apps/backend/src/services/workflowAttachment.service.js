const logger = require('../config/logger');
const { STORED_FILE_CATEGORY } = require('../constants/document.constants');
const documentRepository = require('../repositories/document.repository');
const fileAccessRepository = require('../repositories/fileAccess.repository');
const auditService = require('./audit.service');
const storageService = require('./storage.service');
const uploadService = require('./upload.service');
const { assertProjectAccess } = require('./fileAccess.service');
const { createEntityId, createHttpError } = require('../utils/administration');
const {
  buildAttachmentPhysicalFileName,
  buildAttachmentStorageKey,
} = require('../utils/storageKeyBuilder');
const { validateStoredFileCapacity } = require('../utils/storageMetadataCapacity');

const getAttachmentDownload = async ({ attachmentId, documentId, userId }) => {
  const attachment = await fileAccessRepository.findWorkflowAttachmentById({ attachmentId, documentId });

  if (!attachment) {
    throw createHttpError('Workflow Attachment Tidak Ditemukan', 404);
  }

  await assertProjectAccess({ projectId: attachment.projectId, userId });

  if (!(await storageService.exists(attachment.storedFile.storageKey))) {
    logger.error('[ATTACHMENT] Storage object missing');
    throw createHttpError('File attachment tidak ditemukan di storage', 404);
  }

  return {
    document: {
      id: attachment.documentId,
      projectId: attachment.projectId,
    },
    storedFile: attachment.storedFile,
    attachment,
  };
};

const uploadWorkflowAttachment = async ({ actorUserId, documentId, payload }) => {
  const commentId = String(payload.commentId || '').trim();
  const temporaryFileId = String(payload.temporaryFileId || '').trim();

  if (!commentId) {
    throw createHttpError('Workflow Comment Wajib Diisi', 422, [
      { field: 'commentId', message: 'Workflow Comment Wajib Diisi' },
    ]);
  }

  if (!temporaryFileId) {
    throw createHttpError('Temporary File Wajib Diisi', 422, [
      { field: 'temporaryFileId', message: 'Temporary File Wajib Diisi' },
    ]);
  }

  const temporaryMetadata = await uploadService.assertTemporaryUploadConsumable({
    actorUserId,
    temporaryFileId,
  });
  const documentFile = await fileAccessRepository.findActiveDocumentFile(documentId);
  if (!documentFile?.document) {
    throw createHttpError('Document Tidak Ditemukan', 404);
  }

  await assertProjectAccess({
    projectId: documentFile.document.projectId,
    userId: actorUserId,
  });

  const workflowComment = await fileAccessRepository.findWorkflowCommentById({ commentId, documentId });
  if (!workflowComment || workflowComment.projectId !== documentFile.document.projectId) {
    throw createHttpError('Workflow Comment Tidak Ditemukan', 404);
  }

  const attachmentId = createEntityId('WFA');
  const fileId = createEntityId('FILE');
  const physicalFileName = buildAttachmentPhysicalFileName({
    attachmentId,
    originalFileName: temporaryMetadata.originalFileName,
  });
  const storageKey = buildAttachmentStorageKey({
    documentNumber: documentFile.document.documentNumber,
    physicalFileName,
    projectCode: documentFile.document.projectCode,
    workflowStatus: documentFile.document.workflowStatus,
  });
  validateStoredFileCapacity({
    originalFileName: temporaryMetadata.originalFileName,
    physicalFileName,
    relativePath: storageKey,
    storageKey,
  });

  let finalized = false;

  try {
    await documentRepository.runInTransaction(async (connection) => {
      await documentRepository.insertStoredFile(connection, {
        fileId,
        projectId: documentFile.document.projectId,
        documentId,
        originalFileName: temporaryMetadata.originalFileName,
        physicalFileName,
        extension: temporaryMetadata.extension,
        mimeType: temporaryMetadata.mimeType,
        fileSize: temporaryMetadata.fileSize,
        storageKey,
        relativePath: storageKey,
        fileCategory: STORED_FILE_CATEGORY.WORKFLOW_ATTACHMENT,
        checksum: temporaryMetadata.checksum || null,
        uploadedByUserId: actorUserId,
        isActive: true,
      });
      await fileAccessRepository.insertWorkflowAttachment(connection, {
        attachmentId,
        commentId,
        projectId: documentFile.document.projectId,
        documentId,
        fileId,
        uploadedByUserId: actorUserId,
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
      await storageService.delete(storageKey).catch((cleanupError) => {
        logger.error('[ATTACHMENT] Compensating cleanup failed');
        logger.error(cleanupError.code || cleanupError.name || 'AttachmentCleanupError');
      });
    }

    if (error.code === 'ER_DUP_ENTRY') {
      throw createHttpError('Workflow Comment sudah memiliki attachment', 409, [
        { field: 'commentId', message: 'Workflow Comment sudah memiliki attachment' },
      ]);
    }

    logger.error('[ATTACHMENT] Upload failed');
    logger.error(error.code || error.name || 'AttachmentUploadError');
    throw error;
  }

  const attachment = await fileAccessRepository.findWorkflowAttachmentById({ attachmentId, documentId });
  await auditService.recordActivitySafely({
    action: 'Workflow Attachment',
    actorUserId,
    identityKey: ['Workflow Attachment', documentFile.document.projectId, documentId, attachmentId].join(':'),
    metadata: {
      attachmentName: temporaryMetadata.originalFileName,
      commentId,
    },
    projectId: documentFile.document.projectId,
    reference: documentFile.document.documentNumber,
    resourceId: attachmentId,
    resourceType: 'Workflow Attachment',
  });

  return attachment;
};

module.exports = {
  getAttachmentDownload,
  uploadWorkflowAttachment,
};
