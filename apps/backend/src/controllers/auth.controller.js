const env = require('../config/env');
const authService = require('../services/auth.service');
const {
  validateLoginRequest,
  validateChangePasswordRequest,
} = require('../validators/auth.validator');
const { successResponse, errorResponse } = require('../utils/response');
const { parseDurationToMs } = require('../utils/token');
const {
  AUTH_COOKIE_NAMES,
  AUTH_COOKIE_PATH,
  AUTH_MESSAGES,
} = require('../constants/auth.constants');
const jwtConfig = require('../config/jwt');

const getCookieOptions = (maxAge) => ({
  httpOnly: true,
  sameSite: 'lax',
  secure: env.appEnv === 'production',
  path: AUTH_COOKIE_PATH,
  maxAge,
});

const setAuthCookies = (res, { accessToken, refreshToken }) => {
  if (accessToken) {
    res.cookie(
      AUTH_COOKIE_NAMES.ACCESS_TOKEN,
      accessToken,
      getCookieOptions(parseDurationToMs(jwtConfig.accessTokenExpiresIn))
    );
  }

  if (refreshToken) {
    res.cookie(
      AUTH_COOKIE_NAMES.REFRESH_TOKEN,
      refreshToken,
      getCookieOptions(parseDurationToMs(jwtConfig.refreshTokenExpiresIn))
    );
  }
};

const clearAuthCookies = (res) => {
  const options = getCookieOptions(0);

  res.clearCookie(AUTH_COOKIE_NAMES.ACCESS_TOKEN, options);
  res.clearCookie(AUTH_COOKIE_NAMES.REFRESH_TOKEN, options);
};

const login = async (req, res, next) => {
  try {
    const validation = validateLoginRequest(req.body);

    if (!validation.isValid) {
      return errorResponse(res, {
        statusCode: 422,
        message: 'Validation Error',
        errors: validation.errors,
      });
    }

    const result = await authService.login({
      username: validation.value.username,
      password: validation.value.password,
      deviceName: req.get('user-agent') || null,
      ipAddress: req.ip || null,
    });

    setAuthCookies(res, result);

    return successResponse(res, {
      message: AUTH_MESSAGES.LOGIN_SUCCESSFUL,
      data: {
        user: result.user,
        role: result.role,
        permissions: result.permissions,
      },
    });
  } catch (error) {
    next(error);
  }
};

const logout = async (req, res, next) => {
  try {
    await authService.logout({
      refreshToken: req.cookies[AUTH_COOKIE_NAMES.REFRESH_TOKEN],
    });

    clearAuthCookies(res);

    return successResponse(res, {
      message: AUTH_MESSAGES.LOGOUT_SUCCESSFUL,
      data: {},
    });
  } catch (error) {
    next(error);
  }
};

const refresh = async (req, res, next) => {
  try {
    const refreshToken = req.cookies[AUTH_COOKIE_NAMES.REFRESH_TOKEN];

    if (!refreshToken) {
      return errorResponse(res, {
        statusCode: 401,
        message: AUTH_MESSAGES.INVALID_REFRESH_TOKEN,
      });
    }

    const result = await authService.refresh({
      refreshToken,
      ipAddress: req.ip || null,
    });

    setAuthCookies(res, {
      accessToken: result.accessToken,
    });

    return successResponse(res, {
      message: AUTH_MESSAGES.REFRESH_SUCCESSFUL,
      data: {
        user: result.user,
        role: result.role,
        permissions: result.permissions,
      },
    });
  } catch (error) {
    next(error);
  }
};

const me = async (req, res, next) => {
  try {
    return successResponse(res, {
      message: AUTH_MESSAGES.CURRENT_USER_SUCCESSFUL,
      data: {
        user: req.user,
        role: req.role,
        permissions: req.permissions,
      },
    });
  } catch (error) {
    next(error);
  }
};

const changePassword = async (req, res, next) => {
  try {
    const validation = validateChangePasswordRequest(req.body);

    if (!validation.isValid) {
      return errorResponse(res, {
        statusCode: 400,
        message: validation.errors[0]?.message || 'Validation Error',
        errors: validation.errors,
      });
    }

    await authService.changePassword({
      userId: req.user.id,
      currentPassword: validation.value.currentPassword,
      newPassword: validation.value.newPassword,
    });

    clearAuthCookies(res);

    return successResponse(res, {
      message: 'Password changed successfully. Please log in again.',
      data: null,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  login,
  logout,
  refresh,
  me,
  changePassword,
};
