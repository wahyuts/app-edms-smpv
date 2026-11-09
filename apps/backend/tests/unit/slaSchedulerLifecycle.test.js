const assert = require('node:assert/strict');
const test = require('node:test');
const { flush, deferred, summary, schedulerFixture, serverFixture } = require('../helpers/slaSchedulerFixture.cjs');

test('B3: start is idempotent and preserves 5-second startup and 15-minute interval', async () => {
  const f = schedulerFixture();
  f.scheduler.start(); f.scheduler.start();
  assert.deepEqual(f.clock.handles.map(h => [h.type, h.ms]), [['timeout', 5000], ['interval', 900000]]);
  assert.ok(f.clock.handles.every(h => h.unrefed));
  await f.clock.advance(4999);
  assert.equal(f.calls.length, 0);
  await f.clock.advance(1);
  assert.equal(f.calls.length, 1);
  assert.equal(f.calls[0].triggerSource, 'scheduled_evaluation_startup');
  await f.clock.advance(895000);
  assert.equal(f.calls.length, 2);
  assert.equal(f.calls[1].triggerSource, 'scheduled_evaluation');
});

test('B3: disabled start preserves timer-free manual runOnce behavior', async () => {
  const f = schedulerFixture({ enabled: false });
  f.scheduler.start();
  assert.equal(f.clock.handles.length, 0);
  assert.equal((await f.scheduler.runOnce()).createdCount, 4);
});

test('B3: stop before startup clears timers, is idempotent, and rejects queued/manual ticks', async () => {
  const f = schedulerFixture();
  f.scheduler.start();
  const oldTimers = [...f.clock.handles];
  const stop = f.scheduler.stop();
  assert.equal(f.scheduler.stop(), stop);
  assert.equal((await stop).drained, true);
  assert.ok(f.clock.handles.every(h => !h.active));
  oldTimers.forEach(h => h.callback());
  assert.equal((await f.scheduler.runOnce()).skipped, 'stopped');
  await f.clock.advance(900000);
  assert.equal(f.calls.length, 0);
});

test('B3: manual restart is allowed after ordinary stop; stale timer generation cannot run', async () => {
  const f = schedulerFixture();
  f.scheduler.start();
  const oldTimers = [...f.clock.handles];
  await f.scheduler.stop();
  f.scheduler.start(); f.scheduler.start();
  oldTimers.forEach(h => h.callback());
  await flush();
  assert.equal(f.calls.length, 0);
  assert.equal(f.clock.handles.filter(h => h.active).length, 2);
  await f.clock.advance(5000);
  assert.equal(f.calls.length, 1);
  await f.scheduler.stop();
  assert.ok(f.clock.handles.every(h => !h.active));
});

test('B3: terminal stop cannot be reversed by start or runOnce', async () => {
  const f = schedulerFixture();
  await f.scheduler.stop();
  await f.scheduler.stop({ terminal: true });
  f.scheduler.start();
  assert.equal(f.clock.handles.length, 0);
  assert.equal((await f.scheduler.runOnce()).skipped, 'stopped');
});

test('B3: long scan skips multiple intervals without overlap or backlog', async () => {
  const pending = deferred();
  const f = schedulerFixture({ run: () => pending.promise });
  f.scheduler.start();
  const scan = f.scheduler.runOnce();
  await f.clock.advance(1800000);
  assert.equal(f.calls.length, 1);
  assert.equal((await f.scheduler.runOnce()).skipped, 'already_running');
  assert.ok(f.logs.filter(line => line.includes('reason=already_running')).length >= 3);
  pending.resolve(summary());
  await scan; await flush();
  assert.equal(f.calls.length, 1, 'Skipped ticks must not become queued scans');
  f.control.run = () => summary();
  await f.clock.advance(900000);
  assert.equal(f.calls.length, 2);
});

test('B3: synchronous producer failure releases guard and next scheduled tick still works', async () => {
  let first = true;
  const f = schedulerFixture({ run: () => {
    if (first) { first = false; throw new Error('synthetic producer failure'); }
    return summary();
  } });
  f.scheduler.start();
  await f.clock.advance(5000);
  assert.ok(f.logs.some(line => line.includes('event=failed')));
  await f.clock.advance(895000);
  assert.equal(f.calls.length, 2);
  assert.ok(f.logs.some(line => line.includes('event=completed')));
});

