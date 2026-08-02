const documentRepository = require('../repositories/document.repository');
const slaRepository = require('../repositories/sla.repository');
const auditService = require('./audit.service');
const notificationService = require('./notification.service');
const timeService = require('./time.service');
const logger = require('../config/logger');
const { createEntityId } = require('../utils/administration');
const { createSlaCycleId } = require('../utils/slaCycle');

const SLA_STATUS = Object.freeze({
  AT_RISK: 'At Risk',
  FINAL_AS_BUILT: 'Final As-Built',
  ON_TRACK: 'On Track',
  OVERDUE: 'Overdue',
});

const DAY_MINUTES = 24 * 60;

const normalizeDate = (value) => {
  if (!value) return null;
  const date = value instanceof Date ? value : new Date(value);

  return Number.isNaN(date.getTime()) ? null : date;
};

const createSlaTimerSnapshot = ({ document, serverNow }) => {
  const startedAt = normalizeDate(document.slaStartedAt);
  const calculatedAt = normalizeDate(serverNow);

  if (!startedAt || !calculatedAt) {
    return {
      slaStatus: null,
      slaTimer: null,
    };
  }

  const totalMinutes = Math.max(0, Math.floor((calculatedAt.getTime() - startedAt.getTime()) / 60000));
  const days = Math.floor(totalMinutes / DAY_MINUTES);
  const hours = Math.floor((totalMinutes % DAY_MINUTES) / 60);
  const minutes = totalMinutes % 60;
  const validationDays = Math.max(0, Number(document.daysUntilValidation) || 0);
  const slaStatus = days < validationDays
    ? SLA_STATUS.ON_TRACK
    : days === validationDays
      ? SLA_STATUS.AT_RISK
      : SLA_STATUS.OVERDUE;

  return {
    slaStatus,
    slaTimer: {
      calculatedAt,
      days,
      display: `${days}d ${hours}h ${minutes}m`,
      hours,
      minutes,
      startedAt,
      stoppedAt: null,
      totalMinutes,
    },
  };
};

const evaluateDocumentWithServerTime = (document, serverNow) => {
  if (!document) return null;
  if (document.status === 'Approved') {
    return {
      ...document,
      slaStatus: SLA_STATUS.FINAL_AS_BUILT,
    };
  }

  const evaluation = createSlaTimerSnapshot({ document, serverNow });

  return {
    ...document,
    ...evaluation,
  };
};

const createEscalationMetadata = (document) => {
  const validationMinutes = Math.max(0, Number(document.daysUntilValidation) || 0) * DAY_MINUTES;
  const totalMinutes = Math.max(0, Number(document.slaTimer?.totalMinutes || 0));
  const overdueMinutes = Math.max(0, totalMinutes - validationMinutes);
  const daysOverdue = Math.max(0, Math.floor(overdueMinutes / DAY_MINUTES));
  let escalationLevel = null;

  if (daysOverdue >= 10) escalationLevel = 'Level 4';
  else if (daysOverdue >= 7) escalationLevel = 'Level 3';
  else if (daysOverdue >= 4) escalationLevel = 'Level 2';
  else if (daysOverdue >= 1) escalationLevel = 'Level 1';

  return {
    daysOverdue,
    escalationLevel,
  };
};

const logProducerResult = ({
  createdCount = 0,
  document,
  duplicateCount = 0,
  eventType = '-',
  previousSlaStatus = null,
  result = 'processed',
  skippedCount = 0,
  triggerSource,
}) => {
  logger.log(
    '[SLA_NOTIFICATION_PRODUCER]',
    `event=${eventType}`,
    `triggerSource=${triggerSource}`,
    `projectId=${document?.projectId || '-'}`,
    `documentId=${document?.id || '-'}`,
    `documentNumber=${document?.documentNumber || '-'}`,
    `cycleId=${document ? createSlaCycleId(document) : '-'}`,
    `previousSlaStatus=${previousSlaStatus || '-'}`,
    `currentSlaStatus=${document?.slaStatus || '-'}`,
    `resolvedRecipients=${createdCount + duplicateCount + skippedCount}`,
    `createdCount=${createdCount}`,
    `skippedCount=${skippedCount}`,
    `duplicateCount=${duplicateCount}`,
    `result=${result}`
  );
};

const createNotificationForSlaStatus = async ({ document, eventType }) => {
  const result = await notificationService.createSlaStateNotifications({
    cycleId: createSlaCycleId(document),
    document,
    eventType,
    metadata: eventType === notificationService.NOTIFICATION_EVENT_TYPE.SLA_OVERDUE
      ? createEscalationMetadata(document)
      : {
          daysUntilValidation: document.daysUntilValidation,
          slaTimer: document.slaTimer,
        },
  });

  return {
    attemptedRecipientCount: Number(result?.attemptedRecipientCount || 0),
    createdCount: Number(result?.createdCount || 0),
  };
};

const persistEvaluation = async ({ currentState, cycleId, document, existing }) => {
  if (!currentState || currentState === SLA_STATUS.FINAL_AS_BUILT) return;

  await slaRepository.upsertSlaEvaluation({
    cycleId,
    currentState,
    documentId: document.id,
    evaluationId: existing?.id || createEntityId('SLA'),
    notifiedStates: existing?.notified_states || {},
    projectId: document.projectId,
  });
};

