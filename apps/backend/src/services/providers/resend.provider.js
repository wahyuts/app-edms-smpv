const { Resend } = require('resend');
const env = require('../../config/env');
const logger = require('../../config/logger');

let resendClient;

const getClient = () => {
  if (!env.email.useResend) {
    throw new Error('[EMAIL] Resend API key is not configured');
  }

  if (!resendClient) {
    resendClient = new Resend(env.email.resendApiKey);
  }

  return resendClient;
};

const send = async ({ to, subject, html, text }) => {
  try {
    const client = getClient();

    const result = await client.emails.send({
      from: env.email.from,
      to,
      subject,
      html,
      text,
    });

    if (result?.error !== null || typeof result?.data?.id !== 'string' || !result.data.id.trim()) {
      throw new Error('Invalid or unsuccessful email provider response');
    }

    logger.log('[EMAIL] Resend provider accepted email delivery request');

    return {
      success: true,
      provider: 'resend',
      messageId: result.data.id,
    };
  } catch (error) {
    logger.error('[EMAIL] Resend provider delivery failed');
    logger.error(error?.name || 'ResendProviderError');
    throw new Error('Email delivery failed');
  }
};

module.exports = {
  send,
};
