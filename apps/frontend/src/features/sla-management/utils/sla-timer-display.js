import { OFFICIAL_ROLES } from "@/features/user-management/constants/user.constants";
import { SLA_STATUS } from "@/features/document-register/constants/document.constants";

const emptyDisplayValues = new Set(["", "-", "none", "null", "undefined"]);

const normalizeDisplayValue = (value) => String(value ?? "").trim();

const officialRoleLabels = new Map(
  OFFICIAL_ROLES.flatMap(({ roleName }) => {
    const normalizedRoleName = normalizeDisplayValue(roleName);
    const roleSlug = normalizedRoleName.toLowerCase().replace(/\s+/g, ".");

    return [
      [normalizedRoleName.toLowerCase(), normalizedRoleName],
      [roleSlug, normalizedRoleName],
    ];
  }),
);

const isMeaningfulDisplayValue = (value) => {
  const normalizedValue = normalizeDisplayValue(value);

  return !emptyDisplayValues.has(normalizedValue.toLowerCase());
};

export const formatAssigneeRoleLabel = (role) => {
  const normalizedRole = normalizeDisplayValue(role);
  if (!isMeaningfulDisplayValue(normalizedRole)) return "";

  return officialRoleLabels.get(normalizedRole.toLowerCase()) ?? normalizedRole;
};

export const formatCurrentAssigneeRole = (role) => {
  const roleLabel = formatAssigneeRoleLabel(role);
  if (!roleLabel) return "-";

  if (["admin", "document owner"].includes(roleLabel.toLowerCase())) {
    return "Admin / Document Owner";
  }

  return roleLabel;
};

export const resolveCurrentAssigneeRoleDisplay = (document = {}) => {
  const role =
    document?.slaDisplayAssignment?.roleLabel ??
    document?.currentAssigneeRole ??
    document?.slaAssignee?.role ??
    document?.responsibleRole;

  return formatCurrentAssigneeRole(role);
};

export const formatTimeForReview = (days) => {
  if (days === null || days === undefined || String(days).trim() === "") {
    return "-";
  }

  const normalizedDays = Number(days);
  if (!Number.isFinite(normalizedDays) || normalizedDays < 0) return "-";
  if (normalizedDays === 0) return "Today";
  if (normalizedDays === 1) return "1 Day";

  return `${normalizedDays} Days`;
};

export const getSlaTimerTextClassName = (slaStatus) => {
  if (slaStatus === SLA_STATUS.AT_RISK) return "font-semibold text-[#FDE68A]";
  if (slaStatus === SLA_STATUS.OVERDUE) return "font-semibold text-[#FCA5A5]";

  return "text-[#CBD5E1]";
};

export const getSlaTimerTooltip = (slaStatus) => {
  if (slaStatus === SLA_STATUS.AT_RISK) return "SLA Timer is At Risk";
  if (slaStatus === SLA_STATUS.OVERDUE) return "SLA Timer is Overdue";

  return undefined;
};

export const formatSlaAssigneeLabel = ({ assignee, document } = {}) => {
  if (document?.slaDisplayAssignment) {
    return [
      formatAssigneeRoleLabel(document.slaDisplayAssignment.roleLabel),
      normalizeDisplayValue(document.slaDisplayAssignment.departmentLabel),
    ].filter(isMeaningfulDisplayValue).join(" ");
  }

  const role = formatAssigneeRoleLabel(
    document?.responsibleRole ??
      document?.currentAssigneeRole ??
      assignee?.role,
  );
  const department = normalizeDisplayValue(
    document?.responsibleDepartment ??
      document?.currentAssigneeDepartment ??
      assignee?.department,
  );
  const labelParts = [role];

  if (isMeaningfulDisplayValue(department)) {
    labelParts.push(department);
  }

  return labelParts.filter(Boolean).join(" ");
};

export const formatSlaTimerDisplay = ({
  days,
  hours,
  minutes,
}) => {
  const normalizedDays = Math.max(0, Number(days) || 0);
  const normalizedHours = Math.max(0, Number(hours) || 0);
  const normalizedMinutes = Math.max(0, Number(minutes) || 0);

  return `${normalizedDays}d ${normalizedHours}h ${normalizedMinutes}m`;
};
