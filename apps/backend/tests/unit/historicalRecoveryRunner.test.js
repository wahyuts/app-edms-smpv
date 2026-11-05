const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const path = require('node:path');
const os = require('node:os');
const runner = require('../../scripts/historical-recovery-runner.cjs');
const engine = require('../../scripts/historical-namespace-recovery.cjs');
const { digest } = require('../../src/utils/storageNamespace');

const now = Date.parse('2026-11-04T12:00:00.000Z');
const clone = value => JSON.parse(JSON.stringify(value));
const config = { version: 1, profiles: Object.fromEntries(['development','staging','production'].map((env, i) => [env, {
  database: { name: `synthetic_${env}`, hostname: `mysql-${env}`, port: 3306, versionPrefix: '9.7.',
    serverUuid: `${i + 1}0000000-0000-0000-0000-000000000001` },
  r2: { accountId: 'synthetic', endpoint: 'https://synthetic.example.test', bucketName: `synthetic-${env}` },
}])) };
const add = (snapshot, table, values) => {
  const raw = JSON.stringify(Object.fromEntries(engine.SPECS[table].map(key => [key, values[key] ?? null])));
  snapshot.tables[table].push({ raw, hash: digest(raw) });
};
const fixture = (environment = 'development') => {
  const p = engine.profileFor(config, environment);
  const snapshot = { version: 1, environment, targetDigest: p.targetDigest,
    capturedAt: new Date(now - 10000).toISOString(), identity: { ...p.database, version: '9.7.2' },
    metadataVisible: 1, triggerMetadataVisible: 1, writeTriggers: [], foreignKeys: [],
    documentTables: Object.entries(engine.SPECS).filter(([, cols]) => cols.includes('document_id')).map(([TABLE_NAME]) => ({ TABLE_NAME })),
    engines: [...Object.keys(engine.SPECS),'audit_trail'].map(table => ({ table, engine: 'InnoDB' })),
    tables: Object.fromEntries(Object.keys(engine.SPECS).map(t => [t, []])) };
  const key = 'projects/PX/documents/DOC-1/revisions/IFR-Submitted/one.pdf';
  add(snapshot, 'projects', { id: 'P', project_code: 'PX', status: 'Active' });
  add(snapshot, 'users', { id: 1, full_name: 'Synthetic Admin', status: 'Active' });
  add(snapshot, 'project_memberships', { id: 'M', project_id: 'P', user_id: 1, official_role: 'Admin', status: 'Active' });
  add(snapshot, 'engineering_documents', { id: 'D', project_id: 'P', document_number: 'DOC-1', active_file_id: 'F', active_revision_id: 'R' });
  add(snapshot, 'stored_files', { file_id: 'F', project_id: 'P', document_id: 'D', storage_key: key,
    relative_path: key, file_size: 4, checksum: digest('data') });
  add(snapshot, 'document_revisions', { id: 'R', project_id: 'P', document_id: 'D', file_id: 'F', storage_path_legacy: key });
  const calls = [];
  const c = {
    query: async sql => {
      calls.push(sql);
      if (sql === 'SELECT DATABASE() name,@@server_uuid serverUuid,@@hostname hostname,@@port port,VERSION() version') return [[snapshot.identity]];
      if (sql.startsWith('SELECT JSON_OBJECT(')) return [[{ snapshot_json: JSON.stringify(snapshot) }]];
      assert.match(sql, /^(SET TRANSACTION ISOLATION LEVEL REPEATABLE READ|START TRANSACTION READ ONLY)$/);
      return [[]];
    },
    execute: async (sql, args) => {
      calls.push(sql);
      const tables = engine.readSnapshot(snapshot, p);
      if (sql === 'SELECT * FROM stored_files ORDER BY file_id') return [tables.stored_files];
      return engine.snapshotConnection(snapshot, tables).execute(sql, args);
    },
    rollback: async () => { calls.push('ROLLBACK'); },
  };
  const storage = { captureNamespace: async () => p.namespace,
    inspectOwnedExact: async (actualKey, ns) => {
      assert.equal(actualKey, key); assert.equal(ns.id, p.namespace.id);
      return { exists: true, size: 4, sha256: digest('data') };
    } };
  const snapshotter = async () => ({ digest: digest('unchanged database'), tables: 22 });
  return { config, environment, p, snapshot, c, storage, calls, snapshotter, clock: () => now,
    attest: { maintenance: true, namespace: p.namespace.id } };
};
const prepare = f => runner.prepare(f);
const approval = run => ({ digest: run.plan.approvalDigest, environment: run.plan.environment,
  targetDigest: run.plan.targetDigest, confirm: 'APPLY_HISTORICAL_NAMESPACE_BINDINGS', maintenance: true, actorUserId: '1' });
