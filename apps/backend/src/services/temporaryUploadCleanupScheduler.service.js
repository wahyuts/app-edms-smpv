const env = require('../config/env');
const logger = require('../config/logger');
const storageService = require('./storage.service');
const temporaryUploadCleanupService = require('./temporaryUploadCleanup.service');

let schedulerHandle = null;
let startupHandle = null;
let running = false;

const runOnce = async ({ triggerSource = 'scheduled' } = {}) => {
  if (running) {
    logger.log(
      '[TEMPORARY_UPLOAD_CLEANUP]',
      'event=temporary_upload_cleanup_skipped',
      'reason=already_running'
    );

    return {
      skipped: 'already_running',
    };
  }

  running = true;
  const startedAt = Date.now();

  try {
    logger.log(
      '[TEMPORARY_UPLOAD_CLEANUP]',
      'event=temporary_upload_cleanup_started',
      `triggerSource=${triggerSource}`,
      `batchSize=${env.temporaryUploadCleanupScheduler.batchSize}`
    );

    const expiredUploadResult = await temporaryUploadCleanupService.cleanupExpiredTemporaryUploads({
      limit: env.temporaryUploadCleanupScheduler.batchSize,
    });
    const emptyDirectoryResult = await storageService.cleanupEmptyTemporaryDirectories({
      limit: env.temporaryUploadCleanupScheduler.batchSize,
    });
    const durationMs = Date.now() - startedAt;

    logger.log(
      '[TEMPORARY_UPLOAD_CLEANUP]',
      'event=temporary_upload_cleanup_completed',
      `triggerSource=${triggerSource}`,
      `candidateCount=${expiredUploadResult.candidates}`,
      `deletedObjectCount=${expiredUploadResult.deletedObjects}`,
      `deletedMetadataCount=${expiredUploadResult.deletedMetadata}`,
      `failedCount=${expiredUploadResult.failed}`,
      `skippedCount=${expiredUploadResult.skipped}`,
      `deletedEmptyDirectoryCount=${emptyDirectoryResult.deletedDirectories || 0}`,
      `emptyDirectoryFailedCount=${emptyDirectoryResult.failed || 0}`,
      `durationMs=${durationMs}`
    );

    return {
      durationMs,
      emptyDirectoryResult,
      expiredUploadResult,
    };
  } catch (error) {
    const durationMs = Date.now() - startedAt;

    logger.error(
      '[TEMPORARY_UPLOAD_CLEANUP]',
      'event=temporary_upload_cleanup_failed',
      `triggerSource=${triggerSource}`,
      `durationMs=${durationMs}`,
      `error=${error.message}`
    );

    return {
      durationMs,
      error: error.message,
      failed: true,
    };
  } finally {
    running = false;
  }
};

const start = () => {
  if (!env.temporaryUploadCleanupScheduler.enabled) {
    logger.log('[TEMPORARY_UPLOAD_CLEANUP]', 'event=temporary_upload_cleanup_disabled');
    return;
  }

  if (schedulerHandle) return;

  const { batchSize, intervalMs } = env.temporaryUploadCleanupScheduler;

  logger.log(
    '[TEMPORARY_UPLOAD_CLEANUP]',
    'event=temporary_upload_cleanup_scheduler_started',
    `intervalMs=${intervalMs}`,
    `batchSize=${batchSize}`
  );

  startupHandle = setTimeout(() => {
    runOnce({ triggerSource: 'startup' });
  }, 5000).unref();

  schedulerHandle = setInterval(() => {
    runOnce({ triggerSource: 'scheduled' });
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
  logger.log('[TEMPORARY_UPLOAD_CLEANUP]', 'event=temporary_upload_cleanup_scheduler_stopped');
};

module.exports = {
  runOnce,
  start,
  stop,
};
