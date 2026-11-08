const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const test = require('node:test');
const { fixture, document } = require('../helpers/slaTransactionFixture.cjs');

const deferred = () => {
  let resolve;
  const promise = new Promise(done => { resolve = done; });
  return { promise, resolve };
};
const transient = (code, errno) => Object.assign(new Error('C2C synthetic lock failure'), { code, errno });
const transientCases = [['ER_LOCK_DEADLOCK', 1213], ['ER_LOCK_WAIT_TIMEOUT', 1205]];
const settled = f => {
  assert.equal(f.activeConnections, 0);
  assert.ok(f.connections.every(connection => connection.disposed));
};
const committedEventsOnly = f => {
  assert.equal(new Set(f.events.map(event => event.resourceId)).size, f.events.length);
  assert.ok(f.publications.every(event => event.committed && event.disposed));
  assert.ok(f.events.every(event => f.state.notifications.some(row => row.id === event.resourceId)));
};

test('C2C offline: eight overlapping same-document evaluations have one notification set', { timeout: 3000 }, async () => {
  const entered = deferred(), resume = deferred();
  let gates = 0;
  const f = fixture({ serializeTransactions: true, afterGate: async () => {
    if (++gates === 1) { entered.resolve(); await resume.promise; }
  } });
  const first = f.evaluate(); await entered.promise;
  const waiting = Array.from({ length: 7 }, () => f.evaluate());
  assert.equal(f.acquisitions, 1); assert.equal(f.events.length, 0);
  resume.resolve();
  const results = await Promise.all([first, ...waiting]);
  assert.equal(results.reduce((sum, result) => sum + result.createdCount, 0), 4);
  assert.equal(results.filter(result => result.result === 'same_state_suppressed').length, 7);
  assert.equal(f.acquisitions, 8); assert.equal(f.state.notifications.length, 4);
  assert.equal(f.state.evaluations.length, 1); assert.equal(f.state.audits.length, 1);
  assert.equal(f.events.length, 4); settled(f); committedEventsOnly(f);
});

test('C2C offline: staged rows and SSE remain invisible while COMMIT is held', { timeout: 3000 }, async () => {
  const entered = deferred(), resume = deferred();
  const f = fixture({ serializeTransactions: true, beforeCommit: async id => {
    if (id === 1) { entered.resolve(); await resume.promise; }
  } });
  const first = f.evaluate(); await entered.promise;
  const second = f.evaluate();
  assert.ok(f.sqlCalls.some(call => call.sql.startsWith('INSERT INTO document_sla_evaluations')));
  assert.deepEqual(f.state, { notifications: [], evaluations: [], audits: [] });
  assert.equal(f.events.length, 0); assert.equal(f.acquisitions, 1);
  resume.resolve();
  const results = await Promise.all([first, second]);
  assert.deepEqual(results.map(result => result.createdCount), [4, 0]);
  committedEventsOnly(f); settled(f);
});

test('C2C offline: queued evaluator discards stale Review after simulated Approval commit', { timeout: 3000 }, async () => {
  const entered = deferred(), resume = deferred();
  let gates = 0;
  const stale = document();
  const f = fixture({ serializeTransactions: true,
    afterGate: async () => { if (++gates === 1) { entered.resolve(); await resume.promise; } },
    afterCommit: () => { f.documents[0].status = 'Approved'; },
  });
  const first = f.evaluate(stale); await entered.promise;
  const queued = f.evaluate(stale); resume.resolve();
  const [a, b] = await Promise.all([first, queued]);
  assert.equal(a.createdCount, 4); assert.equal(b.result, 'not_eligible');
  assert.equal(stale.status, 'Process Review'); assert.equal(f.events.length, 4);
  committedEventsOnly(f); settled(f);
});

