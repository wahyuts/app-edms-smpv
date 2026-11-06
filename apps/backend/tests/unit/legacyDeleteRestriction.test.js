const test = require('node:test');
const assert = require('node:assert/strict');
const { createPermanentDeleteApi } = require('../../src/services/permanentDeleteApi.service');
const { createRepository } = require('../../src/repositories/permanentDeleteApi.repository');
const { createOwnershipPreflight } = require('../../src/services/legacyDeleteRestriction.service');
const { fixture: coordinationFixture } = require('../helpers/isolatedDocumentCoordination.cjs');
const { digest, r2Namespace } = require('../../src/utils/storageNamespace');
const { execFileSync } = require('node:child_process');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const baselineCommit = '549623517000410b87a9e73a99ca48899dd3cbc6';
const root = path.resolve(__dirname, '../../../..');
const baselineSource = file => execFileSync('git', ['show', `${baselineCommit}:${file}`], { cwd: root, encoding: 'utf8' });
const loadBaseline = (source, dependencies = {}) => {
  const module = { exports: {} };
  vm.runInNewContext(`(function(require,module,exports){${source}\n})`)(name => {
    if (name === 'node:crypto') return require('node:crypto');
    assert.ok(Object.hasOwn(dependencies, name), `Unexpected baseline dependency: ${name}`);
    return dependencies[name];
  }, module, module.exports);
  return module.exports;
};
const baselineApi = () => loadBaseline(baselineSource('apps/backend/src/services/permanentDeleteApi.service.js'), {
  '../repositories/permanentDeleteApi.repository': loadBaseline(baselineSource('apps/backend/src/repositories/permanentDeleteApi.repository.js')),
  './realtimeDocumentPublisher.service': { publishDocumentDeleted: async () => {} }, '../config/logger': { error() {} },
}).createPermanentDeleteApi;

