import {
  EDMS_STORE,
  runEdmsTransaction,
  runStoreRequest,
} from "@/shared/services/indexeddb.service";

const storeName = EDMS_STORE.AUDIT_TRAIL;

const cloneValue = (value) => JSON.parse(JSON.stringify(value));
const normalizeText = (value) => String(value ?? "").trim();
const normalizeKey = (value) => normalizeText(value).toLowerCase();
const isVisibleRecord = (record) => record?.isDeleted !== true;

const isDuplicateIdentityError = (error) =>
  error?.name === "ConstraintError" ||
  error?.message?.includes("ConstraintError");

const create = async (record) => {
  const auditRecord = {
    isDeleted: false,
    deletedAt: null,
    deletedByUserId: null,
    ...record,
  };

  try {
    await runStoreRequest(storeName, "readwrite", (store) => store.add(auditRecord));
    return cloneValue(auditRecord);
  } catch (error) {
    if (isDuplicateIdentityError(error)) {
      return null;
    }
    throw error;
  }
};

const getAll = async () => cloneValue(
  await runStoreRequest(storeName, "readonly", (store) => store.getAll()),
);

const getByProjectId = async (projectId) => cloneValue(
  await runStoreRequest(
    storeName,
    "readonly",
    (store) => store.index("projectId").getAll(projectId),
  ),
);

const getById = async (auditId) => (
  await runStoreRequest(storeName, "readonly", (store) => store.get(auditId))
) ?? null;

const update = async (record) => {
  await runStoreRequest(storeName, "readwrite", (store) => store.put(record));
  return cloneValue(record);
};

const softDeleteMany = async (
  auditIds = [],
  { deletedAt = new Date().toISOString(), deletedByUserId = null } = {},
) => {
  const uniqueAuditIds = [...new Set(auditIds.filter(Boolean))];
  if (uniqueAuditIds.length === 0) return [];

  const updatedRecords = await runEdmsTransaction([storeName], "readwrite", (stores) => {
    const store = stores[storeName];
    const updatedAuditRecords = [];

    uniqueAuditIds.forEach((auditId) => {
      const request = store.get(auditId);

      request.onsuccess = () => {
        const record = request.result;
        if (!record || record.isDeleted === true) return;

        const updatedRecord = {
          ...record,
          deletedAt,
          deletedByUserId,
          isDeleted: true,
          status: record.status ?? "Hidden",
        };

        updatedAuditRecords.push(updatedRecord);
        store.put(updatedRecord);
      };
    });

    return updatedAuditRecords;
  });

  return cloneValue(updatedRecords);
};

const hasDuplicate = async (identityKey) => {
  if (!identityKey) return false;

  return Boolean(
    await runStoreRequest(
      storeName,
      "readonly",
      (store) => store.index("identityKey").getKey(identityKey),
    ),
  );
};

const search = (records, searchValue = "") => {
  const keyword = normalizeKey(searchValue);
  if (!keyword) return cloneValue(records);

  const searchableFields = [
    "actorName",
    "officialRole",
    "department",
    "action",
    "resourceType",
    "reference",
    "detail",
  ];

  return cloneValue(records.filter((record) =>
    searchableFields.some((fieldName) =>
      normalizeKey(record[fieldName]).includes(keyword),
    ),
  ));
};

const filter = (records, filters = {}) => cloneValue(records.filter((record) => {
  const createdAtTime = new Date(record.createdAt).getTime();
  const fromTime = filters.fromDate ? new Date(filters.fromDate).getTime() : null;
  const toTime = filters.toDate ? new Date(filters.toDate).getTime() : null;

  return (
    (!filters.userId || String(record.actorUserId) === String(filters.userId)) &&
    (!filters.actorName || record.actorName === filters.actorName) &&
    (!filters.officialRole || record.officialRole === filters.officialRole) &&
    (!filters.department || record.department === filters.department) &&
    (!filters.action || record.action === filters.action) &&
    (!filters.resourceType || record.resourceType === filters.resourceType) &&
    (!fromTime || createdAtTime >= fromTime) &&
    (!toTime || createdAtTime <= toTime)
  );
}));

const sort = (records, { direction = "desc", sortBy = "createdAt" } = {}) => {
  const multiplier = direction === "asc" ? 1 : -1;

  return cloneValue([...records].sort((firstRecord, secondRecord) => {
    const firstValue = firstRecord[sortBy] ?? "";
    const secondValue = secondRecord[sortBy] ?? "";
    if (firstValue === secondValue) return 0;
    return firstValue > secondValue ? multiplier : -multiplier;
  }));
};

const paginate = (records, { page = 1, pageSize = 10 } = {}) => {
  const normalizedPageSize = Math.max(1, Number(pageSize) || 10);
  const totalItems = records.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / normalizedPageSize));
  const normalizedPage = Math.min(Math.max(1, Number(page) || 1), totalPages);
  const startIndex = (normalizedPage - 1) * normalizedPageSize;

  return {
    data: cloneValue(records.slice(startIndex, startIndex + normalizedPageSize)),
    pagination: {
      page: normalizedPage,
      pageSize: normalizedPageSize,
      totalItems,
      totalPages,
    },
  };
};

const getList = async (query = {}) => paginate(
  sort(
    filter(search((await getAll()).filter(isVisibleRecord), query.search), query),
    {
      direction: query.direction ?? query.order ?? "desc",
      sortBy: query.sortBy ?? query.sort ?? "createdAt",
    },
  ),
  { page: query.page, pageSize: query.pageSize },
);

export const AuditTrailRepository = {
  create,
  filter,
  getAll,
  getById,
  getByProjectId,
  getList,
  hasDuplicate,
  paginate,
  search,
  sort,
  softDeleteMany,
  update,
};

export default AuditTrailRepository;
