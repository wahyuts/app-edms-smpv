const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const crypto = require('node:crypto');
const test = require('node:test');
const harness = require('../helpers/slaIntegrationPreparation.cjs');
const entrypoint = require('../integration/slaIntegrationPreparation.cjs');

const root = path.resolve(__dirname, '../../../..');
const target = () => ({ ...harness.proposedTarget });
const hash = file => crypto.createHash('sha256').update(fs.readFileSync(path.join(root, file))).digest('hex');

test('C2A: exact proposed target passes offline validation without proving runtime identity', () => {
  const result = harness.validateOfflineTarget(target());
  assert.equal(result.database, 'edms_sla_integration_test');
  assert.equal(result.validation, 'OFFLINE_ONLY');
  assert.equal(result.runtimeVerified, false);
  assert.ok(Object.isFrozen(result));
});

for (const database of ['', 'edms_db', 'edms_smpv_dev', 'railway', 'edms_smpv_staging', 'edms_smpv_prod',
  'edms_sla_integration_test_copy', 'EDMS_SLA_INTEGRATION_TEST']) {
  test(`C2A: unapproved database rejected: ${database || '<empty>'}`, () => {
    assert.throws(() => harness.validateOfflineTarget({ ...target(), database }), { code: 'SLA_TEST_INVALID_DATABASE' });
  });
}

for (const host of ['localhost', '0.0.0.0', '::1', 'railway.internal', '127.0.0.2', '']) {
  test(`C2A: unapproved host rejected: ${host || '<empty>'}`, () => {
    assert.throws(() => harness.validateOfflineTarget({ ...target(), host }), { code: 'SLA_TEST_INVALID_HOST' });
  });
}

for (const port of [13317, 3307, '3306', 0, undefined]) {
  test(`C2A: unapproved port rejected: ${String(port)}`, () => {
    assert.throws(() => harness.validateOfflineTarget({ ...target(), port }), { code: 'SLA_TEST_INVALID_PORT' });
  });
}

for (const patch of [{ expectedEngine: 'MySQL' }, { expectedVersion: '' }, { expectedVersion: '9.7.2' },
  { intent: 'production' }, { appEnv: 'test' }, { password: 'do-not-log' }]) {
  test(`C2A: shape/engine/version/intent cannot bypass the pinned target: ${Object.keys(patch)[0]}`, () => {
    assert.throws(() => harness.validateOfflineTarget({ ...target(), ...patch }), error => error.code.startsWith('SLA_TEST_'));
  });
}

for (const value of [undefined, null, [], 'edms_sla_integration_test', {}]) {
  test(`C2A: incomplete configuration rejected: ${JSON.stringify(value)}`, () => {
    assert.throws(() => harness.validateOfflineTarget(value));
  });
}

for (const missing of harness.runtimeRequirements) {
  test(`C2A: missing runtime ${missing} denies mutation authorization`, () => {
    const runtimeEvidence = Object.fromEntries(harness.runtimeRequirements.map(key => [key, { verified: true }]));
    delete runtimeEvidence[missing];
    assert.throws(() => harness.assertMutationAuthorized({ target: target(), operation: 'fixtures', runtimeEvidence }), error => {
      assert.equal(error.code, 'SLA_RUNTIME_VERIFICATION_REQUIRED');
      assert.ok(error.missingChecks.includes(missing));
      assert.equal(error.mutationAuthorized, false);
      return true;
    });
  });
}

test('C2A: fabricated complete evidence, a caller marker and APP_ENV cannot authorize any database operation', () => {
  const runtimeEvidence = Object.fromEntries(harness.runtimeRequirements.map(key => [key,
    { verified: true, source: 'database', database: 'edms_sla_integration_test', owner: 'caller-marker' }]));
  for (const operation of ['provision', 'schema', 'fixtures', 'cleanup', 'contention', 'fault-injection']) {
    assert.throws(() => harness.assertMutationAuthorized({ target: target(), operation, runtimeEvidence,
      APP_ENV: 'test', approved: true }), error => error.code === 'SLA_RUNTIME_VERIFICATION_REQUIRED'
      && error.runtimeVerified === false && error.mutationAuthorized === false);
  }
});

