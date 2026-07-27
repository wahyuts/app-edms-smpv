const { pool } = require('../config/database');

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
  metadata: row.metadata ? JSON.parse(row.metadata) : {},
});

const createNotification = async (notification) => {
  await pool.execute(
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
  createNotification,
  deleteNotification,
  deleteNotifications,
  findNotificationById,
  listNotificationsByRecipient,
  markAllNotificationsRead,
  markNotificationRead,
};
