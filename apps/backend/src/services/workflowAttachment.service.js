const path = require('node:path');
const logger = require('../config/logger');
const { STORED_FILE_CATEGORY } = require('../constants/document.constants');
const documentRepository = require('../repositories/document.repository');
const fileAccessRepository = require('../repositories/fileAccess.repository');
const storageService = require('./storage.service');
const { assertProjectAccess } = require('./fileAccess.service');
const { createEntityId, createHttpError } = require('../utils/administration');
const { sanitizeFileName } = require('../utils/fileName');
const { validateUploadedFile } = require('../validators/upload.validator');

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

const uploadWorkflowAttachment = async ({ actorUserId, documentId, file, payload }) => {
  const validatedFile = validateUploadedFile(file);
  const commentId = String(payload.commentId || '').trim();

  if (!commentId) {
    throw createHttpError('Workflow Comment Wajib Diisi', 422, [
      { field: 'commentId', message: 'Workflow Comment Wajib Diisi' },
    ]);
  }

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
    originalFileName: validatedFile.originalFileName,
  });
  const storageKey = buildAttachmentStorageKey({
    attachmentId,
    documentId,
    physicalFileName,
    projectId: documentFile.document.projectId,
  });

  let storageWritten = false;

  try {
    await storageService.put(storageKey, validatedFile.buffer);
    storageWritten = true;

    await documentRepository.runInTransaction(async (connection) => {
      await documentRepository.insertStoredFile(connection, {
        fileId,
        projectId: documentFile.document.projectId,
        documentId,
        originalFileName: validatedFile.originalFileName,
        physicalFileName,
        extension: validatedFile.extension,
        mimeType: validatedFile.mimeType,
        fileSize: validatedFile.fileSize,
        storageKey,
        relativePath: storageKey,
        fileCategory: STORED_FILE_CATEGORY.WORKFLOW_ATTACHMENT,
        checksum: null,
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
    });
  } catch (error) {
    if (storageWritten) {
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

  return fileAccessRepository.findWorkflowAttachmentById({ attachmentId, documentId });
};

module.exports = {
  getAttachmentDownload,
  uploadWorkflowAttachment,
};
