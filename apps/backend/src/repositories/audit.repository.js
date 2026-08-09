const { pool } = require('../config/database');
const { normalizeJsonMetadata } = require('../utils/jsonMetadata');

const sensitiveMetadataKeys = [
  'apiKey',
  'authorization',
  'cookie',
  'credential',
  'jwt',
  'password',
  'passwordHash',
  'refreshToken',
  'resetToken',
  'secret',
  'token',
];

const isSensitiveKey = (key = '') => {
  const normalizedKey = String(key).toLowerCase();
  return sensitiveMetadataKeys.some((sensitiveKey) =>
    normalizedKey.includes(sensitiveKey.toLowerCase())
  );
};

const sanitizeMetadata = (value) => {
  if (Array.isArray(value)) return value.map(sanitizeMetadata);
  if (!value || typeof value !== 'object') return value;

  return Object.fromEntries(
    Object.entries(value)
      .filter(([key]) => !isSensitiveKey(key))
      .map(([key, nestedValue]) => [key, sanitizeMetadata(nestedValue)])
  );
};

const mapAuditRow = (row) => row && ({
  id: row.id,
  identityKey: row.identity_key,
  projectId: row.project_id,
  actorUserId: row.actor_user_id,
  actorName: row.actor_name,
  department: row.department,
  officialRole: row.official_role,
  action: row.action,
  businessEvent: row.business_event,
  detail: row.detail,
  resourceType: row.resource_type,
  resourceId: row.resource_id,
  reference: row.reference,
  metadata: sanitizeMetadata(normalizeJsonMetadata(row.metadata)),
  occurredAt: row.occurred_at,
  createdAt: row.occurred_at,
  timestamp: row.occurred_at,
  isHidden: Boolean(row.is_hidden),
  isDeleted: Boolean(row.is_hidden),
  hiddenAt: row.hidden_at,
  hiddenByUserId: row.hidden_by_user_id,
});

const auditRecordSelectColumns = `
  id, identity_key, project_id, actor_user_id, actor_name, department,
  official_role, action, business_event, detail, resource_type, resource_id,
  reference, metadata, occurred_at, is_hidden, hidden_at, hidden_by_user_id
`;

const auditSortColumns = Object.freeze({
  action: 'action',
  actorName: 'actor_name',
  createdAt: 'occurred_at',
  officialRole: 'official_role',
  resourceType: 'resource_type',
});

const buildAuditRecordWhere = ({
  action,
  actorName,
  fromDate,
  officialRole,
  projectId,
  resourceType,
  search,
  toDate,
}) => {
  const conditions = [
    'project_id = ?',
    'is_hidden = 0',
  ];
  const params = [projectId];

  if (search) {
    const searchPattern = `%${String(search).toLowerCase()}%`;
    conditions.push(`(
      LOWER(COALESCE(action, '')) LIKE ?
      OR LOWER(COALESCE(actor_name, '')) LIKE ?
      OR LOWER(COALESCE(business_event, '')) LIKE ?
      OR LOWER(COALESCE(detail, '')) LIKE ?
      OR LOWER(COALESCE(reference, '')) LIKE ?
      OR LOWER(COALESCE(resource_type, '')) LIKE ?
    )`);
    params.push(
      searchPattern,
      searchPattern,
      searchPattern,
      searchPattern,
      searchPattern,
      searchPattern
    );
  }
  if (action) {
    conditions.push('action = ?');
    params.push(action);
  }
  if (officialRole) {
    conditions.push('official_role = ?');
    params.push(officialRole);
  }
  if (resourceType) {
    conditions.push('resource_type = ?');
    params.push(resourceType);
  }
  if (actorName) {
    conditions.push("LOWER(TRIM(COALESCE(actor_name, ''))) = ?");
    params.push(String(actorName).toLowerCase());
  }
  if (fromDate) {
    conditions.push('occurred_at >= ?');
    params.push(fromDate);
  }
  if (toDate) {
    conditions.push('occurred_at <= ?');
    params.push(toDate);
  }

  return {
    clause: `WHERE ${conditions.join(' AND ')}`,
    params,
  };
};

const createAuditOrderClause = ({ direction, sortBy }) => {
  const sortColumn = auditSortColumns[sortBy] || auditSortColumns.createdAt;
  const order = direction === 'asc' ? 'ASC' : 'DESC';

  if (sortColumn === 'occurred_at') {
    return `ORDER BY occurred_at ${order}, id DESC`;
  }

  return `ORDER BY ${sortColumn} ${order}, occurred_at DESC, id DESC`;
};

