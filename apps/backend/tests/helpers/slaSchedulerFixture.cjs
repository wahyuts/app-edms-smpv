const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const root = path.resolve(__dirname, '../../src');
const flush = async () => { for (let n = 0; n < 20; n++) await Promise.resolve(); };
const deferred = () => {
  let resolve, reject;
  const promise = new Promise((yes, no) => { resolve = yes; reject = no; });
  return { promise, resolve, reject };
};
const summary = (patch = {}) => ({ processedCount: 3, succeededCount: 3, failedCount: 0,
  skippedCount: 0, createdCount: 4, traversalComplete: true, evaluationComplete: true, ...patch });

const fakeClock = () => {
  const handles = [];
  const clock = { now: 0, handles };
  const timer = (type, callback, ms) => {
    const handle = { type, callback, ms, due: clock.now + ms, active: true, unrefed: false,
      unref() { handle.unrefed = true; return handle; } };
    handles.push(handle);
    return handle;
  };
  clock.globals = {
    Date: { now: () => clock.now },
    setTimeout: (callback, ms) => timer('timeout', callback, ms),
    setInterval: (callback, ms) => timer('interval', callback, ms),
    clearTimeout: handle => { handle.active = false; },
    clearInterval: handle => { handle.active = false; },
  };
  clock.advance = async (ms) => {
    const target = clock.now + ms;
    for (;;) {
      const next = handles.filter(handle => handle.active && handle.due <= target)
        .sort((a, b) => a.due - b.due)[0];
      if (!next) break;
      clock.now = next.due;
      if (next.type === 'interval') next.due += next.ms;
      else next.active = false;
      next.callback();
      await flush();
    }
    clock.now = target;
    await flush();
  };
  return clock;
};

// Source is executed only with explicit mocks: no native require, env, sockets, or DB driver.
const load = (file, dependencies, globals) => {
  const module = { exports: {} };
  new vm.Script(fs.readFileSync(path.join(root, file), 'utf8'), { filename: file }).runInNewContext({
    module, exports: module.exports,
    require(name) {
      assert.ok(Object.hasOwn(dependencies, name), `Blocked dependency: ${name}`);
      return dependencies[name];
    },
    ...globals,
  });
  return module.exports;
};

const schedulerFixture = (options = {}) => {
  const clock = fakeClock(), logs = [], calls = [], trace = [];
  const control = { ...options };
  const logger = Object.fromEntries(['log', 'error'].map(method => [method, (...args) => {
    const line = args.join(' ');
    logs.push(line); trace.push(line);
    if (control.loggerThrows) throw new Error('synthetic logger failure');
  }]));
  const scheduler = load('services/slaNotificationScheduler.service.js', {
    '../config/env': { slaNotificationScheduler: { enabled: options.enabled !== false, batchSize: 200, intervalMs: 900000 } },
    '../config/logger': logger,
    './slaNotificationProducer.service': { runScheduledEvaluation(args) {
      calls.push(args); trace.push('scan-start');
      return control.run ? control.run(args) : summary();
    } },
  }, clock.globals);
  return { scheduler, clock, calls, logs, logger, trace, control };
};

const serverFixture = (options = {}) => {
  const f = schedulerFixture(options);
  const exits = [], handlers = new Map();
  let closeCallback;
  const http = { close(callback) {
    f.trace.push('http-close'); closeCallback = callback;
    if (f.control.httpThrow) throw new Error('synthetic close throw');
    if (!f.control.httpHeld) callback(f.control.httpFailure);
  } };
  const server = load('server.js', {
    './config/logger': f.logger,
    './config/env': { port: 9999, appName: 'fixture', appVersion: 'test' },
    './config/database': {
      async testDatabaseConnection() { f.trace.push('db-check'); await f.control.startupGate?.promise; },
      async closeDatabasePool() {
        f.trace.push('pool-close');
        await f.control.onPoolClose?.();
        if (f.control.poolFailure) throw f.control.poolFailure;
      },
    },
    './services/storage.service': {
      async initializeStorage() {
        f.trace.push('storage-init');
        if (f.control.storageFailure) throw new Error('password=do-not-log');
      },
      async testStorageAccess() { f.trace.push('storage-check'); },
    },
    './services/realtimeConnectionRegistry.service': { closeAll() {
      f.trace.push('sse-close');
      if (f.control.sseCloseFailure) throw new Error('synthetic SSE close failure');
    } },
    './services/slaNotificationScheduler.service': f.scheduler,
    './services/temporaryUploadCleanupScheduler.service': {
      start() {
        f.trace.push('temporary-start');
        if (f.control.bootScan) void f.scheduler.runOnce();
        if (f.control.temporaryStartFailure) throw new Error('token=do-not-log');
      },
      stop() { f.trace.push('temporary-stop'); },
    },
    './app': { listen(port, callback) {
      assert.equal(port, 9999); f.trace.push('http-listen'); callback(); return http;
    } },
  }, { ...f.clock.globals, process: {
    once(name, callback) { handlers.set(name, callback); },
    exit(code) { exits.push(code); f.trace.push(`exit:${code}`); },
  } });
  return { ...f, server, exits, handlers,
    completeHttp: error => closeCallback(error),
    emit(name) {
      const handler = handlers.get(name);
      if (!handler) return;
      handlers.delete(name); // Model process.once consumption, not repeated callback invocation.
      return handler();
    } };
};

module.exports = { flush, deferred, summary, fakeClock, load, schedulerFixture, serverFixture };
