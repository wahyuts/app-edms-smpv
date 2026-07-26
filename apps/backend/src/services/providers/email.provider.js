const dummyProvider = require('./dummy.provider');
const resendProvider = require('./resend.provider');
const env = require('../../config/env');

const resolveEmailProvider = () => {
  if (env.email.provider === 'resend') {
    return resendProvider;
  }

  return dummyProvider;
};

module.exports = {
  resolveEmailProvider,
};
