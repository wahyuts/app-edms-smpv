const fs = require('node:fs/promises');
const path = require('node:path');
const { parseArgs } = require('node:util');
const { digest, r2Namespace } = require('../src/utils/storageNamespace');
const { assertNamespace } = require('../src/services/fileProvenance.service');
const { validateStorageKey } = require('../src/validators/storage.validator');
const { deriveFolderTargets } = require('../src/utils/documentFolder');
const { createRepository } = require('../src/repositories/documentDelete.repository');
const { reportDigest } = require('../src/services/legacyFileReconciliation.service');

// Offline only: no mysql/AWS clients, env loading, pool, server or storage initialization.
const ENVIRONMENTS = ['development', 'staging', 'production'];
const SPECS = {
  document_admission_coordinators: ['project_id', 'document_id', 'gate_state', 'generation', 'delete_operation_id'],
  engineering_documents: ['id', 'project_id', 'document_number', 'active_file_id', 'active_revision_id'],
  stored_files: ['file_id', 'project_id', 'document_id', 'storage_key', 'relative_path', 'file_size', 'checksum'],
  document_revisions: ['id', 'project_id', 'document_id', 'file_id', 'storage_path_legacy'],
  workflow_comments: ['id', 'project_id', 'document_id', 'revision_id'],
  workflow_attachments: ['attachment_id', 'project_id', 'document_id', 'comment_id', 'file_id'],
  comment_read_receipts: ['id', 'project_id', 'document_id', 'comment_id'],
  document_history: ['id', 'project_id', 'document_id'],
  document_sla_evaluations: ['id', 'project_id', 'document_id'],
  storage_namespaces: ['id', 'provider', 'descriptor'],
  stored_file_namespace_bindings: ['file_id', 'namespace_id', 'storage_key_snapshot', 'evidence'],
  document_delete_operations: ['id', 'project_id', 'document_id', 'status'],
  document_delete_executions: ['operation_id', 'phase'],
  document_delete_file_manifest: ['id', 'delete_operation_id', 'file_reference', 'ownership_evidence'],
  document_delete_attempts: ['manifest_id', 'state'],
  document_writer_operations: ['id', 'project_id', 'document_id', 'lifecycle_state', 'db_outcome', 'completion_evidence', 'temporary_file_id'],
  document_storage_io_steps: ['id', 'writer_id', 'state'],
  temporary_uploads: ['id', 'temporary_file_id'],
  projects: ['id', 'project_code', 'status'],
  project_memberships: ['id', 'project_id', 'user_id', 'official_role', 'status'],
  users: ['id', 'status', 'full_name', 'department_name_snapshot'],
};
const PK = { document_admission_coordinators: ['project_id', 'document_id'],
  stored_files: ['file_id'], stored_file_namespace_bindings: ['file_id'],
  workflow_attachments: ['attachment_id'], document_delete_executions: ['operation_id'], document_delete_attempts: ['manifest_id'] };
