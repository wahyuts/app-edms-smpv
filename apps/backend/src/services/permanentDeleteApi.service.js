const { randomUUID, createHash } = require('node:crypto');
const { createRepository } = require('../repositories/permanentDeleteApi.repository');
const { createOwnershipPreflight } = require('./legacyDeleteRestriction.service');
const realtimeDocumentPublisher = require('./realtimeDocumentPublisher.service');
const logger = require('../config/logger');

const fault = (statusCode, message, data = {}) => Object.assign(new Error(message), { statusCode, publicDeleteError: true, data });
const LEGACY_REASON = 'LEGACY_STORAGE_OWNERSHIP_UNVERIFIED';
const LEGACY_TITLE = 'Dokumen Tidak Dapat Dihapus Permanen';
const LEGACY_MESSAGE = 'Dokumen ini merupakan dokumen lama yang dibuat sebelum fitur Permanent Delete diterapkan. Karena informasi penyimpanannya belum dapat diverifikasi, dokumen tidak dapat dihapus secara permanen.\n\nDokumen tetap dapat digunakan dan dikelola seperti biasa.';
const restrictionResult = (args) => ({ status: 'CONFLICT', reasonCode: LEGACY_REASON,
  projectId: args.projectId, documentId: args.documentId, title: LEGACY_TITLE, message: LEGACY_MESSAGE });
