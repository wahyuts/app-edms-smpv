const multer = require('multer');
const env = require('./env');

const multerConfig = {
  storage: multer.memoryStorage(),
  limits: {
    files: 1,
    fileSize: env.upload.maxFileSizeBytes,
  },
};

const uploadSingleFile = multer(multerConfig).single('file');

module.exports = {
  multerConfig,
  uploadSingleFile,
};
