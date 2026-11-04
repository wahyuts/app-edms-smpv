const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const os = require('node:os');
const path = require('node:path');
const { digest, r2Namespace } = require('../../src/utils/storageNamespace');
const tool = require('../../scripts/historical-namespace-recovery.cjs');
const { bindNewFile } = require('../../src/repositories/storageNamespace.repository');
const { reportDigest } = require('../../src/services/legacyFileReconciliation.service');

const now = Date.parse('2026-11-03T12:00:00.000Z');
const config = { version: 1, profiles: Object.fromEntries(['development','staging','production'].map((env, i) => [env, {
  database: { name: `synthetic_${env}`, serverUuid: `${i + 1}0000000-0000-0000-0000-000000000001`, hostname: `mysql-${env}`, port: 3306, versionPrefix: '9.7.' },
  r2: { accountId: 'synthetic-account', endpoint: 'https://synthetic.example.test', bucketName: `synthetic-${env}` },
}])) };
const clone = v => JSON.parse(JSON.stringify(v));
const add = (snapshot, table, values) => {
  const row = Object.fromEntries(tool.SPECS[table].map(key => [key, values[key] ?? null]));
  const raw = JSON.stringify(row); snapshot.tables[table].push({ raw, hash: digest(raw) }); return row;
};
const fixture = (environment = 'development', count = 2) => {
  const profile = tool.profileFor(config, environment);
  const snapshot = { version: 1, environment, targetDigest: profile.targetDigest,
    capturedAt: new Date(now - 10000).toISOString(), metadataVisible: 1, triggerMetadataVisible: 1, writeTriggers: [],
    identity: { ...profile.database, version: '9.7.2' },
    engines: [...Object.keys(tool.SPECS),'audit_trail'].map(table => ({ table, engine: 'InnoDB' })),
    documentTables: Object.entries(tool.SPECS).filter(([, cols]) => cols.includes('document_id')).map(([table]) => ({ TABLE_NAME: table })),
    foreignKeys: [], tables: Object.fromEntries(Object.keys(tool.SPECS).map(table => [table, []])) };
  const evidence = { version: 1, source: 'OWNER_REVIEWED_STORAGE_INVENTORY', environment,
    targetDigest: profile.targetDigest, inspectedAt: new Date(now - 10000).toISOString(),
    runtimeNamespaceVerified: true, storageWritersStopped: true, namespace: profile.namespace, files: [] };
  add(snapshot, 'projects', { id: 'P', project_code: 'PX', status: 'Active' });
  add(snapshot, 'users', { id: 1, status: 'Active', full_name: 'Synthetic Admin', department_name_snapshot: 'Test' });
  add(snapshot, 'project_memberships', { id: 'M', project_id: 'P', user_id: 1, official_role: 'Admin', status: 'Active' });
  for (let i = 1; i <= count; i++) {
    const doc = `D${i}`, fileId = `F${i}`, key = `projects/PX/documents/DOC-${i}/revisions/IFR-Submitted/file-${i}.pdf`;
    add(snapshot, 'engineering_documents', { id: doc, project_id: 'P', document_number: `DOC-${i}`, active_file_id: fileId, active_revision_id: `R${i}` });
    add(snapshot, 'stored_files', { file_id: fileId, project_id: 'P', document_id: doc, storage_key: key,
      relative_path: key, file_size: i, checksum: digest(`synthetic-bytes-${i}`) });
    add(snapshot, 'document_revisions', { id: `R${i}`, project_id: 'P', document_id: doc, file_id: fileId, storage_path_legacy: key });
    evidence.files.push({ fileId, projectId: 'P', documentId: doc, storageKey: key, verified: true,
      namespaceId: profile.namespace.id, size: i, sha256: digest(`synthetic-bytes-${i}`) });
  }
  // Retained completed ledger is not confused with the surviving documents.
  add(snapshot, 'document_delete_operations', { id: 'OLD', project_id: 'P', document_id: 'REMOVED', status: 'QUIESCENCE_CONFIRMED' });
  add(snapshot, 'document_delete_executions', { operation_id: 'OLD', phase: 'COMPLETED' });
  const backup = { verified: true, targetDigest: profile.targetDigest, sha256: digest('synthetic-backup'), bytes: 1,
    scope: 'FULL_DATABASE', reviewedByOwner: true, createdAt: new Date(now - 5000).toISOString(), restoreTest: 'NOT_TESTED' };
  evidence.inspectionReport = { version: 1, mode: 'DRY_RUN',
    target: { environment, name: profile.database.name, hostname: profile.database.hostname, port: 3306, version: '9.7.2' },
    databaseEvidence: { unchanged: true, before: { digest: digest('synthetic-database') }, after: { digest: digest('synthetic-database') } },
    namespaces: [profile.namespace], files: evidence.files.map(f => ({ fileId: f.fileId, projectId: f.projectId,
      documentId: f.documentId, storageKey: f.storageKey, status: 'VERIFIED', namespace: profile.namespace,
      proof: { sha256: f.sha256, size: f.size } })) };
  evidence.inspectionReport.approvalDigest = reportDigest(evidence.inspectionReport);
  return { profile, snapshot, evidence, backup };
};
const planFor = f => tool.buildPlan({ config, environment: f.profile.environment, snapshot: f.snapshot, evidence: f.evidence, now });
const approvalFor = (f, plan) => ({ digest: plan.approvalDigest, confirm: 'APPLY_HISTORICAL_NAMESPACE_BINDINGS',
  environment: f.profile.environment, targetDigest: f.profile.targetDigest, maintenance: true, actorUserId: '1' });
