const projectContextService = require('../services/projectContext.service');
const { validateSelectActiveProject } = require('../validators/administration.validator');
const { successResponse, errorResponse } = require('../utils/response');
const {
  ADMINISTRATION_MESSAGES,
} = require('../constants/administration.constants');

const getProjectContext = async (req, res, next) => {
  try {
    return successResponse(res, {
      message: ADMINISTRATION_MESSAGES.PROJECT_CONTEXT_RETRIEVED,
      data: await projectContextService.resolveProjectContext(req.user.id),
    });
  } catch (error) {
    next(error);
  }
};

const selectActiveProject = async (req, res, next) => {
  try {
    const validation = validateSelectActiveProject(req.body);
    if (!validation.isValid) {
      return errorResponse(res, {
        statusCode: 422,
        message: ADMINISTRATION_MESSAGES.VALIDATION_ERROR,
        errors: validation.errors,
      });
    }

    return successResponse(res, {
      message: ADMINISTRATION_MESSAGES.ACTIVE_PROJECT_SELECTED,
      data: await projectContextService.selectActiveProject({
        projectId: validation.value.projectId,
        userId: req.user.id,
      }),
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getProjectContext,
  selectActiveProject,
};
