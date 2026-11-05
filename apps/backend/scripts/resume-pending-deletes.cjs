const fs = require('node:fs/promises');
const path = require('node:path');
const { createReadStream } = require('node:fs');
const { createHash } = require('node:crypto');
const { parseArgs } = require('node:util');
const { snapshotDatabase } = require('./reconcile-legacy-files.cjs');
const { snapshotStorage, assertReportLocation } = require('./recover-historical-provenance.cjs');
const { createPendingResume, reportDigest, selectScope, assertTarget } = require('../src/services/pendingDeleteResume.service');

const sha = async (file) => { const hash = createHash('sha256'); for await (const chunk of createReadStream(file)) hash.update(chunk); return hash.digest('hex'); };
const verifyBackups = async (manifestPath, target, namespace) => {
  const manifest = JSON.parse(await fs.readFile(manifestPath, 'utf8'));
  if (manifest.version !== 1 || manifest.type !== 'PENDING_DELETE_RESUME_BACKUP' || manifest.target.name !== target.name
    || manifest.target.host !== target.host || manifest.target.port !== target.connectionPort
    || manifest.target.namespaceId !== namespace.id || manifest.files.length !== 7 || new Set(manifest.files.map(f => f.fileId)).size !== 7
    || manifest.database.tables !== 33 || manifest.database.verified !== true) throw new Error('Backup manifest tidak sesuai scope.');
  if (new Set([manifest.database.path, ...manifest.files.map(f => f.path)]).size !== 8) throw new Error('Backup path harus terpisah untuk database dan tujuh file.');
  const base = await fs.realpath(path.dirname(path.resolve(manifestPath)));
  if (base.toLowerCase() === namespace.descriptor.root.toLowerCase() || base.toLowerCase().startsWith(namespace.descriptor.root.toLowerCase() + path.sep)) throw new Error('Backup berada di live storage.');
  for (const entry of [manifest.database, ...manifest.files]) {
    const full = path.resolve(entry.path);
    if (!full.startsWith(base + path.sep) || await fs.realpath(full) !== full || (await fs.lstat(full)).isSymbolicLink()
      || (await fs.stat(full)).size !== entry.size || await sha(full) !== entry.sha256) throw new Error('Backup file berubah atau tidak valid.');
  }
  for (const entry of manifest.files) {
    if (path.resolve(base, 'files', ...entry.key.split('/')) !== path.resolve(entry.path)) throw new Error('Backup wajib mempertahankan exact relative storage path.');
  }
  return { verified: true, manifestPath: path.resolve(manifestPath), manifestSha256: await sha(manifestPath), manifest };
};
const validateBackupScope = (report) => {
  if (report.verdict !== 'PREFLIGHT_PASS') return;
  const files = report.items.flatMap(i => i.proofs).sort((a, b) => a.fileId.localeCompare(b.fileId));
  const backupFiles = [...report.backups.manifest.files].sort((a, b) => a.fileId.localeCompare(b.fileId));
  if (files.length !== 7 || files.some((f, i) => f.fileId !== backupFiles[i].fileId || f.key !== backupFiles[i].key
    || f.size !== backupFiles[i].size || f.sha256 !== backupFiles[i].sha256
    || JSON.stringify(f.localIdentity) !== JSON.stringify(backupFiles[i].originalIdentity))) throw new Error('Backup tidak cocok dengan tujuh file live.');
};
const main = async () => {
  const { values: o } = parseArgs({ options: { config: { type: 'string' }, 'env-file': { type: 'string' }, report: { type: 'string' },
    'backup-manifest': { type: 'string' }, 'actor-user-id': { type: 'string' }, 'operation-id': { type: 'string', multiple: true },
    'document-id': { type: 'string', multiple: true }, apply: { type: 'boolean', default: false },
    'approved-report': { type: 'string' }, 'approval-digest': { type: 'string' }, confirm: { type: 'string' } } });
  if (!o.config || !o['env-file'] || !o.report || !o['backup-manifest'] || o['actor-user-id'] !== '1') throw new Error('Config, env, report, backup manifest, actor 1, dan exact scope wajib diisi.');
  selectScope(o['operation-id'], o['document-id']);
  if (o.apply && (!o['approved-report'] || !/^[a-f0-9]{64}$/.test(o['approval-digest'] || '')
    || o.confirm !== 'RESUME_REVIEWED_PENDING_DELETES')) throw new Error('Resume membutuhkan approval eksplisit yang terpisah dari metadata recovery.');
  const output = path.resolve(o.report);
  if ([o.config, o['env-file'], o['backup-manifest'], o['approved-report']].filter(Boolean).some(p => path.resolve(p).toLowerCase() === output.toLowerCase())) throw new Error('Output tidak boleh menimpa input.');
  try { await fs.lstat(output); throw new Error('Output sudah ada.'); } catch (e) { if (e.code !== 'ENOENT') throw e; }
  const config = JSON.parse(await fs.readFile(o.config, 'utf8')), env = require('dotenv').parse(await fs.readFile(o['env-file'])), db = config.database;
  if (process.platform !== 'win32' || !db || db.host !== '127.0.0.1' || Number(db.port) !== 3306 || db.name !== 'edms_smpv_dev'
    || db.versionPrefix !== '10.4.32-MariaDB' || config.environment !== 'development' || env.APP_ENV !== config.environment
    || env.MYSQL_HOST !== db.host || Number(env.MYSQL_PORT) !== 3306 || env.MYSQL_DATABASE !== db.name || env.STORAGE_DRIVER !== 'local'
    || path.resolve(db.dataDirectory || '').toLowerCase() !== path.resolve('D:/xampp/mysql/data').toLowerCase()
    || config.namespaces?.length !== 1 || config.namespaces[0].provider !== 'local'
    || path.resolve(config.namespaces[0].root) !== path.resolve('D:/Project/app-edms-smpv/apps/backend/storage')) throw new Error('Target bukan XAMPP/local storage yang disetujui.');
  Object.assign(process.env, env);
  const root = await fs.realpath(config.namespaces[0].root); if (root !== path.resolve(config.namespaces[0].root)) throw new Error('Storage root bukan canonical.');
  await assertReportLocation(output, root);
  const Local = require('../src/storage/drivers/localStorage.driver'), storage = new Local({ rootPath: root }), namespace = await storage.captureNamespace();
  const pool = require('mysql2/promise').createPool({ host: db.host, port: 3306, database: db.name, user: env.MYSQL_USER,
    password: env.MYSQL_PASSWORD || '', dateStrings: true, connectTimeout: 5000, connectionLimit: 3, multipleStatements: false });
  try {
    const [[id]] = await pool.query('SELECT DATABASE() name,VERSION() version,@@port port,@@datadir dataDirectory,@@hostname hostname');
    const target = { environment: config.environment, host: db.host, connectionPort: 3306, ...id }; assertTarget(target, namespace);
    if (Number(id.port) !== 3306 || path.resolve(id.dataDirectory).toLowerCase() !== path.resolve(db.dataDirectory).toLowerCase()) throw new Error('Database identity tidak sesuai.');
    const backups = await verifyBackups(o['backup-manifest'], target, namespace);
    const service = createPendingResume({ pool, coordination: require('../src/repositories/documentGate.repository'), storage, namespace,
      actorUserId: o['actor-user-id'], operationIds: o['operation-id'], documentIds: o['document-id'] });
    let report;
    const dbSnapshot = async () => { const c = await pool.getConnection(); try { await c.query('START TRANSACTION READ ONLY'); const s = await snapshotDatabase(c); await c.commit(); return s; } finally { await c.rollback().catch(() => {}); c.release(); } };
    if (o.apply) {
      const approved = JSON.parse(await fs.readFile(o['approved-report'], 'utf8')); validateBackupScope(approved);
      if ((await dbSnapshot()).digest !== approved.databaseEvidence?.before.digest
        || JSON.stringify(await snapshotStorage(root)) !== JSON.stringify(approved.filesystemEvidence?.before)) throw new Error('Database/storage berubah dari laporan approved.');
      report = { mode: 'PENDING_DELETE_RESUME_APPLY', target, outcomes: await service.apply({ report: approved, approvalDigest: o['approval-digest'],
        confirmation: o.confirm, target, backups }) };
    } else {
      const beforeFiles = await snapshotStorage(root), before = await dbSnapshot();
      report = await service.dryRun({ target, backups }); validateBackupScope(report);
      const after = await dbSnapshot(), afterFiles = await snapshotStorage(root);
      report.databaseEvidence = { before, after, unchanged: before.digest === after.digest };
      report.filesystemEvidence = { before: beforeFiles, after: afterFiles, unchanged: beforeFiles.digest === afterFiles.digest };
      if (!report.databaseEvidence.unchanged || !report.filesystemEvidence.unchanged || before.digest !== backups.manifest.database.snapshot.digest) report.verdict = 'BLOCKED';
      if (report.verdict === 'PREFLIGHT_PASS') report.approvalDigest = reportDigest(report); else delete report.approvalDigest;
    }
    await fs.mkdir(path.dirname(output), { recursive: true }); await assertReportLocation(output, root);
    await fs.writeFile(output, JSON.stringify(report, null, 2) + '\n', { flag: 'wx', mode: 0o600 });
    console.log(JSON.stringify({ mode: report.mode, verdict: report.verdict, report: output, approvalDigest: report.approvalDigest,
      databaseEvidence: report.databaseEvidence, filesystemEvidence: report.filesystemEvidence,
      items: report.items?.map(i => ({ operationId: i.scope.operationId, documentId: i.scope.documentId, eligible: i.eligible,
        fileCount: i.proofs?.length, reason: i.reason })), outcomes: report.outcomes }, null, 2));
    if (report.verdict === 'BLOCKED') process.exitCode = 2;
  } finally { await pool.end(); }
};
if (require.main === module) main().catch(e => { console.error(JSON.stringify({ code: e.code || 'PENDING_RESUME_STOPPED',
  message: 'STOP. Jangan retry otomatis; periksa laporan dan durable state.', outcomes: e.outcomes })); process.exitCode = 1; });
module.exports = { verifyBackups, validateBackupScope };
