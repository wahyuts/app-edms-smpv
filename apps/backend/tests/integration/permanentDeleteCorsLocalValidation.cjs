const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { createHash } = require('node:crypto');
const mysql = require('mysql2/promise');
const dotenv = require('dotenv');

// Live local backend + main database only. No app/server import, login, valid
// cookie, fixture creation, or authenticated DELETE. The sole DELETE is a 401
// negative-auth probe against an ID verified not to exist in the target database.
const main = async () => {
  assert.ok(process.argv.includes('--execute-local-read-only'), 'Explicit local read-only validation flag required');
  const env = dotenv.parse(fs.readFileSync(path.resolve(__dirname, '../../.env')));
  assert.equal(env.MYSQL_HOST, '127.0.0.1'); assert.equal(env.MYSQL_PORT, '3306'); assert.equal(env.MYSQL_DATABASE, 'edms_smpv_dev');
  assert.equal(env.APP_ENV, 'development');
  const origin = 'http://localhost:5173';
  assert.ok(env.CORS_ALLOWED_ORIGINS.split(',').map((value) => value.trim()).includes(origin));
  const probe = '__cors_auth_probe__';
  const url = `http://localhost:${Number(env.PORT)}/api/v1/documents/${probe}/permanent?projectId=__cors_probe__`;
  const report = { checkedAt: new Date().toISOString(), backend: `http://localhost:${Number(env.PORT)}`, origin, tests: [] };
  const c = await mysql.createConnection({ host: '127.0.0.1', port: 3306, database: 'edms_smpv_dev',
    user: env.MYSQL_USER, password: env.MYSQL_PASSWORD || '', connectTimeout: 3000, dateStrings: true, multipleStatements: false });
  try {
    const query = async (sql, params = []) => (await c.query({ sql, timeout: 5000 }, params))[0];
    const [identity] = await query('SELECT DATABASE() db,VERSION() version,@@port port,@@datadir datadir');
    assert.equal(identity.db, 'edms_smpv_dev'); assert.equal(identity.version, '10.4.32-MariaDB'); assert.equal(identity.port, 3306);
    assert.equal(identity.datadir.replaceAll('\\', '/').toLowerCase(), 'd:/xampp/mysql/data/'); report.database = identity;
    assert.equal(Number((await query('SELECT COUNT(*) n FROM engineering_documents WHERE id=?', [probe]))[0].n), 0);
    const tables = ['engineering_documents','stored_files','document_revisions','workflow_comments','workflow_attachments','audit_trail','notifications',
      'document_admission_coordinators','document_delete_operations','document_writer_operations','document_storage_io_steps','document_delete_file_manifest',
      'storage_namespaces','stored_file_namespace_bindings','document_delete_executions','document_delete_attempts'];
    const snapshot = async () => {
      const result = {};
      for (const table of tables) {
        const rows = await query(`SELECT * FROM ${table}`);
        // Sort serialized rows to make the comparison independent of query plan order.
        result[table] = { rows: rows.length, sha256: createHash('sha256').update(JSON.stringify(rows.map(JSON.stringify).sort())).digest('hex') };
      }
      return result;
    };
    const before = await snapshot();
    const request = (method, headers) => fetch(url, { method, headers, signal: AbortSignal.timeout(5000) });
    const check = (response) => {
      assert.equal(response.headers.get('access-control-allow-origin'), origin);
      assert.equal(response.headers.get('access-control-allow-credentials'), 'true');
    };
    const preflight = await request('OPTIONS', { Origin: origin, 'Access-Control-Request-Method': 'DELETE',
      'Access-Control-Request-Headers': 'content-type,idempotency-key' });
    assert.equal(preflight.status, 204); check(preflight);
    const allowed = preflight.headers.get('access-control-allow-headers').toLowerCase().split(',').map((value) => value.trim());
    assert.ok(allowed.includes('content-type') && allowed.includes('idempotency-key'));
    assert.ok(preflight.headers.get('access-control-allow-methods').split(',').includes('DELETE'));
    report.tests.push({ name: 'Actual Axios DELETE preflight headers accepted', status: 'PASS', httpStatus: 204, allowedHeaders: allowed });
    for (const method of ['GET','DELETE']) {
      const response = await request(method, { Origin: origin, 'Content-Type': 'application/json', 'Idempotency-Key': 'cors-read-only-probe' });
      check(response); assert.equal(response.status, 401);
      const body = await response.json(); assert.equal(body.success, false);
      report.tests.push({ name: `${method} rejects missing authentication and preserves CORS headers`, status: 'PASS', httpStatus: 401 });
    }
    const denied = await request('OPTIONS', { Origin: 'http://not-allowed.invalid', 'Access-Control-Request-Method': 'DELETE',
      'Access-Control-Request-Headers': 'content-type,idempotency-key' });
    assert.equal(denied.headers.get('access-control-allow-origin'), null);
    report.tests.push({ name: 'Unlisted origin remains blocked', status: 'PASS' });
    const after = await snapshot(); assert.deepEqual(after, before);
    report.tests.push({ name: 'Business rows and Permanent Delete sidecars unchanged', status: 'PASS' });
    report.rowCounts = Object.fromEntries(Object.entries(after).map(([table, value]) => [table, value.rows]));
    report.authenticatedDelete = 'NOT RUN'; report.browser = 'NOT VERIFIED'; report.result = 'PASS';
    console.log(JSON.stringify(report, null, 2));
  } finally { await c.end().catch(() => c.destroy()); }
};
main().catch((error) => { console.error(JSON.stringify({ result: 'FAIL', code: error.code || error.name, message: error.message })); process.exitCode = 1; });