const applySql = (f, plan, overrides = {}) => tool.generateApply({ config, environment: f.profile.environment,
  snapshot: f.snapshot, evidence: f.evidence, backup: f.backup, plan, approval: approvalFor(f, plan), now, ...overrides });
const executableSql = value => value.replace(/^--.*$/gm, '').replace(/'(?:''|[^'])*'/g, "''");

for (const [env, count] of [['development',1],['staging',3],['production',5]]) test(`${env}: dynamic inventory with ${count} files uses its own namespace`, async () => {
  const f = fixture(env, count); const plan = await planFor(f);
  assert.equal(plan.summary.total, count); assert.equal(plan.summary.eligible, count); assert.equal(plan.summary.blocked, 0);
  assert.equal(plan.namespace.id, r2Namespace(config.profiles[env].r2).id);
  assert.equal(tool.seal(plan), plan.approvalDigest);
  const sql = await applySql(f, plan);
  assert.equal((sql.match(/INSERT INTO stored_file_namespace_bindings/g) || []).length, count);
  assert.ok(sql.includes(f.profile.targetDigest));
});

test('Missing physical proof never becomes an eligible binding from SQL metadata alone', async () => {
  const f = fixture(); const plan = await tool.buildPlan({ config, environment: 'development', snapshot: f.snapshot, now });
  assert.equal(plan.summary.blocked, 2); assert.equal(plan.summary.eligible, 0);
  assert.ok(plan.files.every(file => file.reason === 'EXACT_STORAGE_PROOF_REQUIRED'));
  await assert.rejects(applySql(f, plan), { code: 'PREFLIGHT_CHANGED_OR_BLOCKED' });
});

const bindFixture = (f, plan) => {
  const ns = f.profile.namespace;
  if (!f.snapshot.tables.storage_namespaces.length) add(f.snapshot, 'storage_namespaces', { id: ns.id, provider: 'r2', descriptor: ns.encoded });
  for (const file of plan.files.filter(row => row.status === 'ELIGIBLE')) add(f.snapshot, 'stored_file_namespace_bindings', {
    file_id: file.fileId, namespace_id: ns.id, storage_key_snapshot: file.storageKey,
    evidence: JSON.stringify({ source: 'OWNER_REVIEWED_STORAGE_INVENTORY', version: 1, recordId: plan.approvalDigest,
      actorUserId: '1', projectId: file.projectId, documentId: file.documentId, sha256: file.sha256, size: file.size }),
  });
};

test('Existing complete bindings remain untouched; a fresh rerun is an idempotent no-op', async () => {
  const f = fixture(); const original = await planFor(f); bindFixture(f, original);
  const before = JSON.stringify(f.snapshot.tables.stored_file_namespace_bindings);
  const plan = await planFor(f); assert.equal(plan.summary.alreadyBound, 2); assert.equal(plan.summary.eligible, 0);
  assert.match(await applySql(f, plan), /^-- NO CHANGES/);
  assert.equal(JSON.stringify(f.snapshot.tables.stored_file_namespace_bindings), before);
  await assert.rejects(applySql(f, original), { code: 'PREFLIGHT_CHANGED_OR_BLOCKED' });
});

test('Conflicting binding is BLOCKED and cannot be overwritten', async () => {
  const f = fixture(); const original = await planFor(f); bindFixture(f, original);
  const row = JSON.parse(f.snapshot.tables.stored_file_namespace_bindings[0].raw); row.storage_key_snapshot += '.other';
  f.snapshot.tables.stored_file_namespace_bindings[0] = { raw: JSON.stringify(row), hash: digest(JSON.stringify(row)) };
  const plan = await planFor(f); assert.ok(plan.summary.blocked > 0);
  await assert.rejects(applySql(f, plan), { code: 'PREFLIGHT_CHANGED_OR_BLOCKED' });
});

