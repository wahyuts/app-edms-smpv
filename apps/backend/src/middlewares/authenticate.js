const { AUTH_COOKIE_NAMES, AUTH_MESSAGES, AUTH_TOKEN_TYPES } = require('../constants/auth.constants');
const authService = require('../services/auth.service');
const { errorResponse } = require('../utils/response');
const { verifyToken } = require('../utils/token');

const authenticate = async (req, res, next) => {
  try {
    const accessToken = req.cookies[AUTH_COOKIE_NAMES.ACCESS_TOKEN];

    if (!accessToken) {
      return errorResponse(res, {
        statusCode: 401,
        message: AUTH_MESSAGES.UNAUTHENTICATED,
      });
    }

    let payload;

    try {
      payload = verifyToken(accessToken, AUTH_TOKEN_TYPES.ACCESS);
    } catch (error) {
      return errorResponse(res, {
        statusCode: 401,
        message: AUTH_MESSAGES.UNAUTHENTICATED,
      });
    }

    const currentUser = await authService.getAuthenticatedUser(payload.sub, payload.iat, payload.sessionId);
    req.user = currentUser.user;
    req.role = currentUser.role;
    req.permissions = currentUser.permissions;
    req.accessibleProjects = currentUser.accessibleProjects;
    req.activeMembership = currentUser.activeMembership;
    req.activeProject = currentUser.activeProject;
    req.officialRole = currentUser.officialRole;
    req.sessionId = payload.sessionId;

    next();
  } catch (error) {
    next(error);
  }
};

module.exports = authenticate;
