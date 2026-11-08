const assert = require('node:assert/strict');
const test = require('node:test');
const { fixture } = require('../helpers/slaTransactionFixture.cjs');
const { serverFixture, schedulerFixture, deferred, flush, summary, load } = require('../helpers/slaSchedulerFixture.cjs');

// Actual scheduler/server coordinator and producer/admission code; no real app, process or DB.
const integrated = (transactionOptions = {}, serverOptions = {}) => {
  const transaction = fixture(transactionOptions);
  const producer = transaction.load('services/slaNotificationProducer.service.js');
  const lifecycle = serverFixture({
    run: args => producer.runScheduledEvaluation(args),
    onPoolClose() {
      assert.equal(transaction.activeConnections, 0, 'Pool must not close while evaluation owns a connection');
      assert.ok(transaction.connections.every(connection => connection.disposed));
    },
    ...serverOptions,
  });
  return { transaction, ...lifecycle };
};
const count = (f, operation) => f.trace.filter(item => item === operation).length;
const timersGone = f => assert.equal(f.clock.handles.filter(handle => handle.active).length, 0);
const cannotRestart = async f => {
  f.scheduler.start();
  assert.ok(['stopping', 'stopped'].includes((await f.scheduler.runOnce()).skipped));
};

test('C2D: in-flight staged COMMIT drains at 7999ms; no new tick, duplicate evaluation or early pool close', { timeout: 3000 }, async () => {
  const entered = deferred(), resume = deferred();
  const f = integrated({ beforeCommit: async () => { entered.resolve(); await resume.promise; } });
  await f.server.startServer();
  const staleTimers = [...f.clock.handles];
  const scan = f.scheduler.runOnce(); await entered.promise;
  assert.equal((await f.scheduler.runOnce()).skipped, 'already_running');
  staleTimers.forEach(handle => handle.callback()); await flush();
  assert.equal(f.calls.length, 1); assert.equal(f.transaction.acquisitions, 1);
  const shutdown = f.server.shutdown('C2D');
  await cannotRestart(f); staleTimers.forEach(handle => handle.callback());
  await f.clock.advance(7999);
  assert.equal(f.transaction.activeConnections, 1); assert.equal(f.transaction.events.length, 0);
  assert.equal(count(f, 'pool-close'), 0); assert.equal(f.exits.length, 0);
  assert.equal(count(f, 'http-close'), 1); assert.equal(count(f, 'sse-close'), 1);
  resume.resolve();
  assert.equal((await scan).createdCount, 4); await shutdown;
  assert.deepEqual(f.exits, [0]); assert.equal(count(f, 'pool-close'), 1);
  assert.equal(f.transaction.events.length, 4);
  assert.ok(f.transaction.publications.every(event => event.committed && event.disposed));
  assert.ok(f.logs.some(line => line.includes('event=drain_completed')));
  assert.ok(!f.logs.some(line => line.includes('event=drain_timed_out')));
  timersGone(f); await cannotRestart(f); timersGone(f);
});

test('C2D: shutdown during retry backoff waits for fresh attempt and committed SSE', { timeout: 3000 }, async () => {
  const delayed = deferred(), resume = deferred(); let faults = 0;
  const f = integrated({
    fail: phase => phase === 'audit' && faults++ === 0
      ? Object.assign(new Error('synthetic deadlock'), { code: 'ER_LOCK_DEADLOCK', errno: 1213 }) : false,
    holdDelay: async () => { delayed.resolve(); await resume.promise; },
  });
  await f.server.startServer();
  const scan = f.scheduler.runOnce(); await delayed.promise;
  assert.equal(f.transaction.activeConnections, 0); assert.equal(f.transaction.events.length, 0);
  const shutdown = f.server.shutdown('C2D'); await cannotRestart(f);
  await f.clock.advance(1000);
  assert.equal(count(f, 'pool-close'), 0, 'Released connection is not proof that the whole scan settled');
  assert.equal(f.exits.length, 0); resume.resolve();
  const result = await scan; await shutdown;
  assert.equal(result.failedCount, 0); assert.equal(result.createdCount, 4);
  assert.equal(f.transaction.acquisitions, 2);
  assert.equal(f.transaction.connections.filter(connection => connection.rolledBack).length, 1);
  assert.equal(f.transaction.events.length, 4); assert.deepEqual(f.exits, [0]);
  assert.equal(count(f, 'pool-close'), 1); timersGone(f);
});

