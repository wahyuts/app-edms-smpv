import { DOCUMENT_STATUS } from "@/features/document-register/constants/document.constants";
import { DEPARTMENT_STATUSES } from "@/features/user-management/constants/department.constants";
import { USER_STATUSES } from "@/features/user-management/constants/user.constants";
import { DepartmentService } from "@/features/user-management/services/department.service";
import { UserService } from "@/features/user-management/services/user.service";
import { formatAssigneeRoleLabel } from "@/features/sla-management/utils/sla-timer-display";
import { ProjectService } from "@/features/project/services/project.service";

const normalizeText = (value) => String(value ?? "").trim();
const normalizeKey = (value) => normalizeText(value).toLowerCase();

const isActiveUser = (user) =>
  user?.status === USER_STATUSES.ACTIVE || user?.isActive === true;

const createActiveDepartmentLabelByKey = (departments = []) =>
  new Map(
    departments
      .filter((department) => department.status === DEPARTMENT_STATUSES.ACTIVE)
      .map((department) => [
        normalizeKey(department.name ?? department.departmentName),
        normalizeText(department.name ?? department.departmentName),
      ])
      .filter(([departmentKey, departmentLabel]) => departmentKey && departmentLabel),
  );

export const resolveResponsibleDepartment = ({
  departments = [],
  responsibleRole,
  projectId,
  users = [],
} = {}) => {
  const roleLabel = formatAssigneeRoleLabel(responsibleRole);
  if (!roleLabel) {
    return { departmentLabel: null, roleLabel: null };
  }

  const roleKey = normalizeKey(roleLabel);
  const activeDepartmentLabelByKey = createActiveDepartmentLabelByKey(departments);
  const departmentLabelsByKey = new Map();

  users
    .filter((user) =>
      isActiveUser(user) &&
      normalizeKey(
        user.projectOfficialRole ?? user.officialRole ?? user.roleName ?? user.role,
      ) === roleKey &&
      (!projectId || user.projectId === projectId))
    .forEach((user) => {
      const departmentKey = normalizeKey(user.department);
      const departmentLabel = activeDepartmentLabelByKey.get(departmentKey);

      if (departmentLabel) {
        departmentLabelsByKey.set(departmentKey, departmentLabel);
      }
    });

  return {
    departmentLabel:
      departmentLabelsByKey.size === 1
        ? [...departmentLabelsByKey.values()][0]
        : null,
    roleLabel,
  };
};

const getResponsibleRole = (document) => (
  document?.status === DOCUMENT_STATUS.APPROVED
    ? null
    : document?.responsibleRole ??
      document?.currentAssigneeRole ??
      document?.slaAssignee?.role
);

const resolveDocuments = async (documents = []) => {
  const [globalUsers, departments] = await Promise.all([
    UserService.getUsers(),
    DepartmentService.getAllDepartments(),
  ]);
  const usersByProject = new Map();

  await Promise.all([...new Set(documents.map((document) => document.projectId).filter(Boolean))]
    .map(async (projectId) => {
      const memberships = await ProjectService.getActiveProjectMemberships(projectId);
      const usersById = new Map(globalUsers.map((user) => [String(user.id), user]));

      usersByProject.set(
        projectId,
        memberships
          .map((membership) => {
            const user = usersById.get(String(membership.userId));

            return user
              ? {
                  ...user,
                  projectId,
                  projectOfficialRole: membership.officialRole,
                }
              : null;
          })
          .filter(Boolean),
      );
    }));

  return documents.map((document) => ({
    ...document,
    slaDisplayAssignment: resolveResponsibleDepartment({
      departments,
      projectId: document.projectId,
      responsibleRole: getResponsibleRole(document),
      users: usersByProject.get(document.projectId) ?? [],
    }),
  }));
};

export const SlaResponsiblePartyResolverService = {
  resolveDocuments,
  resolveResponsibleDepartment,
};

export default SlaResponsiblePartyResolverService;
