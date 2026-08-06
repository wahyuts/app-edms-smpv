import { Navigate, useLocation } from "react-router-dom";

import { AuthService } from "@/features/auth/services/auth.service";
import { AuthorizationService } from "@/shared/services/authorization.service";

const AccessDeniedState = () => (
  <section className="flex min-h-[calc(100vh-10rem)] items-center justify-center px-6 text-center text-sm font-semibold text-[#FCA5A5]">
    Anda tidak memiliki akses ke halaman ini.
  </section>
);

const ProtectedRoute = ({ children, permission, permissionScope = "system" }) => {
  const location = useLocation();
  const currentUser = AuthService.getCurrentUser();

  if (!currentUser) {
    return <Navigate replace state={{ from: location }} to="/login" />;
  }

  const hasRequiredPermission = permissionScope === "project"
    ? AuthorizationService.hasProjectPermission(permission)
    : AuthorizationService.hasPermission(permission);

  if (permission && !hasRequiredPermission) {
    return <AccessDeniedState />;
  }

  return children;
};

export default ProtectedRoute;
