const { randomUUID } = require('node:crypto');
const { digest, pending } = require('../utils/storageNamespace');
const { verifyFile, assertNamespace } = require('./fileProvenance.service');
const { createRepository } = require('../repositories/documentDelete.repository');

const STAGING_TARGETS = Object.freeze([
  { documentNumber: 'COBA-1', documentId: 'DOC-PID-5f6ea1c2-3f53-432d-a0e5-f738be2911b0', operationId: 'd1b06c71-ccf1-4d85-abbb-9f7f61a5d197' },
  { documentNumber: 'PROJECT-1', documentId: 'DOC-PID-2fe931bb-dac7-4c90-afa9-3addf4351e1f', operationId: '86135cc8-923b-451a-abb3-4a21729cba4c' },
  { documentNumber: 'PROJECT-2', documentId: 'DOC-PID-e2823245-4e10-47d4-bc91-14254f05cd9f', operationId: '012e8f62-a55a-4b2f-bbbb-f7f95e95bf0b' },
].map(item => Object.freeze({ ...item, projectId: 'PRJ-5cd0a5a3-3ce6-4cf2-b297-73e6ee9e520c' })));
const parse = value => typeof value === 'string' ? JSON.parse(value) : value;
const fingerprint = ({ approvalDigest, ...report }) => digest(JSON.stringify(report));

