import {
  DOCUMENT_STATUS,
  SLA_STATUS,
} from "@/features/document-register/constants/document.constants";
import { DocumentService } from "@/features/document-register/services/document.service";
import { SlaEngineService } from "@/features/sla-management/services/sla-engine.service";
import {
  AUDIT_RESOURCE_TYPE,
  AUDIT_TRAIL_ACTION,
  AuditTrailService,
} from "@/features/audit-trail";

const HOUR_MINUTES = 60;
const DAY_MINUTES = 24 * HOUR_MINUTES;

const cloneValue = (value) => JSON.parse(JSON.stringify(value));

const getOverdueMinutes = (document) => {
  const totalMinutes = document.slaTimer?.totalMinutes ?? 0;
  const validationDays = Math.max(0, Number(document.daysUntilValidation) || 0);

  return Math.max(0, totalMinutes - (validationDays * DAY_MINUTES));
};

const calculateDaysOverdue = (document) =>
  Math.max(
    0,
    (document.slaTimer?.days ?? 0) -
      (Math.max(0, Number(document.daysUntilValidation) || 0)),
  );

const formatOverdueDuration = (document) => {
  const overdueMinutes = getOverdueMinutes(document);
  const days = Math.floor(overdueMinutes / DAY_MINUTES);
  const hours = Math.floor((overdueMinutes % DAY_MINUTES) / HOUR_MINUTES);
  const minutes = overdueMinutes % HOUR_MINUTES;

  return `${days}d ${hours}h ${minutes}m`;
};

const calculateEscalationLevel = (daysOverdue) => {
  const normalizedDaysOverdue = Math.max(0, Number(daysOverdue) || 0);

  if (normalizedDaysOverdue >= 10) return "Level 4";
  if (normalizedDaysOverdue >= 7) return "Level 3";
  if (normalizedDaysOverdue >= 4) return "Level 2";
  if (normalizedDaysOverdue >= 1) return "Level 1";

  return null;
};

const evaluateDocumentSla = (document, now) =>
  SlaEngineService.evaluate(document, now ?? new Date());

const isEscalated = (document, now) => {
  const evaluatedDocument = evaluateDocumentSla(document, now);

  return evaluatedDocument.status !== DOCUMENT_STATUS.APPROVED &&
    evaluatedDocument.slaStatus === SLA_STATUS.OVERDUE;
};

const createEscalationItem = (document, now) => {
  const evaluatedDocument = evaluateDocumentSla(document, now);

  if (
    evaluatedDocument.status === DOCUMENT_STATUS.APPROVED ||
    evaluatedDocument.slaStatus !== SLA_STATUS.OVERDUE
  ) {
    return null;
  }

  const daysOverdue = calculateDaysOverdue(evaluatedDocument);

  return {
    ...evaluatedDocument,
    currentStatus: evaluatedDocument.status,
    daysOverdue,
    escalationLevel: calculateEscalationLevel(daysOverdue),
    overdueDuration: formatOverdueDuration(evaluatedDocument),
  };
};

const getEscalations = async ({ documents, now } = {}) => {
  const sourceDocuments = documents ?? await DocumentService.getDocuments();
  const escalationItems = sourceDocuments
    .map((document) => createEscalationItem(document, now))
    .filter(Boolean);

  await Promise.all(
    escalationItems.map((document) =>
      AuditTrailService.recordActivitySafely({
        action: AUDIT_TRAIL_ACTION.ESCALATION_CREATED,
        identityKey: [
          AUDIT_TRAIL_ACTION.ESCALATION_CREATED,
          document.id,
          document.slaStartedAt ?? document.lastUpdated ?? document.createdDate,
        ].join(":"),
        metadata: {
          escalationLevel: document.escalationLevel,
          slaStatus: document.slaStatus,
        },
        projectId: document.projectId,
        reference: document.documentNumber,
        resourceId: document.id,
        resourceType: AUDIT_RESOURCE_TYPE.ESCALATION,
      })),
  );

  return cloneValue(escalationItems);
};

export const EscalationService = {
  calculateDaysOverdue,
  calculateEscalationLevel,
  createEscalationItem,
  getEscalations,
  isEscalated,
};

export default EscalationService;
