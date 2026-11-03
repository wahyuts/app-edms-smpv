const test = require('node:test');
const assert = require('node:assert/strict');
const { createPermanentDeleteApi } = require('../../src/services/permanentDeleteApi.service');
const { createController } = require('../../src/controllers/permanentDelete.controller');

const fixture = ({ role = 'Admin', document = { id: 'D', project_id: 'P', document_number: 'PFD-1' }, state = 'COMPLETED' } = {}) => {
  let op; let resumed = 0; let reserved = 0;
  const pool = { execute: async (sql) => {
    if (sql.startsWith('SELECT m.official_role')) return [[role ? { official_role: role } : undefined].filter(Boolean)];
    if (sql.startsWith('SELECT id,project_id')) return [[document].filter(Boolean)];
    if (sql.startsWith('SELECT * FROM document_delete_operations')) return [[op].filter(Boolean)];
    if (sql.startsWith('SELECT phase')) return [[resumed && state === 'COMPLETED' ? { phase: 'COMPLETED', completion_snapshot: '{"completedAt":"2026-11-02T00:00:00Z"}' } : null].filter(Boolean)];
    if (sql.startsWith('SELECT a.state')) return [state === 'UNKNOWN' ? [{ state: 'UNKNOWN' }] : []];
    if (sql.startsWith('SELECT w.id')) return [[]];
    throw new Error(`Unexpected SQL ${sql}`);
  } };
  const service = createPermanentDeleteApi({ pool, coordination: {
    reserve: async (value) => { reserved += 1; op = { id: value.id, project_id: value.projectId, document_id: value.documentId,
      document_number_snapshot: value.documentNumber, initiated_by_user_id: value.userId, request_identity: value.requestIdentity, reason: value.reason }; },
    evaluateQuiescence: async () => ({ status: 'QUIESCENCE_CONFIRMED' }),
  }, engine: { resume: async () => { resumed += 1; return { status: state }; } } });
  const args = { actorUserId: 1, activeProject: { id: 'P' }, projectId: 'P', documentId: 'D', requestKey: 'synthetic-request-1' };
  return { service, args, op: () => op, counts: () => ({ reserved, resumed }) };
};

for (const role of ['Document Owner','Team Process','Team Project','Viewer',null]) test(`Permanent Delete rejects project role ${role}`, async () => {
  const f = fixture({ role }); await assert.rejects(f.service.remove(f.args), (e) => e.statusCode === 403);
  assert.equal(f.counts().reserved, 0);
});
test('Permanent Delete rejects missing authentication and stale active project', async () => {
  const f = fixture();
  await assert.rejects(f.service.remove({ ...f.args, actorUserId: null }), (e) => e.statusCode === 401);
  await assert.rejects(f.service.remove({ ...f.args, activeProject: { id: 'OTHER' } }), (e) => e.statusCode === 403);
});
test('Permanent Delete validates reason/idempotency before reservation and accepts omitted/empty trimmed reason', async () => {
  for (const reason of [undefined, '', '   ', ' Duplicate document ']) {
    const f = fixture(); assert.equal((await f.service.remove({ ...f.args, reason })).status, 'COMPLETED');
    assert.equal(f.op().reason, reason?.trim() || null);
    await f.service.remove(f.args); assert.equal(f.counts().reserved, 1);
  }
  const f = fixture();
  for (const reason of [4, {}, 'x'.repeat(1001)]) await assert.rejects(f.service.remove({ ...f.args, reason }), (e) => e.statusCode === 422);
  await assert.rejects(f.service.remove({ ...f.args, requestKey: '' }), (e) => e.statusCode === 422);
});
test('Permanent Delete rejects cross-project and missing documents without reserving', async () => {
  const cross = fixture({ document: { id: 'D', project_id: 'OTHER' } });
  await assert.rejects(cross.service.remove(cross.args), (e) => e.statusCode === 403);
  const missing = fixture({ document: null }); await assert.rejects(missing.service.remove(missing.args), (e) => e.statusCode === 404);
});
test('Status lookup never resumes an unknown cleanup and exposes only safe public fields', async () => {
  const f = fixture({ state: 'UNKNOWN' }); const result = await f.service.remove(f.args);
  assert.equal(result.status, 'UNKNOWN'); assert.equal(f.counts().resumed, 0);
  assert.equal((await f.service.status(f.args)).status, 'UNKNOWN'); assert.equal(f.counts().resumed, 0);
  assert.doesNotMatch(JSON.stringify(result), /storageKey|namespace|password|stack|bucket/);
});
test('API controller sanitizes internal errors instead of exposing SQL/provider messages', async () => {
  let body; let code;
  const res = { status: (value) => { code = value; return res; }, json: (value) => { body = value; return res; } };
  await createController({ status: async () => { throw new Error('SQL password=secret bucket=private'); } }).status({ query: {}, params: {}, get() {} }, res);
  assert.equal(code, 503); assert.equal(body.data.status, 'UNKNOWN'); assert.doesNotMatch(JSON.stringify(body), /secret|SQL|private/);
});
test('Only durable Completed is labeled success, never Pending, Unknown, Failed or Conflict', async () => {
  for (const status of ['COMPLETED','PENDING','UNKNOWN','FAILED','CONFLICT']) {
    let body;
    const res = { status: () => res, json: (value) => { body = value; return res; } };
    await createController({ status: async () => ({ status, message: 'Status operasi.' }) }).status({ query: {}, params: {}, get() {} }, res);
    assert.equal(body.success, status === 'COMPLETED');
  }
});
