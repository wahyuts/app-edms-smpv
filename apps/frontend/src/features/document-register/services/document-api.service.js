import { apiClient } from "@/shared/api";

import { FileService } from "./file.service";

const formatFileSize = (fileSize) => {
  const numericSize = Number(fileSize);
  if (!Number.isFinite(numericSize)) return "-";
  if (numericSize < 1024 * 1024) {
    return `${Math.max(1, Math.round(numericSize / 1024))} KB`;
  }
  return `${(numericSize / (1024 * 1024)).toFixed(1)} MB`;
};

const getErrorMessage = (error, fallback = "Request Document gagal.") => {
  if (error?.response?.data?.errors?.length) {
    return error.response.data.errors[0].message ?? fallback;
  }
  return error?.response?.data?.message ?? error?.message ?? fallback;
};

const throwDocumentApiError = (error, fallback) => {
  throw new Error(getErrorMessage(error, fallback));
};

const normalizeFileMetadata = (file = {}) => {
  if (!file) return null;
  const extension = String(file.fileExtension ?? file.extension ?? file.fileType ?? "")
    .trim()
    .replace(/^\./, "")
    .toLowerCase();
  const originalFileName = file.originalFileName ?? file.fileName ?? "";
  const fileSize = Number(file.fileSize);

  return {
    ...file,
    extension,
    fileExtension: extension,
    fileName: file.fileName ?? originalFileName,
    fileSize: Number.isFinite(fileSize) ? fileSize : file.fileSize,
    fileSizeDisplay: file.fileSizeDisplay ?? formatFileSize(fileSize),
    fileType: extension,
    originalFileName,
    uploadedAt: file.uploadedAt ?? file.createdAt ?? null,
    uploadedBy: file.uploadedBy ?? file.uploadedByName ?? null,
  };
};

const normalizeWorkflowAttachment = (attachment = null) => {
  if (!attachment) return null;
  const extension = String(attachment.fileExtension ??
    attachment.extension ??
    attachment.originalFileName?.split(".").pop() ??
    "")
    .trim()
    .replace(/^\./, "")
    .toLowerCase();
  const fileSize = Number(attachment.fileSize);

  return {
    ...attachment,
    attachmentId: attachment.attachmentId ?? attachment.id ?? null,
    fileExtension: extension,
    fileSize: Number.isFinite(fileSize) ? fileSize : attachment.fileSize,
    fileSizeDisplay: attachment.fileSizeDisplay ?? formatFileSize(fileSize),
    mimeType: attachment.mimeType ?? "",
    originalFileName: attachment.originalFileName ?? attachment.fileName ?? "",
    uploadedAt: attachment.uploadedAt ?? attachment.createdAt ?? null,
    uploadedBy: attachment.uploadedBy ?? attachment.uploadedByName ?? null,
  };
};

const normalizeWorkflowComment = (comment = {}) => ({
  ...comment,
  attachment: normalizeWorkflowAttachment(comment.attachment),
  createdDate: comment.createdDate ?? comment.createdAt ?? null,
  workflowAction: comment.workflowAction ?? comment.action ?? "",
  workflowComment: comment.workflowComment ?? comment.comment ?? "",
});

const normalizeHistoryItem = (historyItem = {}) => ({
  ...historyItem,
  createdDate: historyItem.createdDate ?? historyItem.createdAt ?? null,
  revision: historyItem.revision ?? historyItem.revisionLabel ?? null,
  status: historyItem.status ?? historyItem.workflowStatus ?? null,
  workflowEvent: historyItem.workflowEvent ?? historyItem.activity ?? "",
});

const normalizeRevisionRecord = (revision = {}) => ({
  ...revision,
  activeRevision: Boolean(revision.activeRevision ?? revision.isActive),
  file: normalizeFileMetadata(revision.file),
  revision: revision.revision ?? revision.revisionLabel ?? null,
  uploadedAt: revision.uploadedAt ?? revision.createdAt ?? null,
  uploader: revision.uploader ?? revision.uploadedBy ?? null,
});

export const mapDocumentRecord = (document = {}) => {
  const activeFile = normalizeFileMetadata(document.activeFile ?? document.fileMetadata);

  return {
    ...document,
    activeFile,
    createdDate: document.createdDate ?? document.createdAt ?? null,
    description: document.description ?? "",
    fileHistory: document.fileHistory ?? [],
    fileMetadata: activeFile,
    hasUnreadComments: Boolean(document.hasUnreadComments),
    lastUpdated: document.lastUpdated ?? document.updatedAt ?? null,
    revision: document.revision ?? document.revisionLabel ?? null,
    status: document.status ?? document.workflowStatus ?? null,
    unreadCommentCount: Number(document.unreadCommentCount ?? 0),
    workflowStatus: document.workflowStatus ?? document.status ?? null,
  };
};

