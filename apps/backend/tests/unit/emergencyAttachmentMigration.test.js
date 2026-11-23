const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '../../../..');
const readMigration = engine => fs.readFileSync(path.join(root,
  `database/migration/20261123_0001_emergency_workflow_attachment_${engine}.sql`), 'utf8');
const readPreflight = () => fs.readFileSync(path.join(root,
  'database/migration/20261123_0001_emergency_workflow_attachment_mysql_preflight_readonly.sql'), 'utf8');
for (const [engine, drop] of [['mariadb', 'CONSTRAINT'], ['mysql', 'CHECK']]) test(`${engine} Emergency migration is engine-specific, guarded and prepared only`, () => {
  const sql = fs.readFileSync(path.join(root, `database/migration/20261123_0001_emergency_workflow_attachment_${engine}.sql`), 'utf8');
  assert.match(sql, /PREPARED ONLY/); assert.match(sql, new RegExp(`DROP ${drop} chk_workflow_comments_workflow_action`));
  assert.equal((sql.match(/ALTER TABLE workflow_comments/g) || []).length, 1);
  assert.match(sql, /BINARY cc.CHECK_CLAUSE IN/); assert.match(sql, /EMERGENCY_STOP_BASELINE_MISMATCH/);
  assert.match(sql, /SHOW CREATE TABLE workflow_comments/); assert.match(sql, /NOT VERIFIED - DATABASE RUNTIME REQUIRED/);
  assert.match(sql, /request_fingerprint VARCHAR\(64\) NULL DEFAULT NULL/);
  const emergencyCheck = sql.match(/ADD CONSTRAINT chk_workflow_comments_emergency_request CHECK \(([\s\S]*?)\)\)',/)[1];
  assert.match(emergencyCheck, /approval_target_stage_snapshot IS NULL/);
  if (engine === 'mysql') assert.doesNotMatch(emergencyCheck, /\brevision_id\b/);
  else assert.match(emergencyCheck, /revision_id IS NULL/);
  assert.doesNotMatch(sql.replace(/^--.*$/gm, ''), /(?:^|;)\s*(INSERT|UPDATE|DELETE|TRUNCATE|REPLACE)\b/i);
});

test('MySQL 3823 correction removes only the incompatible revision predicate from MariaDB DDL', () => {
  const ddl = sql => sql.match(/SET @emergency_ddl = IF\(@emergency_baseline_ok,([\s\S]*?)PREPARE emergency_migration/)[1];
  assert.equal(ddl(readMigration('mysql')), ddl(readMigration('mariadb'))
    .replace('DROP CONSTRAINT', 'DROP CHECK').replace(' AND revision_id IS NULL', ''));
  assert.doesNotMatch(ddl(readMigration('mysql')), /\b(?:FOREIGN KEY|REFERENCES|CREATE TABLE|TRIGGER)\b/);
  for (const name of ['dev', 'staging', 'prod']) {
    const canonical = fs.readFileSync(path.join(root, `database/schema/schema-${name}.sql`), 'utf8');
    assert.match(canonical, /FOREIGN KEY \(revision_id\) REFERENCES document_revisions \(id\) ON UPDATE RESTRICT ON DELETE SET NULL/);
  }
});

test('Migration and both preflight CHECK allowlists retain four original forms plus exact Railway bytes', () => {
  const lists = [readMigration('mysql'), readPreflight()].flatMap(sql =>
    [...sql.matchAll(/BINARY cc\.CHECK_CLAUSE IN \(([\s\S]*?)\n\s*\)/g)].map(block =>
      [...block[1].matchAll(/BINARY '((?:''|[^'])*)'|X'([0-9A-F]+)'/g)].map(value =>
        value[2] ? Buffer.from(value[2], 'hex') : Buffer.from(value[1].replace(/''/g, "'")))));
  assert.equal(lists.length, 3);
  const expected = [
    "workflow_action IN ('Approval A', 'Approval B', 'Approval C')",
    "(`workflow_action` in ('Approval A','Approval B','Approval C'))",
    "`workflow_action` in ('Approval A','Approval B','Approval C')",
    "(`workflow_action` in (_utf8mb4'Approval A',_utf8mb4'Approval B',_utf8mb4'Approval C'))",
  ].map(value => Buffer.from(value));
  const railway = Buffer.from('2860776F726B666C6F775F616374696F6E6020696E20285F757466386D62345C27417070726F76616C20415C272C5F757466386D62345C27417070726F76616C20425C272C5F757466386D62345C27417070726F76616C20435C272929', 'hex');
  assert.equal(railway.length, 93);
  expected.push(railway);
  for (const list of lists) {
    assert.deepEqual(list, expected);
    for (const wrong of ['', 'unknown', railway.toString().replace('Approval C', 'Approval D'),
      railway.toString() + ' ', railway.toString().replace(' in ', ' not in ')]) {
      assert.equal(list.some(value => value.equals(Buffer.from(wrong))), false);
    }
  }
});

