const env = require('../config/env');
const logger = require('../config/logger');

const errorHandler = (err, req, res, next) => {
  if (res.headersSent) {
    next(err);
    return;
  }

  const rawStatusCode = err.statusCode || err.status || 500;
  const statusCode = rawStatusCode >= 400 && rawStatusCode <= 599 ? rawStatusCode : 500;
  const rawMessage = typeof err.message === 'string' && err.message !== '' ? err.message : 'Internal Server Error';
  const message = env.appEnv === 'production' && statusCode >= 500 ? 'Internal Server Error' : rawMessage;
  const body = {
    success: false,
    message,
  };

  if (err.errors !== undefined && statusCode < 500) {
    body.errors = err.errors;
  }

  if (env.appEnv === 'development' && statusCode >= 500 && err.stack) {
    body.stack = err.stack;
  }

  logger.error(`[ERROR] ${err.name || 'Error'}: ${message}`);
  if (err.code || err.type) {
    logger.error(`[ERROR] code=${err.code || err.type}`);
  }

  return res.status(statusCode).json(body);
};

module.exports = errorHandler;