const backup = async (t, f) => {
  const dir = await fs.mkdtemp(path.join(os.tmpdir(), 'runner-synthetic-'));
  t.after(() => fs.rm(dir, { recursive: true, force: true }));
  const dumpPath = path.join(dir, 'synthetic.sql');
  await fs.writeFile(dumpPath, [...Object.keys(engine.SPECS),'audit_trail'].map(t => `CREATE TABLE \`${t}\` (id INT);`).join('\n'));
  return { version: 1, targetDigest: f.p.targetDigest, reviewedByOwner: true, scope: 'FULL_DATABASE', dumpPath,
    createdAt: new Date(now - 1000).toISOString(), restoreTest: 'NOT_TESTED', ...(await runner.hashFile(dumpPath)) };
};

for (const environment of ['development','staging','production']) test(`${environment}: prepare orchestrates real inventory/inspector and evidence engine without writes`, async () => {
  const f = fixture(environment); const run = await prepare(f);
  assert.equal(run.plan.summary.eligible, 1); assert.equal(run.report.summary.VERIFIED, 1);
  assert.equal(run.evidence.inspectionReport, run.report);
  assert.equal(engine.seal(run.plan), run.plan.approvalDigest);
  assert.ok(f.calls.every(sql => /^(SELECT|SET TRANSACTION|START TRANSACTION READ ONLY|ROLLBACK)/.test(sql)));
});

test('credentials are explicit, isolated, proxy-aware and never default to backend config', () => {
  const f = fixture();
  const env = { APP_ENV: 'development', MYSQL_HOST: 'proxy.example.test', MYSQL_PORT: '19000', MYSQL_DATABASE: f.p.database.name,
    MYSQL_USER: 'synthetic', MYSQL_PASSWORD: 'not-a-real-secret', R2_ACCOUNT_ID: f.p.r2.accountId,
    R2_ENDPOINT: f.p.r2.endpoint, R2_BUCKET_NAME: f.p.r2.bucketName, R2_REGION: 'auto',
    R2_ACCESS_KEY_ID: 'synthetic', R2_SECRET_ACCESS_KEY: 'synthetic',
    MYSQL_TLS_MODE: 'VERIFY_IDENTITY', MYSQL_TLS_SERVER_NAME: 'proxy.example.test' };
  const ca = require('node:tls').rootCertificates[0];
  assert.equal(runner.credentialsFor(env, f.p, ca).mysql.port, 19000);
  assert.equal(f.p.database.port, 3306);
  assert.throws(() => runner.credentialsFor({}, f.p), { code: 'MISSING_CREDENTIALS' });
  assert.throws(() => runner.credentialsFor({ ...env, APP_ENV: 'production' }, f.p), { code: 'ENVIRONMENT_OR_NAMESPACE_MISMATCH' });
  assert.throws(() => runner.credentialsFor({ ...env, R2_BUCKET_NAME: 'wrong' }, f.p), { code: 'ENVIRONMENT_OR_NAMESPACE_MISMATCH' });
  for (const host of ['127.0.0.1','localhost','mysql.railway.internal']) {
    assert.throws(() => runner.credentialsFor({ ...env, MYSQL_HOST: host }, f.p), { code: 'PUBLIC_PROXY_REQUIRED' });
  }
});

test('wrong database identity fails before snapshot/object reads', async () => {
  const f = fixture(); f.snapshot.identity.serverUuid = config.profiles.production.database.serverUuid;
  await assert.rejects(prepare(f), { code: 'DATABASE_IDENTITY_MISMATCH' });
  assert.equal(f.calls.filter(sql => sql.startsWith('SELECT JSON_OBJECT')).length, 0);
});

test('wrong R2 namespace and missing maintenance attestation fail closed', async () => {
  const f = fixture(); f.storage.captureNamespace = async () => engine.profileFor(config, 'staging').namespace;
  await assert.rejects(prepare(f), { code: 'R2_NAMESPACE_MISMATCH' });
  f.attest.maintenance = false;
  await assert.rejects(prepare(f), { code: 'OWNER_MAINTENANCE_AND_NAMESPACE_REQUIRED' });
});

