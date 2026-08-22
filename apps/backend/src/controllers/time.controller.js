const timeService = require('../services/time.service');
const { successResponse } = require('../utils/response');

const getServerTime = async (req, res, next) => {
  try {
    return successResponse(res, {
      message: 'Server Time Berhasil Dimuat',
      data: await timeService.getServerTime(),
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getServerTime,
};