test('C2A: mismatching server claims and unknown operations are denied', () => {
  assert.throws(() => harness.assertMutationAuthorized({ target: target(), operation: 'schema',
    runtimeEvidence: { serverIdentity: { hostname: 'remote', port: 13317 }, engineVersion: 'MySQL' } }),
  { code: 'SLA_RUNTIME_VERIFICATION_REQUIRED' });
  assert.throws(() => harness.assertMutationAuthorized({ target: target(), operation: 'reset' }),
    { code: 'SLA_TEST_OPERATION_NOT_APPROVED' });
});

for (const sql of ['CREATE DATABASE edms_db;', 'USE edms_smpv_dev;', 'DROP DATABASE anything;',
  'TRUNCATE TABLE users;', 'SET FOREIGN_KEY_CHECKS=0;', 'SET @@GLOBAL.sql_mode="";',
  '/*!50000 DROP TABLE users */;', 'ALTER DATABASE test CHARACTER SET utf8;',
  'LOAD DATA INFILE "file" INTO TABLE users;', 'SOURCE other.sql;', 'DELIMITER $$']) {
  test(`C2A: unsafe schema application is blocked: ${sql}`, () => {
    const review = harness.reviewSchemaApplication(sql);
    assert.equal(review.applicationAllowed, false);
    assert.equal(review.reason, 'UNSAFE_SCHEMA_DIRECTIVE');
    assert.ok(review.unsafeDirectives.length > 0);
  });
}

test('C2A: apparently harmless SQL is also blocked; diagnostic patterns are not an executable parser', () => {
  for (const sql of ['CREATE TABLE test (id INT);', 'SELECT 1;', 'DR/**/OP TABLE users;']) {
    assert.equal(harness.reviewSchemaApplication(sql).applicationAllowed, false);
  }
  assert.throws(() => harness.reviewSchemaApplication(''));
});

test('C2A: inventory covers all 33 base/coordinator/namespace tables without executing or transforming DDL', () => {
  const readFiles = [];
  const inventory = harness.buildSchemaInventory({ readFile(file, encoding) {
    assert.equal(encoding, 'utf8');
    assert.ok(harness.schemaSources.some(source => path.resolve(root, source.file) === file));
    readFiles.push(file);
    return fs.readFileSync(file, encoding);
  } });
  assert.equal(readFiles.length, 3);
  assert.deepEqual(inventory.map(source => source.tables.length), [24, 5, 4]);
  assert.equal(new Set(inventory.flatMap(source => source.tables)).size, 33);
  assert.ok(inventory.every(source => /^[a-f0-9]{64}$/.test(source.sha256) && !source.applicationAllowed));
  assert.ok(inventory[0].unsafeDirectives.includes('CREATE DATABASE'));
  assert.ok(inventory[0].unsafeDirectives.includes('USE'));
  assert.ok(inventory[1].file.endsWith('_mariadb.sql'));
  assert.ok(inventory[2].file.endsWith('_mariadb.sql'));
});

test('C2A: inventory drift and weakening baseline NOT NULL stop preparation', () => {
  for (const replace of [source => source.replace('CREATE TABLE users (', 'CREATE TABLE unexpected_users ('),
    source => source.replace('sla_started_at DATETIME(3) NOT NULL', 'sla_started_at DATETIME(3) NULL')]) {
    assert.throws(() => harness.buildSchemaInventory({ readFile: file => replace(fs.readFileSync(file, 'utf8')) }),
      error => ['SLA_TEST_SCHEMA_INVENTORY_DRIFT', 'SLA_TEST_BASELINE_CONSTRAINT_DRIFT'].includes(error.code));
  }
});

