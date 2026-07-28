const { pool } = require('../config/database');

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
  metadata: row.metadata ? sanitizeMetadata(JSON.parse(row.metadata)) : {},
  occurredAt: row.occurred_at,
  createdAt: row.occurred_at,
  timestamp: row.occurred_at,
  isHidden: Boolean(row.is_hidden),
  isDeleted: Boolean(row.is_hidden),
  hiddenAt: row.hidden_at,
  hiddenByUserId: row.hidden_by_user_id,
});

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
  hideAuditRecord,
  insertAuditRecord,
  listAuditRecordsByProject,
};
