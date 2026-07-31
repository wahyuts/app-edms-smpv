const { pool } = require('../config/database');

const mapDepartmentRow = (row) => row && ({
  id: row.id,
  name: row.name,
  departmentName: row.name,
  nameKey: row.name_key,
  status: row.status,
  createdAt: row.created_at,
  updatedAt: row.updated_at,
});

const sortColumns = Object.freeze({
  createdAt: 'departments.created_at',
  name: 'departments.name',
  status: 'departments.status',
  updatedAt: 'departments.updated_at',
});

const buildWhere = ({ search, status }) => {
  const conditions = [];
  const params = [];

  if (search) {
    conditions.push('(departments.name LIKE ? OR departments.name_key LIKE ?)');
    params.push(`%${search}%`, `%${search.toLowerCase()}%`);
  }
  if (status) {
    conditions.push('departments.status = ?');
    params.push(status);
  }

  return {
    clause: conditions.length ? `WHERE ${conditions.join(' AND ')}` : '',
    params,
  };
};

const listDepartments = async ({ direction, limit, offset, search, sortBy, status }) => {
  const where = buildWhere({ search, status });
  const sortColumn = sortColumns[sortBy] || sortColumns.name;
  const order = direction === 'asc' ? 'ASC' : 'DESC';

  const [rows] = await pool.query(
    `
      SELECT id, name, name_key, status, created_at, updated_at
      FROM departments
      ${where.clause}
      ORDER BY ${sortColumn} ${order}, departments.id ASC
      LIMIT ? OFFSET ?
    `,
    [...where.params, limit, offset]
  );
  const [countRows] = await pool.query(
    `SELECT COUNT(*) AS total FROM departments ${where.clause}`,
    where.params
  );

  return {
    rows: rows.map(mapDepartmentRow),
    totalItems: Number(countRows[0]?.total || 0),
  };
};

const findDepartmentById = async (departmentId) => {
  const [rows] = await pool.execute(
    'SELECT id, name, name_key, status, created_at, updated_at FROM departments WHERE id = ? LIMIT 1',
    [departmentId]
  );
  return mapDepartmentRow(rows[0]);
};

const findDepartmentByNameKey = async (nameKey) => {
  const [rows] = await pool.execute(
    'SELECT id, name, name_key, status, created_at, updated_at FROM departments WHERE name_key = ? LIMIT 1',
    [nameKey]
  );
  return mapDepartmentRow(rows[0]);
};

const countUsersByDepartmentId = async (departmentId) => {
  const [rows] = await pool.execute(
    'SELECT COUNT(*) AS total FROM users WHERE department_id = ?',
    [departmentId]
  );
  return Number(rows[0]?.total || 0);
};

const createDepartment = async ({ name, nameKey }) => {
  const [result] = await pool.execute(
    'INSERT INTO departments (name, name_key, status) VALUES (?, ?, ?)',
    [name, nameKey, 'Active']
  );
  return findDepartmentById(result.insertId);
};

const updateDepartment = async ({ departmentId, name, nameKey }) => {
  await pool.execute(
    'UPDATE departments SET name = ?, name_key = ? WHERE id = ?',
    [name, nameKey, departmentId]
  );
  return findDepartmentById(departmentId);
};

const updateDepartmentStatus = async ({ departmentId, status }) => {
  await pool.execute(
    'UPDATE departments SET status = ? WHERE id = ?',
    [status, departmentId]
  );
  return findDepartmentById(departmentId);
};

module.exports = {
  countUsersByDepartmentId,
  createDepartment,
  findDepartmentById,
  findDepartmentByNameKey,
  listDepartments,
  updateDepartment,
  updateDepartmentStatus,
};
