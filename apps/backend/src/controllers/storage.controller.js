const { successResponse } = require('../utils/response');

const createTemporaryUpload = async (req, res, next) => {
  try {
    const metadata = req.temporaryUploadMetadata;

    if (!metadata) {
      const error = new Error('File upload tidak valid');
      error.statusCode = 422;
      error.errors = [{ field: 'file', message: 'File wajib diunggah' }];
      throw error;
    }

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
