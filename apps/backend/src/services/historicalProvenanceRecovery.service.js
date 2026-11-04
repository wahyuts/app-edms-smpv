const { randomUUID } = require('node:crypto');
const { digest, pending, sameNamespace } = require('../utils/storageNamespace');
const { verifyFile, assertNamespace } = require('./fileProvenance.service');
const { createRepository } = require('../repositories/documentDelete.repository');

// Owner-authorized historical cases only; not a general-purpose binding repair API.
const projectId = 'PRJ-008dce88-7d3e-4160-9238-95c20df2fb10';
const base = 'projects/SS-ALPHA-01/documents/';
const SCOPES = [
  { projectId, projectCode: 'SS-ALPHA-01', documentNumber: 'PID-EDMS-0001', status: 'Process Reject',
    documentId: 'DOC-PID-4bf29f17-828c-4a6a-a74a-8633c8b5b0de', operationId: '00aa58b7-fcc1-479b-88e7-9362e1c66dc9',
    files: [{ fileId: 'FILE-ccec6360-9346-4c77-b18b-c815596ee3b0', kind: 'attachment', role: 'Team Process',
      key: `${base}PID-EDMS-0001/attachments/process-comments/3143f93e_6_September_2026.pdf` }] },
  { projectId, projectCode: 'SS-ALPHA-01', documentNumber: 'PID-EDMS-0020', status: 'Project Reject',
    documentId: 'DOC-PID-88283fe4-6abe-4fb4-810f-58b145160e11', operationId: 'a0b224f2-9bfe-43d0-a84a-aceefe8335b5',
    files: [{ fileId: 'FILE-389f7d3f-e241-492e-bd64-d75fd976aa1c', kind: 'attachment', role: 'Team Project',
      key: `${base}PID-EDMS-0020/attachments/project-comments/3094690c_3_Mei_2026.pdf` },
    { fileId: 'FILE-e332a359-3124-4311-b018-811340a9e194', kind: 'revision-move',
      sourceKey: `${base}PID-EDMS-0020/revisions/IFR-Submitted/PID-EDMS-0020_IFR-Submitted_20261103_e332a359_Belum_ada_tanggapan.png`,
      key: `${base}PID-EDMS-0020/revisions/IFA-Submitted/PID-EDMS-0020_IFA-Submitted_20261103_e332a359_Belum_ada_tanggapan.png` }] },
];
for (const scope of SCOPES) { scope.files.forEach(Object.freeze); Object.freeze(scope.files); Object.freeze(scope); }
Object.freeze(SCOPES);
const reportDigest = ({ approvalDigest, ...value }) => digest(JSON.stringify(value));
const parse = (value) => typeof value === 'string' ? JSON.parse(value) : value;
const equal = (a, b) => JSON.stringify(a) === JSON.stringify(b);
const rows = async (c, sql, args = []) => (await c.execute(sql, args))[0];
const lockName = (id) => `edms-del:${digest(id).slice(0, 48)}`;
const selectScopes = (ids) => {
  if (!Array.isArray(ids) || !ids.length || new Set(ids).size !== ids.length
    || ids.some((id) => !SCOPES.some((s) => s.operationId === id))) throw pending('RECOVERY_SCOPE_INVALID');
  return SCOPES.filter((s) => ids.includes(s.operationId));
};

