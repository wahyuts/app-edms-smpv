const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const path = require('node:path');
const os = require('node:os');
const { namespace, r2Namespace, sameNamespace } = require('../../src/utils/storageNamespace');
const { bindNewFile } = require('../../src/repositories/storageNamespace.repository');
const { loadDrivers } = require('../helpers/deleteStorageDrivers.cjs');

const config = { accountId: 'synthetic', endpoint: 'https://synthetic.r2.cloudflarestorage.com', bucketName: 'development', region: 'auto' };

test('namespace distinguishes R2 development/production and ignores credential rotation', () => {
  const a = r2Namespace(config);
  assert.ok(sameNamespace(a, r2Namespace({ ...config, accessKeyId: 'rotated', secretAccessKey: 'not-persisted' })));
  assert.notEqual(a.id, r2Namespace({ ...config, bucketName: 'production' }).id);
  assert.doesNotMatch(a.encoded, /secret|accessKey|rotated/);
});

test('namespace rejects credential-bearing endpoints and ambiguous descriptors', () => {
  for (const patch of [{ endpoint: 'https://user:password@example.test' }, { endpoint: 'https://example.test/?token=x' },
    { endpoint: 'http://example.test' }, { bucketName: '' }, { accountId: '' }]) {
    assert.throws(() => r2Namespace({ ...config, ...patch }));
  }
});

test('actual R2 driver pins exact bucket/key; mismatch never sends IO', async () => {
  const requests = [];
  const driver = loadDrivers({ root: os.tmpdir(), send: async (command) => { requests.push(command); return {}; } }).r2(config);
  const captured = await driver.captureNamespace();
  assert.equal((await driver.deleteOwnedExact('legacy/outside-prefix.pdf', captured)).terminal, true);
  assert.equal(requests[0].command, 'DeleteObjectCommand');
  assert.equal(requests[0].input.Bucket, 'development');
  assert.equal(requests[0].input.Key, 'legacy/outside-prefix.pdf');
  await assert.rejects(driver.deleteOwnedExact('legacy/outside-prefix.pdf', r2Namespace({ ...config, bucketName: 'production' })), { code: 'NAMESPACE_MISMATCH' });
  await assert.rejects(driver.deleteOwnedExact('../outside', captured));
  assert.equal(requests.length, 1);
});

test('R2 absence/delete acknowledgement is terminal; timeout is not silently accepted', async () => {
  let timeout = false;
  const driver = loadDrivers({ root: os.tmpdir(), send: async () => {
    if (timeout) throw Object.assign(new Error('synthetic'), { code: 'ETIMEDOUT' });
    return {};
  } }).r2(config);
  const captured = await driver.captureNamespace();
  assert.equal((await driver.deleteOwnedExact('missing/file.pdf', captured)).outcome, 'DELETE_ACKNOWLEDGED');
  timeout = true;
  await assert.rejects(driver.deleteOwnedExact('existing/file.pdf', captured), { code: 'ETIMEDOUT' });
});

test('local sandbox: root identity, traversal and missing safe unlink primitive are fail-closed', async () => {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), 'edms-sprint-b-'));
  const file = path.join(root, 'own.pdf');
  await fs.writeFile(file, 'synthetic fixture');
  const driver = loadDrivers({ root }).local;
  const captured = await driver.captureNamespace();
  assert.equal(captured.descriptor.root, await fs.realpath(root));
  await assert.rejects(driver.deleteOwnedExact('../outside', captured));
  await assert.rejects(driver.deleteOwnedExact('own.pdf', captured), { code: 'LOCAL_SAFE_DELETE_UNAVAILABLE' });
  assert.equal(await fs.readFile(file, 'utf8'), 'synthetic fixture');
  const other = namespace({ ...captured.descriptor, root: `${root}-different` });
  await assert.rejects(driver.deleteOwnedExact('own.pdf', other), { code: 'NAMESPACE_MISMATCH' });
  // Remove only this exact test-owned file, not a computed recursive directory tree.
  await fs.unlink(file); await fs.rmdir(root);
});

test('local sandbox: parent junction/symlink escape is rejected without touching outside data', async () => {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), 'edms-sprint-b-link-'));
  const outside = await fs.mkdtemp(path.join(os.tmpdir(), 'edms-sprint-b-outside-'));
  const file = path.join(outside, 'protected.pdf'); const link = path.join(root, 'escape');
  await fs.writeFile(file, 'must survive');
  try {
    await fs.symlink(outside, link, process.platform === 'win32' ? 'junction' : 'dir');
    const driver = loadDrivers({ root }).local;
    await assert.rejects(driver.deleteOwnedExact('escape/protected.pdf', await driver.captureNamespace()), { code: 'LOCAL_LINK_REJECTED' });
    assert.equal(await fs.readFile(file, 'utf8'), 'must survive');
  } finally {
    await fs.unlink(link).catch(async (error) => { if (error.code === 'EPERM') await fs.rmdir(link); else if (error.code !== 'ENOENT') throw error; });
    await fs.unlink(file); await fs.rmdir(root); await fs.rmdir(outside);
  }
});

