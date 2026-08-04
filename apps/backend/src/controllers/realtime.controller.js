const sseService = require('../services/sse.service');

const openEvents = async (req, res, next) => {
  try {
    await sseService.openConnection({ req, res });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  openEvents,
};