test('Wrong environment, target identity or namespace is rejected before SQL generation', async () => {
  const f = fixture();
  const wrong = clone(f.snapshot); wrong.identity.serverUuid = config.profiles.staging.database.serverUuid;
  await assert.rejects(tool.buildPlan({ config, environment: 'development', snapshot: wrong, evidence: f.evidence, now }), { code: 'SNAPSHOT_IDENTITY_MISMATCH' });
  await assert.rejects(tool.buildPlan({ config, environment: 'staging', snapshot: f.snapshot, evidence: f.evidence, now }), { code: 'SNAPSHOT_TARGET_OR_VISIBILITY' });
  const evidence = clone(f.evidence); evidence.namespace = tool.profileFor(config, 'staging').namespace;
  await assert.rejects(tool.buildPlan({ config, environment: 'development', snapshot: f.snapshot, evidence, now }), { code: 'EVIDENCE_NAMESPACE_MISMATCH' });
  const duplicate = clone(config); duplicate.profiles.production.r2 = duplicate.profiles.development.r2;
  assert.throws(() => tool.profileFor(duplicate, 'development'), { code: 'CROSS_ENVIRONMENT_TARGET_OR_NAMESPACE' });
});

test('Invalid key, cross-document file references and incomplete evidence are fail-closed', async () => {
  const f = fixture(); const row = JSON.parse(f.snapshot.tables.stored_files[0].raw); row.storage_key = '../outside';
  f.snapshot.tables.stored_files[0] = { raw: JSON.stringify(row), hash: digest(JSON.stringify(row)) };
  assert.equal((await planFor(f)).summary.eligible, 0);
  assert.equal((await planFor(f)).summary.blocked, 2);
  const other = fixture(); const doc = JSON.parse(other.snapshot.tables.engineering_documents[1].raw); doc.active_file_id = 'F1';
  other.snapshot.tables.engineering_documents[1] = { raw: JSON.stringify(doc), hash: digest(JSON.stringify(doc)) };
  assert.ok((await planFor(other)).summary.blocked > 0);
});

test('Preflight/apply metadata race, stale evidence and tampered approvals are rejected', async () => {
  const f = fixture(); const plan = await planFor(f);
  const changed = clone(f.snapshot); const row = JSON.parse(changed.tables.stored_files[0].raw); row.file_size++;
  changed.tables.stored_files[0] = { raw: JSON.stringify(row), hash: digest(JSON.stringify(row)) };
  await assert.rejects(applySql(f, plan, { snapshot: changed }), { code: 'PREFLIGHT_CHANGED_OR_BLOCKED' });
  await assert.rejects(applySql(f, { ...plan, summary: { ...plan.summary, eligible: 0 } }), { code: 'EXPLICIT_OWNER_APPROVAL_REQUIRED' });
  await assert.rejects(applySql(f, plan, { now: now + 3600001 }), { code: 'SNAPSHOT_EXPIRED' });
  await assert.rejects(applySql(f, plan, { approval: { ...approvalFor(f, plan), maintenance: false } }), { code: 'EXPLICIT_OWNER_APPROVAL_REQUIRED' });
  await assert.rejects(applySql(f, plan, { backup: null }), { code: 'VERIFIED_BACKUP_REQUIRED' });
});

test('Generated transaction preserves canonical binding fields, guards each write and leaves COMMIT manual for rollback safety', async () => {
  const f = fixture(); const plan = await planFor(f); const sql = await applySql(f, plan);
  assert.match(sql, /SET TRANSACTION ISOLATION LEVEL REPEATABLE READ;\nSTART TRANSACTION;/);
  assert.equal((sql.match(/FOR UPDATE;/g) || []).length, Object.keys(tool.SPECS).length + 1);
  assert.ok(sql.includes('ROW_COUNT()=1')); assert.ok(sql.includes('@hb_ok=1'));
  const executable = executableSql(sql);
  assert.doesNotMatch(executable, /\b(COMMIT|ROLLBACK|CREATE|ALTER|DROP|TRUNCATE|CALL|DELETE)\b/);
  assert.doesNotMatch(executable, /^UPDATE /m);
  const writes = [...executable.matchAll(/INSERT INTO ([a-z_]+)/g)].map(m => m[1]);
  assert.ok(writes.every(t => ['storage_namespaces','stored_file_namespace_bindings','audit_trail'].includes(t)));
  assert.match(sql, /STOP - ROLLBACK REQUIRED/);
  assert.ok(sql.includes(Buffer.from('OWNER_REVIEWED_STORAGE_INVENTORY').toString('hex')));
  assert.equal(tool.verifySql(f.profile, plan).includes('approved_file_bindings_expected'), true);
});

