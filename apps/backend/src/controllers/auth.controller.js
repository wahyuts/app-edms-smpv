const authService = require('../services/auth.service');
const {
  validateLoginRequest,
  validateChangePasswordRequest,
} = require('../validators/auth.validator');
const { successResponse, errorResponse } = require('../utils/response');
const {
  AUTH_COOKIE_NAMES,
  AUTH_MESSAGES,
} = require('../constants/auth.constants');
const { clearAuthCookies, setAuthCookies } = require('../utils/authCookie');

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
        accessibleProjects: result.accessibleProjects,
        activeMembership: result.activeMembership,
        activeProject: result.activeProject,
        officialRole: result.officialRole,
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
        accessibleProjects: result.accessibleProjects,
        activeMembership: result.activeMembership,
        activeProject: result.activeProject,
        officialRole: result.officialRole,
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
        accessibleProjects: req.accessibleProjects,
        activeMembership: req.activeMembership,
        activeProject: req.activeProject,
        officialRole: req.officialRole,
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
