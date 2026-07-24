import { useEffect, useMemo, useRef, useState } from "react";

import { SlaEngineService } from "@/features/sla-management/services/sla-engine.service";
import { useProjectContextStore } from "@/shared/stores/project-context.store";
import {
  DOCUMENT_LIFECYCLE_FILTER,
  OFFICIAL_ROLE,
} from "../constants/document.constants";
import { DocumentService } from "../services/document.service";

const DEFAULT_PAGE_SIZE = 5;
const DEFAULT_SORT_BY = "updatedAt";
const SLA_REFRESH_INTERVAL_MS = 60 * 1000;
const FULL_REFRESH_INTERVAL_MS = 5 * 60 * 1000;

const recalculateDocumentSla = (documentItem) => {
  const evaluatedDocument = SlaEngineService.evaluate(documentItem);

  return {
    ...documentItem,
    slaAssignee: evaluatedDocument.slaAssignee,
    slaStartedAt: evaluatedDocument.slaStartedAt,
    slaStatus: evaluatedDocument.slaStatus,
    slaStoppedAt: evaluatedDocument.slaStoppedAt,
    slaTimer: evaluatedDocument.slaTimer,
  };
};

const getUniqueOptions = (documents, fieldName) => {
  return [...new Set(documents.map((documentItem) => documentItem[fieldName]))]
    .filter(Boolean)
    .sort();
};

