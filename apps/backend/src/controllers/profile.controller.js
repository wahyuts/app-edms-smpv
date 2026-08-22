const profileService = require('../services/profile.service');
const { validateProfileUpdate } = require('../validators/profile.validator');
const { errorResponse, successResponse } = require('../utils/response');

const updateCurrentProfile = async (req, res, next) => {
  try {
    const validation = validateProfileUpdate(req.body);

    if (!validation.isValid) {
      return errorResponse(res, {
        statusCode: 422,
        message: 'Gagal memperbarui profil',
        errors: validation.errors,
      });
    }

    return successResponse(res, {
      message: 'Profil berhasil diperbarui',
      data: await profileService.updateCurrentProfile({
        payload: validation.value,
        userId: req.user.id,
      }),
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  updateCurrentProfile,
};
