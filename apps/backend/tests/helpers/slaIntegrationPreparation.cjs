const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');

// Proposed intent only. These values do not assert that a database/server exists.
const proposedTarget = Object.freeze({
  host: '127.0.0.1', port: 3306, database: 'edms_sla_integration_test',
  expectedEngine: 'MariaDB', expectedVersion: '10.4.32', intent: 'sla-integration-preparation',
});
const runtimeRequirements = Object.freeze([
  'serverIdentity', 'databaseIdentity', 'ownership', 'engineVersion', 'privileges', 'operationApproval',
]);
const fail = (code) => { throw Object.assign(new Error(code), { code }); };

const validateOfflineTarget = (target) => {
  if (!target || typeof target !== 'object' || Array.isArray(target)) fail('SLA_TEST_TARGET_REQUIRED');
  if (Object.keys(target).some(key => !Object.hasOwn(proposedTarget, key))) fail('SLA_TEST_UNEXPECTED_CONFIG');
  for (const [key, expected] of Object.entries(proposedTarget)) {
    if (target[key] !== expected) fail(`SLA_TEST_INVALID_${key.toUpperCase()}`);
  }
  return Object.freeze({ ...proposedTarget, validation: 'OFFLINE_ONLY', runtimeVerified: false });
};

const assertMutationAuthorized = ({ target, runtimeEvidence = {}, operation } = {}) => {
  validateOfflineTarget(target);
  if (!['provision', 'schema', 'fixtures', 'cleanup', 'contention', 'fault-injection'].includes(operation)) {
    fail('SLA_TEST_OPERATION_NOT_APPROVED');
  }
  // No live verifier or capability issuer exists in C2A. Caller JSON can never grant authority.
  const missingChecks = runtimeRequirements.filter(key => !runtimeEvidence?.[key]);
  throw Object.assign(new Error('SLA_RUNTIME_VERIFICATION_REQUIRED'), {
    code: 'SLA_RUNTIME_VERIFICATION_REQUIRED', missingChecks,
    runtimeVerified: false, mutationAuthorized: false,
  });
};

// Diagnostic rejection, NOT an SQL parser or an execution allowlist. All batches stay blocked.
const reviewSchemaApplication = (source) => {
  if (typeof source !== 'string' || !source.trim()) fail('SLA_TEST_SCHEMA_SOURCE_REQUIRED');
  const checks = [
    ['CREATE DATABASE', /\bCREATE\s+DATABASE\b/i], ['USE', /\bUSE\s+/i],
    ['DROP', /\bDROP\b/i], ['TRUNCATE', /\bTRUNCATE\b/i],
    ['FOREIGN_KEY_CHECKS', /\bFOREIGN_KEY_CHECKS\b/i], ['SET GLOBAL', /\bSET\s+(?:@@)?GLOBAL\b/i],
    ['ALTER DATABASE', /\bALTER\s+DATABASE\b/i], ['LOAD DATA', /\bLOAD\s+DATA\b/i],
    ['OUTFILE', /\bOUTFILE\b/i], ['SOURCE', /\bSOURCE\s+/i], ['DELIMITER', /\bDELIMITER\b/i],
  ];
  const unsafeDirectives = checks.filter(([, pattern]) => pattern.test(source)).map(([label]) => label);
  return { applicationAllowed: false, unsafeDirectives,
    reason: unsafeDirectives.length ? 'UNSAFE_SCHEMA_DIRECTIVE' : 'SCHEMA_EXECUTOR_NOT_IMPLEMENTED' };
};

const schemaSources = Object.freeze([
  { file: 'database/schema/schema-dev.sql', tables: [
    'departments', 'roles', 'permissions', 'document_types', 'users', 'role_permissions', 'user_credentials',
    'password_reset_tokens', 'refresh_sessions', 'temporary_uploads', 'projects', 'project_memberships',
    'user_project_preferences', 'engineering_documents', 'stored_files', 'document_revisions', 'workflow_comments',
    'workflow_attachments', 'document_history', 'comment_read_receipts', 'document_sla_evaluations',
    'notifications', 'audit_trail', 'system_metadata',
  ] },
  { file: 'database/migration/20261102_0001_permanent_delete_foundation_mariadb.sql', tables: [
    'document_admission_coordinators', 'document_delete_operations', 'document_writer_operations',
    'document_storage_io_steps', 'document_delete_file_manifest',
  ] },
  { file: 'database/migration/20261102_0002_permanent_delete_cleanup_mariadb.sql', tables: [
    'storage_namespaces', 'stored_file_namespace_bindings', 'document_delete_executions', 'document_delete_attempts',
  ] },
].map(item => Object.freeze({ ...item, tables: Object.freeze(item.tables) })));

