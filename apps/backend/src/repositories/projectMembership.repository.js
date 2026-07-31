const { pool } = require('../config/database');
const { ENTITY_STATUS, OFFICIAL_ROLES, PROJECT_STATUS } = require('../constants/administration.constants');

const normalizeLookupText = (value) => String(value || '').trim().toLowerCase();
const officialRoleByLookup = new Map(OFFICIAL_ROLES.map((role) => [normalizeLookupText(role), role]));

const normalizeOfficialRoleValue = (value) => officialRoleByLookup.get(normalizeLookupText(value)) || value;
const normalizeStatusValue = (value, statusValues) => {
  const normalizedValue = normalizeLookupText(value);
  return statusValues.find((status) => normalizeLookupText(status) === normalizedValue) || value;
};

const mapMembershipRow = (row) => row && ({
  id: row.id,
  projectId: row.project_id,
  userId: row.user_id,
  officialRole: normalizeOfficialRoleValue(row.official_role),
  status: normalizeStatusValue(row.status, Object.values(ENTITY_STATUS)),
  assignedBy: row.assigned_by_name,
  assignedByUserId: row.assigned_by_user_id,
  assignedDate: row.assigned_at,
  assignedAt: row.assigned_at,
  lastUpdated: row.updated_at,
  updatedAt: row.updated_at,
  updatedByUserId: row.updated_by_user_id,
  projectCode: row.project_code,
  projectName: row.project_name,
  projectStatus: normalizeStatusValue(row.project_status, Object.values(PROJECT_STATUS)),
  username: row.username,
  userName: row.full_name,
  userStatus: normalizeStatusValue(row.user_status, Object.values(ENTITY_STATUS)),
});

const sortColumns = Object.freeze({
  assignedAt: 'project_memberships.assigned_at',
  assignedDate: 'project_memberships.assigned_at',
  lastUpdated: 'project_memberships.updated_at',
  officialRole: 'project_memberships.official_role',
  projectName: 'projects.project_name',
  status: 'project_memberships.status',
  userName: 'users.full_name',
  username: 'users.username',
});

const baseSelect = `
  SELECT
    project_memberships.id,
    project_memberships.project_id,
    project_memberships.user_id,
    project_memberships.official_role,
    project_memberships.status,
    project_memberships.assigned_by_user_id,
    project_memberships.assigned_at,
    project_memberships.updated_at,
    project_memberships.updated_by_user_id,
    projects.project_code,
    projects.project_name,
    projects.status AS project_status,
    users.username,
    users.full_name,
    users.status AS user_status,
    assigned_by.full_name AS assigned_by_name
  FROM project_memberships
  INNER JOIN projects ON projects.id = project_memberships.project_id
  INNER JOIN users ON users.id = project_memberships.user_id
  LEFT JOIN users assigned_by ON assigned_by.id = project_memberships.assigned_by_user_id
`;

const buildWhere = ({ officialRole, projectId, search, status }) => {
  const conditions = [];
  const params = [];

  if (search) {
    conditions.push(`(
      projects.project_code LIKE ?
      OR projects.project_name LIKE ?
      OR users.full_name LIKE ?
      OR users.username LIKE ?
      OR project_memberships.official_role LIKE ?
      OR project_memberships.status LIKE ?
    )`);
    params.push(`%${search}%`, `%${search}%`, `%${search}%`, `%${search}%`, `%${search}%`, `%${search}%`);
  }
  if (projectId) {
    conditions.push('project_memberships.project_id = ?');
    params.push(projectId);
  }
  if (officialRole) {
    conditions.push('project_memberships.official_role = ?');
    params.push(officialRole);
  }
  if (status) {
    conditions.push('project_memberships.status = ?');
    params.push(status);
  }

  return {
    clause: conditions.length ? `WHERE ${conditions.join(' AND ')}` : '',
    params,
  };
};

