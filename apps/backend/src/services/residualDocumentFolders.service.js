const { randomUUID } = require('node:crypto');
const { createRepository } = require('../repositories/documentDelete.repository');
const { deriveFolderTargets } = require('../utils/documentFolder');
const { digest, sameNamespace, pending } = require('../utils/storageNamespace');

const rows = async (c, sql, args = []) => (await c.execute(sql, args))[0];
const decode = (value) => typeof value === 'string' ? JSON.parse(value) : value;
const reportDigest = ({ approvalDigest, ...value }) => digest(JSON.stringify(value));

const createResidualCleanup = ({ namespaces, coordination }) => {
  const repository = createRepository({ coordination });
  const evidence = async (c, operationId) => {
    const [op] = await rows(c, 'SELECT * FROM document_delete_operations WHERE id=?', [operationId]);
    const [execution] = await rows(c, 'SELECT * FROM document_delete_executions WHERE operation_id=?', [operationId]);
    if (!op || execution?.phase !== 'COMPLETED' || op.status !== 'QUIESCENCE_CONFIRMED') throw pending('FOLDER_COMPLETION_UNVERIFIED');
    const snapshot = decode(execution.inventory); const completion = decode(execution.completion_snapshot);
    if (snapshot.inventory.document.id !== op.document_id || snapshot.inventory.document.project_id !== op.project_id
      || completion.documentId !== op.document_id || completion.projectId !== op.project_id
      || completion.operationId !== op.id || completion.documentNumber !== op.document_number_snapshot) throw pending('FOLDER_OWNERSHIP_AMBIGUOUS');
    const audit = await rows(c, `SELECT id FROM audit_trail WHERE identity_key=? AND project_id=?
      AND resource_id=? AND action='Delete' AND business_event='Document Deleted'`, [`permanent-delete:${op.id}`, op.project_id, op.document_id]);
    if (audit.length !== 1) throw pending('FOLDER_AUDIT_UNVERIFIED');
    const manifest = await repository.readManifest(c, execution);
    if (!manifest.length || manifest.some((m) => m.cleanup_state !== 'DELETED')) throw pending('STORAGE_NOT_TERMINAL');
    const canonical = (items) => JSON.stringify(items.map((item) => JSON.stringify(item)).sort());
    if (canonical(manifest.map((m) => decode(m.ownership_evidence))) !== canonical(snapshot.inventory.manifest || [])) {
      throw pending('FOLDER_OWNERSHIP_AMBIGUOUS');
    }
    for (const entry of manifest) {
      const [attempt] = await rows(c, 'SELECT state FROM document_delete_attempts WHERE manifest_id=?', [entry.id]);
      if (attempt?.state !== 'SUCCEEDED') throw pending('STORAGE_NOT_TERMINAL');
    }
    const targets = deriveFolderTargets(snapshot.inventory);
    const fileRows = await rows(c, 'SELECT file_id,storage_key FROM stored_files');
    for (const target of targets) {
      const [project] = await rows(c, 'SELECT project_code FROM projects WHERE id=?', [op.project_id]);
      if (project?.project_code !== target.prefix.split('/')[1]) throw pending('FOLDER_OWNERSHIP_AMBIGUOUS');
      const live = await rows(c, 'SELECT id FROM engineering_documents WHERE project_id=? AND document_number=?',
        [op.project_id, op.document_number_snapshot]);
      const local = target.namespace.descriptor.provider === 'local';
      if (live.length || fileRows.some((f) => (local ? f.storage_key.toLowerCase() : f.storage_key)
        .startsWith(local ? target.prefix.toLowerCase() : target.prefix))) throw pending('FOLDER_LIVE_REFERENCE');
      const others = await rows(c, `SELECT id FROM document_delete_operations WHERE project_id=? AND document_number_snapshot=? AND id<>?`,
        [op.project_id, op.document_number_snapshot, op.id]);
      if (others.length) throw pending('FOLDER_OWNERSHIP_AMBIGUOUS');
    }
    return { op, execution, snapshot, targets, fingerprint: digest(JSON.stringify({ op: { id: op.id, projectId: op.project_id,
      documentId: op.document_id, number: op.document_number_snapshot }, manifest: manifest.map((m) => [m.id, m.ownership_evidence]),
    completedAt: completion.completedAt, auditIds: audit.map((a) => a.id) })) };
  };
  const inspect = async (target) => {
    const entry = namespaces.find((n) => sameNamespace(n.namespace, target.namespace));
    if (!entry) throw pending('NAMESPACE_MISMATCH');
    const observed = await entry.storage.inspectDocumentFolders(target.prefix, target.namespace);
    if (target.namespace.descriptor.provider === 'local') {
      if (!target.rootIdentity || observed.rootIdentity !== target.rootIdentity) throw pending('FOLDER_ROOT_IDENTITY_MISMATCH');
    }
    return observed;
  };
  const dryRun = async (c, target) => {
    const operations = await rows(c, "SELECT operation_id FROM document_delete_executions WHERE phase='COMPLETED' ORDER BY operation_id");
    const items = [];
    for (const { operation_id: id } of operations) {
      try {
        const found = await evidence(c, id);
        for (const folder of found.targets) {
          const observed = await inspect(folder);
          if (folder.namespace.descriptor.provider === 'local') {
            const completedAt = Date.parse(decode(found.execution.completion_snapshot).completedAt);
            if (!Number.isFinite(completedAt) || observed.directories.some((d) => {
              const created = d.identity.split(':')[2];
              return !/^\d+$/.test(created || '') || Number(BigInt(created) / 10000n - 11644473600000n) > completedAt;
            })) throw pending('FOLDER_RECREATED_AFTER_COMPLETION');
          }
          const status = observed.objects.length ? 'BLOCKED_NONEMPTY' : observed.exists ? 'ELIGIBLE_EMPTY_TREE' : 'MISSING_OR_ALREADY_CLEAN';
          items.push({ operationId: id, projectId: found.op.project_id, documentId: found.op.document_id,
            documentNumber: found.op.document_number_snapshot, ...folder, observed, status,
            evidenceFingerprint: found.fingerprint,
            ...(observed.objects.length ? { reason: 'UNKNOWN_OBJECTS_OR_UNVERIFIED_MARKERS' } : {}) });
        }
      } catch (error) { items.push({ operationId: id, status: 'AMBIGUOUS', reason: error.code || 'FOLDER_EVIDENCE_UNVERIFIED' }); }
    }
    const report = { version: 1, target, mode: 'RESIDUAL_DRY_RUN', items };
    return { ...report, approvalDigest: reportDigest(report) };
  };
  const apply = async (pool, { report, approvalDigest, confirmation, actorUserId, target }) => {
    if (report.mode !== 'RESIDUAL_DRY_RUN' || report.version !== 1 || reportDigest(report) !== approvalDigest
      || report.approvalDigest !== approvalDigest || report.databaseEvidence?.unchanged !== true
      || JSON.stringify(report.target) !== JSON.stringify(target) || confirmation !== 'CLEAN_REVIEWED_EMPTY_DOCUMENT_FOLDERS' || !actorUserId) {
      throw pending('RESIDUAL_APPROVAL_REQUIRED');
    }
    const results = [];
    for (const item of report.items.filter((r) => r.status === 'ELIGIBLE_EMPTY_TREE')) {
      const c = await pool.getConnection(); const lock = `edms-del:${digest(item.operationId).slice(0, 48)}`; let claimed = false;
      const fenced = async () => {
        const gate = await coordination.lockGate(c, { projectId: item.projectId, documentId: item.documentId });
        if (gate.gate_state !== 'CLOSED' || gate.delete_operation_id !== item.operationId) throw pending('DELETE_GATE_INVALID');
        await c.execute('SELECT id FROM projects WHERE id=? FOR UPDATE', [item.projectId]);
        const active = await rows(c, `SELECT id FROM document_writer_operations WHERE project_id=? AND document_id=?
          AND (lifecycle_state <> 'SETTLED' OR completion_evidence IS NULL OR db_outcome NOT IN ('NOT_STARTED','COMMITTED','ROLLED_BACK'))`, [item.projectId, item.documentId]);
        if (active.length) throw pending('WRITER_NOT_SETTLED');
        const io = await rows(c, `SELECT s.id FROM document_storage_io_steps s JOIN document_writer_operations w ON w.id=s.writer_id
          WHERE w.project_id=? AND w.document_id=? AND s.state <> 'SUCCEEDED'`, [item.projectId, item.documentId]);
        if (io.length) throw pending('WRITER_NOT_SETTLED');
        const [actor] = await rows(c, `SELECT u.id,u.full_name,u.department_name_snapshot FROM users u JOIN project_memberships m ON m.user_id=u.id
          WHERE u.id=? AND u.status='Active' AND m.project_id=? AND m.status='Active' AND m.official_role='Admin' FOR UPDATE`, [actorUserId, item.projectId]);
        if (!actor) throw pending('BINDING_ADMIN_REQUIRED');
        await c.execute('SELECT operation_id FROM document_delete_executions WHERE operation_id=? FOR UPDATE', [item.operationId]);
        const found = await evidence(c, item.operationId);
        if (found.fingerprint !== item.evidenceFingerprint || !found.targets.some((t) => t.prefix === item.prefix && sameNamespace(t.namespace, item.namespace))) {
          throw pending('FOLDER_EVIDENCE_CHANGED');
        }
        return { found, actor };
      };
      try {
        const [[claim]] = await c.execute('SELECT GET_LOCK(?,0) AS acquired', [lock]);
        if (Number(claim.acquired) !== 1) throw pending('DELETE_WORKER_BUSY');
        claimed = true;
        await c.beginTransaction(); let { found } = await fenced();
        const current = await inspect(item);
        if (current.objects.length || (item.rootIdentity && (current.rootIdentity !== item.rootIdentity
          || current.directories.some((d) => !item.observed.directories.some((old) => old.key === d.key && old.identity === d.identity))))) {
          throw pending('FOLDER_EVIDENCE_CHANGED');
        }
        const saved = found.snapshot;
        const folderKey = digest(JSON.stringify([item.namespace.id, item.prefix]));
        const intent = { approvalDigest, state: 'RUNNING', prefix: item.prefix, proof: item.observed };
        saved.residualFolderCleanup = { ...saved.residualFolderCleanup, [folderKey]: intent };
        await c.execute("UPDATE document_delete_executions SET inventory=? WHERE operation_id=? AND phase='COMPLETED'", [JSON.stringify(saved), item.operationId]);
        await c.commit();
        await c.beginTransaction(); const next = await fenced(); found = next.found;
        const entry = namespaces.find((n) => sameNamespace(n.namespace, item.namespace));
        if (!entry) throw pending('NAMESPACE_MISMATCH');
        await entry.storage.cleanupDocumentFolders(item);
        const observed = await inspect(item);
        if (observed.exists || observed.objects.length) throw pending('FOLDER_CLEANUP_INCOMPLETE');
        found.snapshot.residualFolderCleanup = { ...found.snapshot.residualFolderCleanup, [folderKey]: { ...intent, state: 'CONFIRMED' } };
        await c.execute("UPDATE document_delete_executions SET inventory=? WHERE operation_id=? AND phase='COMPLETED'", [JSON.stringify(found.snapshot), item.operationId]);
        const identity = `residual-folders:${digest(JSON.stringify([item.operationId, item.namespace.id, item.prefix]))}`;
        const prior = await rows(c, 'SELECT id FROM audit_trail WHERE identity_key=?', [identity]);
        if (!prior.length) await c.execute(`INSERT INTO audit_trail (id,identity_key,project_id,actor_user_id,actor_name,department,official_role,
          action,business_event,detail,resource_type,resource_id,reference,metadata,occurred_at)
          VALUES (?,?,?,?,?,?,'Admin','Document Folder Cleanup','Residual Folder Cleanup','Verified empty directories removed.',
          'Document',?,?,?,UTC_TIMESTAMP(3))`, [randomUUID(), identity, item.projectId, next.actor.id, next.actor.full_name,
          next.actor.department_name_snapshot, item.documentId, item.documentNumber, JSON.stringify({ operationId: item.operationId, approvalDigest })]);
        await c.commit(); results.push({ operationId: item.operationId, prefix: item.prefix, status: 'CLEAN' });
      } catch (error) { await c.rollback().catch(() => {}); error.completedFolders = results; throw error; }
      finally { if (claimed) await c.execute('SELECT RELEASE_LOCK(?)', [lock]).catch(() => {}); c.release(); }
    }
    return results;
  };
  return { dryRun, apply };
};

module.exports = { createResidualCleanup, reportDigest };
