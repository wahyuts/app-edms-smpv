const { UPLOAD_ALLOWED_MIME_TYPES } = require('../constants/storage.constants');
const { getFileExtension, sanitizeFileName } = require('../utils/fileName');

const hasPdfSignature = (buffer) => {
  return buffer.subarray(0, 4).toString('ascii') === '%PDF';
};

const hasPngSignature = (buffer) => {
  return buffer.length >= 8 && buffer.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]));
};

const hasJpegSignature = (buffer) => {
  return buffer.length >= 3 && buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff;
};

const hasZipSignature = (buffer) => {
  return buffer.length >= 4 && buffer[0] === 0x50 && buffer[1] === 0x4b && [0x03, 0x05, 0x07].includes(buffer[2]);
};

const hasOleCompoundSignature = (buffer) => {
  return buffer.length >= 8 && buffer.subarray(0, 8).equals(Buffer.from([0xd0, 0xcf, 0x11, 0xe0, 0xa1, 0xb1, 0x1a, 0xe1]));
};

const hasExpectedSignature = (extension, buffer) => {
  if (extension === '.pdf') {
    return hasPdfSignature(buffer);
  }

  if (extension === '.png') {
    return hasPngSignature(buffer);
  }

  if (extension === '.jpg' || extension === '.jpeg') {
    return hasJpegSignature(buffer);
  }

  if (extension === '.docx' || extension === '.xlsx') {
    return hasZipSignature(buffer);
  }

  if (extension === '.xls') {
    return hasOleCompoundSignature(buffer);
  }

  return false;
};

const buildUploadValidationError = (errors) => {
  const error = new Error('File upload tidak valid');
  error.statusCode = 422;
  error.errors = errors;

  return error;
};

const validateUploadedFile = (file) => {
  const errors = [];

  if (!file) {
    errors.push({ field: 'file', message: 'File wajib diunggah' });
    throw buildUploadValidationError(errors);
  }

  const originalFileName = sanitizeFileName(file.originalname || '');
  const extension = getFileExtension(originalFileName);
  const allowedMimeTypes = UPLOAD_ALLOWED_MIME_TYPES[extension];

  if (!file.size || file.size <= 0) {
    errors.push({ field: 'file', message: 'File kosong tidak diperbolehkan' });
  }

  if (!extension || !allowedMimeTypes) {
    errors.push({ field: 'extension', message: 'Extension file tidak diperbolehkan' });
  }

  if (!file.mimetype || !allowedMimeTypes?.includes(file.mimetype)) {
    errors.push({ field: 'mimeType', message: 'MIME type file tidak diperbolehkan' });
  }

  if (file.buffer && allowedMimeTypes && !hasExpectedSignature(extension, file.buffer)) {
    errors.push({ field: 'file', message: 'Isi file tidak sesuai dengan tipe file' });
  }

  if (errors.length > 0) {
    throw buildUploadValidationError(errors);
  }

  return {
    originalFileName,
    extension,
    mimeType: file.mimetype,
    fileSize: file.size,
    buffer: file.buffer,
  };
};

module.exports = {
  validateUploadedFile,
};
