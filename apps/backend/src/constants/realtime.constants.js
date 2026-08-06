const REALTIME_EVENT_VERSION = 1;

const REALTIME_EVENT_SCOPE = Object.freeze({
  PROJECT: 'project',
  USER: 'user',
  USER_PROJECT: 'user-project',
});

const REALTIME_EVENT_TYPE = Object.freeze({
  COMMENT_CREATED: 'comment.created',
  CONNECTED: 'connected',
  DOCUMENT_ARCHIVED: 'document.archived',
  DOCUMENT_CREATED: 'document.created',
  DOCUMENT_RESTORED: 'document.restored',
  DOCUMENT_UPDATED: 'document.updated',
  ESCALATION_CHANGED: 'escalation.changed',
  HISTORY_CHANGED: 'history.changed',
  NOTIFICATION_CREATED: 'notification.created',
  NOTIFICATION_DELETED: 'notification.deleted',
  NOTIFICATION_READ: 'notification.read',
  NOTIFICATION_READ_ALL: 'notification.read_all',
  REVISION_UPLOADED: 'revision.uploaded',
  SLA_CHANGED: 'sla.changed',
  WORKFLOW_CHANGED: 'workflow.changed',
});

const REALTIME_RESOURCE_TYPE = Object.freeze({
  DOCUMENT: 'Document',
  NOTIFICATION: 'Notification',
  REALTIME: 'Realtime',
  REVISION: 'Revision',
  WORKFLOW_COMMENT: 'Workflow Comment',
});

const REALTIME_INTERNAL_EVENT_NAME = 'realtime.event';
const REALTIME_HEARTBEAT_INTERVAL_MS = 25 * 1000;

module.exports = {
  REALTIME_EVENT_SCOPE,
  REALTIME_EVENT_TYPE,
  REALTIME_EVENT_VERSION,
  REALTIME_HEARTBEAT_INTERVAL_MS,
  REALTIME_INTERNAL_EVENT_NAME,
  REALTIME_RESOURCE_TYPE,
};
