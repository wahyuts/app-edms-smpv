const path = require('node:path');

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

  return sanitized || 'file';
};

const getFileExtension = (fileName) => {
  return path.extname(sanitizeFileName(fileName)).toLowerCase();
};

module.exports = {
  getFileExtension,
  preserveOriginalFileName,
  sanitizeFileName,
};
