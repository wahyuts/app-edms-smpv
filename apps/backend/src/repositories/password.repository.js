const { pool } = require('../config/database');

const findActiveUserByUsername = async (username) => {
  const [rows] = await pool.execute(
    `
      SELECT
        users.id,
        users.username,
        users.email,
        users.status,
        user_credentials.is_active AS credential_is_active
      FROM users
      INNER JOIN user_credentials ON user_credentials.user_id = users.id
      WHERE users.username = ?
      LIMIT 1
    `,
    [username]
  );

  const row = rows[0];

  if (!row || row.status !== 'Active' || Number(row.credential_is_active) !== 1) {
    return null;
  }

  return row;
};

const revokeActiveResetTokensByUserId = async (userId) => {
  await pool.execute(
    `
      UPDATE password_reset_tokens
      SET revoked_at = UTC_TIMESTAMP(3)
      WHERE user_id = ?
        AND used_at IS NULL
        AND revoked_at IS NULL
        AND expires_at > UTC_TIMESTAMP(3)
    `,
    [userId]
  );
};

const createResetToken = async ({ id, tokenHash, userId, requestId, expiresAt }) => {
  await pool.execute(
    `
      INSERT INTO password_reset_tokens (
        id,
        token_hash,
        user_id,
        request_id,
        created_at,
        expires_at
      )
      VALUES (?, ?, ?, ?, UTC_TIMESTAMP(3), ?)
    `,
    [id, tokenHash, userId, requestId, expiresAt]
  );
};

const findValidResetToken = async (tokenHash) => {
  const [rows] = await pool.execute(
    `
      SELECT id, user_id, expires_at
      FROM password_reset_tokens
      WHERE token_hash = ?
        AND used_at IS NULL
        AND revoked_at IS NULL
        AND expires_at > UTC_TIMESTAMP(3)
      LIMIT 1
    `,
    [tokenHash]
  );

  return rows[0] || null;
};

const resetPasswordWithToken = async ({ tokenId, userId, passwordHash }) => {
  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    await connection.execute(
      `
        UPDATE user_credentials
        SET password_hash = ?, updated_at = UTC_TIMESTAMP(3), password_changed_at = UTC_TIMESTAMP(3)
        WHERE user_id = ?
      `,
      [passwordHash, userId]
    );

    await connection.execute(
      `
        UPDATE password_reset_tokens
        SET used_at = UTC_TIMESTAMP(3), revoked_at = UTC_TIMESTAMP(3)
        WHERE id = ? AND used_at IS NULL
      `,
      [tokenId]
    );

    await connection.execute(
      `
        UPDATE refresh_sessions
        SET revoked_at = UTC_TIMESTAMP(3), revoked_reason = 'Password Reset'
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
  findActiveUserByUsername,
  revokeActiveResetTokensByUserId,
  createResetToken,
  findValidResetToken,
  resetPasswordWithToken,
};
