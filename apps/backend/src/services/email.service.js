const env = require('../config/env');
const { resolveEmailProvider } = require('./providers/email.provider');

const buildResetUrl = (resetToken) => {
  const resetUrl = new URL(env.email.frontendResetPasswordUrl);
  resetUrl.searchParams.set('token', resetToken);

  return resetUrl.toString();
};

const buildPasswordResetEmail = ({ username, resetToken, expiresIn, expiresAt }) => {
  const resetUrl = buildResetUrl(resetToken);

  return {
    subject: 'Reset Your EDMS Password',
    text: [
      'APP Engineering EDMS',
      '',
      'Reset Your Password',
      '',
      `Halo ${username || 'EDMS User'},`,
      '',
      'Kami menerima permintaan untuk mengatur ulang Password akun Anda.',
      '',
      'Klik tombol Reset Password di bawah ini.',
      '',
      resetUrl,
      '',
      `Link ini berlaku selama ${expiresIn}.`,
      '',
      'Abaikan email ini jika Anda tidak meminta reset password.',
      '',
      'APP Engineering EDMS',
    ].join('\n'),
    html: [
      '<p><strong>APP Engineering EDMS</strong></p>',
      '<h1>Reset Your Password</h1>',
      `<p>Halo ${username || 'EDMS User'},</p>`,
      '<p>Kami menerima permintaan untuk mengatur ulang Password akun Anda.</p>',
      '<p>Klik tombol Reset Password di bawah ini.</p>',
      `<p><a href="${resetUrl}">Reset Password</a></p>`,
      `<p>Link ini berlaku selama ${expiresIn}.</p>`,
      '<p>Abaikan email ini jika Anda tidak meminta reset password.</p>',
      '<p>APP Engineering EDMS</p>',
    ].join(''),
    resetUrl,
    expiresAt,
  };
};

const sendPasswordReset = async ({
  to,
  username,
  resetToken,
  expiresIn,
  expiresAt,
  requestId,
}) => {
  const provider = resolveEmailProvider();
  const email = buildPasswordResetEmail({
    username,
    resetToken,
    expiresIn,
    expiresAt,
  });

  return provider.send({
    to,
    subject: email.subject,
    template: 'password-recovery',
    html: email.html,
    text: email.text,
    resetUrl: email.resetUrl,
    expiresAt: email.expiresAt,
    requestId,
  });
};

module.exports = {
  buildPasswordResetEmail,
  sendPasswordReset,
};
