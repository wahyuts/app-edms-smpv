const { pool } = require('../config/database');
const { normalizeJsonMetadata } = require('../utils/jsonMetadata');

const mapNotificationRow = (row) => row && ({
  id: row.id,
  identityKey: row.identity_key,
  projectId: row.project_id,
  recipientUserId: row.recipient_user_id,
  recipientProjectMembershipId: row.recipient_project_membership_id,
  eventType: row.event_type,
  title: row.title,
  message: row.message,
  priority: row.priority,
  officialRole: row.official_role,
  recipientRole: row.recipient_role,
  relatedResourceType: row.related_resource_type,
  relatedResourceId: row.related_resource_id,
  relatedDocumentNumber: row.related_document_number,
  actionTarget: row.action_target,
  read: Boolean(row.is_read),
  readStatus: Number(row.is_read) === 1 ? 'Read' : 'Unread',
  readAt: row.read_at,
  createdAt: row.created_at,
  metadata: normalizeJsonMetadata(row.metadata),
});

const notificationSelectColumns = `
  id, identity_key, project_id, recipient_user_id, recipient_project_membership_id,
  event_type, title, message, priority, official_role, recipient_role,
  related_resource_type, related_resource_id, related_document_number,
  action_target, is_read, read_at, created_at, metadata
`;

const notificationSortColumns = Object.freeze({
  createdAt: 'created_at',
  eventType: 'event_type',
  priority: 'priority',
  readStatus: "CASE WHEN is_read = 1 THEN 'Read' ELSE 'Unread' END",
  title: 'title',
});

const buildNotificationWhere = ({
  eventType,
  projectId,
  readStatus,
  recipientUserId,
  search,
}) => {
  const conditions = [
    'recipient_user_id = ?',
    'project_id = ?',
  ];
  const params = [recipientUserId, projectId];

  if (search) {
    const searchPattern = `%${String(search).toLowerCase()}%`;
    conditions.push(`(
      LOWER(COALESCE(title, '')) LIKE ?
      OR LOWER(COALESCE(message, '')) LIKE ?
      OR LOWER(COALESCE(event_type, '')) LIKE ?
      OR LOWER(COALESCE(related_document_number, '')) LIKE ?
      OR LOWER(CASE WHEN is_read = 1 THEN 'Read' ELSE 'Unread' END) LIKE ?
    )`);
    params.push(
      searchPattern,
      searchPattern,
      searchPattern,
      searchPattern,
      searchPattern
    );
  }
  if (eventType) {
    conditions.push('event_type = ?');
    params.push(eventType);
  }
  if (readStatus) {
    const normalizedReadStatus = String(readStatus).toLowerCase();
    if (normalizedReadStatus === 'read') {
      conditions.push('is_read = 1');
    } else if (normalizedReadStatus === 'unread') {
      conditions.push('is_read = 0');
    } else {
      conditions.push('1 = 0');
    }
  }

  return {
    clause: `WHERE ${conditions.join(' AND ')}`,
    params,
  };
};

const createNotificationOrderClause = ({ direction, sortBy }) => {
  const sortColumn = notificationSortColumns[sortBy] || notificationSortColumns.createdAt;
  const order = direction === 'asc' ? 'ASC' : 'DESC';

  if (sortColumn === 'created_at') {
    return `ORDER BY created_at ${order}, id DESC`;
  }

  return `ORDER BY ${sortColumn} ${order}, created_at DESC, id DESC`;
};

const createNotification = async (notification) => {
  const [result] = await pool.execute(
    `
      INSERT IGNORE INTO notifications (
        id, identity_key, project_id, recipient_user_id, recipient_project_membership_id,
        event_type, title, message, priority, official_role, recipient_role,
        related_resource_type, related_resource_id, related_document_number, action_target, metadata
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `,
    [
      notification.id,
      notification.identityKey,
      notification.projectId,
      notification.recipientUserId,
      notification.recipientProjectMembershipId,
      notification.eventType,
      notification.title,
      notification.message,
      notification.priority,
      notification.officialRole,
      notification.recipientRole,
      notification.relatedResourceType,
      notification.relatedResourceId,
      notification.relatedDocumentNumber,
      notification.actionTarget,
      JSON.stringify(notification.metadata || {}),
    ]
  );

  return result.affectedRows;
};

const listNotificationsPageByRecipient = async ({
  direction,
  eventType,
  limit,
  offset,
  projectId,
  readStatus,
  recipientUserId,
  search,
  sortBy,
}) => {
  const where = buildNotificationWhere({
    eventType,
    projectId,
    readStatus,
    recipientUserId,
    search,
  });
  const orderClause = createNotificationOrderClause({ direction, sortBy });

  const [rows] = await pool.query(
    `
      SELECT ${notificationSelectColumns}
      FROM notifications
      ${where.clause}
      ${orderClause}
      LIMIT ? OFFSET ?
    `,
    [...where.params, limit, offset]
  );
  const [countRows] = await pool.query(
    `
      SELECT COUNT(*) AS total
      FROM notifications
      ${where.clause}
    `,
    where.params
  );

  return {
    rows: rows.map(mapNotificationRow),
    totalItems: Number(countRows[0]?.total || 0),
  };
};

