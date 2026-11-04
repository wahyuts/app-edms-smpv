const assert = require('node:assert/strict');
const fs = require('node:fs');
const fsp = require('node:fs/promises');
const path = require('node:path');
const os = require('node:os');
const vm = require('node:vm');
const crypto = require('node:crypto');
const mysql = require('mysql2/promise');
const isolated = require('../helpers/isolatedMariaDb.cjs');
const { createDeleteEngine } = require('../../src/services/documentDelete.service');
const { bindNewFile } = require('../../src/repositories/storageNamespace.repository');
const { digest } = require('../../src/utils/storageNamespace');
const { loadDrivers } = require('../helpers/deleteStorageDrivers.cjs');
const { createBindingService } = require('../../src/services/existingFileBinding.service');

const root = path.resolve(__dirname, '../../../..');
const database = isolated.database;
const run = `SB-${Date.now().toString(36)}-${crypto.randomBytes(3).toString('hex')}`;
const watchdogProbe = process.argv.includes('--watchdog-probe');
const finalCleanup = process.argv.includes('--final-local-cleanup');
const sprintC = process.argv.includes('--sprint-c-notifications');
const sprintD = process.argv.includes('--sprint-d-api');
const stamp = sprintD || process.argv.includes('--sprint-d-regression') ? '0006' : sprintC || process.argv.includes('--sprint-c-regression') ? '0005' : finalCleanup ? '0004' : '0003';
const output = path.join(root, `database/migration/reports/20261102_${stamp}_sprint_${sprintD ? 'd' : sprintC ? 'c' : 'b'}_${watchdogProbe ? 'watchdog_probe' : 'isolated_results'}.json`);
const results = { run, database, tests: [], startedAt: new Date().toISOString() };
let rawPool;
let rawEvidencePool;
let rawDiagnosticPool;
let stopping = false;
const connections = new Set();
const handledConnections = new WeakSet();
const tasks = new Set();
const cleanupErrors = [];
const critical = new Set(['PROTOCOL_CONNECTION_LOST','PROTOCOL_SEQUENCE_TIMEOUT','ETIMEDOUT','ECONNRESET','EPIPE','ER_SERVER_SHUTDOWN']);
const trackTask = (promise) => {
  tasks.add(promise);
  promise.then(() => tasks.delete(promise), () => tasks.delete(promise));
  return promise;
};
const destroyClients = () => { for (const c of connections) c.destroy(); };
const diagnose = async () => {
  const c = await isolated.bounded(rawDiagnosticPool.getConnection(), 1500, 'Diagnostic pool acquisition timeout');
  try {
    results.processes = (await c.query({ sql: 'SELECT ID,COMMAND,TIME,STATE FROM information_schema.PROCESSLIST WHERE DB=?', timeout: 1500 }, [database]))[0];
  } finally { c.release(); }
};
const ownedManifestIds = new Set();
const ownedNotificationIds = new Set();
const ownedOperationIds = new Set();
const statements = (source) => {
  let quote = null; let comment = false; let buffer = ''; const list = [];
  for (let i = 0; i < source.length; i += 1) {
    const ch = source[i]; const next = source[i + 1];
    if (comment) { if (ch === '\n') { comment = false; buffer += '\n'; } continue; }
    if (quote) {
      buffer += ch;
      if (ch === '\\') { buffer += next || ''; i += 1; }
      else if (ch === quote && next === quote) { buffer += next; i += 1; }
      else if (ch === quote) quote = null;
    } else if (ch === '-' && next === '-' && /\s/.test(source[i + 2] || ' ')) { comment = true; i += 1; }
    else if (["'", '"', '`'].includes(ch)) { quote = ch; buffer += ch; }
    else if (ch === ';') { if (buffer.trim()) list.push(buffer.trim()); buffer = ''; }
    else buffer += ch;
  }
  assert.equal(quote, null); if (buffer.trim()) list.push(buffer.trim()); return list;
};
const checked = (c) => {
  let inTransaction = false;
  let destroyed = false;
  const destroy = () => { if (!destroyed) { destroyed = true; c.destroy(); } };
  connections.add({ destroy });
  const check = (sql, args = []) => {
    results.lastSql = sql;
    assert.doesNotMatch(sql, /\bedms_(?:db|smpv_dev|dev|prod|staging)\b|SET\s+GLOBAL|FOREIGN_KEY_CHECKS\s*=\s*0|\b(?:DROP|TRUNCATE|USE|REPLACE)\b/i);
    if (/INSERT INTO document_delete_file_manifest/.test(sql)) {
      assert.ok(args[1].startsWith(run) || ownedOperationIds.has(args[1])); ownedManifestIds.add(args[0]);
    }
    if (/INSERT(?: IGNORE)?\s+INTO notifications/.test(sql)) {
      assert.ok(args[2].startsWith(run)); ownedNotificationIds.add(args[0]);
    }
    if (/INSERT INTO document_delete_operations/.test(sql)) { assert.ok(args[1].startsWith(run)); ownedOperationIds.add(args[0]); }
    if (/^\s*(DELETE|UPDATE)\b/i.test(sql)) assert.ok(args.some((arg) => typeof arg === 'string' && (arg.startsWith(run) || ownedManifestIds.has(arg) || ownedNotificationIds.has(arg) || ownedOperationIds.has(arg))), 'Mutation must identify this run synthetic fixture');
  };
  const call = async (sql, args, query = false) => {
    if (stopping || destroyed) throw Object.assign(new Error('Test operation cancelled'), { code: 'TEST_CANCELLED' });
    check(sql, args);
    try { return await (query ? c.query({ sql, timeout: 5000 }, args) : c.execute({ sql, timeout: 5000 }, args)); }
    catch (error) {
      if (critical.has(error.code)) { stopping = true; destroy(); }
      throw error;
    }
  };
  return {
    execute: (sql, args) => call(sql, args), query: (sql, args) => call(sql, args, true),
    beginTransaction: async () => { await call('START TRANSACTION', undefined, true); inTransaction = true; },
    commit: async () => { await call('COMMIT', undefined, true); inTransaction = false; },
    rollback: async () => {
      try {
        if (destroyed) throw Object.assign(new Error('Rollback could not be acknowledged'), { code: 'ROLLBACK_UNVERIFIED' });
        await c.query({ sql: 'ROLLBACK', timeout: 1500 }); inTransaction = false;
      } catch (error) { cleanupErrors.push({ stage: 'rollback', code: error.code }); destroy(); throw error; }
    },
    release: () => {
      if (inTransaction && !destroyed) { cleanupErrors.push({ stage: 'release', code: 'OPEN_TRANSACTION' }); stopping = true; destroy(); }
      if (!destroyed) c.release();
    },
  };
};
const test = async (name, callback) => {
  if (stopping) throw new Error('Run already aborted');
  try {
    const evidence = await isolated.bounded(trackTask(Promise.resolve().then(callback)), watchdogProbe ? 100 : 20000, `Test deadline: ${name}`);
    assert.equal(cleanupErrors.length, 0, 'Unacknowledged transaction cleanup');
    results.tests.push({ name, result: 'PASS', evidence }); console.log(`PASS: ${name}`);
  } catch (error) {
    stopping = true;
    results.tests.push({ name, result: 'FAIL', code: error.code, error: error.message });
    try { await diagnose(); } catch (diagnostic) { results.diagnosticError = diagnostic.code; }
    destroyClients();
    console.log(`FAIL: ${name}: ${error.code || error.message}`);
    throw error;
  }
};
const main = async () => {
  assert.ok(process.argv.includes('--execute-isolated-only'), 'Explicit isolated-instance execution flag required');
  const credentials = { ...isolated.target('synthetic'), database, waitForConnections: true, queueLimit: 10 };
  rawPool = mysql.createPool({ ...credentials, connectionLimit: 5 });
  rawEvidencePool = mysql.createPool({ ...credentials, connectionLimit: 2 });
  rawDiagnosticPool = mysql.createPool({ ...credentials, connectionLimit: 1 });
  const makePool = (source) => ({
    getConnection: async () => {
      if (stopping) throw new Error('Test run aborted');
      const raw = await source.getConnection();
      try {
        if (stopping) { raw.destroy(); throw new Error('Test acquisition cancelled'); }
        const underlying = raw.connection || raw;
        if (!handledConnections.has(underlying)) { raw.on('error', () => {}); handledConnections.add(underlying); }
        await isolated.verify(raw, database);
        await raw.query({ sql: "SET SESSION time_zone='+00:00'", timeout: 5000 });
        await raw.query({ sql: 'SET SESSION innodb_lock_wait_timeout=2', timeout: 5000 });
        return checked(raw);
      } catch (error) { raw.release(); throw error; }
    },
  });
  // Each closure retains its own source pool; no business-pool fallback for evidence.
  const wrap = (source) => {
    const managedPool = makePool(source);
    managedPool.execute = async (sql, args) => { const c = await managedPool.getConnection(); try { return await c.execute(sql, args); } finally { c.release(); } };
    managedPool.query = async (sql, args) => { const c = await managedPool.getConnection(); try { return await c.query(sql, args); } finally { c.release(); } };
    return managedPool;
  };
  const pool = wrap(rawPool); const evidencePool = wrap(rawEvidencePool);
  const execute = pool.execute;
  const [[server]] = await execute('SELECT VERSION() version,@@hostname hostname,@@port port,@@datadir datadir,@@GLOBAL.sql_mode sql_mode,@@GLOBAL.time_zone time_zone,@@autocommit autocommit');
  assert.equal(server.version, '10.4.32-MariaDB'); assert.equal(server.port, isolated.port); assert.equal(server.hostname.toLowerCase(), os.hostname().toLowerCase());
  assert.equal(isolated.normalizedPath(server.datadir), isolated.normalizedPath(isolated.datadir));
  results.server = server;
  assert.equal(server.autocommit, 1);
  const [active] = await execute(`SELECT ID,COMMAND,TIME,STATE FROM information_schema.PROCESSLIST
    WHERE DB=? AND ID <> CONNECTION_ID() AND COMMAND <> 'Sleep'`, [database]);
  results.preflightActiveCommands = active;
  assert.equal(active.length, 0, 'STOP: unresolved test-database commands require owner review before another mutation run');
  const [[marker]] = await execute('SELECT * FROM sprint_a_test_ownership WHERE id=?', ['app-edms-smpv:Sprint-A-database-validation']);
  assert.ok(marker); assert.equal(marker.state, 'READY');
  assert.equal(marker.schema_hash, digest(fs.readFileSync(path.join(root, 'database/schema/schema-dev.sql'))));
  assert.equal(marker.migration_hash, digest(fs.readFileSync(path.join(root, 'database/migration/20261102_0001_permanent_delete_foundation_mariadb.sql'))));
  if (watchdogProbe) {
    await test('Expected watchdog cancellation probe; no mutation', () => new Promise(() => {}));
    return;
  }
  const businessTables = statements(fs.readFileSync(path.join(root, 'database/schema/schema-dev.sql'), 'utf8'))
    .filter((s) => s.startsWith('CREATE TABLE ')).map((s) => /^CREATE TABLE ([a-z_]+)/.exec(s)[1]);
  const baseline = new Map();
  for (const table of businessTables) baseline.set(table, (await execute(`SELECT * FROM ${table}`))[0].map(JSON.stringify));
  const migration = fs.readFileSync(path.join(root, 'database/migration/20261102_0002_permanent_delete_cleanup_mariadb.sql'), 'utf8');
  const names = ['storage_namespaces','stored_file_namespace_bindings','document_delete_executions','document_delete_attempts'];
  const [existing] = await execute(`SELECT TABLE_NAME FROM information_schema.TABLES WHERE TABLE_SCHEMA=DATABASE()
    AND TABLE_NAME IN (?,?,?,?)`, names);
  assert.ok(existing.length === 0 || existing.length === 4, 'Partial Sprint B initialization requires review');
  if (!existing.length) {
    const c = await pool.getConnection();
    try {
      for (const sql of statements(migration)) { assert.ok(names.includes(/^CREATE TABLE ([a-z_]+)/.exec(sql)?.[1])); await c.query(sql); }
    } finally { c.release(); }
  }
  results.migration = { executed: existing.length === 0, hash: digest(migration), tables: names };
  const module = { exports: {} };
  new vm.Script(fs.readFileSync(path.join(root, 'apps/backend/src/repositories/documentCoordination.repository.js'), 'utf8')).runInNewContext({
    module, exports: module.exports, JSON, require: (name) => {
      assert.ok(['../config/database', '../config/documentCoordinationDatabase'].includes(name));
      return { pool: name === '../config/database' ? pool : evidencePool };
    },
  });
  const coordination = module.exports;
  const objects = new Map(); const calls = []; let effect = null;
  const sandbox = await fsp.mkdtemp(path.join(root, 'tmp/edms-sprint-b-db-'));
  results.localSandbox = sandbox;
  const config = { accountId: 'synthetic', endpoint: 'https://synthetic.r2.cloudflarestorage.com', bucketName: `${run}-development`, region: 'auto' };
  const drivers = loadDrivers({ root: sandbox, send: async (command) => {
    assert.ok(['DeleteObjectCommand','GetObjectCommand'].includes(command.command)); assert.equal(command.input.Bucket, config.bucketName);
    if (command.command === 'GetObjectCommand') return { Body: [Buffer.from(objects.get(command.input.Key) || '')] };
    calls.push(command.input.Key);
    if (effect) await effect(command.input.Key);
    objects.delete(command.input.Key); return {};
  } });
  const driver = drivers.r2(config);
  const storageFor = (d) => ({ captureNamespace: () => d.captureNamespace(), deleteOwnedExact: (key, ns, evidence) => d.deleteOwnedExact(key, ns, evidence),
    inspectOwnedExact: (key, ns) => d.inspectOwnedExact(key, ns) });
  const engine = (hooks = {}, d = driver) => createDeleteEngine({ pool, coordination, storage: storageFor(d), hooks });
  const [role] = await execute('INSERT INTO roles (role_code,role_name) VALUES (?,?)', [`${run}-ROLE`, 'Admin']);
  const [actor] = await execute('INSERT INTO users (user_code,username,full_name,email,role_id) VALUES (?,?,?,NULL,?)', [`${run}-USER`, `${run}-user`, 'Synthetic Sprint B Admin', role.insertId]);
  const userId = actor.insertId; let sequence = 0;
  const fixture = async ({ unbound = false, local = false, archived = false } = {}) => {
    const prefix = `${run}-${sequence++}`; const projectId = `${prefix}-P`; const documentId = `${prefix}-D`;
    await execute('INSERT INTO projects (id,project_code,project_name) VALUES (?,?,?)', [projectId, projectId, 'Synthetic Sprint B Project']);
    await execute("INSERT INTO project_memberships (id,project_id,user_id,official_role) VALUES (?,?,?,'Admin')", [`${prefix}-M`, projectId, userId]);
    await execute(`INSERT INTO engineering_documents (id,project_id,document_number,description,drawing,area,days_until_validation,
      workflow_status,revision_label,responsible_role,created_by_user_id,sla_started_at,lifecycle_status)
      VALUES (?,?,?,'Synthetic','PFD','TEST',5,'Process Review','IFR-Submitted','Team Process',?,UTC_TIMESTAMP(3),?)`,
    [documentId, projectId, `${prefix}-NUMBER`, userId, archived ? 'Archived' : 'Active']);
    const captured = await (local ? drivers.local : driver).captureNamespace(); const fileIds = []; const keys = [];
    for (let i = 0; i < 4; i += 1) {
      const id = `${prefix}-F${i}`; const key = i === 0 ? `legacy/${prefix}/old.pdf` : `synthetic/${prefix}/file${i}.pdf`;
      await execute(`INSERT INTO stored_files (file_id,project_id,document_id,original_file_name,physical_file_name,file_extension,
        mime_type,file_size,storage_key,relative_path,file_category,uploaded_by_user_id,uploaded_at) VALUES (?,?,?,'Original.pdf','physical.pdf','pdf',
        'application/pdf',9,?,?,?, ?,UTC_TIMESTAMP(3))`, [id, projectId, documentId, key, key, i === 2 ? 'Workflow Attachment' : 'Revision File', userId]);
      if (!unbound) {
        const c = await pool.getConnection(); try { await bindNewFile(c, id, key, captured); } finally { c.release(); }
      }
      if (local) { const file = path.join(sandbox, key); await fsp.mkdir(path.dirname(file), { recursive: true }); await fsp.writeFile(file, 'synthetic'); }
      else objects.set(key, 'synthetic');
      fileIds.push(id); keys.push(key);
    }
    for (let i = 0; i < 2; i += 1) await execute(`INSERT INTO document_revisions
      (id,project_id,document_id,revision_label,revision_sequence,file_id,storage_path_legacy,is_active,created_by_user_id)
      VALUES (?,?,?,'IFR-Submitted',?,?,?,?,?)`, [`${prefix}-R${i}`, projectId, documentId, i + 1, fileIds[i], keys[i], i, userId]);
    await execute('UPDATE engineering_documents SET active_revision_id=?,active_file_id=? WHERE id=?', [`${prefix}-R1`, fileIds[1], documentId]);
    await execute(`INSERT INTO workflow_comments (id,project_id,document_id,revision_id,workflow_action,workflow_comment,created_by_user_id)
      VALUES (?,?,?,?,'Approval B','Synthetic comment',?)`, [`${prefix}-C`, projectId, documentId, `${prefix}-R0`, userId]);
    await execute(`INSERT INTO workflow_attachments (attachment_id,project_id,document_id,comment_id,file_id,uploaded_by_user_id)
      VALUES (?,?,?,?,?,?)`, [`${prefix}-ATT`, projectId, documentId, `${prefix}-C`, fileIds[2], userId]);
    await execute('INSERT INTO comment_read_receipts (id,project_id,document_id,comment_id,user_id) VALUES (?,?,?,?,?)', [`${prefix}-READ`, projectId, documentId, `${prefix}-C`, userId]);
    await execute("INSERT INTO document_history (id,project_id,document_id,workflow_event,activity) VALUES (?,?,?,'Synthetic','Synthetic')", [`${prefix}-H`, projectId, documentId]);
    await execute("INSERT INTO document_sla_evaluations (id,project_id,document_id,cycle_id,current_state) VALUES (?,?,?,'Synthetic','On Track')", [`${prefix}-SLA`, projectId, documentId]);
    await execute(`INSERT INTO notifications (id,identity_key,project_id,recipient_user_id,event_type,title,message,related_resource_type,related_resource_id)
      VALUES (?,?,?,?,'Synthetic','Synthetic','Synthetic','Document',?)`, [`${prefix}-N`, `${prefix}-N`, projectId, userId, documentId]);
    await execute(`INSERT INTO notifications (id,identity_key,project_id,recipient_user_id,event_type,title,message)
      VALUES (?,?,?,?,'Synthetic','Unrelated','Must survive')`, [`${prefix}-UNRELATED`, `${prefix}-UNRELATED`, projectId, userId]);
    await execute(`INSERT INTO audit_trail (id,identity_key,project_id,actor_user_id,action,business_event,detail,resource_type,resource_id)
      VALUES (?,?,?,?,'View','Synthetic History','Must survive','Document',?)`, [`${prefix}-AUDIT`, `${prefix}-AUDIT`, projectId, userId, documentId]);
    return { prefix, projectId, documentId, fileIds, keys };
  };
  const reserve = async (f) => {
    const op = await coordination.reserve({ id: `${f.prefix}-OP`, projectId: f.projectId, documentId: f.documentId,
      documentNumber: `${f.prefix}-NUMBER`, userId, reason: 'Synthetic isolated UAT', requestIdentity: digest(f.prefix) });
    assert.equal((await coordination.evaluateQuiescence(op.id)).status, 'QUIESCENCE_CONFIRMED'); return op.id;
  };
  const count = async (table, column, id) => Number((await execute(`SELECT COUNT(*) n FROM ${table} WHERE ${column}=?`, [id]))[0][0].n);
  const pendingResult = (r, reason) => { assert.equal(r.status, 'PENDING'); if (reason) assert.equal(r.reason, reason); };

  await test('MariaDB migration: four InnoDB sidecars and FK enforcement enabled', async () => {
    const [tables] = await execute('SELECT TABLE_NAME,ENGINE FROM information_schema.TABLES WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME IN (?,?,?,?)', names);
    assert.equal(tables.length, 4); assert.ok(tables.every((r) => r.ENGINE === 'InnoDB'));
    const [[settings]] = await execute('SELECT @@foreign_key_checks enabled'); assert.equal(settings.enabled, 1);
  });
  await test('Complete archived document: active/history/attachment/out-of-prefix/direct files; audit retained; repeated resume exactly once', async () => {
    const f = await fixture({ archived: true }); const other = await fixture(); const id = await reserve(f); const beforeCalls = calls.length;
    const result = await engine().resume(id); assert.equal(result.status, 'COMPLETED', JSON.stringify(result));
    assert.equal(result.snapshot.documentNumber, `${f.prefix}-NUMBER`); assert.ok(result.completedAt);
    for (const table of ['engineering_documents','document_revisions','workflow_comments','workflow_attachments','document_history','comment_read_receipts','document_sla_evaluations','stored_files']) {
      assert.equal(await count(table, table === 'engineering_documents' ? 'id' : 'document_id', f.documentId), 0, table);
    }
    assert.equal(await count('notifications','related_resource_id', f.documentId), 0);
    assert.equal(await count('notifications','id', `${f.prefix}-UNRELATED`), 1);
    assert.equal(await count('audit_trail','resource_id', f.documentId), 2);
    assert.equal(await count('audit_trail','identity_key', `permanent-delete:${id}`), 1);
    assert.equal(await count('engineering_documents','id', other.documentId), 1);
    assert.ok(other.keys.every((key) => objects.has(key))); assert.ok(f.keys.every((key) => !objects.has(key)));
    assert.equal(calls.length - beforeCalls, 4);
    assert.equal((await engine().resume(id)).status, 'COMPLETED'); assert.equal(calls.length - beforeCalls, 4);
    await assert.rejects(coordination.admitWriter({ id: `${f.prefix}-LATE`, projectId: f.projectId, documentId: f.documentId, type: 'TEST' }), { code: 'DOCUMENT_DELETION_IN_PROGRESS' });
  });
  await test('Existing unbound files remain untouched and no manifest is finalized', async () => {
    const f = await fixture({ unbound: true }); const id = await reserve(f); const n = calls.length;
    pendingResult(await engine().resume(id), 'FILE_NAMESPACE_UNVERIFIED');
    assert.equal(calls.length, n); assert.equal(await count('engineering_documents','id', f.documentId), 1);
    assert.equal(await count('document_delete_executions','operation_id',id), 0);
  });
  await test('Cross-document shared file blocks the entire cleanup without reassigning metadata', async () => {
    const f = await fixture(); const other = await fixture();
    await execute(`INSERT INTO document_revisions (id,project_id,document_id,revision_label,revision_sequence,file_id,is_active,created_by_user_id)
      VALUES (?,?,?,'IFR-Submitted',99,?,0,?)`, [`${other.prefix}-SHARED`, other.projectId, other.documentId, f.fileIds[0], userId]);
    const n = calls.length; pendingResult(await engine().resume(await reserve(f)), 'CROSS_DOCUMENT_REFERENCE');
    assert.equal(calls.length, n); assert.ok(f.keys.every((key) => objects.has(key)));
  });
  await test('Different legacy alias blocks cleanup; document number is never sufficient', async () => {
    const f = await fixture(); await execute('UPDATE document_revisions SET storage_path_legacy=? WHERE id=?', [`legacy/${f.prefix}/unproven.pdf`, `${f.prefix}-R0`]);
    const n = calls.length; pendingResult(await engine().resume(await reserve(f)), 'LEGACY_REFERENCE_AMBIGUOUS'); assert.equal(calls.length, n);
  });
  await test('Crash after manifest; wrong namespace pending; fresh engine reads identical manifest and completes in correct bucket', async () => {
    const f = await fixture(); const id = await reserve(f);
    pendingResult(await engine({ afterManifest: () => { throw new Error('synthetic crash'); } }).resume(id));
    const [[before]] = await execute('SELECT manifest_digest FROM document_delete_executions WHERE operation_id=?', [id]);
    const n = calls.length;
    pendingResult(await engine({}, drivers.r2({ ...config, bucketName: `${run}-production` })).resume(id), 'NAMESPACE_MISMATCH');
    assert.equal(calls.length, n); assert.equal((await engine().resume(id)).status, 'COMPLETED');
    const [[after]] = await execute('SELECT manifest_digest FROM document_delete_executions WHERE operation_id=?', [id]); assert.equal(before.manifest_digest, after.manifest_digest);
  });
  await test('Finalized manifest tamper is rejected before IO', async () => {
    const f = await fixture(); const id = await reserve(f);
    await engine({ afterManifest: () => { throw new Error('synthetic crash'); } }).resume(id);
    await execute('UPDATE document_delete_file_manifest SET exact_storage_key=? WHERE delete_operation_id=?', [`${f.prefix}/wrong-target.pdf`, id]);
    const n = calls.length; pendingResult(await engine().resume(id), 'MANIFEST_CHANGED'); assert.equal(calls.length, n);
  });
  await test('Crash before manifest is non-destructive and safely resumable', async () => {
    const f = await fixture(); const id = await reserve(f); const n = calls.length;
    pendingResult(await engine({ beforeManifest: () => { throw new Error('synthetic'); } }).resume(id));
    assert.equal(calls.length, n); assert.equal((await engine().resume(id)).status, 'COMPLETED');
  });
  await test('Partial provider timeout remains durable UNKNOWN; repeated resume cannot repeat unknown delete or hard delete DB', async () => {
    const f = await fixture(); const id = await reserve(f); const n = calls.length; let attempts = 0;
    effect = async () => { if (++attempts === 2) throw Object.assign(new Error('synthetic timeout'), { code: 'ETIMEDOUT' }); };
    try { pendingResult(await engine().resume(id), 'ETIMEDOUT'); } finally { effect = null; }
    assert.equal(calls.length - n, 2); assert.equal(await count('engineering_documents','id', f.documentId), 1);
    pendingResult(await engine().resume(id), 'STORAGE_OUTCOME_UNRESOLVED'); assert.equal(calls.length - n, 2);
    const [states] = await execute(`SELECT a.state FROM document_delete_attempts a JOIN document_delete_file_manifest m ON m.id=a.manifest_id WHERE m.delete_operation_id=?`, [id]);
    assert.ok(states.some((r) => r.state === 'UNKNOWN')); assert.ok(states.some((r) => r.state === 'SUCCEEDED'));
  });
  await test('Two workers: connection-owned advisory claim allows only one external destructive step', async () => {
    const f = await fixture(); const id = await reserve(f); let release; let start;
    const started = new Promise((resolve) => { start = resolve; }); const proceed = new Promise((resolve) => { release = resolve; }); let first = true;
    effect = async () => { if (first) { first = false; start(); await proceed; } };
    const firstWorker = trackTask(engine().resume(id));
    try { await isolated.waitForSignal(started, firstWorker, 5000); pendingResult(await engine().resume(id), 'DELETE_WORKER_BUSY'); }
    finally { release(); effect = null; }
    assert.equal((await firstWorker).status, 'COMPLETED');
  });
  await test('DB rollback restores all metadata and final audit; retry needs no duplicate storage IO', async () => {
    const f = await fixture(); const id = await reserve(f); const n = calls.length;
    pendingResult(await engine({ beforeDatabaseCommit: () => { throw new Error('synthetic rollback'); } }).resume(id));
    assert.equal(await count('engineering_documents','id',f.documentId), 1); assert.equal(await count('stored_files','document_id',f.documentId), 4);
    assert.equal(await count('audit_trail','identity_key',`permanent-delete:${id}`), 0);
    assert.equal((await engine().resume(id)).status, 'COMPLETED'); assert.equal(calls.length - n, 4);
    assert.equal(await count('audit_trail','identity_key',`permanent-delete:${id}`), 1);
  });
  await test('Lost response after DB commit: durable completion and final audit are read without duplicate IO', async () => {
    const f = await fixture(); const id = await reserve(f); const n = calls.length;
    pendingResult(await engine({ afterDatabaseCommit: () => { throw new Error('synthetic response loss'); } }).resume(id));
    assert.equal(await count('engineering_documents','id',f.documentId), 0);
    assert.equal((await engine().resume(id)).status, 'COMPLETED'); assert.equal(calls.length - n, 4);
    assert.equal(await count('audit_trail','identity_key',`permanent-delete:${id}`), 1);
  });
  await test('Crash after durable IN_FLIGHT but before IO remains Pending; expired worker is not proof of completion', async () => {
    const f = await fixture(); const id = await reserve(f); const n = calls.length;
    pendingResult(await engine({ attemptPersisted: () => { throw new Error('synthetic crash'); } }).resume(id));
    pendingResult(await engine().resume(id), 'STORAGE_OUTCOME_UNRESOLVED'); assert.equal(calls.length, n);
    assert.equal(await count('engineering_documents','id',f.documentId), 1);
  });
  await test('Crash after provider ACK but before durable evidence remains UNKNOWN; never infer success from absence', async () => {
    const f = await fixture(); const id = await reserve(f); const n = calls.length;
    pendingResult(await engine({ afterPhysicalDelete: () => { throw new Error('synthetic crash'); } }).resume(id));
    pendingResult(await engine().resume(id), 'STORAGE_OUTCOME_UNRESOLVED'); assert.equal(calls.length - n, 1);
    assert.equal(await count('engineering_documents','id',f.documentId), 1);
  });
  await test('Local sandbox: unsupported race-safe deletion persists REJECTED and retains all metadata/files', async () => {
    const f = await fixture({ local: true }); const id = await reserve(f); const n = calls.length;
    pendingResult(await engine({}, drivers.local).resume(id), 'LOCAL_SAFE_DELETE_UNAVAILABLE');
    assert.equal(calls.length, n); assert.equal(await count('engineering_documents','id',f.documentId), 1);
    for (const key of f.keys) assert.equal(await fsp.readFile(path.join(sandbox, key), 'utf8'), 'synthetic');
  });
  await test('Evidence and diagnostic connections remain independent when all business slots are occupied', async () => {
    const f = await fixture(); const id = await reserve(f); const held = [];
    try {
      for (let i = 0; i < 5; i += 1) held.push(await pool.getConnection());
      const evidence = await isolated.bounded(coordination.readAdmissionState(f), 1500, 'Evidence pool starved');
      assert.equal(evidence.delete_operation_id, id);
      await isolated.bounded(diagnose(), 1500, 'Independent diagnostic pool starved');
    } finally { for (const c of held) c.release(); }
    return { businessSlotsHeld: 5, evidenceLimit: 2, diagnosticLimit: 1 };
  });
  await test('Concurrent reservation identities are idempotent or rejected, never duplicated', async () => {
    const f = await fixture();
    const operation = { id: `${f.prefix}-OP`, projectId: f.projectId, documentId: f.documentId,
      documentNumber: `${f.prefix}-NUMBER`, userId, requestIdentity: digest(f.prefix) };
    const [first, second] = await Promise.all([coordination.reserve(operation), coordination.reserve(operation)]);
    assert.equal(first.id, second.id);
    await assert.rejects(coordination.reserve({ ...operation, id: `${f.prefix}-OTHER`, requestIdentity: digest(`${f.prefix}-OTHER`) }), { code: 'DOCUMENT_DELETION_IN_PROGRESS' });
    assert.equal(await count('document_delete_operations','document_id',f.documentId), 1);
    assert.equal((await coordination.evaluateQuiescence(first.id)).status, 'QUIESCENCE_CONFIRMED');
    assert.equal((await engine().resume(first.id)).status, 'COMPLETED');
  });
  await test('Crash after storage before database transaction resumes without duplicate external IO', async () => {
    const f = await fixture(); const id = await reserve(f); const n = calls.length;
    pendingResult(await engine({ afterStorage: () => { throw new Error('Synthetic interruption'); } }).resume(id));
    assert.equal(await count('engineering_documents','id',f.documentId), 1);
    assert.equal(await count('audit_trail','identity_key',`permanent-delete:${id}`), 0);
    assert.equal((await engine().resume(id)).status, 'COMPLETED'); assert.equal(calls.length - n, 4);
  });
  await test('Owned missing object remains safely idempotent through exact-key provider ACK', async () => {
    const f = await fixture(); const id = await reserve(f); const n = calls.length;
    objects.delete(f.keys[0]);
    assert.equal((await engine().resume(id)).status, 'COMPLETED'); assert.equal(calls.length - n, 4);
  });
  await test('Normalized cross-document key alias blocks cleanup even when raw storage keys differ', async () => {
    const f = await fixture(); const other = await fixture();
    await execute('UPDATE stored_files SET storage_key=? WHERE file_id=?', [f.keys[0].replace(/\//g, '\\'), other.fileIds[0]]);
    const n = calls.length; pendingResult(await engine().resume(await reserve(f)), 'SHARED_STORAGE_KEY'); assert.equal(calls.length, n);
  });
  const reviewedRecord = async (f, index, d = driver) => {
    const captured = await d.captureNamespace();
    const observed = await d.inspectOwnedExact(f.keys[index], captured);
    return { source: 'OWNER_REVIEWED_STORAGE_INVENTORY', recordId: `${f.prefix}-proof-${index}`, fileId: f.fileIds[index],
      documentId: f.documentId, projectId: f.projectId, storageKey: f.keys[index], namespace: captured,
      sha256: digest('synthetic'), size: 9, ...(d === drivers.local ? { localIdentity: observed } : {}) };
  };
  const bindingFor = (d = driver) => createBindingService({ pool, coordination, storage: storageFor(d) });
  const bind = async (f, id, index, d = driver, patch = {}) => bindingFor(d).bind({ operationId: id, actorUserId: userId,
    reviewed: { ...await reviewedRecord(f, index, d), ...patch } });
  await test('Reviewed existing local provenance binds revisions, attachments, direct files; native cleanup completes; other document survives', async () => {
    const f = await fixture({ unbound: true, local: true }); const other = await fixture({ local: true }); const id = await reserve(f);
    for (let i = 0; i < 4; i += 1) assert.equal((await bind(f, id, i, drivers.local)).status, 'BOUND');
    assert.equal((await bind(f, id, 0, drivers.local)).status, 'ALREADY_BOUND');
    const [duplicate, result] = await Promise.all([engine({}, drivers.local).resume(id), engine({}, drivers.local).resume(id)]);
    assert.ok([duplicate.status, result.status].includes('COMPLETED'));
    assert.equal((await engine({}, drivers.local).resume(id)).status, 'COMPLETED');
    for (const key of f.keys) await assert.rejects(fsp.stat(path.join(sandbox, key)), { code: 'ENOENT' });
    for (const key of other.keys) assert.equal(await fsp.readFile(path.join(sandbox, key), 'utf8'), 'synthetic');
    assert.equal(await count('engineering_documents','id',other.documentId), 1);
  });
  await test('Reviewed R2 development provenance binds per file, remains read-only during binding, then deletes exact namespace', async () => {
    const f = await fixture({ unbound: true }); const id = await reserve(f); const n = calls.length;
    for (let i = 0; i < 4; i += 1) assert.equal((await bind(f, id, i)).status, 'BOUND');
    assert.equal((await bind(f, id, 0)).status, 'ALREADY_BOUND');
    assert.equal(calls.length, n); for (const key of f.keys) assert.equal(objects.get(key), 'synthetic');
    assert.equal((await engine().resume(id)).status, 'COMPLETED'); assert.equal(calls.length - n, 4);
  });
  await test('Missing/ambiguous provenance, conflicting metadata, wrong project and namespace never bind or delete', async () => {
    const f = await fixture({ unbound: true }); const id = await reserve(f); const n = calls.length;
    await assert.rejects(bindingFor().bind({ operationId: id, actorUserId: userId }), { code: 'FILE_PROVENANCE_REQUIRED' });
    await assert.rejects(bind(f, id, 0, driver, { source: 'CURRENT_ENVIRONMENT' }), { code: 'FILE_PROVENANCE_REQUIRED' });
    await assert.rejects(bind(f, id, 0, driver, { size: 10 }), { code: 'FILE_PROVENANCE_CONFLICT' });
    await assert.rejects(bind(f, id, 0, driver, { projectId: 'OTHER' }), { code: 'FILE_PROVENANCE_CONFLICT' });
    const wrong = drivers.r2({ ...config, bucketName: `${run}-production` });
    await assert.rejects(bind(f, id, 0, driver, { namespace: await wrong.captureNamespace() }), { code: 'NAMESPACE_MISMATCH' });
    assert.equal(await count('stored_file_namespace_bindings','file_id',f.fileIds[0]), 0); assert.equal(calls.length, n);
  });
  await test('Reviewed R2 production provenance uses a distinct explicit fake namespace, never development bucket', async () => {
    const f = await fixture({ unbound: true }); const id = await reserve(f); const requests = [];
    const production = loadDrivers({ root: sandbox, send: async (command) => {
      requests.push(command); assert.equal(command.input.Bucket, `${run}-production`);
      assert.ok(f.keys.includes(command.input.Key));
      return command.command === 'GetObjectCommand' ? { Body: [Buffer.from('synthetic')] } : {};
    } }).r2({ ...config, bucketName: `${run}-production` });
    for (let i = 0; i < 4; i += 1) assert.equal((await bind(f, id, i, production)).status, 'BOUND');
    assert.ok(requests.every((command) => command.command === 'GetObjectCommand'));
    assert.equal((await engine({}, production).resume(id)).status, 'COMPLETED');
    assert.equal(requests.filter((command) => command.command === 'DeleteObjectCommand').length, 4);
  });
  await test('Binding requires active project Admin and cannot change provenance after finalized manifest', async () => {
    const f = await fixture({ unbound: true }); const id = await reserve(f); const proof = await reviewedRecord(f, 0);
    await assert.rejects(bindingFor().bind({ operationId: id, actorUserId: 0, reviewed: proof }), { code: 'BINDING_ADMIN_REQUIRED' });
    for (let i = 0; i < 4; i += 1) await bind(f, id, i);
    pendingResult(await engine({ afterManifest: () => { throw new Error('Synthetic interruption'); } }).resume(id));
    await assert.rejects(bind(f, id, 0, driver, { recordId: `${f.prefix}-other-proof` }), { code: 'MANIFEST_ALREADY_FINALIZED' });
    assert.equal((await engine().resume(id)).status, 'COMPLETED');
  });
  await test('Shared ownership is rejected before binding storage reads; unrelated binding remains untouched', async () => {
    const f = await fixture({ unbound: true }); const other = await fixture(); const id = await reserve(f);
    const proof = await reviewedRecord(f, 0); let inspected = 0;
    await execute('UPDATE engineering_documents SET active_file_id=? WHERE id=?', [f.fileIds[0], other.documentId]);
    const service = createBindingService({ pool, coordination, storage: { captureNamespace: () => driver.captureNamespace(),
      inspectOwnedExact: async () => { inspected += 1; throw new Error('Must not inspect shared file'); } } });
    await assert.rejects(service.bind({ operationId: id, actorUserId: userId, reviewed: proof }), { code: 'SHARED_FILE_REFERENCE' });
    assert.equal(inspected, 0); assert.equal(await count('stored_file_namespace_bindings','file_id',other.fileIds[0]), 1);
  });
  await test('Native local crash after storage and before database commit recovers without repeated physical IO', async () => {
    const f = await fixture({ local: true }); const id = await reserve(f);
    for (let i = 0; i < 4; i += 1) await bind(f, id, i, drivers.local);
    pendingResult(await engine({ afterStorage: () => { throw new Error('Synthetic interruption'); } }, drivers.local).resume(id));
    assert.equal(await count('engineering_documents','id',f.documentId), 1);
    assert.equal((await engine({}, drivers.local).resume(id)).status, 'COMPLETED');
    assert.equal(await count('audit_trail','identity_key',`permanent-delete:${id}`), 1);
  });
  await test('Native local replacement causes partial cleanup Pending; restored exact identity allows safe recovery', async () => {
    const f = await fixture({ local: true }); const id = await reserve(f);
    for (let i = 0; i < 4; i += 1) await bind(f, id, i, drivers.local);
    let original; let retained; let first;
    pendingResult(await engine({ afterManifest: async () => {
      const [manifest] = await execute('SELECT exact_storage_key FROM document_delete_file_manifest WHERE delete_operation_id=? ORDER BY id', [id]);
      first = path.join(sandbox, manifest[0].exact_storage_key);
      original = path.join(sandbox, manifest[1].exact_storage_key); retained = `${original}.retained`;
      await fsp.rename(original, retained); await fsp.writeFile(original, 'synthetic');
    } }, drivers.local).resume(id), 'LOCAL_IDENTITY_MISMATCH');
    await assert.rejects(fsp.stat(first), { code: 'ENOENT' });
    assert.equal(await count('engineering_documents','id',f.documentId), 1);
    // Exact fixture paths only. Restore the original inode, not an alternate file with equal bytes.
    await fsp.unlink(original); await fsp.rename(retained, original);
    assert.equal((await engine({}, drivers.local).resume(id)).status, 'COMPLETED');
  });
  await test('Native local crash after disposition before durable evidence stays Unknown and does not auto-repeat delete', async () => {
    const f = await fixture({ local: true }); const id = await reserve(f);
    for (let i = 0; i < 4; i += 1) await bind(f, id, i, drivers.local);
    pendingResult(await engine({ afterPhysicalDelete: () => { throw new Error('Synthetic interruption'); } }, drivers.local).resume(id));
    const [[first]] = await execute('SELECT exact_storage_key FROM document_delete_file_manifest WHERE delete_operation_id=? ORDER BY id LIMIT 1', [id]);
    await assert.rejects(fsp.stat(path.join(sandbox, first.exact_storage_key)), { code: 'ENOENT' });
    pendingResult(await engine({}, drivers.local).resume(id), 'STORAGE_OUTCOME_UNRESOLVED');
    assert.equal(await count('engineering_documents','id',f.documentId), 1);
    for (const key of f.keys.filter((key) => key !== first.exact_storage_key)) assert.equal(await fsp.readFile(path.join(sandbox, key), 'utf8'), 'synthetic');
  });
  if (sprintC) await require('./sprintCNotificationScenarios.cjs')({ test, fixture, reserve, engine, execute, count, pool, coordination, driver, userId, run, root });
  if (sprintD) await require('./sprintDApiScenarios.cjs')({ test, fixture, engine, execute, count, pool, coordination, driver, userId, run, root, calls });
  await test('No unrelated baseline business row changed or disappeared; globals/FK checks remain unchanged', async () => {
    for (const [table, originals] of baseline) {
      const current = new Set((await execute(`SELECT * FROM ${table}`))[0].map(JSON.stringify));
      assert.ok(originals.every((row) => current.has(row)), `Existing synthetic Sprint A rows changed in ${table}`);
    }
    const [[settings]] = await execute('SELECT @@GLOBAL.sql_mode sql_mode,@@GLOBAL.time_zone time_zone,@@foreign_key_checks fk');
    assert.equal(settings.sql_mode, server.sql_mode); assert.equal(settings.time_zone, server.time_zone); assert.equal(settings.fk, 1);
    results.baselineRowsPreserved = true;
  });
  results.fixturePolicy = 'Only this run synthetic target documents were hard-deleted; surviving fixtures and sandbox intentionally retained. No DROP/TRUNCATE/reset.';
};

main().catch((error) => { results.fatal = { code: error.code, error: error.message, stack: error.stack }; }).finally(async () => {
  stopping = true;
  try { await isolated.bounded(Promise.allSettled([...tasks]), 2000, 'Outstanding tasks did not settle'); }
  catch (error) { cleanupErrors.push({ stage: 'tasks', code: error.code }); destroyClients(); }
  const pools = [rawPool, rawEvidencePool, rawDiagnosticPool].filter(Boolean);
  let poolsClosed = false;
  try {
    const closed = await isolated.bounded(Promise.allSettled(pools.map((p) => p.end())), 3000, 'Pool shutdown deadline');
    poolsClosed = closed.every((r) => r.status === 'fulfilled');
    if (!poolsClosed) cleanupErrors.push({ stage: 'pool', code: 'POOL_CLOSE_REJECTED' });
  } catch (error) {
    cleanupErrors.push({ stage: 'pool', code: error.code }); destroyClients();
    for (const pool of pools) {
      const all = pool.pool._allConnections;
      for (let i = 0; i < all.length; i += 1) all.get(i).destroy();
    }
  }
  results.shutdown = { poolsClosed, unresolvedTasks: tasks.size, cleanupErrors };
  results.finishedAt = new Date().toISOString(); results.passed = results.tests.filter((t) => t.result === 'PASS').length;
  results.failed = results.tests.filter((t) => t.result === 'FAIL').length + (results.fatal ? 1 : 0) + cleanupErrors.length;
  fs.writeFileSync(output, `${JSON.stringify(results, null, 2)}\n`);
  console.log(JSON.stringify({ passed: results.passed, failed: results.failed, fatal: results.fatal || null }));
  if (results.failed) process.exitCode = 1;
});