const fail = (code) => { throw Object.assign(new Error(code), { code }); };
const ensure = (condition, code) => { if (!condition) fail(code); };
const encode = (value) => value === null ? 'NULL' : `CONVERT(X'${Buffer.from(String(value), 'utf8').toString('hex')}' USING utf8mb4)`;
const same = (a, b) => JSON.stringify(a) === JSON.stringify(b);
const sha = (value) => /^[a-f0-9]{64}$/.test(value || '');
const tableNames = Object.keys(SPECS);
const engineTableNames = [...tableNames, 'audit_trail'];
const rowExpression = (table) => `JSON_OBJECT(${SPECS[table].map(c => `${encode(c)},\`${c}\``).join(',')})`;
const rowHashExpression = (table) => `SHA2(CAST(${rowExpression(table)} AS CHAR CHARACTER SET utf8mb4),256)`;
const seal = ({ approvalDigest, ...value }) => digest(JSON.stringify(value));
const dateMs = value => { const result = Date.parse(value); ensure(Number.isFinite(result), 'INVALID_EVIDENCE_TIMESTAMP'); return result; };
const noSecrets = value => {
  if (!value || typeof value !== 'object') return;
  for (const [key, child] of Object.entries(value)) {
    ensure(!/password|secret|token|credential|access.?key/i.test(key), 'CREDENTIAL_FIELD_NOT_ALLOWED');
    noSecrets(child);
  }
};

const profileFor = (config, environment) => {
  ensure(config?.version === 1 && ENVIRONMENTS.includes(environment), 'ENVIRONMENT_REQUIRED');
  noSecrets(config);
  const seenTargets = new Set(); const seenNamespaces = new Set();
  for (const [name, profile] of Object.entries(config.profiles || {})) {
    ensure(ENVIRONMENTS.includes(name), 'UNKNOWN_ENVIRONMENT');
    if (!profile) continue;
    const db = profile.database;
    ensure(db && /^[A-Za-z0-9_]+$/.test(db.name || '') && /^[a-f0-9]{8}(?:-[a-f0-9]{4}){3}-[a-f0-9]{12}$/i.test(db.serverUuid || '')
      && typeof db.hostname === 'string' && db.hostname.length > 0 && Number.isInteger(db.port)
      && db.port > 0 && db.port <= 65535 && /^\d+\.\d+\./.test(db.versionPrefix || ''), 'DATABASE_IDENTITY_REQUIRED');
    const ns = r2Namespace(profile.r2 || {}); assertNamespace(ns);
    const target = `${db.serverUuid}:${db.name}`;
    ensure(!seenTargets.has(target) && !seenNamespaces.has(ns.id), 'CROSS_ENVIRONMENT_TARGET_OR_NAMESPACE');
    seenTargets.add(target); seenNamespaces.add(ns.id);
  }
  const profile = config.profiles?.[environment]; ensure(profile, 'ENVIRONMENT_NOT_CONFIGURED');
  const namespace = r2Namespace(profile.r2);
  const target = { environment, database: profile.database, namespaceId: namespace.id };
  return { ...profile, environment, namespace, targetDigest: digest(JSON.stringify(target)),
    maxRows: profile.maxRows ?? 10000, maxAgeMinutes: profile.maxAgeMinutes ?? 60 };
};
const identityPredicate = p => `CAST(DATABASE() AS BINARY)=CAST(${encode(p.database.name)} AS BINARY)
  AND CAST(@@server_uuid AS BINARY)=CAST(${encode(p.database.serverUuid)} AS BINARY)
  AND CAST(@@hostname AS BINARY)=CAST(${encode(p.database.hostname)} AS BINARY) AND @@port=${Number(p.database.port)}
  AND VERSION() LIKE ${encode(p.database.versionPrefix + '%')} AND VERSION() NOT LIKE '%MariaDB%'`;
const privilegePredicate = privilege => `EXISTS(SELECT 1 FROM information_schema.USER_PRIVILEGES WHERE PRIVILEGE_TYPE=${encode(privilege)}
  AND GRANTEE=CONCAT(CHAR(39),SUBSTRING_INDEX(CURRENT_USER(),'@',1),CHAR(39),'@',CHAR(39),SUBSTRING_INDEX(CURRENT_USER(),'@',-1),CHAR(39)))
  OR EXISTS(SELECT 1 FROM information_schema.SCHEMA_PRIVILEGES WHERE TABLE_SCHEMA=DATABASE() AND PRIVILEGE_TYPE=${encode(privilege)}
  AND GRANTEE=CONCAT(CHAR(39),SUBSTRING_INDEX(CURRENT_USER(),'@',1),CHAR(39),'@',CHAR(39),SUBSTRING_INDEX(CURRENT_USER(),'@',-1),CHAR(39)))`;

const preflightSql = p => {
  const tables = tableNames.map(t => `${encode(t)},COALESCE((SELECT JSON_ARRAYAGG(JSON_OBJECT(
    'raw',CAST(${rowExpression(t)} AS CHAR CHARACTER SET utf8mb4),'hash',${rowHashExpression(t)})) FROM \`${t}\`),JSON_ARRAY())`);
  return `-- READ ONLY. Verify the selected ${p.environment} connection against the owner-approved profile.
-- First result MUST be PASS. Export the SINGLE snapshot_json cell as UTF-8 JSON
-- (not CSV, not a DBeaver wrapper array); preserve raw/hash strings exactly.
-- Snapshot is sensitive local evidence, not a backup. No R2 IO is performed.
SELECT IF(${identityPredicate(p)},'PASS','STOP - TARGET MISMATCH') AS target,
  ${encode(p.targetDigest)} AS target_digest, DATABASE() AS database_name,@@server_uuid AS server_uuid,
  @@hostname AS hostname,@@port AS port,VERSION() AS version;
SELECT JSON_OBJECT('version',1,'environment',${encode(p.environment)},'targetDigest',${encode(p.targetDigest)},
  'capturedAt',DATE_FORMAT(UTC_TIMESTAMP(3),'%Y-%m-%dT%H:%i:%s.%fZ'),
  'identity',JSON_OBJECT('name',DATABASE(),'serverUuid',@@server_uuid,'hostname',@@hostname,'port',@@port,'version',VERSION()),
  'engines',COALESCE((SELECT JSON_ARRAYAGG(JSON_OBJECT('table',TABLE_NAME,'engine',ENGINE))
    FROM information_schema.TABLES WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME IN (${engineTableNames.map(encode).join(',')})),JSON_ARRAY()),
  'foreignKeys',COALESCE((SELECT JSON_ARRAYAGG(JSON_OBJECT('TABLE_NAME',TABLE_NAME,'REFERENCED_TABLE_NAME',REFERENCED_TABLE_NAME))
    FROM information_schema.KEY_COLUMN_USAGE WHERE TABLE_SCHEMA=DATABASE() AND REFERENCED_TABLE_NAME IS NOT NULL),JSON_ARRAY()),
  'documentTables',COALESCE((SELECT JSON_ARRAYAGG(JSON_OBJECT('TABLE_NAME',TABLE_NAME))
    FROM information_schema.COLUMNS WHERE TABLE_SCHEMA=DATABASE() AND COLUMN_NAME='document_id'),JSON_ARRAY()),
  'metadataVisible',EXISTS(SELECT 1 FROM information_schema.USER_PRIVILEGES WHERE PRIVILEGE_TYPE='SELECT'
    AND GRANTEE=CONCAT(CHAR(39),SUBSTRING_INDEX(CURRENT_USER(),'@',1),CHAR(39),'@',CHAR(39),SUBSTRING_INDEX(CURRENT_USER(),'@',-1),CHAR(39)))
    OR EXISTS(SELECT 1 FROM information_schema.SCHEMA_PRIVILEGES WHERE TABLE_SCHEMA=DATABASE() AND PRIVILEGE_TYPE='SELECT'
    AND GRANTEE=CONCAT(CHAR(39),SUBSTRING_INDEX(CURRENT_USER(),'@',1),CHAR(39),'@',CHAR(39),SUBSTRING_INDEX(CURRENT_USER(),'@',-1),CHAR(39))),
  'triggerMetadataVisible',EXISTS(SELECT 1 FROM information_schema.USER_PRIVILEGES WHERE PRIVILEGE_TYPE='TRIGGER'
    AND GRANTEE=CONCAT(CHAR(39),SUBSTRING_INDEX(CURRENT_USER(),'@',1),CHAR(39),'@',CHAR(39),SUBSTRING_INDEX(CURRENT_USER(),'@',-1),CHAR(39)))
    OR EXISTS(SELECT 1 FROM information_schema.SCHEMA_PRIVILEGES WHERE TABLE_SCHEMA=DATABASE() AND PRIVILEGE_TYPE='TRIGGER'
    AND GRANTEE=CONCAT(CHAR(39),SUBSTRING_INDEX(CURRENT_USER(),'@',1),CHAR(39),'@',CHAR(39),SUBSTRING_INDEX(CURRENT_USER(),'@',-1),CHAR(39))),
  'writeTriggers',COALESCE((SELECT JSON_ARRAYAGG(TRIGGER_NAME) FROM information_schema.TRIGGERS
    WHERE TRIGGER_SCHEMA=DATABASE() AND EVENT_OBJECT_TABLE IN ('storage_namespaces','stored_file_namespace_bindings','audit_trail')),JSON_ARRAY()),
  'tables',JSON_OBJECT(${tables.join(',\n')})) AS snapshot_json;
`;
};

