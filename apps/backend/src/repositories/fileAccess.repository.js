const { pool } = require('../config/database');

const mapStoredFileRow = (row) => row && ({
  fileId: row.file_id,
  projectId: row.project_id,
  documentId: row.document_id,
  originalFileName: row.original_file_name,
  physicalFileName: row.physical_file_name,
  extension: row.file_extension,
  mimeType: row.mime_type,
  fileSize: Number(row.file_size),
  storageKey: row.storage_key,
  relativePath: row.relative_path,
  fileCategory: row.file_category,
  checksum: row.checksum,
  uploadedByUserId: row.uploaded_by_user_id,
  uploadedAt: row.uploaded_at,
  isActive: Boolean(row.is_active),
});

const mapDocumentFileRow = (row) => row && ({
  document: {
    id: row.document_id,
    projectId: row.document_project_id,
    projectCode: row.project_code,
    documentNumber: row.document_number,
    activeRevisionId: row.active_revision_id,
    activeFileId: row.active_file_id,
    workflowStatus: row.workflow_status,
    lifecycle: row.lifecycle_status,
  },
  revision: row.revision_id ? {
    id: row.revision_id,
    projectId: row.revision_project_id,
    documentId: row.revision_document_id,
    revision: row.revision_label,
    revisionSequence: Number(row.revision_sequence),
    fileId: row.revision_file_id,
    isActive: Boolean(row.revision_is_active),
  } : null,
  storedFile: mapStoredFileRow(row),
});

const mapWorkflowCommentRow = (row) => row && ({
  id: row.id,
  projectId: row.project_id,
  documentId: row.document_id,
  revisionId: row.revision_id,
  workflowAction: row.workflow_action,
  workflowComment: row.workflow_comment,
});

const mapWorkflowAttachmentRow = (row) => row && ({
  attachmentId: row.attachment_id,
  commentId: row.comment_id,
  projectId: row.project_id,
  documentId: row.document_id,
  fileId: row.file_id,
  uploadedByUserId: row.uploaded_by_user_id,
  uploadedAt: row.uploaded_at,
  storedFile: mapStoredFileRow(row),
});

const findActiveDocumentFile = async (documentId) => {
  const [rows] = await pool.execute(
    `
      SELECT
        documents.id AS document_id,
        documents.project_id AS document_project_id,
        projects.project_code,
        documents.document_number,
        documents.active_revision_id,
        documents.active_file_id,
        documents.workflow_status,
        documents.lifecycle_status,
        revisions.id AS revision_id,
        revisions.project_id AS revision_project_id,
        revisions.document_id AS revision_document_id,
        revisions.revision_label,
        revisions.revision_sequence,
        revisions.file_id AS revision_file_id,
        revisions.is_active AS revision_is_active,
        stored_files.*
      FROM engineering_documents documents
      INNER JOIN projects ON projects.id = documents.project_id
      LEFT JOIN document_revisions revisions ON revisions.id = documents.active_revision_id
      LEFT JOIN stored_files ON stored_files.file_id = documents.active_file_id
      WHERE documents.id = ?
      LIMIT 1
    `,
    [documentId]
  );

  return mapDocumentFileRow(rows[0]);
};

const findRevisionDocumentFile = async ({ documentId, revisionId }) => {
  const [rows] = await pool.execute(
    `
      SELECT
        documents.id AS document_id,
        documents.project_id AS document_project_id,
        projects.project_code,
        documents.document_number,
        documents.active_revision_id,
        documents.active_file_id,
        documents.workflow_status,
        documents.lifecycle_status,
        revisions.id AS revision_id,
        revisions.project_id AS revision_project_id,
        revisions.document_id AS revision_document_id,
        revisions.revision_label,
        revisions.revision_sequence,
        revisions.file_id AS revision_file_id,
        revisions.is_active AS revision_is_active,
        stored_files.*
      FROM document_revisions revisions
      INNER JOIN engineering_documents documents ON documents.id = revisions.document_id
      INNER JOIN projects ON projects.id = documents.project_id
      INNER JOIN stored_files ON stored_files.file_id = revisions.file_id
      WHERE revisions.id = ?
        AND revisions.document_id = ?
      LIMIT 1
    `,
    [revisionId, documentId]
  );

  return mapDocumentFileRow(rows[0]);
};

const findWorkflowCommentById = async ({ commentId, documentId }) => {
  const [rows] = await pool.execute(
    `
      SELECT id, project_id, document_id, revision_id, workflow_action, workflow_comment
      FROM workflow_comments
      WHERE id = ?
        AND document_id = ?
      LIMIT 1
    `,
    [commentId, documentId]
  );

  return mapWorkflowCommentRow(rows[0]);
};

const findWorkflowAttachmentById = async ({ attachmentId, documentId }) => {
  const [rows] = await pool.execute(
    `
      SELECT
        workflow_attachments.attachment_id,
        workflow_attachments.comment_id,
        workflow_attachments.project_id,
        workflow_attachments.document_id,
        workflow_attachments.file_id,
        workflow_attachments.uploaded_by_user_id,
        workflow_attachments.uploaded_at,
        stored_files.*
      FROM workflow_attachments
      INNER JOIN stored_files ON stored_files.file_id = workflow_attachments.file_id
      WHERE workflow_attachments.attachment_id = ?
        AND workflow_attachments.document_id = ?
      LIMIT 1
    `,
    [attachmentId, documentId]
  );

  return mapWorkflowAttachmentRow(rows[0]);
};

const insertWorkflowAttachment = async (connection, attachment) => {
  await connection.execute(
    `
      INSERT INTO workflow_attachments (
        attachment_id, comment_id, project_id, document_id, file_id, uploaded_by_user_id
      )
      VALUES (?, ?, ?, ?, ?, ?)
    `,
    [
      attachment.attachmentId,
      attachment.commentId,
      attachment.projectId,
      attachment.documentId,
      attachment.fileId,
      attachment.uploadedByUserId,
    ]
  );
};

module.exports = {
  findActiveDocumentFile,
  findRevisionDocumentFile,
  findWorkflowAttachmentById,
  findWorkflowCommentById,
  insertWorkflowAttachment,
};
