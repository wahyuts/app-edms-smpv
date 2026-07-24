const summaryCards = [
  {
    key: "total",
    label: "Total Notifications",
    valueClassName: "text-[#F8FAFC]",
  },
  {
    key: "unread",
    label: "Unread Notifications",
    valueClassName: "text-[#FDE68A]",
  },
  {
    key: "read",
    label: "Read Notifications",
    valueClassName: "text-[#86EFAC]",
  },
];

export const NotificationSummary = ({ summary }) => (
  <section className="grid gap-4 md:grid-cols-3">
    {summaryCards.map((card) => (
      <div
        className="rounded-lg border border-[#123A5A] bg-[#061B2F] p-4"
        key={card.key}
      >
        <p className="text-xs font-semibold uppercase tracking-wide text-[#94A3B8]">
          {card.label}
        </p>
        <p className={`mt-3 text-3xl font-bold ${card.valueClassName}`}>
          {summary?.[card.key] ?? 0}
        </p>
      </div>
    ))}
  </section>
);

export default NotificationSummary;
