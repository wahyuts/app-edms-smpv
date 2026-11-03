const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');
const vm = require('node:vm');
const crypto = require('node:crypto');
const asyncHooks = require('node:async_hooks');
const { setTimeout: delay } = require('node:timers/promises');
const mysql = require('mysql2/promise');
const isolated = require('../helpers/isolatedMariaDb.cjs');

const root = path.resolve(__dirname, '../../../..');
const sourceRoot = path.join(root, 'apps/backend/src');
const database = isolated.database;
const owner = 'app-edms-smpv:Sprint-A-database-validation';
const run = `SA-${Date.now()}-${crypto.randomBytes(3).toString('hex')}`;
const output = path.join(root, `database/migration/reports/20261102_${process.argv.includes('--sprint-d-regression') ? '0006' : process.argv.includes('--sprint-c-regression') ? '0005' : process.argv.includes('--final-local-cleanup') ? '0004' : '0003'}_sprint_a_isolated_results.json`);
const digest = (value) => crypto.createHash('sha256').update(value).digest('hex');
const results = { run, database, startedAt: new Date().toISOString(), tests: [], connectionIds: [] };
const ownedConnections = new Set();
const allPools = [];
const allConnections = new Set();
const handledConnections = new WeakSet();
const errors = [];
const activeTasks = new Set();
const rawClients = new Set();
let aborted = false;

// A small SQL statement scanner, not a SQL rewriter. Quoted literals/identifiers
// and comments are preserved so semicolons inside them cannot split statements.
const statements = (source) => {
  const output = []; let buffer = ''; let quote = null; let lineComment = false; let blockComment = false;
  for (let i = 0; i < source.length; i += 1) {
    const char = source[i]; const next = source[i + 1];
    if (lineComment) { if (char === '\n') { lineComment = false; buffer += '\n'; } continue; }
    if (blockComment) { if (char === '*' && next === '/') { blockComment = false; i += 1; } continue; }
    if (quote) {
      buffer += char;
      if (char === '\\') { buffer += next || ''; i += 1; }
      else if (char === quote && next === quote) { buffer += next; i += 1; }
      else if (char === quote) quote = null;
    } else if (char === '-' && next === '-' && /\s/.test(source[i + 2] || ' ')) { lineComment = true; i += 1; }
    else if (char === '/' && next === '*') { blockComment = true; i += 1; }
    else if (char === "'" || char === '"' || char === '`') { quote = char; buffer += char; }
    else if (char === ';') { if (buffer.trim()) output.push(buffer.trim()); buffer = ''; }
    else buffer += char;
  }
  assert.ok(!quote && !blockComment, 'Unterminated SQL token');
  if (buffer.trim()) output.push(buffer.trim());
  return output;
};

const allowedSql = (sql) => {
  assert.equal(typeof sql, 'string');
  assert.ok(!/^\s*(DROP|TRUNCATE|DELETE|REPLACE|USE|CREATE\s+DATABASE|KILL)\b/i.test(sql), 'Forbidden test SQL');
  assert.ok(!/\bedms_(?:db|dev|prod|staging|smpv_dev)\b/i.test(sql), 'Protected database identifier');
  assert.ok(!/SET\s+GLOBAL|FOREIGN_KEY_CHECKS\s*=\s*0/i.test(sql), 'Global/constraint configuration forbidden');
};

const facade = async (connection, timeZone = '+00:00') => {
  if (aborted) { connection.destroy(); throw new Error('Isolated test run aborted'); }
  await isolated.verify(connection, database);
  rawClients.add(connection);
  assert.ok(['+00:00', '+07:00'].includes(timeZone));
  await connection.query('SET SESSION time_zone = ?', [timeZone]);
  await connection.query('SET SESSION innodb_lock_wait_timeout = 2');
  const [[identity]] = await connection.query('SELECT DATABASE() db, CONNECTION_ID() id');
  assert.equal(identity.db, database);
  ownedConnections.add(identity.id); results.connectionIds.push(identity.id);
  const eventTarget = connection.connection || connection;
  if (!handledConnections.has(eventTarget)) {
    connection.on('error', () => {}); handledConnections.add(eventTarget);
  }
  return {
    query: (sql, params) => { allowedSql(sql); return connection.query(sql, params); },
    execute: (sql, params) => { allowedSql(sql); return connection.execute(sql, params); },
    beginTransaction: () => connection.beginTransaction(), commit: () => connection.commit(), rollback: () => connection.rollback(),
    release: () => connection.release(), end: () => connection.end(), destroy: () => connection.destroy(), id: identity.id,
  };
};

let credentials;
const makeConnection = async () => {
  const raw = await mysql.createConnection({ ...credentials, database });
  const c = await facade(raw); allConnections.add(c); return c;
};
const makePool = (limit, timeZone = '+00:00') => {
  const raw = mysql.createPool({ ...credentials, database, connectionLimit: limit, waitForConnections: true, queueLimit: 0 });
  allPools.push(raw);
  return { getConnection: async () => facade(await raw.getConnection(), timeZone),
    execute: async (sql, params) => {
      const c = await facade(await raw.getConnection(), timeZone);
      try { return await c.execute(sql, params); } finally { c.release(); }
    } };
};

