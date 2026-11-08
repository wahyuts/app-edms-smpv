const logger = require('./config/logger');

let app;
let env;
let server;
let closeDatabasePool;
let realtimeConnectionRegistry;
let slaNotificationScheduler;
let temporaryUploadCleanupScheduler;
let isShuttingDown = false;

const log = (method, ...args) => {
  try { logger[method](...args); } catch { /* Diagnostics must not interrupt shutdown. */ }
};
const getSafeErrorSummary = (error) => {
  return `errorCode=${error?.code || 'UNKNOWN'}`;
};

const shutdown = async (signalOrReason, exitCode = 0) => {
  if (isShuttingDown) {
    return;
  }

  isShuttingDown = true;
  log('log', `[SHUTDOWN] ${signalOrReason} received`);

  const forceExitTimeout = setTimeout(() => {
    log('error', '[SHUTDOWN] Forced shutdown after timeout');
    process.exit(1);
  }, 10000);
  forceExitTimeout.unref();

  try {
    // stop() closes SLA admission synchronously; drain runs alongside HTTP shutdown.
    const drainPromise = slaNotificationScheduler
      ? slaNotificationScheduler.stop({ terminal: true })
      : Promise.resolve({ drained: true, timedOut: false });
    let closeServerPromise = Promise.resolve({ closed: true });
    if (server) {
      closeServerPromise = new Promise((resolve, reject) => {
        server.close((error) => {
          if (error) {
            if (error.code === 'ERR_SERVER_NOT_RUNNING') {
              log('log', '[SHUTDOWN] HTTP server closed');
              resolve();
              return;
            }

            reject(error);
            return;
          }

          log('log', '[SHUTDOWN] HTTP server closed');
          resolve();
        });
      }).then(() => ({ closed: true }), error => ({ closed: false, error }));

      if (realtimeConnectionRegistry) {
        try { realtimeConnectionRegistry.closeAll({ reason: 'shutdown' }); } catch (error) {
          closeServerPromise = Promise.resolve({ closed: false, error });
        }
      }
    }

    let drain;
    try { drain = await drainPromise; } catch (error) {
      log('error', '[SHUTDOWN] SLA drain unverified; pool remains open', getSafeErrorSummary(error));
      return; // Keep the existing forced-exit deadline; do not assume transaction settlement.
    }
    if (!drain?.drained) {
      log('error', '[SHUTDOWN] Incomplete shutdown: SLA scan not drained; pool remains open');
      return;
    }
    const http = await closeServerPromise;
    if (!http.closed) throw http.error;
    if (temporaryUploadCleanupScheduler) {
      temporaryUploadCleanupScheduler.stop();
    }

    if (closeDatabasePool) {
      await closeDatabasePool();
    }

    log('log', '[SHUTDOWN] Backend stopped');
    clearTimeout(forceExitTimeout);
    process.exit(exitCode);
  } catch (error) {
    log('error', '[SHUTDOWN] Backend shutdown failed');
    log('error', getSafeErrorSummary(error));
    clearTimeout(forceExitTimeout);
    process.exit(1);
  }
};

const startServer = async () => {
  if (isShuttingDown) return;
  try {
    env = require('./config/env');
    const database = require('./config/database');
    const storage = require('./services/storage.service');
    realtimeConnectionRegistry = require('./services/realtimeConnectionRegistry.service');
    slaNotificationScheduler = require('./services/slaNotificationScheduler.service');
    temporaryUploadCleanupScheduler = require('./services/temporaryUploadCleanupScheduler.service');
    app = require('./app');
    closeDatabasePool = database.closeDatabasePool;

    const { testDatabaseConnection } = database;
    const { initializeStorage, testStorageAccess } = storage;

    await testDatabaseConnection();
    if (isShuttingDown) return;
    await initializeStorage();
    if (isShuttingDown) return;
    await testStorageAccess();
    if (isShuttingDown) return;

    server = app.listen(env.port, () => {
      log('log', `${env.appName} ${env.appVersion} running on port ${env.port}`);
    });
    slaNotificationScheduler.start();
    temporaryUploadCleanupScheduler.start();
  } catch (error) {
    log('error', '[BOOT] Backend startup failed', getSafeErrorSummary(error));
    await shutdown('startup_failure', 1);
  }
};

const requestShutdown = (reason, exitCode = 0) => {
  void shutdown(reason, exitCode).catch(error => {
    log('error', '[SHUTDOWN] Unexpected shutdown rejection', getSafeErrorSummary(error));
    process.exit(1);
  });
};

process.once('SIGINT', () => {
  requestShutdown('SIGINT');
});

process.once('SIGTERM', () => {
  requestShutdown('SIGTERM');
});

process.once('uncaughtException', (error) => {
  log('error', '[PROCESS] Uncaught exception', getSafeErrorSummary(error));
  requestShutdown('uncaughtException', 1);
});

process.once('unhandledRejection', (reason) => {
  log('error', '[PROCESS] Unhandled rejection', getSafeErrorSummary(reason));
  requestShutdown('unhandledRejection', 1);
});

if (require.main === module) {
  startServer();
}

module.exports = {
  startServer,
  shutdown,
};
