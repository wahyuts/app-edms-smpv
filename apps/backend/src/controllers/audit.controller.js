const auditService = require('../services/audit.service');
const { successResponse } = require('../utils/response');

const listAuditRecords = async (req, res, next) => {
  try {
    return successResponse(res, {
      message: 'Audit Trail Berhasil Dimuat',
      data: await auditService.listAuditRecords({
        activeProject: req.activeProject,
        query: req.query,
        userId: req.user.id,
      }),
    });
  } catch (error) {
    next(error);
  }
};

const getSummary = async (req, res, next) => {
  try {
    return successResponse(res, {
      message: 'Summary Audit Trail Berhasil Dimuat',
      data: await auditService.getAuditSummary({
        activeProject: req.activeProject,
        query: req.query,
        userId: req.user.id,
      }),
    });
  } catch (error) {
    next(error);
  }
};

const getFilterOptions = async (req, res, next) => {
  try {
    return successResponse(res, {
      message: 'Filter Audit Trail Berhasil Dimuat',
      data: await auditService.getAuditFilterOptions({
        activeProject: req.activeProject,
        query: req.query,
        userId: req.user.id,
      }),
    });
  } catch (error) {
    next(error);
  }
};

const hideAuditRecord = async (req, res, next) => {
  try {
    return successResponse(res, {
      message: 'Audit Trail Berhasil Disembunyikan',
      data: await auditService.hideAuditRecord({
        actorOfficialRole: req.officialRole,
        actorUserId: req.user.id,
        auditId: req.params.auditId,
      }),
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getFilterOptions,
  getSummary,
  hideAuditRecord,
  listAuditRecords,
};
