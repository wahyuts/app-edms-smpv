import { BrowserFileStorageService } from "@/shared/services/browser-file-storage.service";
import {
  AUDIT_RESOURCE_TYPE,
  AUDIT_TRAIL_ACTION,
  AuditTrailService,
} from "@/features/audit-trail";

import {
  MAX_UPLOAD_FILE_SIZE_BYTES,
  MAX_UPLOAD_FILE_SIZE_MB,
} from "../constants/upload.constants";

export const FILE_VALIDATION_CONFIG = {
  acceptedInputTypes:
    ".pdf,.docx,.xls,.xlsx,.jpg,.jpeg,.png,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,image/jpeg,image/png",
  allowedTypes: {
    docx: [
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ],
    jpg: ["image/jpeg"],
    jpeg: ["image/jpeg"],
    pdf: ["application/pdf"],
    png: ["image/png"],
    xls: ["application/vnd.ms-excel"],
    xlsx: [
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    ],
  },
  maximumFileSizeBytes: MAX_UPLOAD_FILE_SIZE_BYTES,
};

const getFileExtension = (fileName = "") => {
  const extension = fileName.split(".").pop();

  return extension ? extension.trim().replace(/^\./, "").toLowerCase() : "";
};

const normalizeFileExtension = (extension = "") =>
  String(extension).trim().replace(/^\./, "").toLowerCase();

const formatFileSize = (fileSize) => {
  if (!Number.isFinite(fileSize)) {
    return "-";
  }

  if (fileSize < 1024 * 1024) {
    return `${Math.max(1, Math.round(fileSize / 1024))} KB`;
  }

  return `${(fileSize / (1024 * 1024)).toFixed(1)} MB`;
};

const getHeaderValue = (headers = {}, headerName) => {
  if (typeof headers.get === "function") {
    return headers.get(headerName);
  }

  const normalizedHeaderName = headerName.toLowerCase();
  return Object.entries(headers).find(
    ([key]) => key.toLowerCase() === normalizedHeaderName,
  )?.[1];
};

const parseContentDispositionFileName = (contentDisposition = "") => {
  const encodedMatch = String(contentDisposition).match(/filename\*=UTF-8''([^;]+)/i);
  if (encodedMatch?.[1]) {
    try {
      return decodeURIComponent(encodedMatch[1]);
    } catch {
      return encodedMatch[1];
    }
  }

  const quotedMatch = String(contentDisposition).match(/filename="([^"]+)"/i);
  if (quotedMatch?.[1]) return quotedMatch[1];

  const plainMatch = String(contentDisposition).match(/filename=([^;]+)/i);
  return plainMatch?.[1]?.trim() ?? "";
};

const createFileId = () => {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return `FILE-${crypto.randomUUID()}`;
  }

  return `FILE-${Date.now()}-${Math.random().toString(16).slice(2)}`;
};

const sanitizeDocxHtml = (html) => {
  if (typeof window === "undefined") {
    return "";
  }

  const allowedTags = new Set([
    "A", "B", "BR", "EM", "H1", "H2", "H3", "H4", "H5", "H6", "I",
    "LI", "OL", "P", "S", "STRONG", "TABLE", "TBODY", "TD", "TH", "THEAD",
    "TR", "U", "UL",
  ]);
  const parsedDocument = new window.DOMParser().parseFromString(html, "text/html");

  const sanitizeNode = (node) => {
    [...node.childNodes].forEach((childNode) => {
      if (childNode.nodeType !== window.Node.ELEMENT_NODE) {
        return;
      }

      const element = childNode;

      if (!allowedTags.has(element.tagName)) {
        while (element.firstChild) {
          node.insertBefore(element.firstChild, element);
        }
        element.remove();
        sanitizeNode(node);
        return;
      }

      [...element.attributes].forEach((attribute) => {
        if (
          element.tagName === "A" &&
          attribute.name === "href" &&
          /^https?:\/\//i.test(attribute.value)
        ) {
          return;
        }
        element.removeAttribute(attribute.name);
      });
      sanitizeNode(element);
    });
  };

  sanitizeNode(parsedDocument.body);
  return parsedDocument.body.innerHTML;
};

const validateFile = (file) => {
  if (!file) {
    throw new Error("File wajib dipilih.");
  }
  if (file.size <= 0) {
    throw new Error("File tidak boleh kosong.");
  }
  if (file.size > FILE_VALIDATION_CONFIG.maximumFileSizeBytes) {
    throw new Error(
      `Ukuran file melebihi batas maksimum ${MAX_UPLOAD_FILE_SIZE_MB} MB.`,
    );
  }

  const fileExtension = getFileExtension(file.name);
  const supportedMimeTypes = FILE_VALIDATION_CONFIG.allowedTypes[fileExtension];

  if (!supportedMimeTypes) {
    throw new Error("Tipe file tidak didukung.");
  }
  if (file.type && !supportedMimeTypes.includes(file.type)) {
    throw new Error("Tipe file tidak sesuai dengan ekstensi file.");
  }

  return {
    fileExtension,
    fileSize: file.size,
    fileSizeDisplay: formatFileSize(file.size),
    mimeType: file.type || supportedMimeTypes[0],
    originalFileName: file.name,
  };
};

