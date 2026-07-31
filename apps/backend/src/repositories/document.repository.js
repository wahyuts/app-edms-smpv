const { pool } = require('../config/database');

const mapFileMetadata = (row) => row.file_id ? ({
  fileId: row.file_id,
  originalFileName: row.original_file_name,
  physicalFileName: row.physical_file_name,
  extension: row.file_extension,
  mimeType: row.mime_type,
  fileSize: Number(row.file_size),
  fileCategory: row.file_category,
  checksum: row.checksum,
  uploadedByUserId: row.uploaded_by_user_id,
  uploadedBy: row.uploaded_by_name,
  uploadedAt: row.uploaded_at,
  isActive: Boolean(row.file_is_active),
}) : null;

const evaluateSla = (row) => {
  const formatWibTimestamp = (value) => {
    if (!value) return null;
    return new Intl.DateTimeFormat('en-GB', {
      day: '2-digit',
      hour: '2-digit',
      hour12: false,
      minute: '2-digit',
      month: 'short',
      second: '2-digit',
      timeZone: 'Asia/Jakarta',
      year: 'numeric',
    }).format(new Date(value)) + ' WIB';
  };

  if (row.workflow_status === 'Approved') {
    const startedAt = row.sla_started_at ? new Date(row.sla_started_at) : null;
    const stoppedAt = row.sla_stopped_at ? new Date(row.sla_stopped_at) : startedAt;
    const totalMinutes = startedAt && stoppedAt
      ? Math.max(0, Math.floor((stoppedAt.getTime() - startedAt.getTime()) / 60000))
      : 0;

    return {
      slaStatus: 'Final As-Built',
      slaTimer: {
        calculatedAt: stoppedAt,
        calculatedAtWib: formatWibTimestamp(stoppedAt),
        days: Math.floor(totalMinutes / 1440),
        display: 'Done',
        hours: Math.floor((totalMinutes % 1440) / 60),
        minutes: totalMinutes % 60,
        startedAt,
        startedAtWib: formatWibTimestamp(startedAt),
        stoppedAt,
        stoppedAtWib: formatWibTimestamp(stoppedAt),
        totalMinutes,
      },
    };
  }

  const startedAt = row.sla_started_at ? new Date(row.sla_started_at) : null;
  if (!startedAt || Number.isNaN(startedAt.getTime())) {
    return {
      slaStatus: null,
      slaTimer: null,
    };
  }

  const calculatedAt = new Date();
  const totalMinutes = Math.max(0, Math.floor((calculatedAt.getTime() - startedAt.getTime()) / 60000));
  const days = Math.floor(totalMinutes / 1440);
  const hours = Math.floor((totalMinutes % 1440) / 60);
  const minutes = totalMinutes % 60;
  const validationDays = Math.max(0, Number(row.days_until_validation) || 0);
  const slaStatus = days < validationDays
    ? 'On Track'
    : days === validationDays
      ? 'At Risk'
      : 'Overdue';

  return {
    slaStatus,
    slaTimer: {
      calculatedAt,
      calculatedAtWib: formatWibTimestamp(calculatedAt),
      days,
      display: `${days}d ${hours}h ${minutes}m`,
      hours,
      minutes,
      startedAt,
      startedAtWib: formatWibTimestamp(startedAt),
      stoppedAt: null,
      stoppedAtWib: null,
      totalMinutes,
    },
  };
};

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

