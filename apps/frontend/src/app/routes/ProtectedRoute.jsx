import { Navigate, useLocation } from "react-router-dom";

import navigation from "@/app/navigation";
import { AuthService } from "@/features/auth/services/auth.service";
import { AuthorizationService } from "@/shared/services/authorization.service";

const getNavigationItems = (items) => {
  return items.flatMap((item) =>
    item.children ? getNavigationItems(item.children) : item,
  );
};

const getAuthorizedRedirectPath = (currentPath) => {
  const fallbackPaths = [
    getNavigationItems(navigation).find((item) =>
      AuthorizationService.hasPermission(item.permission),
    )?.path,
    AuthorizationService.hasPermission("profile.view") ? "/profile" : null,
    AuthorizationService.hasPermission("password.change")
      ? "/change-password"
      : null,
  ].filter(Boolean);

  return (
    fallbackPaths.find((fallbackPath) => fallbackPath !== currentPath) ??
    "/login"
  );
};

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
    return (
      <Navigate
        replace
        state={{ from: location }}
        to={getAuthorizedRedirectPath(location.pathname)}
      />
    );
  }

  return children;
};

export default ProtectedRoute;
