const documentService = require('../services/document.service');
const fileAccessService = require('../services/fileAccess.service');
const workflowAttachmentService = require('../services/workflowAttachment.service');
const { DOCUMENT_MESSAGES } = require('../constants/document.constants');
const { validateDocumentCreate } = require('../validators/document.validator');
const { errorResponse, successResponse } = require('../utils/response');

const createDocument = async (req, res, next) => {
  try {
    const validation = validateDocumentCreate(req.body);

    if (!validation.isValid) {
      return errorResponse(res, {
        statusCode: 422,
        message: DOCUMENT_MESSAGES.VALIDATION_ERROR,
        errors: validation.errors,
      });
    }

    return successResponse(res, {
      statusCode: 201,
      message: DOCUMENT_MESSAGES.CREATED,
      data: await documentService.createDocument({
        activeProject: req.activeProject,
        actorUserId: req.user.id,
        payload: validation.value,
      }),
    });
  } catch (error) {
    next(error);
  }
};

const viewDocumentFile = async (req, res, next) => {
  try {
    const documentFile = await fileAccessService.resolveDocumentFile({
      documentId: req.params.documentId,
      revisionId: req.params.revisionId,
      userId: req.user.id,
    });

    return fileAccessService.streamStoredFileResponse({
      disposition: 'inline',
      documentFile,
      res,
    });
  } catch (error) {
    next(error);
  }
};

const downloadDocumentFile = async (req, res, next) => {
  try {
    const documentFile = await fileAccessService.resolveDocumentFile({
      documentId: req.params.documentId,
      revisionId: req.params.revisionId,
      userId: req.user.id,
    });

    return fileAccessService.streamStoredFileResponse({
      disposition: 'attachment',
      documentFile,
      res,
    });
  } catch (error) {
    next(error);
  }
};

const uploadWorkflowAttachment = async (req, res, next) => {
  try {
    return successResponse(res, {
      statusCode: 201,
      message: 'Workflow Attachment berhasil diunggah',
      data: await workflowAttachmentService.uploadWorkflowAttachment({
        actorUserId: req.user.id,
        documentId: req.params.documentId,
        file: req.file,
        payload: req.body,
      }),
    });
  } catch (error) {
    next(error);
  }
};

const downloadWorkflowAttachment = async (req, res, next) => {
  try {
    const attachmentFile = await workflowAttachmentService.getAttachmentDownload({
      attachmentId: req.params.attachmentId,
      documentId: req.params.documentId,
      userId: req.user.id,
    });

    return fileAccessService.streamStoredFileResponse({
      disposition: 'attachment',
      documentFile: attachmentFile,
      res,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createDocument,
  downloadDocumentFile,
  downloadWorkflowAttachment,
  uploadWorkflowAttachment,
  viewDocumentFile,
};