const findNotificationById = async (notificationId) => {
  const [rows] = await pool.execute(
    `
      SELECT *
      FROM notifications
      WHERE id = ?
      LIMIT 1
    `,
    [notificationId]
  );

  return mapNotificationRow(rows[0]);
};

const listNotificationsByRecipient = async ({ projectId, recipientUserId }) => {
  const [rows] = await pool.execute(
    `
      SELECT *
      FROM notifications
      WHERE recipient_user_id = ?
        AND (? IS NULL OR project_id = ?)
      ORDER BY created_at DESC, id DESC
    `,
    [recipientUserId, projectId || null, projectId || null]
  );

  return rows.map(mapNotificationRow);
};

const getNotificationSummaryByRecipient = async ({ projectId, recipientUserId }) => {
  const [rows] = await pool.execute(
    `
      SELECT
        COUNT(*) AS total,
        SUM(CASE WHEN is_read = 0 THEN 1 ELSE 0 END) AS unread,
        SUM(CASE WHEN is_read = 1 THEN 1 ELSE 0 END) AS read_count
      FROM notifications
      WHERE recipient_user_id = ?
        AND project_id = ?
    `,
    [recipientUserId, projectId]
  );

  return {
    read: Number(rows[0]?.read_count || 0),
    total: Number(rows[0]?.total || 0),
    unread: Number(rows[0]?.unread || 0),
  };
};

const countUnreadNotificationsByRecipient = async ({ projectId, recipientUserId }) => {
  const [rows] = await pool.execute(
    `
      SELECT COUNT(*) AS unread
      FROM notifications
      WHERE recipient_user_id = ?
        AND project_id = ?
        AND is_read = 0
    `,
    [recipientUserId, projectId]
  );

  return Number(rows[0]?.unread || 0);
};

const listSlaNotificationsByBusinessKey = async ({
  eventType,
  projectId,
  recipientUserId,
  relatedResourceId,
}) => {
  const [rows] = await pool.execute(
    `
      SELECT *
      FROM notifications
      WHERE event_type = ?
        AND project_id = ?
        AND recipient_user_id = ?
        AND related_resource_type = 'Document'
        AND related_resource_id = ?
    `,
    [eventType, projectId, recipientUserId, relatedResourceId]
  );

  return rows.map(mapNotificationRow);
};

const markNotificationRead = async ({ notificationId, recipientUserId }) => {
  await pool.execute(
    `
      UPDATE notifications
      SET is_read = 1,
          read_at = COALESCE(read_at, UTC_TIMESTAMP(3))
      WHERE id = ?
        AND recipient_user_id = ?
    `,
    [notificationId, recipientUserId]
  );
};

const markAllNotificationsRead = async ({ projectId, recipientUserId }) => {
  const [result] = await pool.execute(
    `
      UPDATE notifications
      SET is_read = 1,
          read_at = COALESCE(read_at, UTC_TIMESTAMP(3))
      WHERE recipient_user_id = ?
        AND is_read = 0
        AND (? IS NULL OR project_id = ?)
    `,
    [recipientUserId, projectId || null, projectId || null]
  );

  return result.affectedRows;
};

const deleteNotification = async ({ notificationId, recipientUserId }) => {
  const [result] = await pool.execute(
    `
      DELETE FROM notifications
      WHERE id = ?
        AND recipient_user_id = ?
    `,
    [notificationId, recipientUserId]
  );

  return result.affectedRows;
};

const deleteNotifications = async ({ notificationIds, projectId, recipientUserId }) => {
  const ids = [...new Set(notificationIds.filter(Boolean))];
  if (ids.length === 0) return 0;
  const placeholders = ids.map(() => '?').join(', ');
  const [result] = await pool.execute(
    `
      DELETE FROM notifications
      WHERE recipient_user_id = ?
        AND (? IS NULL OR project_id = ?)
        AND id IN (${placeholders})
    `,
    [recipientUserId, projectId || null, projectId || null, ...ids]
  );

  return result.affectedRows;
};

module.exports = {
  countUnreadNotificationsByRecipient,
  createNotification,
  deleteNotification,
  deleteNotifications,
  findNotificationById,
  getNotificationSummaryByRecipient,
  listSlaNotificationsByBusinessKey,
  listNotificationsPageByRecipient,
  listNotificationsByRecipient,
  markAllNotificationsRead,
  markNotificationRead,
};
