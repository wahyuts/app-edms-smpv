import { USER_DEPARTMENT_OPTIONS } from "../constants/user.constants";
import { DEPARTMENT_STATUSES } from "../constants/department.constants";
import { DepartmentPersistenceRepository, DepartmentRepository } from "../repositories/department.repository";
import { UserMetadataRepository } from "../repositories/user.repository";

const DEPARTMENT_SEED_VERSION = 1;
const DEPARTMENT_SEED_VERSION_KEY = "departmentSeedVersion";

const cloneValue = (value) => JSON.parse(JSON.stringify(value));
const normalizeText = (value) => String(value ?? "").trim();
const normalizeKey = (value) => normalizeText(value).toLowerCase();

const normalizeDepartmentRecord = (department = {}) => {
  const name = normalizeText(department.name ?? department.departmentName);

  return {
    ...department,
    departmentName: name,
    name,
    nameKey: normalizeKey(name),
    status: department.status ?? DEPARTMENT_STATUSES.ACTIVE,
    updatedAt: department.updatedAt ?? null,
  };
};

const buildSeedDepartments = () => {
  const now = new Date().toISOString();

  return cloneValue(USER_DEPARTMENT_OPTIONS).map((name, index) =>
    normalizeDepartmentRecord({
      createdAt: now,
      id: index + 1,
      name,
      status: DEPARTMENT_STATUSES.ACTIVE,
      updatedAt: null,
    }),
  );
};

const initialize = async () => {
  const departments = await DepartmentRepository.getAll();
  const seedVersion = await UserMetadataRepository.getById(DEPARTMENT_SEED_VERSION_KEY);

  if (departments.length > 0 && seedVersion?.value === DEPARTMENT_SEED_VERSION) {
    return { seeded: false, version: DEPARTMENT_SEED_VERSION };
  }

  const metadata = [
    { key: DEPARTMENT_SEED_VERSION_KEY, value: DEPARTMENT_SEED_VERSION },
    { key: "departmentSeededAt", value: new Date().toISOString() },
  ];

  await DepartmentPersistenceRepository.runSeedMerge({
    departments: departments.length > 0
      ? departments.map(normalizeDepartmentRecord)
      : buildSeedDepartments(),
    metadata,
  });

  return {
    migrated: departments.length > 0,
    seeded: departments.length === 0,
    version: DEPARTMENT_SEED_VERSION,
  };
};

export const DepartmentSeedService = {
  initialize,
};

export default DepartmentSeedService;
