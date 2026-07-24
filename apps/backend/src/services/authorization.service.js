const { ROLES } = require('../constants/role.constants');
const authorizationRepository = require('../repositories/authorization.repository');
const {
  hasAnyRole,
  hasAnyPermission,
  hasAllPermissions,
} = require('../utils/authorization');

const officialRoleNames = Object.values(ROLES);

const createAuthorizationError = (message = 'Access forbidden', statusCode = 403) => {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
};

const normalizeRole = (role) => {
  if (!role || !role.isActive || !officialRoleNames.includes(role.roleName)) {
    throw createAuthorizationError();
  }

  return {
    id: role.id,
    code: role.roleCode,
    name: role.roleName,
  };
};

const buildAuthorizationContext = async (user) => {
  const role = normalizeRole(user.role);
  const permissions = await authorizationRepository.findPermissionsByRoleId(role.id);

  return {
    ...user,
    role,
    permissions,
  };
};

const canAccessRole = (user, allowedRoles) => {
  return hasAnyRole(user, allowedRoles);
};

const canAccessAnyPermission = (user, permissionCodes) => {
  return hasAnyPermission(user, permissionCodes);
};

const canAccessAllPermissions = (user, permissionCodes) => {
  return hasAllPermissions(user, permissionCodes);
};

module.exports = {
  createAuthorizationError,
  buildAuthorizationContext,
  canAccessRole,
  canAccessAnyPermission,
  canAccessAllPermissions,
};
