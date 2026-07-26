const bcrypt = require('bcrypt');
const env = require('../config/env');
const logger = require('../config/logger');
const passwordRepository = require('../repositories/password.repository');
const emailService = require('./email.service');
const {
  generateResetToken,
  hashResetToken,
  generateResetRequestId,
  getResetTokenExpiresAt,
} = require('../utils/resetToken');
const { PASSWORD_MESSAGES } = require('../constants/password.constants');

const createPasswordError = (message = PASSWORD_MESSAGES.INVALID_RESET_TOKEN, statusCode = 401) => {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
};

const normalizeEmail = (email) => String(email || '').trim().toLowerCase();

const maskEmail = (email) => {
  const [localPart = '', domain = ''] = String(email || '').split('@');

  if (!localPart || !domain) {
    return '[invalid-email]';
  }

  const visibleLocal = localPart.slice(0, 2);
  return `${visibleLocal}${'*'.repeat(Math.max(localPart.length - 2, 1))}@${domain}`;
};

const sanitizeLogValue = (value) => {
  const text = String(value || '');
  const withoutApiKey = env.email.resendApiKey
    ? text.replaceAll(env.email.resendApiKey, '[redacted]')
    : text;
  const withoutEmails = withoutApiKey.replace(
    /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi,
    (email) => maskEmail(email)
  );

  return withoutEmails.slice(0, 200);
};

const logPasswordResetEmailFailure = ({ requestId, to, error }) => {
  logger.error('[EMAIL] Password reset delivery failed', {
    requestId,
    provider: env.email.provider,
    recipient: maskEmail(to),
    errorCode: sanitizeLogValue(error?.code || error?.name || 'EmailDeliveryError'),
    errorMessage: sanitizeLogValue(error?.message || 'Email delivery failed'),
    timestamp: new Date().toISOString(),
  });
};

const forgotPassword = async ({ username, registeredEmail }) => {
  const requestId = generateResetRequestId();
  const user = await passwordRepository.findActiveUserByUsername(username);
  const accountMatched = Boolean(user) && normalizeEmail(user.email) === normalizeEmail(registeredEmail);

  if (!accountMatched) {
    return {
      requestId,
    };
  }

  const resetToken = generateResetToken();
  const tokenHash = hashResetToken(resetToken);
  const expiresAt = getResetTokenExpiresAt(env.passwordResetExpiresIn);

  await passwordRepository.revokeActiveResetTokensByUserId(user.id);
  await passwordRepository.createResetToken({
    id: generateResetRequestId(),
    tokenHash,
    userId: user.id,
    requestId,
    expiresAt,
  });

  try {
    await emailService.sendPasswordReset({
      to: user.email,
      username: user.username,
      resetToken,
      expiresIn: env.passwordResetExpiresIn,
      expiresAt,
      requestId,
    });
  } catch (error) {
    logPasswordResetEmailFailure({
      requestId,
      to: user.email,
      error,
    });
  }

  return {
    requestId,
  };
};

const resetPassword = async ({ token, newPassword }) => {
  const tokenHash = hashResetToken(token);
  const resetToken = await passwordRepository.findValidResetToken(tokenHash);

  if (!resetToken) {
    throw createPasswordError();
  }

  const passwordHash = await bcrypt.hash(newPassword, env.bcryptRounds);

  await passwordRepository.resetPasswordWithToken({
    tokenId: resetToken.id,
    userId: resetToken.user_id,
    passwordHash,
  });

  return true;
};

module.exports = {
  forgotPassword,
  resetPassword,
};
