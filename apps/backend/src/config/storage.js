const path = require('node:path');
const env = require('./env');
const { STORAGE_DIRECTORIES } = require('../constants/storage.constants');

const backendRootPath = path.resolve(__dirname, '..', '..');
const rootPath = path.isAbsolute(env.storagePath)
  ? path.resolve(env.storagePath)
  : path.resolve(backendRootPath, env.storagePath);

const storageConfig = {
  rootPath,
  projectsPath: path.resolve(rootPath, STORAGE_DIRECTORIES.PROJECTS),
};

module.exports = storageConfig;