const createRecovery = ({ storage, namespace, operationIds, repository = createRepository({}) }) => {
  assertNamespace(namespace);
  if (namespace.descriptor.provider !== 'local') throw pending('RECOVERY_LOCAL_ONLY');
  const scopes = selectScopes(operationIds);
  const inspect = async (c, scope) => {
    const [op] = await rows(c, 'SELECT * FROM document_delete_operations WHERE id=?', [scope.operationId]);
    const [gate] = await rows(c, 'SELECT * FROM document_admission_coordinators WHERE project_id=? AND document_id=?', [scope.projectId, scope.documentId]);
    const [project] = await rows(c, 'SELECT id,project_code,status FROM projects WHERE id=?', [scope.projectId]);
    if (!op || op.document_id !== scope.documentId || op.project_id !== scope.projectId
      || op.document_number_snapshot !== scope.documentNumber || op.status !== 'QUIESCENCE_CONFIRMED') throw pending('RECOVERY_OPERATION_MISMATCH');
    if (!gate || gate.gate_state !== 'CLOSED' || gate.delete_operation_id !== op.id) throw pending('RECOVERY_GATE_MISMATCH');
    if (!project || project.project_code !== scope.projectCode || project.status !== 'Active') throw pending('RECOVERY_PROJECT_MISMATCH');
    if ((await rows(c, 'SELECT id FROM document_delete_operations WHERE document_id=? AND id<>?', [scope.documentId, scope.operationId])).length) {
      throw pending('RECOVERY_OTHER_OPERATION');
    }
    if ((await rows(c, 'SELECT operation_id FROM document_delete_executions WHERE operation_id=?', [op.id])).length) throw pending('RECOVERY_EXECUTION_EXISTS');
    const manifests = await rows(c, 'SELECT * FROM document_delete_file_manifest');
    if (manifests.some((m) => m.delete_operation_id === op.id)) throw pending('RECOVERY_MANIFEST_EXISTS');
    if ((await rows(c, `SELECT a.manifest_id FROM document_delete_attempts a JOIN document_delete_file_manifest m ON m.id=a.manifest_id
      WHERE m.delete_operation_id=?`, [op.id])).length) throw pending('RECOVERY_ATTEMPT_EXISTS');
    const writers = await rows(c, 'SELECT * FROM document_writer_operations WHERE project_id=? AND document_id=? ORDER BY id', [scope.projectId, scope.documentId]);
    const io = await rows(c, `SELECT s.* FROM document_storage_io_steps s JOIN document_writer_operations w ON w.id=s.writer_id
      WHERE w.project_id=? AND w.document_id=? ORDER BY s.id`, [scope.projectId, scope.documentId]);
    if (writers.some((w) => w.lifecycle_state !== 'SETTLED' || !w.completion_evidence || !['COMMITTED','ROLLED_BACK','NOT_STARTED'].includes(w.db_outcome)
      || parse(w.completion_evidence).scopeClosed !== true || parse(w.completion_evidence).unresolvedIo !== 0 || parse(w.completion_evidence).uncertain !== false)
      || io.some((s) => s.state !== 'SUCCEEDED')) throw pending('RECOVERY_WRITER_UNSETTLED');
    if (!sameNamespace(await storage.captureNamespace(), namespace)) throw pending('NAMESPACE_MISMATCH');
    const files = await rows(c, 'SELECT * FROM stored_files WHERE document_id=? ORDER BY file_id', [scope.documentId]);
    const bindings = await rows(c, `SELECT b.* FROM stored_file_namespace_bindings b JOIN stored_files f ON f.file_id=b.file_id
      WHERE f.document_id=? ORDER BY b.file_id`, [scope.documentId]);
    for (const spec of scope.files) {
      const f = files.find((x) => x.file_id === spec.fileId), b = bindings.find((x) => x.file_id === spec.fileId);
      if (!f || f.project_id !== scope.projectId || f.storage_key !== spec.key || !b || b.namespace_id !== namespace.id) {
        throw pending('RECOVERY_FILE_SCOPE_MISMATCH');
      }
      if (b.storage_key_snapshot !== (spec.sourceKey || spec.key)) throw pending('RECOVERY_BINDING_MISMATCH');
      const evidence = parse(b.evidence);
      if (spec.kind === 'attachment' && !equal(evidence, { source: 'UPLOAD_ADAPTER_SNAPSHOT', version: 1 })) {
        throw pending('RECOVERY_NOT_PROVISIONAL');
      }
    }
    // Read-only proposed-key projection for the single reviewed stale binding. The
    // canonical inventory validator itself is unchanged; raw bindings stay in the fingerprint.
    const projected = { execute: async (sql, args) => {
      if (!/^\s*SELECT\b/i.test(sql)) throw pending('RECOVERY_READ_ONLY_REQUIRED');
      const result = await c.execute(sql, args);
      if (/FROM stored_file_namespace_bindings WHERE file_id IN/.test(sql)) {
        return [result[0].map((b) => {
          const spec = scope.files.find((f) => f.fileId === b.file_id && f.kind === 'revision-move');
          return spec ? { ...b, storage_key_snapshot: spec.key } : b;
        })];
      }
      return result;
    } };
    const inventory = await repository.inventory(projected, op);
    if (inventory.document.workflow_status !== scope.status || inventory.document.lifecycle_status !== 'Active'
      || inventory.document.document_number !== scope.documentNumber || files.length !== inventory.files.length) throw pending('RECOVERY_DOCUMENT_CHANGED');
    const ids = new Set(inventory.files.map((f) => f.file_id));
    const keys = new Set(inventory.files.map((f) => f.storage_key.toLowerCase()));
    for (const spec of scope.files) if (spec.sourceKey) keys.add(spec.sourceKey.toLowerCase());
    if (manifests.some((m) => ids.has(m.file_reference) || (parse(m.ownership_evidence).fileIds || []).some((id) => ids.has(id))
      || keys.has(m.exact_storage_key.toLowerCase()))) throw pending('RECOVERY_FOREIGN_MANIFEST');
    const prefix = `${base}${scope.documentNumber}/`;
    const physical = [];
    for (const f of inventory.files) {
      const b = bindings.find((x) => x.file_id === f.file_id);
      if (!b || b.namespace_id !== namespace.id || !f.storage_key.startsWith(prefix)) throw pending('RECOVERY_NAMESPACE_CONFLICT');
      const proof = await verifyFile(storage, namespace, f);
      const spec = scope.files.find((x) => x.fileId === f.file_id);
      const prior = parse(b.evidence);
      if (spec?.kind !== 'attachment' && (prior.sha256 !== proof.sha256 || prior.size !== proof.size
        || !equal(prior.localIdentity, proof.localIdentity))) throw pending('RECOVERY_IDENTITY_MISMATCH');
      physical.push({ fileId: f.file_id, storageKey: f.storage_key, ...proof });
    }
    const tree = await storage.inspectDocumentFolders(prefix, namespace);
    if (!tree.ready || !tree.exists || tree.rootIdentity !== physical[0]?.localIdentity.rootIdentity
      || tree.objects.length !== inventory.files.length
      || tree.objects.some((o) => !inventory.files.some((f) => f.storage_key === (typeof o === 'string' ? o : o.key)))) throw pending('RECOVERY_UNKNOWN_OBJECT');
    const changes = [];
    for (const spec of scope.files) {
      const binding = bindings.find((b) => b.file_id === spec.fileId);
      const observed = physical.find((f) => f.fileId === spec.fileId);
      let afterEvidence = binding.evidence, moveEvidence = null;
      if (spec.kind === 'revision-move') {
        const moves = io.filter((s) => s.operation_type === 'MOVE' && s.source_key === spec.sourceKey && s.destination_key === spec.key
          && s.state === 'SUCCEEDED' && parse(s.evidence)?.acknowledged === true
          && writers.some((w) => w.id === s.writer_id && w.db_outcome === 'COMMITTED'));
        if (moves.length !== 1) throw pending('RECOVERY_MOVE_UNVERIFIED');
        const old = await storage.inspectOwnedExact(spec.sourceKey, namespace);
        if (old.exists !== false || old.rootIdentity !== observed.localIdentity.rootIdentity) throw pending('RECOVERY_SOURCE_STILL_EXISTS');
        const revision = inventory.tables.document_revisions.find((r) => r.file_id === spec.fileId);
        if (!revision || revision.storage_path_legacy !== spec.key || revision.revision_label !== 'IFA-Submitted'
          || inventory.document.active_file_id !== spec.fileId) throw pending('RECOVERY_REVISION_MISMATCH');
        moveEvidence = moves[0];
      } else {
        const attachment = inventory.tables.workflow_attachments.find((a) => a.file_id === spec.fileId);
        const comment = inventory.tables.workflow_comments.find((w) => w.id === attachment?.comment_id);
        if (!attachment || comment?.workflow_action !== 'Approval C' || comment.created_by_official_role_snapshot !== spec.role) {
          throw pending('RECOVERY_ATTACHMENT_MISMATCH');
        }
        afterEvidence = JSON.stringify({ source: 'OWNER_REVIEWED_PENDING_DELETE_RECOVERY', version: 1,
          identityBasis: 'CURRENT_NATIVE_INSPECTION_NOT_UPLOAD_TIME', operationId: scope.operationId,
          sha256: observed.sha256, size: observed.size, localIdentity: observed.localIdentity });
      }
      changes.push({ fileId: spec.fileId, kind: spec.kind, before: binding,
        after: { storage_key_snapshot: spec.key, evidence: afterEvidence }, moveEvidence });
    }
    return { scope, eligible: true, metadataFingerprint: digest(JSON.stringify({ op, gate, project, writers, io, inventory, bindings })),
      operation: op, gate, fileSnapshots: files, bindingSnapshots: bindings, physical, tree, changes,
      concurrency: { writersSettled: true, ioSucceeded: true, execution: 0, manifest: 0, attempt: 0 },
      auditRequirements: { action: 'Historical File Provenance Recovered', sameTransaction: true,
        attachmentEvidenceAdds: ['approvalDigest', 'actorUserId'], revisionEvidencePreserved: true } };
  };
  const dryRun = async (c, target) => {
    const items = [];
    for (const scope of scopes) {
      try {
        const [claim] = await rows(c, 'SELECT IS_USED_LOCK(?) AS owner', [lockName(scope.operationId)]);
        if (claim.owner !== null) throw pending('DELETE_WORKER_BUSY');
        items.push(await inspect(c, scope));
      } catch (error) { items.push({ scope, eligible: false, reason: error.code || 'RECOVERY_INSPECTION_FAILED' }); }
    }
    const report = { version: 1, mode: 'HISTORICAL_RECOVERY_DRY_RUN', target, namespace, items,
      verdict: items.every((i) => i.eligible) ? 'PREFLIGHT_PASS' : 'BLOCKED' };
    return { ...report, ...(report.verdict === 'PREFLIGHT_PASS' ? { approvalDigest: reportDigest(report) } : {}) };
  };
  const apply = async (pool, { report, approvalDigest, actorUserId, confirmation, target }) => {
    if (!actorUserId || confirmation !== 'APPLY_REVIEWED_HISTORICAL_PROVENANCE' || !/^[a-f0-9]{64}$/.test(approvalDigest || '')
      || reportDigest(report) !== approvalDigest || report.approvalDigest !== approvalDigest
      || report.version !== 1 || report.mode !== 'HISTORICAL_RECOVERY_DRY_RUN' || report.verdict !== 'PREFLIGHT_PASS'
      || report.databaseEvidence?.unchanged !== true || report.filesystemEvidence?.unchanged !== true
      || !equal(report.target, target) || !equal(report.namespace, namespace)
      || !equal(report.items.map((i) => i.scope), scopes) || report.items.some((i) => !i.eligible)) throw pending('RECOVERY_APPROVAL_REQUIRED');
    const completedDocuments = [];
    for (const approved of report.items) {
      const c = await pool.getConnection(); let acquired = false, committing = false;
      const scope = approved.scope, lock = lockName(scope.operationId);
      const assertClaim = async () => {
        const [claim] = await rows(c, 'SELECT IS_USED_LOCK(?) = CONNECTION_ID() AS owned', [lock]);
        if (Number(claim.owned) !== 1) throw pending('DELETE_CLAIM_LOST');
      };
      try {
        const [claim] = await rows(c, 'SELECT GET_LOCK(?,0) AS acquired', [lock]);
        if (Number(claim.acquired) !== 1) throw pending('DELETE_WORKER_BUSY');
        acquired = true; await c.beginTransaction();
        await rows(c, 'SELECT * FROM document_admission_coordinators WHERE project_id=? AND document_id=? FOR UPDATE', [scope.projectId, scope.documentId]);
        await rows(c, 'SELECT id FROM projects WHERE id=? FOR UPDATE', [scope.projectId]);
        await rows(c, 'SELECT id FROM document_delete_operations WHERE id=? FOR UPDATE', [scope.operationId]);
        await rows(c, 'SELECT file_id FROM stored_files WHERE document_id=? ORDER BY file_id FOR UPDATE', [scope.documentId]);
        await rows(c, `SELECT b.file_id FROM stored_file_namespace_bindings b JOIN stored_files f ON f.file_id=b.file_id
          WHERE f.document_id=? ORDER BY b.file_id FOR UPDATE`, [scope.documentId]);
        const [actor] = await rows(c, `SELECT u.id,u.full_name,u.department_name_snapshot FROM users u JOIN project_memberships m ON m.user_id=u.id
          WHERE u.id=? AND u.status='Active' AND m.project_id=? AND m.status='Active' AND m.official_role='Admin' LOCK IN SHARE MODE`, [actorUserId, scope.projectId]);
        if (!actor?.full_name) throw pending('BINDING_ADMIN_REQUIRED');
        const identity = `historical-provenance:${digest(JSON.stringify([approvalDigest, scope.operationId]))}`;
        if ((await rows(c, 'SELECT id FROM audit_trail WHERE identity_key=?', [identity])).length) throw pending('RECOVERY_ALREADY_APPLIED');
        const fresh = await inspect(c, scope);
        if (!equal(fresh, approved)) throw pending('RECOVERY_EVIDENCE_CHANGED');
        await assertClaim();
        const changes = [];
        for (const change of fresh.changes) {
          let evidence = change.after.evidence;
          if (change.kind === 'attachment') evidence = JSON.stringify({ ...parse(evidence), approvalDigest, actorUserId: String(actorUserId) });
          const [write] = await c.execute(`UPDATE stored_file_namespace_bindings SET storage_key_snapshot=?,evidence=?
            WHERE file_id=? AND namespace_id=? AND BINARY storage_key_snapshot=BINARY ? AND BINARY evidence=BINARY ?`,
          [change.after.storage_key_snapshot, evidence, change.fileId, namespace.id, change.before.storage_key_snapshot, change.before.evidence]);
          if (write.affectedRows !== 1) throw pending('RECOVERY_BINDING_CONFLICT');
          changes.push({ ...change, after: { ...change.after, evidence } });
        }
        // The canonical validator now reads actual repaired rows, never the projection.
        await repository.inventory(c, { project_id: scope.projectId, document_id: scope.documentId });
        for (const observed of fresh.physical) {
          const file = fresh.fileSnapshots.find((f) => f.file_id === observed.fileId);
          const proof = await verifyFile(storage, namespace, file);
          if (!equal(proof, { sha256: observed.sha256, size: observed.size, localIdentity: observed.localIdentity })) throw pending('RECOVERY_EVIDENCE_CHANGED');
        }
        if (!equal(await storage.inspectDocumentFolders(`${base}${scope.documentNumber}/`, namespace), fresh.tree)) throw pending('RECOVERY_EVIDENCE_CHANGED');
        await c.execute(`INSERT INTO audit_trail (id,identity_key,project_id,actor_user_id,actor_name,department,official_role,
          action,business_event,detail,resource_type,resource_id,reference,metadata,occurred_at)
          VALUES (?,?,?,?,?,?,'Admin','Historical File Provenance Recovered','Pending Delete Metadata Recovery',
          'Owner-reviewed current file evidence recorded; no storage mutation.','Document',?,?,?,UTC_TIMESTAMP(3))`,
        [randomUUID(), identity, scope.projectId, actor.id, actor.full_name, actor.department_name_snapshot, scope.documentId,
          scope.documentNumber, JSON.stringify({ version: 1, approvalDigest, operationId: scope.operationId,
            documentId: scope.documentId, namespaceId: namespace.id, changes, physical: fresh.physical })]);
        await assertClaim(); committing = true; await c.commit();
        completedDocuments.push({ operationId: scope.operationId, documentId: scope.documentId, status: 'RECOVERED', files: changes.map((i) => i.fileId) });
      } catch (error) {
        await c.rollback().catch(() => {}); error.completedDocuments = completedDocuments;
        if (committing) error.uncertainDocument = { operationId: scope.operationId, documentId: scope.documentId };
        throw error;
      } finally {
        if (acquired) await c.execute('SELECT RELEASE_LOCK(?)', [lock]).catch(() => {});
        c.release();
      }
    }
    return completedDocuments;
  };
  return Object.freeze({ dryRun, apply });
};

module.exports = { SCOPES, selectScopes, reportDigest, createRecovery };
