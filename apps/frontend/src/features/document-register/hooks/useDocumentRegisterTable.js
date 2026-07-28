import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";

import { useProjectContextStore } from "@/shared/stores/project-context.store";
import {
  DOCUMENT_LIFECYCLE_FILTER,
  OFFICIAL_ROLE,
} from "../constants/document.constants";
import { DocumentApiService } from "../services/document-api.service";

const DEFAULT_PAGE_SIZE = 5;
const DEFAULT_SORT_BY = "updatedAt";

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
  const [searchValue, setSearchValue] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [revisionFilter, setRevisionFilter] = useState("");
  const [lifecycleFilter, setLifecycleFilter] = useState(DOCUMENT_LIFECYCLE_FILTER.ACTIVE);
  const [areaFilter, setAreaFilter] = useState("");
  const [drawingFilter, setDrawingFilter] = useState("");
  const [sortBy, setSortBy] = useState(DEFAULT_SORT_BY);
  const [pageNumber, setPageNumber] = useState(1);
  const [pageSize, setPageSize] = useState(defaultPageSize);
  const activeProjectId = useProjectContextStore((state) => state.activeProject?.id);
  const activeOfficialRole = useProjectContextStore((state) => state.activeOfficialRole);
  const canUseLifecycleFilter = activeOfficialRole === OFFICIAL_ROLE.ADMIN;
  const effectiveLifecycleFilter = canUseLifecycleFilter
    ? lifecycleFilter
    : DOCUMENT_LIFECYCLE_FILTER.ACTIVE;
  const effectiveDrawingFilter = drawingContext || drawingFilter;
  const query = useMemo(() => ({
    area: enableControls ? areaFilter : "",
    direction: sortBy === DEFAULT_SORT_BY ? "desc" : "asc",
    drawing: effectiveDrawingFilter,
    lifecycle: effectiveLifecycleFilter,
    page: pageNumber,
    pageSize,
    revision: enableControls ? revisionFilter : "",
    search: enableControls ? searchValue : "",
    sortBy,
    status: enableControls ? statusFilter : "",
  }), [
    areaFilter,
    effectiveDrawingFilter,
    effectiveLifecycleFilter,
    enableControls,
    pageNumber,
    pageSize,
    revisionFilter,
    searchValue,
    sortBy,
    statusFilter,
  ]);

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

  const documentsQuery = useQuery({
    enabled: Boolean(activeProjectId),
    queryFn: () => DocumentApiService.getDocuments(query),
    queryKey: ["documents", "register", activeProjectId ?? null, query],
  });
  const response = documentsQuery.data ?? {
    data: [],
    pagination: {
      page: pageNumber,
      pageSize,
      totalItems: 0,
      totalPages: 1,
    },
  };
  const sourceDocuments = response.data;
  const pagination = response.pagination;
  const rows = sourceDocuments;
  const totalPages = Math.max(1, pagination.totalPages ?? 1);
  const normalizedPageNumber = Math.min(pagination.page ?? pageNumber, totalPages);
  const startIndex = ((normalizedPageNumber - 1) * (pagination.pageSize ?? pageSize));

  return {
    areaFilter,
    areaOptions: getUniqueOptions(sourceDocuments, "area"),
    canUseLifecycleFilter,
    documents: rows,
    drawingFilter,
    drawingOptions: getUniqueOptions(sourceDocuments, "drawing"),
    error: documentsQuery.error,
    isError: documentsQuery.isError,
    isLoading: documentsQuery.isLoading,
    lifecycleFilter,
    pageNumber: normalizedPageNumber,
    pageSize: pagination.pageSize ?? pageSize,
    paginatedDocuments: rows,
    refreshDocuments: () => documentsQuery.refetch(),
    revisionFilter,
    rows,
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
    setPageSize: (nextPageSize) => {
      setPageSize(nextPageSize);
      setPageNumber(1);
    },
    setRevisionFilter: (nextRevisionFilter) => {
      setRevisionFilter(nextRevisionFilter);
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
    statusOptions: getUniqueOptions(sourceDocuments, "status"),
    totalItems: pagination.totalItems ?? rows.length,
    totalPages,
  };
};

export default useDocumentRegisterTable;
