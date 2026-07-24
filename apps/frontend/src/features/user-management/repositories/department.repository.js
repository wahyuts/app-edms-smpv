import {
  EDMS_STORE,
  runEdmsTransaction,
  runStoreRequest,
} from "@/shared/services/indexeddb.service";

const normalizeText = (value) => String(value ?? "").trim();
const normalizeNameKey = (value) => normalizeText(value).toLowerCase();

export const DepartmentRepository = {
  activate: async (departmentId) => {
    const department = await DepartmentRepository.getById(departmentId);
    if (!department) return null;

    const updatedDepartment = {
      ...department,
      status: "Active",
      updatedAt: new Date().toISOString(),
    };

    await DepartmentRepository.update(updatedDepartment);
    return updatedDepartment;
  },
  checkNameUniqueness: async (departmentName, currentDepartmentId = null) => {
    const nameKey = normalizeNameKey(departmentName);
    if (!nameKey) return false;

    const departments = await DepartmentRepository.getAll();
    return !departments.some((department) =>
      department.id !== currentDepartmentId &&
      normalizeNameKey(department.name ?? department.departmentName) === nameKey,
    );
  },
  create: (department) => runStoreRequest(
    EDMS_STORE.DEPARTMENTS,
    "readwrite",
    (store) => store.add(department),
  ),
  deactivate: async (departmentId) => {
    const department = await DepartmentRepository.getById(departmentId);
    if (!department) return null;

    const updatedDepartment = {
      ...department,
      status: "Inactive",
      updatedAt: new Date().toISOString(),
    };

    await DepartmentRepository.update(updatedDepartment);
    return updatedDepartment;
  },
  getAll: () => runStoreRequest(
    EDMS_STORE.DEPARTMENTS,
    "readonly",
    (store) => store.getAll(),
  ),
  getById: async (departmentId) => (
    await runStoreRequest(
      EDMS_STORE.DEPARTMENTS,
      "readonly",
      (store) => store.get(departmentId),
    )
  ) ?? null,
  getByName: async (departmentName) => {
    const nameKey = normalizeNameKey(departmentName);
    if (!nameKey) return null;

    const departments = await DepartmentRepository.getAll();
    return departments.find((department) =>
      normalizeNameKey(department.name ?? department.departmentName) === nameKey,
    ) ?? null;
  },
  update: (department) => runStoreRequest(
    EDMS_STORE.DEPARTMENTS,
    "readwrite",
    (store) => store.put(department),
  ),
};

export const DepartmentPersistenceRepository = {
  runMutation: (operation) => runEdmsTransaction(
    [EDMS_STORE.DEPARTMENTS, EDMS_STORE.METADATA],
    "readwrite",
    operation,
  ),
  runSeedMerge: ({ departments, metadata }) => runEdmsTransaction(
    [EDMS_STORE.DEPARTMENTS, EDMS_STORE.METADATA],
    "readwrite",
    (stores) => {
      departments.forEach((department) => {
        stores[EDMS_STORE.DEPARTMENTS].put(department);
      });
      metadata.forEach((record) => {
        stores[EDMS_STORE.METADATA].put(record);
      });
    },
  ),
};

