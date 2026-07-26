const devEmailOutboxService = require('../services/devEmailOutbox.service');
const { successResponse, errorResponse } = require('../utils/response');

const index = (req, res, next) => {
  try {
    if (!devEmailOutboxService.isEnabled()) {
      return errorResponse(res, {
        statusCode: 404,
        message: 'Development email outbox is not available',
      });
    }

    return successResponse(res, {
      message: 'Development email outbox retrieved',
      data: {
        emails: devEmailOutboxService.getEmails(),
      },
    });
  } catch (error) {
    next(error);
  }
};

const show = (req, res, next) => {
  try {
    if (!devEmailOutboxService.isEnabled()) {
      return errorResponse(res, {
        statusCode: 404,
        message: 'Development email outbox is not available',
      });
    }

    const email = devEmailOutboxService.getEmailById(req.params.emailId);

    if (!email) {
      return errorResponse(res, {
        statusCode: 404,
        message: 'Development email not found',
      });
    }

    return successResponse(res, {
      message: 'Development email retrieved',
      data: {
        email,
      },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  index,
  show,
};
