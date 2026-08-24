import { Mail } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";

import { env } from "@/app/config/env";
import { AuthService } from "@/features/auth/services/auth.service";

const GENERIC_MESSAGE = [
  "If the account details are valid, a password reset link has been sent to the registered email address.",
  "Check your inbox or spam folder if you don't see the email.",
  "",
  "Please follow the instructions on your email to proceed",
].join("\n");

const formatDateTime = (value) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";

  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
};

const MockEmailInbox = ({ requestId }) => {
  const [emails, setEmails] = useState([]);
  const [selectedEmailId, setSelectedEmailId] = useState(null);
  const selectedEmail = useMemo(
    () => emails.find((email) => email.id === selectedEmailId) ?? emails[0] ?? null,
    [emails, selectedEmailId],
  );

  useEffect(() => {
    let isMounted = true;

    AuthService.getMockEmails({ requestId }).then((mockEmails) => {
      if (!isMounted) return;
      setEmails(mockEmails);
      setSelectedEmailId(mockEmails[0]?.id ?? null);
    });

    return () => {
      isMounted = false;
    };
  }, [requestId]);

  return (
    <section className="mt-8 rounded-lg border border-[#123A5A] bg-[#041525] text-left">
      <div className="border-b border-[#123A5A] px-4 py-3">
        <p className="text-xs font-semibold uppercase tracking-wide text-[#38BDF8]">
          Development Only
        </p>
        <h2 className="mt-1 text-lg font-semibold text-[#F8FAFC]">
          Development Email Inbox
        </h2>
      </div>

      <div className="grid gap-0 md:grid-cols-[minmax(0,0.9fr)_minmax(0,1.4fr)]">
        <div className="border-b border-[#123A5A] md:border-b-0 md:border-r">
          <div className="border-b border-[#123A5A] px-4 py-3 text-sm font-semibold text-[#CBD5E1]">
            Inbox
          </div>
          <div className="min-h-36 p-3">
            {emails.length > 0 ? emails.map((email) => {
              const isSelected = email.id === selectedEmail?.id;

              return (
                <button
                  aria-pressed={isSelected}
                  className={[
                    "w-full rounded-md border px-3 py-3 text-left text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-[#0F7BFF]/40",
                    isSelected
                      ? "border-[#0F7BFF] bg-[#0F7BFF]/15 text-[#F8FAFC]"
                      : "border-transparent text-[#CBD5E1] hover:border-[#123A5A] hover:bg-[#08233B]",
                  ].join(" ")}
                  key={email.id}
                  onClick={() => setSelectedEmailId(email.id)}
                  type="button"
                >
                  <span className="block font-semibold">{email.subject}</span>
                  <span className="mt-1 block text-xs text-[#94A3B8]">
                    {formatDateTime(email.requestedAt ?? email.createdAt)}
                  </span>
                </button>
              );
            }) : (
              <p className="rounded-md border border-dashed border-[#123A5A] px-4 py-5 text-sm text-[#94A3B8]">
                Email development not found for this request.
              </p>
            )}
          </div>
        </div>

        <div>
          <div className="border-b border-[#123A5A] px-4 py-3 text-sm font-semibold text-[#CBD5E1]">
            Email Preview
          </div>
          {selectedEmail ? (
            <div className="space-y-3 p-4 text-sm text-[#CBD5E1]">
              <p><span className="text-[#94A3B8]">From:</span> {selectedEmail.from}</p>
              <p><span className="text-[#94A3B8]">To:</span> {selectedEmail.to}</p>
              <p><span className="text-[#94A3B8]">Subject:</span> {selectedEmail.subject}</p>
              <p>
                <span className="text-[#94A3B8]">Requested Date/Time:</span>{" "}
                {formatDateTime(selectedEmail.requestedAt ?? selectedEmail.createdAt)}
              </p>
              <Link
                className="inline-flex h-10 items-center rounded-md bg-[#0F7BFF] px-4 text-sm font-semibold text-white transition-colors hover:bg-[#0B63CC] focus:outline-none focus:ring-2 focus:ring-[#0F7BFF]/30"
                to={`/mock-email/${selectedEmail.id}`}
              >
                Buka Email
              </Link>
            </div>
          ) : (
            <div className="p-4 text-sm text-[#94A3B8]">
              Pilih email untuk melihat preview.
            </div>
          )}
        </div>
      </div>
    </section>
  );
};

const CheckEmailPage = () => {
  const [searchParams] = useSearchParams();
  const requestId = searchParams.get("requestId") ?? "";

  return (
    <section className="text-center">
      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full border border-[#123A5A] bg-[#08233B] text-[#38BDF8]">
        <Mail aria-hidden="true" className="h-7 w-7" />
      </div>
      <p className="mt-5 text-sm font-semibold uppercase tracking-wide text-[#0F7BFF]">
        Account Recovery
      </p>
      <h1 className="mt-3 text-3xl font-bold text-[#F8FAFC]">
        Check Your Email
      </h1>
      <p className="mx-auto mt-3 max-w-xl whitespace-pre-line text-sm leading-6 text-[#CBD5E1]">
        {GENERIC_MESSAGE}
      </p>

      {env.ENABLE_MOCK_EMAIL ? (
        <MockEmailInbox requestId={requestId} />
      ) : null}

      <Link
        className="mt-8 inline-flex text-sm font-medium text-[#00C8FF] transition-colors hover:text-[#F8FAFC]"
        to="/login"
      >
        Back to Login
      </Link>
    </section>
  );
};

export default CheckEmailPage;
