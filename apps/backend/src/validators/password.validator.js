const PASSWORD_PATTERN = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/;
const PASSWORD_RULE_MESSAGES = {
  lowercase: 'Password harus mengandung minimal satu huruf kecil.',
  minLength: 'Password minimal 8 karakter.',
  number: 'Password harus mengandung minimal satu angka.',
  symbol: 'Password harus mengandung minimal satu simbol.',
  uppercase: 'Password harus mengandung minimal satu huruf besar.',
};

const getPasswordPolicyMessages = (password) => {
  const value = String(password || '');
  const messages = [];

  if (value.length < 8) {
    messages.push(PASSWORD_RULE_MESSAGES.minLength);
  }

  if (!/[A-Z]/.test(value)) {
    messages.push(PASSWORD_RULE_MESSAGES.uppercase);
  }

  if (!/[a-z]/.test(value)) {
    messages.push(PASSWORD_RULE_MESSAGES.lowercase);
  }

  if (!/\d/.test(value)) {
    messages.push(PASSWORD_RULE_MESSAGES.number);
  }

  if (!/[^A-Za-z0-9]/.test(value)) {
    messages.push(PASSWORD_RULE_MESSAGES.symbol);
  }

  return messages;
};

const getPasswordPolicyMessage = (password) => {
  return getPasswordPolicyMessages(password).join('\n');
};

const isPasswordPolicyValid = (password) => {
  return typeof password === 'string' && PASSWORD_PATTERN.test(password);
};

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

  if (!body || !isPasswordPolicyValid(body.newPassword)) {
    errors.push({
      field: 'newPassword',
      message: getPasswordPolicyMessage(body?.newPassword),
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
  getPasswordPolicyMessage,
  getPasswordPolicyMessages,
  isPasswordPolicyValid,
  validateForgotPasswordRequest,
  validateResetPasswordRequest,
};
