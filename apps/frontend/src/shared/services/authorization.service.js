import { AuthService } from "@/features/auth/services/auth.service";
import { getActiveOfficialRole } from "@/shared/stores/project-context.store";
import usersDataset from "@/mocks/users.json";

const authorizationData = {
  permissions: usersDataset.permissions,
  rolePermissions: usersDataset.rolePermissions,
  roles: usersDataset.roles,
};

const getCurrentUser = () => {
  return AuthService.getCurrentUser();
};

const getCurrentRole = () => {
  const currentUser = getCurrentUser();

  if (!currentUser?.roleId) {
    return null;
  }

  return (
    authorizationData.roles.find(
      (role) => role.id === currentUser.roleId && role.isActive,
    ) ?? null
  );
};

const getRoleByName = (roleName) => {
  if (!roleName) return null;

  return (
    authorizationData.roles.find(
      (role) => role.roleName === roleName && role.isActive,
    ) ?? null
  );
};

const getPermissionsByRole = (role) => {
  if (!role) {
    return [];
  }

  const permissionIds = authorizationData.rolePermissions
    .filter((rolePermission) => rolePermission.roleId === role.id)
    .map((rolePermission) => rolePermission.permissionId);

  return authorizationData.permissions.filter((permission) =>
    permissionIds.includes(permission.id),
  );
};

const getCurrentPermissions = () => getPermissionsByRole(getCurrentRole());

const getCurrentPermissionCodes = () => {
  return getCurrentPermissions().map(
    (permission) => permission.permissionCode,
  );
};

const getActiveProjectRole = () => getRoleByName(getActiveOfficialRole());

const getActiveProjectPermissions = () =>
  getPermissionsByRole(getActiveProjectRole());

const getActiveProjectPermissionCodes = () =>
  getActiveProjectPermissions().map((permission) => permission.permissionCode);

const hasPermission = (permissionCode) => {
  if (!permissionCode) {
    return false;
  }

  return getCurrentPermissionCodes().includes(permissionCode);
};

const hasProjectPermission = (permissionCode) => {
  if (!permissionCode || !getActiveOfficialRole()) {
    return false;
  }

  return getActiveProjectPermissionCodes().includes(permissionCode);
};

const hasAnyPermission = (permissionCodes = []) => {
  if (!Array.isArray(permissionCodes) || permissionCodes.length === 0) {
    return false;
  }

  return permissionCodes.some((permissionCode) =>
    hasPermission(permissionCode),
  );
};

const hasAllPermissions = (permissionCodes = []) => {
  if (!Array.isArray(permissionCodes) || permissionCodes.length === 0) {
    return false;
  }

  return permissionCodes.every((permissionCode) =>
    hasPermission(permissionCode),
  );
};

const hasAnyProjectPermission = (permissionCodes = []) => {
  if (!Array.isArray(permissionCodes) || permissionCodes.length === 0) {
    return false;
  }

  return permissionCodes.some((permissionCode) =>
    hasProjectPermission(permissionCode),
  );
};

const hasAllProjectPermissions = (permissionCodes = []) => {
  if (!Array.isArray(permissionCodes) || permissionCodes.length === 0) {
    return false;
  }

  return permissionCodes.every((permissionCode) =>
    hasProjectPermission(permissionCode),
  );
};

export const AuthorizationService = {
  getActiveProjectRole,
  getActiveProjectPermissions,
  getCurrentRole,
  getCurrentPermissions,
  hasProjectPermission,
  hasAnyProjectPermission,
  hasAllProjectPermissions,
  hasPermission,
  hasAnyPermission,
  hasAllPermissions,
};

export default AuthorizationService;
