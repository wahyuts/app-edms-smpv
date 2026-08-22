const { EventEmitter } = require('node:events');
const logger = require('../config/logger');
const { REALTIME_INTERNAL_EVENT_NAME } = require('../constants/realtime.constants');

const eventBus = new EventEmitter();
eventBus.setMaxListeners(100);

const publish = (event) => {
  eventBus.emit(REALTIME_INTERNAL_EVENT_NAME, event);
};

const subscribe = (listener) => {
  const safeListener = (event) => {
    try {
      listener(event);
    } catch (error) {
      logger.error(
        '[REALTIME_EVENT_BUS]',
        'event=listener_failed',
        `eventType=${event?.type || '-'}`,
        `eventId=${event?.eventId || '-'}`,
        `error=${error.message}`
      );
    }
  };

  eventBus.on(REALTIME_INTERNAL_EVENT_NAME, safeListener);

  return () => {
    eventBus.off(REALTIME_INTERNAL_EVENT_NAME, safeListener);
  };
};

module.exports = {
  publish,
  subscribe,
};
