const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const engine = require('../../scripts/historical-namespace-recovery.cjs');
const { digest } = require('../../src/utils/storageNamespace');
const sql = fs.readFileSync(path.resolve(__dirname, '../../../../database/migrations/manual/historical_permanent_delete_recovery.sql'), 'utf8');
const executable = sql.replace(/^--.*$/gm, '');
const now = Date.parse('2026-11-04T12:00:00Z');
const config = { version: 1, profiles: Object.fromEntries(['development','staging','production'].map((environment, index) => [environment, {
  database: { name: `synthetic_${environment}`, serverUuid: `${index + 1}0000000-0000-0000-0000-000000000001`,
    hostname: `synthetic-${environment}`, port: 3306, versionPrefix: '9.7.' },
  r2: { accountId: 'synthetic', endpoint: 'https://synthetic.example.test', bucketName: `synthetic-${environment}` },
}])) };
const add = (s, table, value) => {
  const raw = JSON.stringify(Object.fromEntries(engine.SPECS[table].map(c => [c, value[c] ?? null])));
  s.tables[table].push({ raw, hash: digest(raw) });
};
const fixture = (environment, count, bound = false) => {
  const p = engine.profileFor(config, environment);
  const s = { version: 1, environment, targetDigest: p.targetDigest, capturedAt: new Date(now).toISOString(),
    identity: { ...p.database, version: '9.7.2' }, metadataVisible: 1, triggerMetadataVisible: 1, writeTriggers: [],
    foreignKeys: [], documentTables: Object.entries(engine.SPECS).filter(([, cols]) => cols.includes('document_id')).map(([TABLE_NAME]) => ({ TABLE_NAME })),
    engines: [...Object.keys(engine.SPECS),'audit_trail'].map(table => ({ table, engine: 'InnoDB' })),
    tables: Object.fromEntries(Object.keys(engine.SPECS).map(t => [t, []])) };
  add(s, 'projects', { id: 'P', project_code: 'PX', status: 'Active' });
  if (bound) add(s, 'storage_namespaces', { id: p.namespace.id, provider: 'r2', descriptor: p.namespace.encoded });
  for (let i = 0; i < count; i++) {
    const key = `projects/PX/documents/DOC-${i}/revisions/IFR-Submitted/file.pdf`;
    add(s, 'engineering_documents', { id: `D${i}`, project_id: 'P', document_number: `DOC-${i}`, active_file_id: `F${i}`, active_revision_id: `R${i}` });
    add(s, 'stored_files', { file_id: `F${i}`, project_id: 'P', document_id: `D${i}`, storage_key: key, relative_path: key,
      file_size: 1, checksum: digest('synthetic') });
    add(s, 'document_revisions', { id: `R${i}`, project_id: 'P', document_id: `D${i}`, file_id: `F${i}`, storage_path_legacy: key });
    if (bound) add(s, 'stored_file_namespace_bindings', { file_id: `F${i}`, namespace_id: p.namespace.id, storage_key_snapshot: key,
      evidence: JSON.stringify({ source: 'UPLOAD_ADAPTER_SNAPSHOT', version: 1, sha256: digest('synthetic'), size: 1 }) });
  }
  return s;
};
const plan = (environment, snapshot) => engine.buildPlan({ config, environment, snapshot, now });

