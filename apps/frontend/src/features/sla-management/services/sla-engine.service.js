import {
  DOCUMENT_STATUS,
  SLA_STATUS,
} from "@/features/document-register/constants/document.constants";
import { formatSlaTimerDisplay } from "@/features/sla-management/utils/sla-timer-display";

const MINUTE_MS = 60 * 1000;
const HOUR_MINUTES = 60;
const DAY_MINUTES = 24 * HOUR_MINUTES;

const assigneeByStatus = {
  [DOCUMENT_STATUS.PROCESS_REVIEW]: {
    role: "Team Process",
  },
  [DOCUMENT_STATUS.PROCESS_COMMENT]: {
    role: "Document Owner",
  },
  [DOCUMENT_STATUS.PROCESS_REJECT]: {
    role: "Document Owner",
  },
  [DOCUMENT_STATUS.PROJECT_REVIEW]: {
    role: "Team Project",
  },
  [DOCUMENT_STATUS.PROJECT_COMMENT]: {
    role: "Document Owner",
  },
  [DOCUMENT_STATUS.PROJECT_REJECT]: {
    role: "Document Owner",
  },
  [DOCUMENT_STATUS.APPROVED]: null,
};

const toUtcIsoString = (value = new Date()) => {
  const date = value instanceof Date ? value : new Date(value);

  if (Number.isNaN(date.getTime())) {
    throw new Error("SLA timestamp is not valid.");
  }

  return date.toISOString();
};

const formatWibTimestamp = (value) => {
  if (!value) return null;

  const formattedTimestamp = new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    hour: "2-digit",
    hour12: false,
    minute: "2-digit",
    month: "short",
    second: "2-digit",
    timeZone: "Asia/Jakarta",
    year: "numeric",
  }).format(new Date(value));

  return `${formattedTimestamp} WIB`;
};

const getAssigneeSnapshot = (document, status = document.status) => {
  if (status === DOCUMENT_STATUS.APPROVED) return null;
  if (document.slaAssignee && status === document.status) return document.slaAssignee;

  return assigneeByStatus[status] ?? {
    department: document.responsibleDepartment ?? document.currentAssigneeDepartment ?? "",
    role: document.responsibleRole ?? "-",
  };
};

const createStatusEntry = (document, status, timestamp = new Date()) => {
  const slaStartedAt = toUtcIsoString(timestamp);
  const isApproved = status === DOCUMENT_STATUS.APPROVED;

  return {
    slaAssignee: getAssigneeSnapshot(document, status),
    slaStartedAt,
    slaStoppedAt: isApproved ? slaStartedAt : null,
  };
};

const getInitialPersistenceFields = (document) => {
  const baseline = document.slaStartedAt ?? document.lastUpdated ?? document.createdDate;
  const fields = createStatusEntry(document, document.status, baseline);

  return {
    ...fields,
    slaStoppedAt: document.status === DOCUMENT_STATUS.APPROVED
      ? document.slaStoppedAt ?? baseline
      : null,
  };
};

const evaluate = (document, now = new Date()) => {
  const calculatedAt = toUtcIsoString(now);
  const persistenceFields = document.slaStartedAt
    ? {
        slaAssignee: getAssigneeSnapshot(document),
        slaStartedAt: document.slaStartedAt,
        slaStoppedAt: document.slaStoppedAt ?? null,
      }
    : getInitialPersistenceFields(document);
  const isApproved = document.status === DOCUMENT_STATUS.APPROVED;
  const endTimestamp = isApproved
    ? persistenceFields.slaStoppedAt ?? calculatedAt
    : calculatedAt;
  const elapsedMilliseconds = Math.max(
    0,
    new Date(endTimestamp).getTime() - new Date(persistenceFields.slaStartedAt).getTime(),
  );
  const totalMinutes = Math.floor(elapsedMilliseconds / MINUTE_MS);
  const days = Math.floor(totalMinutes / DAY_MINUTES);
  const hours = Math.floor((totalMinutes % DAY_MINUTES) / HOUR_MINUTES);
  const minutes = totalMinutes % HOUR_MINUTES;
  const validationDays = Math.max(0, Number(document.daysUntilValidation) || 0);
  const slaStatus = isApproved
    ? SLA_STATUS.FINAL_AS_BUILT
    : days < validationDays
      ? SLA_STATUS.ON_TRACK
      : days === validationDays
        ? SLA_STATUS.AT_RISK
        : SLA_STATUS.OVERDUE;

  return {
    ...document,
    ...persistenceFields,
    slaStatus,
    slaTimer: {
      calculatedAt,
      calculatedAtWib: formatWibTimestamp(calculatedAt),
      days,
      display: isApproved
        ? "Done"
        : formatSlaTimerDisplay({
            days,
            hours,
            minutes,
          }),
      hours,
      minutes,
      startedAt: persistenceFields.slaStartedAt,
      startedAtWib: formatWibTimestamp(persistenceFields.slaStartedAt),
      stoppedAt: persistenceFields.slaStoppedAt,
      stoppedAtWib: formatWibTimestamp(persistenceFields.slaStoppedAt),
      totalMinutes,
    },
  };
};

export const SlaEngineService = {
  createStatusEntry,
  evaluate,
  formatWibTimestamp,
  getInitialPersistenceFields,
  toUtcIsoString,
};

export default SlaEngineService;
