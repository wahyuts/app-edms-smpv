const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const fsSync = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const isolated = require('../helpers/isolatedMariaDb.cjs');

test('dump SQL scanner preserves executable comments and quoted semicolons without executing directives', () => {
  const sql = "-- header\nCREATE DATABASE `edms_smpv_dev`; USE `edms_smpv_dev`; /*!40101 SET NAMES utf8mb4 */; INSERT INTO `t` VALUES ('a; b', 'x\\\'y');";
  const parts = isolated.statements(sql);
  assert.equal(parts.length, 4);
  assert.equal(parts[2], '/*!40101 SET NAMES utf8mb4 */');
  assert.match(parts[3], /a; b/);
  assert.throws(() => isolated.statements("SELECT 'unterminated"));
});

test('isolated identity verifier rejects the original port, datadir and database', async () => {
  const id = { db: isolated.database, version: '10.4.32-MariaDB', hostname: os.hostname(), port: isolated.port,
    datadir: isolated.datadir, serverId: isolated.port, forceRecovery: 0 };
  const c = (patch) => ({ query: async () => [[{ ...id, ...patch }]] });
  assert.equal((await isolated.verify(c({}), isolated.database)).port, 13317);
  for (const patch of [{ port: 3306 }, { datadir: 'D:/xampp/mysql/data' }, { db: 'edms_smpv_dev' }, { forceRecovery: 1 }]) {
    await assert.rejects(isolated.verify(c(patch), isolated.database));
  }
});

test('bounded work returns settled value and reports an unresolved deadline', async () => {
  assert.equal(await isolated.bounded(Promise.resolve(42), 50, 'deadline'), 42);
  await assert.rejects(isolated.bounded(new Promise(() => {}), 10, 'expected deadline'), { code: 'TEST_DEADLINE' });
});

test('worker rejection before a signal propagates rather than waiting forever', async () => {
  const error = Object.assign(new Error('Synthetic worker failure'), { code: 'SYNTHETIC_FAILURE' });
  await assert.rejects(isolated.waitForSignal(new Promise(() => {}), Promise.reject(error), 50), { code: 'SYNTHETIC_FAILURE' });
});

test('worker early completion without a signal is a deterministic failure', async () => {
  await assert.rejects(isolated.waitForSignal(new Promise(() => {}), Promise.resolve({ status: 'PENDING' }), 50), { code: 'WORKER_SIGNAL_MISSING' });
});

test('an emitted signal does not require the worker to complete first', async () => {
  assert.equal(await isolated.waitForSignal(Promise.resolve('started'), new Promise(() => {}), 50), 'started');
});

test('harnesses retain explicit isolation flags and do not abruptly exit their cleanup path', () => {
  for (const name of ['sprintADatabaseValidation.cjs', 'sprintBDatabaseValidation.cjs']) {
    const source = fsSync.readFileSync(path.resolve(__dirname, '../integration', name), 'utf8');
    assert.doesNotMatch(source, /\bprocess\.exit\s*\(/);
    assert.doesNotMatch(source, /readFileSync\([^\n]*\.env/);
    assert.match(source, /isolated\.target\('synthetic'\)/);
  }
});

test('Node Windows-compatible unlink is path-based, not FileHandle-relative; owned fixture is preserved', async () => {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), 'edms-handle-capability-'));
  const filename = path.join(root, 'synthetic.txt'); let handle;
  try {
    await fs.writeFile(filename, 'test-owned fixture'); handle = await fs.open(filename, 'r');
    await assert.rejects(fs.unlink(handle), { code: 'ERR_INVALID_ARG_TYPE' });
    assert.equal(await fs.readFile(filename, 'utf8'), 'test-owned fixture');
  } finally {
    if (handle) await handle.close();
    await fs.unlink(filename); await fs.rmdir(root);
  }
});
