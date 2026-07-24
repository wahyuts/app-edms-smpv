import {
  AUDIT_RESOURCE_TYPE,
  AUDIT_TRAIL_DICTIONARY,
} from "../constants/audit-trail.constants";
import { AuditTrailRepository } from "../repositories/audit-trail.repository";
import { queryClient } from "@/shared/api/query-client";
import {
  getActiveOfficialRole,
  getActiveProjectId,
} from "@/shared/stores/project-context.store";

const CURRENT_USER_STORAGE_KEY = "edms.currentUser";
const ADMIN_OFFICIAL_ROLE = "Admin";

const cloneValue = (value) => JSON.parse(JSON.stringify(value));
const normalizeText = (value) => String(value ?? "").trim();
const normalizeKey = (value) => normalizeText(value).toLowerCase();
const getRecordProjectId = (record) => record?.projectId ?? null;
const isVisibleRecord = (record) => record?.isDeleted !== true;
const PROJECT_SCOPED_ACTOR_RESOURCE_TYPES = new Set([
  AUDIT_RESOURCE_TYPE.DOCUMENT,
  AUDIT_RESOURCE_TYPE.ESCALATION,
  AUDIT_RESOURCE_TYPE.NOTIFICATION,
  AUDIT_RESOURCE_TYPE.WORKFLOW_ATTACHMENT,
]);
const getRequiredActiveProjectId = () => {
  const activeProjectId = getActiveProjectId();
  if (!activeProjectId) {
    throw new Error("Active Project is required.");
  }

  return activeProjectId;
};

const createAuditId = () => {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return `AUD-${crypto.randomUUID()}`;
  }
  return `AUD-${Date.now()}-${Math.random().toString(16).slice(2)}`;
};

const getCurrentUserSnapshot = () => {
  if (typeof window === "undefined" || !window.localStorage) return null;
  const storedCurrentUser = window.localStorage.getItem(CURRENT_USER_STORAGE_KEY);
  if (!storedCurrentUser) return null;

  try {
    return JSON.parse(storedCurrentUser);
  } catch {
    return null;
  }
};

const notifyAuditTrailQueries = () => {
  queryClient.invalidateQueries({ queryKey: ["audit-trail"] });
};

const normalizeActor = (actor, { useActiveOfficialRole = false } = {}) => {
  const currentUser = actor ?? getCurrentUserSnapshot();
  const activeOfficialRole = useActiveOfficialRole ? getActiveOfficialRole() : null;

  return {
    actorName: currentUser?.fullName ?? currentUser?.name ?? currentUser?.username ?? "System",
    actorUserId: currentUser?.id ?? null,
    department: currentUser?.department ?? "-",
    officialRole:
      activeOfficialRole ?? currentUser?.officialRole ?? currentUser?.roleName ?? "-",
  };
};

const createDefaultIdentityKey = ({
  action,
  actorUserId,
  createdAt,
  resourceId,
  resourceType,
}) => [
  action,
  actorUserId ?? "system",
  resourceType ?? "-",
  resourceId ?? "-",
  createdAt,
].map((value) => normalizeKey(value)).join(":");

const normalizeRecord = ({
  action,
  actor,
  createdAt = new Date().toISOString(),
  identityKey,
  metadata = {},
  projectId = getActiveProjectId(),
  reference = null,
  resourceId = null,
  resourceType = AUDIT_RESOURCE_TYPE.AUTHENTICATION,
} = {}) => {
  const dictionaryEntry = AUDIT_TRAIL_DICTIONARY[action];
  if (!dictionaryEntry) {
    throw new Error(`Audit Trail action is not defined: ${action}`);
  }

  const actorSnapshot = normalizeActor(actor, {
    useActiveOfficialRole: PROJECT_SCOPED_ACTOR_RESOURCE_TYPES.has(resourceType),
  });

  return {
    id: createAuditId(),
    action,
    businessEvent: dictionaryEntry.businessEvent,
    createdAt,
    detail: dictionaryEntry.detail,
    identityKey: identityKey ?? createDefaultIdentityKey({
      action,
      actorUserId: actorSnapshot.actorUserId,
      createdAt,
      resourceId,
      resourceType,
    }),
    metadata,
    projectId,
    reference: reference ?? "-",
    resourceId,
    resourceType,
    timestamp: createdAt,
    ...actorSnapshot,
  };
};

const recordActivity = async (payload = {}) => {
  const auditRecord = normalizeRecord(payload);
  if (await AuditTrailRepository.hasDuplicate(auditRecord.identityKey)) {
    return {
      created: false,
      duplicate: true,
      record: null,
    };
  }

  const createdRecord = await AuditTrailRepository.create(auditRecord);

  return {
    created: Boolean(createdRecord),
    duplicate: !createdRecord,
    record: createdRecord,
  };
};