for (const fails of [false, true]) {
  test(`B3: stop awaits active scan settlement before deadline (failure=${fails})`, async () => {
    const pending = deferred();
    const f = schedulerFixture({ run: () => pending.promise });
    f.scheduler.start();
    const scan = f.scheduler.runOnce();
    await flush();
    let finished = false;
    const stop = f.scheduler.stop();
    stop.then(() => { finished = true; });
    assert.equal(stop, f.scheduler.stop());
    assert.equal((await f.scheduler.runOnce()).skipped, 'stopping');
    f.scheduler.start();
    await f.clock.advance(7999);
    assert.equal(finished, false);
    assert.equal(f.calls.length, 1);
    if (fails) pending.reject(new Error('synthetic scan failure'));
    else pending.resolve(summary());
    await scan;
    const result = await stop;
    assert.equal(result.drained, true);
    assert.equal(result.timedOut, false);
    assert.ok(f.clock.handles.every(h => !h.active));
    assert.ok(f.logs.some(line => line.includes('event=drain_completed')));
    assert.equal((await f.scheduler.runOnce()).skipped, 'stopped');
  });
}

for (const fails of [false, true]) {
  test(`B3: timeout is not completion and late settlement is observed (failure=${fails})`, async () => {
    const pending = deferred();
    const f = schedulerFixture({ run: () => pending.promise });
    const scan = f.scheduler.runOnce();
    await flush();
    const stop = f.scheduler.stop();
    await f.clock.advance(8000);
    const result = await stop;
    assert.equal(result.drained, false);
    assert.equal(result.timedOut, true);
    assert.ok(f.logs.some(line => line.includes('event=drain_timed_out') && line.includes('inFlight=true')));
    assert.ok(!f.logs.some(line => line.includes('event=drain_completed')));
    assert.equal((await f.scheduler.runOnce()).skipped, 'stopping');
    f.scheduler.start();
    assert.equal(f.calls.length, 1);
    if (fails) pending.reject(new Error('late rejection'));
    else pending.resolve(summary());
    await scan; await new Promise(setImmediate);
    assert.equal((await f.scheduler.runOnce()).skipped, 'stopped');
    assert.ok(!f.logs.some(line => line.includes('event=drain_completed')), 'Timeout verdict must not be rewritten');
    f.control.run = () => summary();
    f.scheduler.start();
    await f.clock.advance(5000);
    assert.equal(f.calls.length, 2);
  });
}

test('B3: admission immediately before stop is included in the drain promise', async () => {
  const pending = deferred();
  const f = schedulerFixture({ run: () => pending.promise });
  const scan = f.scheduler.runOnce();
  const stop = f.scheduler.stop({ terminal: true });
  await flush();
  assert.equal(f.calls.length, 1);
  assert.equal((await f.scheduler.runOnce()).skipped, 'stopping');
  pending.resolve(summary());
  await scan;
  assert.equal((await stop).drained, true);
});

for (const patch of [{}, { failedCount: 1, evaluationComplete: false },
  { traversalComplete: false, evaluationComplete: false }]) {
  test(`B3: aggregate diagnostics preserve completion flags ${JSON.stringify(patch)}`, async () => {
    const value = summary({ ...patch, secret: 'sensitive-payload', notifications: [{ token: 'secret-token' }] });
    const f = schedulerFixture({ run: () => value });
    assert.equal(await f.scheduler.runOnce(), value);
    const line = f.logs.find(entry => entry.includes('event=completed') || entry.includes('event=incomplete'));
    for (const key of ['succeededCount', 'failedCount', 'skippedCount', 'createdCount', 'traversalComplete', 'evaluationComplete']) {
      assert.ok(line.includes(`${key}=${value[key]}`));
    }
    assert.ok(line.includes('durationMs='));
    assert.ok(f.logs.every(entry => !/sensitive-payload|secret-token/.test(entry)));
  });
}

test('B3: scheduled rejection and logger failures do not escape or expose raw error contents', async () => {
  const f = schedulerFixture({ loggerThrows: true, run: () => Promise.reject(
    Object.assign(new Error('password=secret; connection-string'), { code: 'SYNTHETIC' })) });
  f.scheduler.start();
  await f.clock.advance(900000);
  assert.equal(f.calls.length, 2);
  assert.ok(f.logs.every(line => !line.includes('password=secret')));
  assert.equal((await f.scheduler.stop()).drained, true);
});

test('B3: shutdown closes admission before HTTP drain and waits for both before pool close', async () => {
  const pending = deferred();
  const f = serverFixture({ httpHeld: true, run: () => pending.promise });
  await f.server.startServer();
  const scan = f.scheduler.runOnce(); await flush();
  const shutdown = f.server.shutdown('SIGTERM');
  assert.ok(f.trace.findIndex(line => line.includes('event=stopping')) < f.trace.indexOf('http-close'));
  assert.equal((await f.scheduler.runOnce()).skipped, 'stopping');
  assert.equal(f.trace.includes('pool-close'), false);
  pending.resolve(summary()); await scan; await flush();
  assert.equal(f.trace.includes('pool-close'), false, 'Active HTTP requests may still use the pool');
  f.completeHttp(); await shutdown;
  assert.equal(f.trace.filter(line => line === 'pool-close').length, 1);
  assert.ok(f.trace.indexOf('pool-close') > f.trace.findIndex(line => line.includes('event=drain_completed')));
  assert.deepEqual(f.exits, [0]);
});

