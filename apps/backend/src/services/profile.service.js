const profileRepository = require('../repositories/profile.repository');
const { createHttpError } = require('../utils/administration');
const { normalizeUserEmail, requiresUniqueEmail, mapEmailDuplicateError } = require('../utils/userEmail');

const updateCurrentProfile = async ({ payload, userId }) => {
  const email = normalizeUserEmail(payload.email);
  const existingEmailUser = requiresUniqueEmail(email)
    ? await profileRepository.findUserByEmail(email)
    : null;

  if (existingEmailUser && String(existingEmailUser.id) !== String(userId)) {
    throw createHttpError('Email sudah digunakan.', 409, [
      { field: 'email', message: 'Email sudah digunakan.' },
    ]);
  }

  let user;
  try {
    user = await profileRepository.updateCurrentUserProfile({
      email,
      fullName: payload.fullName,
      userId,
    });
  } catch (error) {
    throw mapEmailDuplicateError(error) || error;
  }

  if (!user) {
    throw createHttpError('Gagal memperbarui profil', 500);
  }

  return { user };
};

module.exports = {
  updateCurrentProfile,
};