const buildSchemaInventory = ({ readFile = fs.readFileSync } = {}) => {
  const root = path.resolve(__dirname, '../../../..');
  return schemaSources.map(({ file, tables }, order) => {
    const source = readFile(path.join(root, file), 'utf8');
    // Declaration discovery detects inventory drift only; it never extracts executable DDL.
    const found = [...source.matchAll(/^CREATE TABLE ([a-z_]+)\s*\(/gm)].map(match => match[1]);
    if (JSON.stringify(found) !== JSON.stringify(tables)) fail('SLA_TEST_SCHEMA_INVENTORY_DRIFT');
    if (order === 0 && !/sla_started_at DATETIME\(3\) NOT NULL/.test(source)) fail('SLA_TEST_BASELINE_CONSTRAINT_DRIFT');
    return { order: order + 1, file, sha256: crypto.createHash('sha256').update(source).digest('hex'),
      tables: [...tables], ...reviewSchemaApplication(source) };
  });
};

const officialRoles = Object.freeze(['Admin', 'Document Owner', 'Team Process', 'Team Project', 'Viewer']);
const buildFixturePlan = (runId, documentCount = 500) => {
  if (typeof runId !== 'string' || !/^[a-z0-9]{8,16}$/.test(runId)) fail('SLA_TEST_INVALID_RUN_ID');
  if (!Number.isInteger(documentCount) || documentCount < 1 || documentCount > 1000) fail('SLA_TEST_INVALID_FIXTURE_COUNT');
  const prefix = `SLA-${runId}`;
  const users = officialRoles.map((role, index) => ({ key: `${prefix}-U${index + 1}`,
    fullName: `Synthetic SLA ${role}`, officialRole: role }));
  const projects = [1, 2].map(index => ({ id: `${prefix}-P${index}`, status: 'Active' }));
  const memberships = projects.flatMap(project => users.map((user, index) => ({
    id: `${project.id}-M${index + 1}`, projectId: project.id, userKey: user.key,
    officialRole: user.officialRole, status: 'Active',
  })));
  const documents = Array.from({ length: documentCount }, (_, index) => ({
    id: `${prefix}-D${String(index + 1).padStart(4, '0')}`, projectId: projects[index % 2].id,
    createdByUserKey: users[0].key, currentAssigneeUserKey: users[2].key,
    workflowStatus: 'Process Review', lifecycleStatus: 'Active',
    baselineSource: 'FUTURE_VERIFIED_DATABASE_UTC_TIME', activeFileId: null, activeRevisionId: null,
  }));
  return { runId, executionAllowed: false, users, projects, memberships, documents,
    excludedNotificationRoles: ['Viewer'],
    creationOrder: ['reference_roles', 'users', 'projects', 'project_memberships', 'engineering_documents',
      'optional_stored_files_and_revisions', 'optional_active_pointers', 'evaluation_notification_audit'],
    cleanupPolicy: 'EXACT_LEDGER_IDS_ONLY_AFTER_TASK_SETTLEMENT_AND_NEW_APPROVAL',
    numericUserIds: 'Capture actual insertId only after fixture execution is separately approved',
    unresolvedOutcomePolicy: 'STOP_AND_PRESERVE_EVIDENCE_NO_AUTOMATIC_CLEANUP',
  };
};

const connectionOwners = new WeakMap();
const wrapOwnedConnection = (connection, runId) => {
  if (typeof runId !== 'string' || !/^[a-z0-9]{8,16}$/.test(runId)) fail('SLA_TEST_INVALID_RUN_ID');
  const methods = ['beginTransaction', 'commit', 'rollback', 'query', 'execute', 'release', 'destroy'];
  if (!connection || methods.some(name => typeof connection[name] !== 'function')) fail('SLA_TEST_CONNECTION_CONTRACT');
  if (connectionOwners.has(connection)) fail('SLA_TEST_CONNECTION_ALREADY_OWNED');
  let disposed = false;
  connectionOwners.set(connection, runId);
  return Object.freeze(Object.fromEntries(methods.map(name => [name, (...args) => {
    const cleanup = name === 'release' || name === 'destroy';
    if (disposed) {
      if (cleanup) return;
      fail('SLA_TEST_CONNECTION_DISPOSED');
    }
    // Preserve mysql2 receiver, original promises/errors, and synchronous disposal behavior.
    const result = connection[name](...args);
    if (cleanup) disposed = true;
    return result;
  }])));
};

module.exports = { proposedTarget, runtimeRequirements, validateOfflineTarget, assertMutationAuthorized,
  reviewSchemaApplication, schemaSources, buildSchemaInventory, officialRoles, buildFixturePlan, wrapOwnedConnection };
