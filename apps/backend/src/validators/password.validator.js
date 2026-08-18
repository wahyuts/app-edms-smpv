const validateForgotPasswordRequest = (body) => {
  const errors = [];

  if (!body || typeof body.username !== 'string' || body.username.trim() === '') {
    errors.push({
      field: 'username',
      message: 'Username is required',
    });
  }

  if (!body || typeof body.registeredEmail !== 'string' || body.registeredEmail.trim() === '') {
    errors.push({
      field: 'registeredEmail',
      message: 'Registered email is required',
    });
  }

  return {
    isValid: errors.length === 0,
    errors,
    value: {
      username: typeof body?.username === 'string' ? body.username.trim() : '',
      registeredEmail: typeof body?.registeredEmail === 'string' ? body.registeredEmail.trim() : '',
    },
  };
};

const validateResetPasswordRequest = (body) => {
  const errors = [];

  if (!body || typeof body.token !== 'string' || body.token.trim() === '') {
    errors.push({
      field: 'token',
      message: 'Reset token is required',
    });
  }

  if (!body || typeof body.newPassword !== 'string' || body.newPassword === '') {
    errors.push({
      field: 'newPassword',
      message: 'New password is required',
    });
  }

  return {
    isValid: errors.length === 0,
    errors,
    value: {
      token: typeof body?.token === 'string' ? body.token.trim() : '',
      newPassword: typeof body?.newPassword === 'string' ? body.newPassword : '',
    },
  };
};

module.exports = {
  validateForgotPasswordRequest,
  validateResetPasswordRequest,
};
