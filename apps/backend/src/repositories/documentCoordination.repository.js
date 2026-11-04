const { pool } = require('../config/documentCoordinationDatabase');
const { pool: businessPool } = require('../config/database');
const { lockGate } = require('./documentGate.repository');
const { isCancelledDelete, pending } = require('../utils/storageNamespace');

const conflict = () => Object.assign(new Error(
  'This document is currently being permanently deleted by an Admin. No further actions are allowed.'
), { statusCode: 409, code: 'DOCUMENT_DELETION_IN_PROGRESS' });

const transaction = async (callback) => {
  const connection = await businessPool.getConnection();
  try {
    await connection.beginTransaction();
    const result = await callback(connection);
    await connection.commit();
    return result;
  } catch (error) {
    await connection.rollback().catch(() => {});
    throw error;
  } finally {
    connection.release();
  }
};

const assertGate = async (connection, scope, writerId = null) => {
  const gate = await lockGate(connection, scope);
  if (writerId) {
    // An autocommit evidence read avoids an older business-transaction snapshot,
    // without holding a writer lock across external IO.
    const [writers] = await pool.execute(
      `SELECT lifecycle_state, generation FROM document_writer_operations
       WHERE id = ? AND project_id = ? AND document_id = ?`,
      [writerId, scope.projectId, scope.documentId]
    );
    if (!writers[0] || writers[0].lifecycle_state !== 'ACTIVE'
      || Number(writers[0].generation) !== Number(gate.generation)) throw conflict();
    if (gate.gate_state === 'CLOSED') {
      const [operations] = await connection.execute(
        'SELECT status FROM document_delete_operations WHERE id = ? FOR UPDATE', [gate.delete_operation_id]
      );
      if (operations[0]?.status !== 'QUIESCENCE_PENDING') throw conflict();
    }
  } else if (gate.gate_state !== 'OPEN') throw conflict();
  return gate;
};

const admitWriter = async (writer) => transaction(async (connection) => {
  const gate = writer.documentId ? await assertGate(connection, writer) : null;
  await connection.execute(
    `INSERT INTO document_writer_operations
     (id, project_id, document_id, writer_type, generation, temporary_file_id, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, UTC_TIMESTAMP(3), UTC_TIMESTAMP(3))`,
    [writer.id, writer.projectId || null, writer.documentId || null, writer.type,
      gate?.generation || 0, writer.temporaryFileId || null]
  );
  return writer.id;
}).catch((error) => {
  if (error.code === 'ER_DUP_ENTRY' && writer.temporaryFileId) {
    throw Object.assign(new Error('File temporary sedang diproses.'),
      { statusCode: 409, code: 'TEMPORARY_UPLOAD_IN_USE' });
  }
  throw error;
});

const recordIo = async (step) => {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    // Never acquire a coordinator/business lock on this evidence connection.
    const [writers] = await connection.execute(
      'SELECT lifecycle_state FROM document_writer_operations WHERE id = ? FOR UPDATE', [step.writerId]
    );
    if (writers[0]?.lifecycle_state !== 'ACTIVE') throw conflict();
    await connection.execute(
    `INSERT INTO document_storage_io_steps
     (id, writer_id, provider, operation_type, source_key, destination_key, state, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, 'IN_FLIGHT', UTC_TIMESTAMP(3), UTC_TIMESTAMP(3))`,
      [step.id, step.writerId, step.provider, step.type, step.sourceKey || null, step.destinationKey || null]
    );
    await connection.commit();
  } catch (error) {
    await connection.rollback().catch(() => {});
    throw error;
  } finally { connection.release(); }
};

const finishIo = async ({ id, state, evidence }) => {
  const [result] = await pool.execute(
    `UPDATE document_storage_io_steps SET state = ?, evidence = ?, updated_at = UTC_TIMESTAMP(3)
     WHERE id = ? AND state = 'IN_FLIGHT'`, [state, JSON.stringify(evidence), id]
  );
  if (result.affectedRows !== 1) throw new Error('Storage IO completion evidence was not persisted');
};

const finishWriter = async ({ id, scope, dbOutcome, uncertain }) => transaction(async (connection) => {
  if (scope.documentId) await lockGate(connection, scope);
  await connection.execute('SELECT id FROM document_writer_operations WHERE id = ? FOR UPDATE', [id]);
  const [io] = await connection.execute(
    "SELECT id FROM document_storage_io_steps WHERE writer_id = ? AND state <> 'SUCCEEDED' FOR UPDATE", [id]
  );
  const settled = !uncertain && io.length === 0 && ['NOT_STARTED', 'COMMITTED', 'ROLLED_BACK'].includes(dbOutcome);
  await connection.execute(
    `UPDATE document_writer_operations SET lifecycle_state = ?, db_outcome = ?,
     completion_evidence = ?, updated_at = UTC_TIMESTAMP(3)
     WHERE id = ? AND lifecycle_state = 'ACTIVE'`,
    [settled ? 'SETTLED' : 'UNRESOLVED', dbOutcome,
      JSON.stringify({ scopeClosed: true, unresolvedIo: io.length, uncertain }), id]
  );
  return settled;
});

