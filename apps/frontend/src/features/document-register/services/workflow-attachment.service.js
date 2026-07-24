import { BrowserFileStorageService } from "@/shared/services/browser-file-storage.service";

import { FILE_VALIDATION_CONFIG } from "./file.service";
import { MAX_UPLOAD_FILE_SIZE_MB } from "../constants/upload.constants";

const WORKFLOW_ATTACHMENT_ALLOWED_TYPES = {
  jpg: FILE_VALIDATION_CONFIG.allowedTypes.jpg,
  jpeg: FILE_VALIDATION_CONFIG.allowedTypes.jpeg,
  pdf: FILE_VALIDATION_CONFIG.allowedTypes.pdf,
  png: FILE_VALIDATION_CONFIG.allowedTypes.png,
};

export const WORKFLOW_ATTACHMENT_VALIDATION_CONFIG = {
  acceptedInputTypes: ".pdf,.jpg,.jpeg,.png,application/pdf,image/jpeg,image/png",
  allowedTypes: WORKFLOW_ATTACHMENT_ALLOWED_TYPES,
  maximumFileSizeBytes: FILE_VALIDATION_CONFIG.maximumFileSizeBytes,
};

const createAttachmentId = () => {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return `WFA-${crypto.randomUUID()}`;
  }

  return `WFA-${Date.now()}-${Math.random().toString(16).slice(2)}`;
};

const getFileExtension = (fileName = "") => {
  const extension = fileName.split(".").pop();

  return extension ? extension.toLowerCase() : "";
};

const formatFileSize = (fileSize) => {
  if (!Number.isFinite(fileSize)) {
    return "-";
  }

  if (fileSize < 1024 * 1024) {
    return `${Math.max(1, Math.round(fileSize / 1024))} KB`;
  }

  return `${(fileSize / (1024 * 1024)).toFixed(1)} MB`;
};

const validateAttachmentFile = (file) => {
  if (!file) {
    throw new Error("Workflow Attachment wajib dipilih.");
  }
  if (file.size <= 0) {
    throw new Error("Workflow Attachment tidak boleh kosong.");
  }
  if (file.size > WORKFLOW_ATTACHMENT_VALIDATION_CONFIG.maximumFileSizeBytes) {
    throw new Error(
      `Ukuran Workflow Attachment melebihi batas maksimum ${MAX_UPLOAD_FILE_SIZE_MB} MB.`,
    );
  }

  const fileExtension = getFileExtension(file.name);
  const supportedMimeTypes = WORKFLOW_ATTACHMENT_ALLOWED_TYPES[fileExtension];

  if (!supportedMimeTypes) {
    throw new Error("Tipe Workflow Attachment tidak didukung.");
  }
  if (file.type && !supportedMimeTypes.includes(file.type)) {
    throw new Error("Tipe Workflow Attachment tidak sesuai dengan ekstensi file.");
  }

  return {
    fileExtension,
    fileSize: file.size,
    fileSizeDisplay: formatFileSize(file.size),
    mimeType: file.type || supportedMimeTypes[0],
    originalFileName: file.name,
  };
};

const getStorageReference = (attachment) => {
  if (typeof attachment === "string") {
    return attachment;
  }

  return attachment?.storageReference ?? attachment?.storagePath ?? null;
};

const createAttachmentMetadata = ({
  attachmentId = createAttachmentId(),
  commentId,
  documentId,
  file,
  uploadedBy = "Current User",
} = {}) => {
  if (!documentId) {
    throw new Error("Document ID is required.");
  }
  if (!commentId) {
    throw new Error("Workflow Comment ID is required.");
  }

  const validatedFile = validateAttachmentFile(file);
  const uploadedAt = new Date().toISOString();
  const storageReference = `workflow-attachments/${documentId}/${commentId}`;

  return {
    attachmentId,
    commentId,
    documentId,
    fileExtension: validatedFile.fileExtension,
    fileSize: validatedFile.fileSize,
    fileSizeDisplay: validatedFile.fileSizeDisplay,
    mimeType: validatedFile.mimeType,
    originalFileName: validatedFile.originalFileName,
    storageReference,
    storageType: "indexeddb",
    uploadedAt,
    uploadedBy,
  };
};

