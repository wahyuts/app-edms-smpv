import { useCallback, useState } from "react";
import { ChevronLeft, ChevronRight, ClipboardList } from "lucide-react";

import SelectDropdown from "@/shared/components/form/SelectDropdown";
import { usePermission } from "@/shared/hooks/usePermission";
import { useProjectContextStore } from "@/shared/stores/project-context.store";
import {
  getSlaTimerTextClassName,
  getSlaTimerTooltip,
} from "@/features/sla-management/utils/sla-timer-display";

import DocumentActionGroup from "./DocumentActionGroup";
import {
  DOCUMENT_REVISION,
  DOCUMENT_LIFECYCLE,
  DOCUMENT_LIFECYCLE_FILTER,
  DOCUMENT_REGISTER_PERMISSION,
  DOCUMENT_STATUS,
} from "../constants/document.constants";

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
  [DOCUMENT_STATUS.APPROVED]:
    "border-[#22C55E]/40 bg-[#22C55E]/15 text-[#86EFAC]",
};

const controlClassName =
  "h-10 rounded-md border border-[#123A5A] bg-[#08233B] px-3 text-sm text-[#F8FAFC] outline-none transition-colors focus:border-[#0F7BFF]";
const paginationButtonClassName =
  "inline-flex h-9 min-w-9 items-center justify-center gap-2 rounded-md border border-[#123A5A] px-3 text-sm font-semibold transition-colors hover:border-[#0F7BFF] hover:bg-[#0B2B47] disabled:cursor-not-allowed disabled:text-[#64748B]";
const activePaginationButtonClassName =
  "inline-flex h-9 min-w-9 items-center justify-center rounded-md border border-[#0F7BFF] bg-[#0F7BFF] px-3 text-sm font-bold text-white";

const fixedStatusOptions = [
  DOCUMENT_STATUS.PROCESS_REVIEW,
  DOCUMENT_STATUS.PROCESS_COMMENT,
  DOCUMENT_STATUS.PROCESS_REJECT,
  DOCUMENT_STATUS.PROJECT_REVIEW,
  DOCUMENT_STATUS.PROJECT_COMMENT,
  DOCUMENT_STATUS.PROJECT_REJECT,
  DOCUMENT_STATUS.APPROVED,
];

const dashboardRevisionOptions = [
  DOCUMENT_REVISION.IFR_SUBMITTED,
  DOCUMENT_REVISION.IFA_SUBMITTED,
  DOCUMENT_REVISION.AS_BUILT,
];

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

const StatusBadge = ({ status }) => {
  return (
    <span
      className={[
        "inline-flex whitespace-nowrap rounded-md border px-2 py-1 text-xs font-semibold",
        statusStyles[status] ?? "border-[#123A5A] bg-[#08233B] text-[#CBD5E1]",
      ].join(" ")}
    >
      {status}
    </span>
  );
};

const LifecycleBadge = ({ lifecycle }) => {
  if (lifecycle !== DOCUMENT_LIFECYCLE.ARCHIVED) return null;

  return (
    <span className="mt-1 inline-flex w-max whitespace-nowrap rounded-md border border-[#64748B]/40 bg-[#334155]/30 px-2 py-1 text-xs font-semibold text-[#CBD5E1]">
      Archived
    </span>
  );
};

const getSlaTimerDisplay = (documentItem) => documentItem.slaTimer?.display ?? "-";

const formatCreatedDate = (value) => {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";

  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);
};

