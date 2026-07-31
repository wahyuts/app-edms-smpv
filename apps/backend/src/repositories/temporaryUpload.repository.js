const { pool } = require('../config/database');

const mapTemporaryUploadRow = (row) => row && ({
  id: row.id,
  temporaryFileId: row.temporary_file_id,
  storageKey: row.storage_key,
  originalFileName: row.original_file_name,
  physicalFileName: row.physical_file_name,
  mimeType: row.mime_type,
  extension: row.extension,
  fileSize: Number(row.file_size),
  checksum: row.checksum,
  uploadedAt: row.uploaded_at,
  expiresAt: row.expires_at,
  consumedAt: row.consumed_at,
  createdByUserId: row.created_by_user_id,
});

const createTemporaryUpload = async (temporaryUpload) => {
  await pool.execute(
    `
      INSERT INTO temporary_uploads (
        id, temporary_file_id, storage_key, original_file_name, physical_file_name,
        mime_type, extension, file_size, checksum, uploaded_at, expires_at, created_by_user_id
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, UTC_TIMESTAMP(3), DATE_ADD(UTC_TIMESTAMP(3), INTERVAL ? HOUR), ?)
    `,
    [
      temporaryUpload.id,
      temporaryUpload.temporaryFileId,
      temporaryUpload.storageKey,
      temporaryUpload.originalFileName,
      temporaryUpload.physicalFileName,
      temporaryUpload.mimeType,
      temporaryUpload.extension,
      temporaryUpload.fileSize,
      temporaryUpload.checksum,
      temporaryUpload.expiresInHours,
      temporaryUpload.createdByUserId,
    ]
  );

  return findTemporaryUploadByTemporaryFileId(temporaryUpload.temporaryFileId);
};

const findTemporaryUploadByTemporaryFileId = async (temporaryFileId) => {
  const [rows] = await pool.execute(
    `
      SELECT *
      FROM temporary_uploads
      WHERE temporary_file_id = ?
      LIMIT 1
    `,
    [temporaryFileId]
  );

  return mapTemporaryUploadRow(rows[0]);
};

const findAvailableTemporaryUploadByTemporaryFileId = async (temporaryFileId) => {
  const [rows] = await pool.execute(
    `
      SELECT *
      FROM temporary_uploads
      WHERE temporary_file_id = ?
        AND consumed_at IS NULL
        AND expires_at > UTC_TIMESTAMP(3)
      LIMIT 1
    `,
    [temporaryFileId]
  );

  return mapTemporaryUploadRow(rows[0]);
};

const deleteAvailableTemporaryUpload = async (connection, { temporaryFileId }) => {
  const executor = connection || pool;
  const [result] = await executor.execute(
    `
      DELETE FROM temporary_uploads
      WHERE temporary_file_id = ?
        AND consumed_at IS NULL
        AND expires_at > UTC_TIMESTAMP(3)
    `,
    [temporaryFileId]
  );

  return result.affectedRows;
};

const listExpiredUnconsumedTemporaryUploads = async ({ limit = 100 } = {}) => {
  const safeLimit = Math.min(500, Math.max(1, Number.parseInt(limit, 10) || 100));
  const [rows] = await pool.execute(
    `
      SELECT *
      FROM temporary_uploads
      WHERE consumed_at IS NULL
        AND expires_at <= UTC_TIMESTAMP(3)
      ORDER BY expires_at ASC
      LIMIT ?
    `,
    [safeLimit]
  );

  return rows.map(mapTemporaryUploadRow);
};

const deleteExpiredTemporaryUploadById = async (id) => {
  const [result] = await pool.execute(
    `
      DELETE FROM temporary_uploads
      WHERE id = ?
        AND consumed_at IS NULL
        AND expires_at <= UTC_TIMESTAMP(3)
    `,
    [id]
  );

  return result.affectedRows;
};

module.exports = {
  createTemporaryUpload,
  deleteAvailableTemporaryUpload,
  deleteExpiredTemporaryUploadById,
  findAvailableTemporaryUploadByTemporaryFileId,
  findTemporaryUploadByTemporaryFileId,
  listExpiredUnconsumedTemporaryUploads,
};
