const { digest, pending, sameNamespace, isCancelledDelete } = require('../utils/storageNamespace');
const { assertNamespace, verifyFile } = require('./fileProvenance.service');
const { createRepository } = require('../repositories/documentDelete.repository');
const { createFolderPlan } = require('./documentFolderCleanup.service');
const { SCOPES } = require('./historicalProvenanceRecovery.service');

const canonical = (value) => Array.isArray(value) ? value.map(canonical)
  : value && typeof value === 'object' ? Object.fromEntries(Object.keys(value).sort().map(k => [k, canonical(value[k])])) : value;
const equal = (a, b) => JSON.stringify(canonical(a)) === JSON.stringify(canonical(b));
const parse = (v) => typeof v === 'string' ? JSON.parse(v) : v;
const rows = async (c, sql, args = []) => (await c.execute(sql, args))[0];
const orderedManifest = (items) => [...items].sort((a, b) => JSON.stringify([a.namespace.id, a.key]).localeCompare(JSON.stringify([b.namespace.id, b.key])));
const reportDigest = ({ approvalDigest, ...v }) => digest(JSON.stringify(v));
const scopes = SCOPES.map(({ files, status, ...s }) => Object.freeze({ ...s, expectedFiles: s.documentNumber === 'PID-EDMS-0001' ? 4 : 3 }));
const selectScope = (operationIds, documentIds) => {
  const matches = (actual, expected) => Array.isArray(actual) && actual.length === expected.length
    && new Set(actual).size === actual.length && equal([...actual].sort(), [...expected].sort());
  if (!matches(operationIds, scopes.map(s => s.operationId)) || !matches(documentIds, scopes.map(s => s.documentId))) throw pending('RESUME_SCOPE_INVALID');
  return scopes;
};
const assertTarget = (target, namespace) => {
  assertNamespace(namespace);
  if (target.environment !== 'development' || target.host !== '127.0.0.1' || target.connectionPort !== 3306
    || target.name !== 'edms_smpv_dev' || !/^10\.4\.32-MariaDB/.test(target.version || '')
    || namespace.descriptor.provider !== 'local') throw pending('RESUME_TARGET_INVALID');
};

