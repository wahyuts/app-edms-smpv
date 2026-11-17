const assert = require('node:assert/strict');
const test = require('node:test');
const fs = require('node:fs');
const path = require('node:path');
const { createLoader } = require('../helpers/approvalEmailLoader');
const root = path.resolve(__dirname, '../../../..');
const migration = fs.readFileSync(path.join(root, 'database/migration/20261117_0001_approval_a_history_snapshots.sql'), 'utf8');
const columns = ['created_by_username_snapshot', 'approval_target_stage_snapshot'];

test('migration is one additive ALTER, no database selection/backfill or new dependencies', () => {
  const sql = migration.replace(/^--.*$/gm, '').trim();
  assert.equal(sql.split(';').filter(s => s.trim()).length, 1);
  assert.match(sql, /^ALTER TABLE workflow_comments/);
  assert.equal((sql.match(/ADD COLUMN/g) || []).length, 2);
  assert.equal((sql.match(/ADD CONSTRAINT/g) || []).length, 1);
  assert.doesNotMatch(sql, /\b(?:USE|CREATE|DROP|INSERT|UPDATE|DELETE|REPLACE|TRUNCATE|MODIFY)\b/);
  assert.match(sql, /VARCHAR\(255\) NULL DEFAULT NULL/);
  assert.match(sql, /VARCHAR\(64\) NULL DEFAULT NULL/);
  assert.match(sql, /approval_target_stage_snapshot IS NULL OR\s*\(workflow_action = 'Approval A' AND approval_target_stage_snapshot IN \('IFA-Submitted', 'AS-Built'\)\)/);
});
for (const env of ['dev', 'staging', 'prod']) test(`canonical ${env} matches the manual event migration and keeps existing role/FKs`, () => {
  const schema = fs.readFileSync(path.join(root, `database/schema/schema-${env}.sql`), 'utf8');
  const table = schema.match(/CREATE TABLE workflow_comments \([\s\S]*?\) ENGINE=InnoDB/)[0];
  for (const column of columns) {
    const definition = migration.match(new RegExp(`ADD COLUMN (${column} VARCHAR\\(\\d+\\) NULL DEFAULT NULL)`))[1];
    assert.ok(table.includes(definition));
  }
  const normalize = s => s.replace(/\s+/g, ' ').trim();
  const check = migration.match(/CHECK \([\s\S]*?\);/)[0].slice(0, -1);
  assert.ok(normalize(table).includes(normalize(check)));
  assert.match(table, /created_by_official_role_snapshot IN \('Admin', 'Document Owner', 'Team Process', 'Team Project', 'Viewer'\)/);
  assert.match(table, /REFERENCES document_revisions \(id\) ON UPDATE RESTRICT ON DELETE SET NULL/);
  assert.match(table, /PRIMARY KEY \(id\)/);
});
for (const action of ['Approval B', 'Approval C']) test(`${action} SQL and values stay unchanged without Approval A snapshots`, async () => {
  const repo = createLoader(new Map([['config/database.js', { pool: {} }], ['config/logger.js', {}]])).load('repositories/document.repository.js');
  let captured;
  await repo.insertWorkflowComment({ async execute(sql, values) { captured = { sql, values }; } }, {
    id: 'WFC', projectId: 'P', documentId: 'D', revisionId: 'R', workflowAction: action,
    workflowComment: 'manual', createdByUserId: 1, createdByNameSnapshot: 'Reviewer', createdByOfficialRoleSnapshot: 'Team Process',
  });
  assert.equal(captured.values.length, 9);
  assert.doesNotMatch(captured.sql, /created_by_username_snapshot|approval_target_stage_snapshot/);
  assert.match(captured.sql, /VALUES \(\?, \?, \?, \?, \?, \?, \?, \?, \?, UTC_TIMESTAMP\(3\)\)/);
});
test('event metadata reuses an already-inventoried and cleaned Permanent Delete dependency', () => {
  const source = fs.readFileSync(path.join(root, 'apps/backend/src/repositories/documentDelete.repository.js'), 'utf8');
  assert.match(source, /const known = new Set\(\['engineering_documents','stored_files','document_revisions','workflow_comments'/);
  assert.match(source, /'comment_read_receipts','workflow_attachments','workflow_comments','document_history'/);
  assert.match(source, /SELECT \* FROM \$\{table\} WHERE document_id=\?/);
  assert.match(source, /DELETE FROM \$\{table\} WHERE document_id=\? AND project_id=\?/);
});
