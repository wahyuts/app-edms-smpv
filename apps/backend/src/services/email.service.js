const env = require('../config/env');
const { resolveEmailProvider } = require('./providers/email.provider');

const buildResetUrl = (resetToken) => {
  const resetUrl = new URL(env.email.frontendResetPasswordUrl);
  resetUrl.searchParams.set('token', resetToken);

  return resetUrl.toString();
};

const buildPasswordResetEmail = ({ username, resetToken, expiresIn }) => {
  const resetUrl = buildResetUrl(resetToken);

  return {
    subject: 'Reset Password EDMS',
    text: [
      `Halo ${username || 'EDMS User'},`,
      '',
      'Kami menerima permintaan reset password untuk akun EDMS Anda.',
      `Gunakan link berikut untuk membuat password baru: ${resetUrl}`,
      `Link ini berlaku selama ${expiresIn}.`,
      '',
      'Abaikan email ini jika Anda tidak meminta reset password.',
    ].join('\n'),
    html: [
      `<p>Halo ${username || 'EDMS User'},</p>`,
      '<p>Kami menerima permintaan reset password untuk akun EDMS Anda.</p>',
      `<p><a href="${resetUrl}">Reset Password EDMS</a></p>`,
      `<p>Link ini berlaku selama ${expiresIn}.</p>`,
      '<p>Abaikan email ini jika Anda tidak meminta reset password.</p>',
    ].join(''),
  };
};

const sendPasswordReset = async ({ to, username, resetToken, expiresIn }) => {
  const provider = resolveEmailProvider();
  const email = buildPasswordResetEmail({
    username,
    resetToken,
    expiresIn,
  });

  return provider.send({
    to,
    subject: email.subject,
    template: 'password-recovery',
    html: email.html,
    text: email.text,
  });
};

module.exports = {
  buildPasswordResetEmail,
  sendPasswordReset,
};
