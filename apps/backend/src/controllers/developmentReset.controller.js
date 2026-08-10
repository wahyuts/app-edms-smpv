const developmentResetService = require('../services/developmentReset.service');
const { successResponse } = require('../utils/response');

const resetDevelopmentEnvironment = async (req, res, next) => {
  try {
    return successResponse(res, {
      message: 'Development Environment Reset Berhasil',
      data: await developmentResetService.resetDevelopmentEnvironment({
        actorRole: req.role,
        actorUser: req.user,
        confirmationText: req.body?.confirmationText,
      }),
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  resetDevelopmentEnvironment,
};
