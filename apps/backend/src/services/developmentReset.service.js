const crypto = require('node:crypto');
const fs = require('node:fs/promises');
const path = require('node:path');
const env = require('../config/env');
const logger = require('../config/logger');
const { pool } = require('../config/database');
const storageService = require('./storage.service');
const { createHttpError } = require('../utils/administration');

const CONFIRMATION_TEXT = 'RESET ALL DEMO DATA';
const RUNTIME_SEED_PATH = path.resolve(__dirname, '..', 'database', 'seed', 'seed-base.runtime.sql');
const RUNTIME_SEED_CHECKSUM_PATH = `${RUNTIME_SEED_PATH}.sha256`;

let resetInProgress = false;

const createResetHttpError = (message, statusCode = 422) => createHttpError(message, statusCode, [
  { field: 'developmentReset', message },
]);

const normalizeTextForHash = (content) =>
  Buffer.from(content)
    .toString('utf8')
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n');

const sha256 = (content) => crypto
  .createHash('sha256')
  .update(normalizeTextForHash(content), 'utf8')
  .digest('hex');

const readRuntimeSeed = async () => {
  const content = await fs.readFile(RUNTIME_SEED_PATH, 'utf8');
  const expectedChecksum = (await fs.readFile(RUNTIME_SEED_CHECKSUM_PATH, 'utf8')).trim();
  const actualChecksum = sha256(content);

  if (actualChecksum !== expectedChecksum) {
    throw createResetHttpError('Runtime seed tidak sinkron dengan checksum canonical.', 500);
  }

  return { checksum: actualChecksum, content };
};

const removeSqlComments = (sql) => sql
  .split(/\r?\n/)
  .filter((line) => {
    const trimmedLine = line.trim();
    return trimmedLine && !trimmedLine.startsWith('--') && !trimmedLine.startsWith('#');
  })
  .join('\n');

const splitSqlStatements = (sql) => {
  const statements = [];
  let current = '';
  let quote = null;
  let escaped = false;

  for (const character of removeSqlComments(sql)) {
    current += character;

    if (quote) {
      if (escaped) {
        escaped = false;
      } else if (character === '\\') {
        escaped = true;
      } else if (character === quote) {
        quote = null;
      }
      continue;
    }

    if (character === '\'' || character === '"' || character === '`') {
      quote = character;
      continue;
    }

    if (character === ';') {
      const statement = current.slice(0, -1).trim();
      if (statement) statements.push(statement);
      current = '';
    }
  }

  const lastStatement = current.trim();
  if (lastStatement) statements.push(lastStatement);

  return statements.filter((statement) => {
    const normalizedStatement = statement.trim().toLowerCase();
    return normalizedStatement !== 'start transaction' &&
      normalizedStatement !== 'begin' &&
      normalizedStatement !== 'commit';
  });
};

const assertDevelopmentResetAllowed = ({ actorRole, actorUser, confirmationText }) => {
  if (env.appEnv !== 'development') {
    throw createResetHttpError('Development Reset hanya boleh dijalankan pada APP_ENV development.', 403);
  }
  if (env.developmentReset.enabled !== true) {
    throw createResetHttpError('Development Reset dinonaktifkan oleh konfigurasi backend.', 403);
  }
  if (!actorUser?.id) {
    throw createResetHttpError('User session tidak tersedia.', 401);
  }
  if (actorRole?.name !== 'Admin') {
    throw createResetHttpError('Hanya Admin yang dapat menjalankan Development Reset.', 403);
  }
  if (confirmationText !== CONFIRMATION_TEXT) {
    throw createResetHttpError('Confirmation text tidak sesuai.', 422);
  }
};

const listBaseTables = async (connection) => {
  const [rows] = await connection.query(
    `
      SELECT table_name AS tableName
      FROM information_schema.tables
      WHERE table_schema = DATABASE()
        AND table_type = 'BASE TABLE'
      ORDER BY table_name ASC
    `
  );

  return rows.map((row) => row.tableName);
};

const quoteIdentifier = (identifier) => `\`${String(identifier).replace(/`/g, '``')}\``;

const snapshotTableSet = async (connection) => {
  const tables = await listBaseTables(connection);

  return tables.sort();
};

const deleteAllTableData = async (connection, tables) => {
  const deletedByTable = {};

  await connection.query('SET FOREIGN_KEY_CHECKS = 0');

  for (const table of tables) {
    const [result] = await connection.query(`DELETE FROM ${quoteIdentifier(table)}`);
    deletedByTable[table] = Number(result.affectedRows || 0);
  }

  await connection.query('SET FOREIGN_KEY_CHECKS = 1');

  return deletedByTable;
};

const assertTablesAccessible = async (connection, tables) => {
  for (const table of tables) {
    try {
      await connection.query(`SELECT 1 FROM ${quoteIdentifier(table)} LIMIT 1`);
    } catch (error) {
      throw createResetHttpError(`Development Reset gagal: table ${table} tidak dapat diakses.`, 500);
    }
  }
};

const executeSeed = async (connection, seedSql) => {
  const statements = splitSqlStatements(seedSql);

  for (const statement of statements) {
    await connection.query(statement);
  }

  return statements.length;
};

