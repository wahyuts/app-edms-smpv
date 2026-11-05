const test = require('node:test');
const assert = require('node:assert/strict');
const { createRecovery, STAGING_TARGETS } = require('../../src/services/deleteReservationRecovery.service');
const { r2Namespace } = require('../../src/utils/storageNamespace');
const { fixture: coordinationFixture } = require('../helpers/isolatedDocumentCoordination.cjs');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { Readable, Writable } = require('node:stream');
const fixture = (options = {}) => {
  const namespace = r2Namespace({ accountId: 'fixture', endpoint: 'https://fixture.invalid', bucketName: 'staging-fixture' });
  const targets = STAGING_TARGETS.map(item => ({ ...item }));
  const target = { railwayEnvironment: 'staging', database: 'fixture', serverUuid: 'fixture-uuid', serviceId: 'fixture-service', namespaceId: namespace.id };
  let time = 100000; let snapshot;
  const lifecycle = { commits: 0, rollbacks: 0, releases: 0, destroyed: 0, locks: [], checks: [] };
  const state = { trace: [], documents: targets.map(item => ({ id: item.documentId, project_id: item.projectId, document_number: item.documentNumber,
    active_file_id: `F${item.documentId}`, active_revision_id: `R${item.documentId}`, workflow_status: 'Process Review', revision_label: 'IFR-Submitted', sla_started_at: '2026-10-01 00:00:00' })),
    gates: targets.map(item => ({ project_id: item.projectId, document_id: item.documentId, gate_state: 'CLOSED', delete_operation_id: item.operationId, generation: 1 })),
    operations: targets.map(item => ({ id: item.operationId, project_id: item.projectId, document_id: item.documentId, document_number_snapshot: item.documentNumber, status: 'QUIESCENCE_CONFIRMED', pending_metadata: '{"cleanupPendingReason":"FILE_NAMESPACE_UNVERIFIED"}' })), audits: [] };
  const copy = value => structuredClone(value);
  const c = { beginTransaction: async () => { if (options.beginFailure) throw new Error('begin failed'); snapshot = copy(state); },
    commit: async () => {
      lifecycle.commits++;
      if (options.commitBeforeApply) throw new Error('COMMIT ACK unknown before apply');
      snapshot = copy(state);
      if (options.commitAckLost) throw new Error('COMMIT ACK lost after apply');
    },
    rollback: async () => {
      lifecycle.rollbacks++;
      if (options.rollbackFailure) throw new Error('rollback failed');
      if (snapshot) Object.assign(state, copy(snapshot));
    }, release() { lifecycle.releases++; }, destroy() { lifecycle.destroyed++; lifecycle.locks = []; },
    execute: async (raw, args = []) => {
      const sql = raw.replace(/\s+/g, ' '); state.trace.push(sql);
      if (sql.startsWith('SELECT DATABASE()')) return [[{ db: options.wrongDatabase ? 'production' : 'fixture', serverUuid: 'fixture-uuid' }]];
      if (sql.startsWith('SELECT GET_LOCK')) {
        if (options.workerBusy) return [[{ acquired: 0 }]];
        lifecycle.locks.push(args[0]); return [[{ acquired: 1 }]];
      }
      if (sql.startsWith('SELECT RELEASE_LOCK')) {
        if (options.releaseFailure) throw new Error('release ACK lost');
        lifecycle.locks = lifecycle.locks.filter(name => name !== args[0]); return [[{ released: 1 }]];
      }
      if (sql.startsWith('SELECT * FROM document_admission')) return [[state.gates.find(g => g.document_id === args[1])]];
      if (sql.startsWith('SELECT * FROM document_delete_operations')) return [[state.operations.find(o => o.id === args[0])]];
      if (sql.startsWith('SELECT * FROM engineering_documents')) return [[state.documents.find(d => d.id === args[0])]];
      if (sql.startsWith('SELECT operation_id FROM document_delete_executions')) return [options.execution ? [{ operation_id: args[0] }] : []];
      if (sql.startsWith('SELECT id FROM document_delete_file_manifest')) return [options.manifest ? [{ id: 'M' }] : []];
      if (sql.startsWith('SELECT a.manifest_id')) return [options.attempt ? [{ manifest_id: 'M' }] : []];
      if (sql.startsWith('SELECT id FROM document_writer_operations')) return [options.writer ? [{ id: 'W' }] : []];
      if (sql.startsWith('SELECT s.id')) return [options.io ? [{ id: 'IO' }] : []];
      if (sql.startsWith('SELECT u.id')) return [options.noAdmin ? [] : [{ id: 1, full_name: 'Fixture Admin' }]];
      if (sql.startsWith('SELECT project_code')) return [[{ project_code: 'P' }]];
      if (sql.startsWith('UPDATE document_delete_operations')) {
        const op = state.operations.find(o => o.id === args[1]);
        op.pending_metadata = JSON.stringify({ ...JSON.parse(op.pending_metadata), reservationRecovery: JSON.parse(args[0]) });
        return [{ affectedRows: 1 }];
      }
      if (sql.startsWith('UPDATE document_admission')) {
        if (options.casFailure) return [{ affectedRows: 0 }];
        const gate = state.gates.find(g => g.document_id === args[1]);
        Object.assign(gate, { gate_state: 'OPEN', delete_operation_id: null, generation: gate.generation + 1 });
        return [{ affectedRows: 1 }];
      }
      if (sql.startsWith('INSERT INTO audit_trail')) {
        if (options.auditFailure || (options.secondAuditFailure && state.audits.length === 1)) throw new Error('synthetic audit failure');
        state.audits.push(args); return [{ affectedRows: 1 }];
      }
      throw new Error(`Unexpected SQL: ${sql}`);
    } };
  const service = createRecovery({ pool: { getConnection: async () => c }, namespace, targets, target,
    repository: { inventory: async (connection, op) => ({ document: state.documents.find(d => d.id === op.document_id),
      files: Array.from({ length: options.extraHistoricalFile ? 2 : 1 }, (_, i) => ({ file_id: i === 0 ? `F${op.document_id}` : 'HISTORICAL',
        storage_key: `projects/P/documents/${state.documents.find(d => d.id === op.document_id).document_number}/${i === 0 ? 'f' : 'history'}.pdf`,
        checksum: options.noChecksum ? null : 'a'.repeat(64), file_size: 3 })) }) },
    storage: { captureNamespace: async () => options.wrongNamespace ? { id: 'OTHER', encoded: '{}' } : namespace,
      inspectOwnedExact: async key => {
        lifecycle.checks.push(key);
        return { exists: !options.missing && !(options.extraHistoricalFile && key.endsWith('/history.pdf')),
          size: options.wrongSize ? 8 : 3, sha256: options.mismatch ? 'b'.repeat(64) : 'a'.repeat(64) };
      } }, now: () => time });
  const approval = report => ({ report, approvalDigest: report.approvalDigest, confirmation: 'RECOVER_THREE_STAGING_RESERVATIONS', actorUserId: 1, maintenanceConfirmed: true, backupConfirmed: true });
  return { service, state, approval, targets, target, namespace, lifecycle, advance: () => { time += 300001; } };
};
test('three exact incident operations recovered atomically, history retained, document data unchanged, repeat idempotent', async () => {
  const f = fixture(); const before = structuredClone(f.state.documents); const report = await f.service.prepare();
  assert.equal(f.state.gates.every(g => g.gate_state === 'CLOSED'), true);
  assert.equal((await f.service.apply(f.approval(report))).status, 'RECOVERED');
  assert.deepEqual(f.state.documents, before); assert.equal(f.state.operations.length, 3); assert.equal(f.state.audits.length, 3);
  assert.ok(f.state.gates.every(g => g.gate_state === 'OPEN' && g.delete_operation_id === null && g.generation === 2));
  assert.ok(f.state.operations.every(o => JSON.parse(o.pending_metadata).cleanupPendingReason === 'FILE_NAMESPACE_UNVERIFIED'));
  assert.equal((await f.service.apply(f.approval(report))).status, 'ALREADY_RECOVERED');
  assert.equal(f.state.audits.length, 3);
});
for (const key of ['wrongDatabase', 'workerBusy', 'execution', 'manifest', 'attempt', 'writer', 'io',
  'missing', 'mismatch', 'wrongSize', 'noChecksum', 'wrongNamespace', 'extraHistoricalFile']) {
  test(`recovery blocks without mutations: ${key}`, async () => {
    const f = fixture({ [key]: true }); await assert.rejects(f.service.prepare());
    assert.ok(f.state.gates.every(g => g.gate_state === 'CLOSED')); assert.equal(f.state.audits.length, 0);
  });
}
for (const key of ['auditFailure', 'noAdmin', 'secondAuditFailure', 'casFailure']) test(`recovery failure rolls back all targets: ${key}`, async () => {
  const f = fixture({ [key]: true }); const report = await f.service.prepare();
  await assert.rejects(f.service.apply(f.approval(report)));
  assert.ok(f.state.gates.every(g => g.gate_state === 'CLOSED')); assert.equal(f.state.audits.length, 0);
  assert.ok(f.state.operations.every(o => !JSON.parse(o.pending_metadata).reservationRecovery));
});

