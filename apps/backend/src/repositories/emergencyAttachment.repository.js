const lockContext = async (connection, { documentId, projectId, actorUserId }) => {
  const [documents] = await connection.execute(
    'SELECT * FROM engineering_documents WHERE id=? AND project_id=? FOR UPDATE', [documentId, projectId]);
  const [projects] = await connection.execute('SELECT status FROM projects WHERE id=? FOR UPDATE', [projectId]);
  const [members] = await connection.execute(
    `SELECT m.official_role,m.status AS membership_status,u.status AS user_status,u.full_name
     FROM project_memberships m JOIN users u ON u.id=m.user_id
     WHERE m.project_id=? AND m.user_id=? FOR UPDATE`, [projectId, actorUserId]);
  return { document: documents[0], project: projects[0], member: members[0] };
};

const findRequest = async (connection, id) => {
  const [rows] = await connection.execute(
    `SELECT c.*,a.attachment_id,a.file_id,f.file_id AS verified_file_id,f.original_file_name FROM workflow_comments c
     LEFT JOIN workflow_attachments a ON a.comment_id=c.id AND a.project_id=c.project_id AND a.document_id=c.document_id
     LEFT JOIN stored_files f ON f.file_id=a.file_id AND f.project_id=c.project_id AND f.document_id=c.document_id WHERE c.id=?`, [id]);
  return rows[0] || null;
};

const hasUnresolvedStorage = async (connection, { documentId, projectId, writerId }) => {
  const [rows] = await connection.execute(
    `SELECT w.id FROM document_writer_operations w
     LEFT JOIN document_storage_io_steps s ON s.writer_id=w.id
     WHERE w.project_id=? AND w.document_id=? AND w.id<>?
       AND (w.lifecycle_state='UNRESOLVED' OR s.state IN ('IN_FLIGHT','UNKNOWN')) LIMIT 1`,
    [projectId, documentId, writerId]);
  return rows.length > 0;
};

const findCommittedRequest = id => findRequest(require('../config/database').pool, id);

module.exports = { lockContext, findRequest, findCommittedRequest, hasUnresolvedStorage };
