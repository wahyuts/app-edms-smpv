const createRepository = ({ pool }) => {
  const one = async (sql, args) => (await pool.execute(sql, args))[0][0] || null;
  const authorize = (projectId, userId) => one(`SELECT m.official_role FROM project_memberships m
    JOIN users u ON u.id=m.user_id JOIN projects p ON p.id=m.project_id
    WHERE m.project_id=? AND m.user_id=? AND m.status='Active' AND u.status='Active' AND p.status='Active'`, [projectId, userId]);
  const document = (documentId) => one('SELECT id,project_id,document_number FROM engineering_documents WHERE id=?', [documentId]);
  const operation = (projectId, documentId) => one('SELECT * FROM document_delete_operations WHERE project_id=? AND document_id=?', [projectId, documentId]);
  const state = async (op) => {
    const execution = await one('SELECT phase,pending_reason,completion_snapshot FROM document_delete_executions WHERE operation_id=?', [op.id]);
    const attempts = (await pool.execute(`SELECT a.state FROM document_delete_attempts a JOIN document_delete_file_manifest m ON m.id=a.manifest_id
      WHERE m.delete_operation_id=?`, [op.id]))[0];
    const uncertain = await one(`SELECT w.id FROM document_writer_operations w WHERE w.project_id=? AND w.document_id=? AND
      (w.db_outcome='UNKNOWN' OR EXISTS (SELECT 1 FROM document_storage_io_steps s WHERE s.writer_id=w.id AND s.state='UNKNOWN')) LIMIT 1`,
    [op.project_id, op.document_id]);
    return { execution, attempts, uncertain };
  };
  return { authorize, document, operation, state };
};

module.exports = { createRepository };
