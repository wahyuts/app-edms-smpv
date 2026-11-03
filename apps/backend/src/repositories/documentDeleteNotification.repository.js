const { digest, pending } = require('../utils/storageNamespace');
const { insertNotification } = require('./notificationWrite.repository');
const { OFFICIAL_ROLES } = require('../constants/administration.constants');

const EVENT_TYPE = 'Document Permanently Deleted';
const captureRecipients = async (connection, projectId) => {
  // Shared locks freeze the selected users/memberships through the completion commit.
  const [rows] = await connection.execute(`SELECT m.id,m.user_id,m.official_role FROM project_memberships m
    JOIN users u ON u.id=m.user_id WHERE m.project_id=? AND m.status='Active' AND u.status='Active'
    ORDER BY m.user_id,m.id LOCK IN SHARE MODE`, [projectId]);
  const recipients = new Map();
  for (const row of rows) {
    const role = OFFICIAL_ROLES.find((item) => item.toLowerCase() === row.official_role.trim().toLowerCase());
    if (!role) throw pending('DELETE_NOTIFICATION_ROLE_INVALID');
    if (!recipients.has(String(row.user_id))) recipients.set(String(row.user_id), {
      userId: row.user_id, membershipId: row.id, officialRole: role,
    });
  }
  return { version: 1, state: 'PENDING', recipients: [...recipients.values()], deliveredUserIds: [] };
};

const notificationFor = (snapshot, recipient, membershipId) => {
  const identityKey = `permanent-delete:${snapshot.operationId}:${recipient.userId}`;
  return {
    id: `NTF-DEL-${digest(identityKey).slice(0, 48)}`, identityKey, projectId: snapshot.projectId,
    recipientUserId: recipient.userId, recipientProjectMembershipId: membershipId,
    eventType: EVENT_TYPE, title: EVENT_TYPE,
    message: `Document ${snapshot.documentNumber} has been permanently deleted by an Administrator.`,
    priority: 'Low', officialRole: recipient.officialRole, recipientRole: recipient.officialRole,
    // The existing UI enables document navigation when ANY of these three fields is set.
    relatedResourceType: 'Document Delete', relatedResourceId: null, relatedDocumentNumber: null, actionTarget: null,
    metadata: { notificationType: EVENT_TYPE, projectId: snapshot.projectId, deletedDocumentNumber: snapshot.documentNumber,
      deleteOperationId: snapshot.operationId, actorId: snapshot.initiatingAdmin.id, completedAt: snapshot.completedAt },
  };
};

const deliverRecipient = async (connection, snapshot, recipient) => {
  // Membership may have been removed after completion. Retain the completion-time
  // recipient/role snapshot; do not fail the FK or resolve a different recipient.
  const [[membership]] = await connection.execute('SELECT id FROM project_memberships WHERE id=? AND project_id=? AND user_id=? LOCK IN SHARE MODE',
    [recipient.membershipId, snapshot.projectId, recipient.userId]);
  const notification = notificationFor(snapshot, recipient, membership?.id || null);
  try { await insertNotification(connection, notification, { strict: true }); }
  catch (error) {
    if (error.code !== 'ER_DUP_ENTRY') throw error;
    const [[existing]] = await connection.execute('SELECT * FROM notifications WHERE identity_key=?', [notification.identityKey]);
    const metadata = typeof existing?.metadata === 'string' ? JSON.parse(existing.metadata) : existing?.metadata;
    if (!existing || existing.id !== notification.id || existing.project_id !== notification.projectId
      || String(existing.recipient_user_id) !== String(recipient.userId) || existing.event_type !== EVENT_TYPE
      || existing.title !== notification.title || existing.message !== notification.message || existing.priority !== notification.priority
      || existing.official_role !== recipient.officialRole || existing.recipient_role !== recipient.officialRole
      || existing.related_resource_type !== notification.relatedResourceType || existing.related_resource_id !== null
      || existing.related_document_number !== null || existing.action_target !== null
      || !metadata || Object.keys(metadata).length !== Object.keys(notification.metadata).length
      || Object.entries(notification.metadata).some(([key, value]) => metadata[key] !== value)) throw pending('DELETE_NOTIFICATION_IDENTITY_CONFLICT');
  }
  return notification;
};

module.exports = { EVENT_TYPE, captureRecipients, notificationFor, deliverRecipient };
