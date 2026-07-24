import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { Link, useSearchParams } from "react-router-dom";

import {
  formatValidationIssues,
  resetPasswordSchema,
} from "@/features/auth/schemas/password-recovery.schema";
import { AuthService } from "@/features/auth/services/auth.service";
import PasswordInput from "@/shared/components/form/PasswordInput";

const TokenStateMessage = ({ description, title }) => (
  <section className="text-center">
    <p className="text-sm font-semibold uppercase tracking-wide text-[#0F7BFF]">
      Account Recovery
    </p>
    <h1 className="mt-3 text-3xl font-bold text-[#F8FAFC]">{title}</h1>
    <p className="mt-3 text-sm leading-6 text-[#CBD5E1]">{description}</p>
    <Link
      className="mt-8 inline-flex h-11 items-center rounded-md bg-[#0F7BFF] px-5 text-sm font-semibold text-white transition-colors hover:bg-[#0B63CC] focus:outline-none focus:ring-2 focus:ring-[#0F7BFF]/30"
      to="/forgot-password"
    >
      Back to Forgot Password
    </Link>
  </section>
);

const tokenStateContent = {
  expired: {
    description: "This password reset link has expired. Please request a new reset link.",
    title: "Reset Link Expired",
  },
  invalid: {
    description: "This password reset link is invalid. Please request a new reset link.",
    title: "Reset Link Invalid",
  },
  used: {
    description: "This password reset link has already been used. Please request a new reset link if you still need to change your password.",
    title: "Reset Link Already Used",
  },
};

const ResetPasswordPage = () => {
  const [searchParams] = useSearchParams();
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
      formatValidationIssues(validationResult.error.issues).forEach((issue) => {
        setError(issue.field, { message: issue.message, type: "validate" });
      });
      return;
    }

    const response = await AuthService.resetPassword({
      ...validationResult.data,
      token,
    });

    if (!response.success) {
      setTokenValidation({
        state: response.data?.state ?? "invalid",
        token,
      });
      return;
    }

    setResetResult(response);
    setTokenValidation({
      state: "success",
      token,
    });
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
          Please wait while we validate your password reset link.
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
          Password Reset Successful
        </h1>
        <p className="mt-3 text-sm leading-6 text-[#CBD5E1]">
          Your password has been updated successfully. You can now sign in using your new password.
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
          Create a new password for your EDMS account.
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
            <span className="text-xs text-[#FCA5A5]">{errors.newPassword.message}</span>
          ) : null}
        </label>

        <label className="flex flex-col gap-2 text-sm font-medium text-[#CBD5E1]">
          <span>Confirm Password</span>
          <PasswordInput
            autoComplete="new-password"
            hideLabel="Hide confirm password"
            placeholder="Confirm new password"
            showLabel="Show confirm password"
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
          {isSubmitting ? "Updating..." : "Reset Password"}
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