const loadBackend = (businessPool, evidencePool) => {
  const cache = new Map();
  const mocks = new Map([
    ['config/database.js', { pool: businessPool }], ['config/documentCoordinationDatabase.js', { pool: evidencePool }],
    ['config/logger.js', { error() {}, log() {} }],
  ]);
  const allowed = new Set(['repositories/documentCoordination.repository.js', 'services/documentAdmission.service.js',
    'repositories/document.repository.js', 'repositories/projectMembership.repository.js', 'repositories/project.repository.js',
    'repositories/notification.repository.js', 'repositories/notificationWrite.repository.js', 'repositories/sla.repository.js', 'utils/jsonMetadata.js',
    'constants/administration.constants.js']);
  const load = (file) => {
    if (mocks.has(file)) return mocks.get(file);
    assert.ok(allowed.has(file), `Runtime module blocked: ${file}`);
    if (cache.has(file)) return cache.get(file).exports;
    const filename = path.join(sourceRoot, file); const module = { exports: {} }; cache.set(file, module);
    const requireIsolated = (request) => {
      if (request === 'node:crypto') return crypto;
      if (request === 'node:async_hooks') return asyncHooks;
      assert.ok(request.startsWith('.'), `External runtime dependency blocked: ${request}`);
      return load(path.relative(sourceRoot, path.resolve(path.dirname(filename), `${request}.js`)).split(path.sep).join('/'));
    };
    new vm.Script(fs.readFileSync(filename, 'utf8'), { filename }).runInNewContext({
      module, exports: module.exports, require: requireIsolated, Date, Buffer,
    });
    return module.exports;
  };
  return { repository: load('repositories/documentCoordination.repository.js'), service: load('services/documentAdmission.service.js'),
    documents: load('repositories/document.repository.js'), projects: load('repositories/project.repository.js'),
    notifications: load('repositories/notification.repository.js'), sla: load('repositories/sla.repository.js') };
};

const deferred = () => { let resolve; const promise = new Promise((done) => { resolve = done; }); return { promise, resolve }; };
const test = async (name, callback) => {
  const start = Date.now();
  results.currentTest = name;
  const task = Promise.resolve().then(callback); activeTasks.add(task);
  task.then(() => activeTasks.delete(task), () => activeTasks.delete(task));
  try { const evidence = await isolated.bounded(task, 15000, 'Isolated Sprint A test deadline'); results.tests.push({ name, result: 'PASS', milliseconds: Date.now() - start, evidence }); }
  catch (error) {
    aborted = true;
    results.tests.push({ name, result: 'FAIL', milliseconds: Date.now() - start, code: error.code || null, error: error.message }); errors.push(name);
    for (const client of rawClients) client.destroy();
    throw error;
  }
  console.log(`${results.tests.at(-1).result}: ${name}`);
};

