import { useEffect, useMemo, useRef, useState } from "react";

import {
  DOCUMENT_STATUS,
  SLA_STATUS,
} from "@/features/document-register/constants/document.constants";
import { resolveCurrentAssigneeRoleDisplay } from "@/features/sla-management/utils/sla-timer-display";
import { useProjectContextStore } from "@/shared/stores/project-context.store";

import { SlaMonitoringService } from "../services/sla-monitoring.service";

const DEFAULT_PAGE_SIZE = 5;
const DEFAULT_SORT_BY = "slaTimer";
const SLA_REFRESH_INTERVAL_MS = 60 * 1000;
const FULL_REFRESH_INTERVAL_MS = 5 * 60 * 1000;

const normalizeSearchValue = (value) => String(value ?? "").trim().toLowerCase();

const recalculateDocumentSla = (documentItem) =>
  SlaMonitoringService.evaluateDocument(documentItem);

const slaStatusOptions = [
  SLA_STATUS.ON_TRACK,
  SLA_STATUS.AT_RISK,
  SLA_STATUS.OVERDUE,
  SLA_STATUS.FINAL_AS_BUILT,
];

const statusOptions = [
  DOCUMENT_STATUS.PROCESS_REVIEW,
  DOCUMENT_STATUS.PROCESS_COMMENT,
  DOCUMENT_STATUS.PROCESS_REJECT,
  DOCUMENT_STATUS.PROJECT_REVIEW,
  DOCUMENT_STATUS.PROJECT_COMMENT,
  DOCUMENT_STATUS.PROJECT_REJECT,
  DOCUMENT_STATUS.APPROVED,
];

const getSortableValue = (documentItem, sortBy) => {
  if (sortBy === "slaTimer") {
    return documentItem.slaTimer?.totalMinutes ?? 0;
  }

  return documentItem[sortBy];
};

const compareValues = (firstValue, secondValue, direction) => {
  const multiplier = direction === "desc" ? -1 : 1;
  if (firstValue === secondValue) return 0;
  if (firstValue === null || firstValue === undefined) return 1;
  if (secondValue === null || secondValue === undefined) return -1;
  return firstValue > secondValue ? multiplier : -multiplier;
};

const sortDocuments = (items, sortBy) => {
  const direction = sortBy === "documentNumber" ? "asc" : "desc";

  return [...items].sort((firstItem, secondItem) => {
    const sortResult = compareValues(
      getSortableValue(firstItem, sortBy),
      getSortableValue(secondItem, sortBy),
      direction,
    );

    if (sortResult !== 0) return sortResult;

    return compareValues(
      getSortableValue(firstItem, "documentNumber"),
      getSortableValue(secondItem, "documentNumber"),
      "asc",
    );
  });
};

const filterDocuments = ({
  documents,
  searchValue,
  slaStatusFilter,
  sortBy,
  statusFilter,
}) => {
  const keyword = normalizeSearchValue(searchValue);
  const searchedDocuments = keyword
    ? documents.filter((documentItem) => {
        const searchableFields = [
          documentItem.documentNumber,
          documentItem.description,
          documentItem.status,
          resolveCurrentAssigneeRoleDisplay(documentItem),
        ];

        return searchableFields.some((fieldValue) =>
          normalizeSearchValue(fieldValue).includes(keyword),
        );
      })
    : documents;
  const filteredDocuments = searchedDocuments.filter((documentItem) => {
    const isSlaStatusMatched = slaStatusFilter
      ? documentItem.slaStatus === slaStatusFilter
      : true;
    const isStatusMatched = statusFilter
      ? documentItem.status === statusFilter
      : true;

    return isSlaStatusMatched && isStatusMatched;
  });

  return sortDocuments(filteredDocuments, sortBy);
};

export const useSlaMonitoringTable = ({ directSearchValue = "" } = {}) => {
  const [sourceDocuments, setSourceDocuments] = useState([]);
  const [searchValue, setSearchValue] = useState("");
  const [slaStatusFilter, setSlaStatusFilter] = useState("");
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
      setSearchValue(directSearchValue);
      setSlaStatusFilter("");
      setStatusFilter("");
      setSortBy(DEFAULT_SORT_BY);
      setPageNumber(1);
    }, 0);

    return () => window.clearTimeout(resetTimeoutId);
  }, [activeProjectId, directSearchValue]);

  useEffect(() => {
    if (!directSearchValue) return;

    const directSearchTimeoutId = window.setTimeout(() => {
      setSearchValue(directSearchValue);
      setSlaStatusFilter("");
      setStatusFilter("");
      setPageNumber(1);
    }, 0);

    return () => window.clearTimeout(directSearchTimeoutId);
  }, [directSearchValue]);

  useEffect(() => {
    let isActive = true;

    const loadDocuments = async () => {
      const projectChanged = activeProjectIdRef.current !== activeProjectId;
      activeProjectIdRef.current = activeProjectId;

      if (!hasLoadedOnceRef.current || projectChanged) {
        setSourceDocuments([]);
        setIsLoading(true);
      }

      const documents = await SlaMonitoringService.getDocuments();

      if (isActive) {
        setSourceDocuments(documents);
        hasLoadedOnceRef.current = true;
        setIsLoading(false);
      }
    };

    loadDocuments();

    return () => {
      isActive = false;
    };
  }, [activeProjectId, refreshKey]);

  useEffect(() => {
    const slaTimerIntervalId = window.setInterval(() => {
      setSourceDocuments((currentDocuments) =>
        currentDocuments.map(recalculateDocumentSla),
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
    () => SlaMonitoringService.createSummary(sourceDocuments),
    [sourceDocuments],
  );
  const documents = useMemo(
    () =>
      filterDocuments({
        documents: sourceDocuments,
        searchValue,
        slaStatusFilter,
        sortBy,
        statusFilter,
      }),
    [searchValue, slaStatusFilter, sortBy, sourceDocuments, statusFilter],
  );
  const totalPages = Math.max(1, Math.ceil(documents.length / pageSize));
  const normalizedPageNumber = Math.min(pageNumber, totalPages);
  const startIndex = (normalizedPageNumber - 1) * pageSize;
  const paginatedDocuments = documents.slice(startIndex, startIndex + pageSize);

  return {
    isLoading,
    pageNumber: normalizedPageNumber,
    pageSize,
    refreshDocuments: () => setRefreshKey((currentKey) => currentKey + 1),
    rows: paginatedDocuments,
    searchValue,
    setPageNumber,
    setPageSize: (nextPageSize) => {
      setPageSize(nextPageSize);
      setPageNumber(1);
    },
    setSearchValue: (nextSearchValue) => {
      setSearchValue(nextSearchValue);
      setPageNumber(1);
    },
    setSlaStatusFilter: (nextSlaStatusFilter) => {
      setSlaStatusFilter(nextSlaStatusFilter);
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
    slaStatusFilter,
    slaStatusOptions,
    sortBy,
    startIndex,
    statusFilter,
    statusOptions,
    summary,
    totalPages,
  };
};

export default useSlaMonitoringTable;
