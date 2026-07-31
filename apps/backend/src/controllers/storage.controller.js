const uploadService = require('../services/upload.service');
const { successResponse } = require('../utils/response');

const createTemporaryUpload = async (req, res, next) => {
  try {
    const metadata = await uploadService.uploadTemporaryFile({
      actorUserId: req.user.id,
      file: req.file,
    });

    return successResponse(res, {
      statusCode: 201,
      message: 'File berhasil diunggah ke temporary storage',
      data: metadata,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createTemporaryUpload,
};
