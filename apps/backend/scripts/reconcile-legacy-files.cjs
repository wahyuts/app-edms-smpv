const fs = require('node:fs/promises');
const path = require('node:path');
const { parseArgs } = require('node:util');
const { digest } = require('../src/utils/storageNamespace');
const { createReconciler, reportDigest } = require('../src/services/legacyFileReconciliation.service');

const snapshotDatabase = async (c) => {
  const [tables] = await c.query("SELECT TABLE_NAME FROM information_schema.TABLES WHERE TABLE_SCHEMA=DATABASE() AND TABLE_TYPE='BASE TABLE' ORDER BY TABLE_NAME");
  const result = [];
  for (const table of tables) {
    const name = table.TABLE_NAME;
    if (!/^[A-Za-z0-9_]+$/.test(name)) throw new Error('Nama tabel tidak didukung.');
    const [rows] = await c.query(`SELECT * FROM \`${name}\``);
    const [ddl] = await c.query(`SHOW CREATE TABLE \`${name}\``);
    result.push({ table: name, count: rows.length, schema: digest(JSON.stringify(ddl)),
      content: digest(rows.map((row) => JSON.stringify(row)).sort().join('\n')) });
  }
  return { digest: digest(JSON.stringify(result)), tables: result.length };
};

const main = async () => {
  const { values } = parseArgs({ options: {
    config: { type: 'string' }, 'env-file': { type: 'string' }, report: { type: 'string' },
    apply: { type: 'boolean', default: false }, 'approved-report': { type: 'string' },
    'approval-digest': { type: 'string' }, 'actor-user-id': { type: 'string' },
    confirm: { type: 'string' }, 'allow-remote': { type: 'boolean', default: false },
  } });
  if (!values.config || !values['env-file'] || !values.report) throw new Error('Wajib: --config --env-file --report. Default: dry-run.');
  const output = path.resolve(values.report);
  if (output === path.resolve(values.config) || output === path.resolve(values['env-file'])
    || (values['approved-report'] && output === path.resolve(values['approved-report']))) throw new Error('Output tidak boleh menimpa input.');
  try { await fs.lstat(output); throw new Error('Output sudah ada; gunakan nama laporan baru.'); }
  catch (error) { if (error.code !== 'ENOENT') throw error; }
  if (values.apply && (!values['approved-report'] || !values['approval-digest'] || !values['actor-user-id']
    || values.confirm !== 'APPLY_REVIEWED_FILE_BINDINGS')) throw new Error('Apply membutuhkan laporan, digest, actor, dan confirmation eksplisit.');
  const config = JSON.parse(await fs.readFile(path.resolve(values.config), 'utf8'));
  const env = require('dotenv').parse(await fs.readFile(path.resolve(values['env-file'])));
  const db = config.database;
  if (!db || db.host !== env.MYSQL_HOST || Number(db.port) !== Number(env.MYSQL_PORT)
    || db.name !== env.MYSQL_DATABASE || !db.versionPrefix || config.environment !== env.APP_ENV) throw new Error('Target tidak sesuai konfigurasi eksplisit.');
  const local = ['127.0.0.1', 'localhost', '::1'].includes(db.host);
  if (!local && !values['allow-remote']) throw new Error('Koneksi remote memerlukan --allow-remote.');
  if (!config.namespaces?.length) throw new Error('Daftar namespace eksplisit wajib diisi.');
  // Provider modules do not initialize storage or import the application/server/pools.
  // Set only this CLI process environment; never modify the .env file.
  Object.assign(process.env, env);
  const namespaces = [];
  for (const value of config.namespaces) {
    let storage;
    if (value.provider === 'local') {
      if (!path.isAbsolute(value.root || '')) throw new Error('Root lokal wajib absolut.');
      const root = await fs.realpath(value.root);
      if (path.resolve(value.root) !== root) throw new Error('Gunakan canonical real root secara eksplisit.');
      const Local = require('../src/storage/drivers/localStorage.driver');
      storage = new Local({ rootPath: root });
    } else if (value.provider === 'r2') {
      if (!value.accountId || !value.endpoint || !value.bucketName || !value.region) throw new Error('Namespace R2 wajib lengkap dan eksplisit.');
      const R2 = require('../src/storage/drivers/r2Storage.driver');
      storage = new R2({ r2: { ...value, accessKeyId: env.R2_ACCESS_KEY_ID, secretAccessKey: env.R2_SECRET_ACCESS_KEY } });
    } else throw new Error('Provider tidak didukung.');
    namespaces.push({ storage, namespace: await storage.captureNamespace() });
  }
  const mysql = require('mysql2/promise');
  const c = await mysql.createConnection({ host: db.host, port: Number(db.port), database: db.name,
    user: env.MYSQL_USER, password: env.MYSQL_PASSWORD || '', dateStrings: true, connectTimeout: 5000,
    multipleStatements: false });
  try {
    const [[identity]] = await c.query('SELECT DATABASE() name,VERSION() version,@@hostname hostname,@@port port,@@datadir dataDirectory');
    if (identity.name !== db.name || (db.serverPort && Number(identity.port) !== Number(db.serverPort)) || !identity.version.startsWith(db.versionPrefix)
      || (db.dataDirectory && path.resolve(identity.dataDirectory).toLowerCase() !== path.resolve(db.dataDirectory).toLowerCase())) {
      throw new Error('Identitas server tidak sesuai target.');
    }
    const target = { environment: config.environment, host: db.host, connectionPort: Number(db.port), ...identity };
    const reconciler = createReconciler({ namespaces, coordination: require('../src/repositories/documentGate.repository') });
    let report;
    if (values.apply) {
      if (!values['approved-report']) throw new Error('--approved-report wajib untuk apply.');
      const approved = JSON.parse(await fs.readFile(values['approved-report'], 'utf8'));
      report = { mode: 'APPLY', target, outcomes: await reconciler.apply({ getConnection: async () => ({
        execute: (...args) => c.execute(...args), beginTransaction: () => c.beginTransaction(),
        commit: () => c.commit(), rollback: () => c.rollback(), release() {},
      }) }, { report: approved, approvalDigest: values['approval-digest'], actorUserId: values['actor-user-id'],
        confirmation: values.confirm, target }) };
    } else {
      await c.query('START TRANSACTION READ ONLY');
      const before = await snapshotDatabase(c);
      const readOnly = { execute: (sql, args) => {
        if (!/^\s*SELECT\b/i.test(sql)) throw new Error('Dry-run melarang SQL mutation.');
        return c.execute(sql, args);
      } };
      report = await reconciler.dryRun(readOnly, target);
      await c.commit();
      await c.query('START TRANSACTION READ ONLY');
      const after = await snapshotDatabase(c);
      await c.commit();
      report.databaseEvidence = { before, after, unchanged: before.digest === after.digest };
      report.approvalDigest = reportDigest(report);
      if (!report.databaseEvidence.unchanged) throw new Error('Snapshot database berubah selama dry-run; hasil tidak boleh digunakan untuk apply.');
    }
    await fs.mkdir(path.dirname(output), { recursive: true });
    await fs.writeFile(output, JSON.stringify(report, null, 2) + '\n', { flag: 'wx', mode: 0o600 });
    console.log(JSON.stringify({ mode: report.mode, summary: report.summary, databaseEvidence: report.databaseEvidence,
      approvalDigest: report.approvalDigest, report: output, outcomes: report.outcomes }, null, 2));
    if (report.summary && report.summary.VERIFIED !== report.summary.total) process.exitCode = 2;
  } finally { await c.rollback().catch(() => {}); await c.end(); }
};

if (require.main === module) main().catch((error) => {
  console.error(JSON.stringify({ code: error.code || 'RECONCILIATION_STOPPED',
    message: error.code ? 'Rekonsiliasi dihentikan. Periksa evidence sebelum mencoba kembali.' : error.message,
    completedDocuments: error.completedDocuments, uncertainDocument: error.uncertainDocument }));
  process.exitCode = 1;
});

module.exports = { snapshotDatabase };
