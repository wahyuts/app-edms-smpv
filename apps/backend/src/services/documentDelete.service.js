const { randomUUID } = require('node:crypto');
const { digest, sameNamespace, pending } = require('../utils/storageNamespace');
const { createRepository } = require('../repositories/documentDelete.repository');
const { createDeleteNotificationDispatcher } = require('./documentDeleteNotification.service');
const logger = require('../config/logger');
const { cleanupFolderPlan } = require('./documentFolderCleanup.service');

// Deliberately no runtime pool, storage initialization, routes, timers or startup import.
// The approved internal caller supplies the existing adapters and coordination repository.
const createDeleteEngine = ({ pool, coordination, storage, hooks = {}, repository = createRepository({ coordination, storage }) }) => {
  const notifications = createDeleteNotificationDispatcher({ pool, hooks: hooks.notifications });
  const checkpoint = async (name) => { if (hooks[name]) await hooks[name](); };
  const resumeCore = async (operationId) => {
    if (typeof operationId !== 'string' || !operationId || operationId.length > 64) throw pending('DELETE_OPERATION_INVALID');
    const c = await pool.getConnection();
    const lockName = `edms-del:${digest(operationId).slice(0, 48)}`;
    let acquired = false;
    const assertClaim = async () => {
      const [[row]] = await c.execute('SELECT IS_USED_LOCK(?) = CONNECTION_ID() AS owned', [lockName]);
      if (Number(row.owned) !== 1) throw pending('DELETE_CLAIM_LOST');
    };
    const transaction = async (callback) => {
      await assertClaim();
      await c.beginTransaction();
      try {
        const result = await callback();
        await assertClaim();
        await c.commit();
        return result;
      } catch (error) { await c.rollback().catch(() => {}); throw error; }
    };
    try {
      const [[claim]] = await c.execute('SELECT GET_LOCK(?,0) AS acquired', [lockName]);
      if (Number(claim.acquired) !== 1) return { status: 'PENDING', reason: 'DELETE_WORKER_BUSY' };
      acquired = true;
      const [[prior]] = await c.execute('SELECT * FROM document_delete_executions WHERE operation_id=?', [operationId]);
      if (prior?.phase === 'COMPLETED') {
        const snapshot = JSON.parse(prior.completion_snapshot);
        return { status: 'COMPLETED', snapshot, completedAt: snapshot.completedAt };
      }
      const op = await transaction(() => repository.lockOperation(c, operationId));
      await checkpoint('beforeManifest');
      const execution = await transaction(async () => {
        await repository.lockOperation(c, operationId);
        return repository.prepare(c, op);
      });
      await checkpoint('afterManifest');
      let manifest = await repository.readManifest(c, execution);
      if (!JSON.parse(execution.inventory).folderCleanup) throw pending('FOLDER_PROVENANCE_REQUIRED');
      // Revalidate the entire inventory before the first physical side effect on each resume.
      await transaction(async () => {
        await repository.lockOperation(c, operationId);
        const latest = await repository.inventory(c, op);
        if (JSON.stringify(latest) !== JSON.stringify(JSON.parse(execution.inventory).inventory)) throw pending('OWNERSHIP_SNAPSHOT_CHANGED');
      });
      for (const file of manifest) {
        await assertClaim();
        const [[old]] = await c.execute('SELECT * FROM document_delete_attempts WHERE manifest_id=?', [file.id]);
        if (old?.state === 'SUCCEEDED' && file.cleanup_state === 'DELETED') continue;
        if (old && ['UNKNOWN','IN_FLIGHT','SUCCEEDED'].includes(old.state)) throw pending('STORAGE_OUTCOME_UNRESOLVED');
        const evidence = JSON.parse(file.ownership_evidence);
        if (!sameNamespace(await storage.captureNamespace(), evidence.namespace)) throw pending('NAMESPACE_MISMATCH');
        const attemptId = randomUUID();
        await transaction(async () => {
          if (old) {
            const [updated] = await c.execute(`UPDATE document_delete_attempts SET attempt_id=?,attempt_count=attempt_count+1,
              state='IN_FLIGHT',error_code=NULL,updated_at=UTC_TIMESTAMP(3) WHERE manifest_id=? AND state='REJECTED'`, [attemptId, file.id]);
            if (updated.affectedRows !== 1) throw pending('DELETE_ATTEMPT_CONFLICT');
          } else await c.execute(`INSERT INTO document_delete_attempts
            (manifest_id,attempt_id,attempt_count,state,created_at,updated_at)
            VALUES (?,?,1,'IN_FLIGHT',UTC_TIMESTAMP(3),UTC_TIMESTAMP(3))`, [file.id, attemptId]);
        });
        await checkpoint('attemptPersisted');
        try {
          const result = await storage.deleteOwnedExact(file.exact_storage_key, evidence.namespace, evidence);
          if (result?.terminal !== true || result.outcome !== 'DELETE_ACKNOWLEDGED') throw pending('PROVIDER_ACK_UNVERIFIED');
          await checkpoint('afterPhysicalDelete');
          await transaction(async () => {
            const [updated] = await c.execute(`UPDATE document_delete_attempts SET state='SUCCEEDED',updated_at=UTC_TIMESTAMP(3)
              WHERE manifest_id=? AND attempt_id=? AND state='IN_FLIGHT'`, [file.id, attemptId]);
            if (updated.affectedRows !== 1) throw pending('DELETE_ATTEMPT_CONFLICT');
            await c.execute("UPDATE document_delete_file_manifest SET cleanup_state='DELETED',updated_at=UTC_TIMESTAMP(3) WHERE id=?", [file.id]);
          });
        } catch (error) {
          // These errors are issued before external delete by our adapters. All other
          // failures, including a crash after provider ACK, are permanently fail-closed.
          const rejected = ['NAMESPACE_MISMATCH','LOCAL_LINK_REJECTED','LOCAL_SAFE_DELETE_UNAVAILABLE','STORAGE_INVALID_KEY',
            'LOCAL_IDENTITY_MISMATCH','LOCAL_SHARED_LINK','LOCAL_OBJECT_INVALID','LOCAL_PATH_MISMATCH',
            'LOCAL_FILESYSTEM_UNSUPPORTED','LOCAL_HELPER_REJECTED'].includes(error.code);
          await transaction(async () => {
            await c.execute(`UPDATE document_delete_attempts SET state=?,error_code=?,updated_at=UTC_TIMESTAMP(3)
              WHERE manifest_id=? AND attempt_id=? AND state='IN_FLIGHT'`,
            [rejected ? 'REJECTED' : 'UNKNOWN', /^[A-Z0-9_]{1,128}$/.test(error.code || '') ? error.code : 'PROVIDER_OUTCOME_UNKNOWN', file.id, attemptId]);
            await c.execute("UPDATE document_delete_file_manifest SET cleanup_state='FAILED',updated_at=UTC_TIMESTAMP(3) WHERE id=? AND cleanup_state <> 'DELETED'", [file.id]);
          }).catch(() => {});
          throw error;
        }
      }
      await checkpoint('afterStorage');
      manifest = await repository.readManifest(c, execution);
      // Folder-only retries are safe after partial rmdir: exact identities must still
      // match and the kernel refuses nonempty directories. File attempts stay unchanged.
      for (const file of manifest) {
        const [[attempt]] = await c.execute('SELECT * FROM document_delete_attempts WHERE manifest_id=?', [file.id]);
        if (file.cleanup_state !== 'DELETED' || attempt?.state !== 'SUCCEEDED') throw pending('STORAGE_NOT_TERMINAL');
      }
      const saved = JSON.parse(execution.inventory);
      saved.folderCleanup.state = 'RUNNING';
      await transaction(async () => {
        await repository.lockOperation(c, operationId);
        const [updated] = await c.execute("UPDATE document_delete_executions SET inventory=? WHERE operation_id=? AND phase='MANIFEST_FINALIZED'",
          [JSON.stringify(saved), operationId]);
        if (updated.affectedRows !== 1) throw pending('FOLDER_STATE_CONFLICT');
      });
      await checkpoint('beforeFolderCleanup');
      await cleanupFolderPlan(saved.folderCleanup, storage);
      await checkpoint('afterFolderCleanup');
      saved.folderCleanup.state = 'CONFIRMED';
      await transaction(async () => {
        await repository.lockOperation(c, operationId);
        const [updated] = await c.execute("UPDATE document_delete_executions SET inventory=? WHERE operation_id=? AND phase='MANIFEST_FINALIZED'",
          [JSON.stringify(saved), operationId]);
        if (updated.affectedRows !== 1) throw pending('FOLDER_STATE_CONFLICT');
      });
      execution.inventory = JSON.stringify(saved);
      await transaction(async () => {
        await repository.lockOperation(c, operationId);
        await repository.finalize(c, op, execution, manifest);
        await checkpoint('beforeDatabaseCommit');
      });
      await checkpoint('afterDatabaseCommit');
      const [[completed]] = await c.execute('SELECT completion_snapshot,updated_at FROM document_delete_executions WHERE operation_id=?', [operationId]);
      const snapshot = JSON.parse(completed.completion_snapshot);
      return { status: 'COMPLETED', snapshot, completedAt: snapshot.completedAt };
    } catch (error) {
      const reason = /^[A-Z0-9_]{1,128}$/.test(error.code || '') ? error.code : 'CLEANUP_INTERRUPTED';
      if (acquired) {
        await assertClaim().then(async () => {
          await c.execute(`UPDATE document_delete_operations SET pending_metadata=
            JSON_SET(COALESCE(pending_metadata,'{}'),'$.cleanupPendingReason',?),updated_at=UTC_TIMESTAMP(3) WHERE id=?`, [reason, operationId]);
          await c.execute("UPDATE document_delete_executions SET pending_reason=? WHERE operation_id=? AND phase <> 'COMPLETED'", [reason, operationId]);
        }).catch(() => {});
      }
      return { status: 'PENDING', reason };
    } finally {
      if (acquired) await c.execute('SELECT RELEASE_LOCK(?)', [lockName]).catch(() => {});
      c.release();
    }
  };
  const resume = async (operationId) => {
    const result = await resumeCore(operationId);
    if (result.status !== 'COMPLETED') return result;
    try { return { ...result, notification: await notifications.dispatch(operationId) }; }
    catch (error) {
      logger.error('[NOTIFICATION]', 'event=permanent_delete_delivery_pending', `operationId=${operationId}`,
        `errorCode=${/^[A-Z0-9_]{1,128}$/.test(error.code || '') ? error.code : 'NOTIFICATION_DELIVERY_FAILED'}`);
      return { ...result, notification: { status: 'PENDING' } };
    }
  };
  return Object.freeze({ resume });
};

module.exports = { createDeleteEngine };