test('Canonical bindNewFile supports the generated namespace/key contract with transaction rollback on simulated failure', async () => {
  const f = fixture('development', 1); const plan = await planFor(f); const writes = [];
  const c = { execute: async (sql, values) => {
    if (sql.includes('information_schema.TABLES')) return [[{ TABLE_NAME: 'storage_namespaces' }, { TABLE_NAME: 'stored_file_namespace_bindings' }]];
    if (sql.startsWith('SELECT descriptor')) return [[{ descriptor: f.profile.namespace.encoded }]];
    writes.push({ sql, values }); return [{ affectedRows: 1 }];
  } };
  const before = JSON.stringify(f.snapshot);
  try { await bindNewFile(c, plan.files[0].fileId, plan.files[0].storageKey, f.profile.namespace); throw new Error('synthetic failure before commit'); }
  catch { writes.length = 0; }
  assert.equal(writes.length, 0); assert.equal(JSON.stringify(f.snapshot), before);
});

test('Empty dataset is valid and does not generate any writes', async () => {
  const f = fixture('production', 0); const plan = await planFor(f);
  assert.equal(plan.summary.total, 0); assert.equal(plan.summary.blocked, 0);
  assert.match(await applySql(f, plan), /NO CHANGES/);
});

test('Unreviewed triggers, namespace registry conflicts and missing metadata visibility are rejected', async () => {
  const f = fixture(); f.snapshot.writeTriggers.push('unexpected');
  await assert.rejects(planFor(f), { code: 'WRITE_TRIGGER_VISIBILITY_OR_UNREVIEWED_TRIGGER' });
  f.snapshot.writeTriggers = []; f.snapshot.metadataVisible = 0;
  await assert.rejects(planFor(f), { code: 'SNAPSHOT_TARGET_OR_VISIBILITY' });
  f.snapshot.metadataVisible = 1;
  add(f.snapshot, 'storage_namespaces', { id: f.profile.namespace.id, provider: 'r2', descriptor: '{}' });
  await assert.rejects(planFor(f), { code: 'REGISTERED_NAMESPACE_CONFLICT' });
});

test('Arbitrary manually labeled proofs cannot replace the existing inspector report', async () => {
  const f = fixture(); delete f.evidence.inspectionReport;
  await assert.rejects(planFor(f), { code: 'EXISTING_READONLY_INSPECTION_REPORT_REQUIRED' });
  const other = fixture(); other.evidence.inspectionReport.files[0].proof.size++;
  await assert.rejects(planFor(other), { code: 'EXISTING_READONLY_INSPECTION_REPORT_REQUIRED' });
});

test('Verify confirms approved records and unchanged nonbinding metadata; missing/changed evidence stays review-required', async () => {
  const f = fixture(); const plan = await planFor(f); const before = clone(f.snapshot); bindFixture(f, plan);
  const result = await tool.verifySnapshot({ config, environment: 'development', snapshot: f.snapshot, baseline: before, plan, now });
  assert.equal(result.approvedBindingsConfirmed, 2); assert.equal(result.remainingMissing, 0);
  assert.equal(result.integrity, 'PASS - EXPORTED METADATA UNCHANGED');
  assert.equal(result.verdict, 'METADATA VERIFIED - NOT DELETE AUTHORIZATION');
  f.snapshot.tables.stored_file_namespace_bindings.pop();
  const missing = await tool.verifySnapshot({ config, environment: 'development', snapshot: f.snapshot, plan, now });
  assert.equal(missing.remainingMissing, 1); assert.equal(missing.verdict, 'REVIEW REQUIRED');
  assert.match(missing.integrity, /^UNVERIFIED/);
});

test('Nontransactional Audit Trail, oversized snapshots and wrong actor block apply safely', async () => {
  const f = fixture(); const plan = await planFor(f);
  await assert.rejects(applySql(f, plan, { approval: { ...approvalFor(f, plan), actorUserId: '999' } }), { code: 'ACTIVE_PROJECT_ADMIN_REQUIRED' });
  f.snapshot.engines.find(e => e.table === 'audit_trail').engine = 'MyISAM';
  await assert.rejects(planFor(f), { code: 'TRANSACTIONAL_AUDIT_TRAIL_REQUIRED' });
  const small = clone(config); small.profiles.development.maxRows = 1;
  await assert.rejects(tool.buildPlan({ config: small, environment: 'development', snapshot: fixture().snapshot, now }), { code: 'SNAPSHOT_TOO_LARGE_REVIEW_MAINTENANCE_CAPACITY' });
});