test('C2D: failed evaluation rolls back and drains without reporting scan success', { timeout: 3000 }, async () => {
  const entered = deferred(), resume = deferred();
  const f = integrated({ failure: 'audit', afterGate: async () => { entered.resolve(); await resume.promise; } });
  await f.server.startServer();
  const scan = f.scheduler.runOnce(); await entered.promise;
  const shutdown = f.server.shutdown('C2D'); await f.clock.advance(2000);
  assert.equal(count(f, 'pool-close'), 0); resume.resolve();
  const result = await scan; await shutdown;
  assert.equal(result.failedCount, 1); assert.equal(result.createdCount, 0);
  assert.equal(result.traversalComplete, true); assert.equal(result.evaluationComplete, false);
  assert.deepEqual(f.transaction.state, { notifications: [], evaluations: [], audits: [] });
  assert.equal(f.transaction.events.length, 0);
  assert.ok(f.logs.some(line => line.includes('event=incomplete')));
  assert.ok(!f.logs.some(line => line.includes('event=completed')));
  assert.deepEqual(f.exits, [0], 'Graceful resource drain is not the same as evaluation success');
  assert.equal(count(f, 'pool-close'), 1); timersGone(f);
});

test('C2D: exact 8000ms drain timeout leaves active transaction/pool alone; late success cannot cancel 10000ms forced exit', { timeout: 3000 }, async () => {
  const entered = deferred(), resume = deferred();
  const f = integrated({ beforeCommit: async () => { entered.resolve(); await resume.promise; } });
  await f.server.startServer();
  const scan = f.scheduler.runOnce(); await entered.promise;
  const shutdown = f.server.shutdown('C2D');
  await f.clock.advance(7999);
  assert.ok(!f.logs.some(line => line.includes('event=drain_timed_out')));
  await f.clock.advance(1); await shutdown;
  assert.ok(f.logs.some(line => line.includes('event=drain_timed_out')));
  assert.equal(f.transaction.activeConnections, 1); assert.equal(f.transaction.trace.includes('rollback'), false);
  assert.equal(count(f, 'pool-close'), 0); assert.equal(f.exits.length, 0);
  await cannotRestart(f); await f.clock.advance(1000);
  resume.resolve(); assert.equal((await scan).createdCount, 4); await flush();
  assert.equal(f.transaction.activeConnections, 0);
  assert.equal(count(f, 'pool-close'), 0, 'Late completion must not silently resume the timed-out shutdown');
  assert.ok(f.clock.handles.some(handle => handle.active && handle.ms === 10000 && handle.unrefed));
  await f.clock.advance(999); assert.equal(f.exits.length, 0);
  await f.clock.advance(1); assert.deepEqual(f.exits, [1]);
  assert.equal(count(f, 'pool-close'), 0); timersGone(f);
});

test('C2D: rejected producer after drain timeout is observed without recovery or a successful exit', { timeout: 3000 }, async () => {
  const pending = deferred(); const f = serverFixture({ run: () => pending.promise });
  await f.server.startServer();
  const scan = f.scheduler.runOnce(); await flush();
  const shutdown = f.server.shutdown('C2D'); await f.clock.advance(8000); await shutdown;
  pending.reject(Object.assign(new Error('synthetic failure'), { code: 'C2D_FAULT' }));
  const result = await scan; await flush();
  assert.equal(result.evaluationComplete, false); assert.equal(result.traversalComplete, false);
  assert.ok(f.logs.some(line => line.includes('event=failed') && line.includes('errorCode=C2D_FAULT')));
  assert.equal(count(f, 'pool-close'), 0); assert.equal(f.exits.length, 0);
  await f.clock.advance(2000); assert.deepEqual(f.exits, [1]); timersGone(f);
});

test('C2D: evaluation settlement cannot close pool before held HTTP callback; completion at 9999ms clears forced timer', { timeout: 3000 }, async () => {
  const f = integrated({}, { httpHeld: true });
  await f.server.startServer();
  const result = await f.scheduler.runOnce(); assert.equal(result.createdCount, 4);
  const shutdown = f.server.shutdown('C2D'); await f.clock.advance(9999);
  assert.equal(count(f, 'pool-close'), 0); assert.equal(f.exits.length, 0);
  f.completeHttp(); await shutdown;
  assert.deepEqual(f.exits, [0]); assert.equal(count(f, 'pool-close'), 1);
  await f.clock.advance(10001); assert.deepEqual(f.exits, [0]); timersGone(f);
});

