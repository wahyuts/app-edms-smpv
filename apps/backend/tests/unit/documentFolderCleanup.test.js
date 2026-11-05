const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const path = require('node:path');
const { loadDrivers } = require('../helpers/deleteStorageDrivers.cjs');
const { operateTree } = require('../../src/storage/windowsExactFile');
const { validateDocumentPrefix, deriveFolderTargets } = require('../../src/utils/documentFolder');
const { createFolderPlan, cleanupFolderPlan } = require('../../src/services/documentFolderCleanup.service');
const { digest, namespace } = require('../../src/utils/storageNamespace');

const supported = { skip: process.platform !== 'win32' };
const make = async (names = ['revisions/IFR-Submitted','revisions/IFA-Submitted','revisions/AS-Built','attachments/process-comments/nested']) => {
  const root = await fs.mkdtemp(path.resolve(__dirname, '../../../../tmp/folder-cleanup-'));
  const prefix = 'projects/TEST/documents/DOC-1/';
  for (const name of names) await fs.mkdir(path.join(root, prefix, name), { recursive: true });
  const driver = loadDrivers({ root }).local; const ns = await driver.captureNamespace();
  const observed = await driver.inspectDocumentFolders(prefix, ns);
  return { root, prefix, driver, ns, observed, plan: { prefix, namespace: ns, rootIdentity: observed.rootIdentity, observed } };
};

test('document prefix accepts only exact document boundary', () => {
  assert.equal(validateDocumentPrefix('projects/TEST/documents/DOC-1/'), 'projects/TEST/documents/DOC-1');
  for (const prefix of ['projects/TEST/documents/','projects/TEST/','../DOC/','projects/TEST/documents/DOC-1',
    'projects/TEST/documents/DOC-1/../','projects/TEST/documents/DOC-1//']) assert.throws(() => validateDocumentPrefix(prefix));
});
test('namespace and document naming mismatch is never inferred as another cleanup target', () => {
  const ns = namespace({ version: 1, provider: 'r2', account: 'test', endpoint: 'https://example.test', bucket: 'test' });
  assert.throws(() => deriveFolderTargets({ document: { document_number: 'OTHER' }, manifest: [{ namespace: ns,
    key: 'projects/TEST/documents/DOC-1/revisions/own.pdf' }] }), { code: 'FOLDER_OWNERSHIP_AMBIGUOUS' });
});
test('Windows removes only owned empty hierarchy bottom-up and preserves ancestors/siblings; repeat is safe', supported, async () => {
  const f = await make(); await fs.mkdir(path.join(f.root, 'projects/TEST/documents/OTHER'));
  await fs.writeFile(path.join(f.root, 'projects/TEST/documents/OTHER/keep.pdf'), 'keep');
  assert.ok(f.observed.directories.length >= 8);
  assert.equal((await f.driver.cleanupDocumentFolders(f.plan)).clean, true);
  assert.equal((await f.driver.inspectDocumentFolders(f.prefix, f.ns)).exists, false);
  assert.ok((await fs.stat(path.join(f.root, 'projects/TEST/documents'))).isDirectory());
  assert.equal(await fs.readFile(path.join(f.root, 'projects/TEST/documents/OTHER/keep.pdf'), 'utf8'), 'keep');
  assert.equal((await f.driver.cleanupDocumentFolders(f.plan)).clean, true);
});
test('unknown image file blocks cleanup without removing it', supported, async () => {
  const f = await make(); const file = path.join(f.root, f.prefix, 'attachments/unknown.png');
  await fs.writeFile(file, 'must survive');
  await assert.rejects(f.driver.cleanupDocumentFolders(f.plan), { code: 'LOCAL_FOLDER_EVIDENCE_CHANGED' });
  assert.equal(await fs.readFile(file, 'utf8'), 'must survive');
});
test('unexpected new empty directory is a changed identity set and stays untouched', supported, async () => {
  const f = await make(); await fs.mkdir(path.join(f.root, f.prefix, 'new-directory'));
  await assert.rejects(f.driver.cleanupDocumentFolders(f.plan), { code: 'LOCAL_FOLDER_EVIDENCE_CHANGED' });
  assert.ok((await fs.stat(path.join(f.root, f.prefix, 'new-directory'))).isDirectory());
});
test('interrupted bottom-up cleanup resumes with matching subset of approved directory identities', supported, async () => {
  const f = await make(); await fs.rmdir(path.join(f.root, f.prefix, 'revisions/AS-Built'));
  assert.equal((await f.driver.cleanupDocumentFolders(f.plan)).clean, true);
});
test('directory replacement is rejected even when the path is the same', supported, async () => {
  const f = await make(['attachments']);
  await fs.rename(path.join(f.root, f.prefix, 'attachments'), path.join(f.root, 'old-owned-directory'));
  await fs.mkdir(path.join(f.root, f.prefix, 'attachments'));
  await assert.rejects(f.driver.cleanupDocumentFolders(f.plan), { code: 'LOCAL_FOLDER_EVIDENCE_CHANGED' });
});
test('junction/reparse never escapes into another document', supported, async () => {
  const f = await make(['attachments']); const outside = await fs.mkdtemp(path.resolve(__dirname, '../../../../tmp/folder-outside-'));
  await fs.writeFile(path.join(outside, 'keep.pdf'), 'protected');
  await fs.symlink(outside, path.join(f.root, f.prefix, 'attachments/escape'), 'junction');
  await assert.rejects(f.driver.inspectDocumentFolders(f.prefix, f.ns), { code: 'LOCAL_LINK_REJECTED' });
  assert.equal(await fs.readFile(path.join(outside, 'keep.pdf'), 'utf8'), 'protected');
});
test('concurrent insertion while native handles are pinned cannot delete the inserted file', supported, async () => {
  const f = await make(['attachments']); const file = path.join(f.root, f.prefix, 'new.pdf'); let inserted = false;
  try {
    await operateTree(f.root, f.prefix.slice(0, -1), f.observed, async () => {
      try { await fs.writeFile(file, 'new data'); inserted = true; } catch (error) { assert.ok(['EPERM','EACCES','EBUSY'].includes(error.code)); }
    });
  } catch (error) { assert.ok(['LOCAL_FOLDER_OUTCOME_UNKNOWN','LOCAL_FOLDER_EVIDENCE_CHANGED'].includes(error.code)); }
  if (inserted) assert.equal(await fs.readFile(file, 'utf8'), 'new data');
});

