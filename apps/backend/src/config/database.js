const mysql = require('mysql2/promise');
const env = require('./env');
const logger = require('./logger');

const pool = mysql.createPool({
  host: env.database.host,
  port: env.database.port,
  database: env.database.database,
  user: env.database.user,
  password: env.database.password,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

const testDatabaseConnection = async () => {
  let connection;

  try {
    connection = await pool.getConnection();
    await connection.query('SELECT 1 AS connected');
    logger.log('[DATABASE] MySQL connection established');

    return true;
  } catch (error) {
    logger.error('[DATABASE] Unable to connect to MySQL');
    logger.error(`[DATABASE] ${error.code || error.name || 'ConnectionError'}`);
    throw new Error('Database connection failed');
  } finally {
    if (connection) {
      connection.release();
    }
  }
};

const checkDatabaseHealth = async () => {
  let connection;

  try {
    connection = await pool.getConnection();
    await connection.query('SELECT 1 AS connected');

    return {
      service: 'database',
      status: 'up',
    };
  } catch (error) {
    logger.error('[DATABASE] Health check failed');
    logger.error(`[DATABASE] ${error.code || error.name || 'HealthCheckError'}`);

    return {
      service: 'database',
      status: 'down',
    };
  } finally {
    if (connection) {
      connection.release();
    }
  }
};

const closeDatabasePool = async () => {
  await pool.end();
  logger.log('[DATABASE] MySQL pool closed');
};

module.exports = {
  pool,
  testDatabaseConnection,
  checkDatabaseHealth,
  closeDatabasePool,
};
