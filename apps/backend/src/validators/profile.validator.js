const { normalizeText } = require('../utils/administration');
const { normalizeUserEmail } = require('../utils/userEmail');

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const validateProfileUpdate = (body = {}) => {
  const errors = [];
  const name = normalizeText(body.name ?? body.fullName);
  const email = normalizeUserEmail(body.email);

  if (!name) {
    errors.push({ field: 'name', message: 'Nama wajib diisi' });
  }
  if (email && !emailPattern.test(email)) {
    errors.push({ field: 'email', message: 'Format email tidak valid.' });
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
