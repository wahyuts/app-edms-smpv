const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { randomUUID, createHash, randomBytes } = require('node:crypto');

const root = path.resolve(__dirname, '../../src');
const allowed = new Set([
  'services/templates/approvalEmail.template.js', 'services/approvalEmailDispatcher.service.js',
  'services/email.service.js', 'services/providers/email.provider.js', 'services/providers/dummy.provider.js',
  'services/providers/resend.provider.js', 'services/devEmailOutbox.service.js',
  'services/approval.service.js', 'services/workflowEngine.service.js',
  'repositories/document.repository.js', 'repositories/projectMembership.repository.js',
  'utils/administration.js', 'utils/userEmail.js', 'utils/storageKeyBuilder.js',
  'utils/storageMetadataCapacity.js', 'utils/fileName.js', 'validators/approval.validator.js',
  'constants/document.constants.js', 'constants/administration.constants.js', 'constants/storage.constants.js',
  'controllers/document.controller.js', 'validators/document.validator.js', 'utils/response.js',
]);

// Fail closed: no native runtime require, env file, database driver, or network API.
const createLoader = (mocks = new Map(), external = new Map()) => {
  const cache = new Map();
  const loaded = [];
  const load = (file) => {
    if (mocks.has(file)) return mocks.get(file);
    assert.ok(allowed.has(file), `Blocked production module: ${file}`);
    if (cache.has(file)) return cache.get(file).exports;
    const filename = path.resolve(root, file);
    const module = { exports: {} };
    cache.set(file, module);
    loaded.push(file);
    const requireIsolated = (request) => {
      if (request === 'node:path') return path;
      if (request === 'node:crypto') return { randomUUID, createHash, randomBytes };
      if (external.has(request)) return external.get(request);
      assert.ok(request.startsWith('.'), `Blocked external dependency: ${request}`);
      const target = path.resolve(path.dirname(filename), `${request}.js`);
      return load(path.relative(root, target).split(path.sep).join('/'));
    };
    new vm.Script(fs.readFileSync(filename, 'utf8'), { filename }).runInNewContext({
      require: requireIsolated, module, exports: module.exports, Date, Buffer, URL,
    });
    return module.exports;
  };
  return { load, loaded };
};

module.exports = { createLoader };
