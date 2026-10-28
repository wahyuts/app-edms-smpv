const logger = require('../config/logger');
const documentRepository = require('../repositories/document.repository');
const membershipRepository = require('../repositories/projectMembership.repository');
const emailService = require('./email.service');
const { buildApprovalEmail } = require('./templates/approvalEmail.template');
const { normalizeUserEmail } = require('../utils/userEmail');

const logResult = (event, result, recipientUserId = null) => {
  try {
    logger.log('[APPROVAL_EMAIL]', {
      approvalEventId: event.approvalEventId, projectId: event.projectId,
      documentId: event.documentId, recipientUserId, result,
      errorCategory: result === 'dispatch_failed' ? 'DISPATCH_FAILURE'
        : result === 'provider_failed_or_unknown' ? 'PROVIDER_FAILURE_OR_UNKNOWN' : null,
    });
  } catch { /* Logging must never affect approval or detached delivery. */ }
};

const deliver = async (receipt) => {
  const persistedEvent = await documentRepository.findApprovalEmailEvent(receipt);
  if (!persistedEvent || persistedEvent.workflowAction !== `Approval ${receipt.approvalCode}`) {
    logResult(receipt, 'event_not_found');
    return;
  }
  const email = buildApprovalEmail({ ...receipt, approvalTimestamp: persistedEvent.approvalTimestamp });
  const recipients = await membershipRepository.listApprovalEmailRecipients(receipt.projectId);
  if (recipients.length === 0) logResult(receipt, 'no_recipients');
  const seen = new Set();
  await Promise.all(recipients.map(async (recipient) => {
    const userId = String(recipient.userId);
    if (seen.has(userId)) return;
    seen.add(userId);
    const to = normalizeUserEmail(recipient.email);
    if (!to || /[\u0000-\u001f\u007f-\u009f]/.test(to) || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(to)) {
      logResult(receipt, 'skipped_invalid_email', recipient.userId);
      return;
    }
    try {
      const result = await emailService.sendApprovalNotification({
        ...email, to, requestId: `${receipt.approvalEventId}:${userId}`,
      });
      if (result?.success !== true) throw new Error('Email provider did not accept request');
      logResult(receipt, 'provider_accepted', recipient.userId);
    } catch {
      logResult(receipt, 'provider_failed_or_unknown', recipient.userId);
    }
  }));
};

// Best effort only: no provider wait, persistent queue, or automatic retry.
const dispatch = (receipt) => {
  const snapshot = { ...receipt };
  void Promise.resolve().then(() => deliver(snapshot)).catch(() => {
    logResult(snapshot, 'dispatch_failed');
  });
};

module.exports = { dispatch };
