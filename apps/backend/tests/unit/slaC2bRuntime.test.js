const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const safety = require('../helpers/slaC2bRuntime.cjs');
const plan = require('../helpers/slaC2bPlan.cjs');
const executor = require('../integration/slaC2bValidation.cjs');
const nonce = 'a'.repeat(64);
const identity = () => ({ version: '10.4.32-MariaDB', hostname: 'DESKTOP-3DFA1TA', port: 3306,
  serverId: 1, recovery: 0, datadir: 'D:\\xampp\\mysql\\data\\', db: safety.DB,
  account: 'edms_sla_runner@127.0.0.1', connectionId: 123 });
const grants = (kind = 'runner', setup = false) => [
  'GRANT USAGE ON *.* TO user',
  `GRANT ${setup ? 'SELECT, CREATE, ALTER, INDEX, REFERENCES' : 'SELECT'} ON \`edms\\_sla\\_integration\\_test\`.* TO user`,
  ...(kind === 'runner' ? plan.dmlTables.map(table => `GRANT INSERT, UPDATE, DELETE ON \`${safety.DB}\`.\`${table}\` TO user`) : []),
].map(value => ({ grant: value }));
const fake = () => {
  const state = { identity: identity(), marker: { owner_id: safety.OWNER, database_name: safety.DB,
    owner_nonce: nonce, schema_sha256: safety.SCHEMA_HASH, state: 'READY' }, grants: grants() };
  return { state, connection: { connection: { stream: { remoteAddress: '127.0.0.1', remotePort: 3306 } },
    async query(sql) { return sql.startsWith('SHOW') ? [state.grants] : [[state.identity]]; },
    async execute() { return [[state.marker]]; } } };
};
test('C2B exact runtime identity accepts only observed XAMPP identity', () => {
  safety.validateIdentity(identity(), safety.DB, 'edms_sla_runner@127.0.0.1');
});
for (const [key, value] of Object.entries({ version: '8.0.0', hostname: 'remote', port: 3307, serverId: 2,
  recovery: 1, datadir: 'C:/mysql/data', db: 'edms_smpv_dev', account: 'root@localhost', connectionId: null })) {
  test(`C2B rejects changed identity ${key}`, () => assert.throws(() => safety.validateIdentity(
    { ...identity(), [key]: value }, safety.DB, 'edms_sla_runner@127.0.0.1')));
}
test('C2B authority is private, connection-bound and revoked by failed re-verification', async () => {
  const { connection, state } = fake(), gate = safety.createRuntimeGate({ nonce });
  assert.throws(() => gate.assert(connection, 'runner'));
  await gate.verify(connection, 'runner'); gate.assert(connection, 'runner');
  assert.throws(() => gate.assert({ ...connection, verified: true }, 'runner'));
  assert.throws(() => gate.assert(connection, 'schema'));
  state.marker.owner_nonce = 'b'.repeat(64);
  await assert.rejects(gate.verify(connection, 'runner'));
  assert.throws(() => gate.assert(connection, 'runner'));
});
for (const [key, value] of Object.entries({ owner_id: 'another-owner', database_name: 'edms_db',
  owner_nonce: 'b'.repeat(64), schema_sha256: '0'.repeat(64), state: 'PROVISIONING' })) {
  test(`C2B rejects ownership mismatch ${key}`, async () => {
    const { connection, state } = fake(); state.marker[key] = value;
    await assert.rejects(safety.createRuntimeGate({ nonce }).verify(connection, 'runner'));
  });
}
test('C2B rejects missing marker and wrong socket', async () => {
  const { connection, state } = fake(), gate = safety.createRuntimeGate({ nonce });
  state.marker = undefined; await assert.rejects(gate.verify(connection, 'runner'));
  connection.connection.stream.remoteAddress = '10.0.0.1'; await assert.rejects(gate.verify(connection, 'runner'));
});
test('C2B effective grants match exact escaped database scope and table allowlist', () => {
  safety.verifyGrants(grants(), 'runner'); safety.verifyGrants(grants('schema', true), 'schema', true);
  safety.verifyGrants(grants('schema'), 'schema');
});
for (const [name, change] of [
  ['global access', rows => [...rows, { grant: 'GRANT SELECT ON *.* TO user' }]],
  ['other database', rows => [...rows, { grant: 'GRANT SELECT ON edms_db.* TO user' }]],
  ['unescaped database wildcard', rows => rows.map(row => ({ grant: row.grant.replaceAll('\\_', '_') }))],
  ['grant option', rows => rows.map(row => ({ grant: `${row.grant} WITH GRANT OPTION` }))],
  ['role membership', rows => [...rows, { grant: 'GRANT dangerous_role TO user' }]],
  ['missing privilege', rows => rows.slice(1)],
  ['marker mutation', rows => [...rows, { grant: 'GRANT UPDATE ON edms_sla_integration_test.edms_sla_test_ownership TO user' }]],
]) test(`C2B rejects effective grants: ${name}`, () => assert.throws(() => safety.verifyGrants(change(grants()), 'runner')));
for (const sql of [
  'SELECT id FROM engineering_documents WHERE id > ? ORDER BY id LIMIT ?',
  'SELECT UTC_TIMESTAMP(3) serverNow',
  'INSERT INTO notifications (id,metadata) VALUES (?,?)',
  'UPDATE projects SET status=? WHERE id=?',
  'DELETE FROM engineering_documents WHERE id IN (?,?)',
  'INSERT INTO document_admission_coordinators (project_id,document_id) VALUES (?,?) ON DUPLICATE KEY UPDATE document_id=document_id',
]) test(`C2B allows scoped SQL ${sql.slice(0, 42)}`, () => safety.assertRunnerSql(sql));
for (const sql of [
  'DROP TABLE users', 'SET GLOBAL sql_mode=?', 'UPDATE projects SET status=?',
  'DELETE FROM users', 'SELECT * FROM edms_db.users', 'SELECT * FROM `edms_db`.`users`',
  'SELECT * FROM mysql.user', 'SELECT * FROM users; DELETE FROM users',
  'SELECT * FROM users -- ignored', 'SELECT * FROM users UNION SELECT * FROM mysql.user',
  'SELECT SLEEP(1)', 'SELECT @a:=1', 'CALL recovery()', 'INSERT INTO stored_files (id) VALUES (?)',
  'UPDATE edms_sla_test_ownership SET state=? WHERE owner_id=?',
  'SELECT LOAD_FILE(?)', 'SELECT id FROM users INTO OUTFILE ?',
]) test(`C2B denies SQL ${sql}`, () => assert.throws(() => safety.assertRunnerSql(sql)));
const secret = () => ({ planId: 'C2B-PLAN-01', database: safety.DB, host: '127.0.0.1', port: 3306,
  schemaHash: safety.SCHEMA_HASH, nonce, schemaPassword: 'b'.repeat(64), runnerPassword: 'c'.repeat(64) });