const insertAuditRecord = async (record) => {
  await pool.execute(
    `
      INSERT IGNORE INTO audit_trail (
        id, identity_key, project_id, actor_user_id, actor_name, department,
        official_role, action, business_event, detail, resource_type,
        resource_id, reference, metadata
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `,
    [
      record.id,
      record.identityKey,
      record.projectId,
      record.actorUserId,
      record.actorName,
      record.department,
      record.officialRole,
      record.action,
      record.businessEvent,
      record.detail,
      record.resourceType,
      record.resourceId,
      record.reference,
      JSON.stringify(sanitizeMetadata(record.metadata || {})),
    ]
  );
};

const listAuditRecordsPage = async ({
  action,
  actorName,
  direction,
  fromDate,
  limit,
  officialRole,
  offset,
  projectId,
  resourceType,
  search,
  sortBy,
  toDate,
}) => {
  const where = buildAuditRecordWhere({
    action,
    actorName,
    fromDate,
    officialRole,
    projectId,
    resourceType,
    search,
    toDate,
  });
  const orderClause = createAuditOrderClause({ direction, sortBy });

  const [rows] = await pool.query(
    `
      SELECT ${auditRecordSelectColumns}
      FROM audit_trail
      ${where.clause}
      ${orderClause}
      LIMIT ? OFFSET ?
    `,
    [...where.params, limit, offset]
  );
  const [countRows] = await pool.query(
    `
      SELECT COUNT(*) AS total
      FROM audit_trail
      ${where.clause}
    `,
    where.params
  );

  return {
    rows: rows.map(mapAuditRow),
    totalItems: Number(countRows[0]?.total || 0),
  };
};

const listAuditRecordsByProject = async (projectId) => {
  const [rows] = await pool.execute(
    `
      SELECT *
      FROM audit_trail
      WHERE project_id = ?
        AND is_hidden = 0
      ORDER BY occurred_at DESC, id DESC
    `,
    [projectId]
  );

  return rows.map(mapAuditRow);
};

const getAuditSummaryByProject = async (projectId) => {
  const [rows] = await pool.execute(
    `
      SELECT
        COUNT(*) AS total,
        SUM(CASE WHEN DATE(occurred_at) = UTC_DATE() THEN 1 ELSE 0 END) AS today,
        COUNT(DISTINCT CASE
          WHEN DATE(occurred_at) = UTC_DATE()
          THEN COALESCE(CAST(actor_user_id AS CHAR), actor_name)
          ELSE NULL
        END) AS active_users_today
      FROM audit_trail
      WHERE project_id = ?
        AND is_hidden = 0
    `,
    [projectId]
  );

  return {
    activeUsersToday: Number(rows[0]?.active_users_today || 0),
    today: Number(rows[0]?.today || 0),
    total: Number(rows[0]?.total || 0),
  };
};

const listDistinctAuditValuesByProject = async ({ column, projectId }) => {
  const allowedColumns = Object.freeze({
    action: 'action',
    actorName: 'actor_name',
    department: 'department',
    officialRole: 'official_role',
    resourceType: 'resource_type',
  });
  const columnName = allowedColumns[column];
  if (!columnName) return [];

  const [rows] = await pool.query(
    `
      SELECT DISTINCT ${columnName} AS value
      FROM audit_trail
      WHERE project_id = ?
        AND is_hidden = 0
        AND ${columnName} IS NOT NULL
        AND TRIM(${columnName}) <> ''
      ORDER BY ${columnName} ASC
    `,
    [projectId]
  );

  return rows.map((row) => String(row.value ?? '').trim()).filter(Boolean);
};

const getAuditFilterOptionsByProject = async (projectId) => {
  const [actions, departments, officialRoles, resourceTypes, users] = await Promise.all([
    listDistinctAuditValuesByProject({ column: 'action', projectId }),
    listDistinctAuditValuesByProject({ column: 'department', projectId }),
    listDistinctAuditValuesByProject({ column: 'officialRole', projectId }),
    listDistinctAuditValuesByProject({ column: 'resourceType', projectId }),
    listDistinctAuditValuesByProject({ column: 'actorName', projectId }),
  ]);

  return {
    actions,
    departments,
    officialRoles,
    resourceTypes,
    users,
  };
};

const findAuditRecordById = async (auditId) => {
  const [rows] = await pool.execute('SELECT * FROM audit_trail WHERE id = ? LIMIT 1', [auditId]);
  return mapAuditRow(rows[0]);
};

const hideAuditRecord = async ({ auditId, hiddenByUserId }) => {
  const [result] = await pool.execute(
    `
      UPDATE audit_trail
      SET is_hidden = 1,
          hidden_at = UTC_TIMESTAMP(3),
          hidden_by_user_id = ?
      WHERE id = ?
        AND is_hidden = 0
    `,
    [hiddenByUserId, auditId]
  );

  return result.affectedRows;
};

module.exports = {
  findAuditRecordById,
  getAuditFilterOptionsByProject,
  getAuditSummaryByProject,
  hideAuditRecord,
  insertAuditRecord,
  listAuditRecordsPage,
  listAuditRecordsByProject,
};