const reserve = async (operation, { beforeReserve } = {}) => transaction(async (connection) => {
  const gate = await lockGate(connection, operation);
  const [prior] = await connection.execute(
    `SELECT * FROM document_delete_operations
     WHERE project_id = ? AND document_id = ? AND request_identity = ?`,
    [operation.projectId, operation.documentId, operation.requestIdentity]
  );
  if (prior[0]) {
    if (isCancelledDelete(prior[0])) throw pending('DELETE_RESERVATION_CANCELLED');
    return prior[0];
  }
  if (gate.gate_state !== 'OPEN') throw conflict();
  // A rejected preflight rolls back even a newly inserted OPEN coordinator.
  // Holding the gate keeps writer admission/commit serialized with this check.
  if (beforeReserve) await beforeReserve(connection);
  await connection.execute(
    `INSERT INTO document_delete_operations
     (id, project_id, document_id, document_number_snapshot, initiated_by_user_id, reason, request_identity, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, UTC_TIMESTAMP(3), UTC_TIMESTAMP(3))`,
    [operation.id, operation.projectId, operation.documentId, operation.documentNumber,
      operation.userId, operation.reason || null, operation.requestIdentity]
  );
  await connection.execute(
    `UPDATE document_admission_coordinators SET gate_state = 'CLOSED', delete_operation_id = ?,
     updated_at = UTC_TIMESTAMP(3) WHERE project_id = ? AND document_id = ?`,
    [operation.id, operation.projectId, operation.documentId]
  );
  return { id: operation.id, status: 'QUIESCENCE_PENDING' };
});

const evaluateQuiescence = async (operationId) => {
  // Resolve immutable identity outside the transaction: an earlier consistent read
  // must not pin a REPEATABLE READ snapshot before acquiring the coordinator lock.
  const [found] = await pool.execute('SELECT * FROM document_delete_operations WHERE id = ?', [operationId]);
  if (!found[0]) return null;
  const operation = found[0];
  if (isCancelledDelete(operation)) throw pending('DELETE_RESERVATION_CANCELLED');
  const scope = { projectId: operation.project_id, documentId: operation.document_id };
  return transaction(async (connection) => {
    const gate = await lockGate(connection, scope);
    if (gate.gate_state !== 'CLOSED' || gate.delete_operation_id !== operationId) throw conflict();
    const [latest] = await connection.execute(
      'SELECT * FROM document_delete_operations WHERE id = ? FOR UPDATE', [operationId]
    );
    if (latest[0]?.status === 'QUIESCENCE_CONFIRMED') {
      return { id: operationId, status: 'QUIESCENCE_CONFIRMED', evidence: JSON.parse(latest[0].pending_metadata) };
    }
    if (latest[0]?.status !== 'QUIESCENCE_PENDING') throw conflict();
    // The gate serializes admission and settlement. No lease or provider HEAD can prove completion.
    const [writers] = await connection.execute(
      `SELECT id FROM document_writer_operations WHERE project_id = ? AND document_id = ?
       AND (lifecycle_state <> 'SETTLED' OR completion_evidence IS NULL
         OR db_outcome NOT IN ('NOT_STARTED', 'COMMITTED', 'ROLLED_BACK'))`,
      [scope.projectId, scope.documentId]
    );
    const [io] = await connection.execute(
      `SELECT s.id FROM document_storage_io_steps s JOIN document_writer_operations w ON w.id = s.writer_id
       WHERE w.project_id = ? AND w.document_id = ? AND s.state <> 'SUCCEEDED'`,
      [scope.projectId, scope.documentId]
    );
    const confirmed = writers.length === 0 && io.length === 0;
    const evidence = { pendingWriters: writers.map((w) => w.id), pendingIo: io.map((s) => s.id) };
    await connection.execute(
      `UPDATE document_delete_operations SET status = ?, pending_metadata = ?, updated_at = UTC_TIMESTAMP(3)
       WHERE id = ? AND status = 'QUIESCENCE_PENDING'`,
      [confirmed ? 'QUIESCENCE_CONFIRMED' : 'QUIESCENCE_PENDING', JSON.stringify(evidence), operationId]
    );
    return { id: operationId, status: confirmed ? 'QUIESCENCE_CONFIRMED' : 'QUIESCENCE_PENDING', evidence };
  });
};

const listPendingOperations = async () => {
  const [rows] = await pool.execute("SELECT * FROM document_delete_operations WHERE status = 'QUIESCENCE_PENDING' ORDER BY created_at, id");
  return rows;
};
const listUnresolvedWriters = async ({ projectId, documentId }) => {
  const [rows] = await pool.execute(
    "SELECT * FROM document_writer_operations WHERE project_id = ? AND document_id = ? AND lifecycle_state <> 'SETTLED' ORDER BY created_at, id",
    [projectId, documentId]
  );
  return rows;
};
const listIoSteps = async (writerId) => {
  const [rows] = await pool.execute('SELECT * FROM document_storage_io_steps WHERE writer_id = ? ORDER BY created_at, id', [writerId]);
  return rows;
};
const readAdmissionState = async ({ projectId, documentId }) => {
  const [rows] = await pool.execute(
    'SELECT * FROM document_admission_coordinators WHERE project_id = ? AND document_id = ?', [projectId, documentId]
  );
  return rows[0] || null;
};

module.exports = { transaction, lockGate, assertGate, admitWriter, recordIo, finishIo, finishWriter,
  reserve, evaluateQuiescence, listPendingOperations, listUnresolvedWriters, listIoSteps, readAdmissionState, conflict };
