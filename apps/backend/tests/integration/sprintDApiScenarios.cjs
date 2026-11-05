const assert = require('node:assert/strict');
const express = require('express');
const cookieParser = require('cookie-parser');
const jwt = require('jsonwebtoken');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { createRouter } = require('../../src/routes/permanentDelete.routes');
const { createPermanentDeleteApi } = require('../../src/services/permanentDeleteApi.service');
const authConstants = require('../../src/constants/auth.constants');

module.exports = async ({ test, fixture, engine, execute, count, pool, coordination, driver, userId, run, root, calls }) => {
  const contexts = new Map(); const keys = new Map(); const secret = 'isolated-sprint-d-only-not-a-runtime-secret';
  let activeEngine = engine(); let failPool = false; let serial = 0;
  const guardedPool = { execute: (...args) => { if (failPool) throw new Error('SQL password=DO_NOT_EXPOSE bucket=PRIVATE'); return pool.execute(...args); } };
  const api = createPermanentDeleteApi({ pool: guardedPool, coordination, engine: { resume: (id) => activeEngine.resume(id) } });
  const module = { exports: {} };
  const dependencies = {
    '../constants/auth.constants': authConstants,
    '../services/auth.service': { getAuthenticatedUser: async (id) => {
      const [[user]] = await execute('SELECT id,status FROM users WHERE id=?', [id]);
      if (!user || user.status !== 'Active') throw new Error('Invalid synthetic user');
      return { user: { id: user.id }, activeProject: { id: contexts.get(String(id)) } };
    } },
    '../utils/response': require('../../src/utils/response'),
    '../utils/token': { verifyToken: (token) => jwt.verify(token, secret) },
  };
  new vm.Script(fs.readFileSync(path.join(root, 'apps/backend/src/middlewares/authenticate.js'), 'utf8'))
    .runInNewContext({ module, exports: module.exports, require: (name) => { assert.ok(dependencies[name]); return dependencies[name]; } });
  const app = express(); app.use(express.json(), cookieParser());
  app.use('/api/v1/documents', createRouter({ authenticate: module.exports, service: api }));
  app.use((error, req, res, next) => { if (res.headersSent) return next(error); return res.status(500).json({ message: 'Isolated test error' }); });
  const server = await new Promise((resolve) => { const s = app.listen(0, '127.0.0.1', () => resolve(s)); });
  const base = `http://127.0.0.1:${server.address().port}/api/v1/documents`;
  const request = async (f, { method = 'DELETE', actor = userId, projectId = f.projectId, activeProject = f.projectId, body = {}, key,
    operationId, invalidToken = false } = {}) => {
    if (!keys.has(f.documentId)) keys.set(f.documentId, `request-${f.prefix}`);
    const headers = { 'Content-Type': 'application/json', 'Idempotency-Key': key || keys.get(f.documentId) };
    if (actor) {
      contexts.set(String(actor), activeProject);
      headers.Cookie = `${authConstants.AUTH_COOKIE_NAMES.ACCESS_TOKEN}=${invalidToken ? 'invalid' : jwt.sign({ sub: String(actor) }, secret)}`;
    }
    const query = new URLSearchParams({ projectId }); if (operationId) query.set('operationId', operationId);
    const response = await fetch(`${base}/${f.documentId}/permanent?${query}`, { method, headers,
      ...(method === 'DELETE' && body !== undefined ? { body: JSON.stringify(body) } : {}) });
    return { code: response.status, ...await response.json() };
  };
  const addMember = async (f, role) => {
    const [[actor]] = await execute('SELECT role_id FROM users WHERE id=?', [userId]); const id = `${run}-DU${serial++}`;
    const [user] = await execute('INSERT INTO users (user_code,username,full_name,email,role_id) VALUES (?,?,?,NULL,?)', [id, id, 'Synthetic API User', actor.role_id]);
    await execute('INSERT INTO project_memberships (id,project_id,user_id,official_role) VALUES (?,?,?,?)', [id, f.projectId, user.insertId, role]);
    return user.insertId;
  };
  const audit = async (id) => (await execute('SELECT * FROM audit_trail WHERE identity_key=?', [`permanent-delete:${id}`]))[0];
  try {
    await test('D01 Admin HTTP Delete reaches Completed through actual engine and scoped membership', async () => {
      const f = await fixture(); const response = await request(f);
      assert.equal(response.code, 200, JSON.stringify(response)); assert.equal(response.data.status, 'COMPLETED');
      assert.equal(await count('engineering_documents','id',f.documentId), 0); assert.ok(response.data.completedAt);
    });
    await test('D02 HTTP rejects all non-Admin official roles despite legacy global Admin role', async () => {
      const f = await fixture();
      for (const role of ['Document Owner','Team Process','Team Project','Viewer']) {
        assert.equal((await request(f, { actor: await addMember(f, role) })).code, 403);
      }
      assert.equal(await count('document_delete_operations','document_id',f.documentId), 0);
    });
    await test('D03 Actual authentication middleware rejects absent and invalid JWT cookie', async () => {
      const f = await fixture(); assert.equal((await request(f, { actor: null })).code, 401);
      assert.equal((await request(f, { invalidToken: true })).code, 401);
    });
    await test('D04 Cross-project and stale active-project requests are rejected before reservation', async () => {
      const f = await fixture(); const other = await fixture();
      assert.equal((await request(f, { projectId: other.projectId, activeProject: other.projectId })).code, 403);
      assert.equal((await request(f, { activeProject: other.projectId })).code, 403);
      assert.equal(await count('document_delete_operations','document_id',f.documentId), 0);
    });
    await test('D05 Approved document remains eligible without a new workflow restriction', async () => {
      const f = await fixture(); await execute("UPDATE engineering_documents SET workflow_status='Approved' WHERE id=?", [f.documentId]);
      assert.equal((await request(f)).data.status, 'COMPLETED');
    });
    await test('D06 Archived document remains eligible', async () => {
      const f = await fixture({ archived: true }); assert.equal((await request(f)).data.status, 'COMPLETED');
    });
    await test('D07 Optional reason can be omitted from request payload', async () => {
      const f = await fixture(); assert.equal((await request(f, { body: undefined })).data.status, 'COMPLETED');
    });
    await test('D08 Empty/whitespace reason is valid and retained as null', async () => {
      const f = await fixture(); const response = await request(f, { body: { reason: '   ' } });
      assert.equal(response.data.status, 'COMPLETED'); assert.equal(JSON.parse((await audit(response.data.operationId))[0].metadata).reason, null);
    });
    await test('D09 Supplied reason is trimmed and persisted in retained final Audit', async () => {
      const f = await fixture(); const response = await request(f, { body: { reason: ' Duplicate synthetic document ' } });
      const [row] = await audit(response.data.operationId); assert.equal(JSON.parse(row.metadata).reason, 'Duplicate synthetic document');
      assert.equal(row.reference, `${f.prefix}-NUMBER`);
    });
    await test('D10 Unverified file provenance returns actual Pending, not success', async () => {
      const f = await fixture({ unbound: true }); const response = await request(f);
      assert.equal(response.code, 202); assert.equal(response.success, false); assert.equal(response.data.status, 'PENDING'); assert.ok(response.data.operationId);
      assert.equal(await count('engineering_documents','id',f.documentId), 1);
    });
    await test('D11 Unknown storage outcome is exposed accurately and cannot be blindly retried', async () => {
      const f = await fixture(); let attempts = 0;
      activeEngine = engine({}, { captureNamespace: () => driver.captureNamespace(), deleteOwnedExact: async () => {
        attempts += 1; throw Object.assign(new Error('Synthetic timeout'), { code: 'ETIMEDOUT' });
      } });
      try {
        assert.equal((await request(f)).data.status, 'UNKNOWN'); assert.equal((await request(f)).data.status, 'UNKNOWN'); assert.equal(attempts, 1);
      } finally { activeEngine = engine(); }
    });
    await test('D12 Failed database finalization is not success; explicit same-identity retry recovers', async () => {
      const f = await fixture(); activeEngine = engine({ beforeDatabaseCommit: () => { throw new Error('Synthetic database failure'); } });
      try { const response = await request(f); assert.equal(response.code, 500); assert.equal(response.data.status, 'FAILED'); }
      finally { activeEngine = engine(); }
      assert.equal(await count('engineering_documents','id',f.documentId), 1);
      assert.equal((await request(f)).data.status, 'COMPLETED');
    });
    await test('D13 Concurrent Admin HTTP requests create one operation, one final Audit and one recipient notification', async () => {
      const f = await fixture(); const responses = await Promise.all([request(f, { key: 'concurrent-request-1' }), request(f, { key: 'concurrent-request-2' })]);
      assert.ok(responses.every((response) => [200,202,409].includes(response.code)), JSON.stringify(responses));
      const state = await request(f, { method: 'GET' }); assert.equal(state.data.status, 'COMPLETED');
      assert.equal(await count('document_delete_operations','document_id',f.documentId), 1); assert.equal((await audit(state.data.operationId)).length, 1);
      assert.equal(Number((await execute('SELECT COUNT(*) n FROM notifications WHERE identity_key LIKE ?', [`permanent-delete:${state.data.operationId}:%`]))[0][0].n), 1);
    });
    await test('D14 Repeated HTTP Delete before/after hard deletion is idempotent, including fresh browser request identity', async () => {
      const f = await fixture(); const first = await request(f);
      assert.equal((await request(f)).data.operationId, first.data.operationId);
      assert.equal((await request(f, { key: 'new-browser-request' })).data.status, 'COMPLETED');
      assert.equal((await audit(first.data.operationId)).length, 1);
    });
    await test('D15 Reason validation rejects invalid values before reservation', async () => {
      const f = await fixture();
      for (const reason of [true, {}, 'x'.repeat(1001)]) assert.equal((await request(f, { body: { reason } })).code, 422);
      assert.equal(await count('document_delete_operations','document_id',f.documentId), 0);
    });
    await test('D16 Completed HTTP Delete keeps notification deduplication, including Viewer', async () => {
      const f = await fixture(); await addMember(f, 'Viewer'); const response = await request(f); await request(f);
      const [rows] = await execute('SELECT recipient_role FROM notifications WHERE identity_key LIKE ?', [`permanent-delete:${response.data.operationId}:%`]);
      assert.equal(rows.length, 2); assert.ok(rows.some((row) => row.recipient_role === 'Viewer'));
    });
    await test('D17 HTTP Delete never removes unrelated documents or their stored-file metadata', async () => {
      const f = await fixture(); const other = await fixture(); await request(f);
      assert.equal(await count('engineering_documents','id',other.documentId), 1);
      for (const id of other.fileIds) assert.equal(await count('stored_files','file_id',id), 1);
    });
    await test('D18 Status lookup is authorized, read-only and available after hard delete; unknown operation is 404', async () => {
      const f = await fixture(); const response = await request(f); const before = calls.length;
      assert.equal((await request(f, { method: 'GET', operationId: response.data.operationId })).data.status, 'COMPLETED');
      assert.equal((await request(f, { method: 'GET', operationId: 'wrong-operation' })).code, 404);
      assert.equal((await request(f, { method: 'GET', actor: await addMember(f, 'Viewer') })).code, 403);
      assert.equal(calls.length, before);
      const missing = { ...f, documentId: `${f.prefix}-MISSING` }; assert.equal((await request(missing)).code, 404);
    });
    await test('D19 API never leaks internal SQL/storage errors or credentials', async () => {
      const f = await fixture(); failPool = true;
      try { const response = await request(f, { method: 'GET' }); assert.equal(response.code, 503);
        assert.doesNotMatch(JSON.stringify(response), /password|DO_NOT_EXPOSE|bucket|PRIVATE|stack|SELECT/); }
      finally { failPool = false; }
    });
  } finally { await new Promise((resolve) => server.close(resolve)); }
};
