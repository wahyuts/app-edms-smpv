const summaryItems = [
  {
    key: "total",
    label: "Total Escalation",
    tone: "border-[#EF4444]/50 bg-[#EF4444]/15 text-[#FCA5A5]",
  },
  {
    key: "Level 1",
    label: "Level 1",
    tone: "border-[#FACC15]/50 bg-[#FACC15]/15 text-[#FDE68A]",
  },
  {
    key: "Level 2",
    label: "Level 2",
    tone: "border-[#F97316]/50 bg-[#F97316]/15 text-[#FDBA74]",
  },
  {
    key: "Level 3",
    label: "Level 3",
    tone: "border-[#EF4444]/50 bg-[#EF4444]/15 text-[#FCA5A5]",
  },
  {
    key: "Level 4",
    label: "Level 4",
    tone: "border-[#B91C1C]/60 bg-[#450A0A] text-[#FCA5A5]",
  },
];

export const EscalationSummary = ({ summary }) => {
  return (
    <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
      {summaryItems.map((item) => (
        <article
          className={[
            "rounded-lg border p-4",
            item.tone,
          ].join(" ")}
          key={item.key}
        >
          <p className="text-sm font-semibold text-[#CBD5E1]">{item.label}</p>
          <p className="mt-3 text-4xl font-extrabold">
            {summary[item.key] ?? 0}
          </p>
        </article>
      ))}
    </section>
  );
};

export default EscalationSummary;
