const { createHash } = require('node:crypto');
const env = require('../config/env');
const logger = require('../config/logger');
const repository = require('../repositories/emergencyAttachment.repository');
const documents = require('../repositories/document.repository');
const files = require('../repositories/fileAccess.repository');
const admission = require('./documentAdmission.service');
const uploads = require('./upload.service');
const storage = require('./storage.service');
const audit = require('./audit.service');
const realtime = require('./realtimeDocumentPublisher.service');
const { createHttpError } = require('../utils/administration');
const { EMERGENCY_ACTION, validateWorkflowAttachment } = require('../utils/workflowAttachmentPolicy');
const { buildAttachmentPhysicalFileName, buildAttachmentStorageKey } = require('../utils/storageKeyBuilder');
const { validateStoredFileCapacity } = require('../utils/storageMetadataCapacity');

const digest = values => createHash('sha256').update(JSON.stringify(values)).digest('hex');
const active = value => String(value || '').trim().toLowerCase() === 'active';
const conflict = () => createHttpError('Dokumen atau permintaan telah berubah. Buka kembali form.', 409);

const submit = async ({ actorUserId, documentId, activeProject, payload = {}, requestPayload, replayOnly = false }) => {
  payload = requestPayload || payload;
  const projectId = activeProject?.id;
  const { requestId, temporaryFileId, expectedActiveRevisionId, expectedWorkflowStatus, expectedSubmissionStage } = payload;
  const comment = typeof payload.comment === 'string' ? payload.comment.trim() : '';
  if (!projectId || payload.projectId !== projectId) throw createHttpError('Project aktif tidak sesuai.', 403);
  if (typeof requestId !== 'string' || !/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(requestId) ||
    typeof temporaryFileId !== 'string' || !temporaryFileId.trim() || !expectedActiveRevisionId || !expectedWorkflowStatus || !expectedSubmissionStage) {
    throw createHttpError('Attachment dan identitas permintaan wajib lengkap.', 422);
  }
  const id = `EWA-${digest([projectId, documentId, actorUserId, requestId.toLowerCase()]).slice(0, 60)}`;
  const fingerprint = digest([comment, temporaryFileId, expectedActiveRevisionId, expectedWorkflowStatus, expectedSubmissionStage]);
  let finalized = false;
  let destination;
  let publishedDocument;
  let committedResult;
  try {
    committedResult = await documents.runInTransaction(async connection => {
      const { document, project, member } = await repository.lockContext(connection, { documentId, projectId, actorUserId });
      const role = member?.official_role;
      const process = role === 'Team Process';
      if (!document || !active(project?.status) || !active(member?.membership_status) || !active(member?.user_status) ||
        !active(document.lifecycle_status) || !['Team Process', 'Team Project'].includes(role) ||
        !(process ? env.emergencyUpload.teamProcess : env.emergencyUpload.teamProject)) {
        throw createHttpError('Emergency attachment tidak diizinkan.', 403);
      }
      if ((process ? document.revision_label !== 'IFA-Submitted' : document.workflow_status !== 'Approved') ||
        document.active_revision_id !== expectedActiveRevisionId || document.workflow_status !== expectedWorkflowStatus ||
        document.revision_label !== expectedSubmissionStage) throw conflict();
      const prior = await repository.findRequest(connection, id);
      if (prior) {
        if (prior.request_fingerprint !== fingerprint || prior.workflow_action !== EMERGENCY_ACTION ||
          prior.project_id !== projectId || prior.document_id !== documentId || String(prior.created_by_user_id) !== String(actorUserId) ||
          !prior.attachment_id || !prior.file_id || prior.verified_file_id !== prior.file_id) throw conflict();
        return { commentId: id, attachmentId: prior.attachment_id, fileId: prior.file_id, replayed: true };
      }
      if (replayOnly) throw conflict();
      if (await repository.hasUnresolvedStorage(connection, { documentId, projectId, writerId: admission.current()?.id })) {
        throw createHttpError('Hasil operasi file sebelumnya belum dapat dipastikan.', 409);
      }
      const fullName = String(member.full_name || '').trim();
      if (!fullName) throw createHttpError('Nama lengkap pengguna wajib tersedia.', 422);
      const temporary = await uploads.assertTemporaryUploadConsumable({ actorUserId, temporaryFileId });
      validateWorkflowAttachment(temporary);
      const attachmentId = `WFA-${id.slice(4)}`;
      const fileId = `FILE-${id.slice(4, 63)}`;
      const foundation = await documents.findDocumentRegisterById(documentId);
      const physicalFileName = buildAttachmentPhysicalFileName({ attachmentId, originalFileName: temporary.originalFileName });
      destination = buildAttachmentStorageKey({ documentNumber: document.document_number, projectCode: foundation.projectCode,
        physicalFileName, workflowStatus: process ? 'Process Review' : 'Project Review' });
      validateStoredFileCapacity({ originalFileName: temporary.originalFileName, physicalFileName, storageKey: destination, relativePath: destination });
      const message = comment || (process
        ? 'This approved document just has a new attachment added by the process team.'
        : 'This approved document just has a new attachment added by the project team.');
      await documents.insertWorkflowComment(connection, { id, projectId, documentId, revisionId: null,
        workflowAction: EMERGENCY_ACTION, workflowComment: message, createdByUserId: actorUserId,
        createdByNameSnapshot: fullName, createdByOfficialRoleSnapshot: role, requestFingerprint: fingerprint });
      await documents.insertStoredFile(connection, { ...temporary, fileId, projectId, documentId, originalFileName: temporary.originalFileName,
        physicalFileName, storageKey: destination, relativePath: destination, fileCategory: 'Workflow Attachment', uploadedByUserId: actorUserId, isActive: true });
      await files.insertWorkflowAttachment(connection, { attachmentId, commentId: id, projectId, documentId, fileId, uploadedByUserId: actorUserId });
      if (await uploads.consumeTemporaryUploadMetadata(connection, temporaryFileId) !== 1) throw conflict();
      await storage.finalize(temporary.storageKey, destination);
      finalized = true;
      await documents.completeStoredFileProvenance(connection, fileId);
      await audit.recordActivity({ action: EMERGENCY_ACTION, actorUserId, actorUserFullName: fullName, actorOfficialRole: role,
        projectId, resourceType: 'Document', resourceId: documentId, reference: document.document_number,
        identityKey: id, metadata: { commentId: id, attachmentId, fileId } }, { connection });
      publishedDocument = foundation;
      return { commentId: id, attachmentId, fileId, replayed: false };
    });
  } catch (error) {
    // A COMMIT acknowledgement failure must never trigger deletion of possibly committed files.
    if (finalized && admission.current()?.dbOutcome === 'ROLLED_BACK') {
      await storage.delete(destination).catch(() => logger.error('[EMERGENCY_ATTACHMENT] Compensation failed'));
    }
    throw error;
  }
  if (!committedResult.replayed) realtime.publishCommentCreated({ actorUserId, commentId: id, document: publishedDocument });
  return committedResult;
};

const admittedSubmit = admission.documentWriter(submit, 'EMERGENCY_ATTACHMENT');
module.exports = {
  async submit(args) {
    const requestId = args.payload?.requestId;
    // A committed replay does not consume a temporary file. Keep document admission
    // fencing, but do not reacquire a possibly unresolved original temporary claim.
    if (typeof requestId === 'string' && args.activeProject?.id) {
      const id = `EWA-${digest([args.activeProject.id, args.documentId, args.actorUserId, requestId.toLowerCase()]).slice(0, 60)}`;
      if (await repository.findCommittedRequest(id)) {
        return admittedSubmit({ ...args, replayOnly: true, requestPayload: args.payload,
          payload: { ...args.payload, temporaryFileId: undefined } });
      }
    }
    return admittedSubmit(args);
  },
};