const fixture = ({ historical = true, bound = false, busy = false, malformed = false, valid = true,
  existingStatus = null, factory = createPermanentDeleteApi } = {}) => {
  const ns = r2Namespace({ accountId: 'synthetic', endpoint: 'https://synthetic.example.test', bucketName: 'test' });
  const doc = { id: 'D', project_id: 'P', document_number: 'PFD-1', active_file_id: 'F', active_revision_id: 'R' };
  const file = { file_id: 'F', project_id: 'P', document_id: 'D', storage_key: 'projects/P/documents/PFD-1/revisions/IFR-Submitted/f.pdf', checksum: digest('synthetic'), file_size: 1 };
  const revision = { id: 'R', file_id: 'F', project_id: 'P', document_id: 'D' };
  const bindings = bound ? [{ file_id: 'F', namespace_id: ns.id, storage_key_snapshot: file.storage_key,
    evidence: JSON.stringify(valid ? { source: 'UPLOAD_ADAPTER_SNAPSHOT', version: 1, sha256: file.checksum, size: 1 }
      : { source: 'UPLOAD_ADAPTER_SNAPSHOT', version: 1 }) }] : [];
  const outcome = bound && valid && !malformed ? 'COMPLETED' : 'PENDING';
  const sqls = []; let op = existingStatus ? { id: 'OLD', project_id: 'P', document_id: 'D',
    request_identity: digest('request-123'), initiated_by_user_id: 1 } : undefined;
  let reserved = 0; let resumed = 0; let rolledBack = 0;
  const c = { execute: async (sql) => {
    sqls.push(sql);
    if (sql.startsWith('SELECT w.id FROM document_writer_operations')) return [busy ? [{ id: 'BUSY' }] : []];
    if (sql.startsWith('SELECT DISTINCT f.file_id')) {
      assert.match(sql, /h.workflow_event='Upload Document'/); assert.match(sql, /r.revision_sequence=1/);
      assert.match(sql, /NOT EXISTS\(SELECT 1 FROM document_writer_operations/);
      assert.match(sql, /NOT EXISTS\(SELECT 1 FROM document_storage_io_steps/);
      assert.match(sql, /MIN\(w.created_at\)/); assert.match(sql, /w.db_outcome='COMMITTED'/);
      return [historical && !bound ? [{ file_id: 'F' }] : []];
    }
    if (sql.includes('information_schema.')) return [[]];
    if (sql.startsWith('SELECT t.id FROM temporary_uploads')) return [[]];
    if (sql.startsWith('SELECT * FROM engineering_documents WHERE id=')) return [[doc]];
    if (sql.startsWith('SELECT * FROM engineering_documents WHERE active_')) return [[]];
    if (sql.startsWith('SELECT * FROM document_revisions')) return [[revision]];
    if (sql.startsWith('SELECT * FROM stored_files') || sql.startsWith('SELECT file_id,storage_key FROM stored_files')) return [[file]];
    if (sql.startsWith('SELECT * FROM stored_file_namespace_bindings')) return [bindings];
    if (sql.startsWith('SELECT * FROM storage_namespaces')) return [[{ id: ns.id, provider: 'r2', descriptor: ns.encoded }]];
    if (sql.startsWith('SELECT * FROM ')) {
      if (malformed) throw Object.assign(new Error('synthetic metadata ambiguity'), { pending: true, code: 'LEGACY_REFERENCE_AMBIGUOUS' });
      return [[]];
    }
    throw new Error(`Unexpected fixture SQL: ${sql}`);
  } };
  const pool = { execute: async sql => {
    if (sql.startsWith('SELECT m.official_role')) return [[{ official_role: 'Admin' }]];
    if (sql.startsWith('SELECT id,project_id')) return [[doc]];
    if (sql.startsWith('SELECT * FROM document_delete_operations')) return [[op].filter(Boolean)];
    if (sql.startsWith('SELECT phase')) return [resumed && outcome === 'COMPLETED' ? [{ phase: 'COMPLETED', completion_snapshot: '{"completedAt":"synthetic"}' }] : []];
    if (sql.startsWith('SELECT a.state')) return [existingStatus === 'UNKNOWN' ? [{ state: 'UNKNOWN' }] : []];
    if (sql.startsWith('SELECT w.id') || sql.startsWith('SELECT DISTINCT m.user_id')) return [[]];
    throw new Error(`Unexpected pool SQL: ${sql}`);
  }, getConnection: async () => ({ ...c, query: async sql => assert.equal(sql, 'START TRANSACTION READ ONLY'),
    rollback: async () => {}, release() {} }) };
  const api = factory({ pool, coordination: {
    reserve: async (value, { beforeReserve } = {}) => {
      try { if (beforeReserve) await beforeReserve(c); } catch (e) { rolledBack++; throw e; }
      reserved++; op = { id: value.id, project_id: 'P', document_id: 'D', request_identity: value.requestIdentity, initiated_by_user_id: 1 };
    }, evaluateQuiescence: async () => ({ status: busy ? 'QUIESCENCE_PENDING' : 'QUIESCENCE_CONFIRMED' }),
  }, engine: { resume: async () => { resumed++; return { status: outcome }; } }, publishCompleted: async () => {} });
  return { api, c, pool, args: { actorUserId: 1, activeProject: { id: 'P' }, projectId: 'P', documentId: 'D', requestKey: 'request-123' },
    counters: () => ({ reserved, resumed, rolledBack }), sqls, bindings };
};

test('proven pre-admission legacy restriction returns approved copy before any reservation, engine or storage call', async () => {
  const f = fixture();
  await assert.rejects(f.api.remove(f.args), e => {
    assert.equal(e.statusCode, 409); assert.equal(e.data.status, 'CONFLICT');
    assert.equal(e.data.reasonCode, 'LEGACY_STORAGE_OWNERSHIP_UNVERIFIED');
    assert.equal(e.data.title, 'Dokumen Tidak Dapat Dihapus Permanen');
    assert.ok(e.data.message.includes('Dokumen tetap dapat digunakan dan dikelola seperti biasa.'));
    assert.equal(e.data.operationId, undefined); return true;
  });
  assert.deepEqual(f.counters(), { reserved: 0, resumed: 0, rolledBack: 1 });
  assert.ok(f.sqls.every(sql => /^SELECT/.test(sql)));
});
for (const patch of [{ historical: false }, { busy: true }, { malformed: true }, { bound: true, valid: false }]) {
  test(`ownership rejection before reservation, without falsely confirming legacy: ${JSON.stringify(patch)}`, async () => {
    const f = fixture(patch);
    await assert.rejects(f.api.remove(f.args), error => error.statusCode === 409
      && error.data.reasonCode === 'DELETE_OWNERSHIP_UNVERIFIED'
      && error.data.message.startsWith('Kemungkinan dokumen ini'));
    assert.deepEqual(f.counters(), { reserved: 0, resumed: 0, rolledBack: 1 });
  });
}
test('old or new files with valid binding keep the same successful engine flow', async () => {
  for (const historical of [true, false]) {
    const f = fixture({ historical, bound: true });
    assert.equal((await f.api.remove(f.args)).status, 'COMPLETED');
    assert.equal(f.counters().reserved, 1); assert.equal(f.counters().resumed, 1);
    assert.equal(f.sqls.some(sql => sql.startsWith('SELECT * FROM stored_files')), true);
  }
});
test('valid-binding requests retain existing reservation/drain flow even with active writers', async () => {
  const f = fixture({ bound: true, busy: true });
  assert.equal((await f.api.remove(f.args)).status, 'PENDING');
  assert.equal(f.counters().reserved, 1);
  assert.equal(f.sqls.some(sql => sql.startsWith('SELECT w.id FROM document_writer_operations')), false);
});
test('missing binding alone is not historical proof at repository boundary', async () => {
  const f = fixture({ historical: false });
  assert.deepEqual(await createOwnershipPreflight({ repository: createRepository({ pool: f.pool }) })(f.c, 'P', 'D'),
    { blocked: false });
});
test('read-only GET recovers a lost legacy rejection response without reservation or engine resume', async () => {
  const f = fixture(); const result = await f.api.status(f.args);
  assert.equal(result.reasonCode, 'LEGACY_STORAGE_OWNERSHIP_UNVERIFIED'); assert.equal(result.status, 'CONFLICT');
  assert.deepEqual(f.counters(), { reserved: 0, resumed: 0, rolledBack: 0 });
});

test('temporary SQL failure rejects before reservation without a legacy classification', async () => {
  const f = fixture({ historical: false }); const execute = f.c.execute;
  f.c.execute = async sql => {
    if (sql.includes('information_schema.')) throw Object.assign(new Error('synthetic timeout'), { code: 'ETIMEDOUT' });
    return execute(sql);
  };
  await assert.rejects(f.api.remove(f.args), e => e.code === 'ETIMEDOUT' && !e.data);
  assert.deepEqual(f.counters(), { reserved: 0, resumed: 0, rolledBack: 1 });
});

test('cancelled recovery operation never resumes and returns definitive ownership restriction', async () => {
  const f = fixture({ historical: false, existingStatus: 'PENDING' });
  const execute = f.pool.execute;
  f.pool.execute = async sql => {
    const result = await execute(sql);
    if (sql.startsWith('SELECT * FROM document_delete_operations')) result[0][0].pending_metadata =
      JSON.stringify({ reservationRecovery: { state: 'CANCELLED_BEFORE_IO' } });
    return result;
  };
  assert.equal((await f.api.remove(f.args)).reasonCode, 'DELETE_OWNERSHIP_UNVERIFIED');
  assert.equal((await f.api.status(f.args)).reasonCode, 'DELETE_RESERVATION_CANCELLED');
  assert.deepEqual(f.counters(), { reserved: 0, resumed: 0, rolledBack: 0 });
});

test('concurrent DELETE retries and GET status cannot resume a recovered operation with eligible metadata', async () => {
  const f = fixture({ historical: false, bound: true, existingStatus: 'PENDING' });
  const execute = f.pool.execute;
  f.pool.execute = async sql => {
    const result = await execute(sql);
    if (sql.startsWith('SELECT * FROM document_delete_operations')) result[0][0].pending_metadata =
      JSON.stringify({ reservationRecovery: { state: 'CANCELLED_BEFORE_IO' } });
    return result;
  };
  const responses = await Promise.all([f.api.remove(f.args), f.api.remove({ ...f.args, requestKey: 'other-request' }), f.api.status(f.args)]);
  assert.ok(responses.every(result => result.status === 'CONFLICT' && result.reasonCode === 'DELETE_RESERVATION_CANCELLED'));
  assert.deepEqual(f.counters(), { reserved: 0, resumed: 0, rolledBack: 0 });
});
test('GET recovers possible legacy rejection but a mismatched operation identity retains 404', async () => {
  const f = fixture({ historical: false });
  assert.equal((await f.api.status(f.args)).reasonCode, 'DELETE_OWNERSHIP_UNVERIFIED');
  await assert.rejects(f.api.status({ ...f.args, operationId: 'unrelated-operation' }), e => e.statusCode === 404);
});

test('actual reservation hook rejects before closing gate or adding operation; all writer families still admit', async () => {
  const f = coordinationFixture();
  await assert.rejects(f.repository.reserve({ id: 'DELETE-1', projectId: 'P1', documentId: 'D1', requestIdentity: 'test' },
    { beforeReserve: async () => { throw new Error('synthetic restriction'); } }), /synthetic restriction/);
  assert.equal(f.state.operations.size, 0);
  assert.notEqual(f.state.gates.get('P1:D1')?.gate_state, 'CLOSED');
  await f.service.assertReadable({ projectId: 'P1', documentId: 'D1' });
  for (const type of ['EDIT_DOCUMENT','UPLOAD_REVISION','APPROVAL','WORKFLOW_ATTACHMENT','COMMENT_READ','ARCHIVE_DOCUMENT','RESTORE_DOCUMENT','SLA']) {
    await f.service.runWriter({ projectId: 'P1', documentId: 'D1', type }, async () => {
      await f.service.mutate({ projectId: 'P1', documentId: 'D1' }, c => c.execute('TEST MUTATION'));
      f.service.noteDbOutcome('COMMITTED');
    });
  }
  assert.equal(f.state.operations.size, 0);
  assert.equal(f.state.trace.filter(t => t === 'MUTATION').length, 8);
});

test('concurrent eligibility rejection leaves no reservation; concurrent eligible requests reserve only once', async () => {
  for (const bound of [false, true]) {
    const f = coordinationFixture(); const ownership = fixture({ historical: false, bound });
    const eligibility = require('../../src/services/deleteEligibility.service').createEligibilityPreflight();
    const beforeReserve = async () => {
      const result = await eligibility(ownership.c, 'P', 'D');
      if (result.blocked) throw Object.assign(new Error('definitive ownership rejection'), { code: result.reasonCode });
    };
    const results = await Promise.allSettled([1, 2].map(i => f.repository.reserve({ id: `DELETE-${i}`,
      projectId: 'P1', documentId: 'D1', requestIdentity: `request-${i}` }, { beforeReserve })));
    assert.equal(results.filter(result => result.status === 'fulfilled').length, bound ? 1 : 0);
    assert.equal(f.state.operations.size, bound ? 1 : 0);
    assert.equal(f.state.gates.get('P1:D1')?.gate_state, bound ? 'CLOSED' : 'OPEN');
    assert.ok(ownership.sqls.every(sql => sql.startsWith('SELECT')));
  }
});

for (const scenario of [
  { bound: true }, { bound: true, busy: true },
  { existingStatus: 'PENDING' }, { existingStatus: 'UNKNOWN' },
]) test(`before/after baseline ${baselineCommit.slice(0,7)}: unchanged non-legacy outcome ${JSON.stringify(scenario)}`, async () => {
  const old = fixture({ ...scenario, factory: baselineApi() }); const current = fixture(scenario);
  const normalize = response => JSON.parse(JSON.stringify({ ...response, operationId: response.operationId ? 'OP' : undefined }));
  assert.deepEqual(normalize(await current.api.remove(current.args)), normalize(await old.api.remove(old.args)));
  assert.deepEqual(current.counters(), old.counters());
  if (scenario.existingStatus) assert.equal(current.sqls.length, 0);
});

test('existing operation conflict and missing-operation GET preserve baseline responses', async () => {
  const oldFactory = baselineApi();
  for (const factory of [oldFactory, createPermanentDeleteApi]) {
    const conflict = fixture({ factory, existingStatus: 'PENDING' });
    await assert.rejects(conflict.api.remove({ ...conflict.args, requestKey: 'different-request' }), e =>
      e.statusCode === 409 && e.data.status === 'CONFLICT' && !e.data.reasonCode);
    const missing = fixture({ factory, historical: false, bound: true });
    await assert.rejects(missing.api.status(missing.args), e => e.statusCode === 404);
  }
});

test('workflow/storage/SLA/RBAC baseline stays identical except approved additive REV. metadata plumbing', () => {
  for (const file of ['apps/backend/src/services/workflowEngine.service.js','apps/backend/src/services/approval.service.js',
    'apps/backend/src/services/revision.service.js','apps/backend/src/repositories/storageNamespace.repository.js',
    'apps/backend/src/services/storage.service.js',
    'apps/backend/src/services/document.service.js','apps/backend/src/services/fileAccess.service.js',
    'apps/backend/src/services/sla.service.js','apps/backend/src/repositories/sla.repository.js',
    'apps/backend/src/services/authorization.service.js','apps/backend/src/middlewares/authorizePermissions.js']) {
    let current = fs.readFileSync(path.join(root, file), 'utf8').replace(/\r\n/g, '\n');
    if (['apps/backend/src/services/document.service.js', 'apps/backend/src/services/revision.service.js'].includes(file)) {
      current = current.replace("    ...(payload.rev !== undefined ? { rev: payload.rev } : {}),\n", '');
      if (file.endsWith('/document.service.js')) current = current.replace('          rev: payload.rev ?? null,\n', '');
    }
    assert.equal(current, baselineSource(file).replace(/\r\n/g, '\n'), file);
  }
});
