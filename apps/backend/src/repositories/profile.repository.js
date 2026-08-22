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
  status: row.status,
  isActive: row.status === 'Active',
  createdAt: row.created_at,
  updatedAt: row.updated_at,
});

const findUserByEmail = async (email) => {
  const [rows] = await pool.execute(
    `
      SELECT id, username, full_name, email, department_id, department_name_snapshot,
        position, role_id, status, user_code, created_at, updated_at
      FROM users
      WHERE email = ?
      LIMIT 1
    `,
    [email]
  );

  return mapUserRow(rows[0]);
};

const updateCurrentUserProfile = async ({ email, fullName, userId }) => {
  await pool.execute(
    `
      UPDATE users
      SET full_name = ?,
          email = ?
      WHERE id = ?
    `,
    [fullName, email, userId]
  );

  const [rows] = await pool.execute(
    `
      SELECT id, username, full_name, email, department_id, department_name_snapshot,
        position, role_id, status, user_code, created_at, updated_at
      FROM users
      WHERE id = ?
      LIMIT 1
    `,
    [userId]
  );

  return mapUserRow(rows[0]);
};

module.exports = {
  findUserByEmail,
  updateCurrentUserProfile,
};
