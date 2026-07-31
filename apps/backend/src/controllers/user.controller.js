const userService = require('../services/user.service');
const {
  validateUserCreate,
  validateUserUpdate,
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

const listUsers = async (req, res, next) => {
  try {
    return successResponse(res, {
      message: 'Data User Berhasil Dimuat',
      data: await userService.listUsers(req.query),
    });
  } catch (error) {
    next(error);
  }
};

const getUserDetail = async (req, res, next) => {
  try {
    return successResponse(res, {
      message: 'Detail User Berhasil Dimuat',
      data: await userService.getUserDetail(req.params.id),
    });
  } catch (error) {
    next(error);
  }
};

const createUser = async (req, res, next) => {
  try {
    const validation = validateUserCreate(req.body);
    if (handleValidation(res, validation)) return null;
    return successResponse(res, {
      statusCode: 201,
      message: ADMINISTRATION_MESSAGES.USER_CREATED,
      data: await userService.createUser(validation.value),
    });
  } catch (error) {
    next(error);
  }
};

const updateUser = async (req, res, next) => {
  try {
    const validation = validateUserUpdate(req.body);
    if (handleValidation(res, validation)) return null;
    return successResponse(res, {
      message: ADMINISTRATION_MESSAGES.USER_UPDATED,
      data: await userService.updateUser({
        actorUserId: req.user.id,
        payload: validation.value,
        userId: req.params.id,
      }),
    });
  } catch (error) {
    next(error);
  }
};

const activateUser = async (req, res, next) => {
  try {
    return successResponse(res, {
      message: ADMINISTRATION_MESSAGES.USER_ACTIVATED,
      data: await userService.activateUser({ actorUserId: req.user.id, userId: req.params.id }),
    });
  } catch (error) {
    next(error);
  }
};

const deactivateUser = async (req, res, next) => {
  try {
    return successResponse(res, {
      message: ADMINISTRATION_MESSAGES.USER_DEACTIVATED,
      data: await userService.deactivateUser({ actorUserId: req.user.id, userId: req.params.id }),
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  activateUser,
  createUser,
  deactivateUser,
  getUserDetail,
  listUsers,
  updateUser,
};
