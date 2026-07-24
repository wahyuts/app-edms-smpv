const successResponse = (res, { statusCode = 200, message = 'Success', data = {} } = {}) => {
  return res.status(statusCode).json({
    success: true,
    message,
    data,
  });
};

const errorResponse = (res, { statusCode = 500, message = 'Internal Server Error', errors } = {}) => {
  const body = {
    success: false,
    message,
  };

  if (errors !== undefined) {
    body.errors = errors;
  }

  return res.status(statusCode).json(body);
};

module.exports = {
  successResponse,
  errorResponse,
};
