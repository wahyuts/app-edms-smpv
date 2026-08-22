const crypto = require('node:crypto');

const normalizeText = (value) => String(value ?? '').trim();

const normalizeKey = (value) =>
  normalizeText(value)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

const toIntegerOrNull = (value) => {
  const numberValue = Number(value);
  return Number.isInteger(numberValue) && numberValue > 0 ? numberValue : null;
};

const createEntityId = (prefix) => `${prefix}-${crypto.randomUUID()}`;

const createUserCode = (userId) => `USR-${String(userId).padStart(6, '0')}`;

const createHttpError = (message, statusCode = 400, errors, options = {}) => {
  const error = new Error(message);
  error.statusCode = statusCode;
  if (errors !== undefined) {
    error.errors = errors;
  }
  if (options.code !== undefined) {
    error.code = options.code;
  }
  if (options.data !== undefined) {
    error.data = options.data;
  }
  return error;
};

const buildPagination = ({ page, pageSize, totalItems }) => {
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  return {
    page,
    pageSize,
    totalItems,
    totalPages,
  };
};

const parseListQuery = (query = {}, { defaultSortBy, allowedSortBy }) => {
  const page = Math.max(1, Number.parseInt(query.page, 10) || 1);
  const rawPageSize = Number.parseInt(query.pageSize ?? query.limit, 10) || 10;
  const pageSize = Math.min(100, Math.max(1, rawPageSize));
  const requestedSortBy = normalizeText(query.sortBy ?? query.sort);
  const sortBy = allowedSortBy.includes(requestedSortBy) ? requestedSortBy : defaultSortBy;
  const requestedDirection = normalizeText(query.direction ?? query.order ?? query.sortOrder).toLowerCase();
  const direction = requestedDirection === 'asc' ? 'asc' : 'desc';

  return {
    page,
    pageSize,
    limit: pageSize,
    offset: (page - 1) * pageSize,
    search: normalizeText(query.search),
    sortBy,
    direction,
  };
};

const mapDuplicateError = (error, message, field) => {
  if (error?.code !== 'ER_DUP_ENTRY') {
    return null;
  }

  return createHttpError(message, 409, [{ field, message }]);
};

module.exports = {
  buildPagination,
  createEntityId,
  createHttpError,
  createUserCode,
  mapDuplicateError,
  normalizeKey,
  normalizeText,
  parseListQuery,
  toIntegerOrNull,
};
