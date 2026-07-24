import { ChevronLeft, ChevronRight } from "lucide-react";

import DocumentActionGroup from "@/features/document-register/components/DocumentActionGroup";
import { DOCUMENT_STATUS } from "@/features/document-register/constants/document.constants";
import {
  formatTimeForReview,
  getSlaTimerTextClassName,
  getSlaTimerTooltip,
  resolveCurrentAssigneeRoleDisplay,
} from "@/features/sla-management/utils/sla-timer-display";
import SelectDropdown from "@/shared/components/form/SelectDropdown";

const controlClassName =
  "h-10 rounded-md border border-[#123A5A] bg-[#08233B] px-3 text-sm text-[#F8FAFC] outline-none transition-colors focus:border-[#0F7BFF]";
const paginationButtonClassName =
  "inline-flex h-9 min-w-9 items-center justify-center gap-2 rounded-md border border-[#123A5A] px-3 text-sm font-semibold transition-colors hover:border-[#0F7BFF] hover:bg-[#0B2B47] disabled:cursor-not-allowed disabled:text-[#64748B]";
const activePaginationButtonClassName =
  "inline-flex h-9 min-w-9 items-center justify-center rounded-md border border-[#0F7BFF] bg-[#0F7BFF] px-3 text-sm font-bold text-white";

const levelStyles = {
  "Level 1": "border-[#FACC15]/40 bg-[#FACC15]/15 text-[#FDE68A]",
  "Level 2": "border-[#F97316]/40 bg-[#F97316]/15 text-[#FDBA74]",
  "Level 3": "border-[#EF4444]/40 bg-[#EF4444]/15 text-[#FCA5A5]",
  "Level 4": "border-[#B91C1C]/70 bg-[#450A0A] text-[#FCA5A5]",
};

const statusStyles = {
  [DOCUMENT_STATUS.PROCESS_REVIEW]:
    "border-[#F97316]/40 bg-[#F97316]/15 text-[#FDBA74]",
  [DOCUMENT_STATUS.PROCESS_COMMENT]:
    "border-[#F97316]/40 bg-[#F97316]/15 text-[#FDBA74]",
  [DOCUMENT_STATUS.PROCESS_REJECT]:
    "border-[#EF4444]/40 bg-[#EF4444]/15 text-[#FCA5A5]",
  [DOCUMENT_STATUS.PROJECT_REVIEW]:
    "border-[#FACC15]/40 bg-[#FACC15]/15 text-[#FDE68A]",
  [DOCUMENT_STATUS.PROJECT_COMMENT]:
    "border-[#F97316]/40 bg-[#F97316]/15 text-[#FDBA74]",
  [DOCUMENT_STATUS.PROJECT_REJECT]:
    "border-[#EF4444]/40 bg-[#EF4444]/15 text-[#FCA5A5]",
};

const getPaginationItems = (totalPages, currentPage) => {
  if (totalPages <= 7) {
    return Array.from({ length: totalPages }, (_, index) => index + 1);
  }

  const visiblePages = new Set([1, totalPages]);

  for (
    let page = Math.max(2, currentPage - 2);
    page <= Math.min(totalPages - 1, currentPage + 2);
    page += 1
  ) {
    visiblePages.add(page);
  }

  const sortedPages = [...visiblePages].sort(
    (firstPage, secondPage) => firstPage - secondPage,
  );
  const paginationItems = [];

  sortedPages.forEach((page, index) => {
    const previousPage = sortedPages[index - 1];

    if (previousPage && page - previousPage > 1) {
      paginationItems.push(`ellipsis-${previousPage}-${page}`);
    }

    paginationItems.push(page);
  });

  return paginationItems;
};

const Badge = ({ children, className }) => (
  <span
    className={[
      "inline-flex whitespace-nowrap rounded-md border px-2 py-1 text-xs font-semibold",
      className,
    ].join(" ")}
  >
    {children}
  </span>
);

