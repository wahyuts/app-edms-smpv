const assert = require('node:assert/strict');
const crypto = require('node:crypto');
const plan = require('./slaC2bPlan.cjs');
const DB = 'edms_sla_integration_test';
const OWNER = 'app-edms-smpv:sla-c2b';
const SCHEMA_HASH = 'a03200cce62313583eb13fb01ab0857d7e42fe10fb2d8a4d87f23698916de095';
const identitySql = 'SELECT VERSION() version,@@hostname hostname,@@port port,@@server_id serverId,@@datadir datadir,DATABASE() db,CURRENT_USER() account,CONNECTION_ID() connectionId,@@innodb_force_recovery recovery';
const markerSql = 'SELECT owner_id,database_name,owner_nonce,schema_sha256,state FROM edms_sla_test_ownership WHERE owner_id=?';
const canonical = sql => sql.replace(/\s+/g, ' ').trim();
const reject = code => { throw Object.assign(new Error(code), { code }); };
const normalizePath = value => String(value).replace(/\\/g, '/').replace(/\/$/, '').toLowerCase();

const validateIdentity = (row, database, account) => {
  if (!row || row.version !== '10.4.32-MariaDB' || row.hostname !== 'DESKTOP-3DFA1TA'
    || Number(row.port) !== 3306 || Number(row.serverId) !== 1 || Number(row.recovery) !== 0
    || normalizePath(row.datadir) !== 'd:/xampp/mysql/data' || row.db !== database
    || row.account !== account || !Number.isInteger(Number(row.connectionId)) || Number(row.connectionId) <= 0) reject('C2B_IDENTITY_MISMATCH');
};