export const DocumentRegisterTable = ({
  areaFilter,
  areaOptions = [],
  drawingFilter,
  drawingOptions = [],
  error = null,
  isDashboard = false,
  isError = false,
  isLoading = false,
  canUseLifecycleFilter = false,
  lifecycleFilter = DOCUMENT_LIFECYCLE_FILTER.ACTIVE,
  pageNumber,
  pageSize,
  refreshDocuments,
  revisionFilter,
  rows = [],
  searchValue,
  setAreaFilter,
  setDrawingFilter,
  setLifecycleFilter,
  setPageNumber,
  setPageSize,
  setRevisionFilter,
  setSearchValue,
  setSortBy,
  setStatusFilter,
  sortBy,
  startIndex = 0,
  statusFilter,
  totalPages,
}) => {
  const { hasProjectPermission } = usePermission();
  useProjectContextStore((state) => state.activeOfficialRole);
  const [activeAction, setActiveAction] = useState(null);
  const canViewDocument = hasProjectPermission(DOCUMENT_REGISTER_PERMISSION.VIEW);
  const paginationItems = getPaginationItems(totalPages, pageNumber);
  const statusFilterValue = Array.isArray(statusFilter) ? "" : statusFilter;
  const setGlobalActiveAction = useCallback((nextAction) => {
    setActiveAction(nextAction);
  }, []);

  if (!canViewDocument) {
    return (
      <section className="rounded-lg border border-[#123A5A] bg-[#061B2F] p-6">
        <h2 className="text-xl font-bold">Document Register Table</h2>
        <p className="mt-2 text-sm text-[#94A3B8]">
          You do not have permission to view Document Register.
        </p>
      </section>
    );
  }

  return (
    <section className="overflow-hidden rounded-lg border border-[#123A5A] bg-[#061B2F]">
      <div className="border-b border-[#123A5A] px-4 py-4">
        <div className="flex items-center gap-3">
          {isDashboard ? (
            <span className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-[#123A5A] bg-[#08233B] text-[#CBD5E1]">
              <ClipboardList className="h-5 w-5" />
            </span>
          ) : null}
          <div>
            <h2 className="text-xl font-bold">Document Register Table</h2>
            {!isDashboard ? (
              <p className="mt-1 text-sm text-[#94A3B8]">
                Engineering Document registered in EDMS.
              </p>
            ) : null}
          </div>
        </div>

        <div
          className={[
            "mt-4 grid gap-3",
            isDashboard
              ? "md:grid-cols-[minmax(220px,1fr)_150px_150px_150px_120px]"
              : [
                  "md:grid-cols-[minmax(180px,1fr)_150px_150px_150px_150px_88px]",
                  canUseLifecycleFilter
                    ? "xl:grid-cols-[minmax(180px,1fr)_140px_140px_140px_140px_140px_88px]"
                    : "",
                ].join(" "),
          ].join(" ")}
        >
          <label className="flex flex-col gap-2 text-sm font-medium text-[#F8FAFC]">
            <span>{isDashboard ? "Search" : "Search"}</span>
            <input
              className={controlClassName}
              onChange={(event) => setSearchValue(event.target.value)}
              placeholder="Search document..."
              type="search"
              value={searchValue}
            />
          </label>
          <label className="flex flex-col gap-2 text-sm font-medium text-[#F8FAFC]">
            <span>{isDashboard ? "Filter Status" : "Status"}</span>
            <SelectDropdown
              className={controlClassName}
              onChange={(event) => setStatusFilter(event.target.value)}
              value={statusFilterValue}
            >
              <option value="">All Status</option>
              {fixedStatusOptions.map((status) => (
                <option key={status} value={status}>
                  {status}
                </option>
              ))}
            </SelectDropdown>
          </label>
          {isDashboard ? (
            <label className="flex flex-col gap-2 text-sm font-medium text-[#F8FAFC]">
              <span>Filter Revision</span>
              <SelectDropdown
                className={controlClassName}
                onChange={(event) => setRevisionFilter(event.target.value)}
                value={revisionFilter}
              >
                <option value="">All Revision</option>
                {dashboardRevisionOptions.map((revision) => (
                  <option key={revision} value={revision}>
                    {revision}
                  </option>
                ))}
              </SelectDropdown>
            </label>
          ) : null}
          {!isDashboard ? (
            <>
              <label className="flex flex-col gap-2 text-sm font-medium text-[#F8FAFC]">
                <span>Area</span>
                <SelectDropdown
                  className={controlClassName}
                  onChange={(event) => setAreaFilter(event.target.value)}
                  value={areaFilter}
                >
                  <option value="">All Area</option>
                  {areaOptions.map((area) => (
                    <option key={area} value={area}>
                      {area}
                    </option>
                  ))}
                </SelectDropdown>
              </label>
              {canUseLifecycleFilter ? (
                <label className="flex flex-col gap-2 text-sm font-medium text-[#F8FAFC]">
                  <span>Lifecycle</span>
                  <SelectDropdown
                    className={controlClassName}
                    onChange={(event) => setLifecycleFilter(event.target.value)}
                    value={lifecycleFilter}
                  >
                    <option value={DOCUMENT_LIFECYCLE_FILTER.ACTIVE}>Active</option>
                    <option value={DOCUMENT_LIFECYCLE_FILTER.ARCHIVED}>Archived</option>
                    <option value={DOCUMENT_LIFECYCLE_FILTER.ALL}>All</option>
                  </SelectDropdown>
                </label>
              ) : null}
              <label className="flex flex-col gap-2 text-sm font-medium text-[#F8FAFC]">
                <span>Drawing</span>
                <SelectDropdown
                  className={controlClassName}
                  onChange={(event) => setDrawingFilter(event.target.value)}
                  value={drawingFilter}
                >
                  <option value="">All Drawing</option>
                  {drawingOptions.map((drawing) => (
                    <option key={drawing} value={drawing}>
                      {drawing}
                    </option>
                  ))}
                </SelectDropdown>
              </label>
            </>
          ) : null}
          <label className="flex flex-col gap-2 text-sm font-medium text-[#F8FAFC]">
            <span>Sort By</span>
            <SelectDropdown
              className={controlClassName}
              onChange={(event) => setSortBy(event.target.value)}
              value={sortBy}
            >
              <option value="updatedAt">Newest First</option>
              <option value="documentNumber">Document Number</option>
              <option value="revision">Revision</option>
              <option value="status">Status</option>
            </SelectDropdown>
          </label>
          <label className="flex flex-col gap-2 text-sm font-medium text-[#F8FAFC]">
            <span>Page Size</span>
            <SelectDropdown
              className={controlClassName}
              onChange={(event) => setPageSize(Number(event.target.value))}
              value={pageSize}
            >
              <option value={5}>5</option>
              <option value={10}>10</option>
            </SelectDropdown>
          </label>
        </div>
      </div>

      <div className="max-h-[60vh] overflow-auto scroll-smooth">
        <table className="w-max min-w-full border-collapse text-left text-sm">
          <thead className="bg-[#08233B] text-xs uppercase text-[#CBD5E1]">
            <tr>
              <th className="sticky top-0 z-20 w-16 bg-[#08233B] px-4 py-3 font-bold">No</th>
              <th className="sticky top-0 z-20 min-w-44 bg-[#08233B] px-4 py-3 font-bold">Document Number</th>
              <th className="sticky top-0 z-20 min-w-72 bg-[#08233B] px-4 py-3 font-bold">Description</th>
              {isDashboard ? (
                <th className="sticky top-0 z-20 min-w-24 bg-[#08233B] px-4 py-3 font-bold">Drawing</th>
              ) : null}
              <th className="sticky top-0 z-20 min-w-40 bg-[#08233B] px-4 py-3 font-bold">Area</th>
              <th className="sticky top-0 z-20 min-w-36 bg-[#08233B] px-4 py-3 font-bold">Revision</th>
              {!isDashboard ? (
                <th className="sticky top-0 z-20 min-w-36 bg-[#08233B] px-4 py-3 font-bold">Created Date</th>
              ) : null}
              <th className="sticky top-0 z-20 min-w-40 bg-[#08233B] px-4 py-3 font-bold">Status</th>
              {isDashboard ? (
                <th className="sticky top-0 z-20 min-w-44 bg-[#08233B] px-4 py-3 font-bold">SLA Timer</th>
              ) : null}
              <th className="sticky right-0 top-0 z-30 min-w-60 bg-[#08233B] px-4 py-3 font-bold shadow-[-8px_0_16px_rgba(2,11,22,0.35)]">
                Actions
              </th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td
                  className="px-4 py-8 text-center text-[#94A3B8]"
                  colSpan={isDashboard ? 9 : 8}
                >
                  Loading Document Register...
                </td>
              </tr>
            ) : null}

            {!isLoading && isError ? (
              <tr>
                <td
                  className="px-4 py-8 text-center font-semibold text-[#FCA5A5]"
                  colSpan={isDashboard ? 9 : 8}
                >
                  {error instanceof Error ? error.message : "Document Register gagal dimuat."}
                </td>
              </tr>
            ) : null}

            {!isLoading && !isError && rows.length === 0 ? (
              <tr>
                <td
                  className="px-4 py-8 text-center text-[#94A3B8]"
                  colSpan={isDashboard ? 9 : 8}
                >
                  No Engineering Document found.
                </td>
              </tr>
            ) : null}

            {!isLoading && !isError
              ? rows.map((documentItem, rowIndex) => (
                  <tr
                    className="group border-t border-[#123A5A] text-[#F8FAFC] transition-colors hover:bg-[#08233B]"
                    key={documentItem.id}
                  >
                    <td className="px-4 py-3 text-[#CBD5E1]">
                      {startIndex + rowIndex + 1}
                    </td>
                    <td className="px-4 py-3 font-semibold text-[#00C8FF]">
                      <div className="flex flex-col">
                        <span>{documentItem.documentNumber}</span>
                        <LifecycleBadge lifecycle={documentItem.lifecycle} />
                      </div>
                    </td>
                    <td className="px-4 py-3 text-[#CBD5E1]">
                      {documentItem.description}
                    </td>
                    {isDashboard ? (
                      <td className="px-4 py-3 text-[#CBD5E1]">
                        {documentItem.drawing}
                      </td>
                    ) : null}
                    <td className="px-4 py-3 text-[#CBD5E1]">
                      {documentItem.area}
                    </td>
                    <td className="px-4 py-3 text-[#CBD5E1]">
                      {documentItem.revision}
                    </td>
                    {!isDashboard ? (
                      <td className="whitespace-nowrap px-4 py-3 text-[#CBD5E1]">
                        {formatCreatedDate(documentItem.createdDate)}
                      </td>
                    ) : null}
                    <td className="px-4 py-3">
                      <StatusBadge status={documentItem.status} />
                    </td>
                    {isDashboard ? (
                      <td className="px-4 py-3">
                        <span
                          className={getSlaTimerTextClassName(documentItem.slaStatus)}
                          title={getSlaTimerTooltip(documentItem.slaStatus)}
                        >
                          {getSlaTimerDisplay(documentItem)}
                        </span>
                      </td>
                    ) : null}
                    <td className="sticky right-0 z-10 bg-[#061B2F] px-4 py-3 shadow-[-8px_0_16px_rgba(2,11,22,0.28)] transition-colors group-hover:bg-[#08233B]">
                      <DocumentActionGroup
                        activeAction={activeAction}
                        documentItem={documentItem}
                        isDashboard={isDashboard}
                        onActiveActionChange={setGlobalActiveAction}
                        onWorkflowComplete={refreshDocuments}
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

export default DocumentRegisterTable;
