const escalationService = require('../services/escalation.service');
const { successResponse } = require('../utils/response');

const listEscalations = async (req, res, next) => {
  try {
    return successResponse(res, {
      message: 'Data Escalation Alert Berhasil Dimuat',
      data: await escalationService.listEscalations({
        activeProject: req.activeProject,
        query: req.query,
        userId: req.user.id,
      }),
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  listEscalations,
};