test('new-file binding requires the provenance schema and rejects absent or partial schema', async () => {
  const captured = r2Namespace(config);
  await assert.rejects(bindNewFile({ execute: async () => [[]] }, 'F', 'file.pdf', captured), { code: 'NAMESPACE_SCHEMA_INCOMPLETE' });
  await assert.rejects(bindNewFile({ execute: async () => [[{ TABLE_NAME: 'storage_namespaces' }]] }, 'F', 'file.pdf', captured), { code: 'NAMESPACE_SCHEMA_INCOMPLETE' });
});

test('new-file binding persists the adapter snapshot using the supplied transaction', async () => {
  const captured = r2Namespace(config); const calls = [];
  const c = { execute: async (sql, args) => {
    calls.push({ sql, args });
    if (sql.startsWith('SELECT TABLE_NAME')) return [[{}, {}]];
    if (sql.startsWith('SELECT descriptor')) return [[{ descriptor: captured.encoded }]];
    return [{ affectedRows: 1 }];
  } };
  assert.equal(await bindNewFile(c, 'FILE-SYNTHETIC', 'legacy/file.pdf', captured), true);
  const binding = calls.find((r) => r.sql.includes('INSERT INTO stored_file_namespace_bindings'));
  assert.equal(binding.args[0], 'FILE-SYNTHETIC'); assert.equal(binding.args[1], captured.id);
  assert.equal(binding.args[2], 'legacy/file.pdf');
  assert.ok(calls.every((r) => !/UPDATE stored_files|ALTER|DELETE FROM/.test(r.sql)));
});

test('Sprint B migrations are additive and equivalent; Sprint A remains separate', async () => {
  const directory = path.resolve(__dirname, '../../../../database/migration');
  const mysql = await fs.readFile(path.join(directory, '20261102_0002_permanent_delete_cleanup_mysql.sql'), 'utf8');
  const maria = await fs.readFile(path.join(directory, '20261102_0002_permanent_delete_cleanup_mariadb.sql'), 'utf8');
  assert.equal(mysql.slice(mysql.indexOf('CREATE TABLE')).replace(/\r/g, ''), maria.slice(maria.indexOf('CREATE TABLE')).replace(/\r/g, ''));
  assert.equal((mysql.match(/CREATE TABLE/g) || []).length, 4);
  assert.doesNotMatch(mysql.slice(mysql.indexOf('CREATE TABLE')), /\b(?:DROP|TRUNCATE|ALTER|INSERT|UPDATE|DELETE FROM)\b/);
});

test('actual stored-file repository binds new uploads in the supplied transaction without changing metadata values', async () => {
  const { createLoader } = require('../helpers/approvalEmailLoader');
  const captured = r2Namespace(config); const calls = []; let captures = 0;
  const connection = { execute: async (sql, args) => {
    calls.push({ sql, args });
    if (sql.startsWith('SELECT TABLE_NAME')) return [[{}, {}]];
    if (sql.startsWith('SELECT descriptor')) return [[{ descriptor: captured.encoded }]];
    return [{ affectedRows: 1 }];
  } };
  const loader = createLoader(new Map([
    ['config/database.js', { pool: {} }], ['config/logger.js', { error() {}, log() {} }],
    ['services/storage.service.js', { captureNamespace: async () => { captures += 1; return captured; } }],
    ['repositories/storageNamespace.repository.js', { bindNewFile }],
  ]));
  await loader.load('repositories/document.repository.js').insertStoredFile(connection, {
    fileId: 'FILE-SYNTHETIC', projectId: 'PROJECT', documentId: 'DOCUMENT', originalFileName: 'Original.pdf',
    physicalFileName: 'unchanged.pdf', extension: 'pdf', mimeType: 'application/pdf', fileSize: 9,
    storageKey: 'legacy/unchanged.pdf', relativePath: 'legacy/unchanged.pdf', fileCategory: 'Revision File',
    checksum: null, uploadedByUserId: 1, isActive: true,
  });
  assert.equal(captures, 1);
  assert.match(calls[0].sql, /INSERT INTO stored_files/);
  assert.equal(calls[0].args[3], 'Original.pdf'); assert.equal(calls[0].args[4], 'unchanged.pdf');
  assert.equal(calls[0].args[9], 'legacy/unchanged.pdf');
  assert.match(calls.at(-1).sql, /INSERT INTO stored_file_namespace_bindings/);
});