const mapDocumentRegisterRow = (row) => row && ({
  id: row.id,
  projectId: row.project_id,
  projectCode: row.project_code,
  projectName: row.project_name,
  documentTypeId: row.document_type_id,
  documentTypeCode: row.document_type_code,
  documentTypeName: row.document_type_name,
  documentNumber: row.document_number,
  description: row.description,
  drawing: row.drawing,
  area: row.area,
  revision: row.revision_label,
  revisionLabel: row.revision_label,
  status: row.workflow_status,
  workflowStatus: row.workflow_status,
  lifecycle: row.lifecycle_status,
  lifecycleStatus: row.lifecycle_status,
  responsibleRole: row.responsible_role,
  currentAssigneeUserId: row.current_assignee_user_id,
  currentAssignee: row.current_assignee_name,
  currentAssigneeName: row.current_assignee_name,
  daysUntilValidation: Number(row.days_until_validation),
  slaStartedAt: row.sla_started_at,
  slaStoppedAt: row.sla_stopped_at,
  slaAssigneeNameSnapshot: row.sla_assignee_name_snapshot,
  createdDate: row.created_at,
  createdAt: row.created_at,
  createdByUserId: row.created_by_user_id,
  createdBy: row.created_by_name,
  lastUpdated: row.updated_at,
  updatedAt: row.updated_at,
  updatedByUserId: row.updated_by_user_id,
  lastUpdatedBy: row.updated_by_name,
  archivedAt: row.archived_at,
  archivedByUserId: row.archived_by_user_id,
  archiveReason: row.archive_reason,
  restoredAt: row.restored_at,
  restoredByUserId: row.restored_by_user_id,
  activeRevisionId: row.active_revision_id,
  activeFileId: row.active_file_id,
  fileMetadata: mapFileMetadata(row),
  activeFile: mapFileMetadata(row),
  hasUnreadComments: Number(row.unread_comment_count || 0) > 0,
  unreadCommentCount: Number(row.unread_comment_count || 0),
  ...evaluateSla(row),
});

const mapDocumentHistoryRow = (row) => row && ({
  id: row.id,
  projectId: row.project_id,
  documentId: row.document_id,
  workflowEvent: row.workflow_event,
  activity: row.activity,
  status: row.workflow_status,
  workflowStatus: row.workflow_status,
  revision: row.revision_label,
  revisionLabel: row.revision_label,
  lifecycle: row.lifecycle_status,
  lifecycleStatus: row.lifecycle_status,
  reason: row.reason,
  createdDate: row.created_at,
  createdAt: row.created_at,
  createdByUserId: row.created_by_user_id,
  createdBy: row.created_by_name_snapshot,
  createdByOfficialRole: row.created_by_official_role_snapshot,
  actorOfficialRole: row.created_by_official_role_snapshot,
});

const mapWorkflowCommentRow = (row) => row && ({
  id: row.id,
  projectId: row.project_id,
  documentId: row.document_id,
  revisionId: row.revision_id,
  workflowAction: row.workflow_action,
  workflowComment: row.workflow_comment,
  createdByUserId: row.created_by_user_id,
  createdBy: row.created_by_name_snapshot,
  createdByOfficialRole: row.created_by_official_role_snapshot,
  createdDate: row.created_at,
  createdAt: row.created_at,
  attachment: row.attachment_id ? {
    attachmentId: row.attachment_id,
    fileId: row.attachment_file_id,
    originalFileName: row.attachment_original_file_name,
    mimeType: row.attachment_mime_type,
    fileSize: Number(row.attachment_file_size),
    uploadedAt: row.attachment_uploaded_at,
  } : null,
});

const mapDocumentRevisionRow = (row) => row && ({
  id: row.id,
  projectId: row.project_id,
  documentId: row.document_id,
  revision: row.revision_label,
  revisionLabel: row.revision_label,
  revisionSequence: Number(row.revision_sequence),
  sourceStatus: row.source_status,
  resultStatus: row.result_status,
  isActive: Boolean(row.is_active),
  createdAt: row.created_at,
  uploadedAt: row.created_at,
  createdByUserId: row.created_by_user_id,
  uploader: row.created_by_name,
  uploadedBy: row.created_by_name,
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
    uploadedAt: row.file_uploaded_at,
    isActive: Boolean(row.file_is_active),
  } : null,
});