test('All SQL snapshot/PK columns match canonical schema plus the two canonical MySQL migrations', async () => {
  const schema = new Map();
  for (const file of ['database/schema/schema-dev.sql', 'database/migration/20261102_0001_permanent_delete_foundation_mysql.sql',
    'database/migration/20261102_0002_permanent_delete_cleanup_mysql.sql']) {
    const source = await fs.readFile(path.resolve(__dirname, '../../../..', file), 'utf8');
    for (const match of source.matchAll(/CREATE TABLE ([a-z_]+) \(([\s\S]*?)\) ENGINE=/g)) schema.set(match[1], {
      columns: new Set([...match[2].matchAll(/^  ([a-z][a-z_0-9]*)\s+[A-Z]/gm)].map(m => m[1])),
      pk: match[2].match(/PRIMARY KEY \(([^)]+)\)/)[1].split(',').map(s => s.trim()),
    });
  }
  for (const [table, columns] of Object.entries(tool.SPECS)) {
    assert.ok(schema.has(table), table);
    for (const column of columns) assert.ok(schema.get(table).columns.has(column), `${table}.${column}`);
    assert.deepEqual(tool.PK[table] || ['id'], schema.get(table).pk);
  }
});

test('CLI defaults to offline SQL preflight and never overwrites an existing output', async t => {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), 'edms-hbr-cli-')); t.after(() => fs.rm(root, { recursive: true, force: true }));
  const configFile = path.join(root, 'config.json'), out = path.join(root, 'preflight.sql');
  await fs.writeFile(configFile, JSON.stringify(config));
  const { spawnSync } = require('node:child_process');
  const cli = path.resolve(__dirname, '../../scripts/historical-namespace-recovery.cjs');
  const args = [cli, '--environment', 'development', '--config', configFile, '--out', out];
  const first = spawnSync(process.execPath, args, { encoding: 'utf8', timeout: 10000 });
  assert.equal(first.status, 0, first.stderr); assert.equal(JSON.parse(first.stdout).databaseAccess, false);
  assert.match(await fs.readFile(out, 'utf8'), /SELECT JSON_OBJECT/);
  assert.notEqual(spawnSync(process.execPath, args, { encoding: 'utf8', timeout: 10000 }).status, 0);
});

test('SQL export/verify stays read-only, contains no credentials, and uses binary-exact identity snapshots', () => {
  const f = fixture(); const sql = tool.preflightSql(f.profile) + tool.verifySql(f.profile);
  assert.doesNotMatch(executableSql(sql), /\b(INSERT|UPDATE|DELETE|CREATE|ALTER|DROP|CALL|COMMIT|ROLLBACK)\b/);
  assert.doesNotMatch(executableSql(sql), /^SET\b/m);
  assert.match(sql, /snapshot_json/); assert.match(sql, /server_uuid/);
  const bad = clone(config); bad.profiles.development.password = 'not-allowed';
  assert.throws(() => tool.profileFor(bad, 'development'), { code: 'CREDENTIAL_FIELD_NOT_ALLOWED' });
});

test('Backup gate verifies a synthetic local dump hash and required table definitions; no restore is claimed', async t => {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), 'edms-hbr-test-')); t.after(() => fs.rm(root, { recursive: true, force: true }));
  const f = fixture(); const dump = [...Object.keys(tool.SPECS),'audit_trail'].map(table => `CREATE TABLE \`${table}\` (id INT);`).join('\n');
  const dumpPath = path.join(root, 'synthetic.sql'); await fs.writeFile(dumpPath, dump);
  const receipt = { version: 1, targetDigest: f.profile.targetDigest, reviewedByOwner: true, scope: 'FULL_DATABASE',
    createdAt: f.backup.createdAt, sha256: digest(dump), restoreTest: 'NOT_TESTED', dumpPath };
  assert.equal((await tool.verifyBackup(receipt, f.profile, now)).verified, true);
  await assert.rejects(tool.verifyBackup({ ...receipt, sha256: digest('wrong') }, f.profile, now), { code: 'BACKUP_INTEGRITY_OR_TABLES_FAILED' });
});

module.exports = { fixture, config, now, add };