const r2 = (responses) => {
  const calls = [];
  const driver = loadDrivers({ root: path.resolve('tmp'), send: async (command) => {
    calls.push(command); return responses.shift() || {};
  } }).r2({ accountId: 'synthetic', bucketName: 'development', endpoint: 'https://synthetic.r2.cloudflarestorage.com', region: 'auto' });
  return { driver, calls };
};
test('R2 empty prefix needs no DeleteObject or synthetic marker', async () => {
  const f = r2([{}]); const ns = await f.driver.captureNamespace();
  assert.equal((await f.driver.cleanupDocumentFolders({ prefix: 'projects/TEST/documents/DOC-1/', namespace: ns })).clean, true);
  assert.deepEqual(f.calls.map((c) => c.command), ['ListObjectsV2Command']);
  assert.equal(f.calls[0].input.Prefix, 'projects/TEST/documents/DOC-1/');
  assert.equal(f.calls[0].input.Bucket, 'development');
});
test('R2 scans every page and retains unknown objects without recursive deletion', async () => {
  const key = 'projects/TEST/documents/DOC-1/unknown.pdf';
  const f = r2([{ IsTruncated: true, NextContinuationToken: 'next' }, { Contents: [{ Key: key, Size: 10, ETag: 'opaque' }] }]);
  const ns = await f.driver.captureNamespace();
  await assert.rejects(f.driver.cleanupDocumentFolders({ prefix: 'projects/TEST/documents/DOC-1/', namespace: ns }), { code: 'FOLDER_UNKNOWN_OBJECT' });
  assert.equal(f.calls.length, 2); assert.ok(f.calls.every((c) => c.command === 'ListObjectsV2Command'));
});
test('R2 markers, including reviewed candidates, stay blocked without a proven safe conditional-delete capability', async () => {
  const key = 'projects/TEST/documents/DOC-1/revisions/';
  const f = r2([{ Contents: [{ Key: key, Size: 0, ETag: 'marker' }] }]); const ns = await f.driver.captureNamespace();
  await assert.rejects(f.driver.cleanupDocumentFolders({ prefix: 'projects/TEST/documents/DOC-1/', namespace: ns,
    verifiedMarkers: [{ key, size: 0, etag: 'marker', sha256: digest('') }] }), { code: 'R2_MARKER_SAFE_DELETE_UNAVAILABLE' });
  assert.equal(f.calls.length, 1);
});
test('R2 malformed pagination, namespace mismatch and cross-prefix objects fail closed', async () => {
  const f = r2([{ IsTruncated: true }]); const ns = await f.driver.captureNamespace();
  await assert.rejects(f.driver.inspectDocumentFolders('projects/TEST/documents/DOC-1/', ns), { code: 'FOLDER_LIST_INCOMPLETE' });
  await assert.rejects(f.driver.inspectDocumentFolders('projects/TEST/documents/DOC-1/', { id: 'other' }), { code: 'NAMESPACE_MISMATCH' });
  const g = r2([{ Contents: [{ Key: 'projects/TEST/documents/OTHER/file.pdf' }] }]);
  await assert.rejects(g.driver.inspectDocumentFolders('projects/TEST/documents/DOC-1/', await g.driver.captureNamespace()), { code: 'FOLDER_SCOPE_INVALID' });
});
test('durable plan rejects unknown content, root mismatch, and modified plan digest', async () => {
  const ns = namespace({ version: 1, provider: 'local', root: 'D:/synthetic' });
  const inventory = { document: { document_number: 'DOC-1' }, manifest: [{ namespace: ns, key: 'projects/TEST/documents/DOC-1/revisions/own.pdf', localIdentity: { rootIdentity: 'native-root' } }] };
  const adapter = { inspectDocumentFolders: async () => ({ rootIdentity: 'native-root', objects: ['projects/TEST/documents/DOC-1/unknown.pdf'] }) };
  await assert.rejects(createFolderPlan(inventory, adapter), { code: 'FOLDER_UNKNOWN_OBJECT' });
  adapter.inspectDocumentFolders = async () => ({ rootIdentity: 'other', objects: [] });
  await assert.rejects(createFolderPlan(inventory, adapter), { code: 'FOLDER_ROOT_IDENTITY_MISMATCH' });
  await assert.rejects(cleanupFolderPlan({ version: 1, plans: [{}], planDigest: 'invalid' }, adapter), { code: 'FOLDER_PROVENANCE_REQUIRED' });
});