const documentRegisterSelect = `
  SELECT
    documents.id,
    documents.project_id,
    documents.document_type_id,
    documents.document_number,
    documents.description,
    documents.drawing,
    documents.area,
    documents.days_until_validation,
    documents.workflow_status,
    documents.lifecycle_status,
    documents.revision_label,
    documents.responsible_role,
    documents.current_assignee_user_id,
    documents.active_revision_id,
    documents.active_file_id,
    documents.created_by_user_id,
    documents.created_at,
    documents.updated_at,
    documents.updated_by_user_id,
    documents.archived_at,
    documents.archived_by_user_id,
    documents.archive_reason,
    documents.restored_at,
    documents.restored_by_user_id,
    documents.sla_started_at,
    documents.sla_stopped_at,
    documents.sla_assignee_name_snapshot,
    projects.project_code,
    projects.project_name,
    document_types.document_type_code,
    document_types.document_type_name,
    current_assignee.full_name AS current_assignee_name,
    created_by.full_name AS created_by_name,
    updated_by.full_name AS updated_by_name,
    stored_files.file_id,
    stored_files.original_file_name,
    stored_files.physical_file_name,
    stored_files.file_extension,
    stored_files.mime_type,
    stored_files.file_size,
    stored_files.file_category,
    stored_files.checksum,
    stored_files.uploaded_by_user_id,
    stored_files.uploaded_at,
    stored_files.is_active AS file_is_active,
    uploaded_by.full_name AS uploaded_by_name,
    (
      SELECT COUNT(*)
      FROM workflow_comments unread_comments
      LEFT JOIN comment_read_receipts read_receipts
        ON read_receipts.comment_id = unread_comments.id
       AND read_receipts.user_id = ?
      WHERE unread_comments.project_id = documents.project_id
        AND unread_comments.document_id = documents.id
        AND unread_comments.created_by_user_id <> ?
        AND read_receipts.id IS NULL
    ) AS unread_comment_count
  FROM engineering_documents documents
  INNER JOIN projects ON projects.id = documents.project_id
  LEFT JOIN document_types ON document_types.id = documents.document_type_id
  LEFT JOIN users current_assignee ON current_assignee.id = documents.current_assignee_user_id
  LEFT JOIN users created_by ON created_by.id = documents.created_by_user_id
  LEFT JOIN users updated_by ON updated_by.id = documents.updated_by_user_id
  LEFT JOIN stored_files ON stored_files.file_id = documents.active_file_id
  LEFT JOIN users uploaded_by ON uploaded_by.id = stored_files.uploaded_by_user_id
`;

const registerSortColumns = Object.freeze({
  area: 'documents.area',
  createdAt: 'documents.created_at',
  createdDate: 'documents.created_at',
  currentAssignee: 'current_assignee.full_name',
  daysUntilValidation: 'documents.days_until_validation',
  documentNumber: 'documents.document_number',
  drawing: 'documents.drawing',
  lastUpdated: 'documents.updated_at',
  revision: 'documents.revision_label',
  status: 'documents.workflow_status',
  updatedAt: 'documents.updated_at',
});

const buildRegisterWhere = ({
  area,
  currentAssigneeUserId,
  drawing,
  lifecycle,
  projectId,
  revision,
  search,
  status,
}) => {
  const conditions = ['documents.project_id = ?'];
  const params = [projectId];

  if (search) {
    conditions.push(`(
      documents.document_number LIKE ?
      OR documents.description LIKE ?
      OR documents.drawing LIKE ?
      OR documents.area LIKE ?
      OR documents.revision_label LIKE ?
      OR documents.workflow_status LIKE ?
      OR documents.lifecycle_status LIKE ?
      OR current_assignee.full_name LIKE ?
    )`);
    params.push(
      `%${search}%`,
      `%${search}%`,
      `%${search}%`,
      `%${search}%`,
      `%${search}%`,
      `%${search}%`,
      `%${search}%`,
      `%${search}%`
    );
  }
  if (drawing) {
    conditions.push('documents.drawing = ?');
    params.push(drawing);
  }
  if (area) {
    conditions.push('documents.area = ?');
    params.push(area);
  }
  if (status) {
    conditions.push('documents.workflow_status = ?');
    params.push(status);
  }
  if (lifecycle) {
    conditions.push('documents.lifecycle_status = ?');
    params.push(lifecycle);
  }
  if (revision) {
    conditions.push('documents.revision_label = ?');
    params.push(revision);
  }
  if (currentAssigneeUserId) {
    conditions.push('documents.current_assignee_user_id = ?');
    params.push(currentAssigneeUserId);
  }

  return {
    clause: `WHERE ${conditions.join(' AND ')}`,
    params,
  };
};

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