test('prepare rolls back reads; successful apply commits once with no post-commit rollback', async () => {
  const f = fixture(); const report = await f.service.prepare();
  assert.equal(f.lifecycle.rollbacks, 1); assert.equal(f.lifecycle.commits, 0); assert.equal(f.lifecycle.releases, 1);
  await f.service.apply(f.approval(report));
  assert.equal(f.lifecycle.rollbacks, 1); assert.equal(f.lifecycle.commits, 1); assert.equal(f.lifecycle.releases, 2);
  assert.equal(f.lifecycle.destroyed, 0); assert.deepEqual(f.lifecycle.locks, []);
});

test('repeat recovery does not hide an execution/attempt that appeared after cancellation', async () => {
  const options = {}; const f = fixture(options); const report = await f.service.prepare();
  await f.service.apply(f.approval(report)); options.execution = true;
  await assert.rejects(f.service.apply(f.approval(report)), error => error.code === 'RECOVERY_SIDE_EFFECT_EVIDENCE_EXISTS');
  assert.equal(f.state.audits.length, 3);
});
for (const commitFlag of ['commitAckLost', 'commitBeforeApply']) test(`uncertain commit destroys session and does not claim rollback: ${commitFlag}`, async () => {
  const options = {}; const f = fixture(options); const report = await f.service.prepare(); options[commitFlag] = true;
  await assert.rejects(f.service.apply(f.approval(report)), error => error.code === 'RECOVERY_COMMIT_OUTCOME_UNKNOWN');
  assert.equal(f.lifecycle.rollbacks, 1); assert.equal(f.lifecycle.destroyed, 1); assert.deepEqual(f.lifecycle.locks, []);
});
test('rollback failure destroys pooled session; named lock release failure also destroys session', async () => {
  const options = {}; const f = fixture(options); const report = await f.service.prepare();
  options.noAdmin = true; options.rollbackFailure = true;
  await assert.rejects(f.service.apply(f.approval(report)), error => error.code === 'RECOVERY_ROLLBACK_FAILED');
  assert.equal(f.lifecycle.destroyed, 1);
  const other = fixture({ releaseFailure: true }); await other.service.prepare();
  assert.equal(other.lifecycle.destroyed, 1); assert.equal(other.lifecycle.releases, 0);
});

