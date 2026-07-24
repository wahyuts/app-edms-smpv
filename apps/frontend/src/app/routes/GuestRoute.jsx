import { Navigate } from "react-router-dom";

import { AuthService } from "@/features/auth/services/auth.service";

const GuestRoute = ({ children }) => {
  if (AuthService.isAuthenticated()) {
    return <Navigate replace to="/dashboard" />;
  }

  return children;
};

export default GuestRoute;
