const documentRepository = require('../repositories/document.repository');
const auditService = require('./audit.service');
const notificationService = require('./notification.service');
const { normalizeText } = require('../utils/administration');
const slaService = require('./sla.service');

const DAY_MINUTES = 24 * 60;

const calculateDaysOverdue = (document) => Math.max(
  0,
  Number(document.slaTimer?.days || 0) - Math.max(0, Number(document.daysUntilValidation) || 0)
);

const calculateEscalationLevel = (daysOverdue) => {
  const normalizedDays = Math.max(0, Number(daysOverdue) || 0);

  if (normalizedDays >= 10) return 'Level 4';
  if (normalizedDays >= 7) return 'Level 3';
  if (normalizedDays >= 4) return 'Level 2';
  if (normalizedDays >= 1) return 'Level 1';

  return null;
};

const formatOverdueDuration = (document) => {
  const validationMinutes = Math.max(0, Number(document.daysUntilValidation) || 0) * DAY_MINUTES;
  const overdueMinutes = Math.max(0, Number(document.slaTimer?.totalMinutes || 0) - validationMinutes);
  const days = Math.floor(overdueMinutes / DAY_MINUTES);
  const hours = Math.floor((overdueMinutes % DAY_MINUTES) / 60);
  const minutes = overdueMinutes % 60;

  return `${days}d ${hours}h ${minutes}m`;
};

const createEscalationItem = (document) => {
  if (document.status === 'Approved' || document.slaStatus !== slaService.SLA_STATUS.OVERDUE) {
    return null;
  }

  const daysOverdue = calculateDaysOverdue(document);
  const escalationLevel = calculateEscalationLevel(daysOverdue);

  if (!escalationLevel) return null;

  return {
    ...document,
    currentStatus: document.status,
    daysOverdue,
    escalationLevel,
    overdueDuration: formatOverdueDuration(document),
  };
};

const createSummary = (items) => items.reduce((summary, item) => {
  summary.total += 1;
  if (summary[item.escalationLevel] !== undefined) {
    summary[item.escalationLevel] += 1;
  }
  return summary;
}, {
  'Level 1': 0,
  'Level 2': 0,
  'Level 3': 0,
  'Level 4': 0,
  total: 0,
});

const createEscalationNotification = async (item) => {
  const cycleId = slaService.createSlaCycleId(item);

  await notificationService.createSlaStateNotifications({
    cycleId,
    document: item,
    eventType: notificationService.NOTIFICATION_EVENT_TYPE.SLA_OVERDUE,
    metadata: {
      daysOverdue: item.daysOverdue,
      escalationLevel: item.escalationLevel,
    },
  });
  await auditService.recordActivitySafely({
    action: 'Escalation Created',
    identityKey: ['Escalation Created', item.projectId, item.id, cycleId].join(':'),
    metadata: {
      daysOverdue: item.daysOverdue,
      escalationLevel: item.escalationLevel,
      slaStatus: item.slaStatus,
    },
    projectId: item.projectId,
    reference: item.documentNumber,
    resourceId: item.id,
    resourceType: 'Escalation',
  });
};

const listEscalations = async ({ activeProject, query = {}, userId }) => {
  const projectId = await slaService.resolveProjectId({
    activeProject,
    queryProjectId: normalizeText(query.projectId),
    userId,
  });
  const level = normalizeText(query.escalationLevel || query.level);
  const status = normalizeText(query.status);
  const search = normalizeText(query.search).toLowerCase();
  let items = (await documentRepository.listProjectDocumentRegister(projectId))
    .map(createEscalationItem)
    .filter(Boolean);

  await Promise.all(items.map(createEscalationNotification));

  if (level) {
    items = items.filter((item) => item.escalationLevel === level);
  }
  if (status) {
    items = items.filter((item) => item.status === status);
  }
  if (search) {
    items = items.filter((item) => [
      item.documentNumber,
      item.description,
      item.status,
      item.currentAssignee,
      item.escalationLevel,
    ].some((value) => normalizeText(value).toLowerCase().includes(search)));
  }

  return {
    data: items,
    summary: createSummary(items),
  };
};

module.exports = {
  calculateDaysOverdue,
  calculateEscalationLevel,
  createEscalationItem,
  createSummary,
  listEscalations,
};