const evaluateDocumentForSlaNotifications = async ({
  document,
  serverNow = null,
  triggerSource = 'unknown',
}) => {
  if (!document || document.status === 'Approved') {
    logProducerResult({
      document,
      result: 'not_eligible',
      triggerSource,
    });
    return {
      createdCount: 0,
      result: 'not_eligible',
    };
  }

  const authoritativeTime = serverNow || (await timeService.getServerTime()).serverNow;
  const evaluatedDocument = evaluateDocumentWithServerTime(document, authoritativeTime);
  if (!evaluatedDocument?.slaStatus) {
    logProducerResult({
      document: evaluatedDocument || document,
      result: 'missing_sla_baseline',
      triggerSource,
    });
    return {
      createdCount: 0,
      result: 'missing_sla_baseline',
    };
  }

  const cycleId = createSlaCycleId(evaluatedDocument);
  const existing = await slaRepository.findSlaEvaluationByCycle({
    cycleId,
    documentId: evaluatedDocument.id,
  });
  const previousSlaStatus = existing?.current_state || null;

  await persistEvaluation({
    currentState: evaluatedDocument.slaStatus,
    cycleId,
    document: evaluatedDocument,
    existing,
  });

  if (evaluatedDocument.slaStatus === SLA_STATUS.ON_TRACK) {
    logProducerResult({
      document: evaluatedDocument,
      previousSlaStatus,
      result: 'on_track',
      triggerSource,
    });
    return {
      createdCount: 0,
      previousSlaStatus,
      result: 'on_track',
      slaStatus: evaluatedDocument.slaStatus,
    };
  }

  const eventType = evaluatedDocument.slaStatus === SLA_STATUS.AT_RISK
    ? notificationService.NOTIFICATION_EVENT_TYPE.SLA_AT_RISK
    : notificationService.NOTIFICATION_EVENT_TYPE.SLA_OVERDUE;
  const notificationResult = await createNotificationForSlaStatus({
    document: evaluatedDocument,
    eventType,
  });
  const duplicateCount = Math.max(0, notificationResult.attemptedRecipientCount - notificationResult.createdCount);

  if (eventType === notificationService.NOTIFICATION_EVENT_TYPE.SLA_OVERDUE) {
    const escalationMetadata = createEscalationMetadata(evaluatedDocument);
    await auditService.recordActivitySafely({
      action: 'Escalation Created',
      identityKey: ['Escalation Created', evaluatedDocument.projectId, evaluatedDocument.id, cycleId].join(':'),
      metadata: {
        daysOverdue: escalationMetadata.daysOverdue,
        escalationLevel: escalationMetadata.escalationLevel,
        slaStatus: evaluatedDocument.slaStatus,
        triggerSource,
      },
      projectId: evaluatedDocument.projectId,
      reference: evaluatedDocument.documentNumber,
      resourceId: evaluatedDocument.id,
      resourceType: 'Escalation',
    });
  }

  logProducerResult({
    createdCount: notificationResult.createdCount,
    document: evaluatedDocument,
    duplicateCount,
    eventType,
    previousSlaStatus,
    result: notificationResult.createdCount > 0 ? 'created' : 'duplicate_or_no_recipient',
    triggerSource,
  });

  return {
    createdCount: notificationResult.createdCount,
    duplicateCount,
    eventType,
    previousSlaStatus,
    result: notificationResult.createdCount > 0 ? 'created' : 'duplicate_or_no_recipient',
    slaStatus: evaluatedDocument.slaStatus,
  };
};

const evaluateDocumentsForSlaNotifications = async ({
  documents = [],
  triggerSource = 'scheduled_evaluation',
} = {}) => {
  const authoritativeTime = (await timeService.getServerTime()).serverNow;
  const results = [];

  for (const document of documents) {
    try {
      results.push(await evaluateDocumentForSlaNotifications({
        document,
        serverNow: authoritativeTime,
        triggerSource,
      }));
    } catch (error) {
      logger.error(
        '[SLA_NOTIFICATION_PRODUCER]',
        `event=evaluation_failed`,
        `triggerSource=${triggerSource}`,
        `projectId=${document?.projectId || '-'}`,
        `documentId=${document?.id || '-'}`,
        `documentNumber=${document?.documentNumber || '-'}`,
        `error=${error.message}`
      );
      results.push({
        createdCount: 0,
        error: error.message,
        result: 'failed',
      });
    }
  }

  return results;
};

const runScheduledEvaluation = async ({
  batchSize = 200,
  triggerSource = 'scheduled_evaluation',
} = {}) => {
  const documents = await documentRepository.listSlaNotificationCandidateDocuments({ limit: batchSize });
  const results = await evaluateDocumentsForSlaNotifications({
    documents,
    triggerSource,
  });

  return {
    processedCount: documents.length,
    createdCount: results.reduce((total, result) => total + Number(result?.createdCount || 0), 0),
    failedCount: results.filter((result) => result?.result === 'failed').length,
    results,
  };
};

module.exports = {
  SLA_STATUS,
  evaluateDocumentForSlaNotifications,
  evaluateDocumentsForSlaNotifications,
  evaluateDocumentWithServerTime,
  runScheduledEvaluation,
};
