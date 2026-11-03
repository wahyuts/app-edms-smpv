const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const path = require('node:path');
const { operate } = require('../../src/storage/windowsExactFile');
const { loadDrivers } = require('../helpers/deleteStorageDrivers.cjs');
const vm = require('node:vm');

const make = async () => {
  const root = await fs.mkdtemp(path.resolve(__dirname, '../../../../tmp/exact-cleanup-'));
  const outside = await fs.mkdtemp(path.resolve(__dirname, '../../../../tmp/exact-protected-'));
  await fs.mkdir(path.join(root, 'files'));
  await fs.writeFile(path.join(root, 'files/own.pdf'), 'owned fixture');
  await fs.writeFile(path.join(outside, 'protected.pdf'), 'unrelated fixture');
  return { root, outside, key: 'files/own.pdf', local: loadDrivers({ root }).local };
};
const supported = { skip: process.platform !== 'win32' };

test('Runtime storage service forwards durable local identity and exposes read-only inspection without startup IO', async () => {
  const calls = []; const module = { exports: {} };
  const adapter = { deleteOwnedExact: async (...args) => { calls.push(args); return { terminal: true }; },
    inspectOwnedExact: async (...args) => { calls.push(args); return { exists: true }; } };
  const mocks = { '../config/logger': {}, '../config/storage': {}, '../constants/storage.constants': {},
    '../storage/storageDriver.factory': { createStorageDriver: () => adapter }, '../storage/storage.errors': {},
    './documentAdmission.service': {}, '../validators/storage.validator': {} };
  new vm.Script(await fs.readFile(path.resolve(__dirname, '../../src/services/storage.service.js'), 'utf8'))
    .runInNewContext({ module, exports: module.exports, require: (name) => {
      assert.ok(Object.hasOwn(mocks, name)); return mocks[name];
    } });
  const namespace = { id: 'explicit' }; const evidence = { localIdentity: { identity: 'durable' } };
  await module.exports.deleteOwnedExact('own.pdf', namespace, evidence);
  await module.exports.inspectOwnedExact('own.pdf', namespace);
  assert.equal(calls[0][2], evidence); assert.equal(calls[0][1], namespace);
  assert.equal(calls[1].length, 2);
});

test('R2 binding inspection pins constructor namespace and streams checksum; mismatched namespace causes no IO', async () => {
  const requests = [];
  const config = { accountId: 'synthetic', endpoint: 'https://synthetic.r2.cloudflarestorage.com', bucketName: 'development' };
  const driver = loadDrivers({ root: path.resolve('tmp'), send: async (command) => {
    requests.push(command); return { Body: [Buffer.from('syn'), Buffer.from('thetic')] };
  } }).r2(config);
  const namespace = await driver.captureNamespace();
  config.bucketName = 'production'; config.endpoint = 'https://another.r2.cloudflarestorage.com';
  assert.equal((await driver.captureNamespace()).id, namespace.id);
  assert.equal((await driver.inspectOwnedExact('own.pdf', namespace)).size, 9);
  assert.equal(requests[0].input.Bucket, 'development');
  await assert.rejects(driver.inspectOwnedExact('own.pdf', { id: 'other', encoded: '{}' }), { code: 'NAMESPACE_MISMATCH' });
  assert.equal(requests.length, 1);
});

test('Windows exact handle delete acknowledges own file and missing-file retry; unrelated file survives', supported, async () => {
  const f = await make(); const ns = await f.local.captureNamespace();
  const identity = await f.local.inspectOwnedExact(f.key, ns);
  assert.equal(identity.exists, true);
  assert.equal((await f.local.deleteOwnedExact(f.key, ns, { localIdentity: identity })).terminal, true);
  await assert.rejects(fs.stat(path.join(f.root, f.key)), { code: 'ENOENT' });
  assert.equal((await f.local.deleteOwnedExact(f.key, ns, { localIdentity: identity })).terminal, true);
  assert.equal(await fs.readFile(path.join(f.outside, 'protected.pdf'), 'utf8'), 'unrelated fixture');
});

test('Windows exact delete rejects traversal, absolute paths, ADS, DOS aliases and trailing-dot ambiguity', supported, async () => {
  const f = await make();
  for (const key of ['../protected.pdf', 'D:/protected.pdf', 'files/own.pdf:stream', 'files/NUL', 'files/own.pdf.']) {
    await assert.rejects(operate(f.root, key));
  }
  assert.equal(await fs.readFile(path.join(f.root, f.key), 'utf8'), 'owned fixture');
});

