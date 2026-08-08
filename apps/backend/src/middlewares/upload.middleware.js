const Busboy = require('busboy');
const { UPLOAD_FILE_FIELD } = require('../constants/storage.constants');
const uploadService = require('../services/upload.service');

const buildUploadError = (message, statusCode = 422, code = 'UPLOAD_VALIDATION_ERROR') => {
  const error = new Error('File upload tidak valid');
  error.statusCode = statusCode;
  error.code = code;
  error.errors = [{ field: UPLOAD_FILE_FIELD, message }];

  return error;
};

const isMultipartRequest = (req) => {
  return String(req.headers['content-type'] || '').toLowerCase().includes('multipart/form-data');
};

const uploadMiddleware = (req, res, next) => {
  if (!isMultipartRequest(req)) {
    next(buildUploadError('File wajib diunggah'));
    return;
  }

  let busboy;
  let completed = false;
  let fileSeen = false;
  let uploadError = null;
  let uploadPromise = Promise.resolve();

  const finish = (error) => {
    if (completed) return;
    completed = true;
    next(error);
  };

  try {
    busboy = Busboy({
      headers: req.headers,
      limits: {
        files: 1,
      },
    });
  } catch (error) {
    next(buildUploadError(error.message));
    return;
  }

  busboy.on('file', (fieldName, fileStream, fileInfo) => {
    if (fieldName !== UPLOAD_FILE_FIELD) {
      fileStream.resume();
      return;
    }

    if (fileSeen) {
      uploadError = buildUploadError('Hanya satu file yang boleh diunggah');
      fileStream.resume();
      return;
    }

    fileSeen = true;

    fileStream.on('error', (error) => {
      uploadError = uploadError || error;
    });

    uploadPromise = uploadService
      .uploadTemporaryFileStream({
        actorUserId: req.user.id,
        fileStream,
        mimeType: fileInfo.mimeType,
        originalFileName: fileInfo.filename,
      })
      .then((metadata) => {
        req.temporaryUploadMetadata = metadata;
      })
      .catch((error) => {
        uploadError = error;
        fileStream.resume();
        finish(error);
      });
  });

  busboy.on('filesLimit', () => {
    uploadError = buildUploadError('Hanya satu file yang boleh diunggah');
  });

  busboy.on('error', (error) => {
    finish(uploadError || error);
  });

  busboy.on('finish', async () => {
    if (!fileSeen) {
      finish(buildUploadError('File wajib diunggah'));
      return;
    }

    await uploadPromise;

    if (uploadError) {
      finish(uploadError);
      return;
    }

    finish();
  });

  req.on('aborted', () => {
    const error = buildUploadError('Upload dibatalkan oleh client', 400, 'UPLOAD_ABORTED');
    uploadError = error;
    busboy.destroy(error);
  });

  req.pipe(busboy);
};

module.exports = uploadMiddleware;