for (const [environment, count] of [['development',38],['staging',7],['production',53]]) {
  test(`${environment}: ${count} unbound files cannot be repaired from metadata alone (authoritative engine)`, async () => {
    const snapshot = fixture(environment, count); const result = await plan(environment, snapshot);
    assert.equal(result.summary.total, count); assert.equal(result.summary.blocked, count); assert.equal(result.summary.eligible, 0);
    assert.ok(result.files.every(f => f.reason === 'EXACT_STORAGE_PROOF_REQUIRED'));
  });
}
test('empty database: no eligible files and no changes', async () => {
  assert.deepEqual((await plan('development', fixture('development', 0))).summary, { total: 0, eligible: 0, alreadyBound: 0, blocked: 0 });
});
test('valid existing/new upload bindings are preserved and remain unchanged on rerun', async () => {
  const snapshot = fixture('development', 3, true); const before = JSON.stringify(snapshot);
  const first = await plan('development', snapshot); const second = await plan('development', snapshot);
  assert.equal(first.summary.alreadyBound, 3); assert.equal(first.summary.eligible, 0);
  assert.deepEqual(second, first); assert.equal(JSON.stringify(snapshot), before);
});
test('ambiguous ownership never becomes eligible', async () => {
  const snapshot = fixture('development', 1);
  add(snapshot, 'engineering_documents', { id: 'FOREIGN', project_id: 'OTHER', document_number: 'FOREIGN', active_file_id: 'F0' });
  const result = await plan('development', snapshot);
  assert.equal(result.summary.blocked, 1); assert.equal(result.summary.eligible, 0);
});
test('wrong environment/database identity rejected by existing validator', async () => {
  const snapshot = fixture('development', 1);
  await assert.rejects(plan('staging', snapshot), { code: 'SNAPSHOT_TARGET_OR_VISIBILITY' });
  snapshot.identity.serverUuid = config.profiles.production.database.serverUuid;
  await assert.rejects(plan('development', snapshot), { code: 'SNAPSHOT_IDENTITY_MISMATCH' });
});
test('SQL target guard uses independent UUID/schema/host/port/version, not Railway label alone', () => {
  for (const field of ['@@server_uuid','DATABASE()','@@hostname','@@port','VERSION()']) assert.ok(executable.includes(field));
  assert.match(executable, /PREPARE hpr_assert/); assert.match(executable, /__HPR_STOP_TARGET_OR_SCHEMA_NOT_VERIFIED__/);
  assert.match(executable, /'development'.*'production'/s);
  assert.match(executable, /'production'.*'real_production'/s);
  assert.doesNotMatch(executable, /[a-f0-9]{8}(?:-[a-f0-9]{4}){3}-[a-f0-9]{12}/i);
});
test('rollback safety is static: read-only transaction, no DML/DDL/automatic commit; runtime rollback NOT TESTED', () => {
  assert.match(executable, /START TRANSACTION WITH CONSISTENT SNAPSHOT, READ ONLY;/);
  assert.doesNotMatch(executable, /\b(?:INSERT|UPDATE|DELETE|REPLACE|ALTER|CREATE|DROP|TRUNCATE|COMMIT|ROLLBACK)\s+(?:INTO|FROM|TABLE|INDEX|TEMPORARY|;)/i);
  assert.doesNotMatch(executable, /foreign_key_checks/i);
  assert.match(executable, /'eligible',0,'updated',0/);
});
test('SQL detects rows dynamically, never converts a bucket guess into provenance', () => {
  assert.doesNotMatch(executable, /\b38\b|LIMIT\s+\d+|SS-ALPHA|FILE-[a-f0-9]|app-edms-smpv-development/i);
  assert.match(executable, /WHEN bound_file IS NULL THEN 'EXACT_STORAGE_PROOF_REQUIRED'/);
  assert.match(executable, /'BLOCKED - SQL METADATA CANNOT PROVE MISSING R2 PROVENANCE'/);
  assert.match(executable, /LOCATE\(CAST\(0x00 AS BINARY\),CAST\(storage_key AS BINARY\)\)/);
});
test('SQL references actual canonical table and column names', () => {
  const root = path.resolve(__dirname, '../../../..');
  const canonical = ['database/schema/schema-dev.sql',
    'database/migration/20261102_0001_permanent_delete_foundation_mysql.sql',
    'database/migration/20261102_0002_permanent_delete_cleanup_mysql.sql'].map(f => fs.readFileSync(path.join(root, f), 'utf8')).join('\n');
  for (const table of ['stored_files','engineering_documents','document_revisions','workflow_attachments','projects',
    'storage_namespaces','stored_file_namespace_bindings','document_delete_operations','document_writer_operations']) {
    assert.match(canonical, new RegExp(`CREATE TABLE ${table} \\(`)); assert.ok(executable.includes(table));
  }
  for (const column of ['file_id','namespace_id','storage_key_snapshot','evidence','descriptor','completion_evidence','db_outcome']) assert.ok(canonical.includes(column));
});
test('SQL quotes/comments/parentheses are balanced (static lexical check, not a MySQL parser)', () => {
  const stripped = executable.replace(/'(?:''|[^'])*'/g, "''");
  let depth = 0;
  for (const c of stripped) { if (c === '(') depth++; if (c === ')') depth--; assert.ok(depth >= 0); }
  assert.equal(depth, 0);
});
