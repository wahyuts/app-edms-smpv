import { apiClient } from "@/shared/api";
import { queryClient } from "@/shared/api/query-client";
import { getActiveProjectId } from "@/shared/stores/project-context.store";

const getRequiredActiveProjectId = () => {
  const activeProjectId = getActiveProjectId();
  if (!activeProjectId) {
    throw new Error("Project aktif wajib dipilih.");
  }

  return activeProjectId;
};

const getErrorMessage = (error, fallback = "Gagal memuat Audit Trail.") => {
  if (error?.response?.data?.errors?.length) {
    return error.response.data.errors[0].message ?? fallback;
  }

  return error?.response?.data?.message ?? error?.message ?? fallback;
};

const throwAuditApiError = (error, fallback) => {
  throw new Error(getErrorMessage(error, fallback));
};

const notifyAuditTrailQueries = () => {
  queryClient.invalidateQueries({ queryKey: ["audit-trail"] });
};

const normalizeAuditRecord = (record = {}) => ({
  ...record,
  createdAt: record.createdAt ?? record.occurredAt ?? record.timestamp ?? null,
  isDeleted: Boolean(record.isDeleted ?? record.isHidden),
  isHidden: Boolean(record.isHidden ?? record.isDeleted),
  metadata: record.metadata ?? {},
  reference: record.reference ?? "-",
  timestamp: record.timestamp ?? record.createdAt ?? record.occurredAt ?? null,
});

const unwrapActivityList = (response, query = {}) => {
  const payload = response.data?.data ?? {};

  return {
    data: (payload.data ?? []).map(normalizeAuditRecord),
    pagination: payload.pagination ?? {
      page: Number(query.page) || 1,
      pageSize: Number(query.pageSize) || 10,
      totalItems: 0,
      totalPages: 1,
    },
  };
};

const unwrapSummary = (response) => {
  const payload = response.data?.data ?? {};

  return {
    activeUsersToday: Number(payload.activeUsersToday ?? 0),
    today: Number(payload.today ?? 0),
    total: Number(payload.total ?? 0),
  };
};

const unwrapFilterOptions = (response) => {
  const payload = response.data?.data ?? {};

  return {
    actions: payload.actions ?? [],
    departments: payload.departments ?? [],
    officialRoles: payload.officialRoles ?? [],
    resourceTypes: payload.resourceTypes ?? [],
    users: payload.users ?? [],
  };
};

const toActivityQuery = (query = {}) => {
  const activeProjectId = getRequiredActiveProjectId();
  const params = {
    action: query.action || undefined,
    actorName: query.actorName || undefined,
    direction: query.direction || undefined,
    fromDate: query.fromDate || undefined,
    officialRole: query.officialRole || undefined,
    page: query.page || undefined,
    pageSize: query.pageSize || undefined,
    projectId: activeProjectId,
    resourceType: query.resourceType || undefined,
    search: query.search || undefined,
    sortBy: query.sortBy || undefined,
    toDate: query.toDate || undefined,
  };

  return Object.fromEntries(
    Object.entries(params).filter(([, value]) => value !== undefined && value !== ""),
  );
};

const getActivityList = async (query = {}) => {
  try {
    return unwrapActivityList(
      await apiClient.get("/v1/audit-trails", {
        params: toActivityQuery(query),
      }),
      query,
    );
  } catch (error) {
    throwAuditApiError(error, "Gagal memuat Audit Trail.");
  }
};

const getActivitySummary = async () => {
  try {
    return unwrapSummary(await apiClient.get("/v1/audit-trails/summary", {
      params: { projectId: getRequiredActiveProjectId() },
    }));
  } catch (error) {
    throwAuditApiError(error, "Gagal memuat ringkasan Audit Trail.");
  }
};

const getActivityFilterOptions = async () => {
  try {
    return unwrapFilterOptions(await apiClient.get("/v1/audit-trails/filter-options", {
      params: { projectId: getRequiredActiveProjectId() },
    }));
  } catch (error) {
    throwAuditApiError(error, "Gagal memuat filter Audit Trail.");
  }
};

const getActivityDetail = async (auditId) => {
  const activityResponse = await getActivityList({
    page: 1,
    pageSize: 100,
  });

  return activityResponse.data.find((record) =>
    String(record.id) === String(auditId),
  ) ?? null;
};

const softDeleteActivities = async (auditIds = []) => {
  const uniqueAuditIds = [...new Set(auditIds.filter(Boolean))];
  if (uniqueAuditIds.length === 0) {
    return {
      deletedCount: 0,
      deletedIds: [],
    };
  }

  try {
    const results = await Promise.all(
      uniqueAuditIds.map(async (auditId) => {
        const response = await apiClient.patch(`/v1/audit-trails/${auditId}/hide`);
        return response.data?.data ?? { deletedCount: 0, deletedIds: [auditId] };
      }),
    );

    notifyAuditTrailQueries();
    return {
      deletedCount: results.reduce(
        (total, result) => total + Number(result.deletedCount ?? 0),
        0,
      ),
      deletedIds: results.flatMap((result) => result.deletedIds ?? []),
    };
  } catch (error) {
    throwAuditApiError(error, "Audit Trail tidak dapat disembunyikan.");
  }
};

const createBackendOwnedAuditResult = () => ({
  created: false,
  duplicate: false,
  record: null,
  skipped: true,
  reason: "Audit Trail runtime dikelola oleh backend.",
});

const recordActivity = async () => createBackendOwnedAuditResult();
const recordActivitySafely = async () => createBackendOwnedAuditResult();

const searchActivity = (records) => records;
const filterActivity = (records) => records;
const sortActivity = (records) => records;
const paginateActivity = (records) => ({
  data: records,
  pagination: {
    page: 1,
    pageSize: records.length,
    totalItems: records.length,
    totalPages: 1,
  },
});

export const AuditTrailService = {
  filterActivity,
  getActivityFilterOptions,
  getActivityDetail,
  getActivityList,
  getActivitySummary,
  paginateActivity,
  recordActivity,
  recordActivitySafely,
  searchActivity,
  softDeleteActivities,
  sortActivity,
};

export default AuditTrailService;