const readSnapshot = (snapshot, p) => {
  ensure(snapshot?.version === 1 && snapshot.environment === p.environment
    && snapshot.targetDigest === p.targetDigest && [1, true].includes(snapshot.metadataVisible), 'SNAPSHOT_TARGET_OR_VISIBILITY');
  ensure([1, true].includes(snapshot.triggerMetadataVisible) && Array.isArray(snapshot.writeTriggers)
    && snapshot.writeTriggers.length === 0, 'WRITE_TRIGGER_VISIBILITY_OR_UNREVIEWED_TRIGGER');
  const i = snapshot.identity;
  ensure(i && i.name === p.database.name && i.serverUuid === p.database.serverUuid
    && i.hostname === p.database.hostname && Number(i.port) === p.database.port
    && i.version.startsWith(p.database.versionPrefix) && !i.version.includes('MariaDB'), 'SNAPSHOT_IDENTITY_MISMATCH');
  const [major, minor, patch] = i.version.split('.').map(Number.parseFloat);
  ensure(major > 8 || (major === 8 && (minor > 0 || patch >= 16)), 'MYSQL_CHECK_ENFORCEMENT_REQUIRED');
  ensure(Number.isInteger(p.maxRows) && p.maxRows > 0 && p.maxRows <= 100000, 'INVALID_SNAPSHOT_LIMIT');
  const auditEngine = snapshot.engines?.filter(e => e.table === 'audit_trail');
  ensure(auditEngine?.length === 1 && auditEngine[0].engine === 'InnoDB', 'TRANSACTIONAL_AUDIT_TRAIL_REQUIRED');
  const tables = {}; let count = 0;
  for (const table of tableNames) {
    const engine = snapshot.engines?.filter(e => e.table === table);
    ensure(engine?.length === 1 && engine[0].engine === 'InnoDB', 'INNODB_TABLE_REQUIRED');
    const entries = snapshot.tables?.[table]; ensure(Array.isArray(entries), 'SNAPSHOT_TABLE_MISSING');
    const identities = new Set();
    tables[table] = entries.map(entry => {
      ensure(typeof entry.raw === 'string' && sha(entry.hash) && digest(entry.raw) === entry.hash, 'SNAPSHOT_ROW_DIGEST');
      const row = JSON.parse(entry.raw);
      ensure(Object.keys(row).length === SPECS[table].length && SPECS[table].every(c => Object.hasOwn(row, c)), 'SNAPSHOT_COLUMNS_CHANGED');
      for (const v of Object.values(row)) ensure(typeof v !== 'number' || Number.isSafeInteger(v), 'UNSAFE_NUMERIC_METADATA');
      const key = JSON.stringify((PK[table] || ['id']).map(c => row[c]));
      ensure(!identities.has(key), 'DUPLICATE_SNAPSHOT_IDENTITY'); identities.add(key);
      count++; return row;
    });
  }
  ensure(count <= p.maxRows, 'SNAPSHOT_TOO_LARGE_REVIEW_MAINTENANCE_CAPACITY');
  ensure(tables.stored_file_namespace_bindings.every(b => tables.stored_files.some(f => f.file_id === b.file_id)
    && tables.storage_namespaces.some(n => n.id === b.namespace_id)), 'ORPHAN_BINDING_METADATA_REQUIRES_REVIEW');
  ensure(Array.isArray(snapshot.foreignKeys) && Array.isArray(snapshot.documentTables), 'DEPENDENCY_METADATA_REQUIRED');
  return tables;
};

// Narrow read-only adapter for the authoritative inventory. Unknown future query
// shapes fail closed instead of being approximated by a second ownership engine.
const snapshotConnection = (snapshot, tables) => ({ execute: async (sql, args = []) => {
  const q = sql.replace(/\s+/g, ' ').trim();
  ensure(/^SELECT\b/.test(q), 'OFFLINE_INVENTORY_WRITE_REJECTED');
  if (q.includes('information_schema.KEY_COLUMN_USAGE')) return [snapshot.foreignKeys.filter(r =>
    ['engineering_documents','stored_files','document_revisions','workflow_comments','workflow_attachments','document_history','comment_read_receipts','document_sla_evaluations'].includes(r.REFERENCED_TABLE_NAME))];
  if (q.includes('information_schema.COLUMNS')) return [snapshot.documentTables];
  if (q.startsWith('SELECT t.id FROM temporary_uploads')) return [tables.temporary_uploads.filter(t =>
    tables.document_writer_operations.some(w => w.temporary_file_id === t.temporary_file_id && w.project_id === args[0] && w.document_id === args[1]))];
  if (q.startsWith('SELECT file_id,storage_key FROM stored_files')) return [tables.stored_files];
  if (q.startsWith('SELECT * FROM notifications WHERE')) return [[]];
  const match = q.match(/^SELECT \* FROM ([a-z_]+) WHERE ([a-z_]+)(?:\s*=\s*\?| IN \((?:\?,?)+\))(.*)$/);
  ensure(match && tables[match[1]] && SPECS[match[1]].includes(match[2]), 'OFFLINE_INVENTORY_QUERY_CHANGED');
  const [, table, column, tail] = match;
  let result = tables[table].filter(row => q.includes(' IN (') ? args.includes(row[column]) : row[column] === args[0]);
  if (tail.includes('AND project_id=?')) result = result.filter(row => row.project_id === args[1]);
  if (tail.includes('ORDER BY')) {
    const order = tail.match(/ORDER BY ([a-z_]+)/)?.[1]; ensure(SPECS[table].includes(order), 'OFFLINE_ORDER_CHANGED');
    result = [...result].sort((a, b) => String(a[order]).localeCompare(String(b[order])));
  }
  ensure(/^(?: AND project_id=\?)?(?: ORDER BY [a-z_]+)?$/.test(tail), 'OFFLINE_QUERY_TAIL_CHANGED');
  return [result];
} });