for (const [code, errno] of transientCases) {
  test(`C2C offline: ${code} loser retries after another evaluator commits`, { timeout: 3000 }, async () => {
    const waiting = deferred(), resume = deferred(); let failures = 0;
    const f = fixture({ serializeTransactions: true,
      fail: phase => phase === 'audit' && failures++ === 0 ? transient(code, errno) : false,
      holdDelay: async () => { waiting.resolve(); await resume.promise; },
    });
    const loser = f.evaluate(); await waiting.promise;
    assert.equal(f.activeConnections, 0); assert.equal(f.events.length, 0);
    assert.equal(f.state.notifications.length, 0);
    const winner = await f.evaluate();
    assert.equal(winner.createdCount, 4); resume.resolve();
    const retried = await loser;
    assert.equal(retried.result, 'same_state_suppressed'); assert.equal(retried.createdCount, 0);
    assert.equal(f.acquisitions, 3); assert.equal(f.state.notifications.length, 4);
    assert.equal(f.state.evaluations.length, 1); assert.equal(f.state.audits.length, 1);
    assert.equal(f.connections.filter(connection => connection.rolledBack).length, 1);
    assert.equal(f.connections[0].owner, f.connections[2].owner, 'Retry belongs to the original evaluation');
    assert.notEqual(f.connections[0].owner, f.connections[1].owner, 'Winner has independent ownership');
    assert.ok(f.publications.every(event => event.connectionId === 2));
    assert.deepEqual(f.trace.filter(value => value.startsWith('delay:')), ['delay:25']);
    committedEventsOnly(f); settled(f);
  });

  for (const [field, value] of [['status', 'Approved'], ['lifecycle', 'Archived'], ['projectStatus', 'Closed']]) {
    test(`C2C offline: ${code} retry reloads changed ${field} instead of cached eligibility`, async () => {
      let failures = 0;
      const f = fixture({ fail: phase => phase === 'audit' && failures++ === 0 ? transient(code, errno) : false,
        onDelay: () => { f.documents[0][field] = value; } });
      assert.equal((await f.evaluate()).result, 'not_eligible');
      assert.deepEqual(f.state, { notifications: [], evaluations: [], audits: [] });
      assert.equal(f.acquisitions, 2); assert.equal(f.events.length, 0); settled(f);
    });
  }

  test(`C2C offline: ${code} rollback uncertainty is not a retry or success`, async () => {
    const primary = transient(code, errno);
    const f = fixture({ fail: phase => phase === 'audit' ? primary : phase === 'rollback' });
    await assert.rejects(f.evaluate(), error => error === primary);
    const evidence = f.load('services/documentAdmission.service.js').getTransactionEvidence(primary);
    assert.equal(evidence.outcome, 'UNKNOWN'); assert.equal(evidence.rollbackConfirmed, false);
    assert.equal(evidence.connectionDisposition, 'DESTROYED');
    assert.equal(f.acquisitions, 1); assert.equal(f.events.length, 0);
    assert.ok(!f.trace.some(value => value.startsWith('delay:'))); settled(f);
  });

  test(`C2C offline: ${code} exhaustion is isolated while a second document commits`, async () => {
    const f = fixture({ serializeTransactions: true, documents: [document('D1'), document('D2')],
      fail: (phase, values) => phase === 'recipient-2' && values[12] === 'D1' ? transient(code, errno) : false });
    const failed = assert.rejects(f.evaluate(f.documents[0]), error => error.code === code);
    const success = f.evaluate(f.documents[1]);
    await failed; assert.equal((await success).createdCount, 4);
    assert.equal(f.acquisitions, 4);
    assert.ok(f.state.notifications.every(row => row.related_resource_id === 'D2'));
    assert.ok(f.state.evaluations.every(row => row.document_id === 'D2'));
    assert.ok(f.state.audits.every(row => row.resource_id === 'D2'));
    assert.deepEqual(f.trace.filter(value => value.startsWith('delay:')), ['delay:25', 'delay:50']);
    assert.ok(f.backoffs.every(backoff => backoff.held === 0));
    assert.equal(f.events.length, 4); settled(f); committedEventsOnly(f);
  });
}

test('C2C offline: concurrent writer contexts retain their own project/document tokens', { timeout: 3000 }, async () => {
  const f = fixture(), admission = f.load('services/documentAdmission.service.js');
  const aEntered = deferred(), bEntered = deferred(), resume = deferred();
  const scopes = [{ projectId: 'P1', documentId: 'D1' }, { projectId: 'P2', documentId: 'D2' }];
  const seen = [];
  const task = (scope, entered, other) => admission.runWriter(scope, async () => {
    const context = admission.current(), token = context.id;
    entered.resolve(); await other.promise; await resume.promise;
    assert.equal(admission.current(), context);
    assert.equal(context.projectId, scope.projectId); assert.equal(context.documentId, scope.documentId);
    assert.equal(context.closed, false); seen.push(token);
  });
  const a = task(scopes[0], aEntered, bEntered), b = task(scopes[1], bEntered, aEntered);
  await Promise.all([aEntered.promise, bEntered.promise]);
  assert.equal(admission.current(), undefined); resume.resolve(); await Promise.all([a, b]);
  assert.equal(new Set(seen).size, 2); assert.equal(admission.current(), undefined);
  assert.equal(f.acquisitions, 0); assert.equal(f.events.length, 0);
});

