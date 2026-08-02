const logger = require('./config/logger');

let app;
let env;
let server;
let closeDatabasePool;
let slaNotificationScheduler;
let isShuttingDown = false;

const getSafeErrorSummary = (error) => {
  if (error instanceof Error) {
    return `${error.name}: ${error.message}`;
  }

  return typeof error === 'string' ? error : 'Unknown process error';
};

const shutdown = async (signalOrReason, exitCode = 0) => {
  if (isShuttingDown) {
    return;
  }

  isShuttingDown = true;
  logger.log(`[SHUTDOWN] ${signalOrReason} received`);

  const forceExitTimeout = setTimeout(() => {
    logger.error('[SHUTDOWN] Forced shutdown after timeout');
    process.exit(1);
  }, 10000);
  forceExitTimeout.unref();

  try {
    if (server) {
      await new Promise((resolve, reject) => {
        server.close((error) => {
          if (error) {
            if (error.code === 'ERR_SERVER_NOT_RUNNING') {
              logger.log('[SHUTDOWN] HTTP server closed');
              resolve();
              return;
            }

            reject(error);
            return;
          }

          logger.log('[SHUTDOWN] HTTP server closed');
          resolve();
        });
      });
    }

    if (slaNotificationScheduler) {
      slaNotificationScheduler.stop();
    }

    if (closeDatabasePool) {
      await closeDatabasePool();
    }

    logger.log('[SHUTDOWN] Backend stopped');
    clearTimeout(forceExitTimeout);
    process.exit(exitCode);
  } catch (error) {
    logger.error('[SHUTDOWN] Backend shutdown failed');
    logger.error(getSafeErrorSummary(error));
    clearTimeout(forceExitTimeout);
    process.exit(1);
  }
};

const startServer = async () => {
  try {
    env = require('./config/env');
    const database = require('./config/database');
    const storage = require('./services/storage.service');
    slaNotificationScheduler = require('./services/slaNotificationScheduler.service');
    app = require('./app');
    closeDatabasePool = database.closeDatabasePool;

    const { testDatabaseConnection } = database;
    const { initializeStorage, testStorageAccess } = storage;

    await testDatabaseConnection();
    await initializeStorage();
    await testStorageAccess();

    server = app.listen(env.port, () => {
      logger.log(`${env.appName} ${env.appVersion} running on port ${env.port}`);
    });
    slaNotificationScheduler.start();
  } catch (error) {
    logger.error('[BOOT] Backend startup failed');
    logger.error(error.message);

    if (closeDatabasePool) {
      try {
        await closeDatabasePool();
      } catch (shutdownError) {
        logger.error('[DATABASE] Unable to close MySQL pool after startup failure');
      }
    }

    process.exit(1);
  }
};

process.once('SIGINT', () => {
  shutdown('SIGINT');
});

process.once('SIGTERM', () => {
  shutdown('SIGTERM');
});

process.once('uncaughtException', (error) => {
  logger.error('[PROCESS] Uncaught exception');
  logger.error(getSafeErrorSummary(error));
  shutdown('uncaughtException', 1);
});

process.once('unhandledRejection', (reason) => {
  logger.error('[PROCESS] Unhandled rejection');
  logger.error(getSafeErrorSummary(reason));
  shutdown('unhandledRejection', 1);
});

if (require.main === module) {
  startServer();
}

module.exports = {
  startServer,
  shutdown,
};
