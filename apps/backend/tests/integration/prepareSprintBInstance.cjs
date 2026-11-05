const fs = require('node:fs');
const path = require('node:path');
const cp = require('node:child_process');
const crypto = require('node:crypto');
const assert = require('node:assert/strict');
const mysql = require('mysql2/promise');
const isolated = require('../helpers/isolatedMariaDb.cjs');

const backup = 'D:/EDMS-Database-Backup/20261102_201931_697ca290/edms_smpv_dev_20261102_201931.sql';
const expectedHash = '3796876d7886d4623414997ada31d0efaba44328d888421fa40c7b58d945b56b';
const output = path.join(isolated.root, 'database/migration/reports/20261102_0003_isolated_restore_results.json');
const report = { startedAt: new Date().toISOString(), backupHash: expectedHash, originalServerAccess: false };
const normal = (value) => value.replace(/AUTO_INCREMENT=\d+/g, 'AUTO_INCREMENT=<dynamic>').replace(/\s+/g, ' ').trim().replace(/;$/, '');

const initialize = () => {
  assert.ok(!fs.existsSync(isolated.instanceRoot), 'Existing instance directory must not be overwritten');
  const installer = 'D:/xampp/mysql/bin/mysql_install_db.exe';
  assert.ok(fs.existsSync(installer) && fs.existsSync('D:/xampp/mysql/bin/mysqld.exe'));
  fs.mkdirSync(isolated.instanceRoot, { recursive: true });
  const sid = cp.execFileSync('powershell.exe', ['-NoProfile', '-NonInteractive', '-Command', '[Security.Principal.WindowsIdentity]::GetCurrent().User.Value'], { encoding: 'utf8', windowsHide: true }).trim();
  assert.match(sid, /^S-1-[0-9-]+$/);
  cp.execFileSync('icacls.exe', [isolated.instanceRoot, '/inheritance:r', '/grant:r', `*${sid}:(OI)(CI)F`, '*S-1-5-18:(OI)(CI)F', '*S-1-5-32-544:(OI)(CI)F'], { windowsHide: true });
  const password = crypto.randomBytes(32).toString('hex');
  // No service registration, no default configuration, no original datadir input.
  try { cp.execFileSync(installer, [`--datadir=${isolated.datadir}`, `--port=${isolated.port}`, `--password=${password}`, '--skip-networking'], { cwd: isolated.instanceRoot, windowsHide: true, stdio: 'pipe', timeout: 60000 }); }
  catch { throw new Error('Isolated initialization failed; inspect only the new instance directory, do not retry over it'); }
  fs.mkdirSync(path.join(isolated.instanceRoot, 'scratch'));
  const slash = (value) => value.replace(/\\/g, '/');
  const config = `[mysqld]\nbasedir=D:/xampp/mysql\ndatadir=${slash(isolated.datadir)}\nport=${isolated.port}\nbind-address=127.0.0.1\nserver-id=${isolated.port}\nskip-name-resolve\nskip-log-bin\ninnodb_data_home_dir=${slash(isolated.datadir)}\ninnodb_log_group_home_dir=${slash(isolated.datadir)}\ninnodb_buffer_pool_size=64M\nmax_allowed_packet=32M\ntmpdir=${slash(path.join(isolated.instanceRoot, 'scratch'))}\npid-file=${slash(path.join(isolated.instanceRoot, 'server.pid'))}\nlog-error=${slash(path.join(isolated.instanceRoot, 'server-error.log'))}\nevent_scheduler=OFF\ncharacter-set-server=utf8mb4\ncollation-server=utf8mb4_unicode_ci\nsql_mode=NO_ZERO_IN_DATE,NO_ZERO_DATE,NO_ENGINE_SUBSTITUTION\n`;
  assert.ok(!config.includes('D:/xampp/mysql/data'));
  fs.writeFileSync(path.join(isolated.instanceRoot, 'server.ini'), config, { flag: 'wx' });
  fs.writeFileSync(path.join(isolated.instanceRoot, 'connection.json'), JSON.stringify({ owner: isolated.owner, host: '127.0.0.1', port: isolated.port, datadir: isolated.datadir, user: 'root', password }), { flag: 'wx' });
  console.log(JSON.stringify({ initialized: true, root: isolated.instanceRoot, port: isolated.port, serviceRegistered: false }));
};

