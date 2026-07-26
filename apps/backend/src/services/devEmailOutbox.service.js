const crypto = require('node:crypto');
const env = require('../config/env');

const emails = [];
const MAX_EMAILS = 50;

const isEnabled = () => {
  return env.appEnv !== 'production' && env.email.enableDevEmailOutbox === true;
};

const assertEnabled = () => {
  if (!isEnabled()) {
    const error = new Error('Development email outbox is not available');
    error.statusCode = 404;
    throw error;
  }
};

const addEmail = (email) => {
  if (!isEnabled()) {
    return null;
  }

  const record = {
    id: crypto.randomUUID(),
    from: email.from,
    to: email.to,
    subject: email.subject,
    requestedAt: new Date().toISOString(),
    requestId: email.requestId,
    html: email.html,
    text: email.text,
    resetUrl: email.resetUrl,
    expiresAt: email.expiresAt instanceof Date
      ? email.expiresAt.toISOString()
      : email.expiresAt,
  };

  emails.unshift(record);

  if (emails.length > MAX_EMAILS) {
    emails.length = MAX_EMAILS;
  }

  return record;
};

const getEmails = () => {
  assertEnabled();
  return emails.map((email) => ({ ...email }));
};

const getEmailById = (emailId) => {
  assertEnabled();
  const email = emails.find((item) => item.id === emailId);
  return email ? { ...email } : null;
};

module.exports = {
  addEmail,
  getEmailById,
  getEmails,
  isEnabled,
};
