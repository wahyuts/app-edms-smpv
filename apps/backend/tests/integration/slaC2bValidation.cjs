const fs = require('node:fs');
const path = require('node:path');
const cp = require('node:child_process');
const crypto = require('node:crypto');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const { AsyncLocalStorage } = require('node:async_hooks');
const planning = require('../helpers/slaC2bPlan.cjs');
const safety = require('../helpers/slaC2bRuntime.cjs');
const preparation = require('../helpers/slaIntegrationPreparation.cjs');
const root = path.resolve(__dirname, '../../../..');
const directory = path.join(root, 'tmp/sla-integration-c2b');
const credentialsFile = path.join(directory, 'credentials.json');
const reportFile = path.join(directory, 'report.json');
const report = { plan: 'C2B-PLAN-01', mutations: [], tests: [], startedAt: new Date().toISOString() };
const connections = new Set();
const q = async (c, sql, args = []) => {
  const result = await c.query({ sql, timeout: 10000 }, args);
  if (result[0]?.warningStatus) throw Object.assign(new Error('SQL_WARNING'), { code: 'C2B_SQL_WARNING' });
  return result;
};
const powershell = source => cp.execFileSync('powershell.exe', ['-NoProfile', '-NonInteractive', '-Command', source],
  { encoding: 'utf8', windowsHide: true, stdio: ['ignore', 'pipe', 'pipe'] }).trim();

