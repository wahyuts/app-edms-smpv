import { useEffect, useMemo, useRef, useState } from "react";

import { DOCUMENT_STATUS } from "@/features/document-register/constants/document.constants";
import { resolveCurrentAssigneeRoleDisplay } from "@/features/sla-management/utils/sla-timer-display";
import { useProjectContextStore } from "@/shared/stores/project-context.store";

import { EscalationService } from "../services/escalation.service";

const DEFAULT_PAGE_SIZE = 5;
const DEFAULT_SORT_BY = "escalationLevel";
const SLA_REFRESH_INTERVAL_MS = 60 * 1000;
const FULL_REFRESH_INTERVAL_MS = 5 * 60 * 1000;

const escalationLevelRank = {
  "Level 1": 1,
  "Level 2": 2,
  "Level 3": 3,
  "Level 4": 4,
};

const normalizeSearchValue = (value) => String(value ?? "").trim().toLowerCase();

const recalculateEscalation = (escalationItem) =>
  EscalationService.createEscalationItem(escalationItem);

const getUniqueOptions = (items, fieldName) =>
  [...new Set(items.map((item) => item[fieldName]))].filter(Boolean).sort();

const statusOptions = [
  DOCUMENT_STATUS.PROCESS_REVIEW,
  DOCUMENT_STATUS.PROCESS_COMMENT,
  DOCUMENT_STATUS.PROCESS_REJECT,
  DOCUMENT_STATUS.PROJECT_REVIEW,
  DOCUMENT_STATUS.PROJECT_COMMENT,
  DOCUMENT_STATUS.PROJECT_REJECT,
  DOCUMENT_STATUS.APPROVED,
];

const getSortableValue = (item, sortBy) => {
  if (sortBy === "escalationLevel") {
    return escalationLevelRank[item.escalationLevel] ?? 0;
  }
  if (sortBy === "slaTimer") {
    return item.slaTimer?.totalMinutes ?? 0;
  }
  return item[sortBy];
};

const compareValues = (firstValue, secondValue, direction) => {
  const multiplier = direction === "desc" ? -1 : 1;
  if (firstValue === secondValue) return 0;
  if (firstValue === null || firstValue === undefined) return 1;
  if (secondValue === null || secondValue === undefined) return -1;
  return firstValue > secondValue ? multiplier : -multiplier;
};

const sortEscalations = (items, sortBy) => {
  const direction = sortBy === "documentNumber" ? "asc" : "desc";

  return [...items].sort((firstItem, secondItem) => {
    const sortResult = compareValues(
      getSortableValue(firstItem, sortBy),
      getSortableValue(secondItem, sortBy),
      direction,
    );

    if (sortResult !== 0) return sortResult;

    return compareValues(
      getSortableValue(firstItem, "daysOverdue"),
      getSortableValue(secondItem, "daysOverdue"),
      "desc",
    );
  });
};

const filterEscalations = ({
  escalationItems,
  levelFilter,
  searchValue,
  sortBy,
  statusFilter,
}) => {
  const keyword = normalizeSearchValue(searchValue);
  const searchedItems = keyword
    ? escalationItems.filter((item) => {
        const searchableFields = [
          item.documentNumber,
          item.description,
          item.status,
          resolveCurrentAssigneeRoleDisplay(item),
          item.escalationLevel,
        ];

        return searchableFields.some((fieldValue) =>
          normalizeSearchValue(fieldValue).includes(keyword),
        );
      })
    : escalationItems;
  const filteredItems = searchedItems.filter((item) => {
    const isLevelMatched = levelFilter
      ? item.escalationLevel === levelFilter
      : true;
    const isStatusMatched = statusFilter ? item.status === statusFilter : true;

    return isLevelMatched && isStatusMatched;
  });

  return sortEscalations(filteredItems, sortBy);
};

const createSummary = (items) => {
  const summary = {
    "Level 1": 0,
    "Level 2": 0,
    "Level 3": 0,
    "Level 4": 0,
    total: items.length,
  };

  items.forEach((item) => {
    if (item.escalationLevel) {
      summary[item.escalationLevel] += 1;
    }
  });

  return summary;
};

