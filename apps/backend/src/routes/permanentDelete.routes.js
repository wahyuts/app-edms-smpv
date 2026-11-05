const express = require('express');
const { createController } = require('../controllers/permanentDelete.controller');

const createRouter = ({ authenticate, service }) => {
  const router = express.Router();
  const controller = createController(service);
  router.delete('/:documentId/permanent', authenticate, controller.remove);
  router.get('/:documentId/permanent', authenticate, controller.status);
  return router;
};

const createRuntimeRouter = () => {
  const { pool } = require('../config/database');
  const coordination = require('../repositories/documentCoordination.repository');
  const storage = require('../services/storage.service');
  const { createDeleteEngine } = require('../services/documentDelete.service');
  const { createPermanentDeleteApi } = require('../services/permanentDeleteApi.service');
  return createRouter({ authenticate: require('../middlewares/authenticate'),
    service: createPermanentDeleteApi({ pool, coordination, storage, engine: createDeleteEngine({ pool, coordination, storage }) }) });
};

module.exports = { createRouter, createRuntimeRouter };
