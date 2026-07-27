const profileRepository = require('../repositories/profile.repository');
const { createHttpError } = require('../utils/administration');

const updateCurrentProfile = async ({ payload, userId }) => {
  const existingEmailUser = await profileRepository.findUserByEmail(payload.email);

  if (existingEmailUser && String(existingEmailUser.id) !== String(userId)) {
    throw createHttpError('Email sudah digunakan', 409, [
      { field: 'email', message: 'Email sudah digunakan' },
    ]);
  }

  const user = await profileRepository.updateCurrentUserProfile({
    email: payload.email,
    fullName: payload.fullName,
    userId,
  });

  if (!user) {
    throw createHttpError('Gagal memperbarui profil', 500);
  }

  return { user };
};

module.exports = {
  updateCurrentProfile,
};
