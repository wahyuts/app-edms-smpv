const logger = require('../config/logger');

const requestLogger = (req, res, next) => {
  const startTime = process.hrtime.bigint();
  const requestPath = req.path;

  res.on('finish', () => {
    const endTime = process.hrtime.bigint();
    const responseTimeMs = Number(endTime - startTime) / 1_000_000;
    const timestamp = new Date().toISOString();

    logger.log(`[${timestamp}] ${req.method} ${requestPath} ${res.statusCode} ${responseTimeMs.toFixed(2)}ms`);
  });

  next();
};

module.exports = requestLogger;
