import { AuthService } from "@/features/auth/services/auth.service";
import PasswordInput from "@/shared/components/form/PasswordInput";
import { useToast } from "@/shared/components/toast";
import { usePermission } from "@/shared/hooks/usePermission";

const ChangePasswordPage = () => {
  const currentUser = AuthService.getCurrentUser();
  const { showToast } = useToast();
  const { hasPermission } = usePermission();

  const handleChangePassword = async (event) => {
    event.preventDefault();

    const form = event.currentTarget;
    const formData = new FormData(form);
    const response = await AuthService.changePassword({
      username: currentUser?.username ?? "",
      currentPassword: String(formData.get("currentPassword") ?? ""),
      newPassword: String(formData.get("newPassword") ?? ""),
      confirmPassword: String(formData.get("confirmPassword") ?? ""),
    });

    showToast({
      message: response.message,
      variant: response.success ? "success" : "error",
    });

    if (response.success) {
      form.reset();
    }
  };

  return (
    <>
      <header>
        <p className="text-sm font-semibold uppercase tracking-wide text-[#0F7BFF]">
          User Profile
        </p>
        <h1 className="mt-2 text-3xl font-bold">Change Password</h1>
        <p className="mt-2 text-sm text-[#CBD5E1]">
          Update the password for the current logged-in user.
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
              placeholder="Enter current password"
            />
          </label>

          <label className="flex flex-col gap-2 text-sm font-medium text-[#CBD5E1]">
            <span>New Password</span>
            <PasswordInput
              autoComplete="new-password"
              name="newPassword"
              placeholder="Enter new password"
            />
          </label>

          <label className="flex flex-col gap-2 text-sm font-medium text-[#CBD5E1]">
            <span>Confirm Password</span>
            <PasswordInput
              autoComplete="new-password"
              name="confirmPassword"
              placeholder="Confirm new password"
            />
          </label>

          {hasPermission("password.change") ? (
            <button
              className="h-11 rounded-md bg-[#0F7BFF] px-4 text-sm font-semibold text-white transition-colors hover:bg-[#0B63CC] focus:outline-none focus:ring-2 focus:ring-[#0F7BFF]/30"
              type="submit"
            >
              Change Password
            </button>
          ) : null}

        </div>
      </form>
    </>
  );
};

export default ChangePasswordPage;
