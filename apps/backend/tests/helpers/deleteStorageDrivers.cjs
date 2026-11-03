const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const source = path.resolve(__dirname, '../../src');

const loadDrivers = ({ root, send = async () => ({}) }) => {
  const config = { rootPath: root, temporaryPath: path.join(root, 'temporary'), projectsPath: path.join(root, 'projects') };
  const cache = new Map();
  const sdk = {};
  for (const name of ['PutObjectCommand','GetObjectCommand','HeadObjectCommand','CopyObjectCommand','DeleteObjectCommand','DeleteObjectsCommand','ListObjectsV2Command']) {
    sdk[name] = class { constructor(input) { this.input = input; this.command = name; } };
  }
  sdk.S3Client = class { async send(command) { return send(command); } };
  const allowed = new Set(['storage/drivers/localStorage.driver.js','storage/drivers/r2Storage.driver.js',
    'utils/storagePath.js','utils/storageNamespace.js','utils/documentFolder.js','validators/storage.validator.js','constants/storage.constants.js','storage/storage.errors.js']);
  const load = (file) => {
    if (file === 'config/storage.js') return config;
    if (file === 'config/logger.js') return { error() {}, log() {} };
    assert.ok(allowed.has(file), `Unexpected runtime dependency ${file}`);
    if (cache.has(file)) return cache.get(file).exports;
    const filename = path.join(source, file); const module = { exports: {} }; cache.set(file, module);
    const isolated = (request) => {
      if (request.startsWith('node:')) return require(request);
      if (request === '../windowsExactFile') return require('../../src/storage/windowsExactFile');
      if (request === '@aws-sdk/client-s3') return sdk;
      if (request === '@aws-sdk/lib-storage') return { Upload: class { constructor() { throw new Error('Network upload forbidden'); } } };
      assert.ok(request.startsWith('.'));
      return load(path.relative(source, path.resolve(path.dirname(filename), `${request}.js`)).split(path.sep).join('/'));
    };
    new vm.Script(fs.readFileSync(filename, 'utf8'), { filename }).runInNewContext({ require: isolated, module, exports: module.exports, Buffer, URL, Date });
    return module.exports;
  };
  const Local = load('storage/drivers/localStorage.driver.js');
  const R2 = load('storage/drivers/r2Storage.driver.js');
  return { local: new Local(config), r2: (r2) => new R2({ r2 }) };
};

module.exports = { loadDrivers };
