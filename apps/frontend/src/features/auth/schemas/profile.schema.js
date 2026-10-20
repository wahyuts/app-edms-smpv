const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const validateProfileForm = (form = {}) => {
  const errors = {};
  const fullName = String(form.fullName ?? '').trim();
  const email = String(form.email ?? '').trim().toLowerCase() || null;

  if (!fullName) {
    errors.fullName = 'Nama wajib diisi';
  }
  if (email && !emailPattern.test(email)) {
    errors.email = 'Format email tidak valid.';
  }

  return {
    errors,
    isValid: Object.keys(errors).length === 0,
    value: { email, fullName },
  };
};