const unwrapDocument = (response) => mapDocumentRecord(response.data?.data ?? {});

const unwrapCollection = (response) => ({
  data: (response.data?.data?.data ?? []).map(mapDocumentRecord),
  pagination: response.data?.data?.pagination ?? {
    page: 1,
    pageSize: 0,
    totalItems: 0,
    totalPages: 1,
  },
});

const unwrapList = (response, mapper) => (response.data?.data ?? []).map(mapper);

const toDocumentQuery = (query = {}) => {
  const params = {
    area: query.area || undefined,
    direction: query.direction || undefined,
    drawing: query.drawing || undefined,
    lifecycle: query.lifecycle || undefined,
    page: query.page || undefined,
    pageSize: query.pageSize || undefined,
    revision: query.revision || undefined,
    search: query.search || undefined,
    sortBy: query.sortBy || undefined,
    status: Array.isArray(query.status) ? undefined : query.status || undefined,
  };

  return Object.fromEntries(
    Object.entries(params).filter(([, value]) => value !== undefined && value !== ""),
  );
};

const getDocuments = async (query = {}) => {
  try {
    return unwrapCollection(await apiClient.get("/v1/documents", {
      params: toDocumentQuery(query),
    }));
  } catch (error) {
    throwDocumentApiError(error, "Gagal memuat Document Register.");
  }
};

const getDocumentById = async (documentId) => {
  try {
    return unwrapDocument(await apiClient.get(`/v1/documents/${documentId}`));
  } catch (error) {
    throwDocumentApiError(error, "Document tidak ditemukan.");
  }
};

const uploadTemporaryFile = async (file) => {
  try {
    const formData = new FormData();
    formData.append("file", file);

    const response = await apiClient.post("/v1/storage/temporary-uploads", formData);

    return normalizeFileMetadata(response.data?.data);
  } catch (error) {
    throwDocumentApiError(error, "Upload temporary file gagal.");
  }
};

const createDocument = async ({ area, daysUntilValidation, description, documentNumber, drawing, temporaryFileId } = {}) => {
  try {
    return unwrapDocument(await apiClient.post("/v1/documents", {
      area,
      daysUntilValidation,
      description,
      documentNumber,
      drawing,
      temporaryFileId,
    }));
  } catch (error) {
    throwDocumentApiError(error, "Gagal membuat Document.");
  }
};

const updateDocument = async (documentId, { area, daysUntilValidation, description } = {}) => {
  try {
    return unwrapDocument(await apiClient.patch(`/v1/documents/${documentId}`, {
      area,
      daysUntilValidation,
      description,
    }));
  } catch (error) {
    throwDocumentApiError(error, "Gagal memperbarui Document.");
  }
};

const archiveDocument = async (documentId, { reason = "" } = {}) => {
  try {
    return unwrapDocument(await apiClient.patch(`/v1/documents/${documentId}/archive`, { reason }));
  } catch (error) {
    throwDocumentApiError(error, "Gagal mengarsipkan Document.");
  }
};

const restoreDocument = async (documentId) => {
  try {
    return unwrapDocument(await apiClient.patch(`/v1/documents/${documentId}/restore`));
  } catch (error) {
    throwDocumentApiError(error, "Gagal restore Document.");
  }
};

const uploadRevision = async (documentId, file) => {
  try {
    const temporaryUpload = await uploadTemporaryFile(file);

    return unwrapDocument(await apiClient.post(
      `/v1/documents/${documentId}/revisions`,
      { temporaryFileId: temporaryUpload.temporaryFileId },
    ));
  } catch (error) {
    throwDocumentApiError(error, "Upload Revision gagal.");
  }
};

const approveDocument = async (documentId) => {
  try {
    return unwrapDocument(await apiClient.post(`/v1/documents/${documentId}/approve`));
  } catch (error) {
    throwDocumentApiError(error, "Approval A gagal diproses.");
  }
};

const submitApprovalWithComment = async (documentId, {
  attachmentFile = null,
  comment = "",
} = {}) => {
  try {
    const temporaryUpload = attachmentFile ? await uploadTemporaryFile(attachmentFile) : null;

    return unwrapDocument(await apiClient.post(
      `/v1/documents/${documentId}/approve-with-comment`,
      {
        comment,
        temporaryFileId: temporaryUpload?.temporaryFileId,
      },
    ));
  } catch (error) {
    throwDocumentApiError(error, "Approval B gagal diproses.");
  }
};