test('C2A: fixture plan is deterministic, run-isolated, FK-ordered, and excludes Viewer notifications', () => {
  const a = harness.buildFixturePlan('run00001'), b = harness.buildFixturePlan('run00002');
  assert.deepEqual(a, harness.buildFixturePlan('run00001'));
  assert.equal(a.executionAllowed, false);
  assert.equal(a.users.length, 5);
  assert.equal(a.projects.length, 2);
  assert.equal(a.memberships.length, 10);
  assert.equal(a.documents.length, 500);
  assert.deepEqual(a.users.map(user => user.officialRole), [...harness.officialRoles]);
  assert.deepEqual(a.excludedNotificationRoles, ['Viewer']);
  assert.ok(a.documents.every(doc => doc.activeFileId === null && doc.activeRevisionId === null
    && doc.baselineSource === 'FUTURE_VERIFIED_DATABASE_UTC_TIME' && doc.id.length <= 64));
  assert.equal(new Set(a.documents.map(doc => doc.id)).size, 500);
  assert.ok(a.documents.every(doc => !b.documents.some(other => other.id === doc.id)));
  assert.ok(a.creationOrder.indexOf('users') < a.creationOrder.indexOf('projects'));
  assert.ok(a.creationOrder.indexOf('engineering_documents') < a.creationOrder.indexOf('optional_active_pointers'));
  assert.match(a.cleanupPolicy, /EXACT_LEDGER_IDS_ONLY/);
  assert.match(a.unresolvedOutcomePolicy, /NO_AUTOMATIC_CLEANUP/);
});

for (const run of ['', '../escape', 'run;DELETE', 'A'.repeat(30)]) {
  test(`C2A: unsafe run identity rejected: ${run || '<empty>'}`, () => {
    assert.throws(() => harness.buildFixturePlan(run), { code: 'SLA_TEST_INVALID_RUN_ID' });
  });
}

const fakeConnection = () => {
  const calls = [], raw = {};
  for (const name of ['beginTransaction', 'commit', 'rollback', 'query', 'execute', 'release', 'destroy']) {
    raw[name] = function (...args) {
      assert.equal(this, raw, 'mysql2 method receiver must be preserved');
      calls.push({ name, args });
      if (name === 'release' || name === 'destroy') return undefined;
      return Promise.resolve([[], []]);
    };
  }
  return { raw, calls };
};

test('C2A: wrapping an explicit fake connection has no SQL side effect and preserves method contracts', async () => {
  const { raw, calls } = fakeConnection();
  const wrapped = harness.wrapOwnedConnection(raw, 'run00001');
  assert.equal(calls.length, 0);
  await wrapped.beginTransaction();
  await wrapped.execute('SELECT ?', [1]);
  await wrapped.query('SELECT ?', [2]);
  await wrapped.commit();
  await wrapped.rollback();
  wrapped.release(); wrapped.release(); wrapped.destroy();
  assert.deepEqual(calls.map(call => call.name), ['beginTransaction', 'execute', 'query', 'commit', 'rollback', 'release']);
  assert.deepEqual(calls[1].args, ['SELECT ?', [1]]);
  assert.throws(() => wrapped.query('SELECT 1'), { code: 'SLA_TEST_CONNECTION_DISPOSED' });
});

test('C2A: destroy remains synchronous and unknown outcome never becomes a wrapper rollback', () => {
  const { raw, calls } = fakeConnection();
  const wrapped = harness.wrapOwnedConnection(raw, 'run00001');
  assert.equal(wrapped.destroy(), undefined);
  wrapped.destroy(); wrapped.release();
  assert.deepEqual(calls.map(call => call.name), ['destroy']);
});

for (const method of ['beginTransaction', 'commit', 'rollback', 'query', 'execute', 'release', 'destroy']) {
  test(`C2A: ${method} preserves original frozen error metadata and stack`, async () => {
    const { raw } = fakeConnection();
    const error = Object.freeze(Object.assign(new Error('synthetic driver failure'),
      { code: 'ER_LOCK_DEADLOCK', errno: 1213, sqlState: '40001' }));
    const promise = Promise.reject(error);
    // Observe the synthetic rejection even when testing a synchronous cleanup method.
    promise.catch(() => {});
    raw[method] = function () {
      assert.equal(this, raw);
      if (['release', 'destroy'].includes(method)) throw error;
      return promise;
    };
    const wrapped = harness.wrapOwnedConnection(raw, 'run00001');
    if (['release', 'destroy'].includes(method)) assert.throws(() => wrapped[method](), thrown => thrown === error);
    else {
      assert.equal(wrapped[method](), promise);
      await assert.rejects(promise, thrown => thrown === error && thrown.stack === error.stack
        && thrown.code === 'ER_LOCK_DEADLOCK' && thrown.errno === 1213 && thrown.sqlState === '40001');
    }
  });
}

