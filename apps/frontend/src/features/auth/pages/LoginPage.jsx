import { Link, useLocation, useNavigate } from "react-router-dom";
import { useCallback, useEffect } from "react";

import { getReturnToPath } from "@/app/routes/redirect.utils";
import { AuthService } from "@/features/auth/services/auth.service";
import PasswordInput from "@/shared/components/form/PasswordInput";
import { useToast } from "@/shared/components/toast";
import { useProjectContextStore } from "@/shared/stores/project-context.store";

const LoginPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const {
    clearProjectContext,
    setProjectContext,
    setProjectContextLoading,
  } = useProjectContextStore();

  const navigateAfterAuthentication = useCallback(() => {
    const accessibleProjects = AuthService.getAccessibleProjects();
    const activeMembership = AuthService.getActiveMembership();
    const activeProject = AuthService.getActiveProject();
    const fallbackDestination = AuthService.getPostAuthenticationDestination();
    const destination = getReturnToPath(location, fallbackDestination);

    setProjectContextLoading(true);
    setProjectContext({
      accessibleProjects,
      activeMembership,
      activeProject,
    });
    navigate(destination, {
      replace: true,
      state: { from: destination },
    });
  }, [
    location,
    navigate,
    setProjectContext,
    setProjectContextLoading,
  ]);

  useEffect(() => {
    const currentUser = AuthService.getCurrentUser();
    if (currentUser) {
      navigateAfterAuthentication();
    } else {
      clearProjectContext();
    }
  }, [clearProjectContext, navigateAfterAuthentication]);

  const handleLogin = async (event) => {
    event.preventDefault();

    const formData = new FormData(event.currentTarget);
    const response = await AuthService.login({
      username: String(formData.get("username") ?? ""),
      password: String(formData.get("password") ?? ""),
    });

    showToast({
      message: response.message,
      title: response.success ? "Login Berhasil" : "Login Gagal",
      variant: response.success ? "success" : "error",
    });

    if (response.success) {
      navigateAfterAuthentication();
    }
  };

  return (
    <section className="text-left">
      <div className="text-center">
        <p className="text-sm font-semibold uppercase tracking-wide text-[#0F7BFF]">
          Engineering Document Management System
        </p>
        <h1 className="mt-3 text-3xl font-bold text-[#F8FAFC]">Login</h1>
        <p className="mt-2 text-sm text-[#CBD5E1]">
          Masuk untuk mengakses BIM Engineering EDMS.
        </p>
      </div>

      <form className="mt-8 flex flex-col gap-5" onSubmit={handleLogin}>
        <label className="flex flex-col gap-2 text-sm font-medium text-[#CBD5E1]">
          <span>Username</span>
          <input
            className="h-11 rounded-md border border-[#123A5A] bg-[#08233B] px-4 text-sm text-[#F8FAFC] outline-none transition-colors placeholder:text-[#94A3B8] focus:border-[#0F7BFF] focus:ring-2 focus:ring-[#0F7BFF]/20"
            name="username"
            placeholder="Masukkan username"
            type="text"
          />
        </label>

        <label className="flex flex-col gap-2 text-sm font-medium text-[#CBD5E1]">
          <span>Password</span>
          <PasswordInput
            autoComplete="current-password"
            name="password"
            placeholder="Masukkan password"
          />
        </label>

        <div className="flex flex-col gap-3 text-sm sm:flex-row sm:items-center sm:justify-between">
          <label className="flex items-center gap-2 text-[#CBD5E1]">
            <input
              className="h-4 w-4 rounded border-[#123A5A] bg-[#08233B] accent-[#0F7BFF]"
              name="rememberMe"
              type="checkbox"
            />
            <span>Ingat Login</span>
          </label>

          <Link
            className="font-medium text-[#00C8FF] transition-colors hover:text-[#F8FAFC]"
            to="/forgot-password"
          >
            Forgot Password?
          </Link>
        </div>

        <button
          className="h-11 rounded-md bg-[#0F7BFF] px-4 text-sm font-semibold text-white transition-colors hover:bg-[#0B63CC] focus:outline-none focus:ring-2 focus:ring-[#0F7BFF]/30"
          type="submit"
        >
          Login
        </button>

      </form>
    </section>
  );
};

export default LoginPage;
