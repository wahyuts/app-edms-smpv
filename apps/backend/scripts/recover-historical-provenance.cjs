const fs = require('node:fs/promises');
const path = require('node:path');
const { createReadStream } = require('node:fs');
const { createHash } = require('node:crypto');
const { parseArgs } = require('node:util');
const { digest } = require('../src/utils/storageNamespace');
const { snapshotDatabase } = require('./reconcile-legacy-files.cjs');
const { selectScopes, createRecovery, reportDigest } = require('../src/services/historicalProvenanceRecovery.service');

const validateScopeArguments = (options) => {
  const scopes = selectScopes(options['operation-id']);
  const matches = (actual, expected) => Array.isArray(actual) && new Set(actual).size === actual.length
    && JSON.stringify([...actual].sort()) === JSON.stringify([...expected].sort());
  if (!matches(options['document-id'], scopes.map((s) => s.documentId))
    || !matches(options['file-id'], scopes.flatMap((s) => s.files.map((f) => f.fileId)))) throw new Error('Operation, Document, dan File ID harus cocok dengan scope owner.');
  return scopes;
};
const snapshotStorage = async (root) => {
  const entries = [];
  const walk = async (current) => {
    const stat = await fs.lstat(current, { bigint: true });
    if (stat.isSymbolicLink() || await fs.realpath(current) !== current) throw new Error('Storage alias tidak diizinkan.');
    const item = { key: path.relative(root, current).split(path.sep).join('/'), device: String(stat.dev),
      inode: String(stat.ino), birthtime: String(stat.birthtimeNs), mtime: String(stat.mtimeNs), directory: stat.isDirectory() };
    if (stat.isFile()) {
      const hash = createHash('sha256'); for await (const chunk of createReadStream(current)) hash.update(chunk);
      item.size = String(stat.size); item.sha256 = hash.digest('hex');
    } else if (!stat.isDirectory()) throw new Error('Tipe storage tidak dikenal.');
    entries.push(item);
    if (stat.isDirectory()) for (const name of (await fs.readdir(current)).sort()) await walk(path.join(current, name));
  };
  await walk(root);
  return { digest: digest(JSON.stringify(entries)), files: entries.filter((i) => !i.directory).length,
    directories: entries.filter((i) => i.directory).length };
};

const assertReportLocation = async (output, root) => {
  const lower = output.toLowerCase(), storage = root.toLowerCase();
  if (lower === storage || lower.startsWith(storage + path.sep)) throw new Error('Laporan tidak boleh ditulis ke storage.');
  let parent = path.dirname(output);
  while (true) {
    try {
      const stat = await fs.lstat(parent);
      if (!stat.isDirectory() || stat.isSymbolicLink() || (await fs.realpath(parent)).toLowerCase() !== parent.toLowerCase()) {
        throw new Error('Parent laporan harus direktori canonical tanpa alias.');
      }
      return;
    } catch (error) {
      if (error.code !== 'ENOENT') throw error;
      const next = path.dirname(parent); if (next === parent) throw error; parent = next;
    }
  }
};

