const fs = require('node:fs/promises');
const path = require('node:path');
const { createHash, randomUUID } = require('node:crypto');
const { X509Certificate } = require('node:crypto');
const tls = require('node:tls');
const { createReadStream } = require('node:fs');
const { parseArgs } = require('node:util');
const engine = require('./historical-namespace-recovery.cjs');
const { snapshotDatabase } = require('./reconcile-legacy-files.cjs');
const { createReconciler, reportDigest } = require('../src/services/legacyFileReconciliation.service');
const { digest } = require('../src/utils/storageNamespace');
const sshTransport = require('./historical-recovery-ssh.cjs');

const stop = code => { throw Object.assign(new Error(code), { code }); };
const requireThat = (value, code) => { if (!value) stop(code); };
const identitySql = 'SELECT DATABASE() name,@@server_uuid serverUuid,@@hostname hostname,@@port port,VERSION() version';
const readOnly = c => ({ execute: (sql, args) => {
  requireThat(/^\s*SELECT\b/i.test(sql) && !/\b(?:FOR\s+UPDATE|INTO\s+(?:OUTFILE|DUMPFILE)|GET_LOCK|SLEEP)\b/i.test(sql), 'READ_ONLY_QUERY_REQUIRED');
  return c.execute(sql, args);
} });
const checkIdentity = (i, p) => requireThat(i && i.name === p.database.name && i.serverUuid === p.database.serverUuid
  && i.hostname === p.database.hostname && Number(i.port) === p.database.port
  && i.version.startsWith(p.database.versionPrefix) && !i.version.includes('MariaDB'), 'DATABASE_IDENTITY_MISMATCH');
