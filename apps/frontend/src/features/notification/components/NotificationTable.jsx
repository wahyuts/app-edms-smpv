import {
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  Eye,
  MailCheck,
  RefreshCw,
  Trash2,
} from "lucide-react";
import { useEffect, useRef } from "react";

import SelectDropdown from "@/shared/components/form/SelectDropdown";

const controlClassName =
  "h-10 rounded-md border border-[#123A5A] bg-[#08233B] px-3 text-sm text-[#F8FAFC] outline-none transition-colors focus:border-[#0F7BFF]";
const paginationButtonClassName =
  "inline-flex h-9 min-w-9 items-center justify-center gap-2 rounded-md border border-[#123A5A] px-3 text-sm font-semibold transition-colors hover:border-[#0F7BFF] hover:bg-[#0B2B47] disabled:cursor-not-allowed disabled:text-[#64748B]";
const activePaginationButtonClassName =
  "inline-flex h-9 min-w-9 items-center justify-center rounded-md border border-[#0F7BFF] bg-[#0F7BFF] px-3 text-sm font-bold text-white";
const actionButtonClassName =
  "inline-flex h-9 items-center justify-center gap-2 rounded-md border border-[#123A5A] px-3 text-xs font-semibold text-[#CBD5E1] transition-colors hover:border-[#0F7BFF] hover:bg-[#0B2B47] hover:text-white disabled:cursor-not-allowed disabled:text-[#64748B]";
const dangerButtonClassName =
  "inline-flex h-9 items-center justify-center gap-2 rounded-md border border-[#EF4444] bg-[#EF4444]/15 px-3 text-xs font-semibold text-[#FCA5A5] transition-colors hover:bg-[#EF4444] hover:text-white disabled:cursor-not-allowed disabled:border-[#7F1D1D] disabled:text-[#64748B]";
const checkboxClassName =
  "h-4 w-4 rounded border-[#123A5A] bg-[#08233B] text-[#0F7BFF] focus:ring-2 focus:ring-[#0F7BFF] focus:ring-offset-2 focus:ring-offset-[#061B2F]";

