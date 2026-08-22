import { apiClient } from "@/shared/api";

import { FileService } from "./file.service";

const FILE_NAME_TOO_LONG_MESSAGE =
  "Nama file terlalu panjang untuk diproses. Silakan gunakan nama file yang lebih pendek.";

const formatFileSize = (fileSize) => {
  const numericSize = Number(fileSize);
  if (!Number.isFinite(numericSize)) return "-";
  if (numericSize < 1024 * 1024) {
    return `${Math.max(1, Math.round(numericSize / 1024))} KB`;
  }
  return `${(numericSize / (1024 * 1024)).toFixed(1)} MB`;
};

const getErrorMessage = (error, fallback = "Request Document gagal.") => {
  if (error?.response?.data?.code === "FILE_NAME_TOO_LONG") {
    return FILE_NAME_TOO_LONG_MESSAGE;
  }
  if (error?.response?.data?.errors?.length) {
    return error.response.data.errors[0].message ?? fallback;
  }
  return error?.response?.data?.message ?? error?.message ?? fallback;
};

const throwDocumentApiError = (error, fallback) => {
  const documentError = new Error(getErrorMessage(error, fallback));
  documentError.code = error?.response?.data?.code ?? null;
  documentError.data = error?.response?.data?.data ?? null;
  documentError.status = error?.response?.status ?? null;
  throw documentError;
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

const normalizeTimestamp = (value) => {
  if (!value) return null;

  const timestamp = new Date(value);

  return Number.isNaN(timestamp.getTime()) ? null : timestamp.toISOString();
};

const normalizeSlaTimer = (slaTimer = null, {
  slaStartedAt,
  slaStoppedAt,
} = {}) => {
  if (!slaTimer) return slaTimer;

  return {
    ...slaTimer,
    startedAt: slaStartedAt ?? normalizeTimestamp(slaTimer.startedAt),
    stoppedAt: slaStoppedAt ?? normalizeTimestamp(slaTimer.stoppedAt),
  };
};

export const mapDocumentRecord = (document = {}) => {
  const activeFile = normalizeFileMetadata(document.activeFile ?? document.fileMetadata);
  const slaStartedAt = normalizeTimestamp(
    document.slaStartedAt ?? document.sla_started_at ?? document.slaTimer?.startedAt,
  );
  const slaStoppedAt = normalizeTimestamp(
    document.slaStoppedAt ?? document.sla_stopped_at ?? document.slaTimer?.stoppedAt,
  );

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
    slaStartedAt,
    slaStoppedAt,
    slaTimer: normalizeSlaTimer(document.slaTimer, {
      slaStartedAt,
      slaStoppedAt,
    }),
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

const compareNullable = (firstValue, secondValue) => {
  if (firstValue === secondValue) return 0;
  if (firstValue === null || firstValue === undefined || firstValue === "") return 1;
  if (secondValue === null || secondValue === undefined || secondValue === "") return -1;

  return String(firstValue).localeCompare(String(secondValue), undefined, {
    numeric: true,
    sensitivity: "base",
  });
};

const getSortValue = (documentItem, sortBy) => {
  if (sortBy === "createdAt" || sortBy === "createdDate") {
    return documentItem.createdAt ?? documentItem.createdDate ?? "";
  }
  if (sortBy === "lastUpdated" || sortBy === "updatedAt") {
    return documentItem.updatedAt ?? documentItem.lastUpdated ?? "";
  }
  if (sortBy === "status") {
    return documentItem.status ?? documentItem.workflowStatus ?? "";
  }

  return documentItem[sortBy] ?? "";
};

const sortDocuments = (documents, query = {}) => {
  const sortBy = query.sortBy || "updatedAt";
  const direction = query.direction === "asc" ? "asc" : "desc";

  return [...documents].sort((firstDocument, secondDocument) => {
    const result = compareNullable(
      getSortValue(firstDocument, sortBy),
      getSortValue(secondDocument, sortBy),
    );

    return direction === "asc" ? result : result * -1;
  });
};

const buildClientPagination = ({ documents, page, pageSize }) => {
  const safePageSize = Math.max(1, Number(pageSize) || 5);
  const totalItems = documents.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / safePageSize));
  const safePage = Math.min(Math.max(1, Number(page) || 1), totalPages);
  const startIndex = (safePage - 1) * safePageSize;

  return {
    data: documents.slice(startIndex, startIndex + safePageSize),
    pagination: {
      page: safePage,
      pageSize: safePageSize,
      totalItems,
      totalPages,
    },
  };
};

