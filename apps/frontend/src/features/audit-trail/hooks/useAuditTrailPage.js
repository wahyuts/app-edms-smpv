import { useMutation, useQuery } from "@tanstack/react-query";
import { useCallback, useEffect, useMemo, useState } from "react";

import { AuthService } from "@/features/auth/services/auth.service";
import { PROJECT_OFFICIAL_ROLE } from "@/features/project/constants/project.constants";
import { useProjectContextStore } from "@/shared/stores/project-context.store";

import { AuditTrailService } from "../services/audit-trail.service";

const DEFAULT_PAGE_SIZE = 10;
const DEFAULT_SORT_DIRECTION = "desc";

const TIME_PERIOD_OPTIONS = [
  { label: "All Time", value: "" },
  { label: "Today", value: "today" },
  { label: "Last 7 Days", value: "last-7-days" },
  { label: "Last 30 Days", value: "last-30-days" },
];

const SORT_OPTIONS = [
  { label: "Newest First", value: "desc" },
  { label: "Oldest First", value: "asc" },
];

const getTimePeriodRange = (timePeriod) => {
  const now = new Date();
  const startDate = new Date(now);

  if (timePeriod === "today") {
    startDate.setHours(0, 0, 0, 0);
    return {
      fromDate: startDate.toISOString(),
      toDate: now.toISOString(),
    };
  }

  if (timePeriod === "last-7-days" || timePeriod === "last-30-days") {
    const dayCount = timePeriod === "last-7-days" ? 7 : 30;
    startDate.setDate(startDate.getDate() - dayCount + 1);
    startDate.setHours(0, 0, 0, 0);
    return {
      fromDate: startDate.toISOString(),
      toDate: now.toISOString(),
    };
  }

  return {
    fromDate: null,
    toDate: null,
  };
};

