const projectService = require('../services/project.service');
const {
  validateProjectClose,
  validateProjectCreate,
  validateProjectUpdate,
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

const listProjects = async (req, res, next) => {
  try {
    return successResponse(res, {
      message: 'Data Project Berhasil Dimuat',
      data: await projectService.listProjects(req.query),
    });
  } catch (error) {
    next(error);
  }
};

const getProjectDetail = async (req, res, next) => {
  try {
    return successResponse(res, {
      message: 'Detail Project Berhasil Dimuat',
      data: await projectService.getProjectDetail(req.params.id),
    });
  } catch (error) {
    next(error);
  }
};

const createProject = async (req, res, next) => {
  try {
    const validation = validateProjectCreate(req.body);
    if (handleValidation(res, validation)) return null;
    return successResponse(res, {
      statusCode: 201,
      message: ADMINISTRATION_MESSAGES.PROJECT_CREATED,
      data: await projectService.createProject({
        actorUserId: req.user.id,
        payload: validation.value,
      }),
    });
  } catch (error) {
    next(error);
  }
};

const updateProject = async (req, res, next) => {
  try {
    const currentProject = await projectService.getProjectDetail(req.params.id);
    const validation = validateProjectUpdate({
      ...req.body,
      projectCode: req.body?.projectCode ?? currentProject.projectCode,
    });
    if (handleValidation(res, validation)) return null;
    return successResponse(res, {
      message: ADMINISTRATION_MESSAGES.PROJECT_UPDATED,
      data: await projectService.updateProject({
        actorUserId: req.user.id,
        payload: validation.value,
        projectId: req.params.id,
      }),
    });
  } catch (error) {
    next(error);
  }
};

const activateProject = async (req, res, next) => {
  try {
    return successResponse(res, {
      message: ADMINISTRATION_MESSAGES.PROJECT_ACTIVATED,
      data: await projectService.activateProject({ actorUserId: req.user.id, projectId: req.params.id }),
    });
  } catch (error) {
    next(error);
  }
};

const deactivateProject = async (req, res, next) => {
  try {
    return successResponse(res, {
      message: ADMINISTRATION_MESSAGES.PROJECT_DEACTIVATED,
      data: await projectService.deactivateProject({ actorUserId: req.user.id, projectId: req.params.id }),
    });
  } catch (error) {
    next(error);
  }
};

const getProjectClosureSummary = async (req, res, next) => {
  try {
    return successResponse(res, {
      message: 'Ringkasan Close Project Berhasil Dimuat',
      data: await projectService.getProjectClosureSummary(req.params.id),
    });
  } catch (error) {
    next(error);
  }
};

const closeProject = async (req, res, next) => {
  try {
    const validation = validateProjectClose(req.body);
    if (handleValidation(res, validation)) return null;
    return successResponse(res, {
      message: ADMINISTRATION_MESSAGES.PROJECT_CLOSED,
      data: await projectService.closeProject({
        actorUserId: req.user.id,
        payload: validation.value,
        projectId: req.params.id,
      }),
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  activateProject,
  closeProject,
  createProject,
  deactivateProject,
  getProjectClosureSummary,
  getProjectDetail,
  listProjects,
  updateProject,
};
