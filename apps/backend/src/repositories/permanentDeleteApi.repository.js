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
  const realtimeRecipients = async (projectId) => {
    const [rows] = await pool.execute(`SELECT DISTINCT m.user_id FROM project_memberships m
      JOIN users u ON u.id=m.user_id JOIN projects p ON p.id=m.project_id
      WHERE m.project_id=? AND m.status='Active' AND u.status='Active' AND p.status='Active'`, [projectId]);
    return rows.map((row) => row.user_id);
  };
  const unsettledWriters = async (connection, projectId, documentId) => {
    const [busy] = await connection.execute(`SELECT w.id FROM document_writer_operations w
      WHERE w.project_id=? AND w.document_id=? AND
        (w.lifecycle_state<>'SETTLED' OR w.completion_evidence IS NULL OR w.db_outcome IS NULL
          OR w.db_outcome NOT IN ('NOT_STARTED','COMMITTED','ROLLED_BACK')
          OR EXISTS(SELECT 1 FROM document_storage_io_steps s WHERE s.writer_id=w.id AND s.state<>'SUCCEEDED'))`,
    [projectId, documentId]);
    return busy;
  };
  const historicalUnboundFiles = async (connection, projectId, documentId) => {
    const [historical] = await connection.execute(`SELECT DISTINCT f.file_id
      FROM stored_files f JOIN engineering_documents d ON d.id=f.document_id AND d.project_id=f.project_id
      JOIN document_revisions r ON r.file_id=f.file_id AND r.document_id=d.id AND r.project_id=d.project_id
      JOIN document_history h ON h.document_id=d.id AND h.project_id=d.project_id AND h.workflow_event='Upload Document'
        AND h.revision_label=r.revision_label AND h.workflow_status='Process Review'
      WHERE f.project_id=? AND f.document_id=? AND r.revision_sequence=1 AND r.source_status IS NULL
        AND NOT EXISTS(SELECT 1 FROM stored_file_namespace_bindings b WHERE b.file_id=f.file_id)
        AND NOT EXISTS(SELECT 1 FROM document_writer_operations w WHERE w.project_id=f.project_id
          AND w.document_id=f.document_id AND w.writer_type='CREATE_DOCUMENT')
        AND NOT EXISTS(SELECT 1 FROM document_storage_io_steps s JOIN document_writer_operations w ON w.id=s.writer_id
          WHERE w.project_id=f.project_id AND w.document_id=f.document_id
            AND (BINARY s.destination_key=BINARY f.storage_key OR BINARY s.source_key=BINARY f.storage_key))
        AND d.created_at < (SELECT MIN(w.created_at) FROM document_writer_operations w
          WHERE w.writer_type='CREATE_DOCUMENT' AND w.lifecycle_state='SETTLED' AND w.db_outcome='COMMITTED')
        AND f.uploaded_at < (SELECT MIN(w.created_at) FROM document_writer_operations w
          WHERE w.writer_type='CREATE_DOCUMENT' AND w.lifecycle_state='SETTLED' AND w.db_outcome='COMMITTED')
        AND r.created_at < (SELECT MIN(w.created_at) FROM document_writer_operations w
          WHERE w.writer_type='CREATE_DOCUMENT' AND w.lifecycle_state='SETTLED' AND w.db_outcome='COMMITTED')
        AND h.created_at < (SELECT MIN(w.created_at) FROM document_writer_operations w
          WHERE w.writer_type='CREATE_DOCUMENT' AND w.lifecycle_state='SETTLED' AND w.db_outcome='COMMITTED')`,
    [projectId, documentId]);
    return historical;
  };
  const readOwnershipSnapshot = async (inspect) => {
    const connection = await pool.getConnection();
    try {
      await connection.query('START TRANSACTION READ ONLY');
      return await inspect(connection);
    } finally {
      try { await connection.rollback(); } finally { connection.release(); }
    }
  };
  return { authorize, document, operation, state, realtimeRecipients, unsettledWriters, historicalUnboundFiles, readOwnershipSnapshot };
};

module.exports = { createRepository };
