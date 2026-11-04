const lockGate = async (connection, { projectId, documentId }) => {
  // Universal order: coordinator (sorted project/document), then business rows.
  await connection.execute(
    `INSERT INTO document_admission_coordinators (project_id, document_id, created_at, updated_at)
     VALUES (?, ?, UTC_TIMESTAMP(3), UTC_TIMESTAMP(3))
     ON DUPLICATE KEY UPDATE document_id = document_id`, [projectId, documentId]
  );
  const [rows] = await connection.execute(
    `SELECT * FROM document_admission_coordinators
     WHERE project_id = ? AND document_id = ? FOR UPDATE`, [projectId, documentId]
  );
  return rows[0];
};

module.exports = { lockGate };
