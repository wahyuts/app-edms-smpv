const AUTH_TOKEN_TYPES = {
  ACCESS: 'access',
  REFRESH: 'refresh',
};

const AUTH_COOKIE_NAMES = {
  ACCESS_TOKEN: 'edms_access_token',
  REFRESH_TOKEN: 'edms_refresh_token',
};

const AUTH_COOKIE_PATH = '/';

const AUTH_ERROR_CODES = {
  INVALID_SESSION: 'INVALID_SESSION',
  SESSION_REPLACED: 'SESSION_REPLACED',
};

const AUTH_MESSAGES = {
  INVALID_CREDENTIALS: 'Invalid credentials',
  UNAUTHENTICATED: 'Unauthenticated',
  INVALID_REFRESH_TOKEN: 'Invalid refresh token',
  INVALID_SESSION: 'Invalid session',
  LOGIN_SUCCESSFUL: 'Login successful',
  LOGOUT_SUCCESSFUL: 'Logout successful',
  REFRESH_SUCCESSFUL: 'Token refreshed',
  SESSION_REPLACED: 'Sesi telah digantikan oleh login baru.',
  CURRENT_USER_SUCCESSFUL: 'Current user retrieved',
};

const AUTH_SESSION_REVOCATION_REASONS = {
  FORCE_LOGOUT: 'Force Logout',
  LOGOUT: 'Logout',
  PASSWORD_CHANGE: 'Password Change',
  PASSWORD_RESET: 'Password Reset',
};

module.exports = {
  AUTH_ERROR_CODES,
  AUTH_TOKEN_TYPES,
  AUTH_COOKIE_NAMES,
  AUTH_COOKIE_PATH,
  AUTH_MESSAGES,
  AUTH_SESSION_REVOCATION_REASONS,
};