const tlsOptions = (env, ca, runtime = process.env) => {
  requireThat(env.MYSQL_TLS_MODE === 'VERIFY_IDENTITY', 'TLS_VERIFY_IDENTITY_REQUIRED');
  requireThat(runtime.NODE_TLS_REJECT_UNAUTHORIZED !== '0' && env.NODE_TLS_REJECT_UNAUTHORIZED !== '0'
    && [undefined, 'true'].includes(env.MYSQL_TLS_REJECT_UNAUTHORIZED)
    && [undefined, 'true'].includes(env.MYSQL_TLS_VERIFY_IDENTITY), 'INSECURE_TLS_OVERRIDE_REJECTED');
  const name = env.MYSQL_TLS_SERVER_NAME;
  requireThat(typeof name === 'string' && name.length <= 253 && name.split('.').length >= 2
    && name.split('.').every(label => /^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?$/i.test(label))
    && !/^[0-9.]+$/.test(name), 'TLS_SERVER_NAME_REQUIRED');
  // Installed mysql2 uses config.host for SNI and checkServerIdentity; ssl.servername
  // is NOT forwarded. Do not pretend a different certificate name is supported.
  requireThat(name === env.MYSQL_HOST, 'TLS_SERVER_NAME_MUST_MATCH_CONNECTION_HOST');
  requireThat(typeof ca === 'string' && ca.length > 0 && ca.length <= 1024 * 1024, 'TLS_CA_REQUIRED');
  try {
    const certs = ca.match(/-----BEGIN CERTIFICATE-----[\s\S]*?-----END CERTIFICATE-----/g);
    requireThat(certs?.length && ca.replace(/-----BEGIN CERTIFICATE-----[\s\S]*?-----END CERTIFICATE-----/g, '').trim() === '', 'TLS_CA_INVALID');
    for (const pem of certs) requireThat(new X509Certificate(pem).ca, 'TLS_CA_INVALID');
    tls.createSecureContext({ ca, minVersion: 'TLSv1.2' });
  } catch { stop('TLS_CA_INVALID'); }
  return { ca, rejectUnauthorized: true, verifyIdentity: true, minVersion: 'TLSv1.2' };
};
const loadCa = async env => {
  requireThat(typeof env.MYSQL_TLS_CA_FILE === 'string' && path.isAbsolute(env.MYSQL_TLS_CA_FILE), 'TLS_CA_ABSOLUTE_PATH_REQUIRED');
  const stat = await fs.stat(env.MYSQL_TLS_CA_FILE);
  requireThat(stat.isFile() && stat.size > 0 && stat.size <= 1024 * 1024, 'TLS_CA_INVALID');
  return fs.readFile(env.MYSQL_TLS_CA_FILE, 'utf8');
};
const assertSecureConnection = (c, options) => {
  const socket = c.connection?.stream;
  requireThat(options.ssl?.rejectUnauthorized === true && options.ssl?.verifyIdentity === true
    && socket?.encrypted === true && socket.authorized === true && !socket.authorizationError
    && ['TLSv1.2', 'TLSv1.3'].includes(socket.getProtocol?.()), 'TLS_CONNECTION_NOT_VERIFIED');
  requireThat(!tls.checkServerIdentity(options.host, socket.getPeerCertificate(true)), 'TLS_PEER_IDENTITY_MISMATCH');
};
const connectSecure = async (options, connect = require('mysql2/promise').createConnection) => {
  requireThat(options.ssl?.rejectUnauthorized === true && options.ssl?.verifyIdentity === true
    && options.ssl?.minVersion === 'TLSv1.2' && options.ssl?.ca, 'TLS_VERIFY_IDENTITY_REQUIRED');
  const c = await connect(options);
  try { assertSecureConnection(c, options); return c; }
  catch (error) { c.destroy(); throw error; }
};
const credentialsFor = (env, p, ca) => {
  for (const key of ['APP_ENV','MYSQL_HOST','MYSQL_PORT','MYSQL_DATABASE','MYSQL_USER','MYSQL_PASSWORD',
    'R2_ACCOUNT_ID','R2_ENDPOINT','R2_BUCKET_NAME','R2_REGION','R2_ACCESS_KEY_ID','R2_SECRET_ACCESS_KEY']) {
    requireThat(typeof env[key] === 'string' && (key === 'MYSQL_PASSWORD' || env[key].trim()), 'MISSING_CREDENTIALS');
  }
  requireThat(env.APP_ENV === p.environment && env.MYSQL_DATABASE === p.database.name
    && env.R2_ACCOUNT_ID === p.r2.accountId && env.R2_ENDPOINT === p.r2.endpoint
    && env.R2_BUCKET_NAME === p.r2.bucketName, 'ENVIRONMENT_OR_NAMESPACE_MISMATCH');
  const mode = env.MYSQL_TRANSPORT || 'TCP_PROXY';
  requireThat(['TCP_PROXY','SSH_TUNNEL'].includes(mode), 'MYSQL_TRANSPORT_INVALID');
  if (mode === 'SSH_TUNNEL') {
    requireThat(p.ssh?.environment === p.environment && p.ssh.mappingReviewedByOwner === true
      && env.MYSQL_HOST === '127.0.0.1' && Number(env.MYSQL_PORT) === p.ssh.localPort, 'SSH_TARGET_MISMATCH');
  } else requireThat(/^[a-z0-9][a-z0-9.-]+$/i.test(env.MYSQL_HOST)
    && !/localhost|127\.0\.0\.1|railway\.internal$/i.test(env.MYSQL_HOST)
    && Number.isInteger(Number(env.MYSQL_PORT)) && Number(env.MYSQL_PORT) > 0 && Number(env.MYSQL_PORT) <= 65535,
  'PUBLIC_PROXY_REQUIRED');
  return { mysql: { host: env.MYSQL_HOST, port: Number(env.MYSQL_PORT), database: env.MYSQL_DATABASE,
    user: env.MYSQL_USER, password: env.MYSQL_PASSWORD, dateStrings: true, supportBigNumbers: true,
    bigNumberStrings: true, connectTimeout: 10000, multipleStatements: false, localInfile: false,
    ...(mode === 'TCP_PROXY' ? { ssl: tlsOptions(env, ca) } : {}) },
  r2: { ...p.r2, region: env.R2_REGION, accessKeyId: env.R2_ACCESS_KEY_ID, secretAccessKey: env.R2_SECRET_ACCESS_KEY } };
};

