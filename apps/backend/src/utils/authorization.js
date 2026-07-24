const getUserRoleName = (user) => {
  return user?.role?.name || user?.role?.roleName || null;
};

const getUserPermissionCodes = (user) => {
  if (!Array.isArray(user?.permissions)) {
    return [];
  }

  return user.permissions.map((permission) => permission.code || permission.permissionCode);
};

const hasRole = (user, roleName) => {
  return getUserRoleName(user) === roleName;
};

const hasAnyRole = (user, roleNames) => {
  return roleNames.some((roleName) => hasRole(user, roleName));
};

const hasAnyPermission = (user, permissionCodes) => {
  const userPermissionCodes = getUserPermissionCodes(user);

  return permissionCodes.some((permissionCode) => userPermissionCodes.includes(permissionCode));
};

const hasAllPermissions = (user, permissionCodes) => {
  const userPermissionCodes = getUserPermissionCodes(user);

  return permissionCodes.every((permissionCode) => userPermissionCodes.includes(permissionCode));
};

module.exports = {
  getUserRoleName,
  getUserPermissionCodes,
  hasRole,
  hasAnyRole,
  hasAnyPermission,
  hasAllPermissions,
};