test('C2A: failed release permits original caller-controlled destroy, without hiding cleanup failure', () => {
  const { raw, calls } = fakeConnection();
  const error = new Error('release failed');
  raw.release = () => { throw error; };
  const wrapped = harness.wrapOwnedConnection(raw, 'run00001');
  assert.throws(() => wrapped.release(), thrown => thrown === error);
  wrapped.destroy();
  assert.deepEqual(calls.map(call => call.name), ['destroy']);
});

test('C2A: incomplete connection contract and duplicate ownership are rejected', () => {
  const { raw } = fakeConnection();
  const missingDestroy = { ...raw }; delete missingDestroy.destroy;
  assert.throws(() => harness.wrapOwnedConnection(missingDestroy, 'run00001'), { code: 'SLA_TEST_CONNECTION_CONTRACT' });
  harness.wrapOwnedConnection(raw, 'run00001');
  assert.throws(() => harness.wrapOwnedConnection(raw, 'run00002'), { code: 'SLA_TEST_CONNECTION_ALREADY_OWNED' });
});

test('C2A: imports cannot load driver/env/network/legacy runner or read artifacts', () => {
  const imports = [], artifactReads = [];
  const helperFile = path.join(__dirname, '../helpers/slaIntegrationPreparation.cjs');
  const entryFile = path.join(__dirname, '../integration/slaIntegrationPreparation.cjs');
  const modules = new Map();
  const allowed = new Map([
    ['node:path', path], ['node:crypto', crypto],
    ['node:fs', { readFileSync(file) { artifactReads.push(file); throw new Error('Artifact read forbidden on import'); } }],
  ]);
  const isolatedLoad = file => {
    const module = { exports: {} };
    const source = fs.readFileSync(file, 'utf8');
    new vm.Script(source, { filename: file }).runInNewContext({
      module, exports: module.exports, __dirname: path.dirname(file),
      require(name) {
        imports.push(name);
        if (allowed.has(name)) return allowed.get(name);
        if (name === '../helpers/slaIntegrationPreparation.cjs') return modules.get(helperFile);
        assert.fail(`Blocked import: ${name}`);
      },
    });
    modules.set(file, module.exports);
    return module.exports;
  };
  isolatedLoad(helperFile);
  const entry = isolatedLoad(entryFile);
  assert.deepEqual(artifactReads, []);
  assert.ok(imports.every(name => allowed.has(name) || name === '../helpers/slaIntegrationPreparation.cjs'));
  for (const args of [[], ['--execute'], ['--apply'], ['--connect'], ['--dry-run', '--apply']]) {
    assert.throws(() => entry.main(args), { code: 'SLA_TEST_OFFLINE_ONLY' });
  }
  assert.deepEqual(artifactReads, []);
});

test('C2A: explicit dry run is deterministic and does not modify schema or legacy Permanent Delete files', () => {
  const preserved = [...harness.schemaSources.map(source => source.file),
    'apps/backend/tests/helpers/isolatedMariaDb.cjs',
    'apps/backend/tests/integration/sprintBDatabaseValidation.cjs',
    'apps/backend/tests/integration/sprintCNotificationValidation.cjs'];
  const before = preserved.map(hash);
  const result = entrypoint.main(['--dry-run']);
  assert.deepEqual(result, entrypoint.dryRun());
  assert.equal(result.databaseAccess, 'NOT PERFORMED');
  assert.equal(result.sqlExecuted, false);
  assert.equal(result.mutationAuthorized, false);
  assert.ok(Object.values(result.runtimeFacts).every(value => value === 'UNVERIFIED'));
  assert.deepEqual(preserved.map(hash), before);
  assert.deepEqual(result.fixtures, { users: 5, projects: 2, memberships: 10, documents: 500,
    executionAllowed: false, excludedNotificationRoles: ['Viewer'] });
});