const capture = async (c, p) => {
  const [[identity]] = await c.query(identitySql); checkIdentity(identity, p);
  const sql = engine.preflightSql(p);
  const start = sql.indexOf('\nSELECT JSON_OBJECT(');
  requireThat(start >= 0, 'SNAPSHOT_GENERATOR_CONTRACT_CHANGED');
  const [[row]] = await c.query(sql.slice(start).trim());
  const snapshot = typeof row.snapshot_json === 'string' ? JSON.parse(row.snapshot_json) : row.snapshot_json;
  engine.readSnapshot(snapshot, p);
  return snapshot;
};
const comparable = snapshot => JSON.stringify({ identity: snapshot.identity,
  tables: Object.fromEntries(Object.entries(snapshot.tables).sort().map(([key, rows]) => [key, rows.map(r => r.hash).sort()])),
  engines: snapshot.engines.map(x => JSON.stringify(x)).sort(),
  foreignKeys: snapshot.foreignKeys.map(x => JSON.stringify(x)).sort(),
  documentTables: snapshot.documentTables.map(x => JSON.stringify(x)).sort(),
  metadataVisible: snapshot.metadataVisible, triggerMetadataVisible: snapshot.triggerMetadataVisible,
  writeTriggers: snapshot.writeTriggers });

const inspect = async ({ c, storage, p, clock = Date.now, snapshotter = snapshotDatabase }) => {
  requireThat(JSON.stringify(await storage.captureNamespace()) === JSON.stringify(p.namespace), 'R2_NAMESPACE_MISMATCH');
  const inspectedAt = new Date(clock()).toISOString();
  try {
    await c.query('SET TRANSACTION ISOLATION LEVEL REPEATABLE READ');
    await c.query('START TRANSACTION READ ONLY');
    const before = await snapshotter(c);
    const snapshot = await capture(c, p);
    const report = await createReconciler({ namespaces: [{ namespace: p.namespace, storage }], coordination: {} })
      .dryRun(readOnly(c), { environment: p.environment, ...snapshot.identity });
    await c.rollback();
    await c.query('SET TRANSACTION ISOLATION LEVEL REPEATABLE READ');
    await c.query('START TRANSACTION READ ONLY');
    const after = await snapshotter(c);
    const fresh = await capture(c, p);
    requireThat(before.digest === after.digest && comparable(snapshot) === comparable(fresh), 'DATABASE_CHANGED_DURING_INSPECTION');
    report.databaseEvidence = { before, after, unchanged: true };
    report.approvalDigest = reportDigest(report);
    return { snapshot, report, inspectedAt };
  } finally { await c.rollback(); }
};
const prepare = async ({ config, environment, c, storage, attest, clock = Date.now, snapshotter }) => {
  const p = engine.profileFor(config, environment);
  requireThat(attest?.maintenance === true && attest?.namespace === p.namespace.id, 'OWNER_MAINTENANCE_AND_NAMESPACE_REQUIRED');
  const result = await inspect({ c, storage, p, clock, snapshotter });
  const evidence = { version: 1, source: 'OWNER_REVIEWED_STORAGE_INVENTORY', environment,
    targetDigest: p.targetDigest, runtimeNamespaceVerified: true, storageWritersStopped: true,
    namespace: p.namespace, inspectedAt: result.inspectedAt, inspectionReport: result.report };
  const plan = await engine.buildPlan({ config, environment, snapshot: result.snapshot, evidence, now: clock() });
  return { ...result, evidence, plan };
};
const generate = async ({ config, environment, c, run, approval, receipt, now, clock = Date.now }) => {
  const p = engine.profileFor(config, environment);
  requireThat(run.plan?.environment === environment && run.plan.targetDigest === p.targetDigest, 'RUN_TARGET_MISMATCH');
  try {
    await c.query('START TRANSACTION READ ONLY');
    const fresh = await capture(c, p);
    requireThat(comparable(fresh) === comparable(run.snapshot), 'SNAPSHOT_CHANGED');
  } finally { await c.rollback(); }
  const currentTime = () => now ?? clock();
  const backup = await engine.verifyBackup(receipt, p, currentTime());
  return engine.generateApply({ config, environment, snapshot: run.snapshot, evidence: run.evidence,
    plan: run.plan, approval, backup, now: currentTime() });
};
const verify = async ({ config, environment, c, storage, run, clock = Date.now, snapshotter }) => {
  const p = engine.profileFor(config, environment);
  requireThat(run.plan?.environment === environment && run.plan.targetDigest === p.targetDigest
    && engine.seal(run.plan) === run.plan.approvalDigest, 'RUN_TARGET_MISMATCH');
  const { snapshot, report } = await inspect({ c, storage, p, clock, snapshotter });
  const result = await engine.verifySnapshot({ config, environment, snapshot, baseline: run.snapshot,
    plan: run.plan, now: clock() });
  const pass = result.verdict === 'METADATA VERIFIED - NOT DELETE AUTHORIZATION'
    && result.integrity === 'PASS - EXPORTED METADATA UNCHANGED' && report.summary.VERIFIED === report.summary.total;
  const inconclusive = report.files.some(file => file.status !== 'VERIFIED'
    && !['FILE_MISSING','FILE_CONTENT_MISMATCH'].includes(file.reason));
  return { snapshot, inspectionReport: report, ...result, verdict: pass ? 'PASS' : inconclusive ? 'INCONCLUSIVE' : 'FAIL',
    runtimeStorage: report.summary.VERIFIED === report.summary.total ? 'EXACT R2 OBJECTS VERIFIED READ-ONLY' : 'OBJECT VERIFICATION INCOMPLETE',
    note: 'Not Permanent Delete authorization or independent backup restore verification.' };
};
const hashFile = async file => {
  const hash = createHash('sha256'); let bytes = 0;
  for await (const chunk of createReadStream(file)) { hash.update(chunk); bytes += chunk.length; }
  return { sha256: hash.digest('hex'), bytes };
};
const write = (dir, name, value) => fs.writeFile(path.join(dir, name), typeof value === 'string' ? value
  : JSON.stringify(value, null, 2) + '\n', { flag: 'wx', mode: 0o600 });
