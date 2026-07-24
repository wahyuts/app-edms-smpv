const loggerConfig = {
  level: process.env.LOG_LEVEL || 'info',
  log: (...args) => console.log(...args),
  error: (...args) => console.error(...args),
};

module.exports = loggerConfig;
