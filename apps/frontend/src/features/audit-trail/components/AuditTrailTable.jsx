import {
  ChevronLeft,
  ChevronRight,
  Eye,
  RefreshCw,
  RotateCcw,
  Trash2,
} from "lucide-react";
import { useEffect, useRef } from "react";

import SelectDropdown from "@/shared/components/form/SelectDropdown";

const controlClassName =
  "h-10 w-full rounded-md border border-[#123A5A] bg-[#08233B] px-3 text-sm text-[#F8FAFC] outline-none transition-colors placeholder:text-[#64748B] focus:border-[#0F7BFF]";
const actionButtonClassName =
  "inline-flex h-9 items-center justify-center gap-2 rounded-md border border-[#123A5A] px-3 text-xs font-semibold text-[#CBD5E1] transition-colors hover:border-[#0F7BFF] hover:bg-[#0B2B47] hover:text-white disabled:cursor-not-allowed disabled:text-[#64748B]";
const paginationButtonClassName =
  "inline-flex h-9 min-w-9 items-center justify-center gap-2 rounded-md border border-[#123A5A] px-3 text-sm font-semibold transition-colors hover:border-[#0F7BFF] hover:bg-[#0B2B47] disabled:cursor-not-allowed disabled:text-[#64748B]";
const activePaginationButtonClassName =
  "inline-flex h-9 min-w-9 items-center justify-center rounded-md border border-[#0F7BFF] bg-[#0F7BFF] px-3 text-sm font-bold text-white";
const dangerButtonClassName =
  "inline-flex h-9 items-center justify-center gap-2 rounded-md border border-[#EF4444] bg-[#EF4444]/15 px-3 text-xs font-semibold text-[#FCA5A5] transition-colors hover:bg-[#EF4444] hover:text-white disabled:cursor-not-allowed disabled:border-[#7F1D1D] disabled:text-[#64748B]";
const checkboxClassName =
  "h-4 w-4 rounded border-[#123A5A] bg-[#08233B] text-[#0F7BFF] focus:ring-2 focus:ring-[#0F7BFF] focus:ring-offset-2 focus:ring-offset-[#061B2F]";
const filterBarClassName =
  "flex flex-wrap items-center gap-3";
const searchControlClassName =
  `${controlClassName} min-w-[220px] flex-[1_1_220px]`;
const timeControlClassName =
  "min-w-[125px] flex-[1_1_125px]";
const standardFilterControlClassName =
  "min-w-[135px] flex-[1_1_135px]";
const wideFilterControlClassName =
  "min-w-[145px] flex-[1_1_145px]";
const pageSizeControlClassName =
  "min-w-20 flex-[0_1_80px]";

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
    year: "numeric",
  }).format(date);
};

const optionList = (values) =>
  values.map((value) => (
    <option key={value} value={value}>
      {value}
    </option>
  ));

