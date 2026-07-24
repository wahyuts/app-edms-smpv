import { Link, useNavigate } from "react-router-dom";
import { useCallback, useEffect } from "react";

import { ProjectService } from "@/features/project/services/project.service";
import { AuthService } from "@/features/auth/services/auth.service";
import PasswordInput from "@/shared/components/form/PasswordInput";
import { useToast } from "@/shared/components/toast";
import { useProjectContextStore } from "@/shared/stores/project-context.store";

const LoginPage = () => {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const {
    setProjectContext,
    setProjectContextError,
    setProjectContextLoading,
  } = useProjectContextStore();

  const navigateAfterAuthentication = useCallback(async (user) => {
    try {
      setProjectContextLoading(true);
      const context = await ProjectService.resolveActiveProject(user);
      setProjectContext(context);
      navigate(
        context.accessibleProjects.length > 0 ? "/select-project" : "/dashboard",
        { replace: true },
      );
    } catch (error) {
      const message = error instanceof Error
        ? error.message
        : "Project context initialization failed.";

      setProjectContextError(message);
      showToast({
        message,
        variant: "error",
      });
    }
  }, [
    navigate,
    setProjectContext,
    setProjectContextError,
    setProjectContextLoading,
    showToast,
  ]);

  useEffect(() => {
    const currentUser = AuthService.getCurrentUser();
    if (currentUser) {
      navigateAfterAuthentication(currentUser);
    }
  }, [navigateAfterAuthentication]);

  const handleLogin = async (event) => {
    event.preventDefault();

    const formData = new FormData(event.currentTarget);
    const response = await AuthService.login({
      username: String(formData.get("username") ?? ""),
      password: String(formData.get("password") ?? ""),
    });

    showToast({
      message: response.message,
      variant: response.success ? "success" : "error",
    });

    if (response.success) {
      await navigateAfterAuthentication(response.data.user);
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
          Sign in to access BIM Engineering EDMS.
        </p>
      </div>

      <form className="mt-8 flex flex-col gap-5" onSubmit={handleLogin}>
        <label className="flex flex-col gap-2 text-sm font-medium text-[#CBD5E1]">
          <span>Username</span>
          <input
            className="h-11 rounded-md border border-[#123A5A] bg-[#08233B] px-4 text-sm text-[#F8FAFC] outline-none transition-colors placeholder:text-[#94A3B8] focus:border-[#0F7BFF] focus:ring-2 focus:ring-[#0F7BFF]/20"
            name="username"
            placeholder="Enter username"
            type="text"
          />
        </label>

        <label className="flex flex-col gap-2 text-sm font-medium text-[#CBD5E1]">
          <span>Password</span>
          <PasswordInput
            autoComplete="current-password"
            name="password"
            placeholder="Enter password"
          />
        </label>

        <div className="flex flex-col gap-3 text-sm sm:flex-row sm:items-center sm:justify-between">
          <label className="flex items-center gap-2 text-[#CBD5E1]">
            <input
              className="h-4 w-4 rounded border-[#123A5A] bg-[#08233B] accent-[#0F7BFF]"
              name="rememberMe"
              type="checkbox"
            />
            <span>Remember Me</span>
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
