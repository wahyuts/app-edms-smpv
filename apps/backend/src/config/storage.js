const path = require('node:path');
const env = require('./env');
const { STORAGE_DIRECTORIES, STORAGE_DRIVERS } = require('../constants/storage.constants');

const backendRootPath = path.resolve(__dirname, '..', '..');
const storagePath = env.storage.path;
const rootPath = path.isAbsolute(storagePath)
  ? path.resolve(storagePath)
  : path.resolve(backendRootPath, storagePath);

const storageConfig = {
  driver: env.storage.driver,
  drivers: STORAGE_DRIVERS,
  rootPath,
  temporaryPath: path.resolve(rootPath, STORAGE_DIRECTORIES.TEMPORARY),
  projectsPath: path.resolve(rootPath, STORAGE_DIRECTORIES.PROJECTS),
  r2: env.storage.r2,
};

module.exports = storageConfig;