const evidenceFor = (evidence, p, now) => {
  ensure(evidence?.version === 1 && evidence.source === 'OWNER_REVIEWED_STORAGE_INVENTORY'
    && evidence.environment === p.environment && evidence.targetDigest === p.targetDigest
    && evidence.runtimeNamespaceVerified === true && evidence.storageWritersStopped === true,
  'OWNER_VERIFIED_STORAGE_EVIDENCE_REQUIRED');
  assertNamespace(evidence.namespace);
  ensure(evidence.namespace.id === p.namespace.id && evidence.namespace.encoded === p.namespace.encoded, 'EVIDENCE_NAMESPACE_MISMATCH');
  const observed = dateMs(evidence.inspectedAt);
  ensure(observed <= now && now - observed <= p.maxAgeMinutes * 60000, 'STORAGE_EVIDENCE_EXPIRED');
  // Consume the actual existing inspector artifact, not a list inferred from SQL.
  // Its digest proves integrity, not authenticity; owner review remains mandatory.
  const report = evidence.inspectionReport;
  ensure(report?.version === 1 && report.mode === 'DRY_RUN' && sha(report.approvalDigest)
    && reportDigest(report) === report.approvalDigest && report.databaseEvidence?.unchanged === true
    && sha(report.databaseEvidence.before?.digest)
    && report.databaseEvidence.before.digest === report.databaseEvidence.after?.digest
    && report.target?.environment === p.environment && report.target.name === p.database.name
    && report.target.hostname === p.database.hostname && Number(report.target.port) === p.database.port
    && report.target.version?.startsWith(p.database.versionPrefix)
    && report.namespaces?.length === 1 && report.namespaces[0].id === p.namespace.id
    && report.namespaces[0].encoded === p.namespace.encoded && Array.isArray(report.files),
  'EXISTING_READONLY_INSPECTION_REPORT_REQUIRED');
  const files = new Map();
  for (const record of report.files.filter(f => f.status === 'VERIFIED')) {
    const file = { fileId: record.fileId, projectId: record.projectId, documentId: record.documentId,
      storageKey: record.storageKey, sha256: record.proof?.sha256, size: record.proof?.size, namespaceId: record.namespace?.id };
    ensure(record.namespace?.encoded === p.namespace.encoded
      && file.fileId && !files.has(file.fileId) && file.namespaceId === p.namespace.id
      && sha(file.sha256) && Number.isSafeInteger(file.size) && file.size >= 0, 'INVALID_STORAGE_PROOF');
    ensure(validateStorageKey(file.storageKey) === file.storageKey, 'NONCANONICAL_STORAGE_PROOF');
    files.set(file.fileId, file);
  }
  return files;
};

const buildPlan = async ({ config, environment, snapshot, evidence, now = Date.now() }) => {
  const p = profileFor(config, environment); const tables = readSnapshot(snapshot, p);
  const registered = tables.storage_namespaces.find(n => n.id === p.namespace.id);
  ensure(!registered || (registered.provider === 'r2' && registered.descriptor === p.namespace.encoded
    && digest(registered.descriptor) === registered.id), 'REGISTERED_NAMESPACE_CONFLICT');
  const captured = dateMs(snapshot.capturedAt);
  ensure(Number.isFinite(p.maxAgeMinutes) && p.maxAgeMinutes > 0 && p.maxAgeMinutes <= 60
    && captured <= now && now - captured <= p.maxAgeMinutes * 60000, 'SNAPSHOT_EXPIRED');
  const proof = evidence ? evidenceFor(evidence, p, now) : new Map();
  const repository = createRepository({}); const c = snapshotConnection(snapshot, tables);
  const files = []; const groups = new Map();
  for (const file of tables.stored_files) {
    const key = JSON.stringify([file.project_id, file.document_id]);
    if (!groups.has(key)) groups.set(key, []); groups.get(key).push(file);
  }
  for (const group of groups.values()) {
    const scope = { project_id: group[0].project_id, document_id: group[0].document_id };
    let inventory; let problem;
    try {
      ensure(scope.document_id, 'EXPLICIT_FILE_DOCUMENT_OWNERSHIP_REQUIRED');
      inventory = await repository.inventory(c, scope, { forBinding: true });
      deriveFolderTargets({ ...inventory, manifest: inventory.files.map(f => ({ key: validateStorageKey(f.storage_key), namespace: p.namespace })) });
      const project = tables.projects.find(r => r.id === scope.project_id);
      ensure(project?.status === 'Active', 'PROJECT_NOT_ACTIVE');
      const gate = tables.document_admission_coordinators.find(r => r.project_id === scope.project_id && r.document_id === scope.document_id);
      ensure(!gate || (gate.gate_state === 'OPEN' && !gate.delete_operation_id), 'DELETE_GATE_CLOSED');
      ensure(!tables.document_delete_operations.some(r => r.project_id === scope.project_id && r.document_id === scope.document_id), 'DELETE_OPERATION_EXISTS');
      const writers = tables.document_writer_operations.filter(r => r.project_id === scope.project_id && r.document_id === scope.document_id);
      ensure(!writers.some(r => r.lifecycle_state !== 'SETTLED' || r.completion_evidence === null
        || !['NOT_STARTED','COMMITTED','ROLLED_BACK'].includes(r.db_outcome)), 'WRITER_NOT_SETTLED');
      ensure(!tables.document_storage_io_steps.some(s => writers.some(w => w.id === s.writer_id) && s.state !== 'SUCCEEDED'), 'IO_NOT_SETTLED');
      const ids = new Set(inventory.files.map(f => f.file_id));
      for (const manifest of tables.document_delete_file_manifest) {
        const value = JSON.parse(manifest.ownership_evidence);
        ensure(!ids.has(manifest.file_reference) && !(value.fileIds || []).some(id => ids.has(id)), 'MANIFEST_ALREADY_FINALIZED');
      }
    } catch (error) { problem = error.code || 'INVENTORY_OR_FOLDER_OWNERSHIP_INVALID'; }
    for (const file of group) {
      const item = { fileId: file.file_id, projectId: file.project_id, documentId: file.document_id,
        storageKey: file.storage_key, status: 'BLOCKED', reason: problem || null };
      try {
        if (problem) fail(problem);
        ensure(file.storage_key === validateStorageKey(file.storage_key), 'NONCANONICAL_STORAGE_KEY');
        const binding = tables.stored_file_namespace_bindings.find(b => b.file_id === file.file_id);
        if (binding) {
          const ns = tables.storage_namespaces.find(n => n.id === binding.namespace_id);
          const value = JSON.parse(binding.evidence);
          ensure(ns?.id === p.namespace.id && ns.descriptor === p.namespace.encoded && ns.provider === 'r2'
            && binding.storage_key_snapshot === file.storage_key && value.version === 1
            && ['UPLOAD_ADAPTER_SNAPSHOT','OWNER_REVIEWED_STORAGE_INVENTORY'].includes(value.source) && !value.localIdentity
            && (!value.projectId || value.projectId === file.project_id) && (!value.documentId || value.documentId === file.document_id)
            && sha(value.sha256) && value.sha256 === String(file.checksum || '').toLowerCase()
            && value.size === Number(file.file_size), 'EXISTING_BINDING_CONFLICT_OR_INCOMPLETE');
          item.status = 'ALREADY_BOUND';
        } else {
          const observed = proof.get(file.file_id);
          ensure(observed && observed.projectId === file.project_id && observed.documentId === file.document_id
            && observed.storageKey === file.storage_key && observed.size === Number(file.file_size)
            && observed.sha256 === String(file.checksum || '').toLowerCase(), 'EXACT_STORAGE_PROOF_REQUIRED');
          Object.assign(item, { status: 'ELIGIBLE', sha256: observed.sha256, size: observed.size });
        }
      } catch (error) { item.reason = error.code || 'BINDING_EVIDENCE_INVALID'; }
      files.push(item);
    }
  }
  const value = { version: 1, mode: 'PREFLIGHT', environment, targetDigest: p.targetDigest, namespace: p.namespace,
    snapshotDigest: digest(JSON.stringify(snapshot)), evidenceDigest: evidence ? digest(JSON.stringify(evidence)) : null,
    expiresAt: new Date(Math.min(captured, evidence ? dateMs(evidence.inspectedAt) : captured) + p.maxAgeMinutes * 60000).toISOString(),
    files, summary: { total: files.length, eligible: files.filter(f => f.status === 'ELIGIBLE').length,
      alreadyBound: files.filter(f => f.status === 'ALREADY_BOUND').length, blocked: files.filter(f => f.status === 'BLOCKED').length } };
  return { ...value, approvalDigest: seal(value) };
};