for (const [name, proof, reason] of [
  ['missing object', { exists: false }, 'FILE_MISSING'],
  ['size mismatch', { exists: true, size: 9, sha256: digest('data') }, 'FILE_CONTENT_MISMATCH'],
  ['checksum mismatch', { exists: true, size: 4, sha256: digest('wrong') }, 'FILE_CONTENT_MISMATCH'],
]) test(`prepare: ${name} remains BLOCKED without fabricated proof`, async () => {
  const f = fixture(); f.storage.inspectOwnedExact = async () => proof;
  const run = await prepare(f);
  assert.equal(run.plan.summary.blocked, 1); assert.equal(run.plan.summary.eligible, 0);
  assert.equal(run.report.files[0].reason, reason);
});

test('concurrent full database change rejects before publishing evidence', async () => {
  const f = fixture(); let i = 0; f.snapshotter = async () => ({ digest: digest(String(i++)) });
  await assert.rejects(prepare(f), { code: 'DATABASE_CHANGED_DURING_INSPECTION' });
  assert.equal(f.calls.at(-1), 'ROLLBACK');
});

test('unsettled writer prevents eligibility without changing admission/ledger', async () => {
  const f = fixture(); add(f.snapshot, 'document_writer_operations', { id: 'W', project_id: 'P', document_id: 'D', lifecycle_state: 'ACTIVE' });
  const run = await prepare(f);
  assert.equal(run.plan.summary.blocked, 1); assert.equal(run.plan.files[0].reason, 'WRITER_NOT_SETTLED');
});

test('generate produces guarded SQL, validates real synthetic dump and never executes generated writes', async t => {
  const f = fixture(); const run = await prepare(f); const receipt = await backup(t, f);
  const sql = await runner.generate({ ...f, run, approval: approval(run), receipt, now });
  assert.match(sql, /READY TO COMMIT/); assert.match(sql, /FOR UPDATE/);
  assert.match(sql, /INSERT INTO stored_file_namespace_bindings/);
  assert.doesNotMatch(sql.replace(/^--.*$/gm, ''), /\bCOMMIT\s*;/);
  assert.ok(f.calls.every(sql => !/^(INSERT|UPDATE|DELETE|ALTER|CREATE|DROP|COMMIT)/.test(sql)));
});

test('snapshot changed and cross-environment run are rejected', async t => {
  const f = fixture(); const run = await prepare(f); const receipt = await backup(t, f);
  f.snapshot.tables.document_history.push({ raw: JSON.stringify({ id: 'H', project_id: 'P', document_id: 'D' }), hash: digest(JSON.stringify({ id: 'H', project_id: 'P', document_id: 'D' })) });
  await assert.rejects(runner.generate({ ...f, run, receipt, approval: approval(run), now }), { code: 'SNAPSHOT_CHANGED' });
  await assert.rejects(runner.generate({ ...f, environment: 'staging', run, receipt, now }), { code: 'RUN_TARGET_MISMATCH' });
});

test('missing backup and invalid backup checksum are rejected', async t => {
  const f = fixture(); const run = await prepare(f); const receipt = await backup(t, f);
  await assert.rejects(runner.generate({ ...f, run, approval: approval(run), now }), { code: 'BACKUP_RECEIPT_REQUIRED' });
  receipt.sha256 = digest('wrong dump');
  await assert.rejects(runner.generate({ ...f, run, receipt, approval: approval(run), now }), { code: 'BACKUP_INTEGRITY_OR_TABLES_FAILED' });
});
test('generation rechecks expiry after hashing backup instead of using a stale start time', async t => {
  const f = fixture(); const run = await prepare(f); const receipt = await backup(t, f); let calls = 0;
  await assert.rejects(runner.generate({ ...f, run, receipt, approval: approval(run),
    clock: () => calls++ === 0 ? now : now + 7200000 }));
});
test('run selection rejects traversal and missing checkpoints without falling back', async t => {
  const dir = await fs.mkdtemp(path.join(os.tmpdir(), 'runner-path-'));
  t.after(() => fs.rm(dir, { recursive: true, force: true }));
  await assert.rejects(runner.safeRun(dir, '../development'), { code: 'EXPLICIT_RUN_REQUIRED' });
  await assert.rejects(runner.safeRun(dir, 'run-absent'), { code: 'ENOENT' });
});