const statusStyles = {
  Read: "border-[#22C55E]/40 bg-[#22C55E]/15 text-[#86EFAC]",
  Unread: "border-[#FACC15]/40 bg-[#FACC15]/15 text-[#FDE68A]",
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

const hasOpenableDocumentTarget = (notification) =>
  Boolean(
    notification?.relatedResourceId ||
      notification?.relatedDocumentNumber ||
      notification?.actionTarget,
  );

export const NotificationTable = ({
  eventTypeFilter,
  eventTypeOptions,
  hasActiveFilter,
  isBulkDeletePending,
  isCurrentPageSelected,
  isCurrentPageSelectionIndeterminate,
  isError,
  isLoading,
  isMarkAllAsReadPending,
  isMarkAsReadPending,
  isMarkSelectedAsReadPending,
  onBulkDeleteRequest,
  onBulkMarkAsRead,
  onMarkAllAsRead,
  onMarkAsRead,
  onOpenTarget,
  onRetry,
  onViewDetail,
  openingNotificationId = null,
  pageNumber,
  pageSize,
  readStatusFilter,
  readStatusFilterOptions,
  rows,
  searchValue,
  selectedCount,
  selectedNotificationIdSet,
  setEventTypeFilter,
  setPageNumber,
  setPageSize,
  setReadStatusFilter,
  setSearchValue,
  setSortDirection,
  sortDirection,
  sortOptions,
  startIndex,
  summary,
  toggleCurrentPageSelection,
  toggleNotificationSelection,
  totalPages,
}) => {
  const selectAllCheckboxRef = useRef(null);
  const paginationItems = getPaginationItems(totalPages, pageNumber);
  const emptyMessage = hasActiveFilter
    ? "Tidak ada Notification yang sesuai dengan pencarian atau filter."
    : "Belum ada Notification untuk akun ini.";
  const isBulkActionPending = isBulkDeletePending || isMarkSelectedAsReadPending;

  useEffect(() => {
    if (selectAllCheckboxRef.current) {
      selectAllCheckboxRef.current.indeterminate = isCurrentPageSelectionIndeterminate;
    }
  }, [isCurrentPageSelectionIndeterminate]);

  return (
    <section className="overflow-hidden rounded-lg border border-[#123A5A] bg-[#061B2F]">
      <div className="flex flex-col gap-4 border-b border-[#123A5A] px-4 py-4 xl:flex-row xl:items-center xl:justify-between">
        <div>
          <h2 className="text-xl font-bold">Notification List</h2>
          <p className="mt-1 text-sm text-[#94A3B8]">
            Daftar personal notification berdasarkan tindakan yang perlu ditinjau.
          </p>
        </div>

        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-[minmax(220px,1fr)_170px_210px_150px_96px_auto]">
          <input
            className={controlClassName}
            onChange={(event) => setSearchValue(event.target.value)}
            placeholder="Search notification..."
            type="search"
            value={searchValue}
          />
          <SelectDropdown
            className={controlClassName}
            onChange={(event) => setReadStatusFilter(event.target.value)}
            value={readStatusFilter}
          >
            {readStatusFilterOptions.map((option) => (
              <option key={option.label} value={option.value}>
                {option.label}
              </option>
            ))}
          </SelectDropdown>
          <SelectDropdown
            className={controlClassName}
            onChange={(event) => setEventTypeFilter(event.target.value)}
            value={eventTypeFilter}
          >
            <option value="">All Event Type</option>
            {eventTypeOptions.map((eventType) => (
              <option key={eventType} value={eventType}>
                {eventType}
              </option>
            ))}
          </SelectDropdown>
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
          <SelectDropdown
            className={controlClassName}
            onChange={(event) => setPageSize(Number(event.target.value))}
            value={pageSize}
          >
            <option value={5}>5</option>
            <option value={10}>10</option>
            <option value={20}>20</option>
          </SelectDropdown>
          <button
            className={actionButtonClassName}
            disabled={
              isMarkAllAsReadPending ||
              isLoading ||
              Number(summary?.unread ?? 0) === 0
            }
            onClick={onMarkAllAsRead}
            type="button"
          >
            <MailCheck className="h-4 w-4" />
            Mark All as Read
          </button>
        </div>
      </div>

      {selectedCount > 0 ? (
        <div className="flex flex-col gap-3 border-b border-[#123A5A] bg-[#08233B]/60 px-4 py-3 text-sm text-[#F8FAFC] md:flex-row md:items-center md:justify-between">
          <p className="font-semibold">
            {selectedCount} Notification dipilih
          </p>
          <div className="flex flex-wrap gap-2">
            <button
              className={actionButtonClassName}
              disabled={isBulkActionPending || isLoading}
              onClick={onBulkMarkAsRead}
              type="button"
            >
              <MailCheck className="h-4 w-4" />
              Tandai Sudah Dibaca
            </button>
            <button
              className={dangerButtonClassName}
              disabled={isBulkActionPending || isLoading}
              onClick={onBulkDeleteRequest}
              type="button"
            >
              <Trash2 className="h-4 w-4" />
              Hapus
            </button>
          </div>
        </div>
      ) : null}

      <div className="max-h-[62vh] overflow-auto scroll-smooth">
        <table className="w-max min-w-full border-collapse text-left text-sm">
          <thead className="bg-[#08233B] text-xs uppercase text-[#CBD5E1]">
            <tr>
              <th className="sticky top-0 z-20 w-12 bg-[#08233B] px-4 py-3 font-bold">
                <input
                  aria-label="Pilih semua Notification pada halaman aktif"
                  checked={isCurrentPageSelected}
                  className={checkboxClassName}
                  disabled={isLoading || isError || rows.length === 0}
                  onChange={toggleCurrentPageSelection}
                  ref={selectAllCheckboxRef}
                  type="checkbox"
                />
              </th>
              <th className="sticky top-0 z-20 w-16 bg-[#08233B] px-4 py-3 font-bold">No</th>
              <th className="sticky top-0 z-20 min-w-32 bg-[#08233B] px-4 py-3 font-bold">Status</th>
              <th className="sticky top-0 z-20 min-w-56 bg-[#08233B] px-4 py-3 font-bold">Title</th>
              <th className="sticky top-0 z-20 min-w-80 bg-[#08233B] px-4 py-3 font-bold">Message</th>
              <th className="sticky top-0 z-20 min-w-44 bg-[#08233B] px-4 py-3 font-bold">Related Document</th>
              <th className="sticky top-0 z-20 min-w-52 bg-[#08233B] px-4 py-3 font-bold">Event Type</th>
              <th className="sticky top-0 z-20 min-w-44 bg-[#08233B] px-4 py-3 font-bold">Created At</th>
              <th className="sticky right-0 top-0 z-30 min-w-64 bg-[#08233B] px-4 py-3 font-bold shadow-[-8px_0_16px_rgba(2,11,22,0.35)]">
                Actions
              </th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td className="px-4 py-8 text-center text-[#94A3B8]" colSpan={9}>
                  Loading Notification...
                </td>
              </tr>
            ) : null}

            {!isLoading && isError ? (
              <tr>
                <td className="px-4 py-8 text-center" colSpan={9}>
                  <div className="flex flex-col items-center gap-3 text-[#CBD5E1]">
                    <p>Notification tidak dapat dimuat.</p>
                    <button
                      className={actionButtonClassName}
                      onClick={onRetry}
                      type="button"
                    >
                      <RefreshCw className="h-4 w-4" />
                      Retry
                    </button>
                  </div>
                </td>
              </tr>
            ) : null}

            {!isLoading && !isError && rows.length === 0 ? (
              <tr>
                <td className="px-4 py-8 text-center text-[#94A3B8]" colSpan={9}>
                  {emptyMessage}
                </td>
              </tr>
            ) : null}

            {!isLoading && !isError
              ? rows.map((notification, rowIndex) => {
                  const isUnread = !notification.read;
                  const isOpening = openingNotificationId === notification.id;
                  const isSelected = selectedNotificationIdSet.has(notification.id);

                  return (
                    <tr
                      className={[
                        "group border-t border-[#123A5A] transition-colors hover:bg-[#08233B]",
                        isUnread ? "bg-[#08233B]/40 text-white" : "text-[#F8FAFC]",
                      ].join(" ")}
                      key={notification.id}
                    >
                      <td className="px-4 py-3">
                        <input
                          aria-label={`Pilih Notification ${notification.title}`}
                          checked={isSelected}
                          className={checkboxClassName}
                          onChange={() => toggleNotificationSelection(notification.id)}
                          type="checkbox"
                        />
                      </td>
                      <td className="px-4 py-3 text-[#CBD5E1]">
                        {startIndex + rowIndex + 1}
                      </td>
                      <td className="px-4 py-3">
                        <span className="inline-flex items-center gap-2">
                          {isUnread ? (
                            <span className="h-2.5 w-2.5 rounded-full bg-[#FACC15]" />
                          ) : null}
                          <Badge
                            className={
                              statusStyles[notification.readStatus] ??
                              "border-[#123A5A] bg-[#08233B] text-[#CBD5E1]"
                            }
                          >
                            {notification.readStatus}
                          </Badge>
                        </span>
                      </td>
                      <td
                        className={[
                          "px-4 py-3",
                          isUnread ? "font-bold text-[#F8FAFC]" : "font-semibold text-[#CBD5E1]",
                        ].join(" ")}
                      >
                        {notification.title}
                      </td>
                      <td className="max-w-[28rem] px-4 py-3 text-[#CBD5E1]">
                        <span className="line-clamp-2">{notification.message}</span>
                      </td>
                      <td className="px-4 py-3 font-semibold text-[#00C8FF]">
                        {notification.relatedDocumentNumber ?? "-"}
                      </td>
                      <td className="px-4 py-3 text-[#CBD5E1]">
                        {notification.eventType}
                      </td>
                      <td className="px-4 py-3 text-[#CBD5E1]">
                        {formatDateTime(notification.createdAt)}
                      </td>
                      <td className="sticky right-0 z-10 bg-[#061B2F] px-4 py-3 shadow-[-8px_0_16px_rgba(2,11,22,0.28)] transition-colors group-hover:bg-[#08233B]">
                        <div className="flex flex-wrap gap-2">
                          <button
                            className={actionButtonClassName}
                            onClick={() => onViewDetail(notification)}
                            type="button"
                          >
                            <Eye className="h-4 w-4" />
                            View
                          </button>
                          {isUnread ? (
                            <button
                              className={actionButtonClassName}
                              disabled={isMarkAsReadPending}
                              onClick={() => onMarkAsRead(notification.id)}
                              type="button"
                            >
                              <MailCheck className="h-4 w-4" />
                              Read
                            </button>
                          ) : null}
                          {hasOpenableDocumentTarget(notification) ? (
                            <button
                              className={actionButtonClassName}
                              disabled={Boolean(openingNotificationId)}
                              onClick={() => onOpenTarget(notification)}
                              type="button"
                            >
                              <ExternalLink className="h-4 w-4" />
                              {isOpening ? "Opening..." : "Open"}
                            </button>
                          ) : null}
                        </div>
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

export default NotificationTable;
