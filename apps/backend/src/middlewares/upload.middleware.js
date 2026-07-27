const multer = require('multer');
const { uploadSingleFile } = require('../config/multer');
const env = require('../config/env');

const uploadMiddleware = (req, res, next) => {
  uploadSingleFile(req, res, (error) => {
    if (!error) {
      next();
      return;
    }

    if (error instanceof multer.MulterError) {
      const uploadError = new Error('File upload tidak valid');
      uploadError.statusCode = error.code === 'LIMIT_FILE_SIZE' ? 413 : 422;
      uploadError.code = error.code;
      uploadError.errors = [
        {
          field: 'file',
          message:
            error.code === 'LIMIT_FILE_SIZE'
              ? `Ukuran file melebihi batas ${env.upload.maxFileSizeBytes} bytes`
              : error.message,
        },
      ];
      next(uploadError);
      return;
    }

    next(error);
  });
};

module.exports = uploadMiddleware;