// Strip quoted SQL tokens before checking executable statement boundaries.
const sqlTokens = sql => sql.replace(/--[^\n]*|'(?:''|[^'])*'|`(?:``|[^`])*`/g,
  token => token.startsWith('--') ? '' : ' LITERAL ');

test('Preflight remains read-only and gates readiness on FK compatibility and manual source review', () => {
  const sql = readPreflight();
  const tokens = sqlTokens(sql);
  const statements = tokens.split(';').map(value => value.trim()).filter(Boolean);
  assert.equal(statements.length, 11);
  assert.ok(statements.every(value => /^(SELECT\b|SHOW CREATE TABLE workflow_comments$|WITH\s+relevant_fk_columns\b)/i.test(value)));
  assert.doesNotMatch(tokens, /\b(?:ALTER|DROP|INSERT|UPDATE|DELETE|TRUNCATE|REPLACE|RENAME|GRANT|REVOKE|SET|PREPARE|EXECUTE|CALL|INTO|OUTFILE|DUMPFILE|GET_LOCK|LOAD_FILE|FLUSH)\b/i);
  assert.doesNotMatch(tokens.replace(/@@[a-z_.]+/gi, ''), /@[a-z_]|:=/i);
  assert.match(sql, /mysql_check_fk_compatibility='STOP' THEN 'STOP'/);
  assert.match(sql, /AND mysql_check_fk_compatibility='PASS'\) IS TRUE/);
  assert.match(sql, /SQL cannot inspect local migration source/);
  assert.match(sql, /UPDATE_RULE='RESTRICT' AND DELETE_RULE='SET NULL'/);
  assert.match(sql, /BINARY REFERENCED_TABLE_NAME=BINARY 'document_revisions'/);
  assert.match(sql, /BINARY REFERENCED_COLUMN_NAME=BINARY 'id'/);
  assert.match(sql, /k\.REFERENCED_TABLE_SCHEMA=DATABASE\(\)/);
  assert.match(sql, /unknown_fk_rule_count=0/);
  const checked = sql.match(/BINARY k\.COLUMN_NAME IN \(([^)]*)\)/)[1];
  assert.equal(checked, "BINARY 'workflow_action',BINARY 'request_fingerprint',BINARY 'approval_target_stage_snapshot'");
  assert.doesNotMatch(checked, /revision_id/);
});

test('FK readiness classification fails closed for missing, changed, compound, conflicting or unknown metadata', () => {
  const sql = readPreflight();
  assert.match(sql, /expected_revision_fk_count<>1 OR revision_fk_column_count<>1\s+OR named_revision_fk_column_count<>1 OR incompatible_check_fk_count>0 THEN 'STOP'/);
  assert.match(sql, /WHEN check_column_fk_count=0 AND unknown_fk_rule_count=0 THEN 'PASS'\s+ELSE 'MANUAL_REVIEW_REQUIRED'/);
  const classify = ({ expected = 1, revisionParts = 1, namedParts = 1, incompatible = 0, checkParts = 0, unknown = 0 } = {}) => {
    if (expected !== 1 || revisionParts !== 1 || namedParts !== 1 || incompatible > 0) return 'STOP';
    return checkParts === 0 && unknown === 0 ? 'PASS' : 'MANUAL_REVIEW_REQUIRED';
  };
  assert.equal(classify(), 'PASS');
  for (const facts of [{ expected: 0 }, { revisionParts: 0 }, { revisionParts: 2 }, { namedParts: 2 }, { incompatible: 1 }]) {
    assert.equal(classify(facts), 'STOP');
  }
  for (const facts of [{ checkParts: 1 }, { unknown: 1 }]) assert.equal(classify(facts), 'MANUAL_REVIEW_REQUIRED');
});

