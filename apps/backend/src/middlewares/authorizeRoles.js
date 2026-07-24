const authorizationService = require('../services/authorization.service');
const { errorResponse } = require('../utils/response');

const authorizeRoles = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return errorResponse(res, {
        statusCode: 401,
        message: 'Unauthenticated',
      });
    }

    if (!authorizationService.canAccessRole(req.user, allowedRoles)) {
      return errorResponse(res, {
        statusCode: 403,
        message: 'Access forbidden',
      });
    }

    next();
  };
};

module.exports = authorizeRoles;
