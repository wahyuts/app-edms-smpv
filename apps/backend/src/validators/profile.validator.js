const { normalizeText } = require('../utils/administration');

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const validateProfileUpdate = (body = {}) => {
  const errors = [];
  const name = normalizeText(body.name ?? body.fullName);
  const email = normalizeText(body.email);

  if (!name) {
    errors.push({ field: 'name', message: 'Nama wajib diisi' });
  }
  if (!email) {
    errors.push({ field: 'email', message: 'Email wajib diisi' });
  } else if (!emailPattern.test(email)) {
    errors.push({ field: 'email', message: 'Format email tidak valid' });
  }

  return {
    isValid: errors.length === 0,
    errors,
    value: {
      email,
      fullName: name,
    },
  };
};

module.exports = {
  validateProfileUpdate,
};
