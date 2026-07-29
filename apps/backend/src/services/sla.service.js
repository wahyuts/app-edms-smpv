const documentRepository = require('../repositories/document.repository');
const projectMembershipRepository = require('../repositories/projectMembership.repository');
const slaRepository = require('../repositories/sla.repository');
const notificationService = require('./notification.service');
const { createEntityId, createHttpError, normalizeText } = require('../utils/administration');

const SLA_STATUS = Object.freeze({
  AT_RISK: 'At Risk',
  FINAL_AS_BUILT: 'Final As-Built',
  ON_TRACK: 'On Track',
  OVERDUE: 'Overdue',
});

const toSlaCycleTimestamp = (value) => {
  if (!value) return null;
  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    return value.toISOString();
  }

  const parsedDate = new Date(value);
  if (!Number.isNaN(parsedDate.getTime())) {
    return parsedDate.toISOString();
  }

  return String(value);
};

const createSlaCycleId = (document) => [
  document.projectId,
  document.id,
  toSlaCycleTimestamp(document.slaStartedAt || document.lastUpdated || document.createdDate),
].filter(Boolean).join(':');

const resolveProjectId = async ({ activeProject, queryProjectId, userId }) => {
  const projectId = queryProjectId || activeProject?.id || null;

  if (!projectId) {
    throw createHttpError('Project Aktif Wajib Dipilih', 422, [
      { field: 'projectId', message: 'Project Aktif Wajib Dipilih' },
    ]);
  }

  const membership = await projectMembershipRepository.findActiveMembershipByProjectAndUser({
    projectId,
    userId,
  });

  if (!membership) {
    throw createHttpError('User Tidak Memiliki Akses Project', 403);
  }

  return projectId;
};

const createSummary = (documents) => documents.reduce((summary, document) => {
  if (summary[document.slaStatus] !== undefined) {
    summary[document.slaStatus] += 1;
  }
  return summary;
}, {
  [SLA_STATUS.ON_TRACK]: 0,
  [SLA_STATUS.AT_RISK]: 0,
  [SLA_STATUS.OVERDUE]: 0,
  [SLA_STATUS.FINAL_AS_BUILT]: 0,
});

const persistEvaluations = async (documents) => {
  await Promise.all(documents.map(async (document) => {
    if (!document.slaStatus) return;

    const cycleId = createSlaCycleId(document);
    const existing = await slaRepository.findSlaEvaluationByCycle({
      cycleId,
      documentId: document.id,
    });

    await slaRepository.upsertSlaEvaluation({
      cycleId,
      currentState: document.slaStatus,
      documentId: document.id,
      evaluationId: existing?.id || createEntityId('SLA'),
      notifiedStates: existing?.notified_states || {},
      projectId: document.projectId,
    });
  }));
};

const createSlaNotifications = async (documents) => {
  await Promise.all(documents.map(async (document) => {
    if (document.status === 'Approved' || document.slaStatus !== SLA_STATUS.AT_RISK) return;

    await notificationService.createSlaStateNotifications({
      cycleId: createSlaCycleId(document),
      document,
      eventType: notificationService.NOTIFICATION_EVENT_TYPE.SLA_AT_RISK,
      metadata: {
        daysUntilValidation: document.daysUntilValidation,
        slaTimer: document.slaTimer,
      },
    });
  }));
};

const listSlaDocuments = async ({ activeProject, query = {}, userId }) => {
  const projectId = await resolveProjectId({
    activeProject,
    queryProjectId: normalizeText(query.projectId),
    userId,
  });
  const statusFilter = normalizeText(query.slaStatus);
  const documents = await documentRepository.listProjectDocumentRegister(projectId, { userId });
  const filteredDocuments = statusFilter && Object.values(SLA_STATUS).includes(statusFilter)
    ? documents.filter((document) => document.slaStatus === statusFilter)
    : documents;

  await persistEvaluations(documents);
  await createSlaNotifications(documents);

  return {
    data: filteredDocuments,
    summary: createSummary(documents),
  };
};

module.exports = {
  SLA_STATUS,
  createSlaCycleId,
  createSlaNotifications,
  createSummary,
  listSlaDocuments,
  persistEvaluations,
  resolveProjectId,
};
