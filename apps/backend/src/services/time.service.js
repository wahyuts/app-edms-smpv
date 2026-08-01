const timeRepository = require('../repositories/time.repository');

const toIsoString = (value) => {
  const date = value instanceof Date ? value : new Date(value);

  return Number.isNaN(date.getTime()) ? null : date.toISOString();
};

const getServerTime = async () => {
  const serverNow = toIsoString(await timeRepository.getMysqlUtcNow());

  return {
    precision: 'millisecond',
    serverNow,
    source: 'mysql-utc',
  };
};

module.exports = {
  getServerTime,
};