for (const kind of ['missing approval','wrong approval digest','missing evidence','invalid evidence','expired evidence','expired snapshot']) {
  test(`generation rejects ${kind}`, async t => {
    const f = fixture(); const run = await prepare(f); const receipt = await backup(t, f); let approved = approval(run);
    if (kind === 'missing approval') approved = undefined;
    if (kind === 'wrong approval digest') approved.digest = digest('wrong');
    if (kind === 'missing evidence') run.evidence = null;
    if (kind === 'invalid evidence') run.evidence.inspectionReport.approvalDigest = digest('tampered');
    if (kind === 'expired evidence') run.evidence.inspectedAt = new Date(now - 7200000).toISOString();
    if (kind === 'expired snapshot') run.snapshot.capturedAt = new Date(now - 7200000).toISOString();
    await assert.rejects(runner.generate({ ...f, run, receipt, approval: approved, now }));
  });
}

const bind = (f, run) => {
  add(f.snapshot, 'storage_namespaces', { id: f.p.namespace.id, provider: 'r2', descriptor: f.p.namespace.encoded });
  const item = run.plan.files[0];
  add(f.snapshot, 'stored_file_namespace_bindings', { file_id: 'F', namespace_id: f.p.namespace.id,
    storage_key_snapshot: item.storageKey, evidence: JSON.stringify({ source: 'OWNER_REVIEWED_STORAGE_INVENTORY',
      version: 1, recordId: run.plan.approvalDigest, projectId: 'P', documentId: 'D', size: 4, sha256: digest('data') }) });
};
test('verify PASS requires expected bindings, baseline integrity and real dry-run inspection', async () => {
  const f = fixture(); const run = await prepare(f); bind(f, run);
  const result = await runner.verify({ ...f, run }); assert.equal(result.verdict, 'PASS');
  assert.equal(result.approvedBindingsConfirmed, 1);
});
test('verify FAIL for missing bindings or object content mismatch', async () => {
  const f = fixture(); const run = await prepare(f);
  assert.equal((await runner.verify({ ...f, run })).verdict, 'FAIL');
  bind(f, run); f.storage.inspectOwnedExact = async () => ({ exists: false });
  assert.equal((await runner.verify({ ...f, run })).verdict, 'FAIL');
});
test('verification errors propagate for CLI INCONCLUSIVE, never PASS', async () => {
  const f = fixture(); const run = await prepare(f); f.c.query = async () => { throw new Error('synthetic disconnect'); };
  await assert.rejects(runner.verify({ ...f, run }));
});
test('R2 access denial is INCONCLUSIVE rather than a completed verification', async () => {
  const f = fixture(); const run = await prepare(f); bind(f, run);
  f.storage.inspectOwnedExact = async () => { throw Object.assign(new Error('synthetic denied'), { code: 'AccessDenied' }); };
  const result = await runner.verify({ ...f, run });
  assert.equal(result.verdict, 'INCONCLUSIVE'); assert.equal(result.runtimeStorage, 'OBJECT VERIFICATION INCOMPLETE');
});
test('read-only query facade refuses mutation/locking and error output never contains arbitrary secrets', async () => {
  for (const sql of ['DELETE FROM users','SELECT * FROM users FOR UPDATE', "SELECT GET_LOCK('x',1)", "SELECT 1 INTO OUTFILE 'x'"]) {
    assert.throws(() => runner.readOnly({}).execute(sql), { code: 'READ_ONLY_QUERY_REQUIRED' });
  }
  assert.equal(runner.publicCode({ code: 'mysql://user:secret@host' }), 'RECOVERY_RUNNER_STOPPED');
});
test('runner is import-safe, uses isolated env and keeps inspector apply unreachable', async () => {
  const source = await fs.readFile(path.resolve(__dirname, '../../scripts/historical-recovery-runner.cjs'), 'utf8');
  assert.doesNotMatch(source, /\.apply\(|process\.env\s*=|Object\.assign\(process\.env|config\/env|config\/database|src\/server/);
  assert.match(source, /if \(require\.main === module\)/);
  assert.match(source, /verdict: 'INCONCLUSIVE'/);
  assert.match(source, /flag: 'wx'/);
  assert.match(source, /engine\.generateApply/);
  assert.match(source, /engine\.verifySnapshot/);
});
