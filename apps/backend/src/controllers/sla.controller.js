const slaService = require('../services/sla.service');
const { successResponse } = require('../utils/response');

const listSlaDocuments = async (req, res, next) => {
  try {
    return successResponse(res, {
      message: 'Data SLA Monitoring Berhasil Dimuat',
      data: await slaService.listSlaDocuments({
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
  listSlaDocuments,
};
