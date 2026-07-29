const documentService = require('../services/document.service');
const approvalService = require('../services/approval.service');
const fileAccessService = require('../services/fileAccess.service');
const revisionService = require('../services/revision.service');
const workflowAttachmentService = require('../services/workflowAttachment.service');
const { DOCUMENT_MESSAGES } = require('../constants/document.constants');
const { validateApprovalPayload } = require('../validators/approval.validator');
const {
  validateArchivePayload,
  validateDocumentCreate,
  validateDocumentUpdate,
  validateTemporaryFilePayload,
  validateWorkflowAttachmentPayload,
} = require('../validators/document.validator');
const { errorResponse, successResponse } = require('../utils/response');

const listDocuments = async (req, res, next) => {
  try {
    return successResponse(res, {
      message: 'Data Document Register Berhasil Dimuat',
      data: await documentService.listDocuments({
        activeProject: req.activeProject,
        query: req.query,
        userId: req.user.id,
      }),
    });
  } catch (error) {
    next(error);
  }
};

const getDocumentDetail = async (req, res, next) => {
  try {
    return successResponse(res, {
      message: 'Detail Document Berhasil Dimuat',
      data: await documentService.getDocumentDetail({
        documentId: req.params.documentId,
        userId: req.user.id,
      }),
    });
  } catch (error) {
    next(error);
  }
};

const getDocumentHistory = async (req, res, next) => {
  try {
    return successResponse(res, {
      message: DOCUMENT_MESSAGES.HISTORY_LOADED,
      data: await documentService.getDocumentHistory({
        documentId: req.params.documentId,
        userId: req.user.id,
      }),
    });
  } catch (error) {
    next(error);
  }
};

const getWorkflowComments = async (req, res, next) => {
  try {
    return successResponse(res, {
      message: 'Workflow Comment Berhasil Dimuat',
      data: await documentService.getWorkflowComments({
        documentId: req.params.documentId,
        userId: req.user.id,
      }),
    });
  } catch (error) {
    next(error);
  }
};

const markWorkflowCommentsRead = async (req, res, next) => {
  try {
    return successResponse(res, {
      message: 'Workflow Comment Berhasil Ditandai Dibaca',
      data: await documentService.markWorkflowCommentsRead({
        documentId: req.params.documentId,
        userId: req.user.id,
      }),
    });
  } catch (error) {
    next(error);
  }
};

const listDocumentRevisions = async (req, res, next) => {
  try {
    return successResponse(res, {
      message: 'Revision History Berhasil Dimuat',
      data: await documentService.listDocumentRevisions({
        documentId: req.params.documentId,
        userId: req.user.id,
      }),
    });
  } catch (error) {
    next(error);
  }
};

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
        actorOfficialRole: req.officialRole,
        actorUserFullName: req.user.fullName,
        actorUserId: req.user.id,
        payload: validation.value,
      }),
    });
  } catch (error) {
    next(error);
  }
};

const updateDocument = async (req, res, next) => {
  try {
    const validation = validateDocumentUpdate(req.body);

    if (!validation.isValid) {
      return errorResponse(res, {
        statusCode: 422,
        message: DOCUMENT_MESSAGES.VALIDATION_ERROR,
        errors: validation.errors,
      });
    }

    return successResponse(res, {
      message: 'Document Berhasil Diperbarui',
      data: await documentService.updateDocument({
        actorOfficialRole: req.officialRole,
        actorUserFullName: req.user.fullName,
        actorUserId: req.user.id,
        documentId: req.params.documentId,
        payload: validation.value,
      }),
    });
  } catch (error) {
    next(error);
  }
};

const archiveDocument = async (req, res, next) => {
  try {
    const validation = validateArchivePayload(req.body);

    return successResponse(res, {
      message: 'Document Berhasil Diarsipkan',
      data: await documentService.archiveDocument({
        actorOfficialRole: req.officialRole,
        actorUserFullName: req.user.fullName,
        actorUserId: req.user.id,
        documentId: req.params.documentId,
        payload: validation.value,
      }),
    });
  } catch (error) {
    next(error);
  }
};

const restoreDocument = async (req, res, next) => {
  try {
    return successResponse(res, {
      message: 'Document Berhasil Direstore',
      data: await documentService.restoreDocument({
        actorOfficialRole: req.officialRole,
        actorUserFullName: req.user.fullName,
        actorUserId: req.user.id,
        documentId: req.params.documentId,
      }),
    });
  } catch (error) {
    next(error);
  }
};

const processApproval = (type, { requireComment = false } = {}) => async (req, res, next) => {
  try {
    const validation = validateApprovalPayload(req.body, { requireComment });

    if (!validation.isValid) {
      return errorResponse(res, {
        statusCode: 422,
        message: DOCUMENT_MESSAGES.VALIDATION_ERROR,
        errors: validation.errors,
      });
    }

    return successResponse(res, {
      message: 'Workflow Approval Berhasil Diproses',
      data: await approvalService.processApproval({
        actorOfficialRole: req.officialRole,
        actorUserFullName: req.user.fullName,
        actorUserId: req.user.id,
        comment: validation.value.comment,
        documentId: req.params.documentId,
        temporaryFileId: validation.value.temporaryFileId,
        type,
      }),
    });
  } catch (error) {
    next(error);
  }
};

const viewDocumentFile = async (req, res, next) => {
  try {
    const documentFile = await fileAccessService.resolveDocumentFileForAccess({
      action: 'view',
      actorOfficialRole: req.officialRole,
      actorUserFullName: req.user.fullName,
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
    const documentFile = await fileAccessService.resolveDocumentFileForAccess({
      action: 'download',
      actorOfficialRole: req.officialRole,
      actorUserFullName: req.user.fullName,
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

const uploadRevision = async (req, res, next) => {
  try {
    const validation = validateTemporaryFilePayload(req.body);

    if (!validation.isValid) {
      return errorResponse(res, {
        statusCode: 422,
        message: DOCUMENT_MESSAGES.VALIDATION_ERROR,
        errors: validation.errors,
      });
    }

    return successResponse(res, {
      statusCode: 201,
      message: 'Revision berhasil diunggah',
      data: await revisionService.uploadRevision({
        actorOfficialRole: req.officialRole,
        actorUserFullName: req.user.fullName,
        actorUserId: req.user.id,
        documentId: req.params.documentId,
        temporaryFileId: validation.value.temporaryFileId,
      }),
    });
  } catch (error) {
    next(error);
  }
};

const uploadWorkflowAttachment = async (req, res, next) => {
  try {
    const validation = validateWorkflowAttachmentPayload(req.body);

    if (!validation.isValid) {
      return errorResponse(res, {
        statusCode: 422,
        message: DOCUMENT_MESSAGES.VALIDATION_ERROR,
        errors: validation.errors,
      });
    }

    return successResponse(res, {
      statusCode: 201,
      message: 'Workflow Attachment berhasil diunggah',
      data: await workflowAttachmentService.uploadWorkflowAttachment({
        actorUserId: req.user.id,
        documentId: req.params.documentId,
        payload: validation.value,
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
  approveDocument: processApproval('approve'),
  approveDocumentWithComment: processApproval('approveWithComment', { requireComment: true }),
  archiveDocument,
  createDocument,
  downloadDocumentFile,
  downloadWorkflowAttachment,
  getDocumentDetail,
  getDocumentHistory,
  getWorkflowComments,
  markWorkflowCommentsRead,
  listDocumentRevisions,
  listDocuments,
  rejectDocument: processApproval('reject'),
  restoreDocument,
  updateDocument,
  uploadRevision,
  uploadWorkflowAttachment,
  viewDocumentFile,
};
