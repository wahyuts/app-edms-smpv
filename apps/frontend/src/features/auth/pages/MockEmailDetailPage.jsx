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
          <p><span className="text-[#94A3B8]">Requested Date/Time:</span> {formatDateTime(email.requestedAt ?? email.createdAt)}</p>
        </div>

        {email.html ? (
          <div
            className="space-y-5 px-5 py-6 text-sm leading-6 text-[#CBD5E1] [&_a]:inline-flex [&_a]:h-11 [&_a]:items-center [&_a]:rounded-md [&_a]:bg-[#0F7BFF] [&_a]:px-5 [&_a]:text-sm [&_a]:font-semibold [&_a]:text-white [&_a]:transition-colors hover:[&_a]:bg-[#0B63CC] [&_h1]:text-2xl [&_h1]:font-bold [&_h1]:text-[#F8FAFC] [&_strong]:text-[#F8FAFC]"
            dangerouslySetInnerHTML={{ __html: email.html }}
          />
        ) : (
          <pre className="whitespace-pre-wrap px-5 py-6 text-sm leading-6 text-[#CBD5E1]">
            {email.text}
          </pre>
        )}

      </div>

      <Link
        className="mt-6 inline-flex text-sm font-medium text-[#00C8FF] transition-colors hover:text-[#F8FAFC]"
        to={email.requestId ? `/check-email?requestId=${encodeURIComponent(email.requestId)}` : "/check-email"}
      >
        Back to Mock Inbox
      </Link>
    </section>
  );
};

export default MockEmailDetailPage;