const main = async () => {
  assert.ok(process.argv.includes('--execute-local-test-only'), 'Explicit execution flag required');
  assert.ok(process.argv.includes('--isolated-instance'), 'Original XAMPP execution is disabled; isolated instance flag required');
  credentials = isolated.target('synthetic');
  const bootstrap = await mysql.createConnection(credentials);
  const schema = fs.readFileSync(path.join(root, 'database/schema/schema-dev.sql'), 'utf8');
  const migration = fs.readFileSync(path.join(root, 'database/migration/20261102_0001_permanent_delete_foundation_mariadb.sql'), 'utf8');
  const schemaHash = digest(schema); const migrationHash = digest(migration);
  try {
    await isolated.verify(bootstrap);
    const [[identity]] = await bootstrap.query('SELECT VERSION() version, @@hostname hostname, @@port port, @@tx_isolation isolation_level, @@sql_mode sql_mode, @@GLOBAL.sql_mode global_sql_mode, @@innodb_page_size page_size, @@time_zone time_zone, @@GLOBAL.time_zone global_time_zone');
    assert.equal(identity.version, '10.4.32-MariaDB'); assert.equal(identity.port, isolated.port);
    assert.equal(identity.hostname.toLowerCase(), os.hostname().toLowerCase());
    results.server = identity;
    const [[engine]] = await bootstrap.query("SELECT SUPPORT FROM information_schema.ENGINES WHERE ENGINE = 'InnoDB'");
    assert.ok(['YES', 'DEFAULT'].includes(engine.SUPPORT));
    const [existing] = await bootstrap.execute('SELECT SCHEMA_NAME FROM information_schema.SCHEMATA WHERE SCHEMA_NAME = ?', [database]);
    results.createdDatabase = existing.length === 0;
    if (!existing.length) await bootstrap.query(`CREATE DATABASE \`${database}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`);
  } finally { await bootstrap.end(); }

  const admin = await makeConnection();
  if (results.createdDatabase) {
    await admin.query(`CREATE TABLE sprint_a_test_ownership (
      id VARCHAR(128) PRIMARY KEY, schema_hash CHAR(64) NOT NULL, migration_hash CHAR(64) NOT NULL,
      state VARCHAR(32) NOT NULL, created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3)) ENGINE=InnoDB`);
    await admin.execute('INSERT INTO sprint_a_test_ownership (id,schema_hash,migration_hash,state) VALUES (?,?,?,?)', [owner, schemaHash, migrationHash, 'INITIALIZING']);
    const ddl = statements(schema);
    assert.match(ddl.shift(), /^CREATE DATABASE IF NOT EXISTS edms_smpv_dev\b/);
    assert.equal(ddl.shift(), 'USE edms_smpv_dev');
    for (const sql of ddl) { assert.match(sql, /^(CREATE TABLE|ALTER TABLE) [a-z_]+\s/i); await admin.query(sql); }
    for (const sql of statements(migration)) { assert.match(sql, /^CREATE TABLE document_/); await admin.query(sql); }
    await admin.execute("UPDATE sprint_a_test_ownership SET state = 'READY' WHERE id = ?", [owner]);
  } else {
    const [[marker]] = await admin.execute('SELECT * FROM sprint_a_test_ownership WHERE id = ?', [owner]);
    assert.ok(marker, 'STOP: existing database ownership not verified');
    assert.equal(marker.state, 'READY', 'STOP: incomplete prior initialization requires owner review');
    assert.equal(marker.schema_hash, schemaHash); assert.equal(marker.migration_hash, migrationHash);
  }
  results.schemaHash = schemaHash; results.migrationHash = migrationHash;
  const [[sessionSettings]] = await admin.query('SELECT @@sql_mode sql_mode, @@tx_isolation isolation_level, @@time_zone time_zone');
  results.testSessionSettings = sessionSettings;
  const businessPool = makePool(4); const evidencePool = makePool(2);
  const backend = loadBackend(businessPool, evidencePool);
  const { repository: repo, service, documents, projects, notifications, sla } = backend;
  const [role] = await admin.execute('INSERT INTO roles (role_code,role_name) VALUES (?,?)', [`ROLE-${run}`, 'Admin']);
  const userIds = [];
  for (let n = 0; n < 2; n += 1) {
    const [u] = await admin.execute('INSERT INTO users (user_code,username,full_name,email,role_id) VALUES (?,?,?,?,?)',
      [`${run}-U${n}`, `${run}-user${n}`, `Synthetic Test Admin ${n}`, null, role.insertId]);
    userIds.push(u.insertId);
  }
  let sequence = 0; const projectIds = new Map();
  const doc = async (name, options = {}) => {
    const projectName = options.project || name;
    let projectId = projectIds.get(projectName);
    if (!projectId) {
      projectId = `${run}-P${projectIds.size}`; projectIds.set(projectName, projectId);
      await admin.execute('INSERT INTO projects (id,project_code,project_name,created_by_user_id) VALUES (?,?,?,?)', [projectId, projectId, 'Synthetic Sprint A Test', userIds[0]]);
      for (let n = 0; n < userIds.length; n += 1) await admin.execute(
        'INSERT INTO project_memberships (id,project_id,user_id,official_role) VALUES (?,?,?,?)', [`${projectId}-M${n}`, projectId, userIds[n], 'Admin']);
    }
    const documentId = `${run}-D${sequence++}`;
    await admin.execute(`INSERT INTO engineering_documents
      (id,project_id,document_number,description,drawing,area,days_until_validation,workflow_status,revision_label,responsible_role,created_by_user_id,sla_started_at)
      VALUES (?,?,?,'before','PFD','TEST',5,?,?,?, ?,UTC_TIMESTAMP(3))`,
    [documentId, projectId, documentId, options.status || 'Process Review',
      options.status === 'Approved' ? 'AS-Built' : 'IFR-Submitted',
      options.status === 'Approved' ? 'None' : 'Team Process', userIds[0]]);
    return { projectId, documentId, documentNumber: documentId };
  };
  const reserve = (scope, identity = crypto.randomUUID()) => repo.reserve({ ...scope, id: crypto.randomUUID(), userId: userIds[0], requestIdentity: digest(identity) });
  const writer = (scope) => ({ ...scope, id: crypto.randomUUID(), type: 'DATABASE_TEST' });
  const denied = (error) => error.code === 'DOCUMENT_DELETION_IN_PROGRESS';
  const value = async (scope) => (await admin.execute('SELECT description FROM engineering_documents WHERE id = ?', [scope.documentId]))[0][0].description;
  const killOwned = async (id) => {
    assert.ok(ownedConnections.has(id), 'Cannot kill a connection not owned by this test');
    // Dedicated control connection; the only allowed KILL bypass is this validated numeric ID.
    const control = await mysql.createConnection({ ...credentials, database });
    try {
      const [rows] = await control.execute('SELECT ID, DB FROM information_schema.PROCESSLIST WHERE ID = ?', [id]);
      assert.equal(rows[0]?.DB, database);
      await control.query(`KILL CONNECTION ${Number(id)}`);
    } finally { await control.end(); }
  };

  await test('Migration: five InnoDB tables, generated claim, indexes and schema equivalence', async () => {
    const [tables] = await admin.execute("SELECT TABLE_NAME,ENGINE FROM information_schema.TABLES WHERE TABLE_SCHEMA = ? AND TABLE_NAME IN ('document_admission_coordinators','document_delete_operations','document_writer_operations','document_storage_io_steps','document_delete_file_manifest')", [database]);
    assert.equal(tables.length, 5); assert.ok(tables.every((t) => t.ENGINE === 'InnoDB'));
    const [columns] = await admin.execute("SELECT EXTRA,GENERATION_EXPRESSION FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'document_writer_operations' AND COLUMN_NAME = 'active_temporary_file_id'", [database]);
    assert.match(columns[0].EXTRA, /STORED GENERATED/);
    const [[indexes]] = await admin.query('SHOW CREATE TABLE document_writer_operations');
    assert.match(indexes['Create Table'], /uq_document_writer_temporary_claim/);
    const expectedIndexes = {
      document_admission_coordinators: { PRIMARY: 'project_id,document_id' },
      document_delete_operations: { PRIMARY: 'id', uq_document_delete_identity: 'project_id,document_id,request_identity',
        uq_document_delete_target: 'project_id,document_id', idx_document_delete_pending: 'status,created_at' },
      document_writer_operations: { PRIMARY: 'id', uq_document_writer_temporary_claim: 'active_temporary_file_id',
        idx_document_writer_target: 'project_id,document_id,lifecycle_state' },
      document_storage_io_steps: { PRIMARY: 'id', idx_document_io_writer: 'writer_id,state' },
      document_delete_file_manifest: { PRIMARY: 'id', uq_document_manifest_key: 'delete_operation_id,provider,storage_key_hash' },
    };
    for (const [table, expected] of Object.entries(expectedIndexes)) {
      const [actual] = await admin.execute(`SELECT INDEX_NAME,GROUP_CONCAT(COLUMN_NAME ORDER BY SEQ_IN_INDEX SEPARATOR ',') column_names
        FROM information_schema.STATISTICS WHERE TABLE_SCHEMA = ? AND TABLE_NAME = ? GROUP BY INDEX_NAME`, [database, table]);
      for (const [index, names] of Object.entries(expected)) assert.equal(actual.find((r) => r.INDEX_NAME === index)?.column_names, names);
    }
    const mysqlMigration = fs.readFileSync(path.join(root, 'database/migration/20261102_0001_permanent_delete_foundation_mysql.sql'), 'utf8');
    assert.deepEqual(statements(mysqlMigration).map((s) => s.replace(/\bSTORED\b/g, 'PERSISTENT')), statements(migration));
    return { tables, generated: columns[0], verifiedIndexes: 12,
      canonicalBusinessTables: statements(schema).filter((s) => s.startsWith('CREATE TABLE')).length };
  });

  await test('Constraints: invalid states and missing fields are rejected', async () => {
    const s = await doc('constraints');
    const bad = [
      ["INSERT INTO document_admission_coordinators (project_id,document_id,gate_state) VALUES (?,?,'INVALID')", [s.projectId, s.documentId]],
      ["INSERT INTO document_writer_operations (id,project_id,document_id,writer_type,generation,lifecycle_state) VALUES (?,?,?,'TEST',1,'INVALID')", [crypto.randomUUID(), s.projectId, s.documentId]],
      ["INSERT INTO document_writer_operations (id,project_id,document_id,writer_type,generation,db_outcome) VALUES (?,?,?,'TEST',1,'INVALID')", [crypto.randomUUID(), s.projectId, s.documentId]],
      ["INSERT INTO document_writer_operations (id,writer_type,generation) VALUES (?,'TEST',1)", [crypto.randomUUID()]],
      ["INSERT INTO document_delete_operations (id,project_id,document_id,document_number_snapshot,initiated_by_user_id,request_identity,status) VALUES (?,?,?,?,?,?,'INVALID')", [crypto.randomUUID(), s.projectId, s.documentId, s.documentNumber, userIds[0], digest('bad')]],
      ["INSERT INTO document_storage_io_steps (id,writer_id,provider,operation_type,state) VALUES (?,'test','r2','COPY','INVALID')", [crypto.randomUUID()]],
      ["INSERT INTO document_delete_file_manifest (id,delete_operation_id,provider,exact_storage_key,storage_key_hash,ownership_evidence,cleanup_state) VALUES (?,'test','r2','synthetic',?,'{}','INVALID')", [crypto.randomUUID(), digest('bad')]],
    ];
    for (const [sql, params] of bad) await assert.rejects(admin.execute(sql, params), (e) => e.errno === 4025);
    return { rejectedStates: bad.length };
  });

  await test('Unique constraints: active temp claim, operation target and manifest exact-key identity', async () => {
    const s = await doc('unique'); const w = { ...writer(s), temporaryFileId: `${run}-TEMP` };
    await repo.admitWriter(w);
    await assert.rejects(repo.admitWriter({ ...writer(s), temporaryFileId: w.temporaryFileId }), (e) => e.code === 'TEMPORARY_UPLOAD_IN_USE');
    await repo.finishWriter({ id: w.id, scope: s, dbOutcome: 'NOT_STARTED', uncertain: false });
    await repo.admitWriter({ ...writer(s), temporaryFileId: w.temporaryFileId });
    const operation = await reserve(s);
    await assert.rejects(admin.execute(`INSERT INTO document_delete_operations
      (id,project_id,document_id,document_number_snapshot,initiated_by_user_id,request_identity)
      VALUES (?,?,?,?,?,?)`, [crypto.randomUUID(), s.projectId, s.documentId, s.documentNumber, userIds[0], digest('different-direct-insert')]), (e) => e.code === 'ER_DUP_ENTRY');
    await assert.rejects(admin.execute('INSERT INTO document_admission_coordinators (project_id,document_id) VALUES (?,?)',
      [s.projectId, s.documentId]), (e) => e.code === 'ER_DUP_ENTRY');
    const params = [crypto.randomUUID(), operation.id, digest('legacy/outside-prefix')];
    await admin.execute("INSERT INTO document_delete_file_manifest (id,delete_operation_id,provider,exact_storage_key,storage_key_hash,ownership_evidence) VALUES (?,?,'r2','legacy/outside-prefix',?,'{\"synthetic\":true}')", params);
    await assert.rejects(admin.execute("INSERT INTO document_delete_file_manifest (id,delete_operation_id,provider,exact_storage_key,storage_key_hash,ownership_evidence) VALUES (?,?,'r2','legacy/outside-prefix',?,'{}')", [crypto.randomUUID(), operation.id, params[2]]), (e) => e.code === 'ER_DUP_ENTRY');
  });

  await test('Atomic ordering: admitted writer drains; new writer after reservation is rejected', async () => {
    const s = await doc('ordering'); const w = writer(s); await repo.admitWriter(w); const op = await reserve(s);
    await assert.rejects(repo.admitWriter(writer(s)), denied);
    assert.equal((await repo.evaluateQuiescence(op.id)).status, 'QUIESCENCE_PENDING');
    const c = await makeConnection();
    await c.beginTransaction(); await repo.assertGate(c, s, w.id);
    await c.execute("UPDATE engineering_documents SET description = 'drained' WHERE id = ?", [s.documentId]); await c.commit();
    await repo.finishWriter({ id: w.id, scope: s, dbOutcome: 'COMMITTED', uncertain: false });
    assert.equal((await repo.evaluateQuiescence(op.id)).status, 'QUIESCENCE_CONFIRMED');
    assert.equal(await value(s), 'drained');
    await assert.rejects(repo.transaction((c) => repo.assertGate(c, s, w.id)), denied);
  });

  await test('Lock contention: reservation waits for a held coordinator lock without bypass', async () => {
    const s = await doc('contention'); const c = await makeConnection(); await c.beginTransaction(); await repo.lockGate(c, s);
    let settled = false; const pending = reserve(s).finally(() => { settled = true; }); pending.catch(() => {});
    await delay(100); assert.equal(settled, false); await c.commit();
    assert.equal((await pending).status, 'QUIESCENCE_PENDING');
  });

  await test('Simultaneous admission/reservation: 20 real multi-connection races serialize safely', async () => {
    let before = 0; let after = 0;
    for (let n = 0; n < 20; n += 1) {
      const s = await doc(`race${n}`); const w = writer(s);
      const [a, b] = n % 2 === 0
        ? await Promise.allSettled([repo.admitWriter(w), reserve(s)])
        : await Promise.allSettled([reserve(s), repo.admitWriter(w)]).then(([reserved, admitted]) => [admitted, reserved]);
      assert.equal(b.status, 'fulfilled');
      if (a.status === 'fulfilled') {
        before += 1; assert.equal((await repo.evaluateQuiescence(b.value.id)).status, 'QUIESCENCE_PENDING');
        await repo.finishWriter({ id: w.id, scope: s, dbOutcome: 'NOT_STARTED', uncertain: false });
      } else { after += 1; assert.ok(denied(a.reason)); }
      await assert.rejects(repo.admitWriter(writer(s)), denied);
      assert.equal((await repo.evaluateQuiescence(b.value.id)).status, 'QUIESCENCE_CONFIRMED');
    }
    return { writerBefore: before, writerRejected: after };
  });

  await test('Concurrent Admin reservation: same identity idempotent, different identity conflicts', async () => {
    const s = await doc('admins');
    const requests = userIds.map((actorUserId) => service.reserveDelete({ activeProject: { id: s.projectId }, actorUserId, documentId: s.documentId, requestIdentity: 'same-request' }));
    const [a, b] = await Promise.all(requests); assert.equal(a.id, b.id);
    await assert.rejects(service.reserveDelete({ activeProject: { id: s.projectId }, actorUserId: userIds[1], documentId: s.documentId, requestIdentity: 'other-request' }), denied);
    const [[count]] = await admin.execute('SELECT COUNT(*) n FROM document_delete_operations WHERE project_id = ? AND document_id = ?', [s.projectId, s.documentId]); assert.equal(count.n, 1);
  });

  await test('Writer lifecycle: SQL/IO/post-commit drain and no detached mutation after confirmed', async () => {
    const s = await doc('drain'); const started = deferred(); const proceed = deferred(); const late = deferred(); let continuation;
    const pending = service.runWriter({ ...s, type: 'DATABASE_TEST' }, async () => {
      started.resolve(); await proceed.promise;
      await service.trackIo({ type: 'COPY', provider: 'r2', sourceKey: 'synthetic/source', destinationKey: `synthetic/${s.documentId}` }, async () => {});
      await documents.runInTransaction((c) => c.execute("UPDATE engineering_documents SET description = 'drain lifecycle' WHERE id = ?", [s.documentId]));
      await service.mutate(s, (c) => c.execute("UPDATE engineering_documents SET area = 'POST-COMMIT' WHERE id = ?", [s.documentId]));
      continuation = late.promise.then(() => assert.rejects(service.mutate(s, (c) => c.execute("UPDATE engineering_documents SET description = 'unsafe' WHERE id = ?", [s.documentId])), denied));
    });
    await started.promise; const op = await reserve(s);
    assert.equal((await repo.evaluateQuiescence(op.id)).status, 'QUIESCENCE_PENDING');
    proceed.resolve(); await pending;
    assert.equal((await repo.evaluateQuiescence(op.id)).status, 'QUIESCENCE_CONFIRMED');
    late.resolve(); await continuation; assert.equal(await value(s), 'drain lifecycle');
  });

  await test('Unknown simulated COPY survives rollback and process/module restart', async () => {
    const s = await doc('unknown');
    await assert.rejects(service.runWriter({ ...s, type: 'DATABASE_TEST' }, () => documents.runInTransaction(async (c) => {
      await c.execute("UPDATE engineering_documents SET description = 'rollback' WHERE id = ?", [s.documentId]);
      await service.trackIo({ type: 'COPY', provider: 'r2', sourceKey: 'synthetic/source', destinationKey: 'synthetic/late' }, async () => { throw new Error('Simulated RPC timeout; remote outcome unknown'); });
    })));
    const op = await reserve(s); const restarted = loadBackend(businessPool, evidencePool);
    assert.equal((await restarted.repository.evaluateQuiescence(op.id)).status, 'QUIESCENCE_PENDING');
    assert.equal(await value(s), 'before');
    const unresolved = await repo.listUnresolvedWriters(s); assert.equal(unresolved.length, 1);
    assert.equal((await repo.listIoSteps(unresolved[0].id))[0].state, 'UNKNOWN');
    assert.equal((await repo.readAdmissionState(s)).gate_state, 'CLOSED');
    assert.ok((await repo.listPendingOperations()).some((o) => o.id === op.id));
  });

  await test('Rollback admission/reservation/business mutation does not leave false completion', async () => {
    const s = await doc('rollback');
    await assert.rejects(repo.admitWriter({ ...writer(s), type: null }));
    assert.equal(await repo.readAdmissionState(s), null);
    await assert.rejects(repo.reserve({ ...s, id: crypto.randomUUID(), userId: null, requestIdentity: digest('rollback') }));
    assert.equal(await repo.readAdmissionState(s), null);
    await assert.rejects(service.runWriter({ ...s, type: 'DATABASE_TEST' }, () => documents.runInTransaction(async (c) => {
      await c.execute("UPDATE engineering_documents SET description = 'rollback' WHERE id = ?", [s.documentId]); throw new Error('Intentional rollback');
    })));
    assert.equal(await value(s), 'before');
    const op = await reserve(s); assert.equal((await repo.evaluateQuiescence(op.id)).status, 'QUIESCENCE_CONFIRMED');
  });

  await test('Connection loss during simulated COPY releases SQL lock but cannot prove quiescence', async () => {
    const s = await doc('kill'); const started = deferred(); const complete = deferred(); let connectionId;
    const pending = service.runWriter({ ...s, type: 'DATABASE_TEST' }, () => documents.runInTransaction(async (c) => {
      const [[row]] = await c.query('SELECT CONNECTION_ID() id'); connectionId = row.id;
      await c.execute("UPDATE engineering_documents SET description = 'uncommitted' WHERE id = ?", [s.documentId]);
      await service.trackIo({ type: 'COPY', provider: 'r2', sourceKey: 'synthetic/source', destinationKey: 'synthetic/late-after-kill' }, async () => { started.resolve(); await complete.promise; });
    })); pending.catch(() => {});
    await started.promise; await killOwned(connectionId);
    const op = await reserve(s); assert.equal((await repo.evaluateQuiescence(op.id)).status, 'QUIESCENCE_PENDING');
    complete.resolve(); await assert.rejects(pending);
    assert.equal(await value(s), 'before');
    assert.equal((await repo.evaluateQuiescence(op.id)).status, 'QUIESCENCE_PENDING');
    const w = (await repo.listUnresolvedWriters(s))[0]; assert.equal(w.db_outcome, 'UNKNOWN');
    return { killedTestConnectionId: connectionId, io: (await repo.listIoSteps(w.id))[0].state };
  });

  await test('Project Close: reservation conflict rolls back all archives; normal close retains business result', async () => {
    const a = await doc('close', { project: 'close-conflict', status: 'Approved' });
    const b = await doc('close2', { project: 'close-conflict', status: 'Approved' }); await reserve(b);
    await assert.rejects(projects.closeProject({ projectId: a.projectId, userId: userIds[0] }), denied);
    const [rows] = await admin.execute('SELECT lifecycle_status FROM engineering_documents WHERE project_id = ?', [a.projectId]);
    assert.ok(rows.every((r) => r.lifecycle_status === 'Active'));
    const normal = await doc('close-normal', { status: 'Approved' });
    const result = await projects.closeProject({ projectId: normal.projectId, userId: userIds[0] });
    assert.equal(result.autoArchivedDocumentCount, 1); assert.equal(result.project.status, 'Closed');
  });

  await test('Project Close sorted locks overlap a concurrent reservation without partial commit', async () => {
    const a = await doc('close-overlap-a', { project: 'close-overlap', status: 'Approved' });
    const b = await doc('close-overlap-b', { project: 'close-overlap', status: 'Approved' });
    const c = await makeConnection(); await c.beginTransaction(); await repo.lockGate(c, a);
    const closing = projects.closeProject({ projectId: a.projectId, userId: userIds[0] }); closing.catch(() => {});
    await delay(100); await reserve(b); await c.commit(); await assert.rejects(closing, denied);
    const [rows] = await admin.execute('SELECT lifecycle_status FROM engineering_documents WHERE project_id = ?', [a.projectId]);
    assert.ok(rows.every((r) => r.lifecycle_status === 'Active'));
  });

  await test('Notification bulk/SLA overlap: stale writers cannot bypass a reserved document', async () => {
    const s = await doc('notifications');
    await notifications.createNotification({ id: crypto.randomUUID(), identityKey: crypto.randomUUID(), projectId: s.projectId,
      recipientUserId: userIds[0], recipientProjectMembershipId: null, eventType: 'Document Uploaded', title: 'Synthetic', message: 'Synthetic',
      priority: 'Normal', officialRole: 'Admin', recipientRole: 'Admin', relatedResourceType: 'Document', relatedResourceId: s.documentId,
      relatedDocumentNumber: s.documentNumber, actionTarget: '/', metadata: {} });
    await reserve(s);
    await assert.rejects(notifications.markAllNotificationsRead({ projectId: s.projectId, recipientUserId: userIds[0] }), denied);
    await assert.rejects(sla.upsertSlaEvaluation({ ...s, evaluationId: crypto.randomUUID(), cycleId: 'synthetic', currentState: 'On Track' }), denied);
    const [[row]] = await admin.execute('SELECT is_read FROM notifications WHERE project_id = ?', [s.projectId]); assert.equal(row.is_read, 0);
  });

  await test('Intentional inverse-order deadlock safely selects a victim; clean retry preserves gate safety', async () => {
    const a = await doc('deadlock-a'); const b = await doc('deadlock-b');
    await repo.transaction((c) => repo.lockGate(c, a)); await repo.transaction((c) => repo.lockGate(c, b));
    const c1 = await makeConnection(); const c2 = await makeConnection();
    await c1.beginTransaction(); await c2.beginTransaction(); await repo.lockGate(c1, a); await repo.lockGate(c2, b);
    const outcomes = await Promise.allSettled([repo.lockGate(c1, b), repo.lockGate(c2, a)]);
    await c1.rollback(); await c2.rollback();
    const failures = outcomes.filter((r) => r.status === 'rejected'); assert.equal(failures.length, 1);
    assert.equal(failures[0].reason.code, 'ER_LOCK_DEADLOCK');
    await repo.admitWriter(writer(a)); await repo.admitWriter(writer(b));
    return { expectedVictim: failures[0].reason.code };
  });

  await test('Real pool starvation: business limit 1 does not prevent independent IO evidence', async () => {
    const smallBusiness = makePool(1); const smallEvidence = makePool(1); const module = loadBackend(smallBusiness, smallEvidence);
    const s = await doc('pool-a'); const other = await doc('pool-b'); const started = deferred(); const proceed = deferred();
    const pending = module.service.runWriter({ ...s, type: 'DATABASE_TEST' }, () => module.documents.runInTransaction(async () => {
      started.resolve(); await proceed.promise;
      await module.service.trackIo({ type: 'COPY', provider: 'r2', sourceKey: 'synthetic/source', destinationKey: 'synthetic/pool-target' }, async () => {});
    }));
    await started.promise;
    const queued = module.repository.admitWriter(writer(other)); queued.catch(() => {});
    proceed.resolve(); await Promise.all([pending, queued]);
    const [row] = await admin.execute('SELECT lifecycle_state FROM document_writer_operations WHERE document_id = ?', [s.documentId]); assert.equal(row[0].lifecycle_state, 'SETTLED');
  });

  await test('Cross-document/project isolation: a held target gate does not block unrelated writers', async () => {
    const a = await doc('isolation-a', { project: 'isolation' }); const b = await doc('isolation-b', { project: 'isolation' }); const other = await doc('isolation-c');
    await reserve(a);
    const c = await makeConnection(); await c.beginTransaction(); await repo.lockGate(c, a);
    try { await Promise.all([repo.admitWriter(writer(b)), repo.admitWriter(writer(other))]); }
    finally { await c.rollback(); }
    await assert.rejects(repo.admitWriter(writer(a)), denied);
  });

  await test('UTC technical timestamps remain UTC under a non-UTC session', async () => {
    const c = await makeConnection(); const s = await doc('utc');
    await c.query("SET SESSION time_zone = '+07:00'"); await c.beginTransaction(); await repo.lockGate(c, s); await c.commit();
    const [[r]] = await c.execute('SELECT ABS(TIMESTAMPDIFF(SECOND,created_at,UTC_TIMESTAMP(3))) seconds FROM document_admission_coordinators WHERE project_id = ? AND document_id = ?', [s.projectId, s.documentId]);
    assert.ok(r.seconds <= 2, `Technical coordinator timestamp differs from UTC by ${r.seconds} seconds`);
    await c.query("SET SESSION time_zone = '+00:00'");
    const nonUtc = loadBackend(makePool(2, '+07:00'), makePool(2, '+07:00'));
    const w = writer(s); await nonUtc.repository.admitWriter(w);
    const ioId = crypto.randomUUID();
    await nonUtc.repository.recordIo({ id: ioId, writerId: w.id, provider: 'r2', type: 'COPY', sourceKey: 'synthetic/utc', destinationKey: 'synthetic/utc-target' });
    const op = await nonUtc.repository.reserve({ ...s, id: crypto.randomUUID(), userId: userIds[0], requestIdentity: digest('utc') });
    for (const [table, id] of [['document_writer_operations', w.id], ['document_storage_io_steps', ioId], ['document_delete_operations', op.id]]) {
      const [[timestamp]] = await admin.execute(`SELECT ABS(TIMESTAMPDIFF(SECOND,created_at,UTC_TIMESTAMP(3))) created_seconds,
        ABS(TIMESTAMPDIFF(SECOND,updated_at,UTC_TIMESTAMP(3))) updated_seconds FROM ${table} WHERE id = ?`, [id]);
      assert.ok(timestamp.created_seconds <= 2 && timestamp.updated_seconds <= 2, `${table} must persist UTC`);
    }
  });

  const [[globalSettings]] = await admin.query('SELECT @@GLOBAL.sql_mode sql_mode, @@GLOBAL.time_zone time_zone');
  assert.equal(globalSettings.sql_mode, results.server.global_sql_mode); assert.equal(globalSettings.time_zone, results.server.global_time_zone);
  results.globalSettingsUnchanged = true;
  results.finishedAt = new Date().toISOString(); results.passed = results.tests.filter((t) => t.result === 'PASS').length;
  results.failed = errors.length; results.fixturePolicy = 'Synthetic rows retained; no DROP/TRUNCATE/DELETE cleanup';
};