export const EscalationAlertTable = ({
  isLoading,
  levelFilter,
  levelOptions,
  pageNumber,
  pageSize,
  refreshEscalations,
  rows,
  searchValue,
  setLevelFilter,
  setPageNumber,
  setPageSize,
  setSearchValue,
  setSortBy,
  setStatusFilter,
  sortBy,
  startIndex,
  statusFilter,
  statusOptions,
  totalPages,
}) => {
  const paginationItems = getPaginationItems(totalPages, pageNumber);

  return (
    <section className="overflow-hidden rounded-lg border border-[#123A5A] bg-[#061B2F]">
      <div className="flex flex-col gap-4 border-b border-[#123A5A] px-4 py-4 xl:flex-row xl:items-center xl:justify-between">
        <div>
          <h2 className="text-xl font-bold">Escalation Table</h2>
          <p className="mt-1 text-sm text-[#94A3B8]">
            Dokumen Overdue berdasarkan hasil evaluasi SLA Monitoring.
          </p>
        </div>

        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-[minmax(220px,1fr)_160px_180px_170px_96px]">
          <input
            className={controlClassName}
            onChange={(event) => setSearchValue(event.target.value)}
            placeholder="Search escalation..."
            type="search"
            value={searchValue}
          />
          <SelectDropdown
            className={controlClassName}
            onChange={(event) => setLevelFilter(event.target.value)}
            value={levelFilter}
          >
            <option value="">All Level</option>
            {levelOptions.map((level) => (
              <option key={level} value={level}>
                {level}
              </option>
            ))}
          </SelectDropdown>
          <SelectDropdown
            className={controlClassName}
            onChange={(event) => setStatusFilter(event.target.value)}
            value={statusFilter}
          >
            <option value="">All Status</option>
            {statusOptions.map((status) => (
              <option key={status} value={status}>
                {status}
              </option>
            ))}
          </SelectDropdown>
          <SelectDropdown
            className={controlClassName}
            onChange={(event) => setSortBy(event.target.value)}
            value={sortBy}
          >
            <option value="escalationLevel">Highest Level</option>
            <option value="daysOverdue">Days Overdue</option>
            <option value="documentNumber">Document Number</option>
            <option value="slaTimer">SLA Timer</option>
          </SelectDropdown>
          <SelectDropdown
            className={controlClassName}
            onChange={(event) => setPageSize(Number(event.target.value))}
            value={pageSize}
          >
            <option value={5}>5</option>
            <option value={10}>10</option>
            <option value={20}>20</option>
          </SelectDropdown>
        </div>
      </div>

      <div className="max-h-[60vh] overflow-auto scroll-smooth">
        <table className="w-max min-w-full border-collapse text-left text-sm">
          <thead className="bg-[#08233B] text-xs uppercase text-[#CBD5E1]">
            <tr>
              <th className="sticky top-0 z-20 w-16 bg-[#08233B] px-4 py-3 font-bold">No</th>
              <th className="sticky top-0 z-20 min-w-28 bg-[#08233B] px-4 py-3 font-bold">Level</th>
              <th className="sticky top-0 z-20 min-w-44 bg-[#08233B] px-4 py-3 font-bold">Document Number</th>
              <th className="sticky top-0 z-20 min-w-72 bg-[#08233B] px-4 py-3 font-bold">Description</th>
              <th className="sticky top-0 z-20 min-w-40 bg-[#08233B] px-4 py-3 font-bold">Status</th>
              <th className="sticky top-0 z-20 min-w-36 bg-[#08233B] px-4 py-3 font-bold">Days Overdue</th>
              <th className="sticky top-0 z-20 min-w-52 bg-[#08233B] px-4 py-3 font-bold">SLA Timer</th>
              <th className="sticky top-0 z-20 min-w-40 bg-[#08233B] px-4 py-3 font-bold">Time for Review</th>
              <th className="sticky top-0 z-20 min-w-52 bg-[#08233B] px-4 py-3 font-bold">Current Assignee</th>
              <th className="sticky right-0 top-0 z-30 min-w-40 bg-[#08233B] px-4 py-3 font-bold shadow-[-8px_0_16px_rgba(2,11,22,0.35)]">
                Actions
              </th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td className="px-4 py-8 text-center text-[#94A3B8]" colSpan={10}>
                  Loading Escalation Alert...
                </td>
              </tr>
            ) : null}

            {!isLoading && rows.length === 0 ? (
              <tr>
                <td className="px-4 py-8 text-center text-[#94A3B8]" colSpan={10}>
                  Tidak ada dokumen yang sedang mengalami eskalasi.
                </td>
              </tr>
            ) : null}

            {!isLoading
              ? rows.map((item, rowIndex) => (
                  <tr
                    className="group border-t border-[#123A5A] text-[#F8FAFC] transition-colors hover:bg-[#08233B]"
                    key={item.id}
                  >
                    <td className="px-4 py-3 text-[#CBD5E1]">
                      {startIndex + rowIndex + 1}
                    </td>
                    <td className="px-4 py-3">
                      <Badge className={levelStyles[item.escalationLevel]}>
                        {item.escalationLevel}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 font-semibold text-[#00C8FF]">
                      {item.documentNumber}
                    </td>
                    <td className="px-4 py-3 text-[#CBD5E1]">
                      {item.description}
                    </td>
                    <td className="px-4 py-3">
                      <Badge
                        className={
                          statusStyles[item.status] ??
                          "border-[#123A5A] bg-[#08233B] text-[#CBD5E1]"
                        }
                      >
                        {item.status}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 font-semibold text-[#FCA5A5]">
                      {item.daysOverdue}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={getSlaTimerTextClassName(item.slaStatus)}
                        title={getSlaTimerTooltip(item.slaStatus)}
                      >
                        {item.slaTimer?.display ?? "-"}
                      </span>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-[#CBD5E1]">
                      {formatTimeForReview(item.daysUntilValidation)}
                    </td>
                    <td className="px-4 py-3 text-[#CBD5E1]">
                      {resolveCurrentAssigneeRoleDisplay(item)}
                    </td>
                    <td className="sticky right-0 z-10 bg-[#061B2F] px-4 py-3 shadow-[-8px_0_16px_rgba(2,11,22,0.28)] transition-colors group-hover:bg-[#08233B]">
                      <DocumentActionGroup
                        actionMode="readOnly"
                        documentItem={item}
                        onWorkflowComplete={refreshEscalations}
                      />
                    </td>
                  </tr>
                ))
              : null}
          </tbody>
        </table>
      </div>

      <div className="flex flex-col gap-3 border-t border-[#123A5A] px-4 py-4 text-sm text-[#CBD5E1] md:flex-row md:items-center md:justify-between">
        <p>
          Page {pageNumber} of {totalPages}
        </p>
        <div className="flex flex-wrap items-center gap-2">
          <button
            className={paginationButtonClassName}
            disabled={pageNumber <= 1}
            onClick={() => setPageNumber(pageNumber - 1)}
            type="button"
          >
            <ChevronLeft className="h-4 w-4" />
            Previous
          </button>
          {totalPages > 1
            ? paginationItems.map((paginationItem) =>
                typeof paginationItem === "number" ? (
                  <button
                    className={
                      paginationItem === pageNumber
                        ? activePaginationButtonClassName
                        : paginationButtonClassName
                    }
                    disabled={paginationItem === pageNumber}
                    key={paginationItem}
                    onClick={() => setPageNumber(paginationItem)}
                    type="button"
                  >
                    {paginationItem}
                  </button>
                ) : (
                  <span
                    className="inline-flex h-9 min-w-9 items-center justify-center px-2 text-sm font-semibold text-[#94A3B8]"
                    key={paginationItem}
                  >
                    ...
                  </span>
                ),
              )
            : (
                <span className={activePaginationButtonClassName}>1</span>
              )}
          <button
            className={paginationButtonClassName}
            disabled={pageNumber >= totalPages}
            onClick={() => setPageNumber(pageNumber + 1)}
            type="button"
          >
            Next
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>
    </section>
  );
};

export default EscalationAlertTable;
