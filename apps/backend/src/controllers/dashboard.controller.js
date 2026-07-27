const dashboardService = require('../services/dashboard.service');
const { successResponse } = require('../utils/response');

const getSummary = async (req, res, next) => {
  try {
    return successResponse(res, {
      message: 'Dashboard Summary Berhasil Dimuat',
      data: await dashboardService.getDashboardSummary({
        activeProject: req.activeProject,
        query: req.query,
        userId: req.user.id,
      }),
    });
  } catch (error) {
    next(error);
  }
};

const getStatistics = async (req, res, next) => {
  try {
    return successResponse(res, {
      message: 'Dashboard Statistics Berhasil Dimuat',
      data: await dashboardService.getDashboardStatistics({
        activeProject: req.activeProject,
        query: req.query,
        userId: req.user.id,
      }),
    });
  } catch (error) {
    next(error);
  }
};

const getRecentActivities = async (req, res, next) => {
  try {
    return successResponse(res, {
      message: 'Dashboard Recent Activities Berhasil Dimuat',
      data: await dashboardService.getRecentActivities({
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
  getRecentActivities,
  getStatistics,
  getSummary,
};
