const env = require('../config/env');
const jwtConfig = require('../config/jwt');
const {
  AUTH_COOKIE_NAMES,
  AUTH_COOKIE_PATH,
} = require('../constants/auth.constants');
const { parseDurationToMs } = require('./token');

const getAuthCookieOptions = (maxAge) => {
  const options = {
    httpOnly: true,
    secure: env.cookie.secure,
    sameSite: env.cookie.sameSite,
    path: AUTH_COOKIE_PATH,
  };

  if (maxAge !== undefined) {
    options.maxAge = maxAge;
  }

  return options;
};

const setAuthCookies = (res, { accessToken, refreshToken }) => {
  if (accessToken) {
    res.cookie(
      AUTH_COOKIE_NAMES.ACCESS_TOKEN,
      accessToken,
      getAuthCookieOptions(parseDurationToMs(jwtConfig.accessTokenExpiresIn))
    );
  }

  if (refreshToken) {
    res.cookie(
      AUTH_COOKIE_NAMES.REFRESH_TOKEN,
      refreshToken,
      getAuthCookieOptions(parseDurationToMs(jwtConfig.refreshTokenExpiresIn))
    );
  }
};

const clearAuthCookies = (res) => {
  const options = getAuthCookieOptions();

  res.clearCookie(AUTH_COOKIE_NAMES.ACCESS_TOKEN, options);
  res.clearCookie(AUTH_COOKIE_NAMES.REFRESH_TOKEN, options);
};

module.exports = {
  clearAuthCookies,
  getAuthCookieOptions,
  setAuthCookies,
};
