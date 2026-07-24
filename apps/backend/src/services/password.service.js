const bcrypt = require('bcrypt');
const env = require('../config/env');
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

const forgotPassword = async ({ username }) => {
  const user = await passwordRepository.findActiveUserByUsername(username);

  if (!user) {
    return true;
  }

  const resetToken = generateResetToken();
  const tokenHash = hashResetToken(resetToken);
  const requestId = generateResetRequestId();
  const expiresAt = getResetTokenExpiresAt(env.passwordResetExpiresIn);

  await passwordRepository.revokeActiveResetTokensByUserId(user.id);
  await passwordRepository.createResetToken({
    id: generateResetRequestId(),
    tokenHash,
    userId: user.id,
    requestId,
    expiresAt,
  });

  await emailService.sendPasswordReset({
    to: user.email,
    username: user.username,
    resetToken,
    expiresIn: env.passwordResetExpiresIn,
  });

  return true;
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
