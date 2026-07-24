import {
  DOCUMENT_STATUS,
  SLA_STATUS,
} from "@/features/document-register/constants/document.constants";
import { DocumentRepository } from "@/features/document-register/repositories/document.repository";
import { DocumentService } from "@/features/document-register/services/document.service";
import {
  NOTIFICATION_EVENT_TYPE,
  NotificationService,
} from "@/features/notification";
import { SlaEngineService } from "@/features/sla-management/services/sla-engine.service";

const cloneValue = (value) => JSON.parse(JSON.stringify(value));

const evaluateDocument = (document, now) => SlaEngineService.evaluate(
  document,
  now ?? new Date(),
);

const slaNotificationEventByStatus = {
  [SLA_STATUS.AT_RISK]: NOTIFICATION_EVENT_TYPE.SLA_AT_RISK,
  [SLA_STATUS.OVERDUE]: NOTIFICATION_EVENT_TYPE.SLA_OVERDUE,
};

const createSlaCycleId = (document) => [
  document?.projectId,
  document?.id,
  document?.slaStartedAt ?? document?.lastUpdated ?? document?.createdDate,
].filter(Boolean).join(":");

const createNotificationStateKey = (slaStatus) => String(slaStatus ?? "").trim();

const getCycleEvaluation = (document, cycleId) => {
  const evaluation = document?.slaStateEvaluation;

  if (!evaluation || evaluation.cycleId !== cycleId) {
    return {
      currentState: null,
      notifiedStates: {},
    };
  }

  return {
    currentState: evaluation.currentState ?? null,
    notifiedStates: evaluation.notifiedStates ?? {},
  };
};

const updatePersistedSlaEvaluation = async ({
  document,
  notificationWasProcessed,
  previousNotifiedStates,
}) => {
  const persistedDocument = await DocumentRepository.getById(document.id);
  if (!persistedDocument) return;

  const cycleId = createSlaCycleId(document);
  const stateKey = createNotificationStateKey(document.slaStatus);
  const nextNotifiedStates = {
    ...previousNotifiedStates,
  };

  if (notificationWasProcessed && stateKey) {
    nextNotifiedStates[stateKey] = true;
  }

  await DocumentRepository.update({
    ...persistedDocument,
    slaStateEvaluation: {
      cycleId,
      currentState: document.slaStatus,
      notifiedStates: nextNotifiedStates,
      updatedAt: document.slaTimer?.calculatedAt ?? new Date().toISOString(),
    },
  });
};

const createSlaTransitionNotifications = async (documents) => {
  await Promise.all(documents.map(async (document) => {
    if (!document?.id) return;

    const persistedDocument = await DocumentRepository.getById(document.id);
    const cycleId = createSlaCycleId(document);
    const { currentState: previousState, notifiedStates } = getCycleEvaluation(
      persistedDocument,
      cycleId,
    );
    const notificationEventType = document.status === DOCUMENT_STATUS.APPROVED
      ? null
      : slaNotificationEventByStatus[document.slaStatus];
    const stateKey = createNotificationStateKey(document.slaStatus);
    const hasProcessedStateEntry = Boolean(notifiedStates[stateKey]);
    const shouldCreateNotification =
      Boolean(notificationEventType) &&
      previousState !== document.slaStatus &&
      !hasProcessedStateEntry;
    let notificationWasProcessed = false;

    if (shouldCreateNotification) {
      const result = await NotificationService.createSlaStateNotification({
        document,
        eventType: notificationEventType,
      });
      notificationWasProcessed = Boolean(result?.created || result?.duplicate);
    }

    await updatePersistedSlaEvaluation({
      document,
      notificationWasProcessed,
      previousNotifiedStates: notifiedStates,
    });
  }));
};

const getDocuments = async ({ documents, now } = {}) => {
  const sourceDocuments = documents ?? await DocumentService.getDocuments();
  const evaluatedDocuments = sourceDocuments.map((documentItem) =>
    evaluateDocument(documentItem, now),
  );

  await createSlaTransitionNotifications(evaluatedDocuments);

  return cloneValue(evaluatedDocuments);
};

const createSummary = (documents) => {
  const summary = {
    [SLA_STATUS.ON_TRACK]: 0,
    [SLA_STATUS.AT_RISK]: 0,
    [SLA_STATUS.OVERDUE]: 0,
    [SLA_STATUS.FINAL_AS_BUILT]: 0,
  };

  documents.forEach((documentItem) => {
    if (summary[documentItem.slaStatus] !== undefined) {
      summary[documentItem.slaStatus] += 1;
    }
  });

  return summary;
};

export const SlaMonitoringService = {
  createSummary,
  evaluateDocument,
  getDocuments,
};

export default SlaMonitoringService;
