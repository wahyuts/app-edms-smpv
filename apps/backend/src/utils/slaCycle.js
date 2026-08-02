const toSlaCycleTimestamp = (value) => {
  if (!value) return null;
  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    return value.toISOString();
  }

  const parsedDate = new Date(value);
  if (!Number.isNaN(parsedDate.getTime())) {
    return parsedDate.toISOString();
  }

  return String(value);
};

const createSlaCycleId = (document) => [
  document.projectId,
  document.id,
  toSlaCycleTimestamp(document.slaStartedAt || document.lastUpdated || document.createdDate),
].filter(Boolean).join(':');

module.exports = {
  createSlaCycleId,
  toSlaCycleTimestamp,
};
