const crypto = require('crypto');
const env = require('../config/env');
const slaNotificationScheduler = require('../services/slaNotificationScheduler.service');
const { successResponse } = require('../utils/response');

const isBlank = (value) => !value || String(value).trim() === '';

const isTokenMatch = (requestToken, configuredToken) => {
  const requestBuffer = Buffer.from(String(requestToken));
  const configuredBuffer = Buffer.from(String(configuredToken));

  if (requestBuffer.length !== configuredBuffer.length) {
    return false;
  }

  return crypto.timingSafeEqual(requestBuffer, configuredBuffer);
};

const runSlaNotificationEvaluation = async (req, res, next) => {
  try {
    const configuredToken = String(env.slaNotificationScheduler.jobToken || '').trim();
    const requestToken = req.get('x-sla-notification-job-token') || '';

    if (isBlank(configuredToken)) {
      return res.status(503).json({
        message: 'SLA Notification Job Tidak Dikonfigurasi',
      });
    }

    if (isBlank(requestToken)) {
      return res.status(401).json({
        message: 'SLA Notification Job Token Wajib Dikirim',
      });
    }

    if (!isTokenMatch(requestToken, configuredToken)) {
      return res.status(403).json({
        message: 'SLA Notification Job Token Tidak Valid',
      });
    }

    return successResponse(res, {
      message: 'Evaluasi Notification SLA Berhasil Dijalankan',
      data: await slaNotificationScheduler.runOnce({
        triggerSource: 'external_scheduled_evaluation',
      }),
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  runSlaNotificationEvaluation,
};
