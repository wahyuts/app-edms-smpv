const storageConfig = require('../config/storage');
const { STORAGE_DRIVERS } = require('../constants/storage.constants');
const LocalStorageDriver = require('./drivers/localStorage.driver');
const R2StorageDriver = require('./drivers/r2Storage.driver');

const createStorageDriver = () => {
  if (storageConfig.driver === STORAGE_DRIVERS.LOCAL) {
    return new LocalStorageDriver(storageConfig);
  }

  if (storageConfig.driver === STORAGE_DRIVERS.R2) {
    return new R2StorageDriver(storageConfig);
  }

  throw new Error(`[STORAGE] Unsupported storage driver: ${storageConfig.driver}`);
};

module.exports = {
  createStorageDriver,
};
