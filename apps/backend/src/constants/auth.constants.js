const AUTH_TOKEN_TYPES = {
  ACCESS: 'access',
  REFRESH: 'refresh',
};

const AUTH_COOKIE_NAMES = {
  ACCESS_TOKEN: 'edms_access_token',
  REFRESH_TOKEN: 'edms_refresh_token',
};

const AUTH_COOKIE_PATH = '/';

const AUTH_MESSAGES = {
  INVALID_CREDENTIALS: 'Invalid credentials',
  UNAUTHENTICATED: 'Unauthenticated',
  INVALID_REFRESH_TOKEN: 'Invalid refresh token',
  LOGIN_SUCCESSFUL: 'Login successful',
  LOGOUT_SUCCESSFUL: 'Logout successful',
  REFRESH_SUCCESSFUL: 'Token refreshed',
  CURRENT_USER_SUCCESSFUL: 'Current user retrieved',
};

module.exports = {
  AUTH_TOKEN_TYPES,
  AUTH_COOKIE_NAMES,
  AUTH_COOKIE_PATH,
  AUTH_MESSAGES,
};
