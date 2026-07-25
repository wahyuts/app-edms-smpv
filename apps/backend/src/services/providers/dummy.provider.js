const logger = require('../../config/logger');
const env = require('../../config/env');
const devEmailOutboxService = require('../devEmailOutbox.service');

const send = async (email) => {
  logger.log('[EMAIL] Dummy provider accepted email delivery request');

  const outboxEmail = devEmailOutboxService.addEmail({
    ...email,
    from: env.email.from,
  });

  return {
    success: true,
    provider: 'dummy',
    outboxEmailId: outboxEmail?.id || null,
  };
};

module.exports = {
  send,
};