const listMemberships = async ({
  direction,
  limit,
  offset,
  officialRole,
  projectId,
  search,
  sortBy,
  status,
}) => {
  const where = buildWhere({ officialRole, projectId, search, status });
  const sortColumn = sortColumns[sortBy] || sortColumns.assignedAt;
  const order = direction === 'asc' ? 'ASC' : 'DESC';

  const [rows] = await pool.query(
    `
      ${baseSelect}
      ${where.clause}
      ORDER BY ${sortColumn} ${order}, project_memberships.id ASC
      LIMIT ? OFFSET ?
    `,
    [...where.params, limit, offset]
  );
  const [countRows] = await pool.query(
    `
      SELECT COUNT(*) AS total
      FROM project_memberships
      INNER JOIN projects ON projects.id = project_memberships.project_id
      INNER JOIN users ON users.id = project_memberships.user_id
      ${where.clause}
    `,
    where.params
  );

  return {
    rows: rows.map(mapMembershipRow),
    totalItems: Number(countRows[0]?.total || 0),
  };
};

const findMembershipById = async (membershipId) => {
  const [rows] = await pool.execute(`${baseSelect} WHERE project_memberships.id = ? LIMIT 1`, [membershipId]);
  return mapMembershipRow(rows[0]);
};

const findMembershipByProjectAndUser = async ({ projectId, userId }) => {
  const [rows] = await pool.execute(
    `${baseSelect} WHERE project_memberships.project_id = ? AND project_memberships.user_id = ? LIMIT 1`,
    [projectId, userId]
  );
  return mapMembershipRow(rows[0]);
};

const findActiveMembershipByProjectAndUser = async ({ projectId, userId }) => {
  const [rows] = await pool.execute(
    `
      ${baseSelect}
      WHERE project_memberships.project_id = ?
        AND project_memberships.user_id = ?
        AND LOWER(TRIM(project_memberships.status)) = 'active'
        AND LOWER(TRIM(users.status)) = 'active'
        AND LOWER(TRIM(projects.status)) = 'active'
      LIMIT 1
    `,
    [projectId, userId]
  );
  return mapMembershipRow(rows[0]);
};

const findActiveMembershipByProjectAndOfficialRole = async ({ officialRole, projectId }) => {
  const normalizedOfficialRole = normalizeLookupText(officialRole);
  const [rows] = await pool.execute(
    `
      ${baseSelect}
      WHERE project_memberships.project_id = ?
        AND LOWER(TRIM(project_memberships.official_role)) = ?
        AND LOWER(TRIM(project_memberships.status)) = 'active'
        AND LOWER(TRIM(users.status)) = 'active'
        AND LOWER(TRIM(projects.status)) = 'active'
      ORDER BY users.full_name ASC, users.id ASC
      LIMIT 1
    `,
    [projectId, normalizedOfficialRole]
  );
  return mapMembershipRow(rows[0]);
};

const listActiveMembershipsByProjectAndOfficialRoles = async ({ officialRoles = [], projectId }) => {
  const sourceRoles = Array.isArray(officialRoles) ? officialRoles : [];
  const roles = [...new Set(sourceRoles.map(normalizeLookupText).filter(Boolean))];
  if (roles.length === 0) return [];
  const placeholders = roles.map(() => '?').join(', ');
  const [rows] = await pool.execute(
    `
      ${baseSelect}
      WHERE project_memberships.project_id = ?
        AND LOWER(TRIM(project_memberships.official_role)) IN (${placeholders})
        AND LOWER(TRIM(project_memberships.status)) = 'active'
        AND LOWER(TRIM(users.status)) = 'active'
        AND LOWER(TRIM(projects.status)) = 'active'
      ORDER BY users.full_name ASC, users.id ASC
    `,
    [projectId, ...roles]
  );

  return rows.map(mapMembershipRow);
};

