const mysql = require('mysql2/promise');
const env = require('./env');

// IO evidence must remain writable while a business transaction owns a pool connection.
// This pool never locks business rows and does not change the application's SQL mode.
const pool = mysql.createPool({
  host: env.database.host,
  port: env.database.port,
  database: env.database.database,
  user: env.database.user,
  password: env.database.password,
  timezone: 'Z',
  waitForConnections: true,
  connectionLimit: 2,
  queueLimit: 0,
});

module.exports = { pool };