test('prepare rollback failure and begin failure discard the session without ambiguous double rollback', async () => {
  const f = fixture({ rollbackFailure: true });
  await assert.rejects(f.service.prepare(), error => error.code === 'RECOVERY_ROLLBACK_FAILED');
  assert.equal(f.lifecycle.rollbacks, 1); assert.equal(f.lifecycle.destroyed, 1);
  const other = fixture({ beginFailure: true }); await assert.rejects(other.service.prepare(), /begin failed/);
  assert.equal(other.lifecycle.rollbacks, 0); assert.equal(other.lifecycle.destroyed, 1);
});
test('expiry, snapshot drift and missing approval fail closed', async () => {
  const f = fixture(); const report = await f.service.prepare();
  await assert.rejects(f.service.apply({ ...f.approval(report), maintenanceConfirmed: false }));
  f.state.documents[0].active_file_id = 'REPLACED'; await assert.rejects(f.service.apply(f.approval(report)));
  f.advance(); await assert.rejects(f.service.apply(f.approval(report)));
  assert.ok(f.state.gates.every(g => g.gate_state === 'CLOSED'));
});
test('non-staging, extra targets and incorrect incident names cannot construct a recovery service', () => {
  const f = fixture();
  for (const patch of [{ target: { ...f.target, railwayEnvironment: 'real_production' } },
    { targets: [...f.targets, f.targets[0]] }, { targets: f.targets.map(item => ({ ...item, documentNumber: 'UNRELATED' })) },
    { targets: f.targets.map(item => ({ ...item, operationId: 'DIFFERENT' })) },
    { targets: f.targets.map(item => ({ ...item, projectId: 'OTHER_PROJECT' })) }]) {
    assert.throws(() => createRecovery({ namespace: f.namespace, target: f.target, targets: f.targets, ...patch }));
  }
});

