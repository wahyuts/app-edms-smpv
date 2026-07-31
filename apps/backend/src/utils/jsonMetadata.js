const normalizeJsonMetadata = (value, fallback = {}) => {
  if (value == null) return fallback;
  if (typeof value === 'object') return value;
  if (typeof value !== 'string') return fallback;

  const trimmedValue = value.trim();
  if (!trimmedValue) return fallback;

  try {
    return JSON.parse(trimmedValue);
  } catch (error) {
    return fallback;
  }
};

module.exports = {
  normalizeJsonMetadata,
};
