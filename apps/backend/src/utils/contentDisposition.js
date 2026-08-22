const fallbackFileName = (fileName) => {
  return String(fileName || 'download')
    .replace(/["\\\r\n]/g, '_')
    .replace(/[^\x20-\x7E]/g, '_')
    .trim() || 'download';
};

const encodeRFC5987Value = (value) => {
  return encodeURIComponent(value)
    .replace(/['()]/g, escape)
    .replace(/\*/g, '%2A');
};

const buildContentDisposition = ({ disposition, fileName }) => {
  const fallback = fallbackFileName(fileName);

  return `${disposition}; filename="${fallback}"; filename*=UTF-8''${encodeRFC5987Value(fileName || fallback)}`;
};

module.exports = {
  buildContentDisposition,
};
