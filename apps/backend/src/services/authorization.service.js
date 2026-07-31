const { ROLES } = require('../constants/role.constants');
const authorizationRepository = require('../repositories/authorization.repository');
const {
  hasAnyRole,
  hasAnyPermission,
  hasAllPermissions,
} = require('../utils/authorization');

const officialRoleNames = Object.values(ROLES);
const globalPermissionCodes = new Set([
  'password.change',
  'profile.view',
  'user-management.view',
]);

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

const mergePermissions = (...permissionGroups) => {
  const permissionByCode = new Map();

  permissionGroups.flat().forEach((permission) => {
    const code = permission.code || permission.permissionCode;
    if (code && !permissionByCode.has(code)) {
      permissionByCode.set(code, permission);
    }
  });

  return [...permissionByCode.values()].sort((left, right) => {
    const leftCode = left.code || left.permissionCode || '';
    const rightCode = right.code || right.permissionCode || '';
    return leftCode.localeCompare(rightCode);
  });
};

const buildProjectAuthorizationContext = async (user, activeOfficialRole) => {
  const role = normalizeRole(user.role);
  const systemPermissions = await authorizationRepository.findPermissionsByRoleId(role.id);
  const globalPermissions = systemPermissions.filter((permission) => globalPermissionCodes.has(permission.code));

  if (!activeOfficialRole) {
    return {
      ...user,
      role,
      permissions: globalPermissions,
    };
  }

  const projectRole = await authorizationRepository.findRoleByName(activeOfficialRole);
  const normalizedProjectRole = normalizeRole(projectRole);
  const projectPermissions = await authorizationRepository.findPermissionsByRoleId(normalizedProjectRole.id);

  return {
    ...user,
    role,
    permissions: mergePermissions(globalPermissions, projectPermissions),
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
  buildProjectAuthorizationContext,
  canAccessRole,
  canAccessAnyPermission,
  canAccessAllPermissions,
};