test('caller mutation cannot expand validated allowlist or switch the verified environment descriptor', async () => {
  const f = fixture(); f.targets[0].operationId = 'OTHER'; f.target.railwayEnvironment = 'real_production';
  const report = await f.service.prepare();
  assert.equal(report.target.railwayEnvironment, 'staging');
  assert.ok(report.documents.every(item => STAGING_TARGETS.some(expected => expected.operationId === item.operationId)));
});

test('all three recovered targets allow real View/Download resolution and streams; writer admission no longer blocks business families', async () => {
  const f = fixture(); const original = structuredClone(f.state.documents);
  const report = await f.service.prepare(); await f.service.apply(f.approval(report));
  const coord = coordinationFixture({ gates: new Map(f.state.gates.map(g => [`${g.project_id}:${g.document_id}`, structuredClone(g)])),
    operations: new Map(f.state.operations.map(op => [op.id, structuredClone(op)])) });
  coord.documents.findDocumentFoundationById = async id => {
    const doc = f.state.documents.find(d => d.id === id);
    return { id, projectId: doc.project_id, documentNumber: doc.document_number };
  };
  const audits = []; const streamed = [];
  const file = async id => {
    const d = f.state.documents.find(doc => doc.id === id);
    return { document: { id, projectId: d.project_id, documentNumber: d.document_number,
      activeFileId: d.active_file_id, activeRevisionId: d.active_revision_id }, revision: { id: d.active_revision_id },
    storedFile: { fileId: d.active_file_id, storageKey: `projects/P/documents/${d.document_number}/f.pdf`, originalFileName: 'original.pdf', mimeType: 'application/pdf', fileSize: 3 } };
  };
  const dependencies = {
    '../config/logger': { error() {} }, '../repositories/fileAccess.repository': { findActiveDocumentFile: file },
    '../repositories/projectMembership.repository': { findActiveMembershipByProjectAndUser: async () => ({ officialRole: 'Admin' }) },
    './audit.service': { recordActivitySafely: async event => audits.push(event) }, './documentAdmission.service': coord.service,
    './storage.service': { exists: async () => true, getStream: async key => { streamed.push(key); return Readable.from([Buffer.from('pdf')]); } },
    '../utils/administration': require('../../src/utils/administration'), '../utils/contentDisposition': require('../../src/utils/contentDisposition'),
  };
  const module = { exports: {} };
  new vm.Script(fs.readFileSync(path.resolve(__dirname, '../../src/services/fileAccess.service.js'), 'utf8')).runInNewContext({
    module, exports: module.exports, require: name => { assert.ok(Object.hasOwn(dependencies, name), name); return dependencies[name]; }, Date, Buffer });
  for (const target of f.targets) {
    const scope = { projectId: target.projectId, documentId: target.documentId };
    for (const action of ['view', 'download']) {
      const documentFile = await module.exports.resolveDocumentFileForAccess({ ...scope, action, userId: 1 });
      const chunks = []; const headers = {};
      const response = new Writable({ write(chunk, encoding, done) { chunks.push(chunk); done(); } });
      response.setHeader = (key, value) => { headers[key] = value; };
      const finished = new Promise((resolve, reject) => { response.on('finish', resolve); response.on('error', reject); });
      await module.exports.streamStoredFileResponse({ disposition: action === 'view' ? 'inline' : 'attachment', documentFile, res: response });
      await finished;
      assert.equal(Buffer.concat(chunks).toString(), 'pdf'); assert.match(headers['Content-Disposition'], /original.pdf/);
    }
    // Exercise the real admission wrapper, not workflow rules or role-specific approval permission.
    for (const type of ['EDIT_DOCUMENT','UPLOAD_REVISION','APPROVAL_A','APPROVAL_B','APPROVAL_C','WORKFLOW_ATTACHMENT','COMMENT_READ','HISTORY','ARCHIVE_DOCUMENT','RESTORE_DOCUMENT']) {
      const handler = coord.service.documentWriter(async () => {
        await coord.service.mutate(scope, c => c.execute('TEST MUTATION'));
        coord.service.noteDbOutcome('COMMITTED'); return 'ADMITTED';
      }, type);
      assert.equal(await handler({ documentId: target.documentId, actorUserId: 1, payload: {} }), 'ADMITTED');
    }
  }
  assert.equal(audits.length, 6); assert.equal(streamed.length, 6);
  assert.deepEqual(f.state.documents, original); assert.equal(coord.state.operations.size, 3);
  assert.ok([...coord.state.gates.values()].every(g => g.gate_state === 'OPEN' && g.delete_operation_id === null));
});
