const { pool } = require('../config/database');

const findPermissionsByRoleId = async (roleId) => {
  const [rows] = await pool.execute(
    `
      SELECT
        permissions.id,
        permissions.permission_code,
        permissions.permission_name
      FROM role_permissions
      INNER JOIN permissions ON permissions.id = role_permissions.permission_id
      WHERE role_permissions.role_id = ?
      ORDER BY permissions.permission_code ASC
    `,
    [roleId]
  );

  return rows.map((row) => ({
    id: row.id,
    code: row.permission_code,
    name: row.permission_name,
  }));
};

const findRoleByName = async (roleName) => {
  const [rows] = await pool.execute(
    `
      SELECT id, role_code, role_name, is_active
      FROM roles
      WHERE role_name = ?
      LIMIT 1
    `,
    [roleName]
  );

  const row = rows[0];

  return row && {
    id: row.id,
    roleCode: row.role_code,
    roleName: row.role_name,
    isActive: Boolean(row.is_active),
  };
};

module.exports = {
  findPermissionsByRoleId,
  findRoleByName,
};
