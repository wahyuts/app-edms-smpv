const crypto = require('node:crypto');
const jwt = require('jsonwebtoken');
const jwtConfig = require('../config/jwt');
const { AUTH_TOKEN_TYPES } = require('../constants/auth.constants');

const parseDurationToMs = (duration) => {
  const match = /^(\d+)([smhd])$/.exec(duration);

  if (!match) {
    throw new Error('[AUTH] Invalid token duration format');
  }

  const value = Number(match[1]);
  const unit = match[2];
  const multipliers = {
    s: 1000,
    m: 60 * 1000,
    h: 60 * 60 * 1000,
    d: 24 * 60 * 60 * 1000,
  };

  return value * multipliers[unit];
};

const getExpiresAt = (duration) => {
  return new Date(Date.now() + parseDurationToMs(duration));
};

const signToken = ({ userId, tokenType, sessionId, expiresIn }) => {
  return jwt.sign(
    {
      sub: String(userId),
      tokenType,
      sessionId,
      jti: crypto.randomUUID(),
    },
    jwtConfig.secret,
    {
      algorithm: jwtConfig.algorithm,
      expiresIn,
    }
  );
};

const generateAccessToken = (userId, sessionId) => {
  return signToken({
    userId,
    sessionId,
    tokenType: AUTH_TOKEN_TYPES.ACCESS,
    expiresIn: jwtConfig.accessTokenExpiresIn,
  });
};

const generateRefreshToken = ({ userId, sessionId }) => {
  return signToken({
    userId,
    sessionId,
    tokenType: AUTH_TOKEN_TYPES.REFRESH,
    expiresIn: jwtConfig.refreshTokenExpiresIn,
  });
};

const verifyToken = (token, expectedTokenType) => {
  const payload = jwt.verify(token, jwtConfig.secret, {
    algorithms: [jwtConfig.algorithm],
  });

  if (payload.tokenType !== expectedTokenType) {
    throw new Error('[AUTH] Invalid token type');
  }

  return payload;
};

const hashToken = (token) => {
  return crypto.createHash('sha256').update(token).digest('hex');
};

module.exports = {
  parseDurationToMs,
  getExpiresAt,
  generateAccessToken,
  generateRefreshToken,
  verifyToken,
  hashToken,
};