export const useDocumentRegisterTable = ({
  defaultPageSize = DEFAULT_PAGE_SIZE,
  directSearchValue = "",
  drawingContext = null,
  enableControls = true,
  preserveStatusFilterOnProjectChange = false,
} = {}) => {
  const [sourceDocuments, setSourceDocuments] = useState([]);
  const [documents, setDocuments] = useState([]);
  const [searchValue, setSearchValue] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [revisionFilter, setRevisionFilter] = useState("");
  const [lifecycleFilter, setLifecycleFilter] = useState(DOCUMENT_LIFECYCLE_FILTER.ACTIVE);
  const [areaFilter, setAreaFilter] = useState("");
  const [drawingFilter, setDrawingFilter] = useState("");
  const [sortBy, setSortBy] = useState(DEFAULT_SORT_BY);
  const [pageNumber, setPageNumber] = useState(1);
  const [pageSize, setPageSize] = useState(defaultPageSize);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);
  const [fullRefreshKey, setFullRefreshKey] = useState(0);
  const hasLoadedOnceRef = useRef(false);
  const activeProjectIdRef = useRef(null);
  const activeProjectId = useProjectContextStore((state) => state.activeProject?.id);
  const activeOfficialRole = useProjectContextStore((state) => state.activeOfficialRole);
  const canUseLifecycleFilter = activeOfficialRole === OFFICIAL_ROLE.ADMIN;
  const effectiveLifecycleFilter = canUseLifecycleFilter
    ? lifecycleFilter
    : DOCUMENT_LIFECYCLE_FILTER.ACTIVE;

  useEffect(() => {
    const resetTimeoutId = window.setTimeout(() => {
      setAreaFilter("");
      setDrawingFilter("");
      setLifecycleFilter(DOCUMENT_LIFECYCLE_FILTER.ACTIVE);
      setRevisionFilter("");
      setSearchValue(directSearchValue);
      setSortBy(DEFAULT_SORT_BY);
      if (!preserveStatusFilterOnProjectChange) {
        setStatusFilter("");
      }
      setPageNumber(1);
    }, 0);

    return () => window.clearTimeout(resetTimeoutId);
  }, [activeProjectId, directSearchValue, preserveStatusFilterOnProjectChange]);

  useEffect(() => {
    if (!directSearchValue) return;

    const directSearchTimeoutId = window.setTimeout(() => {
      setAreaFilter("");
      setDrawingFilter("");
      setLifecycleFilter(DOCUMENT_LIFECYCLE_FILTER.ACTIVE);
      setRevisionFilter("");
      setSearchValue(directSearchValue);
      setStatusFilter("");
      setPageNumber(1);
    }, 0);

    return () => window.clearTimeout(directSearchTimeoutId);
  }, [directSearchValue]);

  useEffect(() => {
    const slaTimerIntervalId = window.setInterval(() => {
      setSourceDocuments((currentDocuments) =>
        currentDocuments.map(recalculateDocumentSla),
      );
      setDocuments((currentDocuments) =>
        currentDocuments.map(recalculateDocumentSla),
      );
    }, SLA_REFRESH_INTERVAL_MS);

    const fullRefreshIntervalId = window.setInterval(() => {
      setFullRefreshKey((currentKey) => currentKey + 1);
    }, FULL_REFRESH_INTERVAL_MS);

    return () => {
      window.clearInterval(slaTimerIntervalId);
      window.clearInterval(fullRefreshIntervalId);
    };
  }, []);

  useEffect(() => {
    let isActive = true;

    const loadDocuments = async () => {
      const projectChanged = activeProjectIdRef.current !== activeProjectId;
      activeProjectIdRef.current = activeProjectId;

      if (!hasLoadedOnceRef.current || projectChanged) {
        setSourceDocuments([]);
        setDocuments([]);
        setIsLoading(true);
      }

      const sourceDocuments = drawingContext
        ? await DocumentService.getDocumentsByDrawing(drawingContext, {
            lifecycle: effectiveLifecycleFilter,
          })
        : await DocumentService.getDocumentsByLifecycle({
            lifecycle: effectiveLifecycleFilter,
          });

      const searchedDocuments = enableControls
        ? await DocumentService.searchDocuments(searchValue, sourceDocuments)
        : sourceDocuments;

      const filteredDocuments = enableControls
        ? await DocumentService.filterDocuments(searchedDocuments, {
            status: statusFilter,
            revision: revisionFilter,
            area: areaFilter,
            drawing: drawingFilter,
          })
        : searchedDocuments;

      const sortedDocuments = await DocumentService.sortDocuments(
        filteredDocuments,
        {
          sortBy,
          direction: sortBy === DEFAULT_SORT_BY ? "desc" : "asc",
        },
      );

      if (isActive) {
        setSourceDocuments(sourceDocuments);
        setDocuments(sortedDocuments);
        hasLoadedOnceRef.current = true;
        setIsLoading(false);
      }
    };

    loadDocuments();

    return () => {
      isActive = false;
    };
  }, [
    areaFilter,
    activeProjectId,
    effectiveLifecycleFilter,
    drawingFilter,
    drawingContext,
    enableControls,
    fullRefreshKey,
    refreshKey,
    revisionFilter,
    searchValue,
    sortBy,
    statusFilter,
  ]);

  const totalPages = Math.max(1, Math.ceil(documents.length / pageSize));
  const normalizedPageNumber = Math.min(pageNumber, totalPages);
  const startIndex = (normalizedPageNumber - 1) * pageSize;
  const paginatedDocuments = documents.slice(startIndex, startIndex + pageSize);

  const statusOptions = useMemo(
    () => getUniqueOptions(sourceDocuments, "status"),
    [sourceDocuments],
  );
  const areaOptions = useMemo(
    () => getUniqueOptions(sourceDocuments, "area"),
    [sourceDocuments],
  );
  const drawingOptions = useMemo(
    () => getUniqueOptions(sourceDocuments, "drawing"),
    [sourceDocuments],
  );

  return {
    areaFilter,
    areaOptions,
    documents,
    drawingFilter,
    drawingOptions,
    isLoading,
    lifecycleFilter,
    pageNumber: normalizedPageNumber,
    pageSize,
    paginatedDocuments,
    rows: paginatedDocuments,
    revisionFilter,
    searchValue,
    setAreaFilter: (nextAreaFilter) => {
      setAreaFilter(nextAreaFilter);
      setPageNumber(1);
    },
    setDrawingFilter: (nextDrawingFilter) => {
      setDrawingFilter(nextDrawingFilter);
      setPageNumber(1);
    },
    setLifecycleFilter: (nextLifecycleFilter) => {
      setLifecycleFilter(nextLifecycleFilter);
      setPageNumber(1);
    },
    setPageNumber,
    refreshDocuments: () => {
      setPageNumber(1);
      setSortBy(DEFAULT_SORT_BY);
      setRefreshKey((currentKey) => currentKey + 1);
    },
    setPageSize: (nextPageSize) => {
      setPageSize(nextPageSize);
      setPageNumber(1);
    },
    setSearchValue: (nextSearchValue) => {
      setSearchValue(nextSearchValue);
      setPageNumber(1);
    },
    setRevisionFilter: (nextRevisionFilter) => {
      setRevisionFilter(nextRevisionFilter);
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
    totalPages,
    canUseLifecycleFilter,
  };
};

export default useDocumentRegisterTable;
