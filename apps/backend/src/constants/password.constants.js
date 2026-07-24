const PASSWORD_MESSAGES = {
  RECOVERY_INSTRUCTIONS_SENT: 'If the account exists, password recovery instructions have been sent.',
  RESET_SUCCESSFUL: 'Password reset successful',
  INVALID_RESET_TOKEN: 'Invalid or expired reset token',
  VALIDATION_ERROR: 'Validation Error',
};

const PASSWORD_RESET_REVOKED_REASON = {
  REPLACED: 'replaced',
  USED: 'used',
};

module.exports = {
  PASSWORD_MESSAGES,
  PASSWORD_RESET_REVOKED_REASON,
};