const main = async () => {
  const { values: options } = parseArgs({ options: {
    config: { type: 'string' }, 'env-file': { type: 'string' }, report: { type: 'string' },
    'operation-id': { type: 'string', multiple: true }, 'document-id': { type: 'string', multiple: true }, 'file-id': { type: 'string', multiple: true },
    apply: { type: 'boolean', default: false }, 'approved-report': { type: 'string' }, 'approval-digest': { type: 'string' },
    'actor-user-id': { type: 'string' }, confirm: { type: 'string' },
  } });
  if (!options.config || !options['env-file'] || !options.report) throw new Error('Wajib: --config --env-file --report dan exact scope IDs. Default: dry-run.');
  validateScopeArguments(options);
  if (options.apply && (!options['approved-report'] || !/^[a-f0-9]{64}$/.test(options['approval-digest'] || '')
    || !options['actor-user-id'] || options.confirm !== 'APPLY_REVIEWED_HISTORICAL_PROVENANCE')) {
    throw new Error('Apply membutuhkan approved report, approval digest, actor Admin, dan confirmation eksplisit.');
  }
  const output = path.resolve(options.report);
  if ([options.config, options['env-file'], options['approved-report']].filter(Boolean).some((p) => path.resolve(p) === output)) throw new Error('Output tidak boleh menimpa input.');
  try { await fs.lstat(output); throw new Error('Output sudah ada; gunakan nama laporan baru.'); } catch (error) { if (error.code !== 'ENOENT') throw error; }
  const config = JSON.parse(await fs.readFile(options.config, 'utf8'));
  const env = require('dotenv').parse(await fs.readFile(options['env-file']));
  const db = config.database;
  if (!db || db.host !== '127.0.0.1' || Number(db.port) !== 3306 || db.name !== 'edms_smpv_dev'
    || db.versionPrefix !== '10.4.32-MariaDB' || config.environment !== 'development'
    || db.host !== env.MYSQL_HOST || Number(db.port) !== Number(env.MYSQL_PORT) || db.name !== env.MYSQL_DATABASE
    || env.APP_ENV !== 'development' || env.STORAGE_DRIVER !== 'local'
    || path.resolve(db.dataDirectory || '').toLowerCase() !== path.resolve('D:/xampp/mysql/data').toLowerCase()
    || config.namespaces?.length !== 1 || config.namespaces[0].provider !== 'local'
    || path.resolve(config.namespaces[0].root) !== path.resolve('D:/Project/app-edms-smpv/apps/backend/storage')) throw new Error('Target wajib XAMPP/local storage yang telah disetujui.');
  const root = await fs.realpath(config.namespaces[0].root);
  if (root !== path.resolve(config.namespaces[0].root)) throw new Error('Root storage tidak aman.');
  await assertReportLocation(output, root);
  Object.assign(process.env, env);
  const Local = require('../src/storage/drivers/localStorage.driver');
  const storage = new Local({ rootPath: root }), namespace = await storage.captureNamespace();
  const c = await require('mysql2/promise').createConnection({ host: db.host, port: 3306, database: db.name,
    user: env.MYSQL_USER, password: env.MYSQL_PASSWORD || '', dateStrings: true, connectTimeout: 5000, multipleStatements: false });
  try {
    const [[identity]] = await c.query('SELECT DATABASE() name,VERSION() version,@@port port,@@datadir dataDirectory,@@hostname hostname');
    if (identity.name !== db.name || !identity.version.startsWith(db.versionPrefix) || Number(identity.port) !== 3306
      || path.resolve(identity.dataDirectory).toLowerCase() !== path.resolve(db.dataDirectory).toLowerCase()) throw new Error('Identitas database tidak sesuai.');
    const target = { environment: config.environment, host: db.host, connectionPort: 3306, ...identity };
    const service = createRecovery({ storage, namespace, operationIds: options['operation-id'] });
    let report;
    if (options.apply) {
      const approved = JSON.parse(await fs.readFile(options['approved-report'], 'utf8'));
      const results = await service.apply({ getConnection: async () => ({ execute: (...args) => c.execute(...args),
        beginTransaction: () => c.beginTransaction(), commit: () => c.commit(), rollback: () => c.rollback(), release() {} }) },
      { report: approved, approvalDigest: options['approval-digest'], actorUserId: options['actor-user-id'],
        confirmation: options.confirm, target });
      report = { mode: 'HISTORICAL_RECOVERY_APPLY', target, results };
    } else {
      const beforeFiles = await snapshotStorage(root);
      await c.query('START TRANSACTION READ ONLY'); const before = await snapshotDatabase(c);
      const readOnly = { execute: (sql, args) => {
        if (!/^\s*SELECT\b/i.test(sql) || /FOR UPDATE|LOCK IN SHARE MODE/i.test(sql)) throw new Error('Dry-run hanya SELECT read-only.');
        return c.execute(sql, args);
      } };
      report = await service.dryRun(readOnly, target); await c.commit();
      await c.query('START TRANSACTION READ ONLY'); const after = await snapshotDatabase(c); await c.commit();
      const afterFiles = await snapshotStorage(root);
      report.databaseEvidence = { before, after, unchanged: before.digest === after.digest };
      report.filesystemEvidence = { before: beforeFiles, after: afterFiles, unchanged: beforeFiles.digest === afterFiles.digest };
      if (!report.databaseEvidence.unchanged || !report.filesystemEvidence.unchanged) report.verdict = 'BLOCKED';
      if (report.verdict === 'PREFLIGHT_PASS') report.approvalDigest = reportDigest(report);
      else delete report.approvalDigest;
    }
    await fs.mkdir(path.dirname(output), { recursive: true });
    await assertReportLocation(output, root);
    await fs.writeFile(output, JSON.stringify(report, null, 2) + '\n', { flag: 'wx', mode: 0o600 });
    console.log(JSON.stringify({ mode: report.mode, target, verdict: report.verdict, report: output,
      items: report.items?.map((i) => ({ operationId: i.scope.operationId, documentId: i.scope.documentId,
        eligible: i.eligible, reason: i.reason, changes: i.changes?.map((v) => ({ fileId: v.fileId, kind: v.kind })) })),
      databaseEvidence: report.databaseEvidence, filesystemEvidence: report.filesystemEvidence,
      approvalDigest: report.approvalDigest, results: report.results }, null, 2));
    if (report.verdict === 'BLOCKED') process.exitCode = 2;
  } finally { await c.rollback().catch(() => {}); await c.end(); }
};
if (require.main === module) main().catch((error) => {
  console.error(JSON.stringify({ code: error.code || 'HISTORICAL_RECOVERY_STOPPED',
    message: error.code ? 'Recovery dihentikan; periksa evidence sebelum tindakan berikutnya.' : error.message,
    completedDocuments: error.completedDocuments, uncertainDocument: error.uncertainDocument }));
  process.exitCode = 1;
});
module.exports = { validateScopeArguments, snapshotStorage, assertReportLocation };
