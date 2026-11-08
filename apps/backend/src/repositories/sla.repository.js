const { pool } = require('../config/database');
const admission = require('../services/documentAdmission.service');

const upsertSlaEvaluation = async ({
  cycleId,
  currentState,
  documentId,
  evaluationId,
  notifiedStates = {},
  projectId,
}, { connection } = {}) => {
  const write = async (connection) => {
    await connection.execute(
      `
        INSERT INTO document_sla_evaluations (
          id, project_id, document_id, cycle_id, current_state, notified_states
        )
        VALUES (?, ?, ?, ?, ?, ?)
        ON DUPLICATE KEY UPDATE
          current_state = VALUES(current_state),
          notified_states = COALESCE(document_sla_evaluations.notified_states, VALUES(notified_states))
      `,
      [
        evaluationId,
        projectId,
        documentId,
        cycleId,
        currentState,
        JSON.stringify(notifiedStates),
      ]
    );
  };
  return connection ? write(connection) : admission.mutate({ projectId, documentId }, write);
};

const findSlaEvaluationByCycle = async ({ cycleId, documentId }, { connection = pool } = {}) => {
  const [rows] = await connection.execute(
    `
      SELECT id, project_id, document_id, cycle_id, current_state, notified_states, updated_at
      FROM document_sla_evaluations
      WHERE document_id = ?
        AND cycle_id = ?
      LIMIT 1
    `,
    [documentId, cycleId]
  );

  return rows[0] || null;
};

const findLatestSlaEvaluationByDocument = async ({ documentId }, { connection = pool } = {}) => {
  const [rows] = await connection.execute(
    `
      SELECT id, project_id, document_id, cycle_id, current_state, notified_states, updated_at
      FROM document_sla_evaluations
      WHERE document_id = ?
      ORDER BY updated_at DESC, id DESC
      LIMIT 1
    `,
    [documentId]
  );

  return rows[0] || null;
};

module.exports = {
  runInTransaction: (scope, callback, options) => admission.mutate(scope, callback, options),
  getTransactionEvidence: admission.getTransactionEvidence,
  findSlaEvaluationByCycle,
  findLatestSlaEvaluationByDocument,
  upsertSlaEvaluation,
};
