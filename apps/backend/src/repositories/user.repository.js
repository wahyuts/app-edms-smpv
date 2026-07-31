const crypto = require('node:crypto');
const { pool } = require('../config/database');

const mapUserRow = (row) => row && ({
  id: row.id,
  userCode: row.user_code,
  username: row.username,
  fullName: row.full_name,
  name: row.full_name,
  email: row.email,
  departmentId: row.department_id,
  department: row.department_name_snapshot,
  departmentNameSnapshot: row.department_name_snapshot,
  position: row.position,
  roleId: row.role_id,
  role: row.role_id
    ? {
        id: row.role_id,
        code: row.role_code,
        name: row.role_name,
        roleCode: row.role_code,
        roleName: row.role_name,
      }
    : null,
  status: row.status,
  isActive: row.status === 'Active',
  createdAt: row.created_at,
  updatedAt: row.updated_at,
});

const sortColumns = Object.freeze({
  createdAt: 'users.created_at',
  email: 'users.email',
  name: 'users.full_name',
  status: 'users.status',
  updatedAt: 'users.updated_at',
  username: 'users.username',
});

const baseSelect = `
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
    roles.role_name
  FROM users
  INNER JOIN roles ON roles.id = users.role_id
`;

const buildWhere = ({ departmentId, search, status }) => {
  const conditions = [];
  const params = [];

  if (search) {
    conditions.push(`(
      users.full_name LIKE ?
      OR users.username LIKE ?
      OR users.email LIKE ?
      OR users.department_name_snapshot LIKE ?
      OR users.status LIKE ?
    )`);
    params.push(`%${search}%`, `%${search}%`, `%${search}%`, `%${search}%`, `%${search}%`);
  }
  if (status) {
    conditions.push('users.status = ?');
    params.push(status);
  }
  if (departmentId) {
    conditions.push('users.department_id = ?');
    params.push(departmentId);
  }

  return {
    clause: conditions.length ? `WHERE ${conditions.join(' AND ')}` : '',
    params,
  };
};

const listUsers = async ({ departmentId, direction, limit, offset, search, sortBy, status }) => {
  const where = buildWhere({ departmentId, search, status });
  const sortColumn = sortColumns[sortBy] || sortColumns.createdAt;
  const order = direction === 'asc' ? 'ASC' : 'DESC';

  const [rows] = await pool.query(
    `
      ${baseSelect}
      ${where.clause}
      ORDER BY ${sortColumn} ${order}, users.id ASC
      LIMIT ? OFFSET ?
    `,
    [...where.params, limit, offset]
  );
  const [countRows] = await pool.query(
    `SELECT COUNT(*) AS total FROM users INNER JOIN roles ON roles.id = users.role_id ${where.clause}`,
    where.params
  );

  return {
    rows: rows.map(mapUserRow),
    totalItems: Number(countRows[0]?.total || 0),
  };
};

const findUserById = async (userId) => {
  const [rows] = await pool.execute(`${baseSelect} WHERE users.id = ? LIMIT 1`, [userId]);
  return mapUserRow(rows[0]);
};

const findUserByUsername = async (username) => {
  const [rows] = await pool.execute(`${baseSelect} WHERE users.username = ? LIMIT 1`, [username]);
  return mapUserRow(rows[0]);
};

const findUserByEmail = async (email) => {
  const [rows] = await pool.execute(`${baseSelect} WHERE users.email = ? LIMIT 1`, [email]);
  return mapUserRow(rows[0]);
};

const findRoleById = async (roleId) => {
  const [rows] = await pool.execute(
    'SELECT id, role_code, role_name, is_active FROM roles WHERE id = ? LIMIT 1',
    [roleId]
  );
  const row = rows[0];
  return row && {
    id: row.id,
    roleCode: row.role_code,
    roleName: row.role_name,
    isActive: Boolean(row.is_active),
  };
};