test('Actual comment repository preserves Emergency NULL revision/target-stage and approval fingerprint NULL default', async () => {
  const { createLoader } = require('../helpers/approvalEmailLoader');
  const repo = createLoader(new Map([
    ['config/database.js', { pool: {} }], ['config/logger.js', { error() {} }],
  ])).load('repositories/document.repository.js');
  for (const action of ['Approval A', 'Approval B', 'Approval C', 'Emergency Workflow Attachment']) {
    const captured = [];
    await repo.insertWorkflowComment({ execute: async (sql, args) => { captured.push({ sql, args: Array.from(args) }); } }, {
      id: 'SYNTHETIC-C', projectId: 'SYNTHETIC-P', documentId: 'SYNTHETIC-D',
      revisionId: action === 'Emergency Workflow Attachment' ? null : 'SYNTHETIC-R',
      workflowAction: action, requestFingerprint: 'a'.repeat(64),
      createdByUsernameSnapshot: 'synthetic', approvalTargetStageSnapshot: 'IFA-Submitted',
    });
    assert.equal(captured.length, 1);
    const { sql, args } = captured[0];
    if (action === 'Emergency Workflow Attachment') {
      assert.equal(args[3], null);
      assert.match(sql, /, request_fingerprint/);
      assert.equal(args.at(-1), 'a'.repeat(64));
      assert.doesNotMatch(sql, /approval_target_stage_snapshot/);
    } else {
      assert.doesNotMatch(sql, /request_fingerprint/);
      assert.equal(args[3], 'SYNTHETIC-R');
    }
  }
  assert.match(readMigration('mysql'), /request_fingerprint VARCHAR\(64\) NULL DEFAULT NULL/);
});
test('All canonical schemas agree; new request fingerprint is only attached to Emergency actions', () => {
  const definitions = ['dev', 'staging', 'prod'].map(name => fs.readFileSync(path.join(root, `database/schema/schema-${name}.sql`), 'utf8')
    .match(/CREATE TABLE workflow_comments \([\s\S]*?\) ENGINE=InnoDB[^;]*;/)[0]);
  assert.equal(definitions[0], definitions[1]); assert.equal(definitions[0], definitions[2]);
  assert.match(definitions[0], /chk_workflow_comments_emergency_request/);
  assert.match(definitions[0], /AND request_fingerprint IS NULL/);
  assert.match(definitions[0], /CHAR_LENGTH\(request_fingerprint\) = 64/);
});
test('Emergency repository lock/read SQL references actual schema and has no document update', async () => {
  const repo = require('../../src/repositories/emergencyAttachment.repository');
  const queries = [];
  const connection = { execute: async (sql, args) => { queries.push([sql, args]); return [[]]; } };
  await repo.lockContext(connection, { documentId: 'D1', projectId: 'P1', actorUserId: 7 });
  await repo.findRequest(connection, 'id'); await repo.hasUnresolvedStorage(connection, { documentId: 'D1', projectId: 'P1', writerId: 'w' });
  assert.equal(queries.length, 5);
  assert.ok(queries.slice(0, 3).every(([sql]) => sql.includes('FOR UPDATE')));
  assert.ok(queries.every(([sql]) => /^\s*SELECT/.test(sql)));
  const schema = fs.readFileSync(path.join(root, 'database/schema/schema-dev.sql'), 'utf8') +
    fs.readFileSync(path.join(root, 'database/migration/20261102_0001_permanent_delete_foundation_mysql.sql'), 'utf8');
  for (const [sql] of queries) for (const table of sql.matchAll(/(?:FROM|JOIN)\s+([a-z_]+)/g)) assert.ok(schema.includes(`CREATE TABLE ${table[1]} (`), table[1]);
});