const createFileMetadata = ({
  documentId,
  file,
  fileId = createFileId(),
  isActive = true,
  revisionId,
  uploadedBy = "Current User",
} = {}) => {
  if (!documentId) {
    throw new Error("Document ID is required.");
  }

  const validatedFile = validateFile(file);
  const uploadedAt = new Date().toISOString();

  return {
    documentId,
    fileId,
    fileExtension: validatedFile.fileExtension,
    fileName: validatedFile.originalFileName,
    fileSize: validatedFile.fileSize,
    fileSizeDisplay: validatedFile.fileSizeDisplay,
    isActive,
    mimeType: validatedFile.mimeType,
    originalFileName: validatedFile.originalFileName,
    revisionId: revisionId ?? `REV-${fileId}`,
    storageType: "indexeddb",
    uploadedAt,
    uploadedBy,
  };
};

const uploadDocumentFile = async ({
  documentId,
  file,
  fileRole = "active",
  isActive = true,
  revisionId,
  uploadedBy = "Current User",
} = {}) => {
  const metadata = createFileMetadata({
    documentId,
    file,
    isActive,
    revisionId,
    uploadedBy,
  });
  const storagePath = `documents/${documentId}/${fileRole}/${metadata.fileId}`;

  await BrowserFileStorageService.saveFile({ file, metadata, storagePath });

  return { activeFileId: metadata.fileId, metadata, storagePath };
};

const getFileByStoragePath = async (storagePath) => {
  return BrowserFileStorageService.getFile(storagePath);
};

const getDocumentFile = async (documentItem) => {
  if (!documentItem?.storagePath || !documentItem?.activeFileId) {
    throw new Error("File tidak ditemukan.");
  }

  const storedFile = await getFileByStoragePath(documentItem.storagePath);
  const metadata = storedFile?.metadata ?? documentItem.fileMetadata;

  if (
    !storedFile?.file ||
    metadata?.fileId !== documentItem.activeFileId ||
    metadata?.isActive === false
  ) {
    throw new Error("File tidak ditemukan.");
  }

  return { file: storedFile.file, metadata, storagePath: storedFile.storagePath };
};

const getDocumentPreview = async (documentItem) => {
  const documentFile = await getDocumentFile(documentItem);
  const fileExtension = documentFile.metadata.fileExtension.toLowerCase();

  if (fileExtension !== "docx") {
    return {
      ...documentFile,
      previewHtml: null,
      previewMessages: [],
      viewerType: ["jpg", "jpeg", "png"].includes(fileExtension)
        ? "image"
        : fileExtension === "pdf"
          ? "pdf"
          : "fallback",
    };
  }

  try {
    const mammothModule = await import("mammoth");
    const mammothConverter = mammothModule.default ?? mammothModule;
    const result = await mammothConverter.convertToHtml({
      arrayBuffer: await documentFile.file.arrayBuffer(),
    });

    return {
      ...documentFile,
      previewHtml: sanitizeDocxHtml(result.value),
      previewMessages: result.messages ?? [],
      viewerType: "docx",
    };
  } catch (error) {
    return {
      ...documentFile,
      previewError: error instanceof Error ? error.message : "DOCX preview failed.",
      previewHtml: null,
      previewMessages: [],
      viewerType: "fallback",
    };
  }
};

const createPreviewFromBlob = async ({ blob, documentItem, headers = {} } = {}) => {
  const metadata = documentItem?.fileMetadata ?? {};
  const contentType = getHeaderValue(headers, "content-type") ?? blob?.type ?? metadata.mimeType;
  const headerFileName = parseContentDispositionFileName(
    getHeaderValue(headers, "content-disposition"),
  );
  const originalFileName = headerFileName || metadata.originalFileName || documentItem?.documentNumber || "document";
  const fileExtension = getFileExtension(originalFileName || metadata.fileName || "");
  const file = blob instanceof File
    ? blob
    : new File([blob], originalFileName, { type: contentType || metadata.mimeType || blob?.type });
  const documentFile = {
    file,
    metadata: {
      ...metadata,
      fileExtension: metadata.fileExtension ?? fileExtension,
      fileName: metadata.fileName ?? originalFileName,
      fileSize: metadata.fileSize ?? file.size,
      fileSizeDisplay: metadata.fileSizeDisplay ?? formatFileSize(file.size),
      mimeType: contentType ?? metadata.mimeType ?? file.type,
      originalFileName,
    },
    previewHtml: null,
    previewMessages: [],
    storagePath: null,
  };
  const normalizedExtension = normalizeFileExtension(documentFile.metadata.fileExtension);

  if (normalizedExtension !== "docx") {
    return {
      ...documentFile,
      viewerType: ["jpg", "jpeg", "png"].includes(normalizedExtension)
        ? "image"
        : normalizedExtension === "pdf"
          ? "pdf"
          : "fallback",
    };
  }

  try {
    const mammothModule = await import("mammoth");
    const mammothConverter = mammothModule.default ?? mammothModule;
    const result = await mammothConverter.convertToHtml({
      arrayBuffer: await file.arrayBuffer(),
    });

    return {
      ...documentFile,
      previewHtml: sanitizeDocxHtml(result.value),
      previewMessages: result.messages ?? [],
      viewerType: "docx",
    };
  } catch (error) {
    return {
      ...documentFile,
      previewError: error instanceof Error ? error.message : "DOCX preview failed.",
      viewerType: "fallback",
    };
  }
};