const json = async file => JSON.parse(await fs.readFile(file, 'utf8'));
const safeRun = async (base, name) => {
  requireThat(/^run-[A-Za-z0-9-]+$/.test(name || ''), 'EXPLICIT_RUN_REQUIRED');
  const dir = path.join(base, name);
  requireThat(await fs.realpath(dir) === path.resolve(dir), 'RUN_REPARSE_PATH_REJECTED');
  return dir;
};
const loadRun = async dir => ({ snapshot: await json(path.join(dir, 'snapshot-before.json')),
  evidence: await json(path.join(dir, 'evidence.json')), plan: await json(path.join(dir, 'plan.json')) });
const newRun = async base => {
  const dir = path.join(base, `run-${new Date().toISOString().replace(/[^0-9TZ]/g, '')}-${randomUUID()}`);
  await fs.mkdir(dir, { recursive: true, mode: 0o700 }); return dir;
};
const summary = (p, run, dir) => ({ environment: p.environment, database: p.database.name,
  namespace: p.namespace.descriptor, targetDigest: p.targetDigest, approvalDigest: run.plan.approvalDigest,
  ...run.plan.summary, verified: run.report.summary.VERIFIED,
  reasons: [...new Set(run.plan.files.filter(f => f.reason).map(f => f.reason))],
  snapshotAt: run.snapshot.capturedAt, expiresAt: run.plan.expiresAt, run: path.basename(dir),
  verdict: run.plan.summary.blocked ? 'BLOCKED' : 'READY FOR OWNER REVIEW - NOT APPROVED' });

