export const REALTIME_EVENT_VERSION = 1;

export const REALTIME_CONNECTION_STATUS = Object.freeze({
  CONNECTED: "connected",
  CONNECTING: "connecting",
  DISCONNECTED: "disconnected",
  RECONNECTING: "reconnecting",
  STOPPED: "stopped",
});

export const REALTIME_EVENT_SCOPE = Object.freeze({
  PROJECT: "project",
  USER: "user",
  USER_PROJECT: "user-project",
});

export const REALTIME_EVENT_TYPE = Object.freeze({
  COMMENT_CREATED: "comment.created",
  CONNECTED: "connected",
  DOCUMENT_ARCHIVED: "document.archived",
  DOCUMENT_CREATED: "document.created",
  DOCUMENT_RESTORED: "document.restored",
  DOCUMENT_UPDATED: "document.updated",
  ESCALATION_CHANGED: "escalation.changed",
  HISTORY_CHANGED: "history.changed",
  NOTIFICATION_CREATED: "notification.created",
  NOTIFICATION_DELETED: "notification.deleted",
  NOTIFICATION_READ: "notification.read",
  NOTIFICATION_READ_ALL: "notification.read_all",
  PROJECT_MEMBERSHIP_CHANGED: "project_membership.changed",
  REVISION_UPLOADED: "revision.uploaded",
  SESSION_REPLACED: "session.replaced",
  SLA_CHANGED: "sla.changed",
  WORKFLOW_CHANGED: "workflow.changed",
});

export const REALTIME_MAX_RECONNECT_DELAY_MS = 30000;
export const REALTIME_MIN_RECONNECT_DELAY_MS = 1000;
export const REALTIME_RECONNECT_JITTER_MS = 750;