const listDocumentRegister = async ({
  area,
  currentAssigneeUserId,
  direction,
  drawing,
  lifecycle,
  limit,
  offset,
  projectId,
  revision,
  search,
  sortBy,
  status,
  userId = 0,
}) => {
  const where = buildRegisterWhere({
    area,
    currentAssigneeUserId,
    drawing,
    lifecycle,
    projectId,
    revision,
    search,
    status,
  });
  const sortColumn = registerSortColumns[sortBy] || registerSortColumns.lastUpdated;
  const order = direction === 'asc' ? 'ASC' : 'DESC';

  const [rows] = await pool.query(
    `
      ${documentRegisterSelect}
      ${where.clause}
      ORDER BY ${sortColumn} ${order}, documents.id ASC
      LIMIT ? OFFSET ?
    `,
    [userId || 0, userId || 0, ...where.params, limit, offset]
  );
  const [countRows] = await pool.query(
    `
      SELECT COUNT(*) AS total
      FROM engineering_documents documents
      LEFT JOIN users current_assignee ON current_assignee.id = documents.current_assignee_user_id
      ${where.clause}
    `,
    where.params
  );

  return {
    rows: rows.map(mapDocumentRegisterRow),
    totalItems: Number(countRows[0]?.total || 0),
  };
};

const findDocumentRegisterById = async (documentId, { userId = 0 } = {}) => {
  const [rows] = await pool.execute(
    `
      ${documentRegisterSelect}
      WHERE documents.id = ?
      LIMIT 1
    `,
    [userId || 0, userId || 0, documentId]
  );

  return mapDocumentRegisterRow(rows[0]);
};

const listProjectDocumentRegister = async (projectId, { userId = 0 } = {}) => {
  const [rows] = await pool.execute(
    `
      ${documentRegisterSelect}
      WHERE documents.project_id = ?
      ORDER BY documents.updated_at DESC, documents.id ASC
    `,
    [userId || 0, userId || 0, projectId]
  );

  return rows.map(mapDocumentRegisterRow);
};

