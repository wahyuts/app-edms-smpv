const { pool } = require('../config/database');

const upsertSlaEvaluation = async ({
  cycleId,
  currentState,
  documentId,
  evaluationId,
  notifiedStates = {},
  projectId,
}) => {
  await pool.execute(
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

const findSlaEvaluationByCycle = async ({ cycleId, documentId }) => {
  const [rows] = await pool.execute(
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

const findLatestSlaEvaluationByDocument = async ({ documentId }) => {
  const [rows] = await pool.execute(
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
  findSlaEvaluationByCycle,
  findLatestSlaEvaluationByDocument,
  upsertSlaEvaluation,
};