main().catch((error) => {
  results.fatal = { code: error.code || null, error: error.message };
  process.exitCode = 1;
}).finally(async () => {
  try { await isolated.bounded(Promise.allSettled([...activeTasks]), 2000, 'Outstanding tasks did not settle'); }
  catch { results.unresolvedTasks = activeTasks.size; for (const c of rawClients) c.destroy(); }
  try {
    await isolated.bounded(Promise.all([...allConnections].map((c) => c.end().catch(() => c.destroy()))), 2000, 'Dedicated clients did not close');
    await isolated.bounded(Promise.all(allPools.map((p) => p.end())), 3000, 'Pools did not close');
    results.poolsClosed = true;
  } catch (error) { results.shutdownError = error.code; for (const c of rawClients) c.destroy(); }
  results.connectionIds = [...new Set(results.connectionIds)];
  results.passed = results.tests.filter((test) => test.result === 'PASS').length;
  results.failed = results.tests.filter((test) => test.result === 'FAIL').length + (results.fatal ? 1 : 0) + (results.shutdownError || results.unresolvedTasks ? 1 : 0);
  fs.writeFileSync(output, `${JSON.stringify(results, null, 2)}\n`);
  console.log(JSON.stringify({ passed: results.passed || 0, failed: results.failed || 0, fatal: results.fatal || null, database }));
  if (results.failed) process.exitCode = 1;
});
