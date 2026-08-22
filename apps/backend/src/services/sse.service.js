const { AUTH_COOKIE_NAMES, AUTH_TOKEN_TYPES } = require('../constants/auth.constants');
const {
  REALTIME_EVENT_SCOPE,
  REALTIME_EVENT_TYPE,
  REALTIME_HEARTBEAT_INTERVAL_MS,
  REALTIME_RESOURCE_TYPE,
} = require('../constants/realtime.constants');
const logger = require('../config/logger');
const realtimeConnectionRegistry = require('./realtimeConnectionRegistry.service');
const realtimeEventBus = require('./realtimeEventBus.service');
const realtimePublisher = require('./realtimePublisher.service');
const projectContextService = require('./projectContext.service');
const { createEntityId, createHttpError } = require('../utils/administration');
const { verifyToken } = require('../utils/token');

let eventBusSubscribed = false;

const ensureEventBusSubscription = () => {
  if (eventBusSubscribed) return;

  realtimeEventBus.subscribe((event) => {
    realtimeConnectionRegistry.deliver(event);
  });
  eventBusSubscribed = true;
};

const setSseHeaders = (res) => {
  res.status(200);
  res.set({
    'Cache-Control': 'no-cache, no-transform',
    Connection: 'keep-alive',
    'Content-Type': 'text/event-stream',
    'X-Accel-Buffering': 'no',
  });

  if (typeof res.flushHeaders === 'function') {
    res.flushHeaders();
  }
};

const safeWrite = ({ connectionId, payload, res }) => {
  try {
    if (res.destroyed || res.writableEnded) return false;
    res.write(payload);
    return true;
  } catch (error) {
    logger.error(
      '[REALTIME_CONNECTION]',
      'event=write_failed',
      `connectionId=${connectionId}`,
      `error=${error.message}`
    );
    return false;
  }
};

const closeResponse = (res) => {
  if (!res.destroyed && !res.writableEnded) {
    res.end();
  }
};

const resolveAccessTokenExpiryMs = (req) => {
  const accessToken = req.cookies?.[AUTH_COOKIE_NAMES.ACCESS_TOKEN];
  if (!accessToken) return null;

  try {
    const payload = verifyToken(accessToken, AUTH_TOKEN_TYPES.ACCESS);
    if (!payload.exp) return null;

    return Math.max(0, (Number(payload.exp) * 1000) - Date.now());
  } catch {
    return 0;
  }
};

const openConnection = async ({ req, res }) => {
  ensureEventBusSubscription();

  if (!req.user) {
    throw createHttpError('Unauthenticated', 401);
  }
  if (req.activeProject?.id) {
    await projectContextService.requireActiveProjectMembership({
      projectId: req.activeProject.id,
      userId: req.user.id,
    });
  }

  const connectionId = createEntityId('RT-CONN');
  const projectId = req.activeProject?.id ?? null;
  const userId = req.user.id;
  const requestId = req.id || req.headers['x-request-id'] || null;

  setSseHeaders(res);

  let closed = false;
  let heartbeatTimer = null;
  let expiryTimer = null;

  const cleanup = ({ reason = 'disconnect' } = {}) => {
    if (closed) return;
    closed = true;

    if (heartbeatTimer) {
      clearInterval(heartbeatTimer);
      heartbeatTimer = null;
    }
    if (expiryTimer) {
      clearTimeout(expiryTimer);
      expiryTimer = null;
    }

    realtimeConnectionRegistry.unregister(connectionId, { reason });
  };

  realtimeConnectionRegistry.register({
    close: ({ reason = 'registry_close' } = {}) => {
      if (heartbeatTimer) {
        clearInterval(heartbeatTimer);
        heartbeatTimer = null;
      }
      if (expiryTimer) {
        clearTimeout(expiryTimer);
        expiryTimer = null;
      }
      if (!closed) {
        closed = true;
        logger.log(
          '[REALTIME_CONNECTION]',
          'event=closed_by_registry',
          `connectionId=${connectionId}`,
          `reason=${reason}`
        );
      }
      closeResponse(res);
    },
    connectionId,
    projectId,
    requestId,
    response: res,
    userId,
  });

  const connectedEvent = realtimePublisher.buildRealtimeEvent({
    actorUserId: userId,
    correlationId: requestId,
    projectId,
    reason: 'connection_opened',
    recipientUserId: userId,
    resourceId: connectionId,
    resourceType: REALTIME_RESOURCE_TYPE.REALTIME,
    scope: projectId ? REALTIME_EVENT_SCOPE.USER_PROJECT : REALTIME_EVENT_SCOPE.USER,
    type: REALTIME_EVENT_TYPE.CONNECTED,
  });

  safeWrite({
    connectionId,
    payload: `event: ${connectedEvent.type}\ndata: ${JSON.stringify(connectedEvent)}\n\n`,
    res,
  });

  heartbeatTimer = setInterval(async () => {
    if (closed) return;
    if (projectId) {
      try {
        await projectContextService.requireActiveProjectMembership({ projectId, userId });
      } catch (error) {
        cleanup({ reason: 'membership_invalid' });
        closeResponse(res);
        return;
      }
    }

    const ok = safeWrite({
      connectionId,
      payload: ': heartbeat\n\n',
      res,
    });

    if (!ok) {
      cleanup({ reason: 'heartbeat_failed' });
      closeResponse(res);
      return;
    }

    realtimeConnectionRegistry.markHeartbeat(connectionId);
  }, REALTIME_HEARTBEAT_INTERVAL_MS);
  heartbeatTimer.unref?.();

  const expiresInMs = resolveAccessTokenExpiryMs(req);
  if (expiresInMs !== null) {
    expiryTimer = setTimeout(() => {
      cleanup({ reason: 'session_expired' });
      closeResponse(res);
    }, Math.max(1, expiresInMs));
    expiryTimer.unref?.();
  }

  req.on('close', () => cleanup({ reason: 'client_closed' }));
  res.on('error', () => cleanup({ reason: 'response_error' }));
};

module.exports = {
  openConnection,
};
