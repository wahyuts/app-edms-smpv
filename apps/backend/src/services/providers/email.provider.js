const dummyProvider = require('./dummy.provider');
const resendProvider = require('./resend.provider');
const env = require('../../config/env');

const resolveEmailProvider = () => {
  if (env.email.useResend) {
    return resendProvider;
  }

  return dummyProvider;
};

module.exports = {
  resolveEmailProvider,
};