export const useAuditTrailPage = () => {
  const [searchValue, setSearchValueState] = useState("");
  const [timePeriodFilter, setTimePeriodFilterState] = useState("");
  const [userFilter, setUserFilterState] = useState("");
  const [officialRoleFilter, setOfficialRoleFilterState] = useState("");
  const [actionFilter, setActionFilterState] = useState("");
  const [resourceTypeFilter, setResourceTypeFilterState] = useState("");
  const [sortDirection, setSortDirectionState] = useState(DEFAULT_SORT_DIRECTION);
  const [pageNumber, setPageNumber] = useState(1);
  const [pageSize, setPageSizeState] = useState(DEFAULT_PAGE_SIZE);
  const activeProjectId = useProjectContextStore((state) => state.activeProject?.id);
  const activeOfficialRole = useProjectContextStore((state) => state.activeOfficialRole);
  const [selectedAuditTrailIds, setSelectedAuditTrailIds] = useState([]);
  const isAdmin = activeOfficialRole === PROJECT_OFFICIAL_ROLE.ADMIN;

  const clearSelection = useCallback(() => {
    setSelectedAuditTrailIds([]);
  }, []);

  useEffect(() => {
    const resetTimeoutId = window.setTimeout(() => {
      setSearchValueState("");
      setTimePeriodFilterState("");
      setUserFilterState("");
      setOfficialRoleFilterState("");
      setActionFilterState("");
      setResourceTypeFilterState("");
      setSortDirectionState(DEFAULT_SORT_DIRECTION);
      setPageNumber(1);
      clearSelection();
    }, 0);

    return () => window.clearTimeout(resetTimeoutId);
  }, [activeProjectId, clearSelection]);

  useEffect(() => AuthService.subscribeCurrentUserChange(clearSelection), [clearSelection]);

  useEffect(() => {
    if (isAdmin) return undefined;

    const resetTimeoutId = window.setTimeout(clearSelection, 0);
    return () => window.clearTimeout(resetTimeoutId);
  }, [clearSelection, isAdmin]);

  const query = useMemo(() => {
    const timeRange = getTimePeriodRange(timePeriodFilter);

    return {
      action: actionFilter,
      actorName: userFilter,
      direction: sortDirection,
      officialRole: officialRoleFilter,
      page: pageNumber,
      pageSize,
      resourceType: resourceTypeFilter,
      search: searchValue,
      sortBy: "createdAt",
      ...timeRange,
    };
  }, [
    actionFilter,
    officialRoleFilter,
    pageNumber,
    pageSize,
    resourceTypeFilter,
    searchValue,
    sortDirection,
    timePeriodFilter,
    userFilter,
  ]);

  const activityQuery = useQuery({
    enabled: Boolean(activeProjectId),
    queryFn: () => AuditTrailService.getActivityList(query),
    queryKey: ["audit-trail", "list", activeProjectId ?? null, query],
  });

  const summaryQuery = useQuery({
    enabled: Boolean(activeProjectId),
    queryFn: AuditTrailService.getActivitySummary,
    queryKey: ["audit-trail", "summary", activeProjectId ?? null],
  });

  const filterOptionsQuery = useQuery({
    enabled: Boolean(activeProjectId),
    queryFn: AuditTrailService.getActivityFilterOptions,
    queryKey: ["audit-trail", "filter-options", activeProjectId ?? null],
  });

  const softDeleteMutation = useMutation({
    mutationFn: AuditTrailService.softDeleteActivities,
  });

  const resetPage = () => setPageNumber(1);

  const setSearchValue = (nextValue) => {
    setSearchValueState(nextValue);
    resetPage();
    clearSelection();
  };
  const setTimePeriodFilter = (nextValue) => {
    setTimePeriodFilterState(nextValue);
    resetPage();
    clearSelection();
  };
  const setUserFilter = (nextValue) => {
    setUserFilterState(nextValue);
    resetPage();
    clearSelection();
  };
  const setOfficialRoleFilter = (nextValue) => {
    setOfficialRoleFilterState(nextValue);
    resetPage();
    clearSelection();
  };
  const setActionFilter = (nextValue) => {
    setActionFilterState(nextValue);
    resetPage();
    clearSelection();
  };
  const setResourceTypeFilter = (nextValue) => {
    setResourceTypeFilterState(nextValue);
    resetPage();
    clearSelection();
  };
  const setSortDirection = (nextValue) => {
    setSortDirectionState(nextValue);
    resetPage();
    clearSelection();
  };
  const setPageSize = (nextValue) => {
    setPageSizeState(nextValue);
    resetPage();
    clearSelection();
  };
  const setPageNumberAndClearSelection = (nextValue) => {
    setPageNumber(nextValue);
    clearSelection();
  };

  const resetFilters = () => {
    setSearchValueState("");
    setTimePeriodFilterState("");
    setUserFilterState("");
    setOfficialRoleFilterState("");
    setActionFilterState("");
    setResourceTypeFilterState("");
    setSortDirectionState(DEFAULT_SORT_DIRECTION);
    resetPage();
    clearSelection();
  };

  const activityResponse = activityQuery.data ?? {
    data: [],
    pagination: {
      page: 1,
      pageSize,
      totalItems: 0,
      totalPages: 1,
    },
  };
  const pagination = activityResponse.pagination;
  const normalizedPageNumber = pagination.page ?? pageNumber;
  const normalizedPageSize = pagination.pageSize ?? pageSize;
  const currentPageAuditTrailIds = activityResponse.data.map((auditRecord) => auditRecord.id);
  const selectedAuditTrailIdSet = new Set(selectedAuditTrailIds);
  const selectedCount = selectedAuditTrailIds.length;
  const selectedCurrentPageCount = currentPageAuditTrailIds.filter((auditId) =>
    selectedAuditTrailIdSet.has(auditId),
  ).length;
  const isCurrentPageSelected =
    currentPageAuditTrailIds.length > 0 &&
    selectedCurrentPageCount === currentPageAuditTrailIds.length;
  const isCurrentPageSelectionIndeterminate =
    selectedCurrentPageCount > 0 && !isCurrentPageSelected;

  const toggleAuditTrailSelection = (auditId) => {
    if (!isAdmin) return;

    setSelectedAuditTrailIds((currentSelectedAuditTrailIds) => {
      if (currentSelectedAuditTrailIds.includes(auditId)) {
        return currentSelectedAuditTrailIds.filter((selectedAuditId) =>
          selectedAuditId !== auditId,
        );
      }

      return [...currentSelectedAuditTrailIds, auditId];
    });
  };

  const toggleCurrentPageSelection = () => {
    if (!isAdmin) return;

    setSelectedAuditTrailIds((currentSelectedAuditTrailIds) => {
      const currentSelectedAuditTrailIdSet = new Set(currentSelectedAuditTrailIds);
      const allCurrentPageSelected =
        currentPageAuditTrailIds.length > 0 &&
        currentPageAuditTrailIds.every((auditId) =>
          currentSelectedAuditTrailIdSet.has(auditId),
        );

      if (allCurrentPageSelected) {
        return currentSelectedAuditTrailIds.filter((auditId) =>
          !currentPageAuditTrailIds.includes(auditId),
        );
      }

      return [...new Set([
        ...currentSelectedAuditTrailIds,
        ...currentPageAuditTrailIds,
      ])];
    });
  };

  const softDeleteSelectedAuditTrails = async () => {
    const result = await softDeleteMutation.mutateAsync(selectedAuditTrailIds);
    clearSelection();
    return result;
  };

  return {
    actionFilter,
    clearSelection,
    filterOptions: filterOptionsQuery.data ?? {
      actions: [],
      departments: [],
      officialRoles: [],
      resourceTypes: [],
      users: [],
    },
    isError:
      activityQuery.isError ||
      summaryQuery.isError ||
      filterOptionsQuery.isError,
    isBulkDeletePending: softDeleteMutation.isPending,
    isCurrentPageSelected,
    isCurrentPageSelectionIndeterminate,
    isAdmin,
    isLoading:
      activityQuery.isLoading ||
      summaryQuery.isLoading ||
      filterOptionsQuery.isLoading,
    officialRoleFilter,
    pageNumber: normalizedPageNumber,
    pageSize: normalizedPageSize,
    pagination,
    refetchActivity: () => {
      activityQuery.refetch();
      summaryQuery.refetch();
      filterOptionsQuery.refetch();
    },
    resetFilters,
    resourceTypeFilter,
    rows: activityResponse.data,
    searchValue,
    selectedAuditTrailIds,
    selectedAuditTrailIdSet,
    selectedCount,
    setActionFilter,
    setOfficialRoleFilter,
    setPageNumber: setPageNumberAndClearSelection,
    setPageSize,
    setResourceTypeFilter,
    setSearchValue,
    setSortDirection,
    setTimePeriodFilter,
    setUserFilter,
    sortDirection,
    sortOptions: SORT_OPTIONS,
    softDeleteSelectedAuditTrails,
    startIndex: (normalizedPageNumber - 1) * normalizedPageSize,
    summary: summaryQuery.data ?? {
      activeUsersToday: 0,
      today: 0,
      total: 0,
    },
    timePeriodFilter,
    timePeriodOptions: TIME_PERIOD_OPTIONS,
    totalPages: pagination.totalPages ?? 1,
    toggleAuditTrailSelection,
    toggleCurrentPageSelection,
    userFilter,
  };
};

export default useAuditTrailPage;
