const test = require('node:test');
const assert = require('node:assert/strict');
const { createEligibilityPreflight } = require('../../src/services/deleteEligibility.service');
const { r2Namespace } = require('../../src/utils/storageNamespace');
const ns = r2Namespace({ accountId: 'fixture', endpoint: 'https://fixture.invalid', bucketName: 'fixture' });
const data = () => ({ files: [{ file_id: 'F', checksum: 'a'.repeat(64), file_size: 3 }],
  bindings: [{ file_id: 'F', evidence: JSON.stringify({ sha256: 'a'.repeat(64), size: 3 }) }],
  manifest: [{ namespace: ns, fileIds: ['F'] }] });
test('complete provenance and configured namespace are eligible without storage mutation', async () => {
  const check = createEligibilityPreflight({ repository: { inventory: async () => data() },
    storage: { captureNamespace: async () => ns } });
  assert.deepEqual(await check({}, 'P', 'D'), { blocked: false });
});
for (const change of [d => { d.bindings = []; }, d => { d.bindings[0].evidence = '{'; },
  d => { d.bindings[0].evidence = '{}'; }, d => { d.files[0].checksum = 'b'.repeat(64); },
  d => { d.files[0].file_size = 9; }, d => { d.files = []; },
  d => { d.manifest[0].namespace = { ...ns, descriptor: { provider: 'local' } }; }]) {
  test(`incomplete/mismatching ownership is definitive: ${change.toString()}`, async () => {
    const inventory = data(); change(inventory);
    const check = createEligibilityPreflight({ repository: { inventory: async () => inventory } });
    assert.equal((await check({}, 'P', 'D')).reasonCode, 'DELETE_OWNERSHIP_UNVERIFIED');
  });
}
test('wrong configured namespace is rejected', async () => {
  const check = createEligibilityPreflight({ repository: { inventory: async () => data() },
    storage: { captureNamespace: async () => r2Namespace({ accountId: 'other', endpoint: 'https://fixture.invalid', bucketName: 'fixture' }) } });
  assert.equal((await check({}, 'P', 'D')).blocked, true);
});
for (const code of ['ETIMEDOUT', 'ER_NO_SUCH_TABLE', 'UNREVIEWED_DOCUMENT_DEPENDENCY']) {
  test(`temporary/schema/unrelated error is not possible legacy: ${code}`, async () => {
    const error = Object.assign(new Error(code), { code, pending: true });
    const check = createEligibilityPreflight({ repository: { inventory: async () => { throw error; } } });
    await assert.rejects(check({}, 'P', 'D'), e => e === error);
  });
}
