import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { Link, useNavigate, useSearchParams } from "react-router-dom";

import {
  formatValidationIssues,
  PASSWORD_CONFIRMATION_MISMATCH_MESSAGE,
  resetPasswordSchema,
} from "@/features/auth/schemas/password-recovery.schema";
import { AuthService } from "@/features/auth/services/auth.service";
import PasswordInput from "@/shared/components/form/PasswordInput";
import { useToast } from "@/shared/components/toast";

const TokenStateMessage = ({ description, title }) => (
  <section className="text-center">
    <p className="text-sm font-semibold uppercase tracking-wide text-[#0F7BFF]">
      Account Recovery
    </p>
    <h1 className="mt-3 text-3xl font-bold text-[#F8FAFC]">{title}</h1>
    <p className="mt-3 text-sm leading-6 text-[#CBD5E1]">{description}</p>
    <Link
      className="mt-8 inline-flex h-11 items-center rounded-md bg-[#0F7BFF] px-5 text-sm font-semibold text-white transition-colors hover:bg-[#0B63CC] focus:outline-none focus:ring-2 focus:ring-[#0F7BFF]/30"
      to="/login"
    >
      Back to Login
    </Link>
  </section>
);

const tokenStateContent = {
  expired: {
    description: "The password reset link has expired.",
    title: "Reset Link Expired",
  },
  invalid: {
    description: "The password reset link is invalid.",
    title: "Reset Link Invalid",
  },
  used: {
    description: "The password reset link has already been used.",
    title: "Reset Link Already Used",
  },
};

const ResetPasswordPage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const token = searchParams.get("token") ?? "";
  const [tokenValidation, setTokenValidation] = useState({
    state: "loading",
    token: null,
  });
  const [resetResult, setResetResult] = useState(null);
  const {
    formState: { errors, isSubmitting },
    handleSubmit,
    register,
    setError,
  } = useForm({
    defaultValues: {
      confirmPassword: "",
      newPassword: "",
    },
  });

  useEffect(() => {
    let isMounted = true;

    AuthService.validatePasswordResetToken(token).then((response) => {
      if (!isMounted) return;
      setTokenValidation({
        state: response.data?.state ?? "invalid",
        token,
      });
    });

    return () => {
      isMounted = false;
    };
  }, [token]);

  const tokenState = tokenValidation.token === token
    ? tokenValidation.state
    : "loading";

  const handleResetPassword = async (formValues) => {
    setResetResult(null);
    const validationResult = resetPasswordSchema.safeParse(formValues);

    if (!validationResult.success) {
      const issues = formatValidationIssues(validationResult.error.issues);
      const hasEmptyField = issues.some((issue) => issue.message.includes("wajib diisi"));
      const hasConfirmationMismatch = issues.some((issue) => issue.field === "confirmPassword");

      if (hasEmptyField) {
        showToast({
          message: issues.map((issue) => issue.message).join("\n"),
          title: "Data Still Incomplete",
          variant: "error",
        });
      } else if (hasConfirmationMismatch) {
        showToast({
          message: PASSWORD_CONFIRMATION_MISMATCH_MESSAGE,
          title: "Confirm Password Does Not Match",
          variant: "error",
        });
      }

      issues.forEach((issue) => {
        setError(issue.field, { message: issue.message, type: "validate" });
      });
      return;
    }

    const response = await AuthService.resetPassword({
      ...validationResult.data,
      token,
    });

    if (!response.success) {
      showToast({
        message: "Password reset link is invalid or has expired.",
        title: "Reset Link Invalid",
        variant: "error",
      });
      setTokenValidation({
        state: response.data?.state ?? "invalid",
        token,
      });
      return;
    }

    showToast({
      message: "Please login using the new password.",
      title: "Password Successfully Changed",
      variant: "success",
    });
    setResetResult(response);
    setTokenValidation({
      state: "success",
      token,
    });
    navigate("/login", { replace: true });
  };

  if (tokenState === "loading") {
    return (
      <section className="text-center" role="status">
        <p className="text-sm font-semibold uppercase tracking-wide text-[#0F7BFF]">
          Account Recovery
        </p>
        <h1 className="mt-3 text-3xl font-bold text-[#F8FAFC]">
          Validating Reset Link
        </h1>
        <p className="mt-3 text-sm text-[#CBD5E1]">
          System is checking the password reset link.
        </p>
      </section>
    );
  }

  if (tokenState === "success") {
    return (
      <section className="text-center">
        <p className="text-sm font-semibold uppercase tracking-wide text-[#0F7BFF]">
          Account Recovery
        </p>
        <h1 className="mt-3 text-3xl font-bold text-[#F8FAFC]">
          Password Successfully Reset
        </h1>
        <p className="mt-3 text-sm leading-6 text-[#CBD5E1]">
          Use new password to login.
        </p>
        {resetResult ? (
          <p className="sr-only" role="status">{resetResult.message}</p>
        ) : null}
        <Link
          className="mt-8 inline-flex h-11 items-center rounded-md bg-[#0F7BFF] px-5 text-sm font-semibold text-white transition-colors hover:bg-[#0B63CC] focus:outline-none focus:ring-2 focus:ring-[#0F7BFF]/30"
          to="/login"
        >
          Back to Login
        </Link>
      </section>
    );
  }

  if (tokenState !== "valid") {
    const content = tokenStateContent[tokenState] ?? tokenStateContent.invalid;
    return <TokenStateMessage {...content} />;
  }

  return (
    <section className="text-left">
      <div className="text-center">
        <p className="text-sm font-semibold uppercase tracking-wide text-[#0F7BFF]">
          Account Recovery
        </p>
        <h1 className="mt-3 text-3xl font-bold text-[#F8FAFC]">
          Reset Password
        </h1>
        <p className="mt-2 text-sm text-[#CBD5E1]">
          Create new password for your EDMS account.
        </p>
      </div>

      <form
        className="mt-8 flex flex-col gap-5"
        noValidate
        onSubmit={handleSubmit(handleResetPassword)}
      >
        <label className="flex flex-col gap-2 text-sm font-medium text-[#CBD5E1]">
          <span>New Password</span>
          <PasswordInput
            autoComplete="new-password"
            placeholder="Enter new password"
            {...register("newPassword")}
          />
          {errors.newPassword ? (
            <span className="whitespace-pre-line text-xs text-[#FCA5A5]">{errors.newPassword.message}</span>
          ) : null}
        </label>

        <label className="flex flex-col gap-2 text-sm font-medium text-[#CBD5E1]">
          <span>Confirm Password</span>
          <PasswordInput
            autoComplete="new-password"
            hideLabel="Sembunyikan confirm password"
            placeholder="Enter confirm password"
            showLabel="Tampilkan confirm password"
            {...register("confirmPassword")}
          />
          {errors.confirmPassword ? (
            <span className="text-xs text-[#FCA5A5]">{errors.confirmPassword.message}</span>
          ) : null}
        </label>

        <button
          className="h-11 rounded-md bg-[#0F7BFF] px-4 text-sm font-semibold text-white transition-colors hover:bg-[#0B63CC] focus:outline-none focus:ring-2 focus:ring-[#0F7BFF]/30 disabled:cursor-not-allowed disabled:opacity-60"
          disabled={isSubmitting}
          type="submit"
        >
          {isSubmitting ? "Processing..." : "Reset Password"}
        </button>

        <Link
          className="text-center text-sm font-medium text-[#00C8FF] transition-colors hover:text-[#F8FAFC]"
          to="/login"
        >
          Back to Login
        </Link>
      </form>
    </section>
  );
};

export default ResetPasswordPage;