test('C2C offline: wrong-project writer cannot borrow a transaction or emit events', async () => {
  const f = fixture(), admission = f.load('services/documentAdmission.service.js');
  await admission.runWriter({ projectId: 'OTHER', documentId: 'D1' }, async () => {
    await assert.rejects(f.evaluate(), { code: 'DOCUMENT_WRITER_SCOPE_MISMATCH' });
  });
  assert.equal(f.trace.filter(value => value === 'begin').length, 1);
  assert.equal(f.trace.filter(value => value === 'rollback').length, 1);
  assert.equal(f.guards.length, 0); assert.equal(f.events.length, 0);
  assert.deepEqual(f.state, { notifications: [], evaluations: [], audits: [] }); settled(f);
});

test('C2C offline: admitted same-scope evaluation uses one connection and its exact writer token', async () => {
  const f = fixture(), admission = f.load('services/documentAdmission.service.js');
  let token;
  await admission.runWriter({ projectId: 'P1', documentId: 'D1' }, async () => {
    token = admission.current().id;
    assert.equal((await f.evaluate()).createdCount, 4);
  });
  assert.equal(f.acquisitions, 1); assert.equal(f.guards[0].token, token);
  assert.equal(new Set(f.sqlCalls.map(call => call.connectionId)).size, 1);
  committedEventsOnly(f); settled(f);
});

test('C2C offline: ambiguous COMMIT preserves UNKNOWN even when a later evaluator suppresses duplicates', async () => {
  const f = fixture({ serializeTransactions: true, failure: 'commit-ack-unknown' });
  let unknown;
  await assert.rejects(f.evaluate(), error => { unknown = error; return true; });
  assert.equal(f.load('services/documentAdmission.service.js').getTransactionEvidence(unknown).outcome, 'UNKNOWN');
  assert.equal(f.events.length, 0); assert.equal(f.acquisitions, 1);
  assert.equal(f.state.notifications.length, 4, 'Fixture explicitly models server COMMIT before ACK loss');
  f.control.failure = null;
  const later = await f.evaluate();
  assert.equal(later.result, 'same_state_suppressed'); assert.equal(later.createdCount, 0);
  assert.equal(f.events.length, 0, 'No invented replay/reconciliation of unknown attempt SSE');
  assert.equal(f.acquisitions, 2); settled(f);
});

test('C2C offline: queued acquisition failure releases fixture queue and another evaluator completes', { timeout: 3000 }, async () => {
  let faults = 0;
  const f = fixture({ serializeTransactions: true,
    fail: phase => phase === 'acquire' && faults++ === 0 ? Object.assign(new Error('synthetic unavailable'), { code: 'ECONNREFUSED' }) : false });
  const failed = assert.rejects(f.evaluate(), { code: 'ECONNREFUSED' });
  const success = f.evaluate(); await failed;
  assert.equal((await success).createdCount, 4); assert.equal(f.acquisitions, 2);
  committedEventsOnly(f); settled(f);
});

test('C2C offline: import sandbox denies all unmocked driver/network/env/startup imports', () => {
  const helper = path.resolve(__dirname, '../helpers/slaTransactionFixture.cjs');
  const imports = [];
  const module = { exports: {} };
  new vm.Script(fs.readFileSync(helper, 'utf8'), { filename: helper }).runInNewContext({
    module, exports: module.exports, __dirname: path.dirname(helper), Buffer, structuredClone,
    require(name) {
      imports.push(name);
      assert.ok(['node:assert/strict', 'node:fs', 'node:path', 'node:vm', 'node:crypto', 'node:async_hooks'].includes(name));
      return require(name);
    },
  });
  assert.ok(imports.length > 0);
  const f = module.exports.fixture();
  for (const forbidden of ['config/database-live.js', 'server.js', 'services/storage.service.js', 'config/env.js']) {
    assert.throws(() => f.load(forbidden), /Blocked production dependency/);
  }
});

// Explicitly unexecuted integration obligations; fixture scheduling is not engine evidence.
for (const scenario of [
  'coordinator row-lock serialization on independent real SQL connections',
  'Approval/Revision commit versus evaluation under actual REPEATABLE READ',
  'engine-generated 1213 deadlock, acknowledged rollback and bounded fresh retry',
  'engine-generated 1205 timeout, partial statement effects and full application rollback',
  'concurrent notification/evaluation unique-key enforcement and idempotency',
  'unrelated document/project progress with real pool and lock isolation',
  'lost COMMIT acknowledgement reconciled against independent durable reads',
  'SSE publication after actual COMMIT/release with independent visibility evidence',
  'real connection/transaction settlement after retry exhaustion and uncertain cleanup',
]) test.todo(`C2C REAL DATABASE PENDING: ${scenario}`);