const snapshotPredicates = (snapshot) => {
  const clauses = [];
  for (const table of tableNames) {
    const entries = snapshot.tables[table];
    clauses.push(`(SELECT COUNT(*) FROM \`${table}\`)=${entries.length}`);
    for (const entry of entries) {
      const row = JSON.parse(entry.raw);
      const where = (PK[table] || ['id']).map(c => `CAST(\`${c}\` AS BINARY)<=>CAST(${encode(row[c])} AS BINARY)`).join(' AND ');
      clauses.push(`(SELECT COUNT(*) FROM \`${table}\` WHERE ${where} AND ${rowHashExpression(table)}=${encode(entry.hash)})=1`);
    }
  }
  // Compare dependency multisets, without GROUP_CONCAT truncation or array-order assumptions.
  const metadata = [
    { rows: snapshot.documentTables, table: 'information_schema.COLUMNS', filter: "TABLE_SCHEMA=DATABASE() AND COLUMN_NAME='document_id'", columns: ['TABLE_NAME'] },
    { rows: snapshot.foreignKeys, table: 'information_schema.KEY_COLUMN_USAGE', filter: 'TABLE_SCHEMA=DATABASE() AND REFERENCED_TABLE_NAME IS NOT NULL', columns: ['TABLE_NAME','REFERENCED_TABLE_NAME'] },
  ];
  for (const item of metadata) {
    clauses.push(`(SELECT COUNT(*) FROM ${item.table} WHERE ${item.filter})=${item.rows.length}`);
    const groups = new Map();
    for (const row of item.rows) {
      const key = JSON.stringify(item.columns.map(c => row[c]));
      if (!groups.has(key)) groups.set(key, { row, count: 0 }); groups.get(key).count++;
    }
    for (const { row, count } of groups.values()) clauses.push(`(SELECT COUNT(*) FROM ${item.table} WHERE ${item.filter}
      AND ${item.columns.map(c => `\`${c}\`=${encode(row[c])}`).join(' AND ')})=${count}`);
  }
  clauses.push(`(SELECT COUNT(*) FROM information_schema.TABLES WHERE TABLE_SCHEMA=DATABASE()
    AND TABLE_NAME IN (${engineTableNames.map(encode).join(',')}) AND ENGINE='InnoDB')=${engineTableNames.length}`);
  clauses.push("(SELECT COUNT(*) FROM information_schema.TRIGGERS WHERE TRIGGER_SCHEMA=DATABASE() AND EVENT_OBJECT_TABLE IN ('storage_namespaces','stored_file_namespace_bindings','audit_trail'))=0");
  return clauses;
};

const generateApply = async ({ config, environment, snapshot, evidence, plan, approval, backup, now = Date.now() }) => {
  const p = profileFor(config, environment);
  ensure(plan?.approvalDigest === approval?.digest && seal(plan) === plan.approvalDigest
    && approval.confirm === 'APPLY_HISTORICAL_NAMESPACE_BINDINGS' && approval.environment === environment
    && approval.targetDigest === p.targetDigest && approval.maintenance === true, 'EXPLICIT_OWNER_APPROVAL_REQUIRED');
  ensure(backup?.verified === true && backup.targetDigest === p.targetDigest && sha(backup.sha256)
    && backup.bytes > 0 && backup.scope === 'FULL_DATABASE' && backup.reviewedByOwner === true,
  'VERIFIED_BACKUP_REQUIRED');
  const backupTime = dateMs(backup.createdAt);
  ensure(backupTime <= now && backupTime >= dateMs(snapshot.capturedAt), 'BACKUP_MUST_FOLLOW_QUIESCENT_SNAPSHOT');
  const current = await buildPlan({ config, environment, snapshot, evidence, now });
  ensure(same(plan, current) && dateMs(plan.expiresAt) > now && plan.summary.blocked === 0, 'PREFLIGHT_CHANGED_OR_BLOCKED');
  if (plan.summary.eligible === 0) return '-- NO CHANGES: all files already bound or dataset empty. Run verify; no transaction required.\n';
  const tables = readSnapshot(snapshot, p); const actorId = String(approval.actorUserId || '');
  ensure(/^[1-9][0-9]*$/.test(actorId), 'ACTIVE_PROJECT_ADMIN_REQUIRED');
  const actor = tables.users.find(u => String(u.id) === actorId && u.status === 'Active' && u.full_name);
  ensure(actor, 'ACTIVE_PROJECT_ADMIN_REQUIRED');
  const candidates = plan.files.filter(f => f.status === 'ELIGIBLE');
  const projectIds = new Set(candidates.map(f => f.projectId));
  for (const projectId of projectIds) ensure(tables.project_memberships.some(m => m.project_id === projectId
    && String(m.user_id) === actorId && m.official_role === 'Admin' && m.status === 'Active'), 'ACTIVE_PROJECT_ADMIN_REQUIRED');
  const expiry = plan.expiresAt.replace('T', ' ').replace('Z', '');
  const guards = [identityPredicate(p), `(${privilegePredicate('SELECT')})`, `(${privilegePredicate('TRIGGER')})`, "@@transaction_isolation='REPEATABLE-READ'",
    `UTC_TIMESTAMP(3)<STR_TO_DATE(${encode(expiry)},'%Y-%m-%d %H:%i:%s.%f')`, ...snapshotPredicates(snapshot)];
  const evidenceRows = candidates.map(file => ({ file, evidence: JSON.stringify({
    source: 'OWNER_REVIEWED_STORAGE_INVENTORY', version: 1, recordId: plan.approvalDigest,
    actorUserId: actorId, projectId: file.projectId, documentId: file.documentId,
    sha256: file.sha256, size: file.size,
  }) }));
  const lines = [`-- OWNER-APPROVED OFFLINE RECOVERY SQL / ${environment}