const getDocumentCollection = async (query = {}) => (
  unwrapCollection(await apiClient.get("/v1/documents", {
    params: toDocumentQuery(query),
  }))
);

const getDocumentsByStatusSet = async (query = {}) => {
  const statusSet = [...new Set(query.status)].filter(Boolean);
  const fetchPageSize = 100;

  const firstPageResponses = await Promise.all(
    statusSet.map((status) => getDocumentCollection({
      ...query,
      page: 1,
      pageSize: fetchPageSize,
      status,
    })),
  );

  const remainingPageRequests = firstPageResponses.flatMap((response, statusIndex) => {
    const status = statusSet[statusIndex];
    const totalPages = response.pagination?.totalPages ?? 1;

    return Array.from({ length: Math.max(0, totalPages - 1) }, (_, pageIndex) => (
      getDocumentCollection({
        ...query,
        page: pageIndex + 2,
        pageSize: fetchPageSize,
        status,
      })
    ));
  });

  const remainingPageResponses = await Promise.all(remainingPageRequests);
  const documentsById = new Map();

  [...firstPageResponses, ...remainingPageResponses].forEach((response) => {
    response.data.forEach((documentItem) => {
      documentsById.set(documentItem.id, documentItem);
    });
  });

  return buildClientPagination({
    documents: sortDocuments([...documentsById.values()], query),
    page: query.page,
    pageSize: query.pageSize,
  });
};

const getDocuments = async (query = {}) => {
  try {
    if (Array.isArray(query.status)) {
      return getDocumentsByStatusSet(query);
    }

    return getDocumentCollection(query);
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

const uploadRevision = async (documentId, {
  area,
  daysUntilValidation,
  description,
  expectedState,
  file,
} = {}) => {
  try {
    const temporaryUpload = await uploadTemporaryFile(file);

    return unwrapDocument(await apiClient.post(
      `/v1/documents/${documentId}/revisions`,
      {
        area,
        daysUntilValidation,
        description,
        expectedActiveRevisionId: expectedState?.activeRevisionId,
        expectedCurrentAssigneeUserId: expectedState?.currentAssigneeUserId,
        expectedWorkflowStatus: expectedState?.workflowStatus,
        temporaryFileId: temporaryUpload.temporaryFileId,
      },
    ));
  } catch (error) {
    throwDocumentApiError(error, "Upload Revision gagal.");
  }
};

const approveDocument = async (documentId, { expectedState } = {}) => {
  try {
    return unwrapDocument(await apiClient.post(`/v1/documents/${documentId}/approve`, {
      expectedActiveRevisionId: expectedState?.activeRevisionId,
      expectedCurrentAssigneeUserId: expectedState?.currentAssigneeUserId,
      expectedWorkflowStatus: expectedState?.workflowStatus,
    }));
  } catch (error) {
    throwDocumentApiError(error, "Approval A gagal diproses.");
  }
};

const submitApprovalWithComment = async (documentId, {
  attachmentFile = null,
  comment = "",
  expectedState,
} = {}) => {
  try {
    const temporaryUpload = attachmentFile ? await uploadTemporaryFile(attachmentFile) : null;

    return unwrapDocument(await apiClient.post(
      `/v1/documents/${documentId}/approve-with-comment`,
      {
        comment,
        expectedActiveRevisionId: expectedState?.activeRevisionId,
        expectedCurrentAssigneeUserId: expectedState?.currentAssigneeUserId,
        expectedWorkflowStatus: expectedState?.workflowStatus,
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
  expectedState,
} = {}) => {
  try {
    const temporaryUpload = attachmentFile ? await uploadTemporaryFile(attachmentFile) : null;

    return unwrapDocument(await apiClient.post(
      `/v1/documents/${documentId}/reject`,
      {
        comment,
        expectedActiveRevisionId: expectedState?.activeRevisionId,
        expectedCurrentAssigneeUserId: expectedState?.currentAssigneeUserId,
        expectedWorkflowStatus: expectedState?.workflowStatus,
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
