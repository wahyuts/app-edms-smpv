const logger = require('../config/logger');
const fileAccessRepository = require('../repositories/fileAccess.repository');
const projectMembershipRepository = require('../repositories/projectMembership.repository');
const auditService = require('./audit.service');
const storageService = require('./storage.service');
const { createHttpError } = require('../utils/administration');
const { buildContentDisposition } = require('../utils/contentDisposition');

const assertProjectAccess = async ({ projectId, userId }) => {
  const membership = await projectMembershipRepository.findActiveMembershipByProjectAndUser({
    projectId,
    userId,
  });

  if (!membership) {
    throw createHttpError('Akses Document Ditolak', 403);
  }

  return membership;
};

const assertStoredFileConsistency = async ({ context, documentFile }) => {
  if (!documentFile?.document) {
    throw createHttpError('Document Tidak Ditemukan', 404);
  }

  if (!documentFile.revision || !documentFile.storedFile) {
    logger.error(`[FILE] Inconsistent file pointer: ${context}`);
    throw createHttpError('Metadata file document tidak konsisten', 409);
  }

  if (
    documentFile.document.activeRevisionId &&
    context === 'active' &&
    documentFile.revision.id !== documentFile.document.activeRevisionId
  ) {
    logger.error('[FILE] Active revision pointer mismatch');
    throw createHttpError('Metadata revision aktif tidak konsisten', 409);
  }

  if (
    context === 'active' &&
    documentFile.document.activeFileId &&
    documentFile.storedFile.fileId !== documentFile.document.activeFileId
  ) {
    logger.error('[FILE] Active file pointer mismatch');
    throw createHttpError('Metadata file aktif tidak konsisten', 409);
  }

  if (!(await storageService.exists(documentFile.storedFile.storageKey))) {
    logger.error('[FILE] Storage object missing');
    throw createHttpError('File document tidak ditemukan di storage', 404);
  }
};

const resolveActiveFile = async ({ documentId, userId }) => {
  const documentFile = await fileAccessRepository.findActiveDocumentFile(documentId);

  await assertStoredFileConsistency({ context: 'active', documentFile });
  await assertProjectAccess({
    projectId: documentFile.document.projectId,
    userId,
  });

  return documentFile;
};

const resolveRevisionFile = async ({ documentId, revisionId, userId }) => {
  const documentFile = await fileAccessRepository.findRevisionDocumentFile({ documentId, revisionId });

  await assertStoredFileConsistency({ context: 'revision', documentFile });
  await assertProjectAccess({
    projectId: documentFile.document.projectId,
    userId,
  });

  return documentFile;
};

const resolveDocumentFile = async ({ documentId, revisionId, userId }) => {
  if (revisionId) {
    return resolveRevisionFile({ documentId, revisionId, userId });
  }

  return resolveActiveFile({ documentId, userId });
};

const resolveDocumentFileForAccess = async ({
  action,
  actorOfficialRole,
  actorUserFullName,
  documentId,
  revisionId,
  userId,
}) => {
  const documentFile = await resolveDocumentFile({ documentId, revisionId, userId });
  const auditAction = action === 'download' ? 'Download Document' : 'View Document';
  const revisionContext = revisionId || documentFile.document.activeRevisionId || 'active';

  await auditService.recordActivitySafely({
    action: auditAction,
    actorOfficialRole,
    actorUserFullName,
    actorUserId: userId,
    identityKey: [
      auditAction,
      userId,
      documentId,
      revisionContext,
      new Date().toISOString(),
    ].join(':'),
    metadata: {
      revisionId: revisionId || documentFile.document.activeRevisionId || null,
    },
    projectId: documentFile.document.projectId,
    reference: documentFile.document.documentNumber,
    resourceId: documentId,
    resourceType: 'Document',
  });

  return documentFile;
};

const streamStoredFileResponse = async ({ disposition, documentFile, res }) => {
  const { storedFile } = documentFile;
  const stream = await storageService.getStream(storedFile.storageKey);

  res.setHeader('Content-Type', storedFile.mimeType);
  res.setHeader('Content-Length', String(storedFile.fileSize));
  res.setHeader('Content-Disposition', buildContentDisposition({
    disposition,
    fileName: storedFile.originalFileName,
  }));
  res.setHeader('Cache-Control', 'no-store');
  res.setHeader('X-Content-Type-Options', 'nosniff');

  stream.on('error', (error) => {
    logger.error('[FILE] Storage stream failed');
    logger.error(error.code || error.name || 'StorageStreamError');
    if (!res.headersSent) {
      res.status(500).json({ success: false, message: 'Gagal membaca file document' });
    } else {
      res.destroy(error);
    }
  });

  res.on('close', () => {
    if (!res.writableEnded && typeof stream.destroy === 'function') {
      stream.destroy();
    }
  });

  stream.pipe(res);
};

module.exports = {
  assertProjectAccess,
  resolveActiveFile,
  resolveDocumentFile,
  resolveDocumentFileForAccess,
  resolveRevisionFile,
  streamStoredFileResponse,
};
