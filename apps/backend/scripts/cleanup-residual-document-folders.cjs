const fs = require('node:fs/promises');
const path = require('node:path');
const { parseArgs } = require('node:util');
const { snapshotDatabase } = require('./reconcile-legacy-files.cjs');
const { createResidualCleanup, reportDigest } = require('../src/services/residualDocumentFolders.service');

const main = async () => {
  const { values: options } = parseArgs({ options: { config: { type: 'string' }, 'env-file': { type: 'string' }, report: { type: 'string' },
    apply: { type: 'boolean', default: false }, 'approved-report': { type: 'string' }, 'approval-digest': { type: 'string' },
    'actor-user-id': { type: 'string' }, confirm: { type: 'string' }, 'allow-remote': { type: 'boolean', default: false } } });
  if (!options.config || !options['env-file'] || !options.report) throw new Error('Wajib: --config --env-file --report.');
  if (options.apply && (!options['approved-report'] || !options['approval-digest'] || !options['actor-user-id']
    || options.confirm !== 'CLEAN_REVIEWED_EMPTY_DOCUMENT_FOLDERS')) throw new Error('Apply memerlukan approval eksplisit.');
  const output = path.resolve(options.report);
  try { await fs.lstat(output); throw new Error('Output sudah ada.'); } catch (error) { if (error.code !== 'ENOENT') throw error; }
  const config = JSON.parse(await fs.readFile(options.config, 'utf8'));
  const env = require('dotenv').parse(await fs.readFile(options['env-file'])); const db = config.database;
  if (db.host !== env.MYSQL_HOST || Number(db.port) !== Number(env.MYSQL_PORT) || db.name !== env.MYSQL_DATABASE
    || config.environment !== env.APP_ENV || !db.versionPrefix) throw new Error('Target tidak sesuai konfigurasi eksplisit.');
  if (!['127.0.0.1','localhost','::1'].includes(db.host) && !options['allow-remote']) throw new Error('Remote memerlukan --allow-remote.');
  Object.assign(process.env, env);
  const namespaces = [];
  for (const item of config.namespaces || []) {
    let storage;
    if (item.provider === 'local') {
      if (!path.isAbsolute(item.root)) throw new Error('Root harus absolut.');
      const root = await fs.realpath(item.root);
      if (path.resolve(item.root) !== root) throw new Error('Root harus canonical.');
      const Driver = require('../src/storage/drivers/localStorage.driver'); storage = new Driver({ rootPath: root });
    } else if (item.provider === 'r2') {
      if (!item.accountId || !item.endpoint || !item.bucketName || !item.region) throw new Error('Namespace R2 wajib eksplisit.');
      const Driver = require('../src/storage/drivers/r2Storage.driver');
      storage = new Driver({ r2: { ...item, accessKeyId: env.R2_ACCESS_KEY_ID, secretAccessKey: env.R2_SECRET_ACCESS_KEY } });
    } else throw new Error('Provider tidak didukung.');
    namespaces.push({ storage, namespace: await storage.captureNamespace() });
  }
  if (!namespaces.length) throw new Error('Namespace wajib eksplisit.');
  const c = await require('mysql2/promise').createConnection({ host: db.host, port: Number(db.port), database: db.name,
    user: env.MYSQL_USER, password: env.MYSQL_PASSWORD || '', dateStrings: true, connectTimeout: 5000, multipleStatements: false });
  try {
    const [[identity]] = await c.query('SELECT DATABASE() name,VERSION() version,@@port port,@@datadir dataDirectory,@@hostname hostname');
    if (identity.name !== db.name || !identity.version.startsWith(db.versionPrefix)
      || (db.serverPort && Number(db.serverPort) !== Number(identity.port))
      || (db.dataDirectory && path.resolve(db.dataDirectory).toLowerCase() !== path.resolve(identity.dataDirectory).toLowerCase())) throw new Error('Identitas database tidak sesuai.');
    const target = { environment: config.environment, host: db.host, connectionPort: Number(db.port), ...identity };
    const service = createResidualCleanup({ namespaces, coordination: require('../src/repositories/documentGate.repository') });
    let report;
    if (options.apply) {
      const approved = JSON.parse(await fs.readFile(options['approved-report'], 'utf8'));
      const results = await service.apply({ getConnection: async () => ({ execute: (...args) => c.execute(...args),
        beginTransaction: () => c.beginTransaction(), commit: () => c.commit(), rollback: () => c.rollback(), release() {} }) },
      { report: approved, approvalDigest: options['approval-digest'], confirmation: options.confirm, actorUserId: options['actor-user-id'], target });
      report = { mode: 'RESIDUAL_APPLY', target, results };
    } else {
      await c.query('START TRANSACTION READ ONLY'); const before = await snapshotDatabase(c);
      const readOnly = { execute: (sql, args) => { if (!/^\s*SELECT\b/.test(sql)) throw new Error('Dry-run hanya SELECT.'); return c.execute(sql, args); } };
      report = await service.dryRun(readOnly, target); await c.commit();
      await c.query('START TRANSACTION READ ONLY'); const after = await snapshotDatabase(c); await c.commit();
      if (before.digest !== after.digest) throw new Error('Database berubah selama dry-run.');
      report.databaseEvidence = { before, after, unchanged: true }; report.approvalDigest = reportDigest(report);
    }
    await fs.mkdir(path.dirname(output), { recursive: true });
    await fs.writeFile(output, JSON.stringify(report, null, 2) + '\n', { flag: 'wx', mode: 0o600 });
    console.log(JSON.stringify({ mode: report.mode, report: output, approvalDigest: report.approvalDigest,
      databaseEvidence: report.databaseEvidence, items: report.items?.map(({ observed, ...item }) => ({ ...item,
        directoryCount: observed?.directories?.length, unknownObjectCount: observed?.objects?.length })), results: report.results }, null, 2));
  } finally { await c.rollback().catch(() => {}); await c.end(); }
};
if (require.main === module) main().catch((error) => { console.error(JSON.stringify({ code: error.code || 'RESIDUAL_STOPPED',
  message: error.code ? 'Cleanup dihentikan; periksa evidence.' : error.message, completedFolders: error.completedFolders })); process.exitCode = 1; });