test('B3: graceful shutdown clears forced-exit timer and prevents restart', async () => {
  const f = serverFixture();
  await f.server.startServer();
  await f.server.shutdown('SIGINT');
  const force = f.clock.handles.find(h => h.ms === 10000);
  assert.ok(force && force.unrefed && !force.active);
  assert.ok(f.clock.handles.every(h => !h.active));
  f.scheduler.start();
  await f.server.startServer();
  await f.clock.advance(900000);
  assert.equal(f.calls.length, 0);
  assert.deepEqual(f.exits, [0]);
});

test('B3: drain timeout leaves pool open and preserves original 10-second forced exit', async () => {
  const pending = deferred();
  const f = serverFixture({ run: () => pending.promise });
  await f.server.startServer();
  const scan = f.scheduler.runOnce(); await flush();
  const shutdown = f.server.shutdown('SIGTERM');
  await f.clock.advance(8000); await shutdown;
  assert.equal(f.trace.includes('pool-close'), false);
  assert.deepEqual(f.exits, []);
  assert.ok(f.logs.some(line => line.includes('Incomplete shutdown') && line.includes('pool remains open')));
  await f.clock.advance(1999);
  assert.deepEqual(f.exits, []);
  await f.clock.advance(1);
  assert.deepEqual(f.exits, [1]);
  pending.reject(new Error('late failure')); await scan; await new Promise(setImmediate);
  assert.equal(f.trace.includes('pool-close'), false, 'Late settlement must not resume abandoned graceful cleanup');
  f.scheduler.start();
  assert.ok(!f.clock.handles.some(h => h.active));
});

test('B3: HTTP drain exceeding deadline still uses forced exit, without pool close', async () => {
  const f = serverFixture({ httpHeld: true });
  await f.server.startServer();
  void f.server.shutdown('SIGTERM');
  await f.clock.advance(10000);
  assert.deepEqual(f.exits, [1]);
  assert.equal(f.trace.includes('pool-close'), false);
});

test('B3: repeated SIGTERM/SIGINT and direct shutdown do not duplicate cleanup', async () => {
  const pending = deferred();
  const f = serverFixture({ run: () => pending.promise });
  await f.server.startServer();
  const scan = f.scheduler.runOnce(); await flush();
  f.emit('SIGTERM'); f.emit('SIGINT');
  await f.server.shutdown('again');
  assert.equal(f.trace.filter(line => line === 'http-close').length, 1);
  assert.equal(f.clock.handles.filter(h => h.ms === 10000).length, 1);
  pending.resolve(summary()); await scan; await flush();
  assert.deepEqual(f.exits, [0]);
  assert.equal(f.trace.filter(line => line === 'pool-close').length, 1);
});

for (const failure of ['httpFailure', 'httpThrow', 'sseCloseFailure']) {
  test(`B3: ${failure} is observed while waiting for scan settlement before error exit`, async () => {
    const pending = deferred();
    const f = serverFixture({ [failure]: new Error('password=secret'), run: () => pending.promise });
    await f.server.startServer();
    const scan = f.scheduler.runOnce(); await flush();
    const shutdown = f.server.shutdown('SIGTERM'); await flush();
    assert.deepEqual(f.exits, []);
    pending.resolve(summary()); await scan; await shutdown;
    assert.deepEqual(f.exits, [1]);
    assert.equal(f.trace.includes('pool-close'), false);
    assert.ok(f.logs.every(line => !line.includes('password=secret')));
    assert.ok(f.clock.handles.every(h => !h.active));
  });
}

test('B3: ERR_SERVER_NOT_RUNNING preserves graceful handling', async () => {
  const f = serverFixture({ httpFailure: Object.assign(new Error('not listening'), { code: 'ERR_SERVER_NOT_RUNNING' }) });
  await f.server.startServer();
  await f.server.shutdown('SIGTERM');
  assert.deepEqual(f.exits, [0]);
  assert.ok(f.trace.includes('pool-close'));
});

test('B3: pool-close failure preserves error exit and does not log credentials', async () => {
  const f = serverFixture({ poolFailure: new Error('password=secret') });
  await f.server.startServer();
  await f.server.shutdown('SIGTERM');
  assert.deepEqual(f.exits, [1]);
  assert.ok(f.logs.every(line => !line.includes('password=secret')));
  assert.ok(f.clock.handles.every(h => !h.active));
});

