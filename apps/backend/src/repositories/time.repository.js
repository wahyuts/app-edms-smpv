const { pool } = require('../config/database');

const getMysqlUtcNow = async () => {
  const [rows] = await pool.execute(
    'SELECT UTC_TIMESTAMP(3) AS server_now'
  );

  return rows[0]?.server_now || null;
};

module.exports = {
  getMysqlUtcNow,
};