test('Windows reparse/junction escape is rejected; outside data survives', supported, async () => {
  const f = await make();
  await fs.symlink(f.outside, path.join(f.root, 'escape'), 'junction');
  await assert.rejects(operate(f.root, 'escape/protected.pdf'), { code: 'LOCAL_LINK_REJECTED' });
  assert.equal(await fs.readFile(path.join(f.outside, 'protected.pdf'), 'utf8'), 'unrelated fixture');
});

test('Windows file symlink escape is rejected when the OS permits symlink creation', supported, async (t) => {
  const f = await make();
  try { await fs.symlink(path.join(f.outside, 'protected.pdf'), path.join(f.root, 'linked.pdf'), 'file'); }
  catch (error) { if (error.code === 'EPERM') { t.skip('Windows account lacks symlink creation privilege; junction/reparse path tested separately'); return; } throw error; }
  await assert.rejects(operate(f.root, 'linked.pdf'), { code: 'LOCAL_LINK_REJECTED' });
  assert.equal(await fs.readFile(path.join(f.outside, 'protected.pdf'), 'utf8'), 'unrelated fixture');
});

test('Windows hard-linked file is rejected rather than deleting a shared object', supported, async () => {
  const f = await make(); await fs.link(path.join(f.root, f.key), path.join(f.outside, 'shared.pdf'));
  await assert.rejects(operate(f.root, f.key), { code: 'LOCAL_SHARED_LINK' });
  assert.equal(await fs.readFile(path.join(f.outside, 'shared.pdf'), 'utf8'), 'owned fixture');
});

test('Parent replacement race is denied while native directory handles are pinned', supported, async () => {
  const f = await make(); const expected = await operate(f.root, f.key); let attempted = false;
  await operate(f.root, f.key, expected, async () => {
    attempted = true;
    await assert.rejects(fs.rename(path.join(f.root, 'files'), path.join(f.root, 'replaced')));
  });
  assert.equal(attempted, true);
  assert.equal(await fs.readFile(path.join(f.outside, 'protected.pdf'), 'utf8'), 'unrelated fixture');
});

test('File replacement and concurrent writes are denied while target handle is pinned', supported, async () => {
  const f = await make(); const expected = await operate(f.root, f.key);
  await operate(f.root, f.key, expected, async () => {
    await assert.rejects(fs.rename(path.join(f.root, f.key), path.join(f.root, 'moved.pdf')));
    await assert.rejects(fs.writeFile(path.join(f.root, f.key), 'not owned'));
  });
});

test('Replacement before handle acquisition is rejected using durable identity, even with identical content', supported, async () => {
  const f = await make(); const expected = await operate(f.root, f.key);
  await fs.rename(path.join(f.root, f.key), path.join(f.root, 'original.pdf'));
  await fs.writeFile(path.join(f.root, f.key), 'owned fixture');
  await assert.rejects(operate(f.root, f.key, expected), { code: 'LOCAL_IDENTITY_MISMATCH' });
  assert.equal(await fs.readFile(path.join(f.root, f.key), 'utf8'), 'owned fixture');
  assert.equal(await fs.readFile(path.join(f.root, 'original.pdf'), 'utf8'), 'owned fixture');
});

test('Native pre-disposition interruption preserves target; subsequent exact retry succeeds', supported, async () => {
  const f = await make(); const expected = await operate(f.root, f.key);
  await assert.rejects(operate(f.root, f.key, expected, () => { throw new Error('Synthetic interruption'); }));
  assert.equal(await fs.readFile(path.join(f.root, f.key), 'utf8'), 'owned fixture');
  await operate(f.root, f.key, expected);
  await assert.rejects(fs.stat(path.join(f.root, f.key)), { code: 'ENOENT' });
});

test('Native namespace/root identity mismatch cannot delete the target', supported, async () => {
  const f = await make(); const expected = await operate(f.root, f.key);
  await assert.rejects(operate(f.root, f.key, { ...expected, rootIdentity: 'another-root' }), { code: 'LOCAL_IDENTITY_MISMATCH' });
  assert.equal(await fs.readFile(path.join(f.root, f.key), 'utf8'), 'owned fixture');
});

test('Concurrent native deletion attempts cannot redirect cleanup or delete unrelated objects', supported, async () => {
  const f = await make(); const expected = await operate(f.root, f.key);
  const results = await Promise.allSettled([operate(f.root, f.key, expected), operate(f.root, f.key, expected)]);
  assert.ok(results.some((result) => result.status === 'fulfilled'));
  await operate(f.root, f.key, expected);
  assert.equal(await fs.readFile(path.join(f.outside, 'protected.pdf'), 'utf8'), 'unrelated fixture');
});
