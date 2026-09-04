const logger = require('../config/logger');
const { REALTIME_EVENT_SCOPE } = require('../constants/realtime.constants');

const connections = new Map();
const connectionIdsBySessionId = new Map();
const connectionIdsByUserId = new Map();
const connectionIdsByProjectId = new Map();

const addIndex = (index, key, connectionId) => {
  const normalizedKey = String(key);
  if (!index.has(normalizedKey)) {
    index.set(normalizedKey, new Set());
  }
  index.get(normalizedKey).add(connectionId);
};

const removeIndex = (index, key, connectionId) => {
  const normalizedKey = String(key);
  const ids = index.get(normalizedKey);
  if (!ids) return;

  ids.delete(connectionId);
  if (ids.size === 0) {
    index.delete(normalizedKey);
  }
};

const getDurationMs = (connection) => {
  const connectedAtMs = connection?.connectedAt ? new Date(connection.connectedAt).getTime() : Date.now();

  return Math.max(0, Date.now() - connectedAtMs);
};

const register = ({
  close = null,
  connectionId,
  projectId,
  requestId = null,
  response,
  sessionId = null,
  userId,
}) => {
  const connection = {
    close,
    connectedAt: new Date().toISOString(),
    connectionId,
    lastHeartbeatAt: null,
    projectId,
    requestId,
    response,
    sessionId,
    userId,
  };

  connections.set(connectionId, connection);
  if (sessionId) {
    addIndex(connectionIdsBySessionId, sessionId, connectionId);
  }
  addIndex(connectionIdsByUserId, userId, connectionId);
  if (projectId) {
    addIndex(connectionIdsByProjectId, projectId, connectionId);
  }

  logger.log(
    '[REALTIME_CONNECTION]',
    'event=connected',
    `connectionId=${connectionId}`,
    `userId=${userId}`,
    `sessionId=${sessionId || '-'}`,
    `projectId=${projectId}`,
    `activeConnectionCount=${connections.size}`
  );

  return connection;
};

const unregister = (connectionId, { reason = 'disconnect' } = {}) => {
  const connection = connections.get(connectionId);
  if (!connection) return false;

  if (typeof connection.close === 'function') {
    connection.close({ reason });
  }

  connections.delete(connectionId);
  if (connection.sessionId) {
    removeIndex(connectionIdsBySessionId, connection.sessionId, connectionId);
  }
  removeIndex(connectionIdsByUserId, connection.userId, connectionId);
  if (connection.projectId) {
    removeIndex(connectionIdsByProjectId, connection.projectId, connectionId);
  }

  logger.log(
    '[REALTIME_CONNECTION]',
    'event=disconnected',
    `connectionId=${connectionId}`,
    `userId=${connection.userId}`,
    `sessionId=${connection.sessionId || '-'}`,
    `projectId=${connection.projectId}`,
    `durationMs=${getDurationMs(connection)}`,
    `reason=${reason}`,
    `activeConnectionCount=${connections.size}`
  );

  return true;
};

const getConnection = (connectionId) => connections.get(connectionId) || null;

const getConnectionCount = () => connections.size;

const listConnectionIdsByUser = (userId) =>
  [...(connectionIdsByUserId.get(String(userId)) || new Set())];

const listConnectionIdsByProject = (projectId) =>
  [...(connectionIdsByProjectId.get(String(projectId)) || new Set())];

const listConnectionIdsBySession = (sessionId) =>
  [...(connectionIdsBySessionId.get(String(sessionId)) || new Set())];

const listConnectionIdsByUsersInProject = ({ projectId, userIds = [] }) => {
  const projectConnections = connectionIdsByProjectId.get(String(projectId)) || new Set();
  const allowedUsers = new Set(userIds.map((userId) => String(userId)));

  return [...projectConnections].filter((connectionId) => {
    const connection = connections.get(connectionId);

    return connection && allowedUsers.has(String(connection.userId));
  });
};

const writeToConnection = (connection, payload) => {
  if (!connection?.response) {
    return false;
  }

  if (connection.response.destroyed || connection.response.writableEnded) {
    unregister(connection.connectionId, { reason: 'closed_response' });
    return false;
  }

  try {
    connection.response.write(payload);
    return true;
  } catch (error) {
    logger.error(
      '[REALTIME_DELIVERY]',
      'event=write_failed',
      `connectionId=${connection.connectionId}`,
      `userId=${connection.userId}`,
      `projectId=${connection.projectId}`,
      `error=${error.message}`
    );
    unregister(connection.connectionId, { reason: 'write_failed' });
    return false;
  }
};

