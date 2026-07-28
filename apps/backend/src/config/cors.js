const env = require('./env');

const allowedOrigins = env.corsAllowedOrigins
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);

const corsConfig = {
  origin(origin, callback) {
    if (!origin) {
      callback(null, true);
      return;
    }

    if (allowedOrigins.includes(origin)) {
      callback(null, true);
      return;
    }

    callback(null, false);
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  exposedHeaders: ['Content-Disposition', 'Content-Length', 'Content-Type'],
  optionsSuccessStatus: 204,
};

module.exports = corsConfig;