const rejectDocument = async (documentId, {
  attachmentFile = null,
  comment = "",
} = {}) => {
  try {
    const temporaryUpload = attachmentFile ? await uploadTemporaryFile(attachmentFile) : null;

    return unwrapDocument(await apiClient.post(
      `/v1/documents/${documentId}/reject`,
      {
        comment,
        temporaryFileId: temporaryUpload?.temporaryFileId,
      },
    ));
  } catch (error) {
    throwDocumentApiError(error, "Approval C gagal diproses.");
  }
};

const getDocumentHistory = async (documentId) => {
  try {
    return unwrapList(
      await apiClient.get(`/v1/documents/${documentId}/history`),
      normalizeHistoryItem,
    );
  } catch (error) {
    throwDocumentApiError(error, "History Document gagal dimuat.");
  }
};

const getWorkflowComments = async (documentId) => {
  try {
    return unwrapList(
      await apiClient.get(`/v1/documents/${documentId}/comments`),
      normalizeWorkflowComment,
    );
  } catch (error) {
    throwDocumentApiError(error, "Workflow Comment gagal dimuat.");
  }
};

const markWorkflowCommentsRead = async (documentId) => {
  try {
    const response = await apiClient.patch(`/v1/documents/${documentId}/comments/read`);

    return response.data?.data ?? {};
  } catch (error) {
    throwDocumentApiError(error, "Workflow Comment gagal ditandai dibaca.");
  }
};

const getDocumentRevisions = async (documentId) => {
  try {
    return unwrapList(
      await apiClient.get(`/v1/documents/${documentId}/revisions`),
      normalizeRevisionRecord,
    );
  } catch (error) {
    throwDocumentApiError(error, "Revision History gagal dimuat.");
  }
};

const getDocumentPreview = async (documentItem) => {
  try {
    const response = await apiClient.get(`/v1/documents/${documentItem.id}/view`, {
      responseType: "blob",
    });

    return FileService.createPreviewFromBlob({
      blob: response.data,
      documentItem,
      headers: response.headers,
    });
  } catch (error) {
    throwDocumentApiError(error, "View Document gagal.");
  }
};

const downloadDocumentFile = async (documentItem) => {
  try {
    const response = await apiClient.get(`/v1/documents/${documentItem.id}/download`, {
      responseType: "blob",
    });

    return FileService.downloadBlobResponse({
      blob: response.data,
      documentItem,
      headers: response.headers,
    });
  } catch (error) {
    throwDocumentApiError(error, "Download Document gagal.");
  }
};

const getWorkflowAttachmentPreview = async ({ attachment, documentId }) => {
  try {
    const response = await apiClient.get(
      `/v1/documents/${documentId}/workflow-attachments/${attachment.attachmentId}/download`,
      { responseType: "blob" },
    );

    return FileService.createPreviewFromBlob({
      blob: response.data,
      documentItem: { fileMetadata: normalizeWorkflowAttachment(attachment) },
      headers: response.headers,
    });
  } catch (error) {
    throwDocumentApiError(error, "Workflow Attachment gagal dimuat.");
  }
};

const downloadWorkflowAttachment = async ({ attachment, documentId }) => {
  try {
    const response = await apiClient.get(
      `/v1/documents/${documentId}/workflow-attachments/${attachment.attachmentId}/download`,
      { responseType: "blob" },
    );

    return FileService.downloadBlobResponse({
      blob: response.data,
      documentItem: { fileMetadata: normalizeWorkflowAttachment(attachment) },
      headers: response.headers,
    });
  } catch (error) {
    throwDocumentApiError(error, "Workflow Attachment gagal diunduh.");
  }
};

export const DocumentApiService = {
  approveDocument,
  archiveDocument,
  createDocument,
  downloadDocumentFile,
  downloadWorkflowAttachment,
  getDocumentHistory,
  getDocumentById,
  getDocumentPreview,
  getDocumentRevisions,
  getDocuments,
  getWorkflowAttachmentPreview,
  getWorkflowComments,
  markWorkflowCommentsRead,
  rejectDocument,
  restoreDocument,
  submitApprovalWithComment,
  updateDocument,
  uploadRevision,
  uploadTemporaryFile,
};

export default DocumentApiService;
