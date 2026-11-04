const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { digest, namespace } = require('../../src/utils/storageNamespace');
const { cleanupFolderPlan } = require('../../src/services/documentFolderCleanup.service');

const make = () => {
  const ns = namespace({ version: 1, provider: 'local', root: 'synthetic' });
  const plans = [{ namespace: ns, prefix: 'projects/TEST/documents/DOC-1/', rootIdentity: 'root',
    observed: { rootIdentity: 'root', directories: [{ key: 'projects/TEST/documents/DOC-1', identity: 'folder' }], objects: [] } }];
  const inventory = { document: { id: 'D' } };
  const state = { phase: 'MANIFEST_FINALIZED', missing: false, fileTerminal: true, folderFailure: false, finalizations: 0,
    notified: 0, cleanups: 0, trace: [], execution: { operation_id: 'OP', phase: 'MANIFEST_FINALIZED', inventory: JSON.stringify({ inventory,
      folderCleanup: { version: 1, state: 'PREPARED', plans, planDigest: digest(JSON.stringify(plans)) } }) } };
  const c = { beginTransaction: async () => {}, commit: async () => { state.trace.push('COMMIT'); }, rollback: async () => {}, release() {},
    execute: async (sql, args) => {
      if (sql.startsWith('SELECT GET_LOCK')) return [[{ acquired: 1 }]];
      if (sql.startsWith('SELECT IS_USED_LOCK')) return [[{ owned: 1 }]];
      if (sql.startsWith('SELECT RELEASE_LOCK')) return [[{}]];
      if (sql.startsWith('SELECT * FROM document_delete_executions')) return [[{ ...state.execution, phase: state.phase }]];
      if (sql.startsWith('SELECT * FROM document_delete_attempts')) return [[{ state: state.fileTerminal ? 'SUCCEEDED' : 'UNKNOWN' }]];
      if (sql.startsWith('UPDATE document_delete_executions SET inventory=')) {
        state.execution.inventory = args[0]; state.trace.push(JSON.parse(args[0]).folderCleanup.state); return [{ affectedRows: 1 }];
      }
      if (sql.startsWith('UPDATE document_delete_operations SET pending_metadata') || sql.startsWith('UPDATE document_delete_executions SET pending_reason')) return [{ affectedRows: 1 }];
      if (sql.startsWith('SELECT completion_snapshot')) return [[{ completion_snapshot: JSON.stringify({ completedAt: '2026-11-03T00:00:00Z' }) }]];
      throw new Error(`Unexpected SQL: ${sql}`);
    } };
  const repository = { lockOperation: async () => ({ id: 'OP' }), prepare: async () => state.execution,
    inventory: async () => inventory, readManifest: async () => [{ id: 'M', cleanup_state: state.fileTerminal ? 'DELETED' : 'FAILED' }],
    finalize: async (connection, op, execution) => {
      assert.equal(state.missing, true); assert.equal(JSON.parse(execution.inventory).folderCleanup.state, 'CONFIRMED');
      state.finalizations++; state.phase = 'COMPLETED'; state.execution.completion_snapshot = JSON.stringify({ completedAt: '2026-11-03T00:00:00Z' });
    } };
  const storage = {
    cleanupDocumentFolders: async () => {
      assert.equal(JSON.parse(state.execution.inventory).folderCleanup.state, 'RUNNING');
      assert.ok(state.trace.indexOf('RUNNING') < state.trace.lastIndexOf('COMMIT'));
      state.cleanups++; if (state.folderFailure) throw Object.assign(new Error('blocked'), { code: 'LOCAL_FOLDER_NONEMPTY' });
      state.missing = true; state.trace.push('FOLDER_IO'); return { clean: true };
    },
    inspectDocumentFolders: async () => ({ exists: !state.missing, rootIdentity: 'root', objects: [], directories: [] }),
  };
  const module = { exports: {} };
  const mocks = { '../utils/storageNamespace': require('../../src/utils/storageNamespace'),
    '../repositories/documentDelete.repository': { createRepository: () => repository },
    './documentFolderCleanup.service': { cleanupFolderPlan }, '../config/logger': { error() {} },
    './documentDeleteNotification.service': { createDeleteNotificationDispatcher: () => ({ dispatch: async () => { state.notified++; return { status: 'DELIVERED' }; } }) } };
  new vm.Script(fs.readFileSync(path.resolve(__dirname, '../../src/services/documentDelete.service.js'), 'utf8'))
    .runInNewContext({ module, exports: module.exports, require: (key) => {
      if (key === 'node:crypto') return require(key);
      assert.ok(Object.hasOwn(mocks, key), key); return mocks[key];
    } });
  const engine = (hooks = {}) => module.exports.createDeleteEngine({ pool: { getConnection: async () => c }, coordination: {}, storage, hooks });
  return { state, engine };
};
test('folder cleanup intent is durable after files, before metadata finalization and notifications', async () => {
  const f = make(); assert.equal((await f.engine().resume('OP')).status, 'COMPLETED');
  assert.equal(f.state.finalizations, 1); assert.equal(f.state.notified, 1);
});
test('folder nonempty failure is Pending, never Completed or notified; retry keeps the same plan', async () => {
  const f = make(); f.state.folderFailure = true;
  const failed = await f.engine().resume('OP'); assert.equal(failed.status, 'PENDING'); assert.equal(failed.reason, 'LOCAL_FOLDER_NONEMPTY');
  assert.equal(f.state.finalizations, 0); assert.equal(f.state.notified, 0);
  f.state.folderFailure = false; assert.equal((await f.engine().resume('OP')).status, 'COMPLETED');
});
test('interruption after rmdir but before confirmation resumes safely without file deletion replay', async () => {
  const f = make(); const failed = await f.engine({ afterFolderCleanup: () => { throw new Error('interrupted'); } }).resume('OP');
  assert.equal(failed.status, 'PENDING'); assert.equal(f.state.missing, true); assert.equal(f.state.finalizations, 0);
  assert.equal((await f.engine().resume('OP')).status, 'COMPLETED');
});
test('unknown file outcome prevents all folder cleanup', async () => {
  const f = make(); f.state.fileTerminal = false;
  assert.equal((await f.engine().resume('OP')).status, 'PENDING'); assert.equal(f.state.cleanups, 0);
});
test('historical Completed operations are not reopened or relabeled', async () => {
  const f = make(); f.state.phase = 'COMPLETED'; f.state.execution.inventory = '{}';
  f.state.execution.completion_snapshot = JSON.stringify({ completedAt: '2026-11-02T00:00:00Z' });
  const result = await f.engine().resume('OP'); assert.equal(result.status, 'COMPLETED');
  assert.equal(f.state.cleanups, 0); assert.equal(f.state.finalizations, 0); assert.equal(f.state.execution.inventory, '{}');
});
test('legacy unfinished manifest without folder provenance remains Pending, not silently successful', async () => {
  const f = make(); f.state.execution.inventory = JSON.stringify({ inventory: { document: { id: 'D' } } });
  const result = await f.engine().resume('OP'); assert.equal(result.reason, 'FOLDER_PROVENANCE_REQUIRED'); assert.equal(f.state.cleanups, 0);
});
test('real finalizer independently rejects absent folder confirmation before any SQL mutation', async () => {
  const repository = require('../../src/repositories/documentDelete.repository').createRepository({ coordination: {} });
  await assert.rejects(repository.finalize({}, {}, { inventory: JSON.stringify({ inventory: {} }) }, []), { code: 'FOLDER_CLEANUP_NOT_CONFIRMED' });
});