const prepareFileReplacement = async ({ documentId, file, revisionId, uploadedBy } = {}) => {
  return uploadDocumentFile({
    documentId,
    file,
    fileRole: "revisions",
    isActive: false,
    revisionId,
    uploadedBy,
  });
};

const finalizeFileReplacement = async ({ previousFile, replacementFile } = {}) => {
  try {
    if (previousFile?.storagePath) {
      await BrowserFileStorageService.updateFileMetadata(
        previousFile.storagePath,
        { isActive: false },
      ).catch((error) => {
        if (error instanceof Error && error.message === "File tidak ditemukan.") {
          return;
        }
        throw error;
      });
    }
    await BrowserFileStorageService.updateFileMetadata(replacementFile.storagePath, {
      isActive: true,
    });
    return {
      ...replacementFile,
      metadata: { ...replacementFile.metadata, isActive: true },
    };
  } catch (error) {
    if (previousFile?.storagePath) {
      await BrowserFileStorageService.updateFileMetadata(previousFile.storagePath, {
        isActive: true,
      }).catch(() => {});
    }
    await BrowserFileStorageService.deleteFile(replacementFile?.storagePath).catch(() => {});
    throw error;
  }
};

const rollbackPreparedFile = async (preparedFile) => {
  if (preparedFile?.storagePath) {
    await BrowserFileStorageService.deleteFile(preparedFile.storagePath);
  }
};

const rollbackFileReplacement = async ({ previousFile, replacementFile } = {}) => {
  if (previousFile?.storagePath) {
    await BrowserFileStorageService.updateFileMetadata(previousFile.storagePath, {
      isActive: true,
    }).catch(() => {});
  }
  await rollbackPreparedFile(replacementFile).catch(() => {});
};

const deleteDocumentFiles = async (documentItem) => {
  const fileReferences = [
    { storagePath: documentItem?.storagePath },
    ...(documentItem?.fileHistory ?? []),
  ];
  const uniqueStoragePaths = [
    ...new Set(fileReferences.map((fileReference) => fileReference.storagePath).filter(Boolean)),
  ];

  await Promise.all(uniqueStoragePaths.map((storagePath) =>
    BrowserFileStorageService.deleteFile(storagePath),
  ));
};

const downloadDocumentFile = async (documentItem) => {
  const documentFile = await getDocumentFile(documentItem);
  const objectUrl = window.URL.createObjectURL(documentFile.file);
  const downloadLink = document.createElement("a");

  try {
    downloadLink.href = objectUrl;
    downloadLink.download = documentFile.metadata.originalFileName;
    document.body.appendChild(downloadLink);
    downloadLink.click();
  } finally {
    downloadLink.remove();
    window.setTimeout(() => window.URL.revokeObjectURL(objectUrl), 0);
  }
  await AuditTrailService.recordActivitySafely({
    action: AUDIT_TRAIL_ACTION.DOWNLOAD_DOCUMENT,
    metadata: {
      fileId: documentFile.metadata.fileId,
      originalFileName: documentFile.metadata.originalFileName,
      revisionId: documentFile.metadata.revisionId,
    },
    reference: documentItem.documentNumber,
    resourceId: documentItem.id,
    resourceType: AUDIT_RESOURCE_TYPE.DOCUMENT,
  });

  return documentFile.metadata;
};

const downloadBlobResponse = async ({ blob, documentItem, headers = {} } = {}) => {
  const metadata = documentItem?.fileMetadata ?? {};
  const originalFileName =
    parseContentDispositionFileName(getHeaderValue(headers, "content-disposition")) ||
    metadata.originalFileName ||
    documentItem?.documentNumber ||
    "document";
  const objectUrl = window.URL.createObjectURL(blob);
  const downloadLink = document.createElement("a");

  try {
    downloadLink.href = objectUrl;
    downloadLink.download = originalFileName;
    document.body.appendChild(downloadLink);
    downloadLink.click();
  } finally {
    downloadLink.remove();
    window.setTimeout(() => window.URL.revokeObjectURL(objectUrl), 0);
  }

  return {
    ...metadata,
    originalFileName,
  };
};

export const FileService = {
  createPreviewFromBlob,
  createFileMetadata,
  deleteDocumentFiles,
  downloadDocumentFile,
  downloadBlobResponse,
  finalizeFileReplacement,
  getDocumentFile,
  getDocumentPreview,
  getFileByStoragePath,
  getUploadPreview: async (file) => validateFile(file),
  prepareFileReplacement,
  rollbackPreparedFile,
  rollbackFileReplacement,
  uploadDocumentFile,
  validateFile,
};

export default FileService;