const createPendingResume = ({ pool, coordination, storage, namespace, actorUserId, operationIds, documentIds,
  repository = createRepository({ coordination, storage }), engineFactory }) => {
  const selected = selectScope(operationIds, documentIds);
  if (String(actorUserId) !== '1') throw pending('RESUME_ORIGINAL_ACTOR_REQUIRED');
  const read = async (callback) => {
    const c = await pool.getConnection();
    try {
      await c.query('START TRANSACTION READ ONLY');
      const ro = { execute: (sql, args = []) => {
        if (!/^\s*SELECT\b/i.test(sql) || /FOR UPDATE|LOCK IN SHARE MODE|GET_LOCK\(/i.test(sql)) throw pending('RESUME_READ_ONLY_REQUIRED');
        return c.execute(sql, args);
      } };
      const result = await callback(ro); await c.commit(); return result;
    } finally { await c.rollback().catch(() => {}); c.release(); }
  };
  const operationState = async (c, scope, claimed) => {
    const [op] = await rows(c, 'SELECT * FROM document_delete_operations WHERE id=?', [scope.operationId]);
    if (isCancelledDelete(op)) throw pending('DELETE_RESERVATION_CANCELLED');
    if (!op || op.document_id !== scope.documentId || op.project_id !== scope.projectId
      || op.document_number_snapshot !== scope.documentNumber || String(op.initiated_by_user_id) !== '1'
      || op.status !== 'QUIESCENCE_CONFIRMED') throw pending('RESUME_OPERATION_MISMATCH');
    const [gate] = await rows(c, 'SELECT * FROM document_admission_coordinators WHERE project_id=? AND document_id=?', [scope.projectId, scope.documentId]);
    if (!gate || gate.gate_state !== 'CLOSED' || gate.delete_operation_id !== op.id) throw pending('RESUME_GATE_MISMATCH');
    const [project] = await rows(c, 'SELECT id,project_code,status FROM projects WHERE id=?', [scope.projectId]);
    if (project?.project_code !== scope.projectCode || project.status !== 'Active') throw pending('RESUME_PROJECT_MISMATCH');
    const [actor] = await rows(c, `SELECT u.id,u.full_name,u.department_name_snapshot FROM users u JOIN project_memberships m ON m.user_id=u.id
      WHERE u.id=? AND u.status='Active' AND m.project_id=? AND m.status='Active' AND m.official_role='Admin'`, [actorUserId, scope.projectId]);
    if (!actor?.full_name) throw pending('RESUME_ADMIN_REQUIRED');
    const writers = await rows(c, 'SELECT * FROM document_writer_operations WHERE project_id=? AND document_id=? ORDER BY id', [scope.projectId, scope.documentId]);
    const io = await rows(c, `SELECT s.* FROM document_storage_io_steps s JOIN document_writer_operations w ON w.id=s.writer_id
      WHERE w.project_id=? AND w.document_id=? ORDER BY s.id`, [scope.projectId, scope.documentId]);
    if (writers.some(w => w.lifecycle_state !== 'SETTLED' || !['COMMITTED','ROLLED_BACK','NOT_STARTED'].includes(w.db_outcome)
      || !w.completion_evidence || parse(w.completion_evidence).scopeClosed !== true || parse(w.completion_evidence).uncertain !== false
      || parse(w.completion_evidence).unresolvedIo !== 0) || io.some(s => s.state !== 'SUCCEEDED')) throw pending('RESUME_WRITER_UNSETTLED');
    const [lock] = await rows(c, 'SELECT IS_USED_LOCK(?) owner', [`edms-del:${digest(op.id).slice(0, 48)}`]);
    if (claimed ? lock.owner === null : lock.owner !== null) throw pending('RESUME_LOCK_MISMATCH');
    return { operation: op, gate, project, actor, writers, io };
  };
  const physical = async (inventory) => {
    const proofs = [];
    for (const file of inventory.files) {
      const entry = inventory.manifest.find(m => m.fileIds.includes(file.file_id));
      if (!entry || !sameNamespace(entry.namespace, namespace)) throw pending('NAMESPACE_MISMATCH');
      const proof = await verifyFile(storage, namespace, file);
      if (!equal(proof.localIdentity, entry.localIdentity)) throw pending('RESUME_IDENTITY_MISMATCH');
      proofs.push({ fileId: file.file_id, key: file.storage_key, ...proof });
    }
    return proofs;
  };
  const inspect = async (c, scope, claimed = false) => {
    const state = await operationState(c, scope, claimed);
    if ((await rows(c, 'SELECT operation_id FROM document_delete_executions WHERE operation_id=?', [scope.operationId])).length) throw pending('RESUME_EXECUTION_EXISTS');
    const manifests = await rows(c, 'SELECT * FROM document_delete_file_manifest');
    if (manifests.some(m => m.delete_operation_id === scope.operationId)) throw pending('RESUME_MANIFEST_EXISTS');
    if ((await rows(c, `SELECT a.manifest_id FROM document_delete_attempts a JOIN document_delete_file_manifest m ON m.id=a.manifest_id
      WHERE m.delete_operation_id=?`, [scope.operationId])).length) throw pending('RESUME_ATTEMPT_EXISTS');
    const inventory = await repository.inventory(c, state.operation);
    if (inventory.document.document_number !== scope.documentNumber || inventory.files.length !== scope.expectedFiles
      || inventory.document.lifecycle_status !== 'Active') throw pending('RESUME_INVENTORY_MISMATCH');
    const ids = new Set(inventory.files.map(f => f.file_id)), keys = new Set(inventory.files.map(f => f.storage_key.toLowerCase()));
    if (manifests.some(m => ids.has(m.file_reference) || (parse(m.ownership_evidence).fileIds || []).some(id => ids.has(id))
      || keys.has(m.exact_storage_key.toLowerCase()))) throw pending('RESUME_FOREIGN_MANIFEST');
    const proofs = await physical(inventory), folderPlan = await createFolderPlan(inventory, storage);
    if (folderPlan.plans.length !== 1 || folderPlan.plans[0].prefix !== `projects/${scope.projectCode}/documents/${scope.documentNumber}/`
      || !folderPlan.plans[0].observed.exists || folderPlan.plans[0].observed.objects.length !== inventory.manifest.length) throw pending('RESUME_FOLDER_MISMATCH');
    return { scope, ...state, inventory, proofs, proposedManifest: inventory.manifest, folderPlan, eligible: true };
  };
  const dryRun = async ({ target, backups }) => {
    assertTarget(target, namespace);
    if (!backups?.verified) throw pending('RESUME_BACKUP_REQUIRED');
    const items = [];
    await read(async c => {
      for (const scope of selected) {
        try { items.push(await inspect(c, scope)); }
        catch (e) { items.push({ scope, eligible: false, reason: e.code || 'RESUME_INSPECTION_FAILED' }); }
      }
    });
    const report = { version: 1, mode: 'PENDING_DELETE_RESUME_DRY_RUN', target, namespace, actorUserId: '1', backups, items,
      risks: ['Penghapusan file bertahap, bukan transaksi filesystem all-or-nothing.',
        'Outcome UNKNOWN/IN_FLIGHT atau COMMIT tidak pasti memerlukan assessment read-only; tidak ada retry otomatis.',
        'Backup diverifikasi non-destruktif; restore test belum dilakukan.',
        'Jalur ini hanya initial resume tanpa execution/manifest/attempt; kelanjutan setelah interupsi memerlukan keputusan baru.'],
      checkpoint: 'ENGINE_AFTER_MANIFEST_AND_GUARDED_STORAGE', verdict: items.every(i => i.eligible) ? 'PREFLIGHT_PASS' : 'BLOCKED' };
    return { ...report, ...(report.verdict === 'PREFLIGHT_PASS' ? { approvalDigest: reportDigest(report) } : {}) };
  };
  const apply = async ({ report, approvalDigest, confirmation, target, backups }) => {
    assertTarget(target, namespace);
    if (confirmation !== 'RESUME_REVIEWED_PENDING_DELETES' || reportDigest(report) !== approvalDigest || report.approvalDigest !== approvalDigest
      || !/^[a-f0-9]{64}$/.test(approvalDigest || '') || report.version !== 1 || report.mode !== 'PENDING_DELETE_RESUME_DRY_RUN'
      || report.verdict !== 'PREFLIGHT_PASS' || report.actorUserId !== '1' || !equal(report.target, target) || !equal(report.namespace, namespace)
      || !backups?.verified || !equal(report.backups, backups) || report.checkpoint !== 'ENGINE_AFTER_MANIFEST_AND_GUARDED_STORAGE'
      || report.databaseEvidence?.unchanged !== true || report.filesystemEvidence?.unchanged !== true
      || !equal(report.items.map(i => i.scope), selected) || report.items.some(i => !i.eligible)) throw pending('RESUME_APPROVAL_REQUIRED');
    // Validate both complete inventories before the first mutating engine invocation.
    await read(async c => { for (const item of report.items) if (!equal(await inspect(c, item.scope), item)) throw pending('RESUME_EVIDENCE_CHANGED'); });
    const outcomes = [];
    for (const item of report.items) {
      const state = { before: false, manifest: false, folder: false, deleted: new Set() };
      const guarded = {
        captureNamespace: () => storage.captureNamespace(),
        inspectDocumentFolders: (...args) => storage.inspectDocumentFolders(...args),
        deleteOwnedExact: async (key, ns, evidence) => {
          const expected = item.proposedManifest.find(m => m.key === key);
          if (!state.manifest || !expected || !sameNamespace(ns, namespace) || !equal(evidence, expected)
            || state.deleted.has(key)) throw pending('RESUME_CHECKPOINT_REQUIRED');
          const result = await storage.deleteOwnedExact(key, ns, evidence);
          if (result?.terminal === true && result.outcome === 'DELETE_ACKNOWLEDGED') state.deleted.add(key);
          return result;
        },
        cleanupDocumentFolders: (plan) => {
          if (!state.folder || !equal(plan, item.folderPlan.plans[0])) throw pending('RESUME_CHECKPOINT_REQUIRED');
          return storage.cleanupDocumentFolders(plan);
        },
      };
      const hooks = {
        beforeManifest: () => read(async c => {
          if (!equal(await inspect(c, item.scope, true), item)) throw pending('RESUME_EVIDENCE_CHANGED');
          state.before = true;
        }),
        afterManifest: () => read(async c => {
          if (!state.before) throw pending('RESUME_CHECKPOINT_REQUIRED');
          const current = await operationState(c, item.scope, true);
          if (!equal(current, { operation: item.operation, gate: item.gate, project: item.project, actor: item.actor, writers: item.writers, io: item.io })) throw pending('RESUME_EVIDENCE_CHANGED');
          const [execution] = await rows(c, 'SELECT * FROM document_delete_executions WHERE operation_id=?', [item.scope.operationId]);
          if (execution?.phase !== 'MANIFEST_FINALIZED') throw pending('RESUME_MANIFEST_MISMATCH');
          const saved = parse(execution.inventory), manifest = await repository.readManifest(c, execution);
          if (!equal(saved.inventory, item.inventory) || !equal(saved.actor, item.actor) || !equal(saved.folderCleanup, item.folderPlan)
            || !equal(orderedManifest(manifest.map(m => parse(m.ownership_evidence))), orderedManifest(item.proposedManifest))
            || manifest.some(m => m.exact_storage_key !== parse(m.ownership_evidence).key
              || m.provider !== parse(m.ownership_evidence).namespace.descriptor.provider
              || m.file_reference !== parse(m.ownership_evidence).fileIds[0])
            || manifest.some(m => m.cleanup_state !== 'PENDING')) throw pending('RESUME_MANIFEST_MISMATCH');
          if (!equal(await repository.inventory(c, current.operation), item.inventory)
            || !equal(await physical(item.inventory), item.proofs)
            || !equal(await createFolderPlan(item.inventory, storage), item.folderPlan)) throw pending('RESUME_EVIDENCE_CHANGED');
          state.manifest = true;
        }),
        beforeFolderCleanup: () => read(async c => {
          if (!state.manifest || state.deleted.size !== item.proposedManifest.length) throw pending('RESUME_CHECKPOINT_REQUIRED');
          const [execution] = await rows(c, 'SELECT * FROM document_delete_executions WHERE operation_id=?', [item.scope.operationId]);
          const saved = execution && parse(execution.inventory);
          if (execution?.phase !== 'MANIFEST_FINALIZED' || saved.folderCleanup?.state !== 'RUNNING'
            || !equal(saved.folderCleanup.plans, item.folderPlan.plans)) throw pending('RESUME_FOLDER_MISMATCH');
          const manifest = await repository.readManifest(c, execution);
          for (const m of manifest) {
            const [attempt] = await rows(c, 'SELECT * FROM document_delete_attempts WHERE manifest_id=?', [m.id]);
            if (m.cleanup_state !== 'DELETED' || attempt?.state !== 'SUCCEEDED') throw pending('RESUME_STORAGE_UNRESOLVED');
          }
          const plan = item.folderPlan.plans[0], actual = await storage.inspectDocumentFolders(plan.prefix, namespace);
          if (actual.rootIdentity !== plan.rootIdentity || actual.objects.length
            || actual.directories.some(d => !plan.observed.directories.some(p => p.key === d.key && p.identity === d.identity))) throw pending('RESUME_FOLDER_MISMATCH');
          state.folder = true;
        }),
      };
      try {
        const factory = engineFactory || require('./documentDelete.service').createDeleteEngine;
        const engine = factory({ pool, coordination, storage: guarded, hooks, repository });
        const result = await engine.resume(item.scope.operationId);
        outcomes.push({ operationId: item.scope.operationId, documentId: item.scope.documentId, ...result });
        if (result.status !== 'COMPLETED') throw pending('RESUME_NOT_COMPLETED');
        if (!state.manifest || !state.folder || state.deleted.size !== item.proposedManifest.length) throw pending('RESUME_CHECKPOINT_REQUIRED');
        if (result.notification?.status !== 'DELIVERED') throw pending('RESUME_NOTIFICATION_PENDING');
      } catch (e) { e.outcomes = outcomes; throw e; }
    }
    return outcomes;
  };
  return Object.freeze({ dryRun, apply });
};

module.exports = { createPendingResume, reportDigest, selectScope, assertTarget };