const main = async () => {
  const { positionals, values } = parseArgs({ allowPositionals: true, options: {
    environment: { type: 'string' }, run: { type: 'string' },
  } });
  const command = positionals[0];
  requireThat(positionals.length === 1 && ['check','prepare','generate-sql','verify'].includes(command), 'COMMAND_REQUIRED');
  const root = path.resolve(__dirname, '../../..');
  const home = path.join(root, 'tmp/historical-binding');
  const config = await json(path.join(home, 'config.json'));
  const p = engine.profileFor(config, values.environment);
  const base = path.join(home, p.environment);
  requireThat(await fs.realpath(home) === path.resolve(home) && await fs.realpath(base) === path.resolve(base), 'ENVIRONMENT_REPARSE_PATH_REJECTED');
  // No credential reads occur on import. Only an explicitly invoked CLI reaches this point.
  const readline = require('node:readline/promises');
  requireThat(process.stdin.isTTY, 'INTERACTIVE_OWNER_CONFIRMATION_REQUIRED');
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  let c; let storage; let tunnel;
  const ask = async (question, expected) => {
    const answer = (await rl.question(question + '\n> ')).trim();
    if (expected !== undefined) requireThat(answer === expected, 'OWNER_CONFIRMATION_REQUIRED');
    return answer;
  };
  let output;
  try {
    console.log(JSON.stringify({ environment: p.environment, database: p.database, namespace: p.namespace,
      targetDigest: p.targetDigest }, null, 2));
    await ask('Izinkan akses READ-ONLY ke target tersebut. Ketik target digest:', p.targetDigest);
    if (p.environment !== 'development') await ask('Environment sebelumnya telah PASS dan direview owner. Ketik PREVIOUS_ENVIRONMENT_VERIFIED:', 'PREVIOUS_ENVIRONMENT_VERIFIED');
    if (command !== 'check') {
      await ask('Seluruh writer aplikasi, job, dan storage eksternal telah dihentikan. Ketik WRITERS_STOPPED:', 'WRITERS_STOPPED');
      await ask('Konfirmasi namespace runtime yang direview. Ketik namespace ID:', p.namespace.id);
    }
    const env = require('dotenv').parse(await fs.readFile(path.join(base, '.env')));
    const mode = env.MYSQL_TRANSPORT || 'TCP_PROXY';
    const credentials = credentialsFor(env, p, mode === 'TCP_PROXY' ? await loadCa(env) : undefined);
    if (mode === 'SSH_TUNNEL') {
      requireThat(Object.entries(config.profiles).filter(([, profile]) => profile?.ssh?.serviceInstanceId === p.ssh.serviceInstanceId).length === 1,
        'CROSS_ENVIRONMENT_SSH_INSTANCE');
      console.log(JSON.stringify({ transport: mode, environment: p.environment, ssh: p.ssh, targetDigest: p.targetDigest }, null, 2));
      await ask('Mapping project/environment/service INSTANCE dan host-key fingerprint telah diverifikasi owner. Ketik SSH_TARGET_VERIFIED:', 'SSH_TARGET_VERIFIED');
      tunnel = await sshTransport.open(p, env, base);
      c = await sshTransport.connect(tunnel, credentials.mysql, require('mysql2/promise').createConnection,
        identity => checkIdentity(identity, p), identitySql);
    } else c = await connectSecure(credentials.mysql);
    const [[identity]] = await c.query(identitySql); checkIdentity(identity, p);
    if (command === 'check') {
      console.log(JSON.stringify({ verdict: 'IDENTITY VERIFIED - NOT A RECOVERY PLAN', targetDigest: p.targetDigest,
        namespace: p.namespace.id, note: 'R2 credentials, exact objects and maintenance readiness NOT VERIFIED.' }));
      return;
    }
    if (command === 'prepare' || command === 'verify') {
      const R2 = require('../src/storage/drivers/r2Storage.driver');
      storage = new R2({ r2: credentials.r2 });
    }
    if (command === 'prepare') {
      output = await newRun(base);
      const run = await prepare({ config, environment: p.environment, c, storage,
        attest: { maintenance: true, namespace: p.namespace.id } });
      tunnel?.assertAlive();
      for (const [name, value] of Object.entries({ 'snapshot-before.json': run.snapshot,
        'inspection-report.json': run.report, 'evidence.json': run.evidence, 'plan.json': run.plan })) await write(output, name, value);
      console.log(JSON.stringify(summary(p, run, output), null, 2));
      if (run.plan.summary.blocked) process.exitCode = 2;
    } else {
      const selected = values.run || await ask('Masukkan nama run hasil prepare yang direview:');
      const dir = await safeRun(base, selected); const run = await loadRun(dir);
      requireThat(run.plan.environment === p.environment && run.plan.targetDigest === p.targetDigest, 'RUN_TARGET_MISMATCH');
      output = await newRun(base);
      if (command === 'generate-sql') {
        await ask('Setujui plan tersebut. Ketik approval digest:', run.plan.approvalDigest);
        await ask('Ketik APPLY_HISTORICAL_NAMESPACE_BINDINGS:', 'APPLY_HISTORICAL_NAMESPACE_BINDINGS');
        const actorUserId = await ask('User ID Admin aktif pada seluruh project target:');
        const inputPath = await ask('Path absolut full logical backup SQL yang dibuat setelah snapshot:');
        requireThat(path.isAbsolute(inputPath), 'ABSOLUTE_BACKUP_PATH_REQUIRED');
        const dumpPath = path.resolve(inputPath);
        const createdAt = await ask('Waktu backup aktual, UTC ISO (bukan waktu membuat receipt):');
        await ask('Backup berasal dari target ini, lengkap, dan telah direview. Ketik BACKUP_REVIEWED:', 'BACKUP_REVIEWED');
        const restoreTest = await ask('Restore test nyata: ketik PASS atau NOT_TESTED:');
        const receipt = { version: 1, targetDigest: p.targetDigest, scope: 'FULL_DATABASE', reviewedByOwner: true,
          dumpPath, createdAt, restoreTest, ...(await hashFile(dumpPath)) };
        const approval = { digest: run.plan.approvalDigest, environment: p.environment, targetDigest: p.targetDigest,
          confirm: 'APPLY_HISTORICAL_NAMESPACE_BINDINGS', maintenance: true, actorUserId };
        const sql = await generate({ config, environment: p.environment, c, run, receipt, approval });
        tunnel?.assertAlive();
        await write(output, 'backup-receipt.json', receipt); await write(output, 'approval.json', approval);
        await write(output, 'apply-reviewed.sql', sql);
        await write(output, 'source-run.json', { run: selected, approvalDigest: run.plan.approvalDigest });
        console.log(JSON.stringify({ verdict: 'SQL GENERATED ONLY - NOT EXECUTED', output,
          next: 'DBeaver: dedicated connection, no auto-reconnect, stop on first error. Run identity_gate separately; then transaction. COMMIT manually only after READY TO COMMIT and no errors; otherwise ROLLBACK on same connection. Lost COMMIT ACK: verify, never retry automatically.' }));
      } else {
        try {
          const result = await verify({ config, environment: p.environment, c, storage, run });
          tunnel?.assertAlive();
          await write(output, 'verification.json', result);
          console.log(JSON.stringify({ verdict: result.verdict, output, remainingMissing: result.remainingMissing,
            approvedBindingsConfirmed: result.approvedBindingsConfirmed, approvedBindingsExpected: result.approvedBindingsExpected }));
          if (result.verdict !== 'PASS') process.exitCode = 2;
        } catch (error) {
          await write(output, 'verification.json', { verdict: 'INCONCLUSIVE', environment: p.environment,
            targetDigest: p.targetDigest, code: publicCode(error), note: 'Tidak dapat membuktikan hasil. Jangan retry SQL otomatis.' });
          throw error;
        }
      }
    }
  } finally {
    rl.close();
    storage?.client?.destroy();
    try { if (c) { try { await c.rollback(); } finally { await c.end(); } } }
    finally { await tunnel?.close(); }
  }
};
const publicCode = error => /^[A-Z][A-Z0-9_]{2,80}$/.test(error?.code || '') ? error.code : 'RECOVERY_RUNNER_STOPPED';
if (require.main === module) main().catch(error => {
  console.error(JSON.stringify({ code: publicCode(error), message: 'Dihentikan. Tidak ada SQL recovery dieksekusi; review target, evidence, dan koneksi.' }));
  process.exitCode = 1;
});
module.exports = { credentialsFor, checkIdentity, capture, comparable, inspect, prepare, generate, verify,
  readOnly, hashFile, safeRun, loadRun, summary, publicCode, tlsOptions, loadCa, assertSecureConnection, connectSecure };
