const projectMembershipService = require('../services/projectMembership.service');
const {
  validateMembershipCreate,
  validateMembershipUpdate,
} = require('../validators/administration.validator');
const { successResponse, errorResponse } = require('../utils/response');
const { ADMINISTRATION_MESSAGES } = require('../constants/administration.constants');

const handleValidation = (res, validation) => {
  if (validation.isValid) return false;
  errorResponse(res, {
    statusCode: 422,
    message: ADMINISTRATION_MESSAGES.VALIDATION_ERROR,
    errors: validation.errors,
  });
  return true;
};

const listMemberships = async (req, res, next) => {
  try {
    return successResponse(res, {
      message: 'Data Membership Berhasil Dimuat',
      data: await projectMembershipService.listMemberships(req.query),
    });
  } catch (error) {
    next(error);
  }
};

const getMembershipDetail = async (req, res, next) => {
  try {
    return successResponse(res, {
      message: 'Detail Membership Berhasil Dimuat',
      data: await projectMembershipService.getMembershipDetail(req.params.id),
    });
  } catch (error) {
    next(error);
  }
};

const createMembership = async (req, res, next) => {
  try {
    const validation = validateMembershipCreate(req.body);
    if (handleValidation(res, validation)) return null;
    return successResponse(res, {
      statusCode: 201,
      message: ADMINISTRATION_MESSAGES.MEMBERSHIP_CREATED,
      data: await projectMembershipService.createMembership({
        actorUserId: req.user.id,
        payload: validation.value,
      }),
    });
  } catch (error) {
    next(error);
  }
};

const updateMembership = async (req, res, next) => {
  try {
    const validation = validateMembershipUpdate(req.body);
    if (handleValidation(res, validation)) return null;
    return successResponse(res, {
      message: ADMINISTRATION_MESSAGES.MEMBERSHIP_UPDATED,
      data: await projectMembershipService.updateMembership({
        actorUserId: req.user.id,
        membershipId: req.params.id,
        payload: validation.value,
      }),
    });
  } catch (error) {
    next(error);
  }
};

const activateMembership = async (req, res, next) => {
  try {
    return successResponse(res, {
      message: ADMINISTRATION_MESSAGES.MEMBERSHIP_ACTIVATED,
      data: await projectMembershipService.activateMembership({
        actorUserId: req.user.id,
        membershipId: req.params.id,
      }),
    });
  } catch (error) {
    next(error);
  }
};

const deactivateMembership = async (req, res, next) => {
  try {
    return successResponse(res, {
      message: ADMINISTRATION_MESSAGES.MEMBERSHIP_DEACTIVATED,
      data: await projectMembershipService.deactivateMembership({
        actorUserId: req.user.id,
        membershipId: req.params.id,
      }),
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  activateMembership,
  createMembership,
  deactivateMembership,
  getMembershipDetail,
  listMemberships,
  updateMembership,
};
