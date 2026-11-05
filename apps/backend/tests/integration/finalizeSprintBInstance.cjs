const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const mysql = require('mysql2/promise');
const isolated = require('../helpers/isolatedMariaDb.cjs');

const finalCleanup = process.argv.includes('--final-local-cleanup');
const sprintC = process.argv.includes('--sprint-c-regression');
const sprintD = process.argv.includes('--sprint-d-regression');
const stamp = sprintD ? '0006' : sprintC ? '0005' : finalCleanup ? '0004' : '0003';
const output = path.join(isolated.root, `database/migration/reports/20261102_${stamp}_isolated_final_verification.json`);
const report = { startedAt: new Date().toISOString(), originalServerAccess: false };
const main = async () => {
  assert.ok(process.argv.includes('--verify-and-shutdown-isolated-only'), 'Explicit isolated shutdown flag required');
  const read = (name) => JSON.parse(fs.readFileSync(path.join(isolated.root, 'database/migration/reports', name), 'utf8'));
  const restore = read('20261102_0003_isolated_restore_results.json');
  const a = read(`20261102_${stamp}_sprint_a_isolated_results.json`);
  const b = read(`20261102_${stamp}_sprint_b_isolated_results.json`);
  const probe = read('20261102_0003_sprint_b_watchdog_probe.json');
  assert.equal(restore.restore.status, 'PASS');
  assert.equal(a.passed, 18); assert.equal(a.failed, 0); assert.equal(a.poolsClosed, true);
  assert.equal(b.passed, finalCleanup || sprintC || sprintD ? 30 : 21); assert.equal(b.failed, 0); assert.equal(b.shutdown.poolsClosed, true); assert.equal(b.shutdown.unresolvedTasks, 0);
  if (sprintC || sprintD) {
    const c = read(`20261102_${stamp}_sprint_c_isolated_results.json`);
    assert.equal(c.passed, 48); assert.equal(c.failed, 0); assert.equal(c.shutdown.poolsClosed, true); assert.equal(c.shutdown.unresolvedTasks, 0);
  }
  if (sprintD) {
    const d = read('20261102_0006_sprint_d_isolated_results.json');
    assert.equal(d.passed, 67); assert.equal(d.failed, 0); assert.equal(d.shutdown.poolsClosed, true); assert.equal(d.shutdown.unresolvedTasks, 0);
  }
  assert.equal(probe.fatal.code, 'TEST_DEADLINE'); assert.equal(probe.shutdown.poolsClosed, true); assert.equal(probe.shutdown.unresolvedTasks, 1);
  const expectedHash = '3796876d7886d4623414997ada31d0efaba44328d888421fa40c7b58d945b56b';
  const backup = 'D:/EDMS-Database-Backup/20261102_201931_697ca290/edms_smpv_dev_20261102_201931.sql';
  assert.equal(isolated.hash(fs.readFileSync(backup)), expectedHash); report.originalBackupUnchanged = true;
  const c = await mysql.createConnection(isolated.target());
  try {
    report.identity = await isolated.verify(c);
    const [[pid]] = await c.query('SELECT @@pid_file pidFile');
    assert.equal(isolated.normalizedPath(pid.pidFile), isolated.normalizedPath(path.join(isolated.instanceRoot, 'server.pid')));
    report.isolatedPid = Number(fs.readFileSync(pid.pidFile, 'utf8').trim());
    report.restoredDatabases = [];
    for (const name of [isolated.restoreDatabase, 'edms_restore_validation_confirmed', 'edms_restore_validation_reviewed']) {
      const [tables] = await c.execute('SELECT TABLE_NAME FROM information_schema.TABLES WHERE TABLE_SCHEMA=? ORDER BY TABLE_NAME', [name]);
      assert.equal(tables.length, 24); let total = 0;
      for (const table of tables) {
        assert.match(table.TABLE_NAME, /^[a-z_]+$/);
        const [[count]] = await c.query(`SELECT COUNT(*) n FROM \`${name}\`.\`${table.TABLE_NAME}\``);
        assert.equal(Number(count.n), restore.restore.rowCounts[table.TABLE_NAME]); total += Number(count.n);
      }
      assert.equal(total, 1231); report.restoredDatabases.push({ database: name, tables: 24, rows: total, countsUnchangedAfterTests: true });
    }
    const [[indexes]] = await c.execute(`SELECT COUNT(*) n FROM
      (SELECT TABLE_NAME,INDEX_NAME FROM information_schema.STATISTICS WHERE TABLE_SCHEMA=? GROUP BY TABLE_NAME,INDEX_NAME) i`, [restore.restore.database]);
    report.restoreIndexDefinitions = Number(indexes.n);
    report.restoreObjects = {};
    for (const [table, column] of [['VIEWS','TABLE_SCHEMA'],['TRIGGERS','TRIGGER_SCHEMA'],['ROUTINES','ROUTINE_SCHEMA'],['EVENTS','EVENT_SCHEMA']]) {
      const [[count]] = await c.execute(`SELECT COUNT(*) n FROM information_schema.${table} WHERE ${column}=?`, [restore.restore.database]);
      assert.equal(Number(count.n), 0); report.restoreObjects[table] = 0;
    }
    const limited = await mysql.createConnection({ ...isolated.target('synthetic'), database: isolated.database });
    try {
      await isolated.verify(limited, isolated.database);
      let denied = false;
      try { await limited.query('SELECT 1 FROM `edms_restore_validation_reviewed`.`users` LIMIT 0'); }
      catch (error) { assert.ok(['ER_TABLEACCESS_DENIED_ERROR', 'ER_DBACCESS_DENIED_ERROR'].includes(error.code)); denied = true; }
      assert.equal(denied, true, 'Synthetic account must not access restored real data');
      report.syntheticAccountCannotReadRestore = true;
    } finally { await limited.end(); }
    const [active] = await c.query("SELECT ID FROM information_schema.PROCESSLIST WHERE ID <> CONNECTION_ID() AND COMMAND IN ('Query','Execute')");
    assert.equal(active.length, 0); report.activeCommandsBeforeShutdown = 0;
    report.shutdownAcknowledged = false;
    await c.query('SHUTDOWN'); report.shutdownAcknowledged = true;
  } finally { await c.end().catch(() => c.destroy()); }
  report.status = 'PASS'; report.finishedAt = new Date().toISOString();
};
main().catch((error) => { report.status = 'FAIL'; report.error = { code: error.code || error.name,
  message: error.name === 'AssertionError' ? error.message.split('\n')[0] : 'Isolated final verification did not complete' }; process.exitCode = 1; }).finally(() => {
  fs.writeFileSync(output, JSON.stringify(report, null, 2) + '\n');
  console.log(JSON.stringify(report, null, 2));
});