const restoreAndPrepare = async (verifyExisting = false, restoreOnly = false) => {
  const restoreTarget = restoreOnly ? 'edms_restore_validation_reviewed' : isolated.restoreDatabase;
  const restoreWarnings = [];
  const source = fs.readFileSync(backup);
  assert.equal(isolated.hash(source), expectedHash, 'Original backup hash mismatch');
  const sql = isolated.statements(source.toString('utf8'));
  const tableStatements = sql.filter((s) => /^CREATE TABLE `/i.test(s));
  assert.equal(tableStatements.length, 24);
  const expectedTables = tableStatements.map((s) => /^CREATE TABLE `([^`]+)`/.exec(s)[1]);
  const c = await mysql.createConnection(isolated.target());
  try {
    report.identity = await isolated.verify(c);
    const [[exists]] = await c.execute('SELECT COUNT(*) n FROM information_schema.SCHEMATA WHERE SCHEMA_NAME=?', [restoreTarget]);
    assert.equal(Number(exists.n), verifyExisting ? 1 : 0, 'Existing validation databases must not be overwritten');
    if (verifyExisting) {
      const [[found]] = await c.execute('SELECT COUNT(*) n FROM information_schema.SCHEMATA WHERE SCHEMA_NAME=?', [restoreTarget]);
      assert.equal(Number(found.n), 1);
    } else await c.query(`CREATE DATABASE \`${restoreTarget}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`);
    await c.changeUser({ database: restoreTarget });
    await isolated.verify(c, restoreTarget);
    let skippedDatabase = 0; let skippedUse = 0;
    for (const statement of sql) {
      if (/^CREATE DATABASE\b/i.test(statement)) {
        assert.match(statement, /`edms_smpv_dev`/); skippedDatabase += 1; continue;
      }
      if (/^USE\b/i.test(statement)) { assert.equal(statement, 'USE `edms_smpv_dev`'); skippedUse += 1; continue; }
      const executable = statement.replace(/\/\*![0-9]{5}\s*([\s\S]*?)\*\//g, '$1').trim();
      assert.match(executable, /^(SET\b|CREATE TABLE `|INSERT INTO `)/i, 'Unexpected backup statement type');
      assert.doesNotMatch(executable.slice(0, 100), /SET\s+(?:@@)?GLOBAL|SET\s+PASSWORD/i);
      if (/^(CREATE TABLE|INSERT INTO) `/i.test(statement)) {
        const name = /^(?:CREATE TABLE|INSERT INTO) `([^`]+)`/i.exec(statement)[1]; assert.ok(expectedTables.includes(name));
        if (/^CREATE TABLE/.test(statement)) assert.doesNotMatch(statement, /REFERENCES\s+`[^`]+`\s*\./i);
      }
      if (!verifyExisting) {
        const [result] = await c.query(statement);
        if (result?.warningStatus) {
          const [warnings] = await c.query('SHOW WARNINGS');
          for (const warning of warnings) {
            const derived = /generated column '([^']+)' in table '([^']+)' has been ignored/i.exec(warning.Message);
            const allowed = { users: 'email_uniqueness_key', document_revisions: 'active_document_id' };
            const table = /^INSERT INTO `([^`]+)`/.exec(statement)?.[1];
            const expected = warning.Code === 1906 && derived && derived[2] === table && allowed[table] === derived[1];
            restoreWarnings.push({ code: warning.Code, table: table || null, column: derived?.[1] || null, expectedGeneratedColumn: Boolean(expected) });
          }
        }
      }
    }
    assert.equal(skippedDatabase, 1); assert.equal(skippedUse, 1);
    const [tables] = await c.execute('SELECT TABLE_NAME FROM information_schema.TABLES WHERE TABLE_SCHEMA=? ORDER BY TABLE_NAME', [restoreTarget]);
    assert.deepEqual(tables.map((t) => t.TABLE_NAME).sort(), [...expectedTables].sort());
    const rowCounts = {}; const dumpCounts = Object.fromEntries(expectedTables.map((name) => [name, 0]));
    for (const statement of sql) if (/^INSERT INTO `/.test(statement)) dumpCounts[/^INSERT INTO `([^`]+)`/.exec(statement)[1]] += 1;
    for (const name of expectedTables) {
      const [[count]] = await c.query(`SELECT COUNT(*) n FROM \`${name}\``); rowCounts[name] = Number(count.n);
      const [created] = await c.query(`SHOW CREATE TABLE \`${name}\``);
      assert.equal(normal(created[0]['Create Table']), normal(tableStatements.find((s) => s.startsWith(`CREATE TABLE \`${name}\``))), `Schema mismatch: ${name}`);
    }
    assert.deepEqual(rowCounts, dumpCounts); assert.equal(Object.values(rowCounts).reduce((a, b) => a + b, 0), 1231);
    const [constraints] = await c.execute('SELECT CONSTRAINT_TYPE,COUNT(*) n FROM information_schema.TABLE_CONSTRAINTS WHERE CONSTRAINT_SCHEMA=? GROUP BY CONSTRAINT_TYPE', [restoreTarget]);
    const [foreignKeys] = await c.execute(`SELECT TABLE_NAME,COLUMN_NAME,REFERENCED_TABLE_NAME,REFERENCED_COLUMN_NAME FROM information_schema.KEY_COLUMN_USAGE
      WHERE TABLE_SCHEMA=? AND REFERENCED_TABLE_NAME IS NOT NULL`, [restoreTarget]);
    for (const fk of foreignKeys) {
      for (const value of Object.values(fk)) assert.match(value, /^[a-z_]+$/i);
      const [[orphans]] = await c.query(`SELECT COUNT(*) n FROM \`${fk.TABLE_NAME}\` c LEFT JOIN \`${fk.REFERENCED_TABLE_NAME}\` p
        ON c.\`${fk.COLUMN_NAME}\`=p.\`${fk.REFERENCED_COLUMN_NAME}\` WHERE c.\`${fk.COLUMN_NAME}\` IS NOT NULL AND p.\`${fk.REFERENCED_COLUMN_NAME}\` IS NULL`);
      assert.equal(Number(orphans.n), 0, 'Foreign key orphan found');
    }
    assert.ok(restoreWarnings.every((w) => w.expectedGeneratedColumn), 'Unexpected restore warning requires review');
    const [[emailKeys]] = await c.query(`SELECT COUNT(*) n FROM users WHERE NOT (email_uniqueness_key <=>
      CASE WHEN email IS NULL OR TRIM(email)='' THEN NULL
      WHEN LOWER(TRIM(email)) COLLATE utf8mb4_bin IN ('wahyu.trisna100@gmail.com','beta.int100@gmail.com') THEN NULL ELSE LOWER(TRIM(email)) END)`);
    const [[revisionKeys]] = await c.query('SELECT COUNT(*) n FROM document_revisions WHERE NOT (active_document_id <=> CASE WHEN is_active=1 THEN document_id ELSE NULL END)');
    assert.equal(Number(emailKeys.n), 0); assert.equal(Number(revisionKeys.n), 0);
    report.restore = { status: 'PASS', database: restoreTarget, verifiedExistingRestore: verifyExisting, tables: 24, rows: 1231, rowCounts, constraints, checkedForeignKeys: foreignKeys.length, orphanCount: 0,
      targetDirectivesSkipped: { createDatabase: skippedDatabase, use: skippedUse }, warnings: restoreWarnings, generatedKeyMismatches: 0,
      perStatementWarningsChecked: !verifyExisting, schemaDefinitionsMatch: true };
    if (!restoreOnly) {
    await c.query(`CREATE DATABASE \`${isolated.database}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`);
    await c.changeUser({ database: isolated.database }); await isolated.verify(c, isolated.database);
    const schema = fs.readFileSync(path.join(isolated.root, 'database/schema/schema-dev.sql'), 'utf8');
    const a = fs.readFileSync(path.join(isolated.root, 'database/migration/20261102_0001_permanent_delete_foundation_mariadb.sql'), 'utf8');
    const b = fs.readFileSync(path.join(isolated.root, 'database/migration/20261102_0002_permanent_delete_cleanup_mariadb.sql'), 'utf8');
    const ddl = isolated.statements(schema);
    assert.match(ddl.shift(), /^CREATE DATABASE IF NOT EXISTS edms_smpv_dev\b/); assert.equal(ddl.shift(), 'USE edms_smpv_dev');
    for (const statement of [...ddl, ...isolated.statements(a), ...isolated.statements(b)]) {
      assert.match(statement, /^(CREATE TABLE|ALTER TABLE) [a-z_]+\s/i); assert.doesNotMatch(statement, /\bedms_(?:db|smpv_dev)\b/); await c.query(statement);
    }
    await c.query(`CREATE TABLE sprint_a_test_ownership (id VARCHAR(128) PRIMARY KEY,schema_hash CHAR(64) NOT NULL,migration_hash CHAR(64) NOT NULL,
      state VARCHAR(32) NOT NULL,created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3)) ENGINE=InnoDB`);
    await c.execute('INSERT INTO sprint_a_test_ownership (id,schema_hash,migration_hash,state) VALUES (?,?,?,?)',
      ['app-edms-smpv:Sprint-A-database-validation', isolated.hash(schema), isolated.hash(a), 'READY']);
    const [[inventory]] = await c.execute('SELECT COUNT(*) n FROM information_schema.TABLES WHERE TABLE_SCHEMA=?', [isolated.database]);
    assert.equal(Number(inventory.n), 34);
    report.synthetic = { database: isolated.database, tableCount: Number(inventory.n), realDataRestored: false, fixtureRows: 0, schemaHash: isolated.hash(schema), foundationHash: isolated.hash(a), cleanupHash: isolated.hash(b) };
    }
    assert.equal(isolated.hash(fs.readFileSync(backup)), expectedHash);
    report.originalBackupUnchanged = true;
  } finally { await c.end(); }
  report.finishedAt = new Date().toISOString(); fs.writeFileSync(output, JSON.stringify(report, null, 2) + '\n');
  console.log(JSON.stringify({ restore: 'PASS', tables: report.restore.tables, rows: report.restore.rows, synthetic: report.synthetic, report: output }));
};

const restrictSyntheticUser = async () => {
  const c = await mysql.createConnection(isolated.target());
  try {
    await isolated.verify(c);
    const filename = path.join(isolated.instanceRoot, 'connection.json');
    const marker = JSON.parse(fs.readFileSync(filename, 'utf8'));
    assert.ok(!marker.testUser, 'Test account must not be silently overwritten');
    const password = crypto.randomBytes(32).toString('hex');
    await c.query("CREATE USER 'edms_sprint_test'@'127.0.0.1' IDENTIFIED BY ?", [password]);
    await c.query(`GRANT ALL PRIVILEGES ON \`${isolated.database}\`.* TO 'edms_sprint_test'@'127.0.0.1'`);
    marker.testUser = 'edms_sprint_test'; marker.testPassword = password;
    fs.writeFileSync(filename, JSON.stringify(marker));
    console.log(JSON.stringify({ syntheticUserRestrictedTo: isolated.database, restoredDatabaseAccessGranted: false }));
  } finally { await c.end(); }
};

if (process.argv.includes('--initialize-isolated-only')) {
  try { initialize(); } catch (error) { console.log(JSON.stringify({ status: 'BLOCKED', error: error.message.replace(/password=[^\s]+/gi, 'password=<redacted>') })); process.exitCode = 1; }
} else if (process.argv.includes('--restrict-synthetic-user-only')) {
  restrictSyntheticUser().catch((error) => { console.log(JSON.stringify({ status: 'BLOCKED', code: error.code || error.name })); process.exitCode = 1; });
} else if (process.argv.includes('--restore-and-prepare-isolated-only') || process.argv.includes('--verify-existing-restore-and-prepare-isolated-only') || process.argv.includes('--restore-validation-only')) {
  restoreAndPrepare(process.argv.includes('--verify-existing-restore-and-prepare-isolated-only'), process.argv.includes('--restore-validation-only')).catch((error) => { report.fatal = { code: error.code || error.name, message: error.name === 'AssertionError' ? error.message.split('\n')[0] : 'Restore/initialization failed; original source was not accessed' };
    fs.writeFileSync(output, JSON.stringify(report, null, 2) + '\n'); console.log(JSON.stringify(report.fatal)); process.exitCode = 1; });
} else { console.error('Explicit isolated initialization or restore flag required'); process.exitCode = 1; }
