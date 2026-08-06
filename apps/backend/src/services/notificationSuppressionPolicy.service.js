const notificationService = require('./notification.service');

const SLA_STATUS = Object.freeze({
  AT_RISK: 'At Risk',
  FINAL_AS_BUILT: 'Final As-Built',
  ON_TRACK: 'On Track',
  OVERDUE: 'Overdue',
});

const normalizeTimestamp = (value) => {
  if (!value) return null;
  const date = value instanceof Date ? value : new Date(value);

  return Number.isNaN(date.getTime()) ? String(value) : date.toISOString();
};

const createSlaStateTransitionIdentityBasis = ({
  currentSlaStatus,
  cycleId,
  previousEvaluation,
  previousSlaStatus,
}) => [
  'sla-state-transition',
  previousSlaStatus || 'None',
  currentSlaStatus,
  normalizeTimestamp(previousEvaluation?.updated_at) || 'initial',
  cycleId,
].filter(Boolean).join(':');

const evaluateSlaNotificationDecision = ({
  cycleId,
  document,
  previousEvaluation = null,
  previousSlaStatus = null,
}) => {
  const currentSlaStatus = document?.slaStatus || null;

  if (!document || !document.id || !document.projectId) {
    return {
      shouldGenerate: false,
      reason: 'missing_document_context',
    };
  }

  if (document.status === 'Approved' || currentSlaStatus === SLA_STATUS.FINAL_AS_BUILT) {
    return {
      currentSlaStatus,
      previousSlaStatus,
      shouldGenerate: false,
      reason: 'approved_document',
    };
  }

  if (!document.currentAssigneeUserId) {
    return {
      currentSlaStatus,
      previousSlaStatus,
      shouldGenerate: false,
      reason: 'missing_current_assignee',
    };
  }

  if (currentSlaStatus === SLA_STATUS.ON_TRACK) {
    return {
      currentSlaStatus,
      previousSlaStatus,
      shouldGenerate: false,
      reason: 'on_track_no_need_action',
    };
  }

  if (currentSlaStatus === SLA_STATUS.AT_RISK) {
    if (previousSlaStatus === SLA_STATUS.AT_RISK) {
      return {
        currentSlaStatus,
        previousSlaStatus,
        shouldGenerate: false,
        reason: 'same_state_suppressed',
      };
    }

    return {
      currentSlaStatus,
      eventType: notificationService.NOTIFICATION_EVENT_TYPE.SLA_AT_RISK,
      identityBasis: createSlaStateTransitionIdentityBasis({
        currentSlaStatus,
        cycleId,
        previousEvaluation,
        previousSlaStatus,
      }),
      previousSlaStatus,
      shouldGenerate: true,
    };
  }

  if (currentSlaStatus === SLA_STATUS.OVERDUE) {
    if (previousSlaStatus === SLA_STATUS.OVERDUE) {
      return {
        currentSlaStatus,
        previousSlaStatus,
        shouldGenerate: false,
        reason: 'same_state_suppressed',
      };
    }

    return {
      currentSlaStatus,
      eventType: notificationService.NOTIFICATION_EVENT_TYPE.SLA_OVERDUE,
      identityBasis: createSlaStateTransitionIdentityBasis({
        currentSlaStatus,
        cycleId,
        previousEvaluation,
        previousSlaStatus,
      }),
      previousSlaStatus,
      shouldGenerate: true,
    };
  }

  return {
    currentSlaStatus,
    previousSlaStatus,
    shouldGenerate: false,
    reason: 'unsupported_sla_state',
  };
};

module.exports = {
  SLA_STATUS,
  evaluateSlaNotificationDecision,
};