const adminConfiguration = () => {
  const processInfo = JSON.parse(powershell("$l=Get-NetTCPConnection -State Listen -LocalPort 3306; if(@($l).Count -ne 1){throw 'listener'}; $p=Get-CimInstance Win32_Process -Filter ('ProcessId='+$l.OwningProcess); $p | Select-Object ProcessId,ExecutablePath,CommandLine | ConvertTo-Json -Compress"));
  assert.equal(safety.normalizePath(processInfo.ExecutablePath), 'd:/xampp/mysql/bin/mysqld.exe');
  assert.match(processInfo.CommandLine.toLowerCase().replace(/\\/g, '/'), /--defaults-file="?d:\/xampp\/mysql\/bin\/my.ini/);
  const ini = fs.readFileSync('D:/xampp/mysql/bin/my.ini', 'utf8');
  const server = ini.split(/\[mysqld\]/i)[1]?.split(/\n\s*\[/)[0];
  assert.match(server || '', /^port\s*=\s*3306\s*$/m);
  assert.match(server, /^datadir\s*=\s*"?D:\/xampp\/mysql\/data"?\s*$/im);
  const php = fs.readFileSync('D:/xampp/phpMyAdmin/config.inc.php', 'utf8');
  const literal = key => {
    const pattern = new RegExp("\\$cfg\\['Servers'\\]\\[\\$i\\]\\['" + key + "'\\]\\s*=\\s*'([^'\\r\\n]*)'\\s*;", 'g');
    const found = [...php.matchAll(pattern)];
    assert.equal(found.length, 1); assert.equal(found[0][1].includes('\\'), false);
    return found[0][1];
  };
  assert.equal(literal('host'), '127.0.0.1'); assert.equal(literal('auth_type'), 'config'); assert.equal(literal('user'), 'root');
  report.process = { pid: processInfo.ProcessId, executable: processInfo.ExecutablePath };
  return { user: literal('user'), password: literal('password') };
};

const prepareSecrets = () => {
  assert.equal(fs.existsSync(directory), false, 'Existing C2B directory must not be overwritten/adopted');
  const sid = powershell('[Security.Principal.WindowsIdentity]::GetCurrent().User.Value');
  fs.mkdirSync(directory);
  cp.execFileSync('icacls.exe', [directory, '/inheritance:r', '/grant:r', `*${sid}:(OI)(CI)F`, '*S-1-5-18:(OI)(CI)F'], { windowsHide: true, stdio: 'pipe' });
  const acl = JSON.parse(powershell(`@((Get-Acl -LiteralPath '${directory.replace(/'/g, "''")}').Access | ForEach-Object { @{sid=$_.IdentityReference.Translate([Security.Principal.SecurityIdentifier]).Value;inherited=$_.IsInherited;type=$_.AccessControlType.ToString();rights=$_.FileSystemRights.ToString()} }) | ConvertTo-Json -Compress`));
  safety.validateAcl(acl, sid);
  const record = safety.validateSecretRecord({ planId: 'C2B-PLAN-01', host: '127.0.0.1', port: 3306,
    database: safety.DB, schemaHash: safety.SCHEMA_HASH, nonce: crypto.randomBytes(32).toString('hex'),
    schemaPassword: crypto.randomBytes(32).toString('hex'), runnerPassword: crypto.randomBytes(32).toString('hex') });
  fs.writeFileSync(credentialsFile, JSON.stringify(record, null, 2), { flag: 'wx', mode: 0o600 });
  const fileAcl = JSON.parse(powershell(`@((Get-Acl -LiteralPath '${credentialsFile.replace(/'/g, "''")}').Access | ForEach-Object { @{sid=$_.IdentityReference.Translate([Security.Principal.SecurityIdentifier]).Value;inherited=$false;type=$_.AccessControlType.ToString();rights=$_.FileSystemRights.ToString()} }) | ConvertTo-Json -Compress`));
  safety.validateAcl(fileAcl, sid);
  report.credentialSafety = { exclusiveFile: true, restrictedAcl: true, secretsPrinted: false };
  return record;
};

const reviewedBlocks = () => {
  const original = fs.readFileSync(path.join(__dirname, 'SLA-C2B-PROVISIONING-PLAN.md'), 'utf8');
  assert.equal(safety.hash(original), '99f6feb91056151a1c33f58961c6c766eb355ee93a6c66182ec224a76acaa570', 'Reviewed provisioning SQL changed');
  const text = original.replace(/\r\n/g, '\n');
  const blocks = [...text.matchAll(/```sql\n([\s\S]*?)```/g)].map(match => match[1].trim());
  assert.equal(blocks.length, 6);
  return blocks.map(block => block.split(/;\s*(?:\n|$)/).map(value => value.trim()).filter(Boolean));
};

const schemaStatements = () => {
  const prepared = planning.prepareSchema();
  assert.equal(prepared.sha256, safety.SCHEMA_HASH, 'Approved schema hash changed');
  assert.equal(fs.readFileSync(path.join(__dirname, 'sla-c2b-schema.sql'), 'utf8'), prepared.sql);
  const base = fs.readFileSync(path.join(root, planning.sources[0]), 'utf8').replace(/\r\n/g, '\n');
  const foundation = fs.readFileSync(path.join(root, planning.sources[1]), 'utf8').replace(/\r\n/g, '\n');
  const blocks = planning.baseTables.map(name => planning.tableBlock(base, name));
  const alter = /ALTER TABLE engineering_documents\n[\s\S]*?;/.exec(base)[0];
  return [...blocks, alter, ...planning.foundationTables.map(name => planning.tableBlock(foundation, name))];
};

const verifySchema = async (connection) => {
  const definitions = schemaStatements().filter(sql => sql.startsWith('CREATE TABLE'));
  const names = [...planning.baseTables, ...planning.foundationTables, 'edms_sla_test_ownership', 'edms_sla_test_ledger'];
  const [tables] = await q(connection, 'SELECT TABLE_NAME name,ENGINE engine,TABLE_COLLATION collation FROM information_schema.TABLES WHERE TABLE_SCHEMA=?', [safety.DB]);
  assert.deepEqual(tables.map(row => row.name).sort(), [...names].sort());
  assert.ok(tables.every(row => row.engine === 'InnoDB' && row.collation === 'utf8mb4_unicode_ci'));
  let columnsChecked = 0, indexesChecked = 0, foreignKeysChecked = 0, checksChecked = 0;
  for (const definition of definitions) {
    const table = /^CREATE TABLE (\w+)/.exec(definition)[1];
    const [columns] = await q(connection, 'SELECT COLUMN_NAME name,COLUMN_TYPE type,IS_NULLABLE nullable,EXTRA extra,GENERATION_EXPRESSION expression FROM information_schema.COLUMNS WHERE TABLE_SCHEMA=? AND TABLE_NAME=? ORDER BY ORDINAL_POSITION', [safety.DB, table]);
    const expected = [...definition.matchAll(/^  ([a-z_]+) ([A-Z]+(?:\([0-9,]+\))?(?: UNSIGNED)?)([^\n]*)/gm)];
    assert.deepEqual(columns.map(row => row.name), expected.map(row => row[1]), `Columns: ${table}`);
    const normalizeType = value => value.toLowerCase().replace(/\b(bigint|int|tinyint)\(\d+\)/g, '$1').replace(/\s+/g, '');
    for (let n = 0; n < expected.length; n++) {
      const wanted = expected[n], actual = columns[n]; columnsChecked++;
      if (wanted[2] === 'JSON') {
        assert.equal(actual.type, 'longtext');
        const [[created]] = await q(connection, `SHOW CREATE TABLE ${table}`);
        assert.ok(Object.values(created)[1].includes(`json_valid(\`${actual.name}\`)`));
      } else assert.equal(normalizeType(actual.type), normalizeType(wanted[2]), `${table}.${actual.name}`);
      assert.equal(actual.nullable, /NOT NULL/.test(wanted[3]) ? 'NO' : 'YES', `${table}.${actual.name} nullable`);
      if (/AUTO_INCREMENT/.test(wanted[3])) assert.ok(actual.extra.includes('auto_increment'));
    }
    const [indexes] = await q(connection, 'SELECT INDEX_NAME name,NON_UNIQUE nonUnique,COLUMN_NAME columnName,SEQ_IN_INDEX position,SUB_PART prefixLength FROM information_schema.STATISTICS WHERE TABLE_SCHEMA=? AND TABLE_NAME=? ORDER BY INDEX_NAME,SEQ_IN_INDEX', [safety.DB, table]);
    for (const line of definition.split('\n')) {
      const match = /^  (PRIMARY KEY|UNIQUE KEY (\w+)|KEY (\w+)) \((.+)\),?$/.exec(line);
      if (!match) continue;
      const name = match[1] === 'PRIMARY KEY' ? 'PRIMARY' : match[2] || match[3];
      const expectedColumns = [...match[4].matchAll(/([a-z_]+)(?:\((\d+)\))?/g)].map(value => ({ name: value[1], prefix: value[2] ? Number(value[2]) : null }));
      const rows = indexes.filter(row => row.name === name); assert.equal(rows.length, expectedColumns.length);
      rows.forEach((row, index) => {
        assert.equal(row.columnName, expectedColumns[index].name); assert.equal(row.prefixLength, expectedColumns[index].prefix);
        assert.equal(Number(row.nonUnique), match[3] ? 1 : 0);
      }); indexesChecked++;
    }
    const [constraints] = await q(connection, 'SELECT CONSTRAINT_NAME name,CONSTRAINT_TYPE type FROM information_schema.TABLE_CONSTRAINTS WHERE TABLE_SCHEMA=? AND TABLE_NAME=?', [safety.DB, table]);
    for (const match of definition.matchAll(/CONSTRAINT (\w+) CHECK/g)) {
      assert.ok(constraints.some(row => row.name === match[1] && row.type === 'CHECK')); checksChecked++;
    }
  }
  const [foreignKeys] = await q(connection, 'SELECT CONSTRAINT_NAME name,TABLE_NAME tableName,COLUMN_NAME columnName,REFERENCED_TABLE_NAME parent,REFERENCED_COLUMN_NAME parentColumn,REFERENCED_TABLE_SCHEMA parentSchema FROM information_schema.KEY_COLUMN_USAGE WHERE TABLE_SCHEMA=? AND REFERENCED_TABLE_NAME IS NOT NULL', [safety.DB]);
  for (const definition of schemaStatements()) for (const match of definition.matchAll(/(?:CONSTRAINT|ADD CONSTRAINT) (\w+) FOREIGN KEY \((\w+)\) REFERENCES (\w+) \((\w+)\)/g)) {
    assert.ok(foreignKeys.some(row => row.name === match[1] && row.columnName === match[2]
      && row.parent === match[3] && row.parentColumn === match[4] && row.parentSchema === safety.DB)); foreignKeysChecked++;
  }
  assert.equal(foreignKeys.length, foreignKeysChecked);
  const [[email]] = await q(connection, 'SELECT GENERATION_EXPRESSION expression,EXTRA extra,COLLATION_NAME collation FROM information_schema.COLUMNS WHERE TABLE_SCHEMA=? AND TABLE_NAME=? AND COLUMN_NAME=?', [safety.DB, 'users', 'email_uniqueness_key']);
  const userDefinition = definitions.find(sql => sql.startsWith('CREATE TABLE users '));
  const expression = /GENERATED ALWAYS AS \(([\s\S]*?)\) STORED/.exec(userDefinition.replace(/\s+/g, ' '))[1];
  safety.verifyEmailExpression(email.expression, expression);
  assert.match(email.extra, /STORED GENERATED/); assert.equal(email.collation, 'utf8mb4_unicode_ci');
  report.schema = { tables: tables.length, columnsChecked, indexesChecked, foreignKeysChecked, checksChecked,
    canonicalEmailExpression: 'SEMANTIC MATCH WITH EXACT CANONICAL LITERALS', schemaHash: safety.SCHEMA_HASH };
};

const provision = async (mysql) => {
  const adminConfig = adminConfiguration();
  const options = { host: '127.0.0.1', port: 3306, timezone: 'Z', multipleStatements: false, connectTimeout: 5000 };
  const connect = async value => { const c = await mysql.createConnection({ ...options, ...value }); connections.add(c); return c; };
  let admin = await connect(adminConfig);
  const [[identity]] = await q(admin, safety.identitySql);
  safety.validateIdentity(identity, null, 'root@localhost');
  assert.equal(admin.connection.stream.remoteAddress, '127.0.0.1');
  const [existing] = await q(admin, 'SELECT SCHEMA_NAME FROM information_schema.SCHEMATA WHERE SCHEMA_NAME=?', [safety.DB]);
  assert.equal(existing.length, 0, 'Test DB must be absent');
  const [accounts] = await q(admin, 'SELECT User,Host FROM mysql.user WHERE User IN (?,?)', ['edms_sla_schema', 'edms_sla_runner']);
  assert.equal(accounts.length, 0, 'Test accounts must be absent');
  const [[settings]] = await q(admin, 'SELECT @@GLOBAL.sql_mode sqlMode,@@GLOBAL.time_zone timeZone,@@tx_isolation isolationLevel,@@foreign_key_checks foreignKeys');
  assert.equal(settings.isolationLevel, 'REPEATABLE-READ'); assert.equal(Number(settings.foreignKeys), 1);
  report.preflight = { identity, settings, databaseAbsent: true, accountsAbsent: true };
  const secret = prepareSecrets(), gate = safety.createRuntimeGate({ nonce: secret.nonce });
  const blocks = reviewedBlocks();
  const mutate = async (c, sql, args = [], label = '') => {
    report.pendingMutation = label;
    const result = await q(c, sql, args);
    report.mutations.push(label); delete report.pendingMutation; return result;
  };
  await mutate(admin, blocks[0][0], [], 'create-database');
  await mutate(admin, blocks[0][1], [secret.schemaPassword], 'create-schema-account');
  await mutate(admin, blocks[0][2], [secret.runnerPassword], 'create-runner-account');
  await mutate(admin, blocks[0][3], [], 'schema-grants');
  await mutate(admin, blocks[0][4], [], 'runner-select-grant');
  await admin.end(); connections.delete(admin);
  admin = await connect({ ...adminConfig, database: safety.DB });
  const [[selected]] = await q(admin, safety.identitySql); safety.validateIdentity(selected, safety.DB, 'root@localhost');
  await mutate(admin, blocks[3][0], [], 'create-ownership-table');
  await mutate(admin, blocks[3][1], [], 'create-ledger-table');
  await mutate(admin, blocks[3][2], [secret.nonce, safety.SCHEMA_HASH], 'insert-ownership-marker');
  const setup = await connect({ user: 'edms_sla_schema', password: secret.schemaPassword, database: safety.DB });
  report.setupIdentity = await gate.verify(setup, 'schema', 'PROVISIONING', true);
  await q(setup, blocks[5][0]);
  for (const [index, statement] of schemaStatements().entries()) {
    gate.assert(setup, 'schema');
    await mutate(setup, statement, [], `schema-statement-${index + 1}`);
  }
  await verifySchema(setup);
  await mutate(admin, blocks[2][0], [], 'revoke-setup-DDL');
  await gate.verify(setup, 'schema', 'PROVISIONING', false);
  for (const [index, sql] of blocks[1].entries()) await mutate(admin, sql, [], `runner-table-grant-${index + 1}`);
  const [ready] = await mutate(admin, blocks[4][0], [secret.nonce, safety.SCHEMA_HASH], 'ownership-ready');
  assert.equal(ready.affectedRows, 1);
  await setup.end(); connections.delete(setup);
  await admin.end(); connections.delete(admin);
  report.provisioning = 'PASS';
  return { secret, gate, connect, globals: settings };
};

const integrate = async ({ secret, gate, connect, globals }) => {
  const mysql = require('mysql2/promise');
  const run = crypto.randomBytes(8).toString('hex');
  report.run = run;
  const fixture = preparation.buildFixturePlan(run);
  const owned = new Map(planning.dmlTables.map(table => [table, new Set()]));
  const events = [], traces = [], sqlLog = [], visited = [];
  const leases = new Set(), pools = [];
  let activeTransactions = 0, injected = null, lastFailure = null, nativeErrors = [], acquisitions = 0;
  const options = { host: '127.0.0.1', port: 3306, database: safety.DB, user: 'edms_sla_runner',
    password: secret.runnerPassword, timezone: 'Z', multipleStatements: false, connectTimeout: 5000 };
  const observer = await connect(options);
  report.runnerIdentity = await gate.verify(observer, 'runner');
  await q(observer, "SET SESSION time_zone = '+00:00'");
  for (const table of [...planning.baseTables, ...planning.foundationTables, 'edms_sla_test_ledger']) {
    const [[row]] = await q(observer, `SELECT COUNT(*) n FROM ${table}`);
    assert.equal(Number(row.n), 0, 'New test database must contain no fixture rows');
  }
  const ownedId = (table, id) => assert.ok(owned.get(table)?.has(String(id)), `Unowned fixture: ${table}`);
  const remember = (table, id) => owned.get(table).add(String(id));
  const keysFor = async (raw, table, args, result) => {
    if (table === 'document_admission_coordinators') return { project_id: args[0], document_id: args[1] };
    if (table === 'roles' || table === 'users') return { id: result.insertId };
    if (table === 'document_sla_evaluations') {
      const [[row]] = await q(raw, 'SELECT id FROM document_sla_evaluations WHERE document_id=? AND cycle_id=?', [args[2], args[3]]);
      return { id: row.id };
    }
    return { id: args[0] };
  };
  const enroll = async (raw, table, keys) => {
    const key = Object.values(keys).join(':');
    await q(raw, `INSERT INTO edms_sla_test_ledger (run_id,entity_table,entity_key,identity_columns,created_at)
      VALUES (?,?,?,?,UTC_TIMESTAMP(3)) ON DUPLICATE KEY UPDATE entity_key=entity_key`,
    [run, table, key, JSON.stringify(keys)]);
    remember(table, table === 'document_admission_coordinators' ? key : keys.id);
  };
  const checkMutation = (sql, args) => {
    const text = safety.assertRunnerSql(sql);
    if (text.startsWith('INSERT INTO notifications')) {
      ownedId('projects', args[2]); ownedId('users', args[3]); ownedId('engineering_documents', args[12]);
    } else if (text.startsWith('INSERT INTO document_sla_evaluations')) {
      ownedId('projects', args[1]); ownedId('engineering_documents', args[2]);
    } else if (text.startsWith('INSERT INTO audit_trail')) {
      ownedId('projects', args[2]); ownedId('engineering_documents', args[11]);
    } else if (text.startsWith('INSERT INTO document_admission_coordinators')) {
      ownedId('projects', args[0]); ownedId('engineering_documents', args[1]);
    } else if (text.startsWith('INSERT INTO users')) assert.equal(args[3], null, 'Fixtures must not use real email');
    else if (/^(UPDATE|DELETE)/.test(text)) {
      // Public fixture updates are explicitly tied to owned IDs; cleanup is ledger-driven separately.
      const table = /^(?:UPDATE|DELETE FROM) (\w+)/.exec(text)[1];
      assert.ok(args.some(value => owned.get(table)?.has(String(value))), 'Mutation has no exact owned key');
    }
    return text;
  };
  const makePool = (limit) => {
    const native = mysql.createPool({ ...options, connectionLimit: limit, waitForConnections: true, queueLimit: 20 });
    pools.push(native);
    const managed = {
      async getConnection() {
        const raw = await native.getConnection(); acquisitions++;
        try {
          await gate.verify(raw, 'runner');
          await q(raw, "SET SESSION time_zone = '+00:00'");
          const [[state]] = await q(raw, 'SELECT @@in_transaction active'); assert.equal(Number(state.active), 0);
        } catch (error) { raw.destroy(); throw error; }
        const lease = { raw, inTransaction: false, stagedTables: [], id: raw.threadId };
        leases.add(lease);
        const call = async (sql, args = []) => {
          gate.assert(raw, 'runner');
          const text = checkMutation(sql, args);
          sqlLog.push({ sql: text, parameters: args.length, transaction: lease.inTransaction });
          const binds = [...args];
          if (injected && ((text.startsWith('INSERT INTO notifications') && args[12] === injected.documentId && injected.stage === 'notification' && ++injected.recipients === 2)
            || (text.startsWith('INSERT INTO document_sla_evaluations') && args[2] === injected.documentId && injected.stage === 'evaluation')
            || (text.startsWith('INSERT INTO audit_trail') && args[11] === injected.documentId && injected.stage === 'audit'))) {
            if (injected.stage === 'notification') binds[3] = 9007199254740991;
            if (injected.stage === 'evaluation') binds[4] = 'INVALID';
            if (injected.stage === 'audit') binds[2] = 'NONEXISTENT-C2B-PROJECT';
            lastFailure = { stage: injected.stage, stagedTables: [...lease.stagedTables], connectionId: lease.id };
          }
          try {
            const result = await q(raw, sql, binds);
            const table = /^INSERT INTO (\w+)/.exec(text)?.[1];
            if (table) {
              assert.equal(lease.inTransaction, true, 'Insert and ledger must share a transaction');
              await enroll(raw, table, await keysFor(raw, table, args, result[0]));
              lease.stagedTables.push(table);
            }
            return result;
          } catch (error) {
            nativeErrors.push({ code: error.code, errno: error.errno, sqlState: error.sqlState });
            throw error;
          }
        };
        return {
          execute: call, query: call,
          async beginTransaction() {
            assert.equal(lease.inTransaction, false); assert.equal(activeTransactions, 0, 'No nested transaction');
            await raw.beginTransaction(); lease.inTransaction = true; activeTransactions++; traces.push('begin');
          },
          async commit() {
            await raw.commit(); lease.inTransaction = false; activeTransactions--; traces.push('commit');
            const [[state]] = await q(raw, 'SELECT @@in_transaction active'); assert.equal(Number(state.active), 0);
          },
          async rollback() {
            await raw.rollback(); if (lease.inTransaction) activeTransactions--;
            lease.inTransaction = false; traces.push('rollback');
            const [[state]] = await q(raw, 'SELECT @@in_transaction active'); assert.equal(Number(state.active), 0);
          },
          release() { assert.equal(lease.inTransaction, false); raw.release(); leases.delete(lease); gate.forget(raw); traces.push('release'); },
          destroy() { raw.destroy(); leases.delete(lease); gate.forget(raw); traces.push('destroy'); },
        };
      },
      async execute(sql, args) { const c = await managed.getConnection(); try { return await c.execute(sql, args); } finally { c.release(); } },
    };
    return managed;
  };
  const businessPool = makePool(2), evidencePool = makePool(1);
  const allowed = new Set([
    'services/slaNotificationProducer.service.js', 'services/notification.service.js', 'services/audit.service.js',
    'services/notificationSuppressionPolicy.service.js', 'services/documentAdmission.service.js', 'services/time.service.js',
    'repositories/sla.repository.js', 'repositories/notification.repository.js', 'repositories/notificationWrite.repository.js',
    'repositories/audit.repository.js', 'repositories/projectMembership.repository.js', 'repositories/document.repository.js',
    'repositories/documentCoordination.repository.js', 'repositories/documentGate.repository.js', 'repositories/time.repository.js',
    'utils/administration.js', 'utils/slaCycle.js', 'utils/jsonMetadata.js', 'utils/storageNamespace.js',
    'constants/administration.constants.js', 'constants/realtime.constants.js',
  ]);
  const logs = [], cache = new Map();
  const mocks = new Map([
    ['config/database.js', { pool: businessPool }], ['config/documentCoordinationDatabase.js', { pool: evidencePool }],
    ['config/logger.js', { log(...args) { logs.push(args.join(' ')); }, error(...args) { logs.push(args.join(' ')); } }],
    ['services/realtimePublisher.service.js', { publishSafely(event) {
      assert.equal(activeTransactions, 0); assert.equal(leases.size, 0);
      assert.equal(traces.at(-1), 'release'); events.push(event);
      return { published: true };
    } }],
  ]);
  const sourceRoot = path.join(root, 'apps/backend/src');
  const load = file => {
    if (mocks.has(file)) return mocks.get(file);
    assert.ok(allowed.has(file), `Forbidden runtime import: ${file}`);
    if (cache.has(file)) return cache.get(file).exports;
    const filename = path.join(sourceRoot, file), module = { exports: {} }; cache.set(file, module);
    new vm.Script(fs.readFileSync(filename, 'utf8'), { filename }).runInNewContext({
      module, exports: module.exports, Date, Buffer, setTimeout, URL,
      require(name) {
        if (name === 'node:crypto') return crypto;
        if (name === 'node:async_hooks') return { AsyncLocalStorage };
        assert.ok(name.startsWith('.'), `Forbidden external import: ${name}`);
        return load(path.relative(sourceRoot, path.resolve(path.dirname(filename), `${name}.js`)).split(path.sep).join('/'));
      },
    });
    return module.exports;
  };
  const producer = load('services/slaNotificationProducer.service.js');
  const documents = load('repositories/document.repository.js');
  const originalSnapshot = documents.findSlaEvaluationSnapshot;
  documents.findSlaEvaluationSnapshot = async (...args) => { visited.push(args[1].documentId); return originalSnapshot(...args); };
  const runTest = async (name, callback) => {
    const started = Date.now();
    try {
      const evidence = await callback();
      assert.equal(activeTransactions, 0); assert.equal(leases.size, 0);
      report.tests.push({ name, result: 'PASS', durationMs: Date.now() - started, evidence });
      console.log(JSON.stringify({ test: name, result: 'PASS' }));
    } catch (error) { report.tests.push({ name, result: 'FAIL', code: error.code || error.name }); throw error; }
  };
  const transaction = async callback => {
    const c = await businessPool.getConnection();
    try { await c.beginTransaction(); const result = await callback(c); await c.commit(); return result; }
    catch (error) { await c.rollback(); throw error; } finally { c.release(); }
  };
  const userIds = [], roleIds = [];
  const docScope = new Map();
  const addDocument = async (id, projectId = fixture.projects[0].id) => {
    assert.ok(owned.get('engineering_documents').size < 1000);
    const value = { id, projectId }; docScope.set(id, value); remember('engineering_documents', id);
    await transaction(c => c.execute(`INSERT INTO engineering_documents
      (id,project_id,document_number,description,drawing,area,days_until_validation,workflow_status,revision_label,responsible_role,created_by_user_id,current_assignee_user_id,sla_started_at)
      VALUES (?,?,?,'Synthetic SLA fixture','PFD','TEST',3,'Process Review','IFR-Submitted','Team Process',?,?,UTC_TIMESTAMP(3) - INTERVAL 7 DAY)`,
    [id, projectId, id, userIds[0], userIds[2]]));
    return value;
  };
  const countFor = async (table, id) => {
    assert.ok(['notifications', 'audit_trail', 'document_sla_evaluations', 'document_admission_coordinators'].includes(table));
    const field = table === 'notifications' ? 'related_resource_id' : table === 'audit_trail' ? 'resource_id' : 'document_id';
    const [[row]] = await q(observer, `SELECT COUNT(*) n FROM ${table} WHERE ${field}=?`, [id]); return Number(row.n);
  };
  const evaluate = value => producer.evaluateDocumentForSlaNotifications({ document: value, triggerSource: 'c2b_integration' });
  const scan = async () => { visited.length = 0; return producer.runScheduledEvaluation({ batchSize: 200, triggerSource: 'c2b_integration' }); };
  // Only deterministic fixture construction uses this initial transaction; production evaluation remains unchanged.
  await transaction(async c => {
    for (let index = 0; index < fixture.users.length; index++) {
      const code = `${run}-ROLE-${index}`;
      const [role] = await c.execute('INSERT INTO roles (role_code,role_name) VALUES (?,?)', [code, fixture.users[index].officialRole]);
      roleIds.push(role.insertId);
      const [user] = await c.execute('INSERT INTO users (user_code,username,full_name,email,role_id) VALUES (?,?,?,?,?)',
        [fixture.users[index].key, fixture.users[index].key, fixture.users[index].fullName, null, role.insertId]);
      userIds.push(user.insertId);
    }
    for (const project of fixture.projects) {
      remember('projects', project.id);
      await c.execute('INSERT INTO projects (id,project_code,project_name) VALUES (?,?,?)', [project.id, project.id, 'Synthetic SLA Project']);
    }
    for (const membership of fixture.memberships) {
      const index = fixture.users.findIndex(user => user.key === membership.userKey);
      remember('project_memberships', membership.id);
      await c.execute('INSERT INTO project_memberships (id,project_id,user_id,official_role) VALUES (?,?,?,?)',
        [membership.id, membership.projectId, userIds[index], membership.officialRole]);
    }
  });
  for (const document of fixture.documents) await addDocument(document.id, document.projectId);
  report.fixtures = { users: 5, roles: 5, projects: 2, memberships: 10, initialDocuments: 500, emails: 'ALL NULL' };
  let first;
  await runTest('A1', async () => {
    first = await scan();
    assert.equal(first.processedCount, 500); assert.equal(first.createdCount, 2000); assert.equal(first.failedCount, 0);
    assert.equal(first.batchCount, 3); assert.equal(first.traversalComplete, true); assert.equal(first.evaluationComplete, true);
    assert.equal(new Set(visited).size, 500);
    const [[viewer]] = await q(observer, 'SELECT COUNT(*) n FROM notifications WHERE recipient_user_id=?', [userIds[4]]);
    assert.equal(Number(viewer.n), 0);
    return { processed: first.processedCount, created: first.createdCount, batches: first.batchCount, viewerNotifications: 0 };
  });
  await runTest('B1-1', async () => {
    const id = fixture.documents[0].id;
    for (const [table, count] of [['notifications', 4], ['document_sla_evaluations', 1], ['audit_trail', 1], ['document_admission_coordinators', 1]]) assert.equal(await countFor(table, id), count);
    assert.equal(events.length, 2000);
    return { atomicCommittedRows: '4 notifications + evaluation + mandatory audit + coordinator', events: events.length };
  });
  await runTest('A2', async () => {
    for (const suffix of ['a10', 'B2', 'e3']) await addDocument(`SLA-${run}-${suffix}`);
    const [oracle] = await q(observer, 'SELECT id FROM engineering_documents ORDER BY id');
    const result = await scan();
    assert.deepEqual(visited, oracle.map(row => row.id)); assert.equal(new Set(visited).size, oracle.length);
    assert.equal(result.processedCount, 503);
    return { collation: 'utf8mb4_unicode_ci', actualSqlOrderedIds: oracle.length };
  });
  await runTest('A3', async () => {
    const original = documents.getSlaScanBoundary, id = `SLA-${run}-zz99`;
    documents.getSlaScanBoundary = async () => { const boundary = await original(); await addDocument(id); return boundary; };
    const current = await scan(); documents.getSlaScanBoundary = original;
    assert.equal(visited.includes(id), false); assert.equal(current.processedCount, 503);
    const next = await scan(); assert.equal(visited.includes(id), true); assert.equal(next.processedCount, 504);
    return { current: 503, subsequent: 504, outsideBoundaryDeferred: true };
  });
  await runTest('A4', async () => {
    const original = documents.listSlaScanCandidates; let changed = false;
    documents.listSlaScanCandidates = async args => {
      const result = await original(args);
      if (!changed) {
        changed = true;
        await transaction(c => c.execute("UPDATE projects SET status='Inactive' WHERE id=?", [fixture.projects[1].id]));
      }
      return result;
    };
    const result = await scan(); documents.listSlaScanCandidates = original;
    assert.ok(result.processedCount <= 504 && result.skippedCount > 0); assert.equal(result.traversalComplete, true);
    assert.equal(new Set(visited).size, visited.length);
    await transaction(c => c.execute("UPDATE projects SET status='Active' WHERE id=?", [fixture.projects[1].id]));
    return { bounded: true, processed: result.processedCount, skipped: result.skippedCount, barrier: 'after first keyset SELECT' };
  });
  const bad = await addDocument(`SLA-${run}-bad`), good = await addDocument(`SLA-${run}-good`);
  let partial;
  await runTest('A5', async () => {
    injected = { documentId: bad.id, stage: 'notification', recipients: 0 };
    partial = await scan(); injected = null;
    assert.equal(partial.failedCount, 1); assert.equal(partial.createdCount, 4);
    assert.equal(await countFor('notifications', bad.id), 0); assert.equal(await countFor('notifications', good.id), 4);
    assert.ok(lastFailure.stagedTables.includes('notifications'));
    assert.ok(logs.some(line => line.includes('event=evaluation_failed') && line.includes(bad.id)));
    return { failed: 1, goodCommittedNotifications: 4, nativeError: nativeErrors.at(-1) };
  });
  await runTest('A6', async () => {
    assert.equal(partial.traversalComplete, true); assert.equal(partial.evaluationComplete, false);
    const original = documents.getSlaScanBoundary;
    documents.getSlaScanBoundary = async () => { throw new Error('test-only boundary adapter'); };
    const interrupted = await scan(); documents.getSlaScanBoundary = original;
    assert.equal(interrupted.traversalComplete, false); assert.equal(interrupted.evaluationComplete, false);
    return { successFlags: [first.traversalComplete, first.evaluationComplete], partialFlags: [true, false],
      interruptedFlags: [false, false], interruption: 'test adapter, not a fabricated DB error' };
  });
  await runTest('A7', async () => {
    const pages = sqlLog.filter(row => /ORDER BY documents.id ASC LIMIT \?/.test(row.sql));
    assert.ok(pages.length >= 3); assert.ok(pages.every(row => row.parameters <= 3));
    assert.ok(pages.every(row => !/OFFSET/.test(row.sql)));
    assert.equal(first.results.length, 200); assert.equal(first.resultsTruncated, true);
    return { pageQueriesObserved: pages.length, retainedResults: first.results.length, pageLimit: 200 };
  });
  await runTest('B1-2', async () => {
    assert.equal(await countFor('notifications', bad.id), 0); assert.equal(await countFor('document_sla_evaluations', bad.id), 0);
    assert.equal(await countFor('audit_trail', bad.id), 0); assert.equal(await countFor('document_admission_coordinators', bad.id), 0);
    assert.equal(events.some(event => event.documentId === bad.id), false);
    assert.equal(nativeErrors.at(-1).errno, 1452);
    return { nativeError: nativeErrors.at(-1), allMandatoryWritesRolledBack: true };
  });
  for (const [name, stage] of [['B1-3', 'evaluation'], ['B1-4', 'audit']]) {
    await runTest(name, async () => {
      const doc = await addDocument(`SLA-${run}-${stage}`);
      injected = { documentId: doc.id, stage, recipients: 0 };
      await assert.rejects(evaluate(doc), error => [1452, 4025].includes(error.errno)); injected = null;
      for (const table of ['notifications', 'document_sla_evaluations', 'audit_trail', 'document_admission_coordinators']) assert.equal(await countFor(table, doc.id), 0);
      assert.ok(lastFailure.stagedTables.includes('notifications'));
      if (stage === 'audit') assert.ok(lastFailure.stagedTables.includes('document_sla_evaluations'));
      assert.equal(events.some(event => event.documentId === doc.id), false);
      return { nativeError: nativeErrors.at(-1), stagedBeforeFailure: lastFailure.stagedTables, allMandatoryWritesRolledBack: true };
    });
  }
  await runTest('B1-5', async () => {
    const [[row]] = await q(observer, 'SELECT * FROM notifications WHERE related_resource_id=? LIMIT 1', [good.id]);
    await assert.rejects(transaction(c => c.execute(`INSERT INTO notifications
      (id,identity_key,project_id,recipient_user_id,recipient_project_membership_id,event_type,title,message,priority,official_role,recipient_role,related_resource_type,related_resource_id,related_document_number,action_target,metadata)
      VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`, [`DUP-${run}`, row.identity_key, good.projectId, row.recipient_user_id,
      row.recipient_project_membership_id, row.event_type, 'Synthetic', 'Synthetic', row.priority, row.official_role,
      row.recipient_role, row.related_resource_type, good.id, row.related_document_number, row.action_target, '{}'])), { errno: 1062 });
    assert.equal(await countFor('notifications', good.id), 4);
    return { uniqueIdentityEnforced: true, errno: nativeErrors.at(-1).errno };
  });
  await runTest('B1-6', async () => {
    const [[row]] = await q(observer, 'SELECT * FROM document_sla_evaluations WHERE document_id=?', [good.id]);
    await assert.rejects(transaction(c => c.execute(`INSERT INTO document_sla_evaluations (id,project_id,document_id,cycle_id,current_state)
      VALUES (?,?,?,?,?)`, [`DUP-${run}`, good.projectId, good.id, row.cycle_id, 'Overdue'])), { errno: 1062 });
    assert.equal(await countFor('document_sla_evaluations', good.id), 1);
    return { uniqueDocumentCycleEnforced: true, errno: nativeErrors.at(-1).errno };
  });
  await runTest('B1-7', async () => {
    const before = events.length, result = await evaluate(good);
    assert.equal(result.createdCount, 0); assert.equal(events.length, before);
    const [[persisted]] = await q(observer, 'SELECT COUNT(*) n FROM notifications');
    assert.equal(events.length, Number(persisted.n));
    assert.equal(events.some(event => event.documentId === bad.id), false);
    return { committedEventIds: events.length, sameStateSuppression: result.result, noEventsBeforeCommitOrAfterRollback: true };
  });
  await runTest('B1-8', async () => {
    assert.equal(activeTransactions, 0); assert.equal(leases.size, 0);
    assert.ok(traces.includes('rollback')); assert.equal(traces.includes('destroy'), false);
    return { acquisitions, activeLeases: 0, activeTransactions: 0, nestedTransactions: 0, nativeCommitRollbackStateChecked: true };
  });
  await runTest('B1-9', async () => {
    assert.equal(await countFor('notifications', bad.id), 0);
    assert.equal(await countFor('notifications', good.id), 4);
    assert.equal(await countFor('audit_trail', good.id), 1);
    return { failedDocumentEmpty: true, unrelatedCommittedDocumentPreserved: true };
  });
  assert.equal(leases.size, 0); assert.equal(activeTransactions, 0);
  await gate.verify(observer, 'runner');
  const [ledger] = await q(observer, 'SELECT entity_table,entity_key,identity_columns FROM edms_sla_test_ledger WHERE run_id=?', [run]);
  const cleanupOrder = ['notifications', 'audit_trail', 'document_sla_evaluations', 'document_admission_coordinators',
    'project_memberships', 'engineering_documents', 'projects', 'users', 'roles'];
  let removed = 0;
  await observer.beginTransaction();
  try {
    for (const table of cleanupOrder) {
      const rows = ledger.filter(row => row.entity_table === table);
      for (let start = 0; start < rows.length; start += 100) {
        const batch = rows.slice(start, start + 100);
        const keys = batch.map(row => typeof row.identity_columns === 'string' ? JSON.parse(row.identity_columns) : row.identity_columns);
        let sql, args;
        if (table === 'document_admission_coordinators') {
          assert.ok(keys.every(key => Object.keys(key).sort().join(',') === 'document_id,project_id'));
          sql = `DELETE FROM ${table} WHERE ${keys.map(() => '(project_id=? AND document_id=?)').join(' OR ')}`;
          args = keys.flatMap(key => [key.project_id, key.document_id]);
        } else {
          assert.ok(keys.every(key => Object.keys(key).join(',') === 'id'));
          keys.forEach(key => ownedId(table, key.id));
          sql = `DELETE FROM ${table} WHERE id IN (${keys.map(() => '?').join(',')})`; args = keys.map(key => key.id);
        }
        safety.assertRunnerSql(sql);
        const [deleted] = await q(observer, sql, args); assert.equal(deleted.affectedRows, batch.length);
        const [cleared] = await q(observer, `DELETE FROM edms_sla_test_ledger WHERE run_id=? AND entity_table=? AND entity_key IN (${batch.map(() => '?').join(',')})`,
          [run, table, ...batch.map(row => row.entity_key)]);
        assert.equal(cleared.affectedRows, batch.length); removed += deleted.affectedRows;
      }
    }
    const [[remaining]] = await q(observer, 'SELECT COUNT(*) n FROM edms_sla_test_ledger WHERE run_id=?', [run]); assert.equal(Number(remaining.n), 0);
    await observer.commit();
  } catch (error) { await observer.rollback(); throw error; }
  for (const table of [...planning.baseTables, ...planning.foundationTables]) {
    const [[row]] = await q(observer, `SELECT COUNT(*) n FROM ${table}`); assert.equal(Number(row.n), 0, `Unexpected remaining fixture: ${table}`);
  }
  await gate.verify(observer, 'runner');
  const [[after]] = await q(observer, 'SELECT @@GLOBAL.sql_mode sqlMode,@@GLOBAL.time_zone timeZone,@@tx_isolation isolationLevel,@@foreign_key_checks foreignKeys');
  assert.deepEqual(after, globals);
  for (const native of pools) await native.end();
  const [sessions] = await q(observer, "SELECT ID FROM information_schema.PROCESSLIST WHERE USER='edms_sla_runner' AND ID<>CONNECTION_ID()");
  assert.equal(sessions.length, 0);
  report.cleanup = { removedFixtureRows: removed, remainingFixtureRows: 0, remainingLedgerRows: 0,
    otherRunnerSessions: 0, databaseAndAccountsRetained: true, globalSettingsUnchanged: true };
  report.nativeDatabaseErrors = [...new Map(nativeErrors.map(error => [error.errno, error])).values()];
  report.status = 'C2B_REAL_MARIADB_INTEGRATION_PASS';
};

// The real integration implementation is invoked only after all provision/ownership gates pass.
const execute = async (approval) => {
  assert.equal(approval, 'C2B-PLAN-01');
  schemaStatements(); reviewedBlocks();
  const mysql = require('mysql2/promise');
  const context = await provision(mysql);
  await integrate(context);
};

if (require.main === module) {
  if (process.argv.length !== 4 || process.argv[2] !== '--execute-approved-plan' || process.argv[3] !== 'C2B-PLAN-01') {
    console.error('C2B_EXPLICIT_OWNER_APPROVAL_REQUIRED'); process.exitCode = 1;
  } else execute(process.argv[3]).catch(error => {
    report.fatal = { code: error.code || error.name, errno: error.errno || null, sqlState: error.sqlState || null };
    report.status = 'STOP_NO_AUTOMATIC_RECOVERY'; process.exitCode = 1;
  }).finally(async () => {
    for (const c of connections) { try { await c.end(); } catch { c.destroy(); } }
    report.finishedAt = new Date().toISOString();
    if (fs.existsSync(credentialsFile)) fs.writeFileSync(reportFile, JSON.stringify(report, null, 2));
    console.log(JSON.stringify(report, null, 2));
  });
}

module.exports = { reviewedBlocks, schemaStatements, verifySchema, execute };