const listAccessibleProjectsByUserId = async (userId) => {
  const [rows] = await pool.execute(
    `
      SELECT
        projects.id,
        projects.project_code,
        projects.project_name,
        projects.description,
        projects.status,
        projects.created_by_user_id,
        projects.created_at,
        projects.updated_at,
        projects.updated_by_user_id,
        projects.closed_at,
        projects.closed_by_user_id,
        project_memberships.id AS membership_id,
        project_memberships.official_role,
        project_memberships.status AS membership_status,
        project_memberships.assigned_at,
        project_memberships.updated_at AS membership_updated_at
      FROM project_memberships
      INNER JOIN projects ON projects.id = project_memberships.project_id
      INNER JOIN users ON users.id = project_memberships.user_id
      WHERE project_memberships.user_id = ?
        AND LOWER(TRIM(project_memberships.status)) = 'active'
        AND LOWER(TRIM(projects.status)) = 'active'
        AND LOWER(TRIM(users.status)) = 'active'
      ORDER BY projects.project_name ASC
    `,
    [userId]
  );

  return rows.map((row) => ({
    activeMembership: {
      id: row.membership_id,
      projectId: row.id,
      userId,
      officialRole: normalizeOfficialRoleValue(row.official_role),
      status: normalizeStatusValue(row.membership_status, Object.values(ENTITY_STATUS)),
      assignedAt: row.assigned_at,
      updatedAt: row.membership_updated_at,
    },
    activeProject: {
      id: row.id,
      projectCode: row.project_code,
      projectName: row.project_name,
      name: row.project_name,
      description: row.description || '',
      status: normalizeStatusValue(row.status, Object.values(PROJECT_STATUS)),
      createdByUserId: row.created_by_user_id,
      createdAt: row.created_at,
      createdDate: row.created_at,
      updatedAt: row.updated_at,
      lastUpdated: row.updated_at,
      updatedByUserId: row.updated_by_user_id,
      closedAt: row.closed_at,
      closedByUserId: row.closed_by_user_id,
    },
  }));
};

const getUserProjectPreference = async (userId) => {
  const [rows] = await pool.execute(
    'SELECT user_id, active_project_id, updated_at FROM user_project_preferences WHERE user_id = ? LIMIT 1',
    [userId]
  );
  return rows[0] || null;
};

const setUserProjectPreference = async ({ projectId, userId }) => {
  await pool.execute(
    `
      INSERT INTO user_project_preferences (user_id, active_project_id)
      VALUES (?, ?)
      ON DUPLICATE KEY UPDATE active_project_id = VALUES(active_project_id)
    `,
    [userId, projectId]
  );
};

const clearUserProjectPreference = async (userId) => {
  await pool.execute(
    `
      INSERT INTO user_project_preferences (user_id, active_project_id)
      VALUES (?, NULL)
      ON DUPLICATE KEY UPDATE active_project_id = NULL
    `,
    [userId]
  );
};

const createMembership = async ({ membership }) => {
  await pool.execute(
    `
      INSERT INTO project_memberships (
        id, project_id, user_id, official_role, status, assigned_by_user_id, updated_by_user_id
      )
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `,
    [
      membership.id,
      membership.projectId,
      membership.userId,
      membership.officialRole,
      membership.status,
      membership.assignedByUserId,
      membership.assignedByUserId,
    ]
  );
  return findMembershipById(membership.id);
};

const updateMembership = async ({ membership, membershipId }) => {
  await pool.execute(
    `
      UPDATE project_memberships
      SET official_role = ?,
          status = ?,
          updated_by_user_id = ?
      WHERE id = ?
    `,
    [membership.officialRole, membership.status, membership.updatedByUserId, membershipId]
  );
  return findMembershipById(membershipId);
};

const updateMembershipStatus = async ({ membershipId, status, userId }) => {
  await pool.execute(
    `
      UPDATE project_memberships
      SET status = ?, updated_by_user_id = ?
      WHERE id = ?
    `,
    [status, userId, membershipId]
  );
  return findMembershipById(membershipId);
};

module.exports = {
  clearUserProjectPreference,
  createMembership,
  findActiveMembershipByProjectAndOfficialRole,
  findActiveMembershipByProjectAndUser,
  findMembershipById,
  findMembershipByProjectAndUser,
  getUserProjectPreference,
  listActiveMembershipsByProjectAndOfficialRoles,
  listAccessibleProjectsByUserId,
  listMemberships,
  setUserProjectPreference,
  updateMembership,
  updateMembershipStatus,
};
