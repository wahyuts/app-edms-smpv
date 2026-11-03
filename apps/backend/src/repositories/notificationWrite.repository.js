// Shared insert primitive: no runtime pool, admission, email, or startup imports.
const insertNotification = async (connection, notification, { strict = false } = {}) => {
  const [result] = await connection.execute(`
    INSERT ${strict ? '' : 'IGNORE '}INTO notifications (
      id, identity_key, project_id, recipient_user_id, recipient_project_membership_id,
      event_type, title, message, priority, official_role, recipient_role,
      related_resource_type, related_resource_id, related_document_number, action_target, metadata
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `, [notification.id, notification.identityKey, notification.projectId, notification.recipientUserId,
    notification.recipientProjectMembershipId, notification.eventType, notification.title, notification.message,
    notification.priority, notification.officialRole, notification.recipientRole, notification.relatedResourceType,
    notification.relatedResourceId, notification.relatedDocumentNumber, notification.actionTarget,
    JSON.stringify(notification.metadata || {})]);
  return result.affectedRows;
};

module.exports = { insertNotification };
