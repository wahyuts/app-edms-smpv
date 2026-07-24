const crypto = require('node:crypto');
const { getExpiresAt } = require('./token');

const generateResetToken = () => {
  return crypto.randomBytes(32).toString('hex');
};

const hashResetToken = (token) => {
  return crypto.createHash('sha256').update(token).digest('hex');
};

const generateResetRequestId = () => {
  return crypto.randomUUID();
};

const getResetTokenExpiresAt = (duration) => {
  return getExpiresAt(duration);
};

module.exports = {
  generateResetToken,
  hashResetToken,
  generateResetRequestId,
  getResetTokenExpiresAt,
};
