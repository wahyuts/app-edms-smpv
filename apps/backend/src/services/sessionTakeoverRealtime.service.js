const logger = require('../config/logger');
const {
  AUTH_ERROR_CODES,
} = require('../constants/auth.constants');
const {
  REALTIME_EVENT_SCOPE,
  REALTIME_EVENT_TYPE,
  REALTIME_RESOURCE_TYPE,
} = require('../constants/realtime.constants');
const realtimeConnectionRegistry = require('./realtimeConnectionRegistry.service');
const realtimePublisher = require('./realtimePublisher.service');

const publishSessionReplacedSafely = ({
  newSessionId,
  oldSessionIds = [],
  userId,
} = {}) => {
  const targetSessionIds = [...new Set(
    oldSessionIds
      .filter(Boolean)
      .map((sessionId) => String(sessionId)),
  )];

  if (!userId || targetSessionIds.length === 0) {
    return {
      attemptedCount: 0,
      deliveredCount: 0,
      published: false,
    };
  }

  try {
    const event = realtimePublisher.buildRealtimeEvent({
      actorUserId: userId,
      code: AUTH_ERROR_CODES.SESSION_REPLACED,
      reason: 'session_replaced_by_new_login',
      recipientUserId: userId,
      resourceId: newSessionId,
      resourceType: REALTIME_RESOURCE_TYPE.SESSION,
      scope: REALTIME_EVENT_SCOPE.USER,
      type: REALTIME_EVENT_TYPE.SESSION_REPLACED,
    });
    const result = realtimeConnectionRegistry.sendToSessions(targetSessionIds, event);
    realtimeConnectionRegistry.closeConnectionsBySessions(targetSessionIds, {
      reason: 'session_replaced',
    });

    logger.log(
      '[REALTIME_SESSION_TAKEOVER]',
      'event=session_replaced_delivered',
      `userId=${userId}`,
      `targetSessionCount=${targetSessionIds.length}`,
      `attemptedCount=${result.attemptedCount}`,
      `deliveredCount=${result.deliveredCount}`
    );

    return {
      event,
      published: true,
      ...result,
    };
  } catch (error) {
    logger.error(
      '[REALTIME_SESSION_TAKEOVER]',
      'event=session_replaced_publish_failed',
      `userId=${userId || '-'}`,
      `targetSessionCount=${targetSessionIds.length}`,
      `error=${error.message}`
    );

    return {
      error,
      attemptedCount: 0,
      deliveredCount: 0,
      published: false,
    };
  }
};

module.exports = {
  publishSessionReplacedSafely,
};
