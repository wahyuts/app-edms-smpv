const env = require('../config/env');
const logger = require('../config/logger');
const slaNotificationProducer = require('./slaNotificationProducer.service');

let schedulerHandle = null;
let startupHandle = null;
let running = false;
let activeScan = null;
let stopPromise = null;
let state = 'idle';
let terminalStop = false;
let timerGeneration = 0;
const DRAIN_TIMEOUT_MS = 8000;

const log = (method, ...args) => {
  try { logger[method]('[SLA_NOTIFICATION_SCHEDULER]', ...args); } catch { /* Logging cannot break lifecycle cleanup. */ }
};

const runOnce = ({ triggerSource = 'scheduled_evaluation' } = {}) => {
  if (terminalStop || state === 'stopping' || state === 'stopped') {
    log('log', 'event=skip', `reason=${state}`, `state=${state}`);
    return Promise.resolve({ createdCount: 0, failedCount: 0, processedCount: 0, skipped: state });
  }
  if (running) {
    log('log', 'event=skip', 'reason=already_running', `state=${state}`);
    return Promise.resolve({
      createdCount: 0,
      failedCount: 0,
      processedCount: 0,
      skipped: 'already_running',
    });
  }

  running = true;
  state = 'running';
  const startedAt = Date.now();
  log('log', 'event=scan_started', `triggerSource=${triggerSource}`, `state=${state}`);
  // Defer execution until activeScan is assigned, including synchronously thrown producer errors.
  activeScan = Promise.resolve().then(async () => {
    try {
      const result = await slaNotificationProducer.runScheduledEvaluation({
        batchSize: env.slaNotificationScheduler.batchSize,
        triggerSource,
      });
      log('log',
        result.traversalComplete && result.evaluationComplete ? 'event=completed' : 'event=incomplete',
        `triggerSource=${triggerSource}`,
        `processedCount=${result.processedCount}`,
        `createdCount=${result.createdCount}`,
        `failedCount=${result.failedCount}`,
        `succeededCount=${result.succeededCount || 0}`,
        `skippedCount=${result.skippedCount || 0}`,
        `durationMs=${Date.now() - startedAt}`,
        `traversalComplete=${result.traversalComplete}`,
        `evaluationComplete=${result.evaluationComplete}`
      );
      return result;
    } catch (error) {
      log('error', 'event=failed', `triggerSource=${triggerSource}`,
        `errorCode=${error?.code || 'UNKNOWN'}`, `durationMs=${Date.now() - startedAt}`);
      return {
        createdCount: 0,
        failedCount: 1,
        processedCount: 0,
        error: error?.message || 'SLA evaluation failed',
        traversalComplete: false,
        evaluationComplete: false,
      };
    } finally {
      running = false;
      activeScan = null;
      if (state === 'stopping') {
        state = 'stopped';
        log('log', 'event=stop', `state=${state}`);
      } else state = 'idle';
    }
  });
  return activeScan;
};

const tick = (triggerSource) => {
  // Terminal handler also covers failures outside the producer's normal catch path.
  void runOnce({ triggerSource }).catch(error => {
    log('error', 'event=tick_rejected', `errorCode=${error?.code || 'UNKNOWN'}`);
  });
};

const start = () => {
  if (!env.slaNotificationScheduler.enabled) {
    log('log', 'event=disabled');
    return;
  }

  if (terminalStop || state === 'stopping') {
    log('log', 'event=skip_start', `state=${state}`, `terminal=${terminalStop}`);
    return;
  }
  if (schedulerHandle || startupHandle) return;
  stopPromise = null;
  if (!running) state = 'idle';

  const intervalMs = env.slaNotificationScheduler.intervalMs;
  const generation = ++timerGeneration;
  log('log',
    'event=start',
    `state=${state}`,
    `intervalMs=${intervalMs}`,
    `batchSize=${env.slaNotificationScheduler.batchSize}`
  );

  startupHandle = setTimeout(() => {
    if (generation !== timerGeneration) return;
    startupHandle = null;
    tick('scheduled_evaluation_startup');
  }, 5000).unref();

  schedulerHandle = setInterval(() => {
    if (generation !== timerGeneration) return;
    tick('scheduled_evaluation');
  }, intervalMs);
  schedulerHandle.unref();
};

const stop = ({ terminal = false, timeoutMs = DRAIN_TIMEOUT_MS } = {}) => {
  terminalStop = terminalStop || terminal;
  if (stopPromise) return stopPromise;
  state = 'stopping';
  timerGeneration += 1;
  log('log', 'event=stopping', `state=${state}`, `inFlight=${running}`, `terminal=${terminalStop}`);
  if (startupHandle) {
    clearTimeout(startupHandle);
    startupHandle = null;
  }
  if (schedulerHandle) {
    clearInterval(schedulerHandle);
    schedulerHandle = null;
  }
  const scan = activeScan;
  if (!scan) {
    state = 'stopped';
    log('log', 'event=drain_completed', 'inFlight=false');
    log('log', 'event=stop', `state=${state}`);
    stopPromise = Promise.resolve({ drained: true, timedOut: false });
  } else {
    const budget = Math.min(DRAIN_TIMEOUT_MS, Math.max(1, Number(timeoutMs) || DRAIN_TIMEOUT_MS));
    stopPromise = new Promise(resolve => {
      let settled = false;
      const finish = (timedOut) => {
        if (settled) return;
        settled = true;
        clearTimeout(deadline);
        log(timedOut ? 'error' : 'log', timedOut ? 'event=drain_timed_out' : 'event=drain_completed',
          `state=${state}`, `inFlight=${running}`, `timeoutMs=${budget}`);
        resolve({ drained: !timedOut, timedOut });
      };
      const deadline = setTimeout(() => finish(true), budget);
      // Settlement, including a late rejection after timeout, is always observed.
      scan.then(() => finish(false), () => finish(false));
    });
  }
  return stopPromise;
};

module.exports = {
  runOnce,
  start,
  stop,
};
