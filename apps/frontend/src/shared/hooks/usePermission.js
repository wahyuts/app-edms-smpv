import { useMemo } from "react";
import { AuthorizationService } from "@/shared/services/authorization.service";

export const usePermission = () => {
  return useMemo(
    () => ({
      getCurrentRole: AuthorizationService.getCurrentRole,
      getCurrentPermissions: AuthorizationService.getCurrentPermissions,
      getActiveProjectRole: AuthorizationService.getActiveProjectRole,
      getActiveProjectPermissions: AuthorizationService.getActiveProjectPermissions,
      hasPermission: AuthorizationService.hasPermission,
      hasAnyPermission: AuthorizationService.hasAnyPermission,
      hasAllPermissions: AuthorizationService.hasAllPermissions,
      hasProjectPermission: AuthorizationService.hasProjectPermission,
      hasAnyProjectPermission: AuthorizationService.hasAnyProjectPermission,
      hasAllProjectPermissions: AuthorizationService.hasAllProjectPermissions,
    }),
    [],
  );
};

export default usePermission;
