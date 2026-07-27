const departmentService = require('../services/department.service');
const {
  validateDepartmentCreate,
  validateDepartmentUpdate,
} = require('../validators/administration.validator');
const { successResponse, errorResponse } = require('../utils/response');
const { ADMINISTRATION_MESSAGES } = require('../constants/administration.constants');

const handleValidation = (res, validation) => {
  if (validation.isValid) {
    return false;
  }
  errorResponse(res, {
    statusCode: 422,
    message: ADMINISTRATION_MESSAGES.VALIDATION_ERROR,
    errors: validation.errors,
  });
  return true;
};

const listDepartments = async (req, res, next) => {
  try {
    return successResponse(res, {
      message: 'Data Department Berhasil Dimuat',
      data: await departmentService.listDepartments(req.query),
    });
  } catch (error) {
    next(error);
  }
};

const getDepartmentDetail = async (req, res, next) => {
  try {
    return successResponse(res, {
      message: 'Detail Department Berhasil Dimuat',
      data: await departmentService.getDepartmentDetail(req.params.id),
    });
  } catch (error) {
    next(error);
  }
};

const createDepartment = async (req, res, next) => {
  try {
    const validation = validateDepartmentCreate(req.body);
    if (handleValidation(res, validation)) return null;
    return successResponse(res, {
      statusCode: 201,
      message: ADMINISTRATION_MESSAGES.DEPARTMENT_CREATED,
      data: await departmentService.createDepartment(validation.value),
    });
  } catch (error) {
    next(error);
  }
};

const updateDepartment = async (req, res, next) => {
  try {
    const validation = validateDepartmentUpdate(req.body);
    if (handleValidation(res, validation)) return null;
    return successResponse(res, {
      message: ADMINISTRATION_MESSAGES.DEPARTMENT_UPDATED,
      data: await departmentService.updateDepartment(req.params.id, validation.value),
    });
  } catch (error) {
    next(error);
  }
};

const activateDepartment = async (req, res, next) => {
  try {
    return successResponse(res, {
      message: ADMINISTRATION_MESSAGES.DEPARTMENT_ACTIVATED,
      data: await departmentService.activateDepartment(req.params.id),
    });
  } catch (error) {
    next(error);
  }
};

const deactivateDepartment = async (req, res, next) => {
  try {
    return successResponse(res, {
      message: ADMINISTRATION_MESSAGES.DEPARTMENT_DEACTIVATED,
      data: await departmentService.deactivateDepartment(req.params.id),
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  activateDepartment,
  createDepartment,
  deactivateDepartment,
  getDepartmentDetail,
  listDepartments,
  updateDepartment,
};