test('C2D: consumed once listeners and repeated signal/direct shutdown do not duplicate cleanup', { timeout: 3000 }, async () => {
  const entered = deferred(), resume = deferred();
  const f = integrated({ beforeCommit: async () => { entered.resolve(); await resume.promise; } });
  await f.server.startServer();
  const scan = f.scheduler.runOnce(); await entered.promise;
  assert.equal(f.handlers.size, 4);
  f.emit('SIGTERM'); assert.equal(f.handlers.has('SIGTERM'), false);
  f.emit('SIGTERM'); f.emit('SIGINT'); assert.equal(f.handlers.has('SIGINT'), false);
  await f.server.shutdown('duplicate'); await f.server.shutdown('duplicate');
  assert.equal(count(f, 'http-close'), 1); assert.equal(count(f, 'sse-close'), 1);
  assert.equal(f.clock.handles.filter(handle => handle.ms === 10000).length, 1);
  resume.resolve(); await scan; await flush();
  assert.deepEqual(f.exits, [0]); assert.equal(count(f, 'pool-close'), 1);
  assert.equal(count(f, 'temporary-stop'), 1); timersGone(f);
  // Error listeners remain registered until real process termination; no explicit off() is claimed.
  assert.equal(f.handlers.size, 2);
});

test('C2D: shutdown before startup tick cancels both scheduler timers without evaluating', async () => {
  const f = integrated(); await f.server.startServer();
  const stale = [...f.clock.handles];
  await f.server.shutdown('C2D'); stale.forEach(handle => handle.callback());
  await f.clock.advance(1800000); await cannotRestart(f);
  assert.equal(f.calls.length, 0); assert.equal(f.transaction.acquisitions, 0);
  assert.equal(count(f, 'pool-close'), 1); assert.deepEqual(f.exits, [0]); timersGone(f);
});

test('C2D: shutdown deadline is relative to shutdown, not the initial 5000ms startup tick', { timeout: 3000 }, async () => {
  const entered = deferred(), resume = deferred();
  const f = integrated({ beforeCommit: async () => { entered.resolve(); await resume.promise; } });
  await f.server.startServer(); await f.clock.advance(5000); await entered.promise;
  assert.equal(f.calls[0].triggerSource, 'scheduled_evaluation_startup');
  const shutdown = f.server.shutdown('C2D'); await f.clock.advance(7999);
  assert.equal(f.clock.now, 12999); assert.equal(f.exits.length, 0);
  assert.ok(!f.logs.some(line => line.includes('event=drain_timed_out')));
  resume.resolve(); await flush();
  // Timer-started scans have no public promise; drain is the settlement boundary.
  await shutdown;
  assert.equal(f.transaction.activeConnections, 0); assert.deepEqual(f.exits, [0]);
  assert.equal(f.calls.length, 1); timersGone(f);
});

test('C2D: stop clamps oversized custom drain budget to the existing 8000ms limit', async () => {
  const pending = deferred(), f = schedulerFixture({ run: () => pending.promise });
  const scan = f.scheduler.runOnce(); await flush();
  const stop = f.scheduler.stop({ terminal: true, timeoutMs: 60000 });
  await f.clock.advance(8000);
  const result = await stop;
  assert.equal(result.drained, false); assert.equal(result.timedOut, true);
  pending.resolve(summary()); await scan; await cannotRestart(f); timersGone(f);
});

test('C2D: import allowlist blocks real server dependencies instead of starting backend or providers', () => {
  for (const file of ['server.js', 'services/slaNotificationScheduler.service.js']) {
    assert.throws(() => load(file, {}, {}), /Blocked dependency/);
  }
});

for (const scenario of [
  'actual in-flight MySQL transaction settlement and pool shutdown under OS SIGTERM',
  'actual deadlock/lock-timeout retry draining with durable rollback and no leaked DB sessions',
  'forced process termination during COMMIT and durable outcome reconciliation',
  'real HTTP/SSE listener teardown and browser reconnection around deployment shutdown',
]) test.todo(`C2D REAL ENVIRONMENT PENDING: ${scenario}`);
