import { useMutation, useQuery } from "@tanstack/react-query";
import { useCallback, useEffect, useMemo, useState } from "react";

import { AuthService } from "@/features/auth/services/auth.service";
import { useProjectContextStore } from "@/shared/stores/project-context.store";

import {
  NOTIFICATION_EVENT_OPTIONS,
  NotificationService,
} from "../services/notification.service";

const DEFAULT_PAGE_SIZE = 10;
const DEFAULT_SORT_DIRECTION = "desc";

const READ_STATUS_FILTER_OPTIONS = [
  { label: "All Notifications", value: "" },
  { label: "Unread", value: "Unread" },
  { label: "Read", value: "Read" },
];

const SORT_OPTIONS = [
  { label: "Newest First", value: "desc" },
  { label: "Oldest First", value: "asc" },
];

export const useNotificationPage = ({ onError } = {}) => {
  const currentUser = AuthService.getCurrentUser();
  const activeProjectId = useProjectContextStore((state) => state.activeProject?.id);
  const [searchValue, setSearchValueState] = useState("");
  const [readStatusFilter, setReadStatusFilterState] = useState("");
  const [eventTypeFilter, setEventTypeFilterState] = useState("");
  const [sortDirection, setSortDirectionState] = useState(DEFAULT_SORT_DIRECTION);
  const [pageNumber, setPageNumber] = useState(1);
  const [pageSize, setPageSizeState] = useState(DEFAULT_PAGE_SIZE);
  const [selectedNotificationIds, setSelectedNotificationIds] = useState([]);

  const clearSelection = useCallback(() => {
    setSelectedNotificationIds([]);
  }, []);

  useEffect(() => {
    const resetTimeoutId = window.setTimeout(() => {
      setSearchValueState("");
      setReadStatusFilterState("");
      setEventTypeFilterState("");
      setSortDirectionState(DEFAULT_SORT_DIRECTION);
      setPageNumber(1);
      clearSelection();
    }, 0);

    return () => window.clearTimeout(resetTimeoutId);
  }, [activeProjectId, clearSelection]);

  useEffect(() => AuthService.subscribeCurrentUserChange(clearSelection), [clearSelection]);

  const query = useMemo(() => ({
    direction: sortDirection,
    eventType: eventTypeFilter,
    page: pageNumber,
    pageSize,
    readStatus: readStatusFilter,
    search: searchValue,
    sortBy: "createdAt",
  }), [
    eventTypeFilter,
    pageNumber,
    pageSize,
    readStatusFilter,
    searchValue,
    sortDirection,
  ]);

  const notificationsQuery = useQuery({
    enabled: Boolean(currentUser?.id && activeProjectId),
    queryFn: () => NotificationService.getCurrentUserNotifications(query),
    queryKey: ["notifications", "list", currentUser?.id ?? null, activeProjectId ?? null, query],
  });

  const summaryQuery = useQuery({
    enabled: Boolean(currentUser?.id && activeProjectId),
    queryFn: NotificationService.getCurrentUserNotificationSummary,
    queryKey: ["notifications", "summary", currentUser?.id ?? null, activeProjectId ?? null],
  });

  const markAsReadMutation = useMutation({
    mutationFn: NotificationService.markAsRead,
    onError,
  });

  const markAllAsReadMutation = useMutation({
    mutationFn: NotificationService.markAllAsRead,
    onError,
  });

  const markSelectedAsReadMutation = useMutation({
    mutationFn: NotificationService.markNotificationsAsRead,
    onError,
  });

  const deleteSelectedMutation = useMutation({
    mutationFn: NotificationService.deleteCurrentUserNotifications,
    onError,
  });

  const setSearchValue = (nextSearchValue) => {
    setSearchValueState(nextSearchValue);
    setPageNumber(1);
    clearSelection();
  };

  const setReadStatusFilter = (nextReadStatusFilter) => {
    setReadStatusFilterState(nextReadStatusFilter);
    setPageNumber(1);
    clearSelection();
  };

  const setEventTypeFilter = (nextEventTypeFilter) => {
    setEventTypeFilterState(nextEventTypeFilter);
    setPageNumber(1);
    clearSelection();
  };

  const setSortDirection = (nextSortDirection) => {
    setSortDirectionState(nextSortDirection);
    setPageNumber(1);
    clearSelection();
  };

  const setPageNumberAndClearSelection = (nextPageNumber) => {
    setPageNumber(nextPageNumber);
    clearSelection();
  };

  const setPageSize = (nextPageSize) => {
    setPageSizeState(nextPageSize);
    setPageNumber(1);
    clearSelection();
  };

  const refetchNotifications = () => {
    notificationsQuery.refetch();
    summaryQuery.refetch();
  };

  const notificationResponse = notificationsQuery.data ?? {
    data: [],
    pagination: {
      page: 1,
      pageSize,
      totalItems: 0,
      totalPages: 1,
    },
  };
  const pagination = notificationResponse.pagination;
  const normalizedPageNumber = pagination.page ?? pageNumber;
  const startIndex = (normalizedPageNumber - 1) * (pagination.pageSize ?? pageSize);
  const currentPageNotificationIds = notificationResponse.data.map(
    (notification) => notification.id,
  );
  const selectedNotificationIdSet = new Set(selectedNotificationIds);
  const selectedCount = selectedNotificationIds.length;
  const isCurrentPageSelected =
    currentPageNotificationIds.length > 0 &&
    currentPageNotificationIds.every((notificationId) =>
      selectedNotificationIdSet.has(notificationId),
    );
  const isCurrentPageSelectionIndeterminate =
    selectedCount > 0 && !isCurrentPageSelected;

  const toggleNotificationSelection = (notificationId) => {
    setSelectedNotificationIds((currentSelectedNotificationIds) => {
      if (currentSelectedNotificationIds.includes(notificationId)) {
        return currentSelectedNotificationIds.filter((selectedNotificationId) =>
          selectedNotificationId !== notificationId,
        );
      }

      return [...currentSelectedNotificationIds, notificationId];
    });
  };

  const toggleCurrentPageSelection = () => {
    setSelectedNotificationIds((currentSelectedNotificationIds) => {
      const currentSelectedNotificationIdSet = new Set(currentSelectedNotificationIds);
      const allCurrentPageSelected =
        currentPageNotificationIds.length > 0 &&
        currentPageNotificationIds.every((notificationId) =>
          currentSelectedNotificationIdSet.has(notificationId),
        );

      if (allCurrentPageSelected) {
        return currentSelectedNotificationIds.filter((notificationId) =>
          !currentPageNotificationIds.includes(notificationId),
        );
      }

      return [...new Set([
        ...currentSelectedNotificationIds,
        ...currentPageNotificationIds,
      ])];
    });
  };

  const markSelectedAsRead = async () => {
    const updatedNotifications = await markSelectedAsReadMutation.mutateAsync(
      selectedNotificationIds,
    );
    clearSelection();
    return updatedNotifications;
  };

  const deleteSelectedNotifications = async () => {
    const result = await deleteSelectedMutation.mutateAsync(selectedNotificationIds);
    clearSelection();
    return result;
  };

  return {
    clearSelection,
    deleteSelectedNotifications,
    eventTypeFilter,
    eventTypeOptions: NOTIFICATION_EVENT_OPTIONS,
    isBulkDeletePending: deleteSelectedMutation.isPending,
    isError: notificationsQuery.isError || summaryQuery.isError,
    isLoading: notificationsQuery.isLoading || summaryQuery.isLoading,
    isMarkSelectedAsReadPending: markSelectedAsReadMutation.isPending,
    isMarkAllAsReadPending: markAllAsReadMutation.isPending,
    isMarkAsReadPending: markAsReadMutation.isPending,
    isCurrentPageSelected,
    isCurrentPageSelectionIndeterminate,
    markAllAsRead: markAllAsReadMutation.mutateAsync,
    markAsRead: markAsReadMutation.mutateAsync,
    markSelectedAsRead,
    pageNumber: normalizedPageNumber,
    pageSize: pagination.pageSize ?? pageSize,
    pagination,
    readStatusFilter,
    readStatusFilterOptions: READ_STATUS_FILTER_OPTIONS,
    refetchNotifications,
    rows: notificationResponse.data,
    searchValue,
    selectedNotificationIds,
    selectedNotificationIdSet,
    selectedCount,
    setEventTypeFilter,
    setPageNumber: setPageNumberAndClearSelection,
    setPageSize,
    setReadStatusFilter,
    setSearchValue,
    setSortDirection,
    sortDirection,
    sortOptions: SORT_OPTIONS,
    startIndex,
    summary: summaryQuery.data ?? { read: 0, total: 0, unread: 0 },
    toggleCurrentPageSelection,
    toggleNotificationSelection,
    totalPages: pagination.totalPages ?? 1,
  };
};

export default useNotificationPage;