-- Target digest: ${p.targetDigest}; approval: ${plan.approvalDigest}
-- Backup SHA-256: ${backup.sha256}; restore test: ${backup.restoreTest}
-- Dedicated connection, no prior transaction, maintenance window: ALL application
-- and external storage writers stopped. DBeaver MUST stop on the FIRST error.
-- Global metadata range locks are deliberate: reserve time/capacity before use.
-- NO automatic COMMIT. Any error/STOP: ROLLBACK on THIS connection immediately.
-- A successful final row still requires owner COMMIT on THIS connection.
SELECT IF(${identityPredicate(p)},'PASS - CONFIRM TARGET BEFORE CONTINUING','STOP - WRONG TARGET') AS identity_gate;
SET TRANSACTION ISOLATION LEVEL REPEATABLE READ;
START TRANSACTION;`];
  // Full primary-index locking reads at RR pin rows AND gaps, including empty
  // coordinator tables, without creating/modifying Delete/admission ledger rows.
  for (const table of tableNames) lines.push(`SELECT ${(PK[table] || ['id']).map(c => `\`${c}\``).join(',')}
    FROM \`${table}\` WHERE (${identityPredicate(p)}) ORDER BY ${(PK[table] || ['id']).map(c => `\`${c}\``).join(',')} FOR UPDATE;`);
  // Pin Audit Trail metadata (including engine/triggers) without exporting or
  // locking its historical rows. DDL must not race the later audit insertion.
  lines.push('SELECT id FROM audit_trail WHERE FALSE FOR UPDATE;');
  lines.push(`SET @hb_ok=COALESCE((${guards.join('\n  AND ')}),0);
SELECT IF(@hb_ok=1,'PRECONDITIONS PASS','STOP - NO WRITES AUTHORIZED; ROLLBACK') AS preconditions;`);
  lines.push(`INSERT INTO storage_namespaces (id,provider,descriptor,created_at)
SELECT ${encode(p.namespace.id)},'r2',${encode(p.namespace.encoded)},UTC_TIMESTAMP(3)
WHERE @hb_ok=1 AND NOT EXISTS(SELECT 1 FROM storage_namespaces WHERE id=${encode(p.namespace.id)});
SET @hb_ok=(@hb_ok=1 AND ROW_COUNT()=${tables.storage_namespaces.some(n => n.id === p.namespace.id) ? 0 : 1});`);
  for (const { file, evidence: rowEvidence } of evidenceRows) lines.push(`INSERT INTO stored_file_namespace_bindings
  (file_id,namespace_id,storage_key_snapshot,evidence,created_at)
SELECT ${encode(file.fileId)},${encode(p.namespace.id)},${encode(file.storageKey)},${encode(rowEvidence)},UTC_TIMESTAMP(3)
WHERE @hb_ok=1 AND NOT EXISTS(SELECT 1 FROM stored_file_namespace_bindings WHERE file_id=${encode(file.fileId)});
SET @hb_ok=(@hb_ok=1 AND ROW_COUNT()=1);`);
  const documents = new Map(candidates.map(f => [f.documentId, f]));
  for (const file of documents.values()) {
    const id = `HBR-${digest(JSON.stringify([plan.approvalDigest, file.projectId, file.documentId])).slice(0, 48)}`;
    const metadata = JSON.stringify({ approvalDigest: plan.approvalDigest,
      fileIds: candidates.filter(f => f.documentId === file.documentId).map(f => f.fileId), backupSha256: backup.sha256 });
    lines.push(`INSERT INTO audit_trail (id,identity_key,project_id,actor_user_id,actor_name,department,
  official_role,action,business_event,detail,resource_type,resource_id,reference,metadata,occurred_at)