const findLeastPrivilegedActiveRole = async ({ excludedRoleCode } = {}) => {
  const params = [];
  const excludedRoleCondition = excludedRoleCode ? 'AND roles.role_code <> ?' : '';

  if (excludedRoleCode) {
    params.push(excludedRoleCode);
  }

  const [rows] = await pool.execute(
    `
      SELECT
        roles.id,
        roles.role_code,
        roles.role_name,
        roles.is_active,
        COUNT(role_permissions.permission_id) AS permission_count
      FROM roles
      LEFT JOIN role_permissions ON role_permissions.role_id = roles.id
      WHERE roles.is_active = 1
      ${excludedRoleCondition}
      GROUP BY roles.id, roles.role_code, roles.role_name, roles.is_active
      ORDER BY permission_count ASC, roles.id DESC
      LIMIT 1
    `,
    params
  );
  const row = rows[0];
  return row && {
    id: row.id,
    roleCode: row.role_code,
    roleName: row.role_name,
    isActive: Boolean(row.is_active),
    permissionCount: Number(row.permission_count || 0),
  };
};

const createUserWithCredential = async ({ passwordHash, user }) => {
  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();
    const [userResult] = await connection.execute(
      `
        INSERT INTO users (
          user_code, username, full_name, email, department_id,
          department_name_snapshot, position, role_id, status
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'Active')
      `,
      [
        `USR-PENDING-${crypto.randomUUID()}`,
        user.username,
        user.fullName,
        user.email,
        user.departmentId,
        user.departmentNameSnapshot,
        user.position,
        user.roleId,
      ]
    );
    const userId = userResult.insertId;
    const userCode = `USR-${String(userId).padStart(6, '0')}`;

    await connection.execute(
      'UPDATE users SET user_code = ? WHERE id = ?',
      [userCode, userId]
    );
    await connection.execute(
      `
        INSERT INTO user_credentials (user_id, password_hash, is_active, password_changed_at)
        VALUES (?, ?, 1, UTC_TIMESTAMP(3))
      `,
      [userId, passwordHash]
    );
    await connection.commit();
    return findUserById(userId);
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
};

const updateUser = async ({ userId, user }) => {
  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();
    await connection.execute(
      `
        UPDATE users
        SET full_name = ?,
            email = ?,
            department_id = ?,
            department_name_snapshot = ?,
            position = ?,
            status = ?
        WHERE id = ?
      `,
      [
        user.fullName,
        user.email,
        user.departmentId,
        user.departmentNameSnapshot,
        user.position,
        user.status,
        userId,
      ]
    );
    await connection.execute(
      'UPDATE user_credentials SET is_active = ? WHERE user_id = ?',
      [user.status === 'Active' ? 1 : 0, userId]
    );
    if (user.status === 'Inactive') {
      await connection.execute(
        `
          UPDATE refresh_sessions
          SET revoked_at = UTC_TIMESTAMP(3), revoked_reason = 'Force Logout'
          WHERE user_id = ? AND revoked_at IS NULL
        `,
        [userId]
      );
      await connection.execute(
        `
          UPDATE project_memberships
          SET status = 'Inactive', updated_at = UTC_TIMESTAMP(3)
          WHERE user_id = ? AND status = 'Active'
        `,
        [userId]
      );
      await connection.execute(
        'UPDATE user_project_preferences SET active_project_id = NULL WHERE user_id = ?',
        [userId]
      );
    }
    await connection.commit();
    return findUserById(userId);
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
};

const updateUserStatus = async ({ status, userId }) => {
  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();
    await connection.execute('UPDATE users SET status = ? WHERE id = ?', [status, userId]);
    await connection.execute('UPDATE user_credentials SET is_active = ? WHERE user_id = ?', [
      status === 'Active' ? 1 : 0,
      userId,
    ]);
    if (status === 'Inactive') {
      await connection.execute(
        `
          UPDATE refresh_sessions
          SET revoked_at = UTC_TIMESTAMP(3), revoked_reason = 'Force Logout'
          WHERE user_id = ? AND revoked_at IS NULL
        `,
        [userId]
      );
      await connection.execute(
        `
          UPDATE project_memberships
          SET status = 'Inactive', updated_at = UTC_TIMESTAMP(3)
          WHERE user_id = ? AND status = 'Active'
        `,
        [userId]
      );
      await connection.execute(
        'UPDATE user_project_preferences SET active_project_id = NULL WHERE user_id = ?',
        [userId]
      );
    }
    await connection.commit();
    return findUserById(userId);
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
};

module.exports = {
  createUserWithCredential,
  findLeastPrivilegedActiveRole,
  findRoleById,
  findUserByEmail,
  findUserById,
  findUserByUsername,
  listUsers,
  updateUser,
  updateUserStatus,
};
