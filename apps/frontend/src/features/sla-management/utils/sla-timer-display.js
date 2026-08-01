import { OFFICIAL_ROLES } from "@/features/user-management/constants/user.constants";
import { SLA_STATUS } from "@/features/document-register/constants/document.constants";

const emptyDisplayValues = new Set(["", "-", "none", "null", "undefined"]);
const SLA_DIAG_RUNTIME_LOG_INTERVAL_MS = 10000;
const isSlaDiagnosticsEnabled =
  import.meta.env.DEV || import.meta.env.VITE_ENABLE_SLA_DIAGNOSTICS === "true";
const slaDiagnosticDocumentId = String(import.meta.env.VITE_SLA_DIAGNOSTIC_DOCUMENT_ID ?? "").trim();
const slaDiagnosticDocumentNumber = String(import.meta.env.VITE_SLA_DIAGNOSTIC_DOCUMENT_NUMBER ?? "").trim();
const slaGuardDiagnostics = new Map();
const slaRuntimeDiagnostics = new Map();

let slaRuntimeCallCounter = 0;

const normalizeDisplayValue = (value) => String(value ?? "").trim();

const shouldTraceDocument = (document = {}) => {
  if (!isSlaDiagnosticsEnabled) return false;
  if (slaDiagnosticDocumentNumber) return document.documentNumber === slaDiagnosticDocumentNumber;
  if (slaDiagnosticDocumentId) return document.id === slaDiagnosticDocumentId;

  return true;
};

const logSlaDiagnostic = (prefix, payload) => {
  if (!isSlaDiagnosticsEnabled) return;

  console.info(prefix, payload);
};

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

const parseTimestamp = (value) => {
  if (!value) return null;

  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
};

const resolveSlaStartedAt = (document = {}) =>
  document.slaStartedAt ?? document.slaTimer?.startedAt ?? null;

const resolveSlaStoppedAt = (document = {}) =>
  document.slaStoppedAt ?? document.slaTimer?.stoppedAt ?? null;

export const resolveLiveSlaTimer = (document = {}, currentTimestamp = Date.now()) => {
  const callCounter = ++slaRuntimeCallCounter;
  const startedAt = parseTimestamp(resolveSlaStartedAt(document));
  const hasSlaTimer = Boolean(document.slaTimer);
  const shouldTrace = shouldTraceDocument(document);

  if (!startedAt || !document.slaTimer) {
    if (shouldTrace) {
      const reason = [
        !document.slaStartedAt && !document.slaTimer?.startedAt ? "missing_started_at" : null,
        document.slaStartedAt || document.slaTimer?.startedAt
          ? (!startedAt ? "invalid_started_at" : null)
          : null,
        !document.slaTimer ? "missing_sla_timer" : null,
      ].filter(Boolean);
      const diagnosticKey = document.id ?? document.documentNumber ?? `unknown-${callCounter}`;
      const now = Number(currentTimestamp);
      const previousGuardDiagnostic = slaGuardDiagnostics.get(diagnosticKey);
      const guardSignature = [
        resolveSlaStartedAt(document),
        hasSlaTimer,
        reason.join("|"),
      ].join("|");

      if (
        previousGuardDiagnostic?.signature !== guardSignature ||
        now - Number(previousGuardDiagnostic?.loggedAt || 0) >= SLA_DIAG_RUNTIME_LOG_INTERVAL_MS
      ) {
        slaGuardDiagnostics.set(diagnosticKey, {
          loggedAt: now,
          signature: guardSignature,
        });

        logSlaDiagnostic("[SLA_DIAG_GUARD]", {
          callCounter,
          currentTimestamp,
          documentId: document.id,
          documentNumber: document.documentNumber,
          hasSlaTimer,
          iso: new Date(currentTimestamp).toISOString(),
          parsedStartedAt: startedAt?.toISOString?.() ?? null,
          reason,
          slaStartedAt: resolveSlaStartedAt(document),
          slaTimer: document.slaTimer ?? null,
        });
      }
    }

    return document;
  }

  const stoppedAt = parseTimestamp(resolveSlaStoppedAt(document));
  const isFinal =
    document.status === "Approved" ||
    document.workflowStatus === "Approved" ||
    document.slaStatus === SLA_STATUS.FINAL_AS_BUILT;
  const calculationEnd = stoppedAt ?? (isFinal ? startedAt : new Date(currentTimestamp));
  const totalMinutes = Math.max(
    0,
    Math.floor((calculationEnd.getTime() - startedAt.getTime()) / 60000),
  );
  const days = Math.floor(totalMinutes / 1440);
  const hours = Math.floor((totalMinutes % 1440) / 60);
  const minutes = totalMinutes % 60;
  const resultDisplay = isFinal ? (document.slaTimer.display ?? "Done") : formatSlaTimerDisplay({ days, hours, minutes });
  const diagnosticKey = document.id ?? document.documentNumber ?? `unknown-${callCounter}`;
  const previousDiagnostic = slaRuntimeDiagnostics.get(diagnosticKey);
  const currentSignature = [
    document.status,
    document.workflowStatus,
    resolveSlaStartedAt(document),
    resolveSlaStoppedAt(document),
    document.slaTimer?.display,
    document.slaTimer?.totalMinutes,
    resultDisplay,
    totalMinutes,
    document.activeRevisionId,
  ].join("|");
  const now = Number(currentTimestamp);
  const isStuckCandidate = resultDisplay === "0d 0h 0m";
  const shouldLogRuntime =
    shouldTrace &&
    (
      previousDiagnostic?.signature !== currentSignature ||
      resultDisplay !== previousDiagnostic?.resultDisplay ||
      (
        isStuckCandidate &&
        now - Number(previousDiagnostic?.loggedAt || 0) >= SLA_DIAG_RUNTIME_LOG_INTERVAL_MS
      )
    );

  if (shouldLogRuntime) {
    slaRuntimeDiagnostics.set(diagnosticKey, {
      loggedAt: now,
      resultDisplay,
      signature: currentSignature,
    });
    logSlaDiagnostic("[SLA_DIAG_RUNTIME]", {
      callCounter,
      computedElapsedMinutes: totalMinutes,
      currentTimestamp,
      daysUntilValidation: document.daysUntilValidation,
      documentId: document.id,
      documentNumber: document.documentNumber,
      hasSlaTimer,
      iso: new Date(currentTimestamp).toISOString(),
      parsedStartedAt: startedAt.toISOString(),
      resultDisplay,
      slaStartedAt: resolveSlaStartedAt(document),
      slaStoppedAt: resolveSlaStoppedAt(document),
      slaTimerDisplay: document.slaTimer?.display ?? null,
      slaTimerTotalMinutes: document.slaTimer?.totalMinutes ?? null,
      status: document.status,
      workflowStatus: document.workflowStatus,
    });
  }

  return {
    ...document,
    slaTimer: {
      ...document.slaTimer,
      calculatedAt: calculationEnd.toISOString(),
      days,
      display: resultDisplay,
      hours,
      minutes,
      totalMinutes,
    },
  };
};
