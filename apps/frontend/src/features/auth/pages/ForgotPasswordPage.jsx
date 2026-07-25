import { useForm } from "react-hook-form";
import { Link, useNavigate } from "react-router-dom";

import { AuthService } from "@/features/auth/services/auth.service";
import {
  forgotPasswordSchema,
  formatValidationIssues,
} from "@/features/auth/schemas/password-recovery.schema";
import { useToast } from "@/shared/components/toast";

const inputClassName =
  "h-11 rounded-md border border-[#123A5A] bg-[#08233B] px-4 text-sm text-[#F8FAFC] outline-none transition-colors placeholder:text-[#94A3B8] focus:border-[#0F7BFF] focus:ring-2 focus:ring-[#0F7BFF]/20";

const ForgotPasswordPage = () => {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const {
    formState: { errors, isSubmitting },
    handleSubmit,
    register,
    setError,
  } = useForm({
    defaultValues: {
      registeredEmail: "",
      username: "",
    },
  });

  const handleForgotPassword = async (formValues) => {
    const validationResult = forgotPasswordSchema.safeParse(formValues);

    if (!validationResult.success) {
      formatValidationIssues(validationResult.error.issues).forEach((issue) => {
        setError(issue.field, { message: issue.message, type: "validate" });
      });
      showToast({
        message: "Username dan Registered Email wajib diisi.",
        title: "Data Belum Lengkap",
        variant: "error",
      });
      return;
    }

    const response = await AuthService.forgotPassword(validationResult.data);
    if (!response.success) {
      showToast({
        message: "Gagal mengirim email.",
        title: "Terjadi Kesalahan",
        variant: "error",
      });
      return;
    }

    showToast({
      message: "Silakan periksa email Anda.",
      title: "Email Berhasil Dikirim",
      variant: "success",
    });
    const requestId = response.data?.requestId;
    navigate(requestId ? `/check-email?requestId=${encodeURIComponent(requestId)}` : "/check-email");
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
          Masukkan Username dan Registered Email untuk meminta link Reset Password.
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
            placeholder="Masukkan username"
            type="text"
            {...register("username")}
          />
          {errors.username ? (
            <span className="text-xs text-[#FCA5A5]">{errors.username.message}</span>
          ) : null}
        </label>

        <label className="flex flex-col gap-2 text-sm font-medium text-[#CBD5E1]">
          <span>Registered Email</span>
          <input
            autoComplete="email"
            className={inputClassName}
            placeholder="Masukkan registered email"
            type="email"
            {...register("registeredEmail")}
          />
          {errors.registeredEmail ? (
            <span className="text-xs text-[#FCA5A5]">{errors.registeredEmail.message}</span>
          ) : null}
        </label>

        <button
          className="h-11 rounded-md bg-[#0F7BFF] px-4 text-sm font-semibold text-white transition-colors hover:bg-[#0B63CC] focus:outline-none focus:ring-2 focus:ring-[#0F7BFF]/30 disabled:cursor-not-allowed disabled:opacity-60"
          disabled={isSubmitting}
          type="submit"
        >
          {isSubmitting ? "Mengirim..." : "Kirim Link Reset"}
        </button>

        <Link
          className="text-center text-sm font-medium text-[#00C8FF] transition-colors hover:text-[#F8FAFC]"
          to="/login"
        >
          Kembali ke Login
        </Link>
      </form>
    </section>
  );
};

export default ForgotPasswordPage;
