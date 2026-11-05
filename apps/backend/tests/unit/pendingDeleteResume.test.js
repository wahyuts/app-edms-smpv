const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { createPendingResume, reportDigest, selectScope } = require('../../src/services/pendingDeleteResume.service');
const { namespace, digest, pending } = require('../../src/utils/storageNamespace');
const { createFolderPlan, cleanupFolderPlan } = require('../../src/services/documentFolderCleanup.service');
const { createRepository } = require('../../src/repositories/documentDelete.repository');
const { SCOPES } = require('../../src/services/historicalProvenanceRecovery.service');

const fixture = () => {
  const ns = namespace({ version: 1, provider: 'local', root: 'D:/isolated-fixture', device: '1', inode: '2', birthtime: 3 });
  const target = { environment: 'development', host: '127.0.0.1', connectionPort: 3306, name: 'edms_smpv_dev', version: '10.4.32-MariaDB' };
  const actor = { id: 1, full_name: 'Fixture Admin', department_name_snapshot: 'Fixture' };
  const flags = {}, objects = new Map(), calls = [];
  let db = { operations: [], gates: [], executions: [], manifests: [], attempts: [] }, lockOwner = null, serial = 0;
  const inventories = new Map(), trees = new Map();
  for (const scope of SCOPES) {
    db.operations.push({ id: scope.operationId, document_id: scope.documentId, project_id: scope.projectId,
      document_number_snapshot: scope.documentNumber, initiated_by_user_id: 1, status: 'QUIESCENCE_CONFIRMED', pending_metadata: '{}' });
    db.gates.push({ project_id: scope.projectId, document_id: scope.documentId, gate_state: 'CLOSED', delete_operation_id: scope.operationId });
    const prefix = `projects/${scope.projectCode}/documents/${scope.documentNumber}/`;
    const files = Array.from({ length: scope.documentNumber === 'PID-EDMS-0001' ? 4 : 3 }, (_, i) => ({
      file_id: `${scope.documentId}-F${i}`, storage_key: `${prefix}revisions/f${i}.pdf`, file_size: 7, checksum: digest(`${scope.documentId}:${i}`) }));
    const manifest = files.map(f => ({ namespace: ns, key: f.storage_key, fileIds: [f.file_id],
      localIdentity: { identity: `native:${f.file_id}`, rootIdentity: 'root', sha256: f.checksum, size: 7 } }));
    files.forEach((f, i) => objects.set(f.storage_key, { exists: true, ...manifest[i].localIdentity }));
    inventories.set(scope.operationId, { document: { id: scope.documentId, project_id: scope.projectId,
      document_number: scope.documentNumber, lifecycle_status: 'Active' }, files, manifest });
    trees.set(prefix, { ready: true, exists: true, rootIdentity: 'root', directories: [{ key: prefix.slice(0, -1), identity: `dir:${prefix}` }], objects: files.map(f => f.storage_key) });
  }
  const pool = { async getConnection() {
    const c = { id: ++serial, tx: null, readOnly: false,
      async query(sql) { assert.equal(sql, 'START TRANSACTION READ ONLY'); c.readOnly = true; },
      async beginTransaction() { c.tx = structuredClone(db); },
      async commit() { if (c.tx) db = c.tx; c.tx = null; c.readOnly = false; },
      async rollback() { c.tx = null; c.readOnly = false; }, release() {},
      async execute(sql, args = []) {
        const s = sql.replace(/\s+/g, ' ').trim(), data = c.tx || db;
        const result = v => [structuredClone(v)];
        if (c.readOnly) { assert.match(s, /^SELECT\b/); assert.doesNotMatch(s, /FOR UPDATE|GET_LOCK\(/); }
        if (s.includes('IS_USED_LOCK(?) = CONNECTION_ID()')) return result([{ owned: lockOwner === c.id ? 1 : 0 }]);
        if (s.includes('IS_USED_LOCK(?)')) return result([{ owner: flags.busy ? 99 : lockOwner }]);
        if (s.includes('GET_LOCK(')) { if (lockOwner !== null) return result([{ acquired: 0 }]); lockOwner = c.id; return result([{ acquired: 1 }]); }
        if (s.includes('RELEASE_LOCK(')) { lockOwner = null; return result([{ released: 1 }]); }
        if (s.startsWith('SELECT * FROM document_delete_operations')) return result(data.operations.filter(o => o.id === args[0]));
        if (s.startsWith('SELECT * FROM document_admission_coordinators')) return result(data.gates.filter(g => g.project_id === args[0] && g.document_id === args[1]));
        if (s.includes('FROM projects')) return result([{ id: SCOPES[0].projectId, project_code: flags.wrongProject ? 'OTHER' : 'SS-ALPHA-01', status: 'Active' }]);
        if (s.includes('FROM users')) return result(flags.denied ? [] : [actor]);
        if (s.includes('FROM document_writer_operations') || s.includes('FROM document_storage_io_steps')) return result([]);
        if (s.startsWith('SELECT operation_id FROM document_delete_executions')) return result(data.executions.filter(e => e.operation_id === args[0]));
        if (s.startsWith('SELECT * FROM document_delete_executions')) return result(data.executions.filter(e => e.operation_id === args[0]));
        if (s.includes('FROM document_delete_attempts a JOIN')) return result(flags.existingAttempt ? [{ manifest_id: 'EXISTING' }] : []);
        if (s.startsWith('SELECT * FROM document_delete_attempts')) return result(data.attempts.filter(a => a.manifest_id === args[0]));
        if (s.startsWith('SELECT * FROM document_delete_file_manifest')) return result((args.length ? data.manifests.filter(m => m.delete_operation_id === args[0]) : data.manifests).sort((a, b) => a.id.localeCompare(b.id)));
        if (s.startsWith('SELECT completion_snapshot')) return result(data.executions.filter(e => e.operation_id === args[0]));
        if (s.startsWith('INSERT INTO document_delete_attempts')) {
          data.attempts.push({ manifest_id: args[0], attempt_id: args[1], state: 'IN_FLIGHT', attempt_count: 1 }); return [{ affectedRows: 1 }];
        }
        if (s.startsWith("UPDATE document_delete_attempts SET state='SUCCEEDED'")) {
          data.attempts.find(a => a.manifest_id === args[0]).state = 'SUCCEEDED'; return [{ affectedRows: 1 }];
        }
        if (s.startsWith('UPDATE document_delete_attempts SET state=?')) {
          const a = data.attempts.find(a => a.manifest_id === args[2]); a.state = args[0]; a.error_code = args[1]; return [{ affectedRows: 1 }];
        }
        if (s.startsWith('UPDATE document_delete_file_manifest SET cleanup_state=')) {
          data.manifests.find(m => m.id === args[0]).cleanup_state = s.includes("'DELETED'") && !s.includes("'FAILED'") ? 'DELETED' : 'FAILED'; return [{ affectedRows: 1 }];
        }
        if (s.startsWith('UPDATE document_delete_executions SET inventory=')) {
          data.executions.find(e => e.operation_id === args[1]).inventory = args[0]; return [{ affectedRows: 1 }];
        }
        if (s.startsWith('UPDATE document_delete_operations SET pending_metadata')) {
          data.operations.find(o => o.id === args[1]).pending_metadata = JSON.stringify({ cleanupPendingReason: args[0] }); return [{ affectedRows: 1 }];
        }
        if (s.startsWith('UPDATE document_delete_executions SET pending_reason')) {
          const e = data.executions.find(e => e.operation_id === args[1]); if (e) e.pending_reason = args[0]; return [{ affectedRows: 1 }];
        }
        assert.fail(`Unexpected isolated SQL: ${s}`);
      } };
    return c;
  } };
  const storage = {
    async captureNamespace() { return ns; },
    async inspectOwnedExact(key) { return structuredClone(objects.get(key) || { exists: false, rootIdentity: 'root' }); },
    async inspectDocumentFolders(prefix) {
      const tree = structuredClone(trees.get(prefix));
      tree.objects = [...objects.keys()].filter(k => k.startsWith(prefix)); return tree;
    },
    async deleteOwnedExact(key) {
      calls.push(key); objects.delete(key);
      if (flags.unknown && calls.length === 2) throw pending('LOCAL_DELETE_OUTCOME_UNKNOWN');
      return { terminal: true, outcome: 'DELETE_ACKNOWLEDGED' };
    },
    async cleanupDocumentFolders(plan) { const t = trees.get(plan.prefix); t.exists = false; t.directories = []; return { clean: true }; },
  };
  const repository = {
    async inventory(c, op) { if (flags.foreignReference) throw pending('SHARED_FILE_REFERENCE'); return structuredClone(inventories.get(op.id)); },
    async lockOperation(c, id) { return (c.tx || db).operations.find(o => o.id === id); },
    async prepare(c, op) {
      const inventory = await repository.inventory(c, op), folderCleanup = await createFolderPlan(inventory, storage);
      const execution = { operation_id: op.id, phase: 'MANIFEST_FINALIZED', inventory: JSON.stringify({ inventory, actor, folderCleanup }) };
      const manifest = inventory.manifest.map((m, i) => ({ id: `${op.id}-M${9-i}`, delete_operation_id: op.id,
        provider: 'local', file_reference: m.fileIds[0], exact_storage_key: m.key, storage_key_hash: digest(m.key),
        ownership_evidence: JSON.stringify(m), cleanup_state: 'PENDING' }));
      if (flags.badManifest) manifest[0].ownership_evidence = JSON.stringify({ ...inventory.manifest[0], fileIds: ['OTHER'] });
      if (flags.badExactKey) { manifest[0].exact_storage_key = 'unapproved/file.pdf'; manifest[0].storage_key_hash = digest(manifest[0].exact_storage_key); }
      const canonical = manifest.map(m => ({ id: m.id, provider: m.provider, key: m.exact_storage_key, evidence: m.ownership_evidence })).sort((a,b)=>a.id.localeCompare(b.id));
      execution.manifest_digest = digest(JSON.stringify(canonical));
      c.tx.executions.push(execution); c.tx.manifests.push(...manifest); return execution;
    },
    readManifest: createRepository({}).readManifest,
    async finalize(c, op, execution) {
      assert.equal(JSON.parse(execution.inventory).folderCleanup.state, 'CONFIRMED');
      assert.ok(c.tx.manifests.filter(m => m.delete_operation_id === op.id).every(m => m.cleanup_state === 'DELETED'));
      const e = c.tx.executions.find(e => e.operation_id === op.id); e.phase = 'COMPLETED';
      e.completion_snapshot = JSON.stringify({ operationId: op.id, completedAt: '2026-11-03T00:00:00Z' });
    },
  };
  const module = { exports: {} };
  const mocks = { '../utils/storageNamespace': require('../../src/utils/storageNamespace'),
    '../repositories/documentDelete.repository': { createRepository: () => repository },
    './documentFolderCleanup.service': { cleanupFolderPlan }, '../config/logger': { error() {} },
    './documentDeleteNotification.service': { createDeleteNotificationDispatcher: () => ({ dispatch: async () => ({ status: 'DELIVERED' }) }) } };
  new vm.Script(fs.readFileSync(path.resolve(__dirname, '../../src/services/documentDelete.service.js'), 'utf8'))
    .runInNewContext({ module, exports: module.exports, require(key) { if (key === 'node:crypto') return require(key); assert.ok(Object.hasOwn(mocks, key)); return mocks[key]; } });
  const service = createPendingResume({ pool, coordination: {}, storage, namespace: ns, actorUserId: '1', repository,
    operationIds: SCOPES.map(s => s.operationId), documentIds: SCOPES.map(s => s.documentId),
    engineFactory(args) { if (flags.missingCheckpoint) args.hooks = { ...args.hooks, afterManifest: undefined }; return module.exports.createDeleteEngine(args); } });
  const backups = { verified: true, fixtureOnly: true };
  const dry = async (t = target) => { const report = await service.dryRun({ target: t, backups }); report.databaseEvidence = { unchanged: true };
    report.filesystemEvidence = { unchanged: true }; if (report.verdict === 'PREFLIGHT_PASS') report.approvalDigest = reportDigest(report); return report; };
  const apply = (report, overrides = {}) => service.apply({ report, approvalDigest: report.approvalDigest,
    confirmation: 'RESUME_REVIEWED_PENDING_DELETES', target, backups, ...overrides });
  return { service, dry, apply, flags, objects, calls, inventories, trees, get db() { return db; } };
};

test('Actual engine checkpoints validate reversed manifest order, then delegate exactly seven fixture deletions', async () => {
  const f = fixture(), before = structuredClone(f.db), report = await f.dry();
  assert.equal(report.verdict, 'PREFLIGHT_PASS', JSON.stringify(report.items)); assert.deepEqual(f.db, before); assert.equal(f.calls.length, 0);
  const outcomes = await f.apply(report); assert.equal(outcomes.length, 2); assert.ok(outcomes.every(o => o.status === 'COMPLETED'));
  assert.equal(f.calls.length, 7); assert.equal(f.objects.size, 0);
  assert.equal(f.db.executions.length, 2); assert.ok(f.db.executions.every(e => e.phase === 'COMPLETED'));
  assert.equal(f.db.operations.length, 2); assert.ok(f.db.gates.every(g => g.gate_state === 'CLOSED'));
});

test('internal resume refuses cancellation marker even if an inconsistent CLOSED gate remains', async () => {
  const f = fixture(); const report = await f.dry();
  f.db.operations[0].pending_metadata = JSON.stringify({ reservationRecovery: { state: 'CANCELLED_BEFORE_IO' } });
  await assert.rejects(f.apply(report), error => error.code === 'DELETE_RESERVATION_CANCELLED');
  const fresh = await f.dry();
  assert.equal(fresh.verdict, 'BLOCKED');
  assert.ok(fresh.items.some(item => item.reason === 'DELETE_RESERVATION_CANCELLED'));
  assert.equal(f.calls.length, 0); assert.equal(f.db.executions.length, 0);
});

for (const fault of ['digest', 'identity', 'checksum', 'unknownFile', 'unknownFolder', 'gate', 'reservation', 'execution', 'manifest', 'attempt', 'denied', 'project', 'foreignReference', 'operationAssociation', 'originalActor']) {
  test(`${fault}: rejects before any fixture deletion`, async () => {
    const f = fixture(), report = await f.dry(), key = report.items[0].proofs[0].key;
    if (fault === 'identity') f.objects.get(key).identity = 'replacement';
    if (fault === 'checksum') f.objects.get(key).sha256 = digest('replacement');
    if (fault === 'unknownFile') f.objects.set(report.items[0].folderPlan.plans[0].prefix+'unknown.txt', { exists: true });
    if (fault === 'unknownFolder') f.trees.get(report.items[0].folderPlan.plans[0].prefix).directories.push({ key: 'unexpected', identity: 'new' });
    if (fault === 'gate') f.db.gates[0].gate_state = 'OPEN';
    if (fault === 'reservation') f.db.operations[0].status = 'QUIESCENCE_PENDING';
    if (fault === 'execution') f.db.executions.push({ operation_id: SCOPES[0].operationId });
    if (fault === 'manifest') f.db.manifests.push({ delete_operation_id: SCOPES[0].operationId });
    if (fault === 'attempt') f.flags.existingAttempt = true;
    if (fault === 'denied') f.flags.denied = true;
    if (fault === 'project') f.flags.wrongProject = true;
    if (fault === 'foreignReference') f.flags.foreignReference = true;
    if (fault === 'operationAssociation') f.db.operations[0].document_id = 'OTHER';
    if (fault === 'originalActor') f.db.operations[0].initiated_by_user_id = 2;
    await assert.rejects(f.apply(report, fault === 'digest' ? { approvalDigest: '0'.repeat(64) } : {}));
    assert.equal(f.calls.length, 0);
  });
}
test('Missing afterManifest checkpoint fails closed in guarded storage using actual engine', async () => {
  const f = fixture(), report = await f.dry(); f.flags.missingCheckpoint = true;
  await assert.rejects(f.apply(report)); assert.equal(f.calls.length, 0);
  assert.equal(f.db.executions.length, 1); assert.ok(f.db.attempts.some(a => a.state === 'UNKNOWN'));
});
test('Persisted manifest mismatch stops at afterManifest before first deletion', async () => {
  const f = fixture(), report = await f.dry(); f.flags.badManifest = true;
  await assert.rejects(f.apply(report)); assert.equal(f.calls.length, 0); assert.equal(f.db.attempts.length, 0);
});
test('Wrong exact manifest key fails checkpoint even with recomputed durable hashes', async () => {
  const f = fixture(), report = await f.dry(); f.flags.badExactKey = true;
  await assert.rejects(f.apply(report)); assert.equal(f.calls.length, 0); assert.equal(f.db.attempts.length, 0);
});
test('Partial unknown outcome stops without second operation or automatic retry', async () => {
  const f = fixture(), report = await f.dry(); f.flags.unknown = true;
  await assert.rejects(f.apply(report), e => { assert.equal(e.outcomes.length, 1); assert.equal(e.outcomes[0].status, 'PENDING'); return true; });
  assert.equal(f.calls.length, 2); assert.equal(f.db.executions.length, 1); assert.ok(f.db.attempts.some(a => a.state === 'UNKNOWN'));
  assert.ok(!f.db.executions.some(e => e.operation_id === SCOPES[1].operationId));
});
test('Explicit scope, original actor, approval confirmation and environment are mandatory', async () => {
  assert.throws(() => selectScope(['OTHER'], SCOPES.map(s => s.documentId)));
  assert.throws(() => selectScope(SCOPES.map(s => s.operationId), ['OTHER']));
  assert.throws(() => createPendingResume({ actorUserId: '2', operationIds: SCOPES.map(s => s.operationId), documentIds: SCOPES.map(s => s.documentId) }));
  const f = fixture(), report = await f.dry();
  await assert.rejects(f.dry({ environment: 'production', host: 'remote' }));
  await assert.rejects(f.apply(report, { confirmation: '' })); assert.equal(f.calls.length, 0);
});

test('CLI verifies eight backup artifacts and rejects changed content without touching originals', async () => {
  const fsp = require('node:fs/promises'), os = require('node:os');
  const { verifyBackups } = require('../../scripts/resume-pending-deletes.cjs');
  const dir = await fsp.mkdtemp(path.join(os.tmpdir(), 'edms-resume-backup-test-'));
  const ns = namespace({ version: 1, provider: 'local', root: 'D:/synthetic-live-storage' });
  const target = { name: 'edms_smpv_dev', host: '127.0.0.1', connectionPort: 3306 };
  const database = { path: path.join(dir, 'database.sql'), size: 4, sha256: digest('dump'), tables: 33, verified: true };
  const files = [];
  await fsp.mkdir(path.join(dir, 'files'));
  await fsp.writeFile(database.path, 'dump');
  const manifestPath = path.join(dir, 'manifest.json');
  try {
    for (let i = 0; i < 7; i++) {
      const entry = { fileId: `F${i}`, key: `f${i}.pdf`, path: path.join(dir, 'files', `f${i}.pdf`), size: 7, sha256: digest('fixture') };
      await fsp.writeFile(entry.path, 'fixture'); files.push(entry);
    }
    await fsp.writeFile(manifestPath, JSON.stringify({ version: 1, type: 'PENDING_DELETE_RESUME_BACKUP',
      target: { ...target, port: 3306, namespaceId: ns.id }, database, files }));
    assert.equal((await verifyBackups(manifestPath, target, ns)).verified, true);
    await fsp.writeFile(files[0].path, 'changed');
    await assert.rejects(verifyBackups(manifestPath, target, ns));
  } finally {
    for (const entry of files) await fsp.unlink(entry.path);
    await fsp.unlink(database.path); await fsp.unlink(manifestPath); await fsp.rmdir(path.join(dir, 'files')); await fsp.rmdir(dir);
  }
});
