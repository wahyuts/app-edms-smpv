const logger = require('../config/logger');
const realtimeEventBus = require('./realtimeEventBus.service');
const {
  REALTIME_EVENT_SCOPE,
  REALTIME_EVENT_VERSION,
} = require('../constants/realtime.constants');
const { createEntityId, createHttpError, normalizeText } = require('../utils/administration');

const allowedScopes = new Set(Object.values(REALTIME_EVENT_SCOPE));
const eventTypePattern = /^[a-z]+(?:[._][a-z]+)*$/;

const buildRealtimeEvent = ({
  actorUserId = null,
  code = null,
  commentId = null,
  correlationId = null,
  documentId = null,
  eventId = createEntityId('RT-EVT'),
  occurredAt = new Date().toISOString(),
  projectId = null,
  reason,
  recipientUserId = null,
  resourceId,
  resourceType,
  scope,
  type,
  version = REALTIME_EVENT_VERSION,
}) => {
  const event = {
    actorUserId: actorUserId ?? null,
    code: code ?? null,
    commentId: commentId ?? null,
    correlationId: correlationId ?? null,
    documentId: documentId ?? null,
    eventId,
    occurredAt,
    projectId: projectId ?? null,
    reason: normalizeText(reason),
    recipientUserId: recipientUserId ?? null,
    resourceId: normalizeText(resourceId),
    resourceType: normalizeText(resourceType),
    scope: normalizeText(scope),
    timestamp: occurredAt,
    type: normalizeText(type),
    version,
  };

  if (!event.eventId) throw createHttpError('Realtime eventId wajib diisi', 500);
  if (!event.type || !eventTypePattern.test(event.type)) {
    throw createHttpError('Realtime event type tidak valid', 500);
  }
  if (!allowedScopes.has(event.scope)) {
    throw createHttpError('Realtime event scope tidak valid', 500);
  }
  if ([REALTIME_EVENT_SCOPE.PROJECT, REALTIME_EVENT_SCOPE.USER_PROJECT].includes(event.scope) && !event.projectId) {
    throw createHttpError('Realtime projectId wajib diisi', 500);
  }
  if ([REALTIME_EVENT_SCOPE.USER, REALTIME_EVENT_SCOPE.USER_PROJECT].includes(event.scope) && !event.recipientUserId) {
    throw createHttpError('Realtime recipientUserId wajib diisi', 500);
  }
  if (!event.resourceType || !event.resourceId || !event.reason) {
    throw createHttpError('Realtime event resource/reason wajib diisi', 500);
  }

  return Object.freeze(event);
};

const publish = (payload) => {
  const event = buildRealtimeEvent(payload);
  realtimeEventBus.publish(event);
  return event;
};

const publishSafely = (payload) => {
  try {
    const event = publish(payload);

    logger.log(
      '[REALTIME_PUBLISHER]',
      'event=published',
      `eventId=${event.eventId}`,
      `eventType=${event.type}`,
      `scope=${event.scope}`,
      `projectId=${event.projectId || '-'}`,
      `recipientUserId=${event.recipientUserId || '-'}`
    );

    return {
      event,
      published: true,
    };
  } catch (error) {
    logger.error(
      '[REALTIME_PUBLISHER]',
      'event=publish_failed',
      `eventType=${payload?.type || '-'}`,
      `scope=${payload?.scope || '-'}`,
      `projectId=${payload?.projectId || '-'}`,
      `recipientUserId=${payload?.recipientUserId || '-'}`,
      `error=${error.message}`
    );

    return {
      error,
      published: false,
    };
  }
};

module.exports = {
  buildRealtimeEvent,
  publish,
  publishSafely,
};
