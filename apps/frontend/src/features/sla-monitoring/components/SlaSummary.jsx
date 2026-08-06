import { Loader2 } from "lucide-react";

import { SLA_STATUS } from "@/features/document-register/constants/document.constants";

const summaryItems = [
  {
    key: SLA_STATUS.ON_TRACK,
    label: "On Track",
    tone: "border-[#22C55E]/50 bg-[#22C55E]/15 text-[#86EFAC]",
  },
  {
    key: SLA_STATUS.AT_RISK,
    label: "At Risk",
    tone: "border-[#FACC15]/50 bg-[#FACC15]/15 text-[#FDE68A]",
  },
  {
    key: SLA_STATUS.OVERDUE,
    label: "Overdue",
    tone: "border-[#EF4444]/50 bg-[#EF4444]/15 text-[#FCA5A5]",
  },
  {
    key: SLA_STATUS.FINAL_AS_BUILT,
    label: "Final As-Built",
    tone: "border-[#00C8FF]/50 bg-[#00C8FF]/15 text-[#7DD3FC]",
  },
];

const LoadingValue = () => (
  <Loader2
    aria-label="Loading SLA summary value"
    className="inline-block h-8 w-8 animate-spin"
    role="status"
  />
);

export const SlaSummary = ({ isLoading = false, onSelectSlaStatus, selectedSlaStatus, summary }) => {
  return (
    <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      {summaryItems.map((item) => {
        const isSelected = selectedSlaStatus === item.key;

        return (
          <button
            className={[
              "rounded-lg border p-4 text-left transition-colors hover:border-[#0F7BFF]",
              item.tone,
              isSelected ? "ring-2 ring-[#0F7BFF]/50" : "",
            ].join(" ")}
            key={item.key}
            onClick={() => onSelectSlaStatus(item.key)}
            type="button"
          >
            <p className="text-sm font-semibold text-[#CBD5E1]">{item.label}</p>
            <p className="mt-3 text-4xl font-extrabold">
              {isLoading ? <LoadingValue /> : summary[item.key] ?? 0}
            </p>
          </button>
        );
      })}
    </section>
  );
};

export default SlaSummary;
