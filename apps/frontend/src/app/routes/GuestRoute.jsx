import { Navigate, useLocation } from "react-router-dom";

import { getReturnToPath } from "@/app/routes/redirect.utils";
import { AuthService } from "@/features/auth/services/auth.service";

const GuestRoute = ({ children }) => {
  const location = useLocation();

  if (AuthService.isAuthenticated()) {
    return (
      <Navigate
        replace
        to={getReturnToPath(location, AuthService.getPostAuthenticationDestination())}
      />
    );
  }

  return children;
};

export default GuestRoute;
