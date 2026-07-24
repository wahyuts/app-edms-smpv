const authorizationService = require('../services/authorization.service');
const { errorResponse } = require('../utils/response');

const authorizeAnyPermission = (...permissionCodes) => {
  return (req, res, next) => {
    if (!req.user) {
      return errorResponse(res, {
        statusCode: 401,
        message: 'Unauthenticated',
      });
    }

    if (!authorizationService.canAccessAnyPermission(req.user, permissionCodes)) {
      return errorResponse(res, {
        statusCode: 403,
        message: 'Access forbidden',
      });
    }

    next();
  };
};

const authorizeAllPermissions = (...permissionCodes) => {
  return (req, res, next) => {
    if (!req.user) {
      return errorResponse(res, {
        statusCode: 401,
        message: 'Unauthenticated',
      });
    }

    if (!authorizationService.canAccessAllPermissions(req.user, permissionCodes)) {
      return errorResponse(res, {
        statusCode: 403,
        message: 'Access forbidden',
      });
    }

    next();
  };
};

module.exports = {
  authorizeAnyPermission,
  authorizeAllPermissions,
};