const createPermanentDeleteApi = ({ pool, coordination, engine, publishCompleted = realtimeDocumentPublisher.publishDocumentDeleted }) => {
  const repository = createRepository({ pool });
  const ownershipPreflight = createOwnershipPreflight({ repository });
  const authorize = async ({ actorUserId, activeProject, projectId, documentId }) => {
    if (!actorUserId) throw fault(401, 'Silakan login terlebih dahulu.');
    if (typeof projectId !== 'string' || !projectId || projectId.length > 64 || typeof documentId !== 'string' || !documentId || documentId.length > 64) {
      throw fault(422, 'Identitas project atau dokumen tidak valid.');
    }
    if (activeProject?.id !== projectId) throw fault(403, 'Project aktif tidak sesuai.');
    const membership = await repository.authorize(projectId, actorUserId);
    if (membership?.official_role !== 'Admin') throw fault(403, 'Hanya Admin pada project aktif yang dapat menghapus dokumen.');
  };
  const describe = async (op, fallback) => {
    const { execution, attempts, uncertain } = await repository.state(op);
    const base = { operationId: op.id, projectId: op.project_id, documentId: op.document_id, documentNumber: op.document_number_snapshot };
    if (execution?.phase === 'COMPLETED') {
      const completed = JSON.parse(execution.completion_snapshot);
      try {
        const recipientUserIds = await repository.realtimeRecipients(op.project_id);
        await publishCompleted({ actorUserId: op.initiated_by_user_id,
          document: { id: op.document_id, projectId: op.project_id }, operationId: op.id, recipientUserIds });
      } catch {
        // Completion is already durable. Realtime failure must not change its outcome.
        logger.error('[REALTIME_PUBLISHER]', 'event=permanent_delete_publish_failed', `operationId=${op.id}`);
      }
      return { ...base, status: 'COMPLETED', completedAt: completed.completedAt, message: 'Dokumen berhasil dihapus permanen.' };
    }
    if (uncertain || attempts.some((item) => ['UNKNOWN','IN_FLIGHT'].includes(item.state))) {
      return { ...base, status: 'UNKNOWN', message: 'Hasil penghapusan belum dapat dipastikan. Periksa status operasi; jangan membuat permintaan baru.' };
    }
    if (fallback?.reason === 'DELETE_WORKER_BUSY') return { ...base, status: 'CONFLICT', message: 'Penghapusan dokumen sedang diproses.' };
    if (execution?.pending_reason === 'CLEANUP_INTERRUPTED' && attempts.length && attempts.every((item) => item.state === 'SUCCEEDED')) {
      return { ...base, status: 'FAILED', message: 'Penyimpanan hasil penghapusan belum berhasil. Dokumen belum dihapus sepenuhnya.' };
    }
    return { ...base, status: 'PENDING', message: 'Penghapusan tertunda. Penyelesaian operasi atau bukti keamanan file belum lengkap.' };
  };
  const status = async (args) => {
    await authorize(args);
    const op = await repository.operation(args.projectId, args.documentId);
    if (!op && !args.operationId) {
      const document = await repository.document(args.documentId);
      if (document?.project_id === args.projectId) {
        // A lost rejection response has no operation to poll. Recalculate only
        // through reads; never reserve/resume or release an existing operation.
        let check;
        try { check = await repository.readOwnershipSnapshot(c => ownershipPreflight(c, args.projectId, args.documentId)); }
        catch { /* An unconfirmed legacy hint must preserve the original 404 response. */ }
        const raced = await repository.operation(args.projectId, args.documentId);
        if (raced) return describe(raced);
        if (check?.reasonCode === LEGACY_REASON) return restrictionResult(args);
      }
    }
    if (!op || (args.operationId && op.id !== args.operationId)) throw fault(404, 'Operasi penghapusan tidak ditemukan.');
    return describe(op);
  };
  const remove = async (args) => {
    await authorize(args);
    if (typeof args.requestKey !== 'string' || !/^[A-Za-z0-9_-]{8,128}$/.test(args.requestKey)) throw fault(422, 'Identitas permintaan tidak valid.');
    if (args.reason != null && (typeof args.reason !== 'string' || args.reason.trim().length > 1000)) throw fault(422, 'Alasan maksimal 1000 karakter.');
    const reason = args.reason?.trim() || null;
    const requestIdentity = createHash('sha256').update(args.requestKey).digest('hex');
    let op = await repository.operation(args.projectId, args.documentId);
    if (op && (op.request_identity !== requestIdentity || String(op.initiated_by_user_id) !== String(args.actorUserId))) {
      if ((await describe(op)).status === 'COMPLETED') { await engine.resume(op.id); return describe(op); }
      throw fault(409, 'Operasi penghapusan untuk dokumen ini sudah tersedia.', { ...(await describe(op)), status: 'CONFLICT' });
    }
    if (!op) {
      const document = await repository.document(args.documentId);
      if (!document) throw fault(404, 'Dokumen tidak ditemukan.');
      if (document.project_id !== args.projectId) throw fault(403, 'Dokumen tidak termasuk project aktif.');
      try {
        await coordination.reserve({ id: randomUUID(), projectId: args.projectId, documentId: args.documentId,
          documentNumber: document.document_number, userId: args.actorUserId, reason, requestIdentity }, {
          beforeReserve: async connection => {
            const check = await ownershipPreflight(connection, args.projectId, args.documentId);
            if (check.reasonCode !== LEGACY_REASON) return;
            const result = restrictionResult(args);
            throw fault(409, result.message, result);
          },
        });
      } catch (error) {
        op = await repository.operation(args.projectId, args.documentId);
        if (!op) throw error;
        if (op.request_identity !== requestIdentity || String(op.initiated_by_user_id) !== String(args.actorUserId)) {
          throw fault(409, 'Penghapusan dokumen sedang diproses.', { ...(await describe(op)), status: 'CONFLICT' });
        }
      }
      op = await repository.operation(args.projectId, args.documentId);
    }
    const before = await describe(op);
    if (before.status === 'UNKNOWN') return before;
    if (before.status !== 'COMPLETED') {
      const gate = await coordination.evaluateQuiescence(op.id);
      if (gate?.status !== 'QUIESCENCE_CONFIRMED') return describe(op);
    }
    const result = await engine.resume(op.id);
    return describe(op, result);
  };
  return Object.freeze({ remove, status });
};

module.exports = { createPermanentDeleteApi };