// Internal recovery only. No route, CLI, runtime config, credentials or startup import.
const createRecovery = ({ pool, storage, namespace, targets, target, repository = createRepository({}), now = Date.now }) => {
  assertNamespace(namespace);
  if (target?.railwayEnvironment !== 'staging' || !target.database || !target.serverUuid
    || !target.serviceId || namespace.descriptor.provider !== 'r2' || target.namespaceId !== namespace.id
    || !Array.isArray(targets) || targets.length !== 3
    || STAGING_TARGETS.some(expected => targets.filter(item => ['documentNumber', 'projectId', 'documentId', 'operationId']
      .every(key => item[key] === expected[key])).length !== 1)
    || targets.some(item => !['projectId', 'documentId', 'operationId'].every(key =>
      typeof item[key] === 'string' && /^[A-Za-z0-9_-]{1,64}$/.test(item[key])))
    || new Set(targets.map(item => item.operationId)).size !== 3
    || new Set(targets.map(item => JSON.stringify([item.projectId, item.documentId]))).size !== 3) {
    throw pending('RECOVERY_EXACT_STAGING_TARGETS_REQUIRED');
  }
  target = Object.freeze({ ...target });
  const ordered = targets.map(item => Object.freeze({ ...item }))
    .sort((a, b) => JSON.stringify([a.projectId, a.documentId]).localeCompare(JSON.stringify([b.projectId, b.documentId])));
  const rows = async (c, sql, args = []) => (await c.execute(sql, args))[0];
  const session = async (callback, { write = false } = {}) => {
    const c = await pool.getConnection(); const locks = [];
    let started = false; let committing = false; let discard = false;
    try {
      const [identity] = await rows(c, 'SELECT DATABASE() AS db, @@server_uuid AS serverUuid');
      if (identity?.db !== target.database || identity?.serverUuid !== target.serverUuid) throw pending('RECOVERY_WRONG_DATABASE');
      for (const item of ordered) {
        const name = `edms-del:${digest(item.operationId).slice(0, 48)}`;
        if (Number((await rows(c, 'SELECT GET_LOCK(?,0) AS acquired', [name]))[0]?.acquired) !== 1) throw pending('RECOVERY_WORKER_BUSY');
        locks.push(name);
      }
      await c.beginTransaction(); started = true;
      const result = await callback(c);
      if (write) { committing = true; await c.commit(); }
      else {
        try { await c.rollback(); }
        catch (error) {
          discard = true; started = false;
          throw Object.assign(pending('RECOVERY_ROLLBACK_FAILED'), { cause: error });
        }
      }
      started = false;
      return result;
    } catch (error) {
      if (committing) {
        discard = true;
        throw Object.assign(pending('RECOVERY_COMMIT_OUTCOME_UNKNOWN'), { cause: error });
      }
      if (started) {
        try { await c.rollback(); started = false; }
        catch (rollbackError) {
          discard = true;
          throw Object.assign(pending('RECOVERY_ROLLBACK_FAILED'), { cause: error, rollbackError });
        }
      } else discard = true; // Acquisition ACK may be lost; never recycle a possibly locked connection.
      throw error;
    } finally {
      if (!discard) {
        for (const name of locks.reverse()) {
          try {
            if (Number((await rows(c, 'SELECT RELEASE_LOCK(?) AS released', [name]))[0]?.released) !== 1) discard = true;
          } catch { discard = true; }
        }
      }
      // Closing the mysql2 session also releases named locks. Uncertain sessions must not reenter the pool.
      if (discard) c.destroy(); else c.release();
    }
  };
  const inspect = async c => {
    const result = [];
    for (const item of ordered) {
      const scope = [item.projectId, item.documentId];
      const [gate] = await rows(c, 'SELECT * FROM document_admission_coordinators WHERE project_id=? AND document_id=? FOR UPDATE', scope);
      const [op] = await rows(c, 'SELECT * FROM document_delete_operations WHERE id=? FOR UPDATE', [item.operationId]);
      const [document] = await rows(c, 'SELECT * FROM engineering_documents WHERE id=? AND project_id=? FOR UPDATE', [item.documentId, item.projectId]);
      if (!gate || !op || !document || op.project_id !== item.projectId || op.document_id !== item.documentId
        || op.document_number_snapshot !== item.documentNumber || document.document_number !== item.documentNumber) throw pending('RECOVERY_TARGET_CHANGED');
      const execution = await rows(c, 'SELECT operation_id FROM document_delete_executions WHERE operation_id=?', [op.id]);
      const manifest = await rows(c, 'SELECT id FROM document_delete_file_manifest WHERE delete_operation_id=?', [op.id]);
      const attempts = await rows(c, `SELECT a.manifest_id FROM document_delete_attempts a JOIN document_delete_file_manifest m ON m.id=a.manifest_id WHERE m.delete_operation_id=?`, [op.id]);
      if (execution.length || manifest.length || attempts.length) throw pending('RECOVERY_SIDE_EFFECT_EVIDENCE_EXISTS');
      const previous = parse(op.pending_metadata || '{}').reservationRecovery;
      if (previous?.state === 'CANCELLED_BEFORE_IO') {
        if (gate.gate_state !== 'OPEN' || gate.delete_operation_id != null || previous.operationId !== op.id) throw pending('RECOVERY_GATE_CHANGED');
        result.push({ ...item, alreadyRecovered: true }); continue;
      }
      if (gate.gate_state !== 'CLOSED' || gate.delete_operation_id !== op.id || op.status !== 'QUIESCENCE_CONFIRMED') throw pending('RECOVERY_NOT_QUIESCENT');
      const writers = await rows(c, 'SELECT id FROM document_writer_operations WHERE project_id=? AND document_id=?', scope);
      const io = await rows(c, `SELECT s.id FROM document_storage_io_steps s JOIN document_writer_operations w ON w.id=s.writer_id WHERE w.project_id=? AND w.document_id=?`, scope);
      // Deliberately stricter than ordinary quiescence: incident recovery requires no prior writer/IO at all.
      if (writers.length || io.length) throw pending('RECOVERY_SIDE_EFFECT_EVIDENCE_EXISTS');
      const inventory = await repository.inventory(c, { project_id: item.projectId, document_id: item.documentId }, { forBinding: true });
      const [project] = await rows(c, 'SELECT project_code FROM projects WHERE id=?', [item.projectId]);
      if (!project?.project_code) throw pending('RECOVERY_PROJECT_UNVERIFIED');
      const prefix = `projects/${project.project_code}/documents/${item.documentNumber}/`;
      require('../utils/documentFolder').validateDocumentPrefix(prefix);
      if (!document.active_file_id || !inventory.files.some(file => file.file_id === document.active_file_id)) throw pending('RECOVERY_ACTIVE_FILE_REQUIRED');
      const files = [];
      for (const file of inventory.files) {
        if (!file.storage_key.startsWith(prefix)) throw pending('RECOVERY_FILE_SCOPE_MISMATCH');
        files.push({ fileId: file.file_id, key: file.storage_key, proof: await verifyFile(storage, namespace, file) });
      }
      result.push({ ...item, alreadyRecovered: false, generation: gate.generation,
        snapshotDigest: digest(JSON.stringify({ document, inventory, op })), files });
    }
    return result;
  };
  const prepare = async () => session(async c => {
    const report = { version: 1, target, namespaceId: namespace.id, preparedAt: now(), documents: await inspect(c) };
    return { ...report, approvalDigest: fingerprint(report) };
  });
  const apply = async ({ report, approvalDigest, confirmation, actorUserId, maintenanceConfirmed, backupConfirmed }) => {
    if (confirmation !== 'RECOVER_THREE_STAGING_RESERVATIONS' || !actorUserId || maintenanceConfirmed !== true
      || backupConfirmed !== true || !report || fingerprint(report) !== approvalDigest || report.approvalDigest !== approvalDigest
      || report.version !== 1 || JSON.stringify(report.target) !== JSON.stringify(target) || report.namespaceId !== namespace.id
      || !Number.isFinite(report.preparedAt) || now() < report.preparedAt || now() - report.preparedAt > 300000) throw pending('RECOVERY_APPROVAL_REQUIRED');
    return session(async c => {
      const current = await inspect(c);
      if (current.every(item => item.alreadyRecovered)) return { status: 'ALREADY_RECOVERED', documents: current };
      if (JSON.stringify(current) !== JSON.stringify(report.documents)) throw pending('RECOVERY_EVIDENCE_CHANGED');
      if (now() - report.preparedAt > 300000) throw pending('RECOVERY_APPROVAL_EXPIRED');
      for (const item of current.filter(value => !value.alreadyRecovered)) {
        const [actor] = await rows(c, `SELECT u.id,u.full_name,u.department_name_snapshot FROM users u JOIN project_memberships m ON m.user_id=u.id JOIN projects p ON p.id=m.project_id WHERE u.id=? AND m.project_id=? AND m.official_role='Admin' AND m.status='Active' AND u.status='Active' AND p.status='Active' FOR UPDATE`, [actorUserId, item.projectId]);
        if (!actor?.full_name) throw pending('RECOVERY_ADMIN_REQUIRED');
        const marker = { state: 'CANCELLED_BEFORE_IO', operationId: item.operationId, approvalDigest, actorUserId,
          recoveredAt: new Date(now()).toISOString(), snapshotDigest: item.snapshotDigest };
        const [saved] = await c.execute(`UPDATE document_delete_operations SET pending_metadata=JSON_SET(COALESCE(pending_metadata,'{}'),'$.reservationRecovery',CAST(? AS JSON)),updated_at=UTC_TIMESTAMP(3) WHERE id=? AND status='QUIESCENCE_CONFIRMED'`, [JSON.stringify(marker), item.operationId]);
        if (saved.affectedRows !== 1) throw pending('RECOVERY_OPERATION_CHANGED');
        const [opened] = await c.execute(`UPDATE document_admission_coordinators SET gate_state='OPEN',delete_operation_id=NULL,generation=generation+1,updated_at=UTC_TIMESTAMP(3) WHERE project_id=? AND document_id=? AND gate_state='CLOSED' AND delete_operation_id=? AND generation=?`, [item.projectId, item.documentId, item.operationId, item.generation]);
        if (opened.affectedRows !== 1) throw pending('RECOVERY_GATE_CHANGED');
        await c.execute(`INSERT INTO audit_trail (id,identity_key,project_id,actor_user_id,actor_name,department,official_role,action,business_event,detail,resource_type,resource_id,reference,metadata,occurred_at) VALUES (?,?,?,?,?,?,'Admin','Delete Reservation Cancelled','Staging Document Recovery','Reservation cancelled before storage deletion.','Document',?,?,?,UTC_TIMESTAMP(3))`,
          [randomUUID(), `reservation-recovery:${digest(item.operationId)}`, item.projectId, actor.id, actor.full_name, actor.department_name_snapshot,
            item.documentId, item.documentNumber, JSON.stringify(marker)]);
      }
      return { status: 'RECOVERED', operationIds: current.map(item => item.operationId) };
    }, { write: true });
  };
  return Object.freeze({ prepare, apply });
};

module.exports = { createRecovery, STAGING_TARGETS };
