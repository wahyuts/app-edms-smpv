const passwordService = require('../services/password.service');
const {
  validateForgotPasswordRequest,
  validateResetPasswordRequest,
} = require('../validators/password.validator');
const { successResponse, errorResponse } = require('../utils/response');
const { PASSWORD_MESSAGES } = require('../constants/password.constants');

const forgotPassword = async (req, res, next) => {
  try {
    const validation = validateForgotPasswordRequest(req.body);
    let result = null;

    if (validation.isValid) {
      result = await passwordService.forgotPassword({
        username: validation.value.username,
        registeredEmail: validation.value.registeredEmail,
      });
    }

    return successResponse(res, {
      message: PASSWORD_MESSAGES.RECOVERY_INSTRUCTIONS_SENT,
      data: result?.requestId ? { requestId: result.requestId } : {},
    });
  } catch (error) {
    next(error);
  }
};

const resetPassword = async (req, res, next) => {
  try {
    const validation = validateResetPasswordRequest(req.body);

    if (!validation.isValid) {
      return errorResponse(res, {
        statusCode: 400,
        message: PASSWORD_MESSAGES.VALIDATION_ERROR,
        errors: validation.errors,
      });
    }

    await passwordService.resetPassword({
      token: validation.value.token,
      newPassword: validation.value.newPassword,
    });

    return successResponse(res, {
      message: PASSWORD_MESSAGES.RESET_SUCCESSFUL,
      data: {},
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  forgotPassword,
  resetPassword,
};
