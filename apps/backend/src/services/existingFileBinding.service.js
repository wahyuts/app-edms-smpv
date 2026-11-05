const { digest, sameNamespace, pending } = require('../utils/storageNamespace');
const { validateStorageKey } = require('../validators/storage.validator');
const { bindNewFile } = require('../repositories/storageNamespace.repository');
const { createRepository } = require('../repositories/documentDelete.repository');

// Internal, explicitly reviewed per-file provenance only. No startup/backfill/route.
// The trusted caller supplies an OWNER-reviewed storage inventory, not form data.
const createBindingService = ({ pool, coordination, storage }) => {
  const repository = createRepository({ coordination });
  const bind = async ({ operationId, actorUserId, reviewed }) => {
    if (typeof operationId !== 'string' || !operationId || operationId.length > 64 || !reviewed || reviewed.source !== 'OWNER_REVIEWED_STORAGE_INVENTORY'
      || !/^[A-Za-z0-9_-]{1,128}$/.test(reviewed.recordId || '')
      || !reviewed.namespace || !reviewed.fileId || !reviewed.documentId || !reviewed.projectId
      || !/^[a-f0-9]{64}$/.test(reviewed.sha256 || '') || !Number.isSafeInteger(reviewed.size) || reviewed.size < 0) {
      throw pending('FILE_PROVENANCE_REQUIRED');
    }
    const captured = reviewed.namespace;
    if (digest(captured.encoded) !== captured.id || JSON.stringify(captured.descriptor) !== captured.encoded
      || !['local','r2'].includes(captured.descriptor.provider)) throw pending('NAMESPACE_INVALID');
    const key = validateStorageKey(reviewed.storageKey);
    if (key !== reviewed.storageKey) throw pending('FILE_PROVENANCE_CONFLICT');
    const c = await pool.getConnection(); let acquired = false;
    const lock = `edms-del:${digest(operationId).slice(0, 48)}`;
    try {
      const [[claim]] = await c.execute('SELECT GET_LOCK(?,0) AS acquired', [lock]);
      if (Number(claim.acquired) !== 1) throw pending('DELETE_WORKER_BUSY');
      acquired = true;
      await c.beginTransaction();
      const op = await repository.lockOperation(c, operationId);
      if (op.document_id !== reviewed.documentId || op.project_id !== reviewed.projectId) throw pending('FILE_PROVENANCE_CONFLICT');
      const [[actor]] = await c.execute(`SELECT u.id FROM users u JOIN project_memberships m ON m.user_id=u.id
        WHERE u.id=? AND u.status='Active' AND m.project_id=? AND m.status='Active' AND m.official_role='Admin'`, [actorUserId, op.project_id]);
      if (!actor) throw pending('BINDING_ADMIN_REQUIRED');
      const inventory = await repository.inventory(c, op, { forBinding: true });
      const file = inventory.files.find((item) => item.file_id === reviewed.fileId);
      if (!file || file.storage_key !== key || Number(file.file_size) !== reviewed.size
        || (file.checksum && file.checksum.toLowerCase() !== reviewed.sha256)) throw pending('FILE_PROVENANCE_CONFLICT');
      const evidence = { source: reviewed.source, version: 1, recordId: reviewed.recordId, actorUserId,
        projectId: reviewed.projectId, documentId: reviewed.documentId, sha256: reviewed.sha256, size: reviewed.size };
      if (captured.descriptor.provider === 'local') {
        if (!reviewed.localIdentity || reviewed.localIdentity.sha256 !== reviewed.sha256
          || reviewed.localIdentity.size !== reviewed.size || !reviewed.localIdentity.identity || !reviewed.localIdentity.rootIdentity) throw pending('FILE_PROVENANCE_REQUIRED');
        evidence.localIdentity = Object.fromEntries(['rootIdentity','identity','sha256','size'].map((field) => [field, reviewed.localIdentity[field]]));
      }
      const prior = inventory.bindings.find((item) => item.file_id === file.file_id);
      if (prior && (prior.namespace_id !== captured.id || prior.storage_key_snapshot !== key)) throw pending('FILE_PROVENANCE_CONFLICT');
      if (prior && prior.evidence === JSON.stringify(evidence)) { await c.commit(); return { status: 'ALREADY_BOUND' }; }
      const [[execution]] = await c.execute('SELECT operation_id FROM document_delete_executions WHERE operation_id=?', [operationId]);
      if (execution) throw pending('MANIFEST_ALREADY_FINALIZED');
      if (prior && JSON.parse(prior.evidence).source !== 'UPLOAD_ADAPTER_SNAPSHOT') throw pending('FILE_PROVENANCE_CONFLICT');
      // Do not infer historical provenance from the active adapter or a matching key.
      if (!sameNamespace(await storage.captureNamespace(), captured)) throw pending('NAMESPACE_MISMATCH');
      const observed = await storage.inspectOwnedExact(key, captured);
      if (!observed.exists || observed.sha256 !== reviewed.sha256 || observed.size !== reviewed.size
        || (evidence.localIdentity && ['rootIdentity','identity','sha256','size'].some((field) => observed[field] !== evidence.localIdentity[field]))) {
        throw pending('FILE_PROVENANCE_CONFLICT');
      }
      if (!prior) await bindNewFile(c, file.file_id, key, captured);
      await c.execute('UPDATE stored_file_namespace_bindings SET evidence=? WHERE file_id=? AND namespace_id=? AND storage_key_snapshot=?',
        [JSON.stringify(evidence), file.file_id, captured.id, key]);
      await c.commit(); return { status: 'BOUND' };
    } catch (error) { await c.rollback().catch(() => {}); throw error; }
    finally {
      if (acquired) await c.execute('SELECT RELEASE_LOCK(?)', [lock]).catch(() => {});
      c.release();
    }
  };
  return Object.freeze({ bind });
};

module.exports = { createBindingService };
