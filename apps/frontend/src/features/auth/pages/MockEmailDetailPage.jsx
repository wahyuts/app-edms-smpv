import { useEffect, useState } from "react";
import { Link, Navigate, useParams } from "react-router-dom";

import { env } from "@/app/config/env";
import { AuthService } from "@/features/auth/services/auth.service";

const formatDateTime = (value) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";

  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
};

const MockEmailDetailPage = () => {
  const { emailId } = useParams();
  const [email, setEmail] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    AuthService.getMockEmailDetail(emailId).then((mockEmail) => {
      if (!isMounted) return;
      setEmail(mockEmail);
      setLoading(false);
    });

    return () => {
      isMounted = false;
    };
  }, [emailId]);

  if (!env.ENABLE_MOCK_EMAIL) {
    return <Navigate replace to="/check-email" />;
  }

  if (loading) {
    return (
      <section className="text-center" role="status">
        <h1 className="text-2xl font-bold text-[#F8FAFC]">Loading Email</h1>
      </section>
    );
  }

  if (!email) {
    return (
      <section className="text-center">
        <h1 className="text-2xl font-bold text-[#F8FAFC]">Mock Email Not Found</h1>
        <Link
          className="mt-6 inline-flex text-sm font-medium text-[#00C8FF] transition-colors hover:text-[#F8FAFC]"
          to="/check-email"
        >
          Back to Check Email
        </Link>
      </section>
    );
  }

  return (
    <section className="text-left">
      <div className="text-center">
        <p className="text-sm font-semibold uppercase tracking-wide text-[#0F7BFF]">
          Development Only
        </p>
        <h1 className="mt-3 text-3xl font-bold text-[#F8FAFC]">
          Reset Your EDMS Password
        </h1>
      </div>

      <div className="mt-8 rounded-lg border border-[#123A5A] bg-[#041525]">
        <div className="space-y-2 border-b border-[#123A5A] px-4 py-4 text-sm text-[#CBD5E1]">
          <p><span className="text-[#94A3B8]">From:</span> {email.from}</p>
          <p><span className="text-[#94A3B8]">To:</span> {email.to}</p>
          <p><span className="text-[#94A3B8]">Subject:</span> {email.subject}</p>
          <p><span className="text-[#94A3B8]">Requested Date/Time:</span> {formatDateTime(email.createdAt)}</p>
        </div>

        <div className="space-y-5 px-5 py-6 text-sm leading-6 text-[#CBD5E1]">
          <p className="text-base font-semibold text-[#F8FAFC]">APP Engineering EDMS</p>
          <h2 className="text-2xl font-bold text-[#F8FAFC]">Reset Your Password</h2>
          <p>We received a request to reset the password for your EDMS account.</p>
          <p>If you made this request, use the button below to create a new password.</p>
          <Link
            className="inline-flex h-11 items-center rounded-md bg-[#0F7BFF] px-5 text-sm font-semibold text-white transition-colors hover:bg-[#0B63CC] focus:outline-none focus:ring-2 focus:ring-[#0F7BFF]/30"
            to={`/reset-password?token=${encodeURIComponent(email.token)}`}
          >
            Reset Password
          </Link>
          <p>This reset link will expire in 15 minutes and can only be used once.</p>
          <p>If you did not request a password reset, you can safely ignore this email.</p>
        </div>
      </div>

      <Link
        className="mt-6 inline-flex text-sm font-medium text-[#00C8FF] transition-colors hover:text-[#F8FAFC]"
        to={`/check-email?requestId=${encodeURIComponent(email.requestId)}`}
      >
        Back to Mock Inbox
      </Link>
    </section>
  );
};

export default MockEmailDetailPage;
