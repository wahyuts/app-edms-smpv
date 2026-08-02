const env = require('../config/env');
const logger = require('../config/logger');
const slaNotificationProducer = require('./slaNotificationProducer.service');

let schedulerHandle = null;
let startupHandle = null;
let running = false;

const runOnce = async ({ triggerSource = 'scheduled_evaluation' } = {}) => {
  if (running) {
    logger.log('[SLA_NOTIFICATION_SCHEDULER]', 'event=skip', 'reason=already_running');
    return {
      createdCount: 0,
      failedCount: 0,
      processedCount: 0,
      skipped: 'already_running',
    };
  }

  running = true;
  try {
    const result = await slaNotificationProducer.runScheduledEvaluation({
      batchSize: env.slaNotificationScheduler.batchSize,
      triggerSource,
    });

    logger.log(
      '[SLA_NOTIFICATION_SCHEDULER]',
      'event=completed',
      `triggerSource=${triggerSource}`,
      `processedCount=${result.processedCount}`,
      `createdCount=${result.createdCount}`,
      `failedCount=${result.failedCount}`
    );

    return result;
  } catch (error) {
    logger.error(
      '[SLA_NOTIFICATION_SCHEDULER]',
      'event=failed',
      `triggerSource=${triggerSource}`,
      `error=${error.message}`
    );
    return {
      createdCount: 0,
      failedCount: 1,
      processedCount: 0,
      error: error.message,
    };
  } finally {
    running = false;
  }
};

const start = () => {
  if (!env.slaNotificationScheduler.enabled) {
    logger.log('[SLA_NOTIFICATION_SCHEDULER]', 'event=disabled');
    return;
  }

  if (schedulerHandle) return;

  const intervalMs = env.slaNotificationScheduler.intervalMs;
  logger.log(
    '[SLA_NOTIFICATION_SCHEDULER]',
    'event=start',
    `intervalMs=${intervalMs}`,
    `batchSize=${env.slaNotificationScheduler.batchSize}`
  );

  startupHandle = setTimeout(() => {
    runOnce({ triggerSource: 'scheduled_evaluation_startup' });
  }, 5000).unref();

  schedulerHandle = setInterval(() => {
    runOnce({ triggerSource: 'scheduled_evaluation' });
  }, intervalMs);
  schedulerHandle.unref();
};

const stop = () => {
  if (startupHandle) {
    clearTimeout(startupHandle);
    startupHandle = null;
  }
  if (!schedulerHandle) return;

  clearInterval(schedulerHandle);
  schedulerHandle = null;
  logger.log('[SLA_NOTIFICATION_SCHEDULER]', 'event=stop');
};

module.exports = {
  runOnce,
  start,
  stop,
};
