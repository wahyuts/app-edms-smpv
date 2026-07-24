const express = require('express');
const env = require('../config/env');
const { checkDatabaseHealth } = require('../config/database');
const { checkStorageHealth } = require('../services/storage.service');
const { successResponse, errorResponse } = require('../utils/response');

const router = express.Router();

router.get('/', async (req, res) => {
  const [databaseHealth, storageHealth] = await Promise.all([checkDatabaseHealth(), checkStorageHealth()]);
  const timestamp = new Date().toISOString();
  const unhealthyServices = [databaseHealth, storageHealth]
    .filter((service) => service.status !== 'up')
    .map((service) => ({
      service: service.service,
      status: 'down',
    }));

  if (unhealthyServices.length > 0) {
    return errorResponse(res, {
      statusCode: 503,
      message: 'Backend is unhealthy',
      errors: unhealthyServices,
    });
  }

  return successResponse(res, {
    message: 'Backend is healthy',
    data: {
      name: env.appName,
      version: env.appVersion,
      environment: env.appEnv,
      timestamp,
      services: {
        api: 'up',
        database: 'up',
        storage: 'up',
      },
    },
  });
});

module.exports = router;
