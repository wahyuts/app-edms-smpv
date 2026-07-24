import { useState } from "react";
import { useForm } from "react-hook-form";
import { Link, useNavigate } from "react-router-dom";

import { AuthService } from "@/features/auth/services/auth.service";
import {
  forgotPasswordSchema,
  formatValidationIssues,
} from "@/features/auth/schemas/password-recovery.schema";

const inputClassName =
  "h-11 rounded-md border border-[#123A5A] bg-[#08233B] px-4 text-sm text-[#F8FAFC] outline-none transition-colors placeholder:text-[#94A3B8] focus:border-[#0F7BFF] focus:ring-2 focus:ring-[#0F7BFF]/20";

const ForgotPasswordPage = () => {
  const [submitError, setSubmitError] = useState("");
  const navigate = useNavigate();
  const {
    formState: { errors, isSubmitting },
    handleSubmit,
    register,
    setError,
  } = useForm({
    defaultValues: {
      username: "",
    },
  });

  const handleForgotPassword = async (formValues) => {
    setSubmitError("");
    const validationResult = forgotPasswordSchema.safeParse(formValues);

    if (!validationResult.success) {
      formatValidationIssues(validationResult.error.issues).forEach((issue) => {
        setError(issue.field, { message: issue.message, type: "validate" });
      });
      return;
    }

    const response = await AuthService.forgotPassword(validationResult.data);
    if (!response.success) {
      setSubmitError(response.message);
      return;
    }

    navigate("/check-email");
  };

  return (
    <section className="text-left">
      <div className="text-center">
        <p className="text-sm font-semibold uppercase tracking-wide text-[#0F7BFF]">
          Account Recovery
        </p>
        <h1 className="mt-3 text-3xl font-bold text-[#F8FAFC]">
          Forgot Password
        </h1>
        <p className="mt-2 text-sm text-[#CBD5E1]">
          Enter your username to request a password reset link.
        </p>
      </div>

      <form
        className="mt-8 flex flex-col gap-5"
        noValidate
        onSubmit={handleSubmit(handleForgotPassword)}
      >
        <label className="flex flex-col gap-2 text-sm font-medium text-[#CBD5E1]">
          <span>Username</span>
          <input
            autoComplete="username"
            className={inputClassName}
            placeholder="Enter username"
            type="text"
            {...register("username")}
          />
          {errors.username ? (
            <span className="text-xs text-[#FCA5A5]">{errors.username.message}</span>
          ) : null}
        </label>

        <button
          className="h-11 rounded-md bg-[#0F7BFF] px-4 text-sm font-semibold text-white transition-colors hover:bg-[#0B63CC] focus:outline-none focus:ring-2 focus:ring-[#0F7BFF]/30 disabled:cursor-not-allowed disabled:opacity-60"
          disabled={isSubmitting}
          type="submit"
        >
          {isSubmitting ? "Sending..." : "Send Reset Link"}
        </button>

        {submitError ? (
          <p className="rounded-md border border-[#EF4444] bg-[#EF4444]/10 px-4 py-3 text-sm text-[#F8FAFC]">
            {submitError}
          </p>
        ) : null}

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

export default ForgotPasswordPage;
