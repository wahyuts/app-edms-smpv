const { pool } = require('../config/database');

const mapProjectRow = (row) => row && ({
  id: row.id,
  projectCode: row.project_code,
  projectName: row.project_name,
  name: row.project_name,
  description: row.description || '',
  status: row.status,
  memberCount: Number(row.member_count || 0),
  createdByUserId: row.created_by_user_id,
  createdDate: row.created_at,
  createdAt: row.created_at,
  lastUpdated: row.updated_at,
  updatedAt: row.updated_at,
  updatedByUserId: row.updated_by_user_id,
  closedAt: row.closed_at,
  closedByUserId: row.closed_by_user_id,
});

const sortColumns = Object.freeze({
  createdAt: 'projects.created_at',
  createdDate: 'projects.created_at',
  lastUpdated: 'projects.updated_at',
  projectCode: 'projects.project_code',
  projectName: 'projects.project_name',
  status: 'projects.status',
  updatedAt: 'projects.updated_at',
});

const projectSelect = `
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
    COUNT(active_memberships.id) AS member_count
  FROM projects
  LEFT JOIN project_memberships active_memberships
    ON active_memberships.project_id = projects.id
    AND active_memberships.status = 'Active'
`;

const buildWhere = ({ search, status }) => {
  const conditions = [];
  const params = [];

  if (search) {
    conditions.push(`(
      projects.project_code LIKE ?
      OR projects.project_name LIKE ?
      OR projects.description LIKE ?
      OR projects.status LIKE ?
    )`);
    params.push(`%${search}%`, `%${search}%`, `%${search}%`, `%${search}%`);
  }
  if (status) {
    conditions.push('projects.status = ?');
    params.push(status);
  }

  return {
    clause: conditions.length ? `WHERE ${conditions.join(' AND ')}` : '',
    params,
  };
};

const listProjects = async ({ direction, limit, offset, search, sortBy, status }) => {
  const where = buildWhere({ search, status });
  const sortColumn = sortColumns[sortBy] || sortColumns.createdAt;
  const order = direction === 'asc' ? 'ASC' : 'DESC';

  const [rows] = await pool.query(
    `
      ${projectSelect}
      ${where.clause}
      GROUP BY projects.id
      ORDER BY ${sortColumn} ${order}, projects.id ASC
      LIMIT ? OFFSET ?
    `,
    [...where.params, limit, offset]
  );
  const [countRows] = await pool.query(
    `SELECT COUNT(*) AS total FROM projects ${where.clause}`,
    where.params
  );

  return {
    rows: rows.map(mapProjectRow),
    totalItems: Number(countRows[0]?.total || 0),
  };
};

const findProjectById = async (projectId) => {
  const [rows] = await pool.execute(
    `
      ${projectSelect}
      WHERE projects.id = ?
      GROUP BY projects.id
      LIMIT 1
    `,
    [projectId]
  );
  return mapProjectRow(rows[0]);
};

const findProjectByCode = async (projectCode) => {
  const [rows] = await pool.execute(
    `
      ${projectSelect}
      WHERE projects.project_code = ?
      GROUP BY projects.id
      LIMIT 1
    `,
    [projectCode]
  );
  return mapProjectRow(rows[0]);
};

const countActiveWorkflowDocuments = async (projectId) => {
  const [rows] = await pool.execute(
    `
      SELECT COUNT(*) AS total
      FROM engineering_documents
      WHERE project_id = ?
        AND workflow_status IN (
          'Process Review',
          'Process Comment',
          'Process Reject',
          'Project Review',
          'Project Comment',
          'Project Reject'
        )
    `,
    [projectId]
  );
  return Number(rows[0]?.total || 0);
};

const getProjectClosureSummary = async (projectId) => {
  const [[documentCount], [approvedActiveCount], [archivedCount]] = await Promise.all([
    pool.execute('SELECT COUNT(*) AS total FROM engineering_documents WHERE project_id = ?', [projectId]),
    pool.execute(
      `
        SELECT COUNT(*) AS total
        FROM engineering_documents
        WHERE project_id = ? AND workflow_status = 'Approved' AND lifecycle_status = 'Active'
      `,
      [projectId]
    ),
    pool.execute(
      `
        SELECT COUNT(*) AS total
        FROM engineering_documents
        WHERE project_id = ? AND lifecycle_status = 'Archived'
      `,
      [projectId]
    ),
  ]);

  return {
    activeWorkflowDocument: await countActiveWorkflowDocuments(projectId),
    approvedDocument: Number(approvedActiveCount[0]?.total || 0),
    archivedDocument: Number(archivedCount[0]?.total || 0),
    totalDocument: Number(documentCount[0]?.total || 0),
  };
};

const createProjectWithInitialMembership = async ({ membership, project }) => {
  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();
    await connection.execute(
      `
        INSERT INTO projects (
          id, project_code, project_name, description, status,
          created_by_user_id, updated_by_user_id
        )
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `,
      [
        project.id,
        project.projectCode,
        project.projectName,
        project.description,
        project.status,
        project.createdByUserId,
        project.createdByUserId,
      ]
    );
    await connection.execute(
      `
        INSERT INTO project_memberships (
          id, project_id, user_id, official_role, status, assigned_by_user_id, updated_by_user_id
        )
        VALUES (?, ?, ?, 'Admin', 'Active', ?, ?)
      `,
      [membership.id, project.id, membership.userId, membership.assignedByUserId, membership.assignedByUserId]
    );
    await connection.commit();
    return findProjectById(project.id);
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
};

const updateProject = async ({ project, projectId }) => {
  await pool.execute(
    `
      UPDATE projects
      SET project_code = ?,
          project_name = ?,
          description = ?,
          status = ?,
          updated_by_user_id = ?
      WHERE id = ?
    `,
    [
      project.projectCode,
      project.projectName,
      project.description,
      project.status,
      project.updatedByUserId,
      projectId,
    ]
  );
  return findProjectById(projectId);
};

const updateProjectStatus = async ({ projectId, status, userId }) => {
  await pool.execute(
    'UPDATE projects SET status = ?, updated_by_user_id = ? WHERE id = ?',
    [status, userId, projectId]
  );
  return findProjectById(projectId);
};

const closeProject = async ({ projectId, userId }) => {
  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();
    const [archiveResult] = await connection.execute(
      `
        UPDATE engineering_documents
        SET lifecycle_status = 'Archived',
            archived_at = UTC_TIMESTAMP(3),
            archived_by_user_id = ?,
            archive_reason = 'Project Closed'
        WHERE project_id = ?
          AND workflow_status = 'Approved'
          AND lifecycle_status = 'Active'
      `,
      [userId, projectId]
    );
    await connection.execute(
      `
        UPDATE projects
        SET status = 'Closed',
            closed_at = UTC_TIMESTAMP(3),
            closed_by_user_id = ?,
            updated_by_user_id = ?
        WHERE id = ?
      `,
      [userId, userId, projectId]
    );
    await connection.execute(
      'UPDATE user_project_preferences SET active_project_id = NULL WHERE active_project_id = ?',
      [projectId]
    );
    await connection.commit();
    return {
      autoArchivedDocumentCount: archiveResult.affectedRows,
      project: await findProjectById(projectId),
    };
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
};

module.exports = {
  closeProject,
  countActiveWorkflowDocuments,
  createProjectWithInitialMembership,
  findProjectByCode,
  findProjectById,
  getProjectClosureSummary,
  listProjects,
  updateProject,
  updateProjectStatus,
};
