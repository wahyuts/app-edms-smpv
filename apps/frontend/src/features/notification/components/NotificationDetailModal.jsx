import { ExternalLink, X } from "lucide-react";

const actionButtonClassName =
  "inline-flex h-10 items-center justify-center gap-2 rounded-md border border-[#123A5A] px-4 text-sm font-semibold text-[#CBD5E1] transition-colors hover:border-[#0F7BFF] hover:bg-[#0B2B47] hover:text-white";
const primaryButtonClassName =
  "inline-flex h-10 items-center justify-center gap-2 rounded-md border border-[#0F7BFF] bg-[#0F7BFF] px-4 text-sm font-semibold text-white transition-colors hover:bg-[#0B65D8]";

const formatDateTime = (value) => {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";

  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    hour: "2-digit",
    hour12: false,
    minute: "2-digit",
    month: "short",
    second: "2-digit",
    year: "numeric",
  }).format(date);
};

const DetailRow = ({ label, value }) => (
  <div className="grid gap-1 border-t border-[#123A5A] py-3 md:grid-cols-[180px_1fr] md:gap-4">
    <dt className="text-xs font-semibold uppercase tracking-wide text-[#94A3B8]">
      {label}
    </dt>
    <dd className="text-sm text-[#F8FAFC]">{value ?? "-"}</dd>
  </div>
);

const hasOpenableDocumentTarget = (notification) =>
  Boolean(
    notification?.relatedResourceId ||
      notification?.relatedDocumentNumber ||
      notification?.actionTarget,
  );

export const NotificationDetailModal = ({
  isOpening = false,
  notification,
  onClose,
  onOpenTarget,
}) => {
  if (!notification) return null;

  return (
    <div className="fixed inset-0 z-[9000] flex items-center justify-center bg-[#020B16]/80 px-4 py-6">
      <section className="max-h-[90vh] w-full max-w-3xl overflow-hidden rounded-lg border border-[#123A5A] bg-[#061B2F] shadow-2xl">
        <header className="flex items-start justify-between gap-4 border-b border-[#123A5A] px-5 py-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-[#0F7BFF]">
              Notification Detail
            </p>
            <h2 className="mt-2 text-2xl font-bold">{notification.title}</h2>
            <p className="mt-2 text-sm text-[#CBD5E1]">{notification.message}</p>
          </div>
          <button
            aria-label="Close Notification Detail"
            className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-md border border-[#123A5A] text-[#CBD5E1] transition-colors hover:border-[#0F7BFF] hover:bg-[#0B2B47] hover:text-white"
            onClick={onClose}
            type="button"
          >
            <X className="h-5 w-5" />
          </button>
        </header>

        <div className="max-h-[calc(90vh-160px)] overflow-y-auto px-5 py-2">
          <dl>
            <DetailRow label="Event Type" value={notification.eventType} />
            <DetailRow
              label="Official Role"
              value={notification.officialRole ?? notification.recipientRole ?? "-"}
            />
            <DetailRow
              label="Related Document"
              value={notification.relatedDocumentNumber ?? "-"}
            />
            <DetailRow
              label="Created At"
              value={formatDateTime(notification.createdAt)}
            />
            <DetailRow label="Read Status" value={notification.readStatus} />
            <DetailRow label="Read At" value={formatDateTime(notification.readAt)} />
            <DetailRow
              label="Resource Type"
              value={notification.relatedResourceType ?? "-"}
            />
            <DetailRow
              label="Resource ID"
              value={notification.relatedResourceId ?? "-"}
            />
            <DetailRow
              label="Action Target"
              value={notification.actionTarget ?? "-"}
            />
          </dl>
        </div>

        <footer className="flex flex-col gap-3 border-t border-[#123A5A] px-5 py-4 sm:flex-row sm:justify-end">
          <button className={actionButtonClassName} onClick={onClose} type="button">
            Close
          </button>
          {hasOpenableDocumentTarget(notification) ? (
            <button
              className={primaryButtonClassName}
              disabled={isOpening}
              onClick={() => onOpenTarget(notification)}
              type="button"
            >
              <ExternalLink className="h-4 w-4" />
              {isOpening ? "Opening..." : "Open Document"}
            </button>
          ) : null}
        </footer>
      </section>
    </div>
  );
};

export default NotificationDetailModal;
