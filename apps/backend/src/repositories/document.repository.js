const { pool } = require('../config/database');

const mapDocumentFoundationRow = (row) => row && ({
  id: row.id,
  projectId: row.project_id,
  documentTypeId: row.document_type_id,
  documentNumber: row.document_number,
  description: row.description,
  drawing: row.drawing,
  area: row.area,
  daysUntilValidation: Number(row.days_until_validation),
  workflowStatus: row.workflow_status,
  status: row.workflow_status,
  lifecycle: row.lifecycle_status,
  revision: row.revision_label,
  responsibleRole: row.responsible_role,
  currentAssigneeUserId: row.current_assignee_user_id,
  activeRevisionId: row.active_revision_id,
  activeFileId: row.active_file_id,
  createdByUserId: row.created_by_user_id,
  createdAt: row.created_at,
  updatedAt: row.updated_at,
  slaStartedAt: row.sla_started_at,
  file: row.file_id ? {
    fileId: row.file_id,
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
    isActive: Boolean(row.file_is_active),
  } : null,
  revisionRecord: row.revision_id ? {
    id: row.revision_id,
    projectId: row.revision_project_id,
    documentId: row.revision_document_id,
    revision: row.revision_revision_label,
    revisionSequence: Number(row.revision_sequence),
    fileId: row.revision_file_id,
    storagePathLegacy: row.storage_path_legacy,
    isActive: Boolean(row.revision_is_active),
    createdAt: row.revision_created_at,
    createdByUserId: row.revision_created_by_user_id,
  } : null,
});

const runInTransaction = async (callback) => {
  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();
    const result = await callback(connection);
    await connection.commit();

    return result;
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
};

const findDocumentTypeByDrawing = async (drawing) => {
  const documentTypeCode = drawing === 'P&ID' ? 'PID' : drawing;
  const [rows] = await pool.execute(
    `
      SELECT id, document_type_code, document_type_name, drawing_context
      FROM document_types
      WHERE document_type_code = ? OR drawing_context = ?
      LIMIT 1
    `,
    [documentTypeCode, drawing]
  );

  return rows[0] || null;
};

const findDocumentByProjectAndNumber = async ({ documentNumber, projectId }) => {
  const [rows] = await pool.execute(
    `
      SELECT id, project_id, document_number
      FROM engineering_documents
      WHERE project_id = ? AND document_number = ?
      LIMIT 1
    `,
    [projectId, documentNumber]
  );

  return rows[0] || null;
};

const insertDocument = async (connection, document) => {
  await connection.execute(
    `
      INSERT INTO engineering_documents (
        id, project_id, document_type_id, document_number, description, drawing, area,
        days_until_validation, workflow_status, lifecycle_status, revision_label,
        responsible_role, current_assignee_user_id, created_by_user_id, updated_by_user_id,
        sla_started_at
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, UTC_TIMESTAMP(3))
    `,
    [
      document.id,
      document.projectId,
      document.documentTypeId,
      document.documentNumber,
      document.description,
      document.drawing,
      document.area,
      document.daysUntilValidation,
      document.workflowStatus,
      document.lifecycleStatus,
      document.revisionLabel,
      document.responsibleRole,
      document.currentAssigneeUserId,
      document.createdByUserId,
      document.createdByUserId,
    ]
  );
};

const insertStoredFile = async (connection, storedFile) => {
  await connection.execute(
    `
      INSERT INTO stored_files (
        file_id, project_id, document_id, original_file_name, physical_file_name,
        file_extension, mime_type, file_size, storage_key, relative_path, file_category,
        checksum, uploaded_by_user_id, uploaded_at, is_active
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, UTC_TIMESTAMP(3), ?)
    `,
    [
      storedFile.fileId,
      storedFile.projectId,
      storedFile.documentId,
      storedFile.originalFileName,
      storedFile.physicalFileName,
      storedFile.extension,
      storedFile.mimeType,
      storedFile.fileSize,
      storedFile.storageKey,
      storedFile.relativePath,
      storedFile.fileCategory,
      storedFile.checksum,
      storedFile.uploadedByUserId,
      storedFile.isActive ? 1 : 0,
    ]
  );
};

const insertRevision = async (connection, revision) => {
  await connection.execute(
    `
      INSERT INTO document_revisions (
        id, project_id, document_id, revision_label, revision_sequence, file_id,
        storage_path_legacy, is_active, source_status, result_status, created_by_user_id
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `,
    [
      revision.id,
      revision.projectId,
      revision.documentId,
      revision.revisionLabel,
      revision.revisionSequence,
      revision.fileId,
      revision.storagePathLegacy,
      revision.isActive ? 1 : 0,
      revision.sourceStatus,
      revision.resultStatus,
      revision.createdByUserId,
    ]
  );
};

const updateDocumentActivePointers = async (connection, { activeFileId, activeRevisionId, documentId, updatedByUserId }) => {
  await connection.execute(
    `
      UPDATE engineering_documents
      SET active_file_id = ?,
          active_revision_id = ?,
          updated_by_user_id = ?
      WHERE id = ?
    `,
    [activeFileId, activeRevisionId, updatedByUserId, documentId]
  );
};

const findDocumentFoundationById = async (documentId) => {
  const [rows] = await pool.execute(
    `
      SELECT
        documents.*,
        stored_files.file_id,
        stored_files.original_file_name,
        stored_files.physical_file_name,
        stored_files.file_extension,
        stored_files.mime_type,
        stored_files.file_size,
        stored_files.storage_key,
        stored_files.relative_path,
        stored_files.file_category,
        stored_files.checksum,
        stored_files.uploaded_by_user_id,
        stored_files.uploaded_at,
        stored_files.is_active AS file_is_active,
        revisions.id AS revision_id,
        revisions.project_id AS revision_project_id,
        revisions.document_id AS revision_document_id,
        revisions.revision_label AS revision_revision_label,
        revisions.revision_sequence,
        revisions.file_id AS revision_file_id,
        revisions.storage_path_legacy,
        revisions.is_active AS revision_is_active,
        revisions.created_at AS revision_created_at,
        revisions.created_by_user_id AS revision_created_by_user_id
      FROM engineering_documents documents
      LEFT JOIN stored_files ON stored_files.file_id = documents.active_file_id
      LEFT JOIN document_revisions revisions ON revisions.id = documents.active_revision_id
      WHERE documents.id = ?
      LIMIT 1
    `,
    [documentId]
  );

  return mapDocumentFoundationRow(rows[0]);
};

module.exports = {
  findDocumentByProjectAndNumber,
  findDocumentFoundationById,
  findDocumentTypeByDrawing,
  insertDocument,
  insertRevision,
  insertStoredFile,
  runInTransaction,
  updateDocumentActivePointers,
};
