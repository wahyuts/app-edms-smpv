const assert = require('node:assert/strict');
const test = require('node:test');
const fs = require('node:fs');
const path = require('node:path');
const plan = require('../helpers/slaC2bPlan.cjs');
const preparation = require('../helpers/slaIntegrationPreparation.cjs');

test('C2B: plan is offline, exact-targeted, and cannot enable the C2A mutation gate', () => {
  const result = plan.executionPlan();
  assert.equal(result.planId, 'C2B-PLAN-01');
  assert.equal(result.databaseExecutionEnabled, false);
  assert.equal(result.target.database, 'edms_sla_integration_test');
  assert.equal(result.schema.tableCount, 17);
  assert.deepEqual(result.technicalTables, ['edms_sla_test_ownership', 'edms_sla_test_ledger']);
  assert.equal(result.runnerDmlTables.includes('edms_sla_test_ownership'), false);
  assert.throws(() => preparation.assertMutationAuthorized({ target: result.target, operation: 'schema',
    runtimeEvidence: result }), { code: 'SLA_RUNTIME_VERIFICATION_REQUIRED' });
});

test('C2B: extracted definitions exactly preserve reviewed canonical table bodies and circular FKs', () => {
  const root = path.resolve(__dirname, '../../../..');
  const base = fs.readFileSync(path.join(root, plan.sources[0]), 'utf8').replace(/\r\n/g, '\n');
  const foundation = fs.readFileSync(path.join(root, plan.sources[1]), 'utf8').replace(/\r\n/g, '\n');
  const result = plan.prepareSchema();
  for (const name of plan.baseTables) assert.ok(result.sql.includes(plan.tableBlock(base, name)));
  for (const name of plan.foundationTables) assert.ok(result.sql.includes(plan.tableBlock(foundation, name)));
  assert.equal((result.sql.match(/^CREATE TABLE /gm) || []).length, 17);
  assert.equal((result.sql.match(/^ALTER TABLE /gm) || []).length, 1);
  assert.match(result.sql, /sla_started_at DATETIME\(3\) NOT NULL/);
  assert.match(result.sql, /uq_notifications_identity_key/);
  assert.match(result.sql, /uq_document_sla_evaluations_document_cycle/);
  assert.match(result.sql, /uq_audit_trail_identity_key/);
  assert.match(result.sql, /PERSISTENT/);
  assert.doesNotMatch(result.sql, /\b(?:CREATE DATABASE|USE edms|DROP|TRUNCATE|FOREIGN_KEY_CHECKS|GRANT|INSERT INTO|DELETE FROM)\b/);
  assert.equal(result.sources.length, 2);
  assert.match(result.sha256, /^[a-f0-9]{64}$/);
  assert.equal(result.sha256, plan.prepareSchema().sha256);
});

for (const change of [
  source => source.replace('CREATE TABLE users (', 'CREATE TABLE renamed_users ('),
  source => source.replace('sla_started_at DATETIME(3) NOT NULL', 'sla_started_at DATETIME(3) NULL'),
  source => source.replace('REFERENCES roles (id)', 'REFERENCES other.roles (id)'),
  source => source.replace('  username VARCHAR(255)', '  username VARCHAR(255); USE edms_db;\n  unexpected VARCHAR(255)'),
  source => source.replace('  full_name VARCHAR(255)', '  /* executable comments not accepted */ full_name VARCHAR(255)'),
  source => source.replace('fk_engineering_documents_active_file_id', 'changed_pointer'),
]) {
  test(`C2B: unexpected canonical format/cross-database drift rejected (${change.toString().slice(0, 68)})`, () => {
    assert.throws(() => plan.prepareSchema({ readFile: file => change(fs.readFileSync(file, 'utf8')) }),
      { code: 'C2B_CANONICAL_FORMAT_OR_DEPENDENCY_CHANGED' });
  });
}

test('C2B: no unnecessary cleanup/provenance or workflow tables are included', () => {
  const result = plan.prepareSchema();
  assert.doesNotMatch(result.sql, /CREATE TABLE (?:storage_namespaces|stored_file_namespace_bindings|workflow_comments|document_history|user_credentials|role_permissions) /);
  assert.ok(result.sql.indexOf('CREATE TABLE document_revisions ') < result.sql.indexOf('ALTER TABLE engineering_documents'));
});

test('C2B: review artifact exactly matches prepared bytes and the plan protects ownership marker writes', () => {
  const file = path.resolve(__dirname, '../integration/sla-c2b-schema.sql');
  assert.equal(fs.readFileSync(file, 'utf8'), plan.prepareSchema().sql);
  const review = fs.readFileSync(path.resolve(__dirname, '../integration/SLA-C2B-PROVISIONING-PLAN.md'), 'utf8');
  assert.ok(review.includes(plan.prepareSchema().sha256));
  assert.match(review, /AWAITING EXPLICIT OWNER APPROVAL/);
  assert.doesNotMatch(review, /GRANT INSERT, UPDATE, DELETE ON `edms_sla_integration_test`\.`edms_sla_test_ownership`/);
  for (const table of plan.dmlTables) assert.ok(review.includes(
    `GRANT INSERT, UPDATE, DELETE ON \`edms_sla_integration_test\`.\`${table}\` TO 'edms_sla_runner'@'127.0.0.1';`));
});