export const AuditTrailTable = ({
  actionFilter,
  filterOptions,
  isAdmin,
  isBulkDeletePending,
  isCurrentPageSelected,
  isCurrentPageSelectionIndeterminate,
  isError,
  isLoading,
  officialRoleFilter,
  onBulkDeleteRequest,
  onRetry,
  onViewDetail,
  pageNumber,
  pageSize,
  resetFilters,
  resourceTypeFilter,
  rows,
  searchValue,
  selectedAuditTrailIdSet = new Set(),
  selectedCount,
  setActionFilter,
  setOfficialRoleFilter,
  setPageNumber,
  setPageSize,
  setResourceTypeFilter,
  setSearchValue,
  setSortDirection,
  setTimePeriodFilter,
  setUserFilter,
  sortDirection,
  sortOptions,
  startIndex,
  timePeriodFilter,
  timePeriodOptions,
  toggleAuditTrailSelection,
  toggleCurrentPageSelection,
  totalPages,
  userFilter,
}) => {
  const selectAllCheckboxRef = useRef(null);
  const paginationItems = getPaginationItems(totalPages, pageNumber);
  const hasActiveFilter = Boolean(
    searchValue.trim() ||
      timePeriodFilter ||
      userFilter ||
      officialRoleFilter ||
      actionFilter ||
      resourceTypeFilter,
  );
  const emptyMessage = hasActiveFilter
    ? "Tidak ada Audit Trail Record yang sesuai dengan pencarian atau filter."
    : "Belum ada Audit Trail Record.";
  const tableColumnCount = isAdmin ? 11 : 10;

  useEffect(() => {
    if (selectAllCheckboxRef.current) {
      selectAllCheckboxRef.current.indeterminate = isCurrentPageSelectionIndeterminate;
    }
  }, [isCurrentPageSelectionIndeterminate]);

  return (
    <section className="overflow-hidden rounded-lg border border-[#123A5A] bg-[#061B2F]">
      <div className="flex flex-col gap-4 border-b border-[#123A5A] px-4 py-4">
        <div>
          <h2 className="text-xl font-bold">Audit Trail List</h2>
          <p className="mt-1 text-sm text-[#94A3B8]">
            A read-only list of all significant activities recorded by the system.
          </p>
        </div>

        <div className={filterBarClassName}>
          <input
            className={searchControlClassName}
            onChange={(event) => setSearchValue(event.target.value)}
            placeholder="Search audit trail..."
            type="search"
            value={searchValue}
          />
          <div className={timeControlClassName}>
            <SelectDropdown
              className={controlClassName}
              onChange={(event) => setTimePeriodFilter(event.target.value)}
              value={timePeriodFilter}
            >
              {timePeriodOptions.map((option) => (
                <option key={option.value || option.label} value={option.value}>
                  {option.label}
                </option>
              ))}
            </SelectDropdown>
          </div>
          <div className={standardFilterControlClassName}>
            <SelectDropdown
              className={controlClassName}
              onChange={(event) => setUserFilter(event.target.value)}
              value={userFilter}
            >
              <option value="">All Users</option>
              {optionList(filterOptions.users)}
            </SelectDropdown>
          </div>
          <div className={standardFilterControlClassName}>
            <SelectDropdown
              className={controlClassName}
              onChange={(event) => setOfficialRoleFilter(event.target.value)}
              value={officialRoleFilter}
            >
              <option value="">All Roles</option>
              {optionList(filterOptions.officialRoles)}
            </SelectDropdown>
          </div>
          <div className={wideFilterControlClassName}>
            <SelectDropdown
              className={controlClassName}
              onChange={(event) => setActionFilter(event.target.value)}
              value={actionFilter}
            >
              <option value="">All Actions</option>
              {optionList(filterOptions.actions)}
            </SelectDropdown>
          </div>
          <div className={wideFilterControlClassName}>
            <SelectDropdown
              className={controlClassName}
              onChange={(event) => setResourceTypeFilter(event.target.value)}
              value={resourceTypeFilter}
            >
              <option value="">All Resources</option>
              {optionList(filterOptions.resourceTypes)}
            </SelectDropdown>
          </div>
          <div className={standardFilterControlClassName}>
            <SelectDropdown
              className={controlClassName}
              onChange={(event) => setSortDirection(event.target.value)}
              value={sortDirection}
            >
              {sortOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </SelectDropdown>
          </div>
          <div className={pageSizeControlClassName}>
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
          <button
            className={actionButtonClassName}
            disabled={!hasActiveFilter && sortDirection === "desc"}
            onClick={resetFilters}
            type="button"
          >
            <RotateCcw className="h-4 w-4" />
            Reset
          </button>
        </div>
      </div>

      {isAdmin && selectedCount > 0 ? (
        <div className="flex flex-col gap-3 border-b border-[#123A5A] bg-[#08233B]/60 px-4 py-3 text-sm text-[#F8FAFC] md:flex-row md:items-center md:justify-between">
          <p className="font-semibold">
            {selectedCount} Audit Trail dipilih
          </p>
          <button
            className={dangerButtonClassName}
            disabled={isBulkDeletePending || isLoading}
            onClick={onBulkDeleteRequest}
            type="button"
          >
            <Trash2 className="h-4 w-4" />
            Hapus
          </button>
        </div>
      ) : null}

      <div className="max-h-[62vh] overflow-auto scroll-smooth">
        <table className="w-max min-w-full border-collapse text-left text-sm">
          <thead className="bg-[#08233B] text-xs uppercase text-[#CBD5E1]">
            <tr>
              {isAdmin ? (
                <th className="sticky top-0 z-20 w-12 bg-[#08233B] px-4 py-3 font-bold">
                  <input
                    aria-label="Pilih semua Audit Trail pada halaman aktif"
                    checked={isCurrentPageSelected}
                    className={checkboxClassName}
                    disabled={isLoading || isError || rows.length === 0}
                    onChange={toggleCurrentPageSelection}
                    ref={selectAllCheckboxRef}
                    type="checkbox"
                  />
                </th>
              ) : null}
              <th className="sticky top-0 z-20 w-16 bg-[#08233B] px-4 py-3 font-bold">No</th>
              <th className="sticky top-0 z-20 min-w-44 bg-[#08233B] px-4 py-3 font-bold">Time</th>
              <th className="sticky top-0 z-20 min-w-48 bg-[#08233B] px-4 py-3 font-bold">User</th>
              <th className="sticky top-0 z-20 min-w-44 bg-[#08233B] px-4 py-3 font-bold">Official Role</th>
              <th className="sticky top-0 z-20 min-w-48 bg-[#08233B] px-4 py-3 font-bold">Department</th>
              <th className="sticky top-0 z-20 min-w-52 bg-[#08233B] px-4 py-3 font-bold">Action</th>
              <th className="sticky top-0 z-20 min-w-44 bg-[#08233B] px-4 py-3 font-bold">Resource Type</th>
              <th className="sticky top-0 z-20 min-w-52 bg-[#08233B] px-4 py-3 font-bold">Reference</th>
              <th className="sticky top-0 z-20 min-w-72 bg-[#08233B] px-4 py-3 font-bold">Detail</th>
              <th className="sticky right-0 top-0 z-30 min-w-32 bg-[#08233B] px-4 py-3 font-bold shadow-[-8px_0_16px_rgba(2,11,22,0.35)]">
                Detail
              </th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td className="px-4 py-8 text-center text-[#94A3B8]" colSpan={tableColumnCount}>
                  Loading Audit Trail...
                </td>
              </tr>
            ) : null}

            {!isLoading && isError ? (
              <tr>
                <td className="px-4 py-8 text-center" colSpan={tableColumnCount}>
                  <div className="flex flex-col items-center gap-3 text-[#CBD5E1]">
                    <p>Audit Trail tidak dapat dimuat.</p>
                    <button className={actionButtonClassName} onClick={onRetry} type="button">
                      <RefreshCw className="h-4 w-4" />
                      Retry
                    </button>
                  </div>
                </td>
              </tr>
            ) : null}

            {!isLoading && !isError && rows.length === 0 ? (
              <tr>
                <td className="px-4 py-8 text-center text-[#94A3B8]" colSpan={tableColumnCount}>
                  {emptyMessage}
                </td>
              </tr>
            ) : null}

            {!isLoading && !isError
              ? rows.map((auditRecord, rowIndex) => {
                  const isSelected = selectedAuditTrailIdSet.has(auditRecord.id);

                  return (
                    <tr
                      className="group border-t border-[#123A5A] text-[#F8FAFC] transition-colors hover:bg-[#08233B]"
                      key={auditRecord.id}
                    >
                      {isAdmin ? (
                        <td className="px-4 py-3">
                          <input
                            aria-label={`Pilih Audit Trail ${auditRecord.reference ?? auditRecord.id}`}
                            checked={isSelected}
                            className={checkboxClassName}
                            onChange={() => toggleAuditTrailSelection(auditRecord.id)}
                            type="checkbox"
                          />
                        </td>
                      ) : null}
                      <td className="px-4 py-3 text-[#CBD5E1]">
                        {startIndex + rowIndex + 1}
                      </td>
                    <td className="px-4 py-3 text-[#CBD5E1]">
                      {formatDateTime(auditRecord.createdAt)}
                    </td>
                    <td className="px-4 py-3 font-semibold text-[#F8FAFC]">
                      {auditRecord.actorName}
                    </td>
                    <td className="px-4 py-3 text-[#CBD5E1]">
                      {auditRecord.officialRole}
                    </td>
                    <td className="px-4 py-3 text-[#CBD5E1]">
                      {auditRecord.department}
                    </td>
                    <td className="px-4 py-3 font-semibold text-[#00C8FF]">
                      {auditRecord.action}
                    </td>
                    <td className="px-4 py-3 text-[#CBD5E1]">
                      {auditRecord.resourceType}
                    </td>
                    <td className="px-4 py-3 font-semibold text-[#F8FAFC]">
                      {auditRecord.reference ?? "-"}
                    </td>
                    <td className="max-w-[28rem] px-4 py-3 text-[#CBD5E1]">
                      <span className="line-clamp-2">{auditRecord.detail}</span>
                    </td>
                    <td className="sticky right-0 z-10 bg-[#061B2F] px-4 py-3 shadow-[-8px_0_16px_rgba(2,11,22,0.28)] transition-colors group-hover:bg-[#08233B]">
                      <button
                        className={actionButtonClassName}
                        onClick={() => onViewDetail(auditRecord)}
                        type="button"
                      >
                        <Eye className="h-4 w-4" />
                        View
                      </button>
                    </td>
                  </tr>
                  );
                })
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

export default AuditTrailTable;
