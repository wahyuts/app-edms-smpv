import { Activity, CalendarDays, Users } from "lucide-react";

const summaryCards = [
  {
    icon: Activity,
    key: "total",
    label: "Total Activities",
    valueClassName: "text-[#F8FAFC]",
  },
  {
    icon: CalendarDays,
    key: "today",
    label: "Today's Activities",
    valueClassName: "text-[#00C8FF]",
  },
  {
    icon: Users,
    key: "activeUsersToday",
    label: "Active Users Today",
    valueClassName: "text-[#86EFAC]",
  },
];

export const AuditTrailSummary = ({ summary }) => (
  <section className="grid gap-4 md:grid-cols-3">
    {summaryCards.map(({ icon: Icon, key, label, valueClassName }) => (
      <article
        className="rounded-lg border border-[#123A5A] bg-[#061B2F] p-4"
        key={key}
      >
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-[#94A3B8]">
              {label}
            </p>
            <p className={`mt-3 text-3xl font-bold ${valueClassName}`}>
              {summary?.[key] ?? 0}
            </p>
          </div>
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-md border border-[#123A5A] bg-[#08233B] text-[#00C8FF]">
            <Icon className="h-5 w-5" />
          </div>
        </div>
      </article>
    ))}
  </section>
);

export default AuditTrailSummary;