test('C2B credential record enforces local endpoint and independent random secret shapes', () => {
  safety.validateSecretRecord(secret());
  for (const changed of [{ host: 'remote' }, { database: 'edms_db' }, { port: 13317 },
    { runnerPassword: nonce }, { schemaPassword: 'short' }, { schemaHash: 'wrong' }]) {
    assert.throws(() => safety.validateSecretRecord({ ...secret(), ...changed }));
  }
});
test('C2B ACL requires only explicit owner and SYSTEM full control', () => {
  const sid = 'S-1-5-21-1-2-3-1001';
  const entries = [sid, 'S-1-5-18'].map(id => ({ sid: id, inherited: false, type: 'Allow', rights: 'FullControl' }));
  safety.validateAcl(entries, sid);
  for (const modified of [entries.slice(1), [...entries, { ...entries[0], sid: 'S-1-1-0' }],
    entries.map(entry => ({ ...entry, inherited: true })), entries.map(entry => ({ ...entry, type: 'Deny' }))]) {
    assert.throws(() => safety.validateAcl(modified, sid));
  }
});
const canonical = /GENERATED ALWAYS AS \(([\s\S]*?)\) STORED/.exec(
  executor.schemaStatements().find(sql => sql.startsWith('CREATE TABLE users ')).replace(/\s+/g, ' '))[1];
test('C2B generated email expression matches canonical without changing shared-email rules', () => {
  safety.verifyEmailExpression(canonical, canonical);
  safety.verifyEmailExpression(`(${canonical.replaceAll('LOWER', 'LCASE').replaceAll('email', '`email`')})`, canonical);
  safety.verifyEmailExpression(canonical.replace(/'([^']*)'/g, "_utf8mb4'$1'"), canonical);
});
for (const [name, alter] of [
  ['missing first email', value => value.replace(/'wahyu[^']*',\s*/, '')],
  ['missing second email', value => value.replace(/,\s*'beta[^']*'/, '')],
  ['additional email', value => value.replace(/'beta[^']*'/, "'beta.int100@gmail.com','extra@example.invalid'")],
  ['wrong collation', value => value.replace('utf8mb4_bin', 'utf8mb4_unicode_ci')],
  ['no trim', value => value.replaceAll('LOWER(TRIM(email))', 'LOWER(email)')],
  ['all null', () => 'NULL'], ['different condition', value => value.replace(' OR ', ' AND ')],
  ['different result', value => value.replace('ELSE LOWER(TRIM(email))', 'ELSE NULL')],
  ['missing expression', () => ''],
]) test(`C2B expression fails closed: ${name}`, () => assert.throws(() => safety.verifyEmailExpression(alter(canonical), canonical)));
test('C2B provisioning statements and schema are pinned, separate and no-replay', () => {
  const blocks = executor.reviewedBlocks(), schema = executor.schemaStatements();
  assert.equal(blocks[0].length, 5); assert.equal(blocks[1].length, 10); assert.equal(schema.length, 18);
  for (const sql of blocks[0].slice(1, 3)) assert.match(sql, /^CREATE USER 'edms_sla_(?:schema|runner)'@'127.0.0.1' IDENTIFIED BY \?$/);
  for (const sql of blocks.flat()) assert.doesNotMatch(sql, /IF NOT EXISTS|OR REPLACE|DROP|FLUSH PRIVILEGES/i);
  for (const sql of schema) assert.doesNotMatch(sql, /\bUSE\b|CREATE DATABASE|INSERT INTO/i);
});
test('C2B executor cannot start on import; credentials never enter argv/report paths', () => {
  const source = fs.readFileSync(path.join(__dirname, '../integration/slaC2bValidation.cjs'), 'utf8');
  assert.match(source, /require\.main === module/);
  assert.match(source, /flag: 'wx'/); assert.match(source, /icacls\.exe/);
  assert.doesNotMatch(source, /console\.(?:log|error)\([^\n]*(?:secret|password|adminConfig)/i);
  assert.doesNotMatch(source, /apps\/backend\/\.env|dotenv|DROP DATABASE|TRUNCATE TABLE/);
});
