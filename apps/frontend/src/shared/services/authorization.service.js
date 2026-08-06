import { AuthService } from "@/features/auth/services/auth.service";
import { getActiveOfficialRole } from "@/shared/stores/project-context.store";
import usersDataset from "@/mocks/users.json";

const fallbackRoles = usersDataset.roles;

const getCurrentRole = () => AuthService.getCurrentRole();

const getCurrentPermissions = () => AuthService.getCurrentPermissions();

const getCurrentPermissionCodes = () =>
  getCurrentPermissions().map((permission) => permission.code ?? permission.permissionCode);

const getEffectiveActiveOfficialRole = () =>
  getActiveOfficialRole() ?? AuthService.getActiveMembership()?.officialRole;

const getActiveProjectRole = () => {
  const activeOfficialRole = getEffectiveActiveOfficialRole();
  if (!activeOfficialRole) return null;

  return (
    fallbackRoles.find(
      (role) => role.roleName === activeOfficialRole && role.isActive,
    ) ?? null
  );
};

const getActiveProjectPermissions = () => {
  const activeOfficialRole = getEffectiveActiveOfficialRole();
  if (!activeOfficialRole) return [];

  return getCurrentPermissions();
};

const getActiveProjectPermissionCodes = () =>
  getActiveProjectPermissions().map((permission) => permission.code ?? permission.permissionCode);

const hasPermission = (permissionCode) => {
  if (!permissionCode) return false;
  return getCurrentPermissionCodes().includes(permissionCode);
};

const hasProjectPermission = (permissionCode) => {
  if (!permissionCode || !getEffectiveActiveOfficialRole()) return false;
  return getActiveProjectPermissionCodes().includes(permissionCode);
};

const hasAnyPermission = (permissionCodes = []) => {
  if (!Array.isArray(permissionCodes) || permissionCodes.length === 0) {
    return false;
  }

  return permissionCodes.some((permissionCode) => hasPermission(permissionCode));
};

const hasAllPermissions = (permissionCodes = []) => {
  if (!Array.isArray(permissionCodes) || permissionCodes.length === 0) {
    return false;
  }

  return permissionCodes.every((permissionCode) => hasPermission(permissionCode));
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
  getActiveProjectPermissions,
  getActiveProjectRole,
  getCurrentPermissions,
  getCurrentRole,
  hasAllPermissions,
  hasAllProjectPermissions,
  hasAnyPermission,
  hasAnyProjectPermission,
  hasPermission,
  hasProjectPermission,
};

export default AuthorizationService;
