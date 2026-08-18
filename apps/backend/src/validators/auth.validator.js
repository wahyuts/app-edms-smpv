const validateLoginRequest = (body) => {
  const errors = [];

  if (!body || typeof body.username !== 'string' || body.username.trim() === '') {
    errors.push({
      field: 'username',
      message: 'Username is required',
    });
  }

  if (!body || typeof body.password !== 'string' || body.password === '') {
    errors.push({
      field: 'password',
      message: 'Password is required',
    });
  }

  return {
    isValid: errors.length === 0,
    errors,
    value: {
      username: typeof body?.username === 'string' ? body.username.trim() : '',
      password: typeof body?.password === 'string' ? body.password : '',
    },
  };
};

const validateChangePasswordRequest = (body) => {
  const errors = [];

  if (!body || typeof body.currentPassword !== 'string' || body.currentPassword === '') {
    errors.push({
      field: 'currentPassword',
      message: 'Current password is required',
    });
  }

  if (!body || typeof body.newPassword !== 'string' || body.newPassword === '') {
    errors.push({
      field: 'newPassword',
      message: 'New password is required',
    });
  }

  if (!body || typeof body.confirmNewPassword !== 'string' || body.confirmNewPassword === '') {
    errors.push({
      field: 'confirmNewPassword',
      message: 'New password confirmation is required',
    });
  }

  if (
    typeof body?.newPassword === 'string' &&
    typeof body?.confirmNewPassword === 'string' &&
    body.newPassword !== body.confirmNewPassword
  ) {
    errors.push({
      field: 'confirmNewPassword',
      message: 'New password confirmation does not match',
    });
  }

  if (
    typeof body?.currentPassword === 'string' &&
    typeof body?.newPassword === 'string' &&
    body.currentPassword === body.newPassword
  ) {
    errors.push({
      field: 'newPassword',
      message: 'New password must be different from current password',
    });
  }

  return {
    isValid: errors.length === 0,
    errors,
    value: {
      currentPassword: typeof body?.currentPassword === 'string' ? body.currentPassword : '',
      newPassword: typeof body?.newPassword === 'string' ? body.newPassword : '',
      confirmNewPassword: typeof body?.confirmNewPassword === 'string' ? body.confirmNewPassword : '',
    },
  };
};

module.exports = {
  validateLoginRequest,
  validateChangePasswordRequest,
};
