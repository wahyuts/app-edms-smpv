const { randomUUID } = require('node:crypto');
const { digest, pending } = require('../utils/storageNamespace');
const { verifyFile, assertNamespace } = require('./fileProvenance.service');
const { bindNewFile } = require('../repositories/storageNamespace.repository');
const { createRepository } = require('../repositories/documentDelete.repository');

const rows = async (c, sql, args = []) => (await c.execute(sql, args))[0];
const inventoryFingerprint = (value) => digest(JSON.stringify({ document: value.document, tables: value.tables, files: value.files }));
const reportDigest = ({ approvalDigest, ...value }) => digest(JSON.stringify(value));
const parse = (value) => typeof value === 'string' ? JSON.parse(value) : value;
const sameProof = (binding, captured, key, proof) => {
  if (!binding || binding.namespace_id !== captured.id || binding.storage_key_snapshot !== key) return false;
  const evidence = parse(binding.evidence);
  return evidence.sha256 === proof.sha256 && evidence.size === proof.size
    && JSON.stringify(evidence.localIdentity) === JSON.stringify(proof.localIdentity);
};
const ambiguous = (code) => /SHARED_|AMBIGUOUS|CROSS_DOCUMENT|ACTIVE_FILE_MISMATCH/.test(code || '');

// No runtime pool/config import: dry-run can use a server-enforced read-only transaction.
const createReconciler = ({ coordination, namespaces, repository = createRepository({ coordination }) }) => {
  for (const entry of namespaces) assertNamespace(entry.namespace);
  if (!namespaces.length || new Set(namespaces.map((item) => item.namespace.id)).size !== namespaces.length) {
    throw pending('NAMESPACE_CONFIGURATION_REQUIRED');
  }
  const inspect = async (file, binding) => {
    const candidates = binding ? namespaces.filter((n) => n.namespace.id === binding.namespace_id) : namespaces;
    if (!candidates.length) throw pending('NAMESPACE_CONFIGURATION_REQUIRED');
    const matches = []; const errors = [];
    for (const entry of candidates) {
      try { matches.push({ namespace: entry.namespace, proof: await verifyFile(entry.storage, entry.namespace, file) }); }
      catch (error) { errors.push(error.code || 'INSPECTION_FAILED'); }
    }
    if (matches.length > 1) throw pending('NAMESPACE_AMBIGUOUS');
    // An inaccessible candidate could also contain this file. Never choose the readable one by default.
    if (errors.some((code) => code !== 'FILE_MISSING')) throw pending(errors.find((code) => code !== 'FILE_MISSING'));
    if (!matches.length) throw pending('FILE_MISSING');
    return matches[0];
  };
  const dryRun = async (c, target) => {
    const files = await rows(c, 'SELECT * FROM stored_files ORDER BY file_id');
    const groups = new Map();
    for (const file of files) {
      const key = JSON.stringify([file.project_id, file.document_id]);
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key).push(file);
    }
    const result = [];
    for (const group of groups.values()) {
      const scope = { project_id: group[0].project_id, document_id: group[0].document_id };
      let inventory; let failure;
      try { inventory = await repository.inventory(c, scope, { forBinding: true }); }
      catch (error) { failure = error.code || 'INVENTORY_FAILED'; }
      for (const file of group) {
        const item = { fileId: file.file_id, projectId: file.project_id, documentId: file.document_id,
          storageKey: file.storage_key, status: 'BLOCKED', alreadyBound: false, eligibleForApply: false };
        try {
          if (failure) throw pending(failure);
          item.inventoryFingerprint = inventoryFingerprint(inventory);
          const binding = inventory.bindings.find((b) => b.file_id === file.file_id);
          const observed = await inspect(file, binding);
          Object.assign(item, observed);
          item.alreadyBound = sameProof(binding, observed.namespace, file.storage_key, observed.proof);
          if (binding && !item.alreadyBound && parse(binding.evidence).source !== 'UPLOAD_ADAPTER_SNAPSHOT') {
            throw pending('FILE_PROVENANCE_CONFLICT');
          }
          item.status = 'VERIFIED'; item.eligibleForApply = !item.alreadyBound;
          item.fingerprint = digest(JSON.stringify({ file, inventory: item.inventoryFingerprint, ...observed }));
        } catch (error) {
          item.reason = error.code || 'INSPECTION_FAILED';
          item.status = item.reason === 'FILE_MISSING' ? 'MISSING' : ambiguous(item.reason) ? 'AMBIGUOUS' : 'BLOCKED';
        }
        result.push(item);
      }
    }
    const summary = { total: result.length, VERIFIED: 0, MISSING: 0, AMBIGUOUS: 0, BLOCKED: 0, alreadyBound: 0, eligibleForApply: 0 };
    for (const item of result) { summary[item.status] += 1; summary.alreadyBound += Number(item.alreadyBound); summary.eligibleForApply += Number(item.eligibleForApply); }
    const report = { version: 1, mode: 'DRY_RUN', target, namespaces: namespaces.map((n) => n.namespace), summary, files: result };
    return { ...report, approvalDigest: reportDigest(report) };
  };
  const apply = async (pool, { report, approvalDigest, actorUserId, confirmation, target }) => {
    if (confirmation !== 'APPLY_REVIEWED_FILE_BINDINGS' || !actorUserId || approvalDigest !== report.approvalDigest
      || reportDigest(report) !== approvalDigest || report.version !== 1 || report.mode !== 'DRY_RUN'
      || report.databaseEvidence?.unchanged !== true
      || JSON.stringify(report.target) !== JSON.stringify(target)
      || JSON.stringify(report.namespaces) !== JSON.stringify(namespaces.map((n) => n.namespace))) {
      throw pending('RECONCILIATION_APPROVAL_REQUIRED');
    }
    const groups = new Map();
    for (const item of report.files.filter((f) => f.status === 'VERIFIED')) {
      const key = JSON.stringify([item.projectId, item.documentId]);
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key).push(item);
    }
    const outcomes = [];
    for (const group of groups.values()) {
      const scope = { projectId: group[0].projectId, documentId: group[0].documentId };
      const c = await pool.getConnection();
      let committing = false;
      try {
        await c.beginTransaction();
        // Holding the universal gate excludes admission/reservation and settlement until commit.
        const gate = await coordination.lockGate(c, scope);
        if (gate.gate_state !== 'OPEN' || gate.delete_operation_id) throw pending('DOCUMENT_DELETION_IN_PROGRESS');
        const active = await rows(c, `SELECT id FROM document_writer_operations WHERE project_id=? AND document_id=?
          AND (lifecycle_state <> 'SETTLED' OR completion_evidence IS NULL OR db_outcome NOT IN ('NOT_STARTED','COMMITTED','ROLLED_BACK'))`, [scope.projectId, scope.documentId]);
        const io = await rows(c, `SELECT s.id FROM document_storage_io_steps s JOIN document_writer_operations w ON w.id=s.writer_id
          WHERE w.project_id=? AND w.document_id=? AND s.state <> 'SUCCEEDED'`, [scope.projectId, scope.documentId]);
        if (active.length || io.length) throw pending('WRITER_NOT_SETTLED');
        if ((await rows(c, 'SELECT id FROM document_delete_operations WHERE project_id=? AND document_id=?', [scope.projectId, scope.documentId])).length) {
          throw pending('DELETE_OPERATION_EXISTS');
        }
        const [actor] = await rows(c, `SELECT u.id,u.full_name,u.department_name_snapshot FROM users u
          JOIN project_memberships m ON m.user_id=u.id JOIN projects p ON p.id=m.project_id
          WHERE u.id=? AND u.status='Active' AND m.project_id=? AND m.status='Active'
          AND m.official_role='Admin' AND p.status='Active' FOR UPDATE`, [actorUserId, scope.projectId]);
        if (!actor) throw pending('BINDING_ADMIN_REQUIRED');
        const inventory = await repository.inventory(c, { project_id: scope.projectId, document_id: scope.documentId }, { forBinding: true });
        const ownedIds = new Set(inventory.files.map((file) => file.file_id));
        const manifests = await rows(c, 'SELECT file_reference AS file_id, ownership_evidence AS evidence FROM document_delete_file_manifest');
        if (manifests.some((item) => ownedIds.has(item.file_id)
          || (parse(item.evidence).fileIds || []).some((id) => ownedIds.has(id)))) throw pending('MANIFEST_ALREADY_FINALIZED');
        const changed = [];
        // Verify the entire group before the first binding write.
        const verified = [];
        for (const item of group) {
          const file = inventory.files.find((f) => f.file_id === item.fileId);
          if (!file || item.inventoryFingerprint !== inventoryFingerprint(inventory)) throw pending('RECONCILIATION_EVIDENCE_CHANGED');
          const binding = inventory.bindings.find((b) => b.file_id === item.fileId);
          const observed = await inspect(file, binding);
          if (item.fingerprint !== digest(JSON.stringify({ file, inventory: item.inventoryFingerprint, ...observed }))) throw pending('RECONCILIATION_EVIDENCE_CHANGED');
          if (sameProof(binding, observed.namespace, file.storage_key, observed.proof)) continue;
          if (binding && parse(binding.evidence).source !== 'UPLOAD_ADAPTER_SNAPSHOT') throw pending('FILE_PROVENANCE_CONFLICT');
          verified.push({ file, binding, ...observed });
        }
        for (const value of verified) {
          const entry = namespaces.find((n) => n.namespace.id === value.namespace.id);
          if (JSON.stringify(await verifyFile(entry.storage, value.namespace, value.file)) !== JSON.stringify(value.proof)) {
            throw pending('RECONCILIATION_EVIDENCE_CHANGED');
          }
          if (!value.binding) await bindNewFile(c, value.file.file_id, value.file.storage_key, value.namespace);
          const evidence = { source: 'OWNER_REVIEWED_STORAGE_INVENTORY', version: 1, recordId: approvalDigest,
            actorUserId, projectId: scope.projectId, documentId: scope.documentId, ...value.proof };
          const [write] = await c.execute(`UPDATE stored_file_namespace_bindings SET evidence=?
            WHERE file_id=? AND namespace_id=? AND storage_key_snapshot=?`,
          [JSON.stringify(evidence), value.file.file_id, value.namespace.id, value.file.storage_key]);
          if (write.affectedRows !== 1) throw pending('FILE_PROVENANCE_CONFLICT');
          changed.push(value.file.file_id);
        }
        if (changed.length) {
          await c.execute(`INSERT INTO audit_trail (id,identity_key,project_id,actor_user_id,actor_name,department,
            official_role,action,business_event,detail,resource_type,resource_id,reference,metadata,occurred_at)
            VALUES (?,?,?,?,?,?,'Admin','File Provenance Reconciled','Legacy File Reconciliation',
            'Namespace binding verified and recorded.','Document',?,?,?,UTC_TIMESTAMP(3))`,
          [randomUUID(), `file-reconciliation:${digest(JSON.stringify([approvalDigest, scope]))}`, scope.projectId,
            actor.id, actor.full_name, actor.department_name_snapshot, scope.documentId, inventory.document.document_number,
            JSON.stringify({ approvalDigest, fileIds: changed })]);
        }
        committing = true;
        await c.commit();
        outcomes.push({ ...scope, status: changed.length ? 'BOUND' : 'ALREADY_BOUND', files: changed });
      } catch (error) {
        await c.rollback().catch(() => {});
        // Stop, retain committed document groups, and require a fresh inspection on resume.
        error.completedDocuments = outcomes;
        if (committing) error.uncertainDocument = scope;
        throw error;
      } finally { c.release(); }
    }
    return outcomes;
  };
  return Object.freeze({ dryRun, apply });
};

module.exports = { createReconciler, reportDigest };
