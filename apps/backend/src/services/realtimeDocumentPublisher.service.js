const {
  REALTIME_EVENT_SCOPE,
  REALTIME_EVENT_TYPE,
  REALTIME_RESOURCE_TYPE,
} = require('../constants/realtime.constants');
const realtimePublisher = require('./realtimePublisher.service');

const publishDocumentEvent = ({
  actorUserId = null,
  document,
  reason,
  resourceId = null,
  resourceType = REALTIME_RESOURCE_TYPE.DOCUMENT,
  type,
}) => {
  if (!document?.id || !document?.projectId || !type || !reason) return;

  realtimePublisher.publishSafely({
    actorUserId,
    documentId: document.id,
    projectId: document.projectId,
    reason,
    resourceId: resourceId || document.id,
    resourceType,
    scope: REALTIME_EVENT_SCOPE.PROJECT,
    type,
  });
};

const publishDocumentCreated = ({ actorUserId = null, document }) =>
  publishDocumentEvent({
    actorUserId,
    document,
    reason: 'document_created',
    type: REALTIME_EVENT_TYPE.DOCUMENT_CREATED,
  });

const publishDocumentUpdated = ({ actorUserId = null, document, reason = 'document_updated' }) =>
  publishDocumentEvent({
    actorUserId,
    document,
    reason,
    type: REALTIME_EVENT_TYPE.DOCUMENT_UPDATED,
  });

const publishDocumentArchived = ({ actorUserId = null, document }) =>
  publishDocumentEvent({
    actorUserId,
    document,
    reason: 'document_archived',
    type: REALTIME_EVENT_TYPE.DOCUMENT_ARCHIVED,
  });

const publishDocumentRestored = ({ actorUserId = null, document }) =>
  publishDocumentEvent({
    actorUserId,
    document,
    reason: 'document_restored',
    type: REALTIME_EVENT_TYPE.DOCUMENT_RESTORED,
  });

const publishRevisionUploaded = ({ actorUserId = null, document, revisionId }) =>
  publishDocumentEvent({
    actorUserId,
    document,
    reason: 'revision_uploaded',
    resourceId: revisionId || document.activeRevisionId || document.id,
    resourceType: REALTIME_RESOURCE_TYPE.REVISION,
    type: REALTIME_EVENT_TYPE.REVISION_UPLOADED,
  });

const publishWorkflowChanged = ({ actorUserId = null, document }) =>
  publishDocumentEvent({
    actorUserId,
    document,
    reason: 'workflow_changed',
    type: REALTIME_EVENT_TYPE.WORKFLOW_CHANGED,
  });

module.exports = {
  publishDocumentArchived,
  publishDocumentCreated,
  publishDocumentRestored,
  publishDocumentUpdated,
  publishRevisionUploaded,
  publishWorkflowChanged,
};
