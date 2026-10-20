const { createHttpError } = require('./administration');

const SHARED_EMAILS = new Set([
  'wahyu.trisna100@gmail.com',
  'beta.int100@gmail.com',
]);

const normalizeUserEmail = (value) => String(value ?? '').trim().toLowerCase() || null;
const requiresUniqueEmail = (value) => {
  const email = normalizeUserEmail(value);
  return email !== null && !SHARED_EMAILS.has(email);
};

const mapEmailDuplicateError = (error) => {
  if (error?.code !== 'ER_DUP_ENTRY') return null;
  // Match the index name, not the duplicate value supplied by the user.
  const key = /for key ['`"]([^'`"]+)['`"]/i.exec(error.sqlMessage || error.message || '')?.[1];
  if (!['uq_users_email', 'uq_users_email_uniqueness_key'].includes(key?.split('.').pop())) return null;
  return createHttpError('Email sudah digunakan.', 409, [
    { field: 'email', message: 'Email sudah digunakan.' },
  ]);
};

module.exports = { normalizeUserEmail, requiresUniqueEmail, mapEmailDuplicateError };