const recordActivitySafely = async (payload = {}) => {
  try {
    return await recordActivity(payload);
  } catch (error) {
    console.warn("[AuditTrail] Activity could not be recorded.", error);
    return {
      created: false,
      duplicate: false,
      error,
      record: null,
    };
  }
};

const searchActivity = (records, search = "") =>
  AuditTrailRepository.search(records, search);

const filterActivity = (records, filters = {}) =>
  AuditTrailRepository.filter(records, filters);

const sortActivity = (records, { direction = "desc", sortBy = "createdAt" } = {}) =>
  AuditTrailRepository.sort(records, { direction, sortBy });

const paginateActivity = (records, { page = 1, pageSize = 10 } = {}) =>
  AuditTrailRepository.paginate(records, { page, pageSize });

const getActivityList = async (query = {}) => {
  const records = (await AuditTrailRepository.getByProjectId(getRequiredActiveProjectId()))
    .filter(isVisibleRecord);

  return paginateActivity(
    sortActivity(
      filterActivity(searchActivity(records, query.search), query),
      {
        direction: query.direction ?? query.order ?? "desc",
        sortBy: query.sortBy ?? query.sort ?? "createdAt",
      },
    ),
    { page: query.page, pageSize: query.pageSize },
  );
};

const getActivityDetail = async (auditId) => {
  const activeProjectId = getRequiredActiveProjectId();
  const record = await AuditTrailRepository.getById(auditId);
  if (
    record &&
    (getRecordProjectId(record) !== activeProjectId || !isVisibleRecord(record))
  ) {
    return null;
  }
  return record ? cloneValue(record) : null;
};

const isSameLocalDate = (value, date = new Date()) => {
  const sourceDate = new Date(value);
  if (Number.isNaN(sourceDate.getTime())) return false;

  return (
    sourceDate.getFullYear() === date.getFullYear() &&
    sourceDate.getMonth() === date.getMonth() &&
    sourceDate.getDate() === date.getDate()
  );
};

const getActivitySummary = async () => {
  const records = (await AuditTrailRepository.getByProjectId(getRequiredActiveProjectId()))
    .filter(isVisibleRecord);
  const todayRecords = records.filter((record) => isSameLocalDate(record.createdAt));
  const activeUserIds = new Set(
    todayRecords
      .map((record) => record.actorUserId ?? record.actorName)
      .filter(Boolean),
  );

  return {
    activeUsersToday: activeUserIds.size,
    today: todayRecords.length,
    total: records.length,
  };
};

const uniqueSortedOptions = (records, fieldName) => [
  ...new Set(records.map((record) => normalizeText(record[fieldName])).filter(Boolean)),
].sort((firstValue, secondValue) =>
  normalizeKey(firstValue) > normalizeKey(secondValue) ? 1 : -1,
);

const getActivityFilterOptions = async () => {
  const records = (await AuditTrailRepository.getByProjectId(getRequiredActiveProjectId()))
    .filter(isVisibleRecord);

  return {
    actions: uniqueSortedOptions(records, "action"),
    departments: uniqueSortedOptions(records, "department"),
    officialRoles: uniqueSortedOptions(records, "officialRole"),
    resourceTypes: uniqueSortedOptions(records, "resourceType"),
    users: uniqueSortedOptions(records, "actorName"),
  };
};

const getVisibleActivityRecordsByIds = async (auditIds = []) => {
  const activeProjectId = getRequiredActiveProjectId();
  const uniqueAuditIds = [...new Set(auditIds.filter(Boolean))];

  const records = await Promise.all(
    uniqueAuditIds.map((auditId) => AuditTrailRepository.getById(auditId)),
  );

  return records.filter((record) =>
    record &&
    getRecordProjectId(record) === activeProjectId &&
    isVisibleRecord(record),
  );
};

const softDeleteActivities = async (auditIds = []) => {
  if (getActiveOfficialRole() !== ADMIN_OFFICIAL_ROLE) {
    throw new Error("Only Admin can hide Audit Trail.");
  }

  const records = await getVisibleActivityRecordsByIds(auditIds);
  if (records.length === 0) {
    return {
      deletedCount: 0,
      deletedIds: [],
    };
  }

  const deletedIds = records.map((record) => record.id);
  const deletedByUserId = getCurrentUserSnapshot()?.id ?? null;
  const updatedRecords = await AuditTrailRepository.softDeleteMany(deletedIds, {
    deletedByUserId,
  });

  notifyAuditTrailQueries();
  return {
    deletedCount: updatedRecords.length,
    deletedIds,
  };
};

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