const parseGrants = rows => rows.map(row => {
  const text = Object.values(row)[0];
  const match = /^GRANT (.+?) ON (.+?) TO /i.exec(text);
  if (!match || /WITH GRANT OPTION/i.test(text)) reject('C2B_UNEXPECTED_EFFECTIVE_GRANT');
  return { privileges: match[1].split(',').map(value => value.trim().toUpperCase()).sort(),
    scope: match[2].replace(/`/g, '') };
});
const verifyGrants = (rows, kind, setupDdl = false) => {
  const grants = parseGrants(rows);
  const expected = new Map([['*.*', ['USAGE']],
    ['edms\\_sla\\_integration\\_test.*', kind === 'schema' && setupDdl
      ? ['SELECT', 'CREATE', 'ALTER', 'INDEX', 'REFERENCES'].sort() : ['SELECT']]]);
  if (kind === 'runner') for (const table of plan.dmlTables) {
    expected.set(`${DB}.${table}`, ['INSERT', 'UPDATE', 'DELETE'].sort());
  }
  if (grants.length !== expected.size) reject('C2B_UNEXPECTED_EFFECTIVE_GRANT');
  for (const grant of grants) {
    if (JSON.stringify(expected.get(grant.scope)) !== JSON.stringify(grant.privileges)) reject('C2B_UNEXPECTED_EFFECTIVE_GRANT');
    expected.delete(grant.scope);
  }
  if (expected.size) reject('C2B_MISSING_EFFECTIVE_GRANT');
  return { databaseScopeOnly: true, markerReadOnly: kind === 'runner', grantCount: grants.length };
};

const assertRunnerSql = (sql) => {
  const text = canonical(sql);
  if (!/^(SELECT|INSERT INTO|UPDATE|DELETE FROM)\b/i.test(text)
    || /;|--|\/\*|#|`|"|:=|@|\b(?:USE|DROP|TRUNCATE|GRANT|REVOKE|CALL|LOAD|OUTFILE|DUMPFILE|SLEEP|BENCHMARK|UNION|PREPARE|EXECUTE|LOCK TABLES|GET_LOCK|RELEASE_LOCK|LOAD_FILE)\b/i.test(text)) reject('C2B_SQL_NOT_ALLOWED');
  const allTables = new Set([...plan.baseTables, ...plan.foundationTables, 'edms_sla_test_ledger']);
  const references = [...text.matchAll(/\b(?:FROM|JOIN|INTO)\s+([a-z_][a-z0-9_]*)(\s*\.)?/gi)];
  if (/^UPDATE /i.test(text)) references.push(/^UPDATE\s+([a-z_][a-z0-9_]*)(\s*\.)?/i.exec(text));
  if (references.some(match => match[2] || !allTables.has(match[1]))) reject('C2B_SQL_SCOPE_MISMATCH');
  const verb = /^(SELECT|INSERT|UPDATE|DELETE)/i.exec(text)[1].toUpperCase();
  if (verb !== 'SELECT') {
    const match = /^(?:INSERT INTO|UPDATE|DELETE FROM) ([a-z_]+)/i.exec(text);
    if (!match || !plan.dmlTables.includes(match[1])) reject('C2B_SQL_MUTATION_SCOPE');
    if (['UPDATE', 'DELETE'].includes(verb) && !/\bWHERE\b/i.test(text)) reject('C2B_UNBOUNDED_MUTATION');
  }
  const functions = new Set([...allTables, 'values', 'in', 'and', 'or', 'not', 'utc_timestamp',
    'count', 'max', 'min', 'lower', 'trim', 'coalesce', 'ifnull', 'json_extract', 'json_object', 'concat', 'concat_ws', 'abs']);
  for (const match of text.matchAll(/\b([a-z_][a-z0-9_]*)\s*\(/gi)) {
    if (!functions.has(match[1].toLowerCase())) reject('C2B_SQL_FUNCTION_NOT_ALLOWED');
  }
  return text;
};

const createRuntimeGate = ({ nonce, schemaHash = SCHEMA_HASH } = {}) => {
  if (!/^[a-f0-9]{64}$/.test(nonce || '') || schemaHash !== SCHEMA_HASH) reject('C2B_INVALID_EXPECTED_OWNERSHIP');
  const verified = new WeakMap();
  return {
    async verify(connection, kind, state = 'READY', setupDdl = false) {
      verified.delete(connection);
      if (!['schema', 'runner'].includes(kind)) reject('C2B_ACCOUNT_SCOPE');
      const socket = connection.connection?.stream;
      if (socket?.remoteAddress !== '127.0.0.1' || socket?.remotePort !== 3306) reject('C2B_SOCKET_MISMATCH');
      const [[identity]] = await connection.query(identitySql);
      validateIdentity(identity, DB, `edms_sla_${kind}@127.0.0.1`);
      const [[marker]] = await connection.execute(markerSql, [OWNER]);
      if (!marker || marker.owner_id !== OWNER || marker.database_name !== DB || marker.owner_nonce !== nonce
        || marker.schema_sha256 !== schemaHash || marker.state !== state) reject('C2B_OWNERSHIP_MISMATCH');
      const [rows] = await connection.query('SHOW GRANTS FOR CURRENT_USER()');
      const grants = verifyGrants(rows, kind, setupDdl);
      verified.set(connection, { kind, state, at: Date.now() });
      return { ...identity, grants };
    },
    assert(connection, kind) {
      const proof = verified.get(connection);
      if (!proof || proof.kind !== kind || Date.now() - proof.at > 60000) reject('C2B_RUNTIME_AUTHORITY_MISSING');
    },
    forget(connection) { verified.delete(connection); },
  };
};

const validateSecretRecord = record => {
  if (!record || record.planId !== 'C2B-PLAN-01' || record.database !== DB || record.host !== '127.0.0.1'
    || record.port !== 3306 || record.schemaHash !== SCHEMA_HASH
    || !['nonce', 'schemaPassword', 'runnerPassword'].every(key => /^[a-f0-9]{64}$/.test(record[key] || ''))
    || new Set([record.nonce, record.schemaPassword, record.runnerPassword]).size !== 3) reject('C2B_SECRET_RECORD_INVALID');
  return record;
};
const validateAcl = (entries, sid) => {
  if (!/^S-1-5-21-[0-9-]+$/.test(sid) || !Array.isArray(entries) || entries.length < 2
    || entries.some(entry => entry.inherited || entry.type !== 'Allow' || ![sid, 'S-1-5-18'].includes(entry.sid))
    || ![sid, 'S-1-5-18'].every(id => entries.some(entry => entry.sid === id && /FullControl/.test(entry.rights)))) reject('C2B_UNSAFE_CREDENTIAL_ACL');
};

// Strict canonical token comparison: literals preserved; only known MariaDB aliases/introducers normalized.
const expressionTokens = source => {
  const tokens = [];
  let rest = source.trim(), match;
  while (rest) {
    rest = rest.trimStart();
    if (!rest) break;
    if ((match = /^(?:_utf8mb4\s*)?('(?:''|[^'])*')/i.exec(rest))) tokens.push(match[1]);
    else if ((match = /^`([a-z_]+)`/i.exec(rest))) tokens.push(match[1].toLowerCase());
    else if ((match = /^[a-z_][a-z0-9_]*/i.exec(rest))) tokens.push(match[0].toLowerCase().replace(/^lcase$/, 'lower'));
    else if ((match = /^(<>|!=|[(),=<>]|[0-9]+)/.exec(rest))) tokens.push(match[0]);
    else reject('C2B_UNRECOGNIZED_GENERATED_EXPRESSION');
    rest = rest.slice(match[0].length);
  }
  return tokens;
};
const verifyEmailExpression = (actual, canonicalExpression) => {
  // Fixed grammar supports balanced redundant wrappers, never removes operators or literals.
  const parse = source => {
    const tokens = expressionTokens(source); let index = 0, depth = 0;
    const take = word => { if (tokens[index++] !== word) reject('C2B_EMAIL_EXPRESSION_MISMATCH'); };
    const wrapped = fn => {
      if (++depth > 64) reject('C2B_EMAIL_EXPRESSION_DEPTH');
      if (tokens[index] === '(') { take('('); wrapped(fn); take(')'); } else fn();
      depth--;
    };
    const email = () => wrapped(() => take('email'));
    const trim = () => wrapped(() => { take('trim'); take('('); email(); take(')'); });
    const lower = () => wrapped(() => { take('lower'); take('('); trim(); take(')'); });
    const nil = () => wrapped(() => take('null'));
    const literal = () => { let value; wrapped(() => { value = tokens[index++]; if (!/^'(?:''|[^'])*'$/.test(value || '')) reject('C2B_EMAIL_LITERAL'); }); return value; };
    const literals = [];
    wrapped(() => {
      take('case'); take('when');
      wrapped(() => {
        wrapped(() => { email(); take('is'); take('null'); }); take('or');
        wrapped(() => { trim(); take('='); literals.push(literal()); });
      });
      take('then'); nil(); take('when');
      wrapped(() => {
        wrapped(() => { lower(); take('collate'); take('utf8mb4_bin'); });
        take('in'); take('('); literals.push(literal()); take(','); literals.push(literal()); take(')');
      });
      take('then'); nil(); take('else'); lower(); take('end');
    });
    if (index !== tokens.length) reject('C2B_EMAIL_EXPRESSION_MISMATCH');
    return literals;
  };
  assert.deepEqual(parse(actual), parse(canonicalExpression));
};

module.exports = { DB, OWNER, SCHEMA_HASH, identitySql, markerSql, normalizePath, validateIdentity,
  parseGrants, verifyGrants, assertRunnerSql, createRuntimeGate, validateSecretRecord, validateAcl,
  expressionTokens, verifyEmailExpression, hash: value => crypto.createHash('sha256').update(value).digest('hex') };
