import { createPortal } from "react-dom";
import { X } from "lucide-react";

const fieldLabelClassName = "text-xs font-semibold uppercase text-[#94A3B8]";
const valueClassName = "mt-1 break-words text-sm font-semibold text-[#F8FAFC]";
const primaryButtonClassName =
  "inline-flex h-9 items-center justify-center rounded-md bg-[#0F7BFF] px-4 text-sm font-semibold text-white transition-colors hover:bg-[#0B63CC]";

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

const DetailField = ({ label, value }) => (
  <div className="rounded-md border border-[#123A5A] bg-[#08233B] p-3">
    <p className={fieldLabelClassName}>{label}</p>
    <p className={valueClassName}>{value || "-"}</p>
  </div>
);

const MetadataViewer = ({ metadata }) => {
  const hasMetadata = metadata && Object.keys(metadata).length > 0;

  if (!hasMetadata) return null;

  return (
    <div>
      <p className={fieldLabelClassName}>Metadata</p>
      <pre className="mt-2 max-h-64 overflow-auto rounded-md border border-[#123A5A] bg-[#031528] p-3 text-xs leading-5 text-[#CBD5E1]">
        {JSON.stringify(metadata, null, 2)}
      </pre>
    </div>
  );
};

export const AuditTrailDetailModal = ({ auditRecord, onClose }) => {
  if (!auditRecord) return null;

  return createPortal(
    <div className="fixed inset-0 z-[9000] flex items-center justify-center bg-[#020B16]/80 px-4 py-6">
      <section className="flex max-h-[90vh] w-full max-w-3xl flex-col overflow-hidden rounded-lg border border-[#123A5A] bg-[#061B2F] text-[#F8FAFC] shadow-2xl">
        <header className="flex items-center justify-between border-b border-[#123A5A] px-5 py-4">
          <div>
            <h2 className="text-xl font-bold">Audit Trail Detail</h2>
            <p className="mt-1 text-sm text-[#94A3B8]">
              Read-only activity record.
            </p>
          </div>
          <button
            aria-label="Close audit detail"
            className="rounded-md p-1.5 text-[#CBD5E1] transition-colors hover:bg-[#0B2B47] hover:text-white"
            onClick={onClose}
            type="button"
          >
            <X className="h-4 w-4" />
          </button>
        </header>

        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4">
          <div className="grid gap-3 md:grid-cols-2">
            <DetailField label="Timestamp" value={formatDateTime(auditRecord.createdAt)} />
            <DetailField label="User" value={auditRecord.actorName} />
            <DetailField label="Official Role" value={auditRecord.officialRole} />
            <DetailField label="Department" value={auditRecord.department} />
            <DetailField label="Action" value={auditRecord.action} />
            <DetailField label="Business Event" value={auditRecord.businessEvent} />
            <DetailField label="Resource Type" value={auditRecord.resourceType} />
            <DetailField label="Reference" value={auditRecord.reference} />
          </div>
          <div className="mt-3 rounded-md border border-[#123A5A] bg-[#08233B] p-3">
            <p className={fieldLabelClassName}>Detail</p>
            <p className="mt-1 text-sm font-semibold text-[#F8FAFC]">
              {auditRecord.detail}
            </p>
          </div>
          <div className="mt-3">
            <MetadataViewer metadata={auditRecord.metadata} />
          </div>
        </div>

        <footer className="flex justify-end border-t border-[#123A5A] px-5 py-4">
          <button className={primaryButtonClassName} onClick={onClose} type="button">
            Close
          </button>
        </footer>
      </section>
    </div>,
    document.body,
  );
};

export default AuditTrailDetailModal;