const markWorkflowCommentsReadForUser = async ({ documentId, projectId, userId }) => {
  const [result] = await pool.execute(
    `
      INSERT IGNORE INTO comment_read_receipts (
        id, project_id, document_id, comment_id, user_id, read_at
      )
      SELECT
        CONCAT(?, ':', workflow_comments.id),
        workflow_comments.project_id,
        workflow_comments.document_id,
        workflow_comments.id,
        ?,
        UTC_TIMESTAMP(3)
      FROM workflow_comments
      WHERE workflow_comments.project_id = ?
        AND workflow_comments.document_id = ?
        AND workflow_comments.created_by_user_id <> ?
    `,
    [userId, userId, projectId, documentId, userId]
  );

  return Number(result.affectedRows || 0);
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

const updateDocumentMetadata = async (connection, {
  area,
  daysUntilValidation,
  description,
  documentId,
  documentTypeId,
  drawing,
  updatedByUserId,
}) => {
  await connection.execute(
    `
      UPDATE engineering_documents
      SET description = ?,
          drawing = ?,
          area = ?,
          days_until_validation = ?,
          document_type_id = ?,
          updated_by_user_id = ?
      WHERE id = ?
    `,
    [
      description,
      drawing,
      area,
      daysUntilValidation,
      documentTypeId,
      updatedByUserId,
      documentId,
    ]
  );
};

const updateDocumentLifecycleStatus = async (connection, {
  archiveReason = null,
  documentId,
  lifecycleStatus,
  updatedByUserId,
}) => {
  const isArchive = lifecycleStatus === 'Archived';

  await connection.execute(
    `
      UPDATE engineering_documents
      SET lifecycle_status = ?,
          updated_by_user_id = ?,
          archived_at = ${isArchive ? 'UTC_TIMESTAMP(3)' : 'NULL'},
          archived_by_user_id = ${isArchive ? '?' : 'NULL'},
          archive_reason = ${isArchive ? '?' : 'NULL'},
          restored_at = ${isArchive ? 'restored_at' : 'UTC_TIMESTAMP(3)'},
          restored_by_user_id = ${isArchive ? 'restored_by_user_id' : '?'}
      WHERE id = ?
    `,
    isArchive
      ? [lifecycleStatus, updatedByUserId, updatedByUserId, archiveReason || null, documentId]
      : [lifecycleStatus, updatedByUserId, updatedByUserId, documentId]
  );
};

const updateDocumentWorkflowState = async (connection, {
  currentAssigneeUserId,
  documentId,
  responsibleRole,
  revisionLabel,
  resetSla = false,
  slaStoppedAtExpression = null,
  updatedByUserId,
  workflowStatus,
}) => {
  await connection.query(
    `
      UPDATE engineering_documents
      SET workflow_status = ?,
          revision_label = ?,
          responsible_role = ?,
          current_assignee_user_id = ?,
          updated_by_user_id = ?,
          sla_started_at = ${resetSla ? 'UTC_TIMESTAMP(3)' : 'sla_started_at'},
          sla_stopped_at = ${slaStoppedAtExpression || 'sla_stopped_at'}
      WHERE id = ?
    `,
    [
      workflowStatus,
      revisionLabel,
      responsibleRole,
      currentAssigneeUserId,
      updatedByUserId,
      documentId,
    ]
  );
};

const insertDocumentHistory = async (connection, history) => {
  await connection.execute(
    `
      INSERT INTO document_history (
        id, project_id, document_id, workflow_event, activity, workflow_status,
        revision_label, lifecycle_status, reason, created_by_user_id,
        created_by_name_snapshot, created_by_official_role_snapshot
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `,
    [
      history.id,
      history.projectId,
      history.documentId,
      history.workflowEvent,
      history.activity,
      history.workflowStatus,
      history.revisionLabel,
      history.lifecycleStatus,
      history.reason,
      history.createdByUserId,
      history.createdByNameSnapshot,
      history.createdByOfficialRoleSnapshot,
    ]
  );
};

const insertWorkflowComment = async (connection, comment) => {
  await connection.execute(
    `
      INSERT INTO workflow_comments (
        id, project_id, document_id, revision_id, workflow_action, workflow_comment,
        created_by_user_id, created_by_name_snapshot, created_by_official_role_snapshot
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `,
    [
      comment.id,
      comment.projectId,
      comment.documentId,
      comment.revisionId,
      comment.workflowAction,
      comment.workflowComment,
      comment.createdByUserId,
      comment.createdByNameSnapshot,
      comment.createdByOfficialRoleSnapshot,
    ]
  );
};

const updateRevisionLabel = async (connection, { revisionId, revisionLabel }) => {
  if (!revisionId) return;

  await connection.execute(
    `
      UPDATE document_revisions
      SET revision_label = ?
      WHERE id = ?
    `,
    [revisionLabel, revisionId]
  );
};

const updateRevisionStoragePath = async (connection, { revisionId, storagePathLegacy }) => {
  if (!revisionId) return;

  await connection.execute(
    `
      UPDATE document_revisions
      SET storage_path_legacy = ?
      WHERE id = ?
    `,
    [storagePathLegacy, revisionId]
  );
};

const updateStoredFileStorageMetadata = async (connection, {
  fileId,
  physicalFileName,
  storageKey,
}) => {
  await connection.execute(
    `
      UPDATE stored_files
      SET physical_file_name = ?,
          storage_key = ?,
          relative_path = ?
      WHERE file_id = ?
    `,
    [physicalFileName, storageKey, storageKey, fileId]
  );
};

const getNextRevisionSequence = async (documentId) => {
  const [rows] = await pool.execute(
    `
      SELECT COALESCE(MAX(revision_sequence), 0) + 1 AS next_sequence
      FROM document_revisions
      WHERE document_id = ?
    `,
    [documentId]
  );

  return Number(rows[0]?.next_sequence || 1);
};

const deactivateDocumentRevisions = async (connection, documentId) => {
  await connection.execute(
    `
      UPDATE document_revisions
      SET is_active = 0
      WHERE document_id = ?
        AND is_active = 1
    `,
    [documentId]
  );
};

const deactivateDocumentRevisionFiles = async (connection, documentId) => {
  await connection.execute(
    `
      UPDATE stored_files
      SET is_active = 0
      WHERE document_id = ?
        AND file_category = 'Revision File'
        AND is_active = 1
    `,
    [documentId]
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

const listDocumentHistory = async ({ documentId, projectId }) => {
  const [rows] = await pool.execute(
    `
      SELECT *
      FROM document_history
      WHERE project_id = ?
        AND document_id = ?
      ORDER BY created_at DESC, id DESC
    `,
    [projectId, documentId]
  );

  return rows.map(mapDocumentHistoryRow);
};

const listWorkflowComments = async ({ documentId, projectId }) => {
  const [rows] = await pool.execute(
    `
      SELECT
        workflow_comments.*,
        workflow_attachments.attachment_id,
        workflow_attachments.file_id AS attachment_file_id,
        workflow_attachments.uploaded_at AS attachment_uploaded_at,
        stored_files.original_file_name AS attachment_original_file_name,
        stored_files.mime_type AS attachment_mime_type,
        stored_files.file_size AS attachment_file_size
      FROM workflow_comments
      LEFT JOIN workflow_attachments ON workflow_attachments.comment_id = workflow_comments.id
      LEFT JOIN stored_files ON stored_files.file_id = workflow_attachments.file_id
      WHERE workflow_comments.project_id = ?
        AND workflow_comments.document_id = ?
      ORDER BY workflow_comments.created_at DESC, workflow_comments.id DESC
    `,
    [projectId, documentId]
  );

  return rows.map(mapWorkflowCommentRow);
};

const listDocumentRevisions = async ({ documentId, projectId }) => {
  const [rows] = await pool.execute(
    `
      SELECT
        revisions.*,
        created_by.full_name AS created_by_name,
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
        stored_files.uploaded_at AS file_uploaded_at,
        stored_files.is_active AS file_is_active
      FROM document_revisions revisions
      LEFT JOIN users created_by ON created_by.id = revisions.created_by_user_id
      LEFT JOIN stored_files ON stored_files.file_id = revisions.file_id
      WHERE revisions.project_id = ?
        AND revisions.document_id = ?
      ORDER BY revisions.revision_sequence DESC, revisions.created_at DESC, revisions.id DESC
    `,
    [projectId, documentId]
  );

  return rows.map(mapDocumentRevisionRow);
};

module.exports = {
  findDocumentByProjectAndNumber,
  findDocumentFoundationById,
  findDocumentRegisterById,
  findDocumentTypeByDrawing,
  getNextRevisionSequence,
  deactivateDocumentRevisionFiles,
  deactivateDocumentRevisions,
  insertDocument,
  insertDocumentHistory,
  insertRevision,
  insertStoredFile,
  insertWorkflowComment,
  listDocumentHistory,
  listDocumentRegister,
  listDocumentRevisions,
  listProjectDocumentRegister,
  listWorkflowComments,
  markWorkflowCommentsReadForUser,
  runInTransaction,
  updateDocumentLifecycleStatus,
  updateDocumentMetadata,
  updateDocumentWorkflowState,
  updateRevisionLabel,
  updateRevisionStoragePath,
  updateStoredFileStorageMetadata,
  updateDocumentActivePointers,
};
