const test = require('node:test');
const assert = require('node:assert/strict');
const { digest, namespace } = require('../../src/utils/storageNamespace');
const { createResidualCleanup, reportDigest } = require('../../src/services/residualDocumentFolders.service');

const fixture = () => {
  const ns = namespace({ version: 1, provider: 'local', root: 'D:/synthetic' });
  const prefix = 'projects/TEST/documents/DOC-1/';
  const file = { namespace: ns, key: prefix + 'revisions/file.pdf', fileIds: ['F'], localIdentity: { rootIdentity: 'root' } };
  const manifest = [{ id: 'M', provider: 'local', file_reference: 'F', exact_storage_key: file.key,
    storage_key_hash: digest(file.key), ownership_evidence: JSON.stringify(file), cleanup_state: 'DELETED' }];
  const state = { live: false, other: false, auditMissing: false, missing: false, objects: [], active: false, io: false, admin: true, audits: [],
    directoryIdentity: '1:2:133000000000000000', mutated: false, failCleanup: false, failAudit: false };
  const op = { id: 'OP', project_id: 'P', document_id: 'D', document_number_snapshot: 'DOC-1', status: 'QUIESCENCE_CONFIRMED' };
  const execution = { operation_id: 'OP', phase: 'COMPLETED', inventory: JSON.stringify({ inventory: {
    document: { id: 'D', project_id: 'P', document_number: 'DOC-1' }, manifest: [file] } }),
  completion_snapshot: JSON.stringify({ operationId: 'OP', projectId: 'P', documentId: 'D', documentNumber: 'DOC-1', completedAt: '2026-11-02T00:00:00Z' }),
  manifest_digest: digest(JSON.stringify([{ id: 'M', provider: 'local', key: file.key, evidence: JSON.stringify(file) }])) };
  let before;
  const c = { beginTransaction: async () => { before = { inventory: execution.inventory, audits: structuredClone(state.audits) }; },
    commit: async () => {}, rollback: async () => { if (before) { execution.inventory = before.inventory; state.audits = before.audits; } }, release() {},
    execute: async (sql, args) => {
      if (sql.startsWith('SELECT GET_LOCK')) return [[{ acquired: 1 }]];
      if (sql.startsWith('SELECT RELEASE_LOCK')) return [[{}]];
      if (sql.startsWith("SELECT operation_id FROM document_delete_executions WHERE phase=")) return [[{ operation_id: 'OP' }]];
      if (sql.startsWith('SELECT * FROM document_delete_operations')) return [[op]];
      if (sql.startsWith('SELECT * FROM document_delete_executions')) return [[execution]];
      if (sql.startsWith('SELECT id FROM audit_trail WHERE identity_key=') && sql.includes('AND project_id')) return [state.auditMissing ? [] : [{ id: 'AUDIT' }]];
      if (sql.startsWith('SELECT id FROM audit_trail WHERE identity_key=')) return [state.audits.length ? [{ id: 'NEW' }] : []];
      if (sql.startsWith('SELECT * FROM document_delete_file_manifest')) return [manifest];
      if (sql.startsWith('SELECT state FROM document_delete_attempts')) return [[{ state: 'SUCCEEDED' }]];
      if (sql.startsWith('SELECT file_id,storage_key FROM stored_files')) return [[]];
      if (sql.startsWith('SELECT project_code FROM projects')) return [[{ project_code: 'TEST' }]];
      if (sql.startsWith('SELECT id FROM engineering_documents')) return [state.live ? [{ id: 'NEW_DOCUMENT' }] : []];
      if (sql.startsWith('SELECT id FROM document_delete_operations')) return [state.other ? [{ id: 'OTHER' }] : []];
      if (sql.startsWith('SELECT id FROM projects WHERE id=')) return [[{ id: 'P' }]];
      if (sql.startsWith('SELECT id FROM document_writer_operations')) return [state.active ? [{ id: 'W' }] : []];
      if (sql.startsWith('SELECT s.id FROM document_storage_io_steps')) return [state.io ? [{ id: 'IO' }] : []];
      if (sql.startsWith('SELECT u.id,u.full_name')) return [state.admin ? [{ id: 1, full_name: 'Admin', department_name_snapshot: 'Test' }] : []];
      if (sql.startsWith('SELECT operation_id FROM document_delete_executions WHERE operation_id=')) return [[{ operation_id: 'OP' }]];
      if (sql.startsWith('UPDATE document_delete_executions SET inventory=')) {
        assert.match(sql, /phase='COMPLETED'/); execution.inventory = args[0]; state.mutated = true; return [{ affectedRows: 1 }];
      }
      if (sql.startsWith('INSERT INTO audit_trail')) {
        if (state.failAudit) throw new Error('audit failed');
        state.audits.push(args); return [{ affectedRows: 1 }];
      }
      throw new Error(`Unexpected SQL: ${sql}`);
    } };
  const storage = { inspectDocumentFolders: async () => ({ exists: !state.missing, rootIdentity: 'root', objects: state.objects,
    directories: state.missing ? [] : [{ key: prefix.slice(0, -1), identity: state.directoryIdentity }] }),
  cleanupDocumentFolders: async () => {
    assert.equal(Object.values(JSON.parse(execution.inventory).residualFolderCleanup)[0].state, 'RUNNING');
    if (state.failCleanup) throw new Error('interrupted'); state.missing = true; return { clean: true };
  } };
  const service = createResidualCleanup({ namespaces: [{ namespace: ns, storage }],
    coordination: { lockGate: async () => ({ gate_state: 'CLOSED', delete_operation_id: 'OP' }) } });
  const target = { db: 'synthetic' };
  const dry = async () => {
    const report = await service.dryRun(c, target); report.databaseEvidence = { unchanged: true }; report.approvalDigest = reportDigest(report); return report;
  };
  const apply = (report, patch = {}) => service.apply({ getConnection: async () => c }, { report, approvalDigest: report.approvalDigest,
    confirmation: 'CLEAN_REVIEWED_EMPTY_DOCUMENT_FOLDERS', actorUserId: 1, target, ...patch });
  return { state, execution, dry, apply };
};
test('residual dry-run validates durable manifest/audit and does not mutate Completed history', async () => {
  const f = fixture(); const original = f.execution.inventory;
  assert.equal((await f.dry()).items[0].status, 'ELIGIBLE_EMPTY_TREE'); assert.equal(f.state.mutated, false);
  assert.equal(f.execution.inventory, original); assert.equal(f.execution.phase, 'COMPLETED');
});
test('residual classifies unknown files as blocked and already missing trees as clean', async () => {
  const f = fixture(); f.state.objects = ['unknown.png']; assert.equal((await f.dry()).items[0].status, 'BLOCKED_NONEMPTY');
  f.state.objects = []; f.state.missing = true; assert.equal((await f.dry()).items[0].status, 'MISSING_OR_ALREADY_CLEAN');
});
for (const field of ['live','other','auditMissing']) test(`residual requires unambiguous historical provenance: ${field}`, async () => {
  const f = fixture(); f.state[field] = true; assert.equal((await f.dry()).items[0].status, 'AMBIGUOUS');
});
test('folder recreated after Completed is ambiguous, not eligible based on path alone', async () => {
  const f = fixture(); f.state.directoryIdentity = '1:2:999999999999999999';
  assert.equal((await f.dry()).items[0].reason, 'FOLDER_RECREATED_AFTER_COMPLETION');
});
test('residual apply uses durable intent and audit without changing original Completed phase/time', async () => {
  const f = fixture(); const report = await f.dry(); const completed = f.execution.completion_snapshot;
  assert.equal((await f.apply(report))[0].status, 'CLEAN'); assert.equal(f.state.audits.length, 1);
  assert.equal(f.execution.phase, 'COMPLETED'); assert.equal(f.execution.completion_snapshot, completed);
  assert.equal((await f.apply(report))[0].status, 'CLEAN'); assert.equal(f.state.audits.length, 1);
});
test('residual interrupted cleanup resumes with same approved directory identity, no reset', async () => {
  const f = fixture(); const report = await f.dry(); f.state.failCleanup = true;
  await assert.rejects(f.apply(report), /interrupted/);
  assert.equal(Object.values(JSON.parse(f.execution.inventory).residualFolderCleanup)[0].state, 'RUNNING');
  f.state.failCleanup = false; assert.equal((await f.apply(report))[0].status, 'CLEAN');
});
test('residual audit failure after rmdir retries from durable intent and missing-tree evidence', async () => {
  const f = fixture(); const report = await f.dry(); f.state.failAudit = true;
  await assert.rejects(f.apply(report), /audit failed/); assert.equal(f.state.missing, true); assert.equal(f.state.audits.length, 0);
  f.state.failAudit = false; assert.equal((await f.apply(report))[0].status, 'CLEAN'); assert.equal(f.state.audits.length, 1);
});
test('residual refuses changed evidence, active writer/IO, unauthorized actor, and missing confirmation', async () => {
  for (const field of ['active','io','admin','directoryIdentity']) {
    const f = fixture(); const report = await f.dry(); f.state[field] = field === 'admin' ? false : field === 'directoryIdentity' ? 'changed' : true;
    await assert.rejects(f.apply(report)); assert.equal(f.state.missing, false);
  }
  const f = fixture(); await assert.rejects(f.apply(await f.dry(), { confirmation: 'no' }), { code: 'RESIDUAL_APPROVAL_REQUIRED' });
});