for (const failure of ['storageFailure', 'temporaryStartFailure']) {
  test(`B3: startup ${failure} uses terminal cleanup without leaving scheduler timers`, async () => {
    const f = serverFixture({ [failure]: true });
    await f.server.startServer();
    assert.deepEqual(f.exits, [1]);
    assert.equal(f.trace.filter(line => line === 'pool-close').length, 1);
    assert.ok(f.clock.handles.every(h => !h.active));
    assert.equal((await f.scheduler.runOnce()).skipped, 'stopped');
    assert.ok(f.logs.every(line => !line.includes('do-not-log')));
  });
}

test('B3: startup failure after an admitted scan drains it before pool cleanup', async () => {
  const pending = deferred();
  const f = serverFixture({ temporaryStartFailure: true, bootScan: true, run: () => pending.promise });
  const boot = f.server.startServer(); await flush();
  assert.equal(f.calls.length, 1);
  assert.equal(f.trace.includes('pool-close'), false);
  assert.equal((await f.scheduler.runOnce()).skipped, 'stopping');
  pending.resolve(summary()); await boot;
  assert.ok(f.trace.includes('pool-close'));
  assert.deepEqual(f.exits, [1]);
  assert.ok(f.clock.handles.every(h => !h.active));
});

test('B3: shutdown during startup cannot start HTTP/schedulers after dependencies resume', async () => {
  const startupGate = deferred();
  const f = serverFixture({ startupGate });
  const boot = f.server.startServer(); await flush();
  await f.server.shutdown('SIGTERM');
  startupGate.resolve(); await boot;
  assert.equal(f.trace.includes('http-listen'), false);
  assert.equal(f.trace.includes('storage-init'), false);
  assert.equal(f.trace.includes('temporary-start'), false);
  assert.deepEqual(f.exits, [0]);
});

test('B3: shutdown logger failures cannot produce rejected signal callbacks', async () => {
  const f = serverFixture({ loggerThrows: true });
  await f.server.startServer();
  f.emit('SIGTERM'); await flush();
  assert.deepEqual(f.exits, [0]);
  assert.ok(f.clock.handles.every(h => !h.active));
});

test('B3: unverified drain fails closed and leaves forced-exit policy active', async () => {
  const f = serverFixture();
  await f.server.startServer();
  const stop = f.scheduler.stop;
  f.scheduler.stop = options => { stop(options); return Promise.reject(new Error('synthetic drain failure')); };
  await f.server.shutdown('SIGTERM');
  assert.equal(f.trace.includes('pool-close'), false);
  assert.deepEqual(f.exits, []);
  await f.clock.advance(10000);
  assert.deepEqual(f.exits, [1]);
});

for (const event of ['uncaughtException', 'unhandledRejection']) {
  test(`B3: ${event} preserves error-exit policy with terminal cleanup`, async () => {
    const f = serverFixture();
    await f.server.startServer();
    f.handlers.get(event)(Object.assign(new Error('password=secret'), { code: 'SYNTHETIC' }));
    await flush();
    assert.deepEqual(f.exits, [1]);
    assert.ok(f.trace.includes('pool-close'));
    assert.ok(f.clock.handles.every(h => !h.active));
    assert.ok(f.logs.every(line => !line.includes('password=secret')));
  });
}

test('B3: startup cleanup timeout does not close the pool or report successful cleanup', async () => {
  const pending = deferred();
  const f = serverFixture({ temporaryStartFailure: true, bootScan: true, run: () => pending.promise });
  const boot = f.server.startServer(); await flush();
  await f.clock.advance(8000); await boot;
  assert.equal(f.trace.includes('pool-close'), false);
  assert.deepEqual(f.exits, []);
  await f.clock.advance(2000);
  assert.deepEqual(f.exits, [1]);
  pending.resolve(summary()); await flush();
  assert.equal(f.trace.includes('pool-close'), false);
});

test('B3: failed scan settlement still permits graceful shutdown with the original signal exit code', async () => {
  const pending = deferred();
  const f = serverFixture({ run: () => pending.promise });
  await f.server.startServer();
  const scan = f.scheduler.runOnce(); await flush();
  const shutdown = f.server.shutdown('SIGTERM');
  pending.reject(new Error('synthetic scan failure'));
  assert.equal((await scan).failedCount, 1);
  await shutdown;
  assert.deepEqual(f.exits, [0]);
  assert.ok(f.trace.includes('pool-close'));
  assert.ok(f.clock.handles.every(h => !h.active));
});
