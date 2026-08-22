import { useRef, useState } from "react";
import { useNavigate } from "react-router-dom";

import {
  PASSWORD_CONFIRMATION_MISMATCH_MESSAGE,
} from "@/features/auth/schemas/password-recovery.schema";
import { AuthService } from "@/features/auth/services/auth.service";
import PasswordInput from "@/shared/components/form/PasswordInput";
import { useToast } from "@/shared/components/toast";
import { usePermission } from "@/shared/hooks/usePermission";
import { useProjectContextStore } from "@/shared/stores/project-context.store";

const ChangePasswordPage = () => {
  const currentUser = AuthService.getCurrentUser();
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const currentPasswordRef = useRef(null);
  const navigate = useNavigate();
  const { showToast } = useToast();
  const { hasPermission } = usePermission();
  const clearProjectContext = useProjectContextStore(
    (state) => state.clearProjectContext,
  );

  const showChangePasswordToast = ({ message, title, variant = "error" }) => {
    showToast({
      message,
      title,
      variant,
    });
  };

  const handleChangePassword = async (event) => {
    event.preventDefault();

    const form = event.currentTarget;
    const formData = new FormData(form);
    const currentPassword = String(formData.get("currentPassword") ?? "");
    const newPassword = String(formData.get("newPassword") ?? "");
    const confirmPassword = String(formData.get("confirmPassword") ?? "");
    setErrors({});

    if (!currentPassword || !newPassword || !confirmPassword) {
      const nextErrors = {};

      if (!currentPassword) {
        nextErrors.currentPassword = "Current password is required.";
      }

      if (!newPassword) {
        nextErrors.newPassword = "New password is required.";
      }

      if (!confirmPassword) {
        nextErrors.confirmPassword = "Confirm password is required.";
      }

      setErrors(nextErrors);
      showChangePasswordToast({
        message: Object.values(nextErrors).join("\n"),
        title: "Data Still Incomplete",
      });
      return;
    }

    if (newPassword !== confirmPassword) {
      setErrors({
        confirmPassword: PASSWORD_CONFIRMATION_MISMATCH_MESSAGE,
      });
      showChangePasswordToast({
        message: PASSWORD_CONFIRMATION_MISMATCH_MESSAGE,
        title: "Confirm Password Does Not Match",
      });
      return;
    }

    setIsSubmitting(true);
    const response = await AuthService.changePassword({
      username: currentUser?.username ?? "",
      currentPassword,
      newPassword,
      confirmPassword,
    });
    setIsSubmitting(false);

    if (response.success) {
      showChangePasswordToast({
        message: "Please relogin.",
        title: "Password Successfully Changed",
        variant: "success",
      });
      form.reset();
      clearProjectContext();
      navigate("/login", { replace: true });
      return;
    }

    if (response.message.includes("Current Password")) {
      showChangePasswordToast({
        message: "Current password is incorrect.",
        title: "Change Password Failed",
      });
      setErrors({
        currentPassword: "Current password is incorrect.",
      });
      form.elements.currentPassword.value = "";
      currentPasswordRef.current?.focus();
      return;
    }

    showChangePasswordToast({
      message: "Change password failed.",
      title: "Change Password Failed",
    });
  };

  return (
    <>
      <header>
        <p className="text-sm font-semibold uppercase tracking-wide text-[#0F7BFF]">
          User Profile
        </p>
        <h1 className="mt-2 text-3xl font-bold">Change Password</h1>
        <p className="mt-2 text-sm text-[#CBD5E1]">
          Change the password for the currently logged-in account.
        </p>
      </header>

      <form
        className="rounded-lg border border-[#123A5A] bg-[#061B2F] p-6"
        onSubmit={handleChangePassword}
      >
        <div className="flex flex-col gap-5">
          <label className="flex flex-col gap-2 text-sm font-medium text-[#CBD5E1]">
            <span>Current Password</span>
            <PasswordInput
              autoComplete="current-password"
              name="currentPassword"
              placeholder="Masukkan current password"
              ref={currentPasswordRef}
            />
            {errors.currentPassword ? (
              <span className="text-xs text-[#FCA5A5]">{errors.currentPassword}</span>
            ) : null}
          </label>

          <label className="flex flex-col gap-2 text-sm font-medium text-[#CBD5E1]">
            <span>New Password</span>
            <PasswordInput
              autoComplete="new-password"
              name="newPassword"
              placeholder="Masukkan password baru"
            />
            {errors.newPassword ? (
              <span className="whitespace-pre-line text-xs text-[#FCA5A5]">{errors.newPassword}</span>
            ) : null}
          </label>

          <label className="flex flex-col gap-2 text-sm font-medium text-[#CBD5E1]">
            <span>Confirm Password</span>
            <PasswordInput
              autoComplete="new-password"
              name="confirmPassword"
              placeholder="Masukkan confirm password"
            />
            {errors.confirmPassword ? (
              <span className="text-xs text-[#FCA5A5]">{errors.confirmPassword}</span>
            ) : null}
          </label>

          {hasPermission("password.change") ? (
            <button
              className="h-11 rounded-md bg-[#0F7BFF] px-4 text-sm font-semibold text-white transition-colors hover:bg-[#0B63CC] focus:outline-none focus:ring-2 focus:ring-[#0F7BFF]/30 disabled:cursor-not-allowed disabled:opacity-60"
              disabled={isSubmitting}
              type="submit"
            >
              {isSubmitting ? "Memproses..." : "Change Password"}
            </button>
          ) : null}

        </div>
      </form>
    </>
  );
};

export default ChangePasswordPage;
