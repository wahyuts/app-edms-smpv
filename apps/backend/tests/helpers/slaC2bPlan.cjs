const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const { validateOfflineTarget, proposedTarget } = require('./slaIntegrationPreparation.cjs');

const root = path.resolve(__dirname, '../../../..');
const baseTables = Object.freeze(['departments', 'roles', 'document_types', 'users', 'projects',
  'project_memberships', 'engineering_documents', 'stored_files', 'document_revisions',
  'document_sla_evaluations', 'notifications', 'audit_trail']);
const foundationTables = Object.freeze(['document_admission_coordinators', 'document_delete_operations',
  'document_writer_operations', 'document_storage_io_steps', 'document_delete_file_manifest']);
const dmlTables = Object.freeze(['roles', 'users', 'projects', 'project_memberships', 'engineering_documents',
  'document_sla_evaluations', 'notifications', 'audit_trail', 'document_admission_coordinators', 'edms_sla_test_ledger']);
const sources = Object.freeze(['database/schema/schema-dev.sql',
  'database/migration/20261102_0001_permanent_delete_foundation_mariadb.sql']);
const hash = source => crypto.createHash('sha256').update(source).digest('hex');
const stop = () => { throw Object.assign(new Error('C2B_CANONICAL_FORMAT_OR_DEPENDENCY_CHANGED'),
  { code: 'C2B_CANONICAL_FORMAT_OR_DEPENDENCY_CHANGED' }); };

// Narrow extraction of this repository's reviewed declaration format, not a general SQL parser.
const tableBlock = (source, name) => {
  const start = `CREATE TABLE ${name} (`;
  const starts = [...source.matchAll(new RegExp(`^CREATE TABLE ${name} \\(`, 'gm'))];
  if (starts.length !== 1) stop();
  const from = starts[0].index;
  const end = '\n) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;';
  const to = source.indexOf(end, from);
  if (to < 0) stop();
  const block = source.slice(from, to + end.length);
  if (!block.startsWith(start) || block.slice(0, -1).includes(';')
    || /--|\/\*|#|\b(?:USE|DATABASE|DROP|TRUNCATE|DELIMITER|FOREIGN_KEY_CHECKS|OUTFILE)\b/i.test(block)
    || (block.match(/\bCREATE\b/gi) || []).length !== 1) stop();
  const references = [...block.matchAll(/\bREFERENCES\s+([a-z_]+)\s*\(/g)].map(match => match[1]);
  if ((block.match(/\bREFERENCES\b/g) || []).length !== references.length
    || references.some(table => !baseTables.includes(table))) stop();
  return block;
};

const prepareSchema = ({ readFile = fs.readFileSync } = {}) => {
  const originals = sources.map(file => readFile(path.join(root, file), 'utf8'));
  const [base, foundation] = originals.map(source => source.replace(/\r\n/g, '\n'));
  const blocks = baseTables.map(name => tableBlock(base, name));
  if (!blocks.find(block => block.startsWith('CREATE TABLE engineering_documents '))
    .includes('sla_started_at DATETIME(3) NOT NULL')) stop();
  const pointer = 'ALTER TABLE engineering_documents\n'
    + '  ADD CONSTRAINT fk_engineering_documents_active_revision_id FOREIGN KEY (active_revision_id) REFERENCES document_revisions (id) ON UPDATE RESTRICT ON DELETE RESTRICT,\n'
    + '  ADD CONSTRAINT fk_engineering_documents_active_file_id FOREIGN KEY (active_file_id) REFERENCES stored_files (file_id) ON UPDATE RESTRICT ON DELETE RESTRICT;';
  if (base.split(pointer).length !== 2) stop();
  const sql = '-- C2B reviewed target-free schema. PREPARED ONLY; execute only after owner approval and runtime identity/ownership verification.\n'
    + '-- No database creation/selection, seed, or cleanup. Source definitions preserved; line endings normalized.\n\n'
    + [...blocks, pointer, ...foundationTables.map(name => tableBlock(foundation, name))].join('\n\n') + '\n';
  return { sql, sha256: hash(sql), tableCount: baseTables.length + foundationTables.length,
    sources: sources.map((file, index) => ({ file, sha256: hash(originals[index]) })) };
};

const executionPlan = () => {
  validateOfflineTarget(proposedTarget);
  const schema = prepareSchema();
  return { planId: 'C2B-PLAN-01', status: 'AWAITING_OWNER_APPROVAL', databaseExecutionEnabled: false,
    target: proposedTarget, schema: { file: 'apps/backend/tests/integration/sla-c2b-schema.sql',
      sha256: schema.sha256, tableCount: schema.tableCount, sources: schema.sources },
    technicalTables: ['edms_sla_test_ownership', 'edms_sla_test_ledger'],
    principals: { schema: 'edms_sla_schema@127.0.0.1', runner: 'edms_sla_runner@127.0.0.1' },
    schemaPrivileges: ['SELECT', 'CREATE', 'ALTER', 'INDEX', 'REFERENCES'],
    runnerDmlTables: dmlTables,
    runnerSelectScope: 'edms_sla_integration_test.*',
    sessionTimeZone: '+00:00', sqlModePolicy: 'PRESERVE_OBSERVED_MODE_REJECT_WRITE_WARNINGS',
    fixtureLimits: { officialRoles: 5, users: 5, projects: 2, memberships: 10, maximumDocuments: 1000 },
    excluded: ['cleanup migration 0002', 'storage IO', 'DDL fault injection', 'deadlock/timeout retry',
      'COMMIT ACK loss', 'process shutdown tests', 'Railway', 'R2'],
  };
};

if (require.main === module) {
  try {
    const args = process.argv.slice(2);
    if (args.length !== 1 || !['--plan', '--print-schema'].includes(args[0])) throw new Error('C2B_OFFLINE_PREPARATION_ONLY');
    process.stdout.write(args[0] === '--plan' ? JSON.stringify(executionPlan(), null, 2) + '\n' : prepareSchema().sql);
  } catch (error) { console.error(error.code || 'C2B_PREPARATION_FAILED'); process.exitCode = 1; }
}

module.exports = { baseTables, foundationTables, dmlTables, sources, tableBlock, prepareSchema, executionPlan };