const verifyBaseline = async (connection) => {
  const [[adminUser]] = await connection.query(
    `
      SELECT users.id, users.username, roles.role_name AS roleName, users.status
      FROM users
      INNER JOIN roles ON roles.id = users.role_id
      WHERE users.username = 'deny'
      LIMIT 1
    `
  );
  const [[referenceCounts]] = await connection.query(
    `
      SELECT
        (SELECT COUNT(*) FROM departments) AS departmentCount,
        (SELECT COUNT(*) FROM roles) AS roleCount,
        (SELECT COUNT(*) FROM permissions) AS permissionCount,
        (SELECT COUNT(*) FROM role_permissions) AS rolePermissionCount,
        (SELECT COUNT(*) FROM document_types) AS documentTypeCount,
        (SELECT COUNT(*) FROM system_metadata) AS systemMetadataCount
    `
  );

  if (
    !adminUser ||
    adminUser.roleName !== 'Admin' ||
    adminUser.status !== 'Active'
  ) {
    throw createResetHttpError('Baseline verification gagal: bootstrap Admin tidak valid.', 500);
  }

  const requiredCounts = [
    'departmentCount',
    'roleCount',
    'permissionCount',
    'rolePermissionCount',
    'documentTypeCount',
    'systemMetadataCount',
  ];

  if (requiredCounts.some((key) => Number(referenceCounts[key] || 0) === 0)) {
    throw createResetHttpError('Baseline verification gagal: master/reference data tidak lengkap.', 500);
  }

  return {
    adminUsername: adminUser.username,
    ...Object.fromEntries(
      Object.entries(referenceCounts).map(([key, value]) => [key, Number(value || 0)])
    ),
  };
};

const resetDatabaseToBaseline = async ({ seedSql }) => {
  const connection = await pool.getConnection();
  const result = {
    deletedByTable: {},
    schemaPreserved: false,
    seedStatementCount: 0,
    tableCount: 0,
    tableSetAfter: [],
    tableSetBefore: [],
    verification: null,
  };

  try {
    result.tableSetBefore = await snapshotTableSet(connection);
    result.tableCount = result.tableSetBefore.length;
    await assertTablesAccessible(connection, result.tableSetBefore);

    await connection.beginTransaction();

    try {
      result.deletedByTable = await deleteAllTableData(connection, result.tableSetBefore);
      result.seedStatementCount = await executeSeed(connection, seedSql);
      result.verification = await verifyBaseline(connection);

      await connection.commit();
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      await connection.query('SET FOREIGN_KEY_CHECKS = 1').catch(() => {});
    }

    result.tableSetAfter = await snapshotTableSet(connection);
    result.schemaPreserved = JSON.stringify(result.tableSetBefore) === JSON.stringify(result.tableSetAfter);

    if (!result.schemaPreserved) {
      throw createResetHttpError('Schema preservation validation gagal.', 500);
    }

    return result;
  } finally {
    connection.release();
  }
};

const cleanupDevelopmentStorage = async () => {
  if (typeof storageService.cleanupDevelopmentStorage !== 'function') {
    return {
      driver: storageService.getActiveStorageDriver().driver,
      supported: false,
    };
  }

  return storageService.cleanupDevelopmentStorage();
};

const resetDevelopmentEnvironment = async ({ actorRole, actorUser, confirmationText }) => {
  assertDevelopmentResetAllowed({ actorRole, actorUser, confirmationText });

  if (resetInProgress) {
    throw createResetHttpError('Development Reset sedang berjalan.', 409);
  }

  resetInProgress = true;
  logger.log('[DEVELOPMENT_RESET]', 'event=development_reset_started');

  try {
    const runtimeSeed = await readRuntimeSeed();
    logger.log('[DEVELOPMENT_RESET]', 'event=development_reset_seed_verified');

    const database = await resetDatabaseToBaseline({ seedSql: runtimeSeed.content });
    logger.log('[DEVELOPMENT_RESET]', 'event=development_reset_database_completed');

    const storage = await cleanupDevelopmentStorage();
    logger.log('[DEVELOPMENT_RESET]', 'event=development_reset_storage_completed');

    logger.log('[DEVELOPMENT_RESET]', 'event=development_reset_completed');

    return {
      database: {
        schemaPreserved: database.schemaPreserved,
        seedStatementCount: database.seedStatementCount,
        tableCount: database.tableCount,
        verification: database.verification,
      },
      seed: {
        checksum: runtimeSeed.checksum,
        path: 'src/database/seed/seed-base.runtime.sql',
        source: 'database/seed/seed-base.sql',
      },
      storage,
    };
  } catch (error) {
    logger.error('[DEVELOPMENT_RESET]', 'event=development_reset_failed', `error=${error.message}`);
    throw error;
  } finally {
    resetInProgress = false;
    logger.log('[DEVELOPMENT_RESET]', 'event=development_reset_lock_released');
  }
};

module.exports = {
  CONFIRMATION_TEXT,
  resetDevelopmentEnvironment,
  splitSqlStatements,
};
