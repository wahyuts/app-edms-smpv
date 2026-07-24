const logger = require('../../config/logger');

const send = async () => {
  logger.log('[EMAIL] Dummy provider accepted email delivery request');

  return {
    success: true,
    provider: 'dummy',
  };
};

module.exports = {
  send,
};