const normalizeAttachmentMetadata = (attachment = null) => {
  if (!attachment) {
    return null;
  }

  const storageReference = getStorageReference(attachment);

  return {
    attachmentId: attachment.attachmentId ?? attachment.id ?? null,
    commentId: attachment.commentId ?? null,
    documentId: attachment.documentId ?? null,
    fileExtension:
      attachment.fileExtension ?? getFileExtension(attachment.originalFileName),
    fileSize: attachment.fileSize ?? attachment.size ?? null,
    fileSizeDisplay:
      attachment.fileSizeDisplay ?? formatFileSize(attachment.fileSize ?? attachment.size),
    mimeType: attachment.mimeType ?? attachment.type ?? "",
    originalFileName: attachment.originalFileName ?? attachment.fileName ?? "",
    storageReference,
    storageType: attachment.storageType ?? "indexeddb",
    uploadedAt: attachment.uploadedAt ?? attachment.uploadTimestamp ?? null,
    uploadedBy: attachment.uploadedBy ?? null,
  };
};

const saveAttachment = async ({
  commentId,
  documentId,
  file,
  uploadedBy = "Current User",
} = {}) => {
  const metadata = createAttachmentMetadata({
    commentId,
    documentId,
    file,
    uploadedBy,
  });

  await BrowserFileStorageService.saveFile({
    file,
    metadata,
    storagePath: metadata.storageReference,
  });

  return metadata;
};

const loadAttachment = async (attachment) => {
  const storageReference = getStorageReference(attachment);

  if (!storageReference) {
    return null;
  }

  return BrowserFileStorageService.getFile(storageReference);
};

const getAttachmentPreview = async (attachment) => {
  const storedAttachment = await loadAttachment(attachment);
  const metadata = storedAttachment?.metadata ?? normalizeAttachmentMetadata(attachment);

  if (!storedAttachment?.file) {
    throw new Error("Workflow Attachment file tidak ditemukan.");
  }

  const fileExtension = (
    metadata?.fileExtension ?? getFileExtension(metadata?.originalFileName)
  ).toLowerCase();

  return {
    file: storedAttachment.file,
    metadata,
    storageReference:
      storedAttachment.storagePath ?? metadata?.storageReference ?? getStorageReference(attachment),
    viewerType: ["jpg", "jpeg", "png"].includes(fileExtension)
      ? "image"
      : fileExtension === "pdf"
        ? "pdf"
        : "fallback",
  };
};

const deleteAttachment = async (attachment) => {
  const storageReference = getStorageReference(attachment);

  if (!storageReference) {
    return;
  }

  await BrowserFileStorageService.deleteFile(storageReference);
};

const deleteAttachmentsForComments = async (comments = []) => {
  const storageReferences = [
    ...new Set(
      comments
        .map((comment) => getStorageReference(comment?.attachment))
        .filter(Boolean),
    ),
  ];

  await Promise.all(storageReferences.map((storageReference) =>
    BrowserFileStorageService.deleteFile(storageReference),
  ));
};

const getAttachmentMetadata = (attachment) => normalizeAttachmentMetadata(attachment);

const downloadAttachment = async (attachment) => {
  const storedAttachment = await loadAttachment(attachment);
  const metadata = storedAttachment?.metadata ?? normalizeAttachmentMetadata(attachment);

  if (!storedAttachment?.file) {
    throw new Error("Workflow Attachment file tidak ditemukan.");
  }
  if (typeof window === "undefined" || typeof document === "undefined") {
    throw new Error("Download hanya tersedia di browser.");
  }

  const objectUrl = window.URL.createObjectURL(storedAttachment.file);
  const downloadLink = document.createElement("a");

  try {
    downloadLink.href = objectUrl;
    downloadLink.download = metadata?.originalFileName || "workflow-attachment";
    document.body.appendChild(downloadLink);
    downloadLink.click();
  } finally {
    downloadLink.remove();
    window.setTimeout(() => window.URL.revokeObjectURL(objectUrl), 0);
  }

  return metadata;
};

export const WorkflowAttachmentService = {
  deleteAttachment,
  deleteAttachmentsForComments,
  downloadAttachment,
  getAttachmentPreview,
  getAttachmentMetadata,
  loadAttachment,
  normalizeAttachmentMetadata,
  saveAttachment,
  validateAttachmentFile,
};

export default WorkflowAttachmentService;
