const { pool } = require('../config/database');

const mapUserRow = (row) => {
  if (!row) {
    return null;
  }

  return {
    id: row.id,
    userCode: row.user_code,
    username: row.username,
    fullName: row.full_name,
    email: row.email,
    departmentId: row.department_id,
    departmentNameSnapshot: row.department_name_snapshot,
    position: row.position,
    roleId: row.role_id,
    status: row.status,
    passwordChangedAt: row.password_changed_at,
    passwordChangedAtEpoch: row.password_changed_at_epoch,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    role: row.role_id
      ? {
          id: row.role_id,
          roleCode: row.role_code,
          roleName: row.role_name,
          isActive: Boolean(row.role_is_active),
        }
      : null,
  };
};

const findUserCredentialByUsername = async (username) => {
  const [rows] = await pool.execute(
    `
      SELECT
        users.id,
        users.user_code,
        users.username,
        users.full_name,
        users.email,
        users.department_id,
        users.department_name_snapshot,
        users.position,
        users.role_id,
        users.status,
        users.created_at,
        users.updated_at,
        roles.role_code,
        roles.role_name,
        roles.is_active AS role_is_active,
        user_credentials.password_hash,
        user_credentials.is_active AS credential_is_active,
        user_credentials.password_changed_at,
        TIMESTAMPDIFF(MICROSECOND, '1970-01-01 00:00:00', user_credentials.password_changed_at) / 1000000 AS password_changed_at_epoch
      FROM users
      INNER JOIN user_credentials ON user_credentials.user_id = users.id
      INNER JOIN roles ON roles.id = users.role_id
      WHERE users.username = ?
      LIMIT 1
    `,
    [username]
  );

  const row = rows[0];

  if (!row) {
    return null;
  }

  return {
    user: mapUserRow(row),
    passwordHash: row.password_hash,
    credentialIsActive: Boolean(row.credential_is_active),
  };
};

const findActiveUserById = async (userId) => {
  const [rows] = await pool.execute(
    `
      SELECT
        users.id,
        users.user_code,
        users.username,
        users.full_name,
        users.email,
        users.department_id,
        users.department_name_snapshot,
        users.position,
        users.role_id,
        users.status,
        users.created_at,
        users.updated_at,
        roles.role_code,
        roles.role_name,
        roles.is_active AS role_is_active,
        user_credentials.is_active AS credential_is_active,
        user_credentials.password_changed_at,
        TIMESTAMPDIFF(MICROSECOND, '1970-01-01 00:00:00', user_credentials.password_changed_at) / 1000000 AS password_changed_at_epoch
      FROM users
      INNER JOIN user_credentials ON user_credentials.user_id = users.id
      INNER JOIN roles ON roles.id = users.role_id
      WHERE users.id = ?
      LIMIT 1
    `,
    [userId]
  );

  const row = rows[0];

  if (!row || row.status !== 'Active' || Number(row.credential_is_active) !== 1) {
    return null;
  }

  return mapUserRow(row);
};

const findCredentialByUserId = async (userId) => {
  const [rows] = await pool.execute(
    `
      SELECT
        users.id AS user_id,
        users.status,
        user_credentials.password_hash,
        user_credentials.is_active AS credential_is_active,
        user_credentials.password_changed_at
      FROM users
      INNER JOIN user_credentials ON user_credentials.user_id = users.id
      WHERE users.id = ?
      LIMIT 1
    `,
    [userId]
  );

  const row = rows[0];

  if (!row) {
    return null;
  }

  return {
    userId: row.user_id,
    userStatus: row.status,
    passwordHash: row.password_hash,
    credentialIsActive: Boolean(row.credential_is_active),
    passwordChangedAt: row.password_changed_at,
  };
};

const createRefreshSession = async ({
  sessionId,
  sessionFamilyId,
  deviceId,
  userId,
  refreshTokenHash,
  expiresAt,
  deviceName,
  ipAddress,
}) => {
  await pool.execute(
    `
      INSERT INTO refresh_sessions (
        id,
        user_id,
        session_family_id,
        device_id,
        device_name,
        refresh_token_hash,
        issued_at,
        expires_at,
        created_ip,
        last_ip
      )
      VALUES (?, ?, ?, ?, ?, ?, UTC_TIMESTAMP(3), ?, ?, ?)
    `,
    [sessionId, userId, sessionFamilyId, deviceId, deviceName, refreshTokenHash, expiresAt, ipAddress, ipAddress]
  );

  return {
    sessionId,
    sessionFamilyId,
  };
};

const findValidRefreshSession = async ({ sessionId, refreshTokenHash }) => {
  const [rows] = await pool.execute(
    `
      SELECT id, user_id, refresh_token_hash, revoked_at, expires_at
      FROM refresh_sessions
      WHERE id = ?
        AND refresh_token_hash = ?
        AND revoked_at IS NULL
        AND expires_at > UTC_TIMESTAMP(3)
      LIMIT 1
    `,
    [sessionId, refreshTokenHash]
  );

  return rows[0] || null;
};

const touchRefreshSession = async ({ sessionId, ipAddress }) => {
  await pool.execute(
    `
      UPDATE refresh_sessions
      SET last_used_at = UTC_TIMESTAMP(3), last_ip = ?
      WHERE id = ?
    `,
    [ipAddress, sessionId]
  );
};

const revokeRefreshSession = async ({ sessionId, refreshTokenHash, reason }) => {
  await pool.execute(
    `
      UPDATE refresh_sessions
      SET revoked_at = UTC_TIMESTAMP(3), revoked_reason = ?
      WHERE id = ? AND refresh_token_hash = ? AND revoked_at IS NULL
    `,
    [reason, sessionId, refreshTokenHash]
  );
};

const changePasswordAndRevokeSessions = async ({ userId, passwordHash }) => {
  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    const [passwordResult] = await connection.execute(
      `
        UPDATE user_credentials
        SET password_hash = ?, updated_at = UTC_TIMESTAMP(3), password_changed_at = UTC_TIMESTAMP(3)
        WHERE user_id = ? AND is_active = 1
      `,
      [passwordHash, userId]
    );

    if (passwordResult.affectedRows !== 1) {
      const error = new Error('Credential is invalid');
      error.statusCode = 401;
      throw error;
    }

    await connection.execute(
      `
        UPDATE refresh_sessions
        SET revoked_at = UTC_TIMESTAMP(3), revoked_reason = 'Password Change'
        WHERE user_id = ? AND revoked_at IS NULL
      `,
      [userId]
    );

    await connection.commit();
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
};

module.exports = {
  findUserCredentialByUsername,
  findActiveUserById,
  findCredentialByUserId,
  createRefreshSession,
  findValidRefreshSession,
  touchRefreshSession,
  revokeRefreshSession,
  changePasswordAndRevokeSessions,
};
