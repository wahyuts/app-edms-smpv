const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');
const crypto = require('node:crypto');

const root = path.resolve(__dirname, '../../../..');
const instanceRoot = path.join(root, 'tmp/mariadb-sprint-b-20261102');
const datadir = path.join(instanceRoot, 'data');
const database = 'edms_sprint_b_isolated';
const restoreDatabase = 'edms_restore_validation';
const port = 13317;
const owner = 'app-edms-smpv:isolated-mariadb-20261102';
const hash = (value) => crypto.createHash('sha256').update(value).digest('hex');
const normalizedPath = (value) => path.resolve(value).replace(/\\/g, '/').replace(/\/$/, '').toLowerCase();

// Retain executable version comments in dumps; semicolons inside quoted data are not delimiters.
const statements = (source) => {
  const output = []; let buffer = ''; let quote = null; let line = false; let block = false;
  for (let i = 0; i < source.length; i += 1) {
    const ch = source[i]; const next = source[i + 1];
    if (line) { if (ch === '\n') { line = false; buffer += '\n'; } continue; }
    if (block) { buffer += ch; if (ch === '*' && next === '/') { buffer += next; i += 1; block = false; } continue; }
    if (quote) {
      buffer += ch;
      if (ch === '\\') { buffer += next || ''; i += 1; }
      else if (ch === quote && next === quote) { buffer += next; i += 1; }
      else if (ch === quote) quote = null;
    } else if ((ch === '-' && next === '-' && /\s/.test(source[i + 2] || ' ')) || ch === '#') { line = true; if (ch === '-') i += 1; }
    else if (ch === '/' && next === '*') { block = true; buffer += '/*'; i += 1; }
    else if (["'", '"', '`'].includes(ch)) { quote = ch; buffer += ch; }
    else if (ch === ';') { if (buffer.trim()) output.push(buffer.trim()); buffer = ''; }
    else buffer += ch;
  }
  assert.ok(!quote && !block, 'Unterminated SQL token');
  if (buffer.trim()) output.push(buffer.trim());
  return output;
};

const target = (mode = 'admin') => {
  const marker = JSON.parse(fs.readFileSync(path.join(instanceRoot, 'connection.json'), 'utf8'));
  assert.equal(marker.owner, owner); assert.equal(marker.host, '127.0.0.1'); assert.equal(marker.port, port);
  assert.equal(normalizedPath(marker.datadir), normalizedPath(datadir));
  assert.ok(!normalizedPath(datadir).startsWith('d:/xampp/'));
  assert.equal(normalizedPath(fs.realpathSync(instanceRoot)), normalizedPath(instanceRoot));
  assert.ok(['admin','synthetic'].includes(mode));
  if (mode === 'synthetic') { assert.equal(marker.testUser, 'edms_sprint_test'); assert.ok(marker.testPassword?.length >= 32); }
  return { host: '127.0.0.1', port, user: mode === 'synthetic' ? marker.testUser : marker.user,
    password: mode === 'synthetic' ? marker.testPassword : marker.password,
    connectTimeout: 5000, timezone: 'Z', dateStrings: true, multipleStatements: false };
};

const verify = async (connection, expectedDatabase = null) => {
  const [[identity]] = await connection.query({ sql: `SELECT DATABASE() db,VERSION() version,@@hostname hostname,@@port port,
    @@datadir datadir,@@server_id serverId,@@innodb_force_recovery forceRecovery,CONNECTION_ID() connectionId`, timeout: 5000 });
  assert.equal(identity.version, '10.4.32-MariaDB'); assert.equal(identity.port, port);
  assert.equal(identity.hostname.toLowerCase(), os.hostname().toLowerCase());
  assert.equal(identity.serverId, port); assert.equal(identity.forceRecovery, 0);
  assert.equal(normalizedPath(identity.datadir), normalizedPath(datadir));
  if (expectedDatabase) assert.equal(identity.db, expectedDatabase);
  return identity;
};

const bounded = async (promise, milliseconds, message) => {
  let timer;
  try { return await Promise.race([promise, new Promise((_, reject) => { timer = setTimeout(() => reject(Object.assign(new Error(message), { code: 'TEST_DEADLINE' })), milliseconds); })]); }
  finally { clearTimeout(timer); }
};

const waitForSignal = (signal, worker, milliseconds) => bounded(Promise.race([signal, worker.then(() => {
  throw Object.assign(new Error('Worker settled before its expected signal'), { code: 'WORKER_SIGNAL_MISSING' });
})]), milliseconds, 'Worker signal deadline');

module.exports = { root, instanceRoot, datadir, database, restoreDatabase, port, owner, hash, normalizedPath, statements, target, verify, bounded, waitForSignal };
