const path = require('node:path');

const MAX_FILENAME_LENGTH = 255;

const preserveOriginalFileName = (fileName) => {
  if (typeof fileName !== 'string') {
    throw new Error('[STORAGE] fileName must be a string');
  }

  return fileName.replace(/\0/g, '').trim() || 'file';
};

const sanitizeFileName = (fileName) => {
  if (typeof fileName !== 'string') {
    throw new Error('[STORAGE] fileName must be a string');
  }

  const withoutNullByte = fileName.replace(/\0/g, '');
  const posixBaseName = path.posix.basename(withoutNullByte);
  const baseName = path.win32.basename(posixBaseName);
  const sanitized = baseName
    .replace(/[<>:"/\\|?*\x00-\x1F]/g, '_')
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/^\.+$/, '')
    .trim();

  const safeFileName = sanitized || 'file';

  if (safeFileName.length <= MAX_FILENAME_LENGTH) {
    return safeFileName;
  }

  const extension = path.extname(safeFileName);

  if (extension !== '' && extension.length < MAX_FILENAME_LENGTH) {
    return `${safeFileName.slice(0, MAX_FILENAME_LENGTH - extension.length)}${extension}`;
  }

  return safeFileName.slice(0, MAX_FILENAME_LENGTH);
};

const getFileExtension = (fileName) => {
  return path.extname(sanitizeFileName(fileName)).toLowerCase();
};

module.exports = {
  getFileExtension,
  preserveOriginalFileName,
  sanitizeFileName,
};