SELECT ${encode(id)},${encode(`historical-binding:${id}`)},d.project_id,u.id,u.full_name,u.department_name_snapshot,
  'Admin','File Provenance Reconciled','Legacy File Reconciliation','Namespace binding verified and recorded.',
  'Document',d.id,d.document_number,${encode(metadata)},UTC_TIMESTAMP(3)
FROM engineering_documents d JOIN users u ON u.id=${encode(actorId)}
WHERE @hb_ok=1 AND d.id=${encode(file.documentId)} AND d.project_id=${encode(file.projectId)};
SET @hb_ok=(@hb_ok=1 AND ROW_COUNT()=1);`);
  }
  for (const { file, evidence: rowEvidence } of evidenceRows) lines.push(`SET @hb_ok=(@hb_ok=1 AND
    (SELECT COUNT(*) FROM stored_file_namespace_bindings WHERE file_id=${encode(file.fileId)}
      AND namespace_id=${encode(p.namespace.id)} AND CAST(storage_key_snapshot AS BINARY)=CAST(${encode(file.storageKey)} AS BINARY)
      AND CAST(evidence AS BINARY)=CAST(${encode(rowEvidence)} AS BINARY))=1);`);
  lines.push(`SELECT CONNECTION_ID() AS connection_id,${encode(environment)} AS environment,
  ${candidates.length} AS expected_new_bindings,IF(@hb_ok=1,'READY TO COMMIT - OWNER MUST COMMIT MANUALLY',
  'STOP - ROLLBACK REQUIRED; DO NOT COMMIT') AS verdict;
-- No COMMIT supplied intentionally. Owner checks ALL results/no errors, then
-- issues COMMIT separately on this connection, or ROLLBACK on any failure.
-- Lost COMMIT acknowledgement: do not repeat this script; run verify and review.
`);
  return lines.join('\n\n');
};

const verifySql = (p, plan = null) => {
  if (plan) ensure(seal(plan) === plan.approvalDigest && plan.targetDigest === p.targetDigest, 'VERIFY_PLAN_MISMATCH');
  const ids = plan?.files.filter(f => f.status === 'ELIGIBLE').map(f => f.fileId) || [];
  return `${preflightSql(p)}
-- Postflight: this is metadata verification, NOT proof that R2 bytes exist.
SELECT ${encode(p.environment)} AS environment,${encode(p.targetDigest)} AS target_digest,
  COUNT(*) AS total_files,COALESCE(SUM(b.file_id IS NULL),0) AS remaining_missing,
  COALESCE(SUM(b.file_id IS NOT NULL AND (n.id IS NULL OR n.id<>${encode(p.namespace.id)}
    OR CAST(n.descriptor AS BINARY)<>CAST(${encode(p.namespace.encoded)} AS BINARY)
    OR SHA2(n.descriptor,256)<>n.id OR CAST(b.storage_key_snapshot AS BINARY)<>CAST(f.storage_key AS BINARY)
    OR JSON_VALID(b.evidence)<>1)),0) AS conflicts,
  ${ids.length ? `(SELECT COUNT(*) FROM stored_file_namespace_bindings WHERE file_id IN (${ids.map(encode).join(',')}) AND namespace_id=${encode(p.namespace.id)})` : '0'} AS approved_file_bindings_present,
  ${ids.length} AS approved_file_bindings_expected,
  'Inspect snapshot with preflight again for full ownership/proof checks; counts alone are NOT PASS' AS verdict