export const useEscalationAlertTable = ({ directSearchValue = "" } = {}) => {
  const [sourceEscalations, setSourceEscalations] = useState([]);
  const [searchValue, setSearchValue] = useState("");
  const [levelFilter, setLevelFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [sortBy, setSortBy] = useState(DEFAULT_SORT_BY);
  const [pageNumber, setPageNumber] = useState(1);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);
  const hasLoadedOnceRef = useRef(false);
  const activeProjectIdRef = useRef(null);
  const activeProjectId = useProjectContextStore((state) => state.activeProject?.id);

  useEffect(() => {
    const resetTimeoutId = window.setTimeout(() => {
      setLevelFilter("");
      setSearchValue(directSearchValue);
      setStatusFilter("");
      setSortBy(DEFAULT_SORT_BY);
      setPageNumber(1);
    }, 0);

    return () => window.clearTimeout(resetTimeoutId);
  }, [activeProjectId, directSearchValue]);

  useEffect(() => {
    if (!directSearchValue) return;

    const directSearchTimeoutId = window.setTimeout(() => {
      setLevelFilter("");
      setSearchValue(directSearchValue);
      setStatusFilter("");
      setPageNumber(1);
    }, 0);

    return () => window.clearTimeout(directSearchTimeoutId);
  }, [directSearchValue]);

  useEffect(() => {
    let isActive = true;

    const loadEscalations = async () => {
      const projectChanged = activeProjectIdRef.current !== activeProjectId;
      activeProjectIdRef.current = activeProjectId;

      if (!hasLoadedOnceRef.current || projectChanged) {
        setSourceEscalations([]);
        setIsLoading(true);
      }

      try {
        const escalationItems = await EscalationService.getEscalations();

        if (isActive) {
          setSourceEscalations(escalationItems);
        }
      } catch {
        if (isActive) {
          setSourceEscalations([]);
        }
      } finally {
        if (isActive) {
          hasLoadedOnceRef.current = true;
          setIsLoading(false);
        }
      }
    };

    loadEscalations();

    return () => {
      isActive = false;
    };
  }, [activeProjectId, refreshKey]);

  useEffect(() => {
    const slaTimerIntervalId = window.setInterval(() => {
      setSourceEscalations((currentEscalations) =>
        currentEscalations.map(recalculateEscalation).filter(Boolean),
      );
    }, SLA_REFRESH_INTERVAL_MS);

    const fullRefreshIntervalId = window.setInterval(() => {
      setRefreshKey((currentKey) => currentKey + 1);
    }, FULL_REFRESH_INTERVAL_MS);

    return () => {
      window.clearInterval(slaTimerIntervalId);
      window.clearInterval(fullRefreshIntervalId);
    };
  }, []);

  const summary = useMemo(
    () => createSummary(sourceEscalations),
    [sourceEscalations],
  );
  const levelOptions = useMemo(
    () => getUniqueOptions(sourceEscalations, "escalationLevel"),
    [sourceEscalations],
  );
  const escalationItems = useMemo(
    () =>
      filterEscalations({
        escalationItems: sourceEscalations,
        levelFilter,
        searchValue,
        sortBy,
        statusFilter,
      }),
    [levelFilter, searchValue, sortBy, sourceEscalations, statusFilter],
  );
  const totalPages = Math.max(1, Math.ceil(escalationItems.length / pageSize));
  const normalizedPageNumber = Math.min(pageNumber, totalPages);
  const startIndex = (normalizedPageNumber - 1) * pageSize;
  const paginatedEscalations = escalationItems.slice(
    startIndex,
    startIndex + pageSize,
  );

  return {
    isLoading,
    levelFilter,
    levelOptions,
    pageNumber: normalizedPageNumber,
    pageSize,
    refreshEscalations: () => setRefreshKey((currentKey) => currentKey + 1),
    rows: paginatedEscalations,
    searchValue,
    setLevelFilter: (nextLevelFilter) => {
      setLevelFilter(nextLevelFilter);
      setPageNumber(1);
    },
    setPageNumber,
    setPageSize: (nextPageSize) => {
      setPageSize(nextPageSize);
      setPageNumber(1);
    },
    setSearchValue: (nextSearchValue) => {
      setSearchValue(nextSearchValue);
      setPageNumber(1);
    },
    setSortBy: (nextSortBy) => {
      setSortBy(nextSortBy);
      setPageNumber(1);
    },
    setStatusFilter: (nextStatusFilter) => {
      setStatusFilter(nextStatusFilter);
      setPageNumber(1);
    },
    sortBy,
    startIndex,
    statusFilter,
    statusOptions,
    summary,
    totalPages,
  };
};

export default useEscalationAlertTable;
