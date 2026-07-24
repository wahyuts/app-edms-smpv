const env = require('./env');

const jwtConfig = {
  secret: env.jwt.secret,
  accessTokenExpiresIn: env.jwt.expiresIn,
  refreshTokenExpiresIn: env.jwt.refreshTokenExpiresIn,
  algorithm: 'HS256',
};

module.exports = jwtConfig;