FROM stored_files f LEFT JOIN stored_file_namespace_bindings b ON b.file_id=f.file_id
LEFT JOIN storage_namespaces n ON n.id=b.namespace_id;
SELECT file_id,COUNT(*) AS occurrences FROM stored_file_namespace_bindings GROUP BY file_id HAVING COUNT(*)<>1;
`;
};

const verifySnapshot = async ({ config, environment, snapshot, plan, baseline, now = Date.now() }) => {
  const p = profileFor(config, environment); const tables = readSnapshot(snapshot, p);
  if (plan) ensure(seal(plan) === plan.approvalDigest && plan.targetDigest === p.targetDigest, 'VERIFY_PLAN_MISMATCH');
  const assessment = await buildPlan({ config, environment, snapshot, now });
  const expected = plan?.files.filter(file => file.status === 'ELIGIBLE') || [];
  let confirmed = 0;
  for (const file of expected) {
    const binding = tables.stored_file_namespace_bindings.find(b => b.file_id === file.fileId);
    if (!binding) continue;
    const value = JSON.parse(binding.evidence);
    if (binding.namespace_id === p.namespace.id && binding.storage_key_snapshot === file.storageKey
      && value.recordId === plan.approvalDigest && value.source === 'OWNER_REVIEWED_STORAGE_INVENTORY'
      && value.version === 1 && value.sha256 === file.sha256 && value.size === file.size
      && value.projectId === file.projectId && value.documentId === file.documentId) confirmed++;
  }
  let integrity = 'UNVERIFIED - BASELINE SNAPSHOT NOT SUPPLIED';
  if (baseline) {
    readSnapshot(baseline, p);
    const unchanged = tableNames.filter(t => !['storage_namespaces','stored_file_namespace_bindings'].includes(t)).every(t =>
      same(snapshot.tables[t].map(r => r.hash).sort(), baseline.tables[t].map(r => r.hash).sort()));
    integrity = unchanged ? 'PASS - EXPORTED METADATA UNCHANGED' : 'MISMATCH - METADATA CHANGED';
  }
  const missing = tables.stored_files.filter(f => !tables.stored_file_namespace_bindings.some(b => b.file_id === f.file_id)).length;
  return { mode: 'VERIFY', environment, targetDigest: p.targetDigest, summary: assessment.summary,
    approvedBindingsExpected: expected.length, approvedBindingsConfirmed: confirmed, remainingMissing: missing,
    integrity, runtimeStorage: 'UNVERIFIED - NO R2 ACCESS',
    verdict: assessment.summary.blocked === 0 && missing === 0 && confirmed === expected.length && !integrity.startsWith('MISMATCH')
      ? 'METADATA VERIFIED - NOT DELETE AUTHORIZATION' : 'REVIEW REQUIRED', files: assessment.files };
};

const verifyBackup = async (receipt, p, now) => {
  ensure(receipt?.version === 1 && receipt.targetDigest === p.targetDigest && receipt.reviewedByOwner === true
    && receipt.scope === 'FULL_DATABASE' && sha(receipt.sha256)
    && ['PASS', 'NOT_TESTED'].includes(receipt.restoreTest) && typeof receipt.dumpPath === 'string', 'BACKUP_RECEIPT_REQUIRED');
  ensure(dateMs(receipt.createdAt) <= now, 'BACKUP_TIMESTAMP_INVALID');
  const { createHash } = require('node:crypto'); const { createReadStream } = require('node:fs');
  const hash = createHash('sha256'); let bytes = 0; let tail = ''; const found = new Set();
  for await (const chunk of createReadStream(path.resolve(receipt.dumpPath))) {
    hash.update(chunk); bytes += chunk.length;
    const text = tail + chunk.toString('utf8');
    for (const m of text.matchAll(/CREATE TABLE(?: IF NOT EXISTS)?\s+`?([A-Za-z0-9_]+)`?/g)) found.add(m[1]);
    tail = text.slice(-512);
  }
  ensure(bytes > 0 && hash.digest('hex') === receipt.sha256
    && [...tableNames, 'audit_trail'].every(t => found.has(t)), 'BACKUP_INTEGRITY_OR_TABLES_FAILED');
  return { verified: true, targetDigest: receipt.targetDigest, sha256: receipt.sha256, bytes,
    scope: receipt.scope, reviewedByOwner: true, createdAt: receipt.createdAt, restoreTest: receipt.restoreTest };
};

const main = async () => {
  const { values } = parseArgs({ options: Object.fromEntries([
    'mode','environment','config','snapshot','baseline','evidence','plan','out','approval-digest','confirm-environment',
    'confirm-target','confirm','actor-user-id','backup-receipt',
  ].map(name => [name, { type: 'string' }]).concat([['maintenance-confirmed', { type: 'boolean', default: false }]])) });
  const mode = values.mode || 'preflight';
  ensure(['preflight','apply','verify'].includes(mode) && values.config && values.environment && values.out, 'USAGE_CONFIG_ENVIRONMENT_OUT_REQUIRED');
  const json = async file => JSON.parse(await fs.readFile(path.resolve(file), 'utf8'));
  const config = await json(values.config); const p = profileFor(config, values.environment);
  const output = path.resolve(values.out);
  const inputs = ['config','snapshot','baseline','evidence','plan','backup-receipt'].filter(k => values[k]).map(k => path.resolve(values[k]));
  ensure(!inputs.includes(output), 'OUTPUT_CANNOT_OVERWRITE_INPUT');
  const snapshot = values.snapshot ? await json(values.snapshot) : null;
  const evidence = values.evidence ? await json(values.evidence) : null;
  if (evidence?.inspectionReportPath) {
    ensure(!evidence.inspectionReport, 'AMBIGUOUS_INSPECTION_REPORT_INPUT');
    evidence.inspectionReport = await json(path.resolve(path.dirname(path.resolve(values.evidence)), evidence.inspectionReportPath));
  }
  let result;
  if (mode === 'preflight') {
    result = snapshot ? JSON.stringify(await buildPlan({ config, environment: values.environment, snapshot, evidence }), null, 2) + '\n' : preflightSql(p);
  } else if (mode === 'verify') {
    const plan = values.plan ? await json(values.plan) : null;
    result = snapshot ? JSON.stringify(await verifySnapshot({ config, environment: values.environment, snapshot,
      plan, baseline: values.baseline ? await json(values.baseline) : null }), null, 2) + '\n' : verifySql(p, plan);
  } else {
    ensure(values.plan && snapshot && evidence && values['backup-receipt'], 'APPLY_INPUTS_REQUIRED');
    const receipt = await json(values['backup-receipt']);
    ensure(path.resolve(receipt.dumpPath || '') !== output, 'OUTPUT_CANNOT_OVERWRITE_BACKUP');
    const backup = await verifyBackup(receipt, p, Date.now());
    result = await generateApply({ config, environment: values.environment, snapshot, evidence,
      plan: await json(values.plan), backup, approval: { digest: values['approval-digest'],
        environment: values['confirm-environment'], targetDigest: values['confirm-target'], confirm: values.confirm,
        maintenance: values['maintenance-confirmed'], actorUserId: values['actor-user-id'] } });
  }
  await fs.mkdir(path.dirname(output), { recursive: true });
  await fs.writeFile(output, result, { flag: 'wx', mode: 0o600 });
  console.log(JSON.stringify({ mode, environment: p.environment, targetDigest: p.targetDigest,
    namespaceId: p.namespace.id, output, databaseAccess: false, storageAccess: false,
    ...(snapshot && mode !== 'apply' ? { summary: JSON.parse(result).summary } : {}),
    note: mode === 'apply' ? 'SQL GENERATED ONLY - NOT EXECUTED' : 'OFFLINE ARTIFACT GENERATED' }));
};

if (require.main === module) main().catch(error => {
  console.error(JSON.stringify({ code: error.code || 'OFFLINE_RECOVERY_STOPPED',
    message: 'Dihentikan. Periksa input/evidence; tidak ada koneksi database atau storage.' }));
  process.exitCode = 1;
});
module.exports = { SPECS, PK, profileFor, preflightSql, readSnapshot, snapshotConnection, buildPlan,
  generateApply, verifySql, verifySnapshot, verifyBackup, rowExpression, rowHashExpression, seal };
