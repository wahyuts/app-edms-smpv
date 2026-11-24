const assert = require('node:assert/strict');
const test = require('node:test');
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '../../../..');
const prefix = '20261024_0001_approval_a_comments';
const read = (file) => fs.readFileSync(path.join(root, file), 'utf8');

test('Canonical workflow comments preserve A/B/C, Emergency and approved response amendment', () => {
  const definitions = ['dev', 'staging', 'prod'].map((environment) =>
    read(`database/schema/schema-${environment}.sql`).match(/CREATE TABLE workflow_comments \([\s\S]*?\) ENGINE=InnoDB[^;]*;/)[0]);
  const common = definition => definition.replace(/^  --.*\r?\n/gm, '').replace(' AND revision_id IS NULL', '');
  assert.equal(common(definitions[0]), common(definitions[1])); assert.equal(common(definitions[0]), common(definitions[2]));
  for (const definition of definitions) assert.match(definition, /chk_workflow_comments_workflow_action CHECK \(workflow_action IN \('Approval A', 'Approval B', 'Approval C', 'Emergency Workflow Attachment', 'Response to Approval B'\)\)/);
  assert.match(definitions[0], /AND revision_id IS NULL/);
  for (const definition of definitions.slice(1)) assert.doesNotMatch(definition, /AND revision_id IS NULL/);
});

for (const [engine, syntax] of [['mysql', 'CHECK'], ['mariadb', 'CONSTRAINT']]) {
  test(`${engine} migration contains only one targeted ALTER and explicit execution gates`, () => {
    const content = read(`database/migration/${prefix}_${engine}.sql`);
    assert.match(content, /PREPARED ONLY - NOT EXECUTED/);
    const sql = content.replace(/^--.*$/gm, '').trim();
    assert.equal(sql.split(';').filter((statement) => statement.trim()).length, 1);
    assert.match(sql, new RegExp(`^ALTER TABLE workflow_comments\\s+DROP ${syntax} chk_workflow_comments_workflow_action,`));
    assert.match(sql, /ADD CONSTRAINT chk_workflow_comments_workflow_action\s+CHECK \(workflow_action IN \('Approval A', 'Approval B', 'Approval C'\)\)/);
    assert.doesNotMatch(sql, /\b(INSERT|UPDATE|DELETE|TRUNCATE|CREATE|MODIFY|RENAME)\b/);
  });
}

test('Preflight/verification are read-only with snapshot completeness and missing-snapshot guards', () => {
  for (const stage of ['preflight', 'verify']) {
    const sql = read(`database/migration/${prefix}_${stage}.sql`).replace(/^--.*$/gm, '');
    assert.doesNotMatch(sql, /(?:^|;)\s*(ALTER|INSERT|UPDATE|DELETE|CREATE|DROP|TRUNCATE)\b/i);
    assert.doesNotMatch(sql, /SET\s+(GLOBAL|SESSION)/i);
    assert.match(sql, /rows_complete/); assert.match(sql, /meta_complete/);
  }
  const verify = read(`database/migration/${prefix}_verify.sql`);
  assert.match(verify, /NOT VERIFIED - SNAPSHOT MISSING/);
  assert.match(verify, /MANUAL TARGET CHECK VERIFICATION REQUIRED/);
  assert.match(verify, /@aac_before_connection <> CONNECTION_ID\(\)/);
});