const sendToConnectionIds = ({ connectionIds = [], event }) => {
  const payload = `event: ${event.type}\ndata: ${JSON.stringify(event)}\n\n`;
  let deliveredCount = 0;

  connectionIds.forEach((connectionId) => {
    const connection = connections.get(connectionId);
    if (writeToConnection(connection, payload)) {
      deliveredCount += 1;
    }
  });

  return {
    attemptedCount: connectionIds.length,
    deliveredCount,
  };
};

const resolveConnectionIdsForEvent = (event) => {
  if (event.scope === REALTIME_EVENT_SCOPE.PROJECT) {
    return listConnectionIdsByProject(event.projectId);
  }

  if (event.scope === REALTIME_EVENT_SCOPE.USER) {
    return listConnectionIdsByUser(event.recipientUserId);
  }

  if (event.scope === REALTIME_EVENT_SCOPE.USER_PROJECT) {
    return listConnectionIdsByUsersInProject({
      projectId: event.projectId,
      userIds: [event.recipientUserId],
    });
  }

  return [];
};

const deliver = (event) => {
  const connectionIds = resolveConnectionIdsForEvent(event);
  const result = sendToConnectionIds({ connectionIds, event });

  logger.log(
    '[REALTIME_DELIVERY]',
    'event=delivered',
    `eventId=${event.eventId}`,
    `eventType=${event.type}`,
    `scope=${event.scope}`,
    `projectId=${event.projectId || '-'}`,
    `recipientUserId=${event.recipientUserId || '-'}`,
    `attemptedCount=${result.attemptedCount}`,
    `deliveredCount=${result.deliveredCount}`
  );

  return result;
};

const markHeartbeat = (connectionId) => {
  const connection = connections.get(connectionId);
  if (!connection) return false;

  connection.lastHeartbeatAt = new Date().toISOString();
  return true;
};

const closeConnectionsByUser = (userId, { reason = 'user_closed' } = {}) => {
  listConnectionIdsByUser(userId).forEach((connectionId) => {
    unregister(connectionId, { reason });
  });
};

const closeConnectionsBySession = (sessionId, { reason = 'session_closed' } = {}) => {
  listConnectionIdsBySession(sessionId).forEach((connectionId) => {
    unregister(connectionId, { reason });
  });
};

const closeConnectionsBySessions = (sessionIds = [], { reason = 'session_closed' } = {}) => {
  [...new Set(sessionIds.filter(Boolean).map((sessionId) => String(sessionId)))]
    .forEach((sessionId) => closeConnectionsBySession(sessionId, { reason }));
};

const closeAll = ({ reason = 'shutdown' } = {}) => {
  [...connections.keys()].forEach((connectionId) => {
    unregister(connectionId, { reason });
  });
};

module.exports = {
  closeAll,
  closeConnectionsBySession,
  closeConnectionsBySessions,
  closeConnectionsByUser,
  deliver,
  getConnection,
  getConnectionCount,
  markHeartbeat,
  register,
  sendToConnectionIds,
  sendToProject: (projectId, event) => sendToConnectionIds({
    connectionIds: listConnectionIdsByProject(projectId),
    event,
  }),
  sendToUser: (userId, event) => sendToConnectionIds({
    connectionIds: listConnectionIdsByUser(userId),
    event,
  }),
  sendToSession: (sessionId, event) => sendToConnectionIds({
    connectionIds: listConnectionIdsBySession(sessionId),
    event,
  }),
  sendToSessions: (sessionIds, event) => sendToConnectionIds({
    connectionIds: [...new Set(sessionIds.flatMap(listConnectionIdsBySession))],
    event,
  }),
  sendToUserInProject: ({ event, projectId, userId }) => sendToConnectionIds({
    connectionIds: listConnectionIdsByUsersInProject({ projectId, userIds: [userId] }),
    event,
  }),
  sendToUsers: (userIds, event) => sendToConnectionIds({
    connectionIds: [...new Set(userIds.flatMap(listConnectionIdsByUser))],
    event,
  }),
  sendToUsersInProject: ({ event, projectId, userIds }) => sendToConnectionIds({
    connectionIds: listConnectionIdsByUsersInProject({ projectId, userIds }),
    event,
  }),
  unregister,
};
