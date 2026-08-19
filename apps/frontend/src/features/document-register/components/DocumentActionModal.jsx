import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import {
  Download,
  Eye,
  FileText,
  FileUp,
  Loader2,
  Paperclip,
  Trash2,
  X,
} from "lucide-react";

import { DOCUMENT_STATUS } from "../constants/document.constants";
import { MAX_UPLOAD_FILE_SIZE_MB } from "../constants/upload.constants";
import { FILE_VALIDATION_CONFIG, FileService } from "../services/file.service";
import {
  WORKFLOW_ATTACHMENT_VALIDATION_CONFIG,
  WorkflowAttachmentService,
} from "../services/workflow-attachment.service";
import PreviewCanvas from "./PreviewCanvas";
import SpreadsheetPreview from "./SpreadsheetPreview";

const modalButtonBaseClassName =
  "inline-flex h-9 items-center justify-center rounded-md px-4 text-sm font-semibold transition-colors";

const secondaryButtonClassName = [
  modalButtonBaseClassName,
  "border border-[#123A5A] text-[#CBD5E1] hover:border-[#0F7BFF] hover:bg-[#0B2B47] hover:text-white",
].join(" ");

const primaryButtonClassName = [
  modalButtonBaseClassName,
  "bg-[#0F7BFF] text-white hover:bg-[#0B63CC]",
].join(" ");

const dangerButtonClassName = [
  modalButtonBaseClassName,
  "bg-[#EF4444] text-white hover:bg-[#B91C1C]",
].join(" ");

const fieldLabelClassName = "text-xs font-semibold uppercase text-[#94A3B8]";
const valueClassName = "mt-1 text-sm font-semibold text-[#F8FAFC]";
const fileInputClassName =
  "mt-2 flex cursor-pointer flex-col items-center justify-center rounded-lg border border-dashed border-[#123A5A] bg-[#031528] px-4 py-5 text-center text-sm text-[#94A3B8] transition-colors hover:border-[#0F7BFF] hover:bg-[#08233B]";
const fileInputDragActiveClassName = "border-[#0F7BFF] bg-[#08233B]";

const formatDateTime = (value) => {
  if (!value) {
    return "-";
  }

  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(value));
};

const formatCommentDateTime = (value) => {
  if (!value) {
    return "-";
  }

  const parsedDate = new Date(value);
  if (Number.isNaN(parsedDate.getTime())) {
    return "-";
  }

  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    hour: "2-digit",
    hour12: false,
    minute: "2-digit",
    month: "short",
    timeZone: "Asia/Jakarta",
    year: "numeric",
  }).format(parsedDate);
};

const formatCommentActor = (comment) => {
  const actorName = comment?.createdBy ?? "-";
  const actorRole =
    comment?.createdByOfficialRole ??
    comment?.actorOfficialRole ??
    comment?.projectOfficialRole ??
    comment?.officialRole ??
    "";

  return actorRole ? `${actorName} (${actorRole})` : actorName;
};

const formatTimelineActor = (timelineItem) => {
  const actorName = timelineItem?.createdBy ?? "-";
  const actorRole =
    timelineItem?.createdByOfficialRole ??
    timelineItem?.actorOfficialRole ??
    timelineItem?.projectOfficialRole ??
    timelineItem?.officialRole ??
    "";

  return actorRole ? `${actorName} (${actorRole})` : actorName;
};

const normalizeFileExtension = (extension = "") =>
  String(extension).trim().replace(/^\./, "").toLowerCase();

const FileUploadField = ({
  errorMessage,
  filePreview,
  isDisabled = false,
  onFileChange,
  onFileSelectionError = () => {},
  required = false,
}) => {
  const [isDraggingFile, setIsDraggingFile] = useState(false);

  const handleDragEvent = (event) => {
    event.preventDefault();
    event.stopPropagation();
  };

  const handleDragEnter = (event) => {
    handleDragEvent(event);
    if (!isDisabled) {
      setIsDraggingFile(true);
    }
  };

  const handleDragOver = (event) => {
    handleDragEvent(event);
    if (!isDisabled) {
      setIsDraggingFile(true);
    }
  };

  const handleDragLeave = (event) => {
    handleDragEvent(event);
    if (
      event.relatedTarget &&
      event.currentTarget.contains(event.relatedTarget)
    ) {
      return;
    }
    setIsDraggingFile(false);
  };

  const handleSelectedFiles = (fileList) => {
    if (isDisabled) {
      return;
    }

    const files = Array.from(fileList ?? []);

    if (files.length === 0) {
      return;
    }

    if (files.length > 1) {
      onFileSelectionError("Hanya satu file yang dapat dipilih.");
      return;
    }

    onFileChange(files[0]);
  };

  const handleFileInputChange = (event) => {
    handleSelectedFiles(event.target.files);
    event.target.value = "";
  };

  const handleDrop = (event) => {
    handleDragEvent(event);
    setIsDraggingFile(false);
    handleSelectedFiles(event.dataTransfer?.files);
  };

  return (
    <div>
      <p className={fieldLabelClassName}>
        Upload File {required ? "(Required)" : "(Optional)"}
      </p>
      <label
        className={[
          fileInputClassName,
          isDraggingFile && !isDisabled ? fileInputDragActiveClassName : "",
        ].filter(Boolean).join(" ")}
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
      >
        <FileUp className="mb-2 h-6 w-6 text-[#00C8FF]" />
        <span className="font-semibold text-[#F8FAFC]">Choose file or Drag file here</span>
        <span className="mt-1 text-xs">
          PDF, DOCX, XLS, XLSX, JPG, or PNG. Maximum {MAX_UPLOAD_FILE_SIZE_MB} MB.
        </span>
        <input
          accept={FILE_VALIDATION_CONFIG.acceptedInputTypes}
          className="sr-only"
          disabled={isDisabled}
          onChange={handleFileInputChange}
          type="file"
        />
      </label>
      {filePreview ? (
        <div className="mt-3 rounded-lg border border-[#123A5A] bg-[#08233B] p-3 text-sm">
          <p className="font-semibold text-[#F8FAFC]">
            {filePreview.originalFileName}
          </p>
          <p className="mt-1 text-xs text-[#94A3B8]">
            {filePreview.fileExtension.toUpperCase()} -{" "}
            {filePreview.fileSizeDisplay}
          </p>
        </div>
      ) : null}
      {errorMessage ? (
        <p className="mt-2 text-sm font-semibold text-[#FCA5A5]">
          {errorMessage}
        </p>
      ) : null}
    </div>
  );
};

const WorkflowAttachmentField = ({
  attachmentErrorMessage,
  attachmentPreview,
  onAttachmentChange,
  onAttachmentRemove,
}) => {
  const [isDraggingAttachment, setIsDraggingAttachment] = useState(false);

  const handleAttachmentSelectionError = (message) => {
    onAttachmentChange({
      errorMessage: message,
      file: null,
      preview: null,
    });
  };

  const handleSelectedAttachmentFiles = (fileList) => {
    const files = Array.from(fileList ?? []);

    if (files.length === 0) {
      return;
    }

    if (files.length > 1) {
      handleAttachmentSelectionError("Hanya satu file yang dapat dipilih.");
      return;
    }

    const file = files[0];
    if (!file) {
      return;
    }

    try {
      const nextAttachmentPreview =
        WorkflowAttachmentService.validateAttachmentFile(file);

      onAttachmentChange({
        errorMessage: "",
        file,
        preview: nextAttachmentPreview,
      });
    } catch (error) {
      onAttachmentChange({
        errorMessage:
          error instanceof Error ? error.message : "Validasi attachment gagal.",
        file: null,
        preview: null,
      });
    }
  };

  const handleFileChange = (event) => {
    handleSelectedAttachmentFiles(event.target.files);
    event.target.value = "";
  };

  const handleDragEvent = (event) => {
    event.preventDefault();
    event.stopPropagation();
  };

  const handleDragEnter = (event) => {
    handleDragEvent(event);
    setIsDraggingAttachment(true);
  };

  const handleDragOver = (event) => {
    handleDragEvent(event);
    setIsDraggingAttachment(true);
  };

  const handleDragLeave = (event) => {
    handleDragEvent(event);
    if (
      event.relatedTarget &&
      event.currentTarget.contains(event.relatedTarget)
    ) {
      return;
    }
    setIsDraggingAttachment(false);
  };

  const handleDrop = (event) => {
    handleDragEvent(event);
    setIsDraggingAttachment(false);
    handleSelectedAttachmentFiles(event.dataTransfer?.files);
  };

  return (
    <div>
      <p className={fieldLabelClassName}>Workflow Attachment (Optional)</p>
      <label
        className={[
          fileInputClassName,
          isDraggingAttachment ? fileInputDragActiveClassName : "",
        ].filter(Boolean).join(" ")}
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
      >
        <FileUp className="mb-2 h-6 w-6 text-[#00C8FF]" />
        <span className="font-semibold text-[#F8FAFC]">Upload Attachment</span>
        <span className="mt-1 text-xs">
          PDF, PNG, JPG, or JPEG. Maximum {MAX_UPLOAD_FILE_SIZE_MB} MB.
        </span>
        <input
          accept={WORKFLOW_ATTACHMENT_VALIDATION_CONFIG.acceptedInputTypes}
          className="sr-only"
          onChange={handleFileChange}
          type="file"
        />
      </label>
      {attachmentPreview ? (
        <div className="mt-3 flex items-center justify-between gap-3 rounded-lg border border-[#123A5A] bg-[#08233B] p-3 text-sm">
          <div className="min-w-0">
            <p className="truncate font-semibold text-[#F8FAFC]">
              {attachmentPreview.originalFileName}
            </p>
            <p className="mt-1 text-xs text-[#94A3B8]">
              {attachmentPreview.fileSizeDisplay}
            </p>
          </div>
          <button
            aria-label="Remove workflow attachment"
            className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-md border border-[#123A5A] text-[#CBD5E1] transition-colors hover:border-[#EF4444] hover:bg-[#450A0A] hover:text-white"
            onClick={onAttachmentRemove}
            title="Remove file"
            type="button"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      ) : null}
      {attachmentErrorMessage ? (
        <p className="mt-2 text-sm font-semibold text-[#FCA5A5]">
          {attachmentErrorMessage}
        </p>
      ) : null}
    </div>
  );
};

const modalSizeClassName = {
  default: "max-w-2xl",
  viewer: "max-w-[95vw]",
};

const modalShellClassName = {
  default: "max-h-[calc(100dvh-2rem)] sm:max-h-[calc(100dvh-3rem)]",
  viewer:
    "h-[calc(100dvh-2rem)] max-h-[calc(100dvh-2rem)] sm:h-[calc(100dvh-3rem)] sm:max-h-[calc(100dvh-3rem)]",
};

const modalBodyClassName = {
  default: "min-h-0 flex-1 overflow-y-auto overflow-x-hidden px-5 py-4",
  viewer: "min-h-0 flex-1 overflow-hidden px-5 py-4",
};

const inputClassName =
  "mt-2 h-10 w-full rounded-md border border-[#123A5A] bg-[#08233B] px-3 text-sm text-[#F8FAFC] outline-none transition-colors placeholder:text-[#64748B] focus:border-[#0F7BFF]";
const textareaClassName =
  "mt-2 min-h-24 w-full rounded-md border border-[#123A5A] bg-[#08233B] px-3 py-2 text-sm text-[#F8FAFC] outline-none transition-colors placeholder:text-[#64748B] focus:border-[#0F7BFF]";
const validationClassName = "mt-2 text-sm font-semibold text-[#FCA5A5]";

const renderLoadingButtonContent = (label) => (
  <span className="inline-flex items-center gap-2">
    <Loader2 aria-hidden="true" className="h-4 w-4 animate-spin" />
    {label}
  </span>
);

const DocumentActionModal = ({
  children,
  footer,
  isCloseDisabled = false,
  onClose,
  size = "default",
  title,
}) => {
  useEffect(() => {
    const previousOverflow = document.body.style.overflow;

    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, []);

  const modalContent = (
    <div className="fixed inset-0 z-[9000] flex items-center justify-center bg-[#020617]/80 p-4 sm:p-6">
      <section
        className={[
          "flex w-full flex-col overflow-hidden rounded-lg border border-[#123A5A] bg-[#061B2F] text-[#F8FAFC] shadow-2xl",
          modalShellClassName[size] ?? modalShellClassName.default,
          modalSizeClassName[size] ?? modalSizeClassName.default,
        ].join(" ")}
      >
        <header className="shrink-0 flex items-center justify-between border-b border-[#123A5A] px-5 py-4">
          <h2 className="text-lg font-bold">{title}</h2>
          <button
            aria-label="Close modal"
            className={[
              "rounded-md p-1.5 text-[#CBD5E1] transition-colors",
              isCloseDisabled
                ? "cursor-not-allowed opacity-50"
                : "hover:bg-[#0B2B47] hover:text-white",
            ].join(" ")}
            disabled={isCloseDisabled}
            onClick={onClose}
            type="button"
          >
            <X className="h-4 w-4" />
          </button>
        </header>
        <div className={modalBodyClassName[size] ?? modalBodyClassName.default}>
          {children}
        </div>
        {footer ? (
          <footer className="shrink-0 flex justify-end gap-3 border-t border-[#123A5A] px-5 py-4">
            {footer}
          </footer>
        ) : null}
      </section>
    </div>
  );

  return createPortal(modalContent, document.body);
};

export const DocumentSummary = ({ documentItem }) => {
  return (
    <div className="grid gap-3 rounded-lg border border-[#123A5A] bg-[#08233B] p-4 md:grid-cols-2">
      <div>
        <p className={fieldLabelClassName}>Document Number</p>
        <p className={valueClassName}>{documentItem.documentNumber}</p>
      </div>
      <div>
        <p className={fieldLabelClassName}>Current Status</p>
        <p className={valueClassName}>{documentItem.status}</p>
      </div>
    </div>
  );
};

export const ViewDocumentModal = ({
  documentFile,
  documentItem,
  onClose,
  onDownload,
}) => {
  const metadata = documentItem.fileMetadata;
  const fileExtension = documentFile?.error
    ? ""
    : normalizeFileExtension(
        documentFile?.metadata?.fileExtension ??
        metadata?.fileExtension ??
        ""
      );
  const isDocxPreviewAvailable =
    fileExtension === "docx" && Boolean(documentFile?.previewHtml);
  const isSpreadsheetPreviewAvailable =
    ["xls", "xlsx"].includes(fileExtension) && Boolean(documentFile?.file);

  return (
    <DocumentActionModal
      footer={
        <>
          {["docx", "xls", "xlsx"].includes(fileExtension) ? (
            <button
              className={secondaryButtonClassName}
              onClick={onDownload}
              type="button"
            >
              Download
            </button>
          ) : null}
          <button className={primaryButtonClassName} onClick={onClose} type="button">
            Close
          </button>
        </>
      }
      onClose={onClose}
      size="viewer"
      title="View Document"
    >
      <div className="grid h-full min-h-0 grid-rows-[minmax(0,240px)_minmax(0,1fr)] gap-5 lg:grid-cols-[360px_minmax(0,1fr)] lg:grid-rows-none">
        <aside className="h-full min-h-0 space-y-4 overflow-y-auto overflow-x-hidden rounded-lg border border-[#123A5A] bg-[#031528] p-4">
          <div>
            <p className={fieldLabelClassName}>Document Number</p>
            <p className={valueClassName}>{documentItem.documentNumber}</p>
          </div>
          <div>
            <p className={fieldLabelClassName}>Description</p>
            <p className="mt-1 text-sm text-[#CBD5E1]">
              {documentItem.description}
            </p>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
            <div>
              <p className={fieldLabelClassName}>Drawing</p>
              <p className={valueClassName}>{documentItem.drawing}</p>
            </div>
            <div>
              <p className={fieldLabelClassName}>Area</p>
              <p className={valueClassName}>{documentItem.area}</p>
            </div>
            <div>
              <p className={fieldLabelClassName}>Revision</p>
              <p className={valueClassName}>{documentItem.revision}</p>
            </div>
            <div>
              <p className={fieldLabelClassName}>Status</p>
              <p className={valueClassName}>{documentItem.status}</p>
            </div>
          </div>
          {metadata?.originalFileName ? (
            <div className="grid gap-3 rounded-lg border border-[#123A5A] bg-[#08233B] p-4">
            <div>
              <p className={fieldLabelClassName}>Active File ID</p>
              <p className={valueClassName}>{documentItem.activeFileId ?? "-"}</p>
            </div>
            <div>
              <p className={fieldLabelClassName}>Original File Name</p>
              <p className={valueClassName}>{metadata.originalFileName}</p>
            </div>
            <div>
              <p className={fieldLabelClassName}>File Extension</p>
              <p className={valueClassName}>
                {(metadata.fileExtension ?? metadata.fileType ?? "-").toUpperCase()}
              </p>
            </div>
            <div>
              <p className={fieldLabelClassName}>MIME Type</p>
              <p className={valueClassName}>{metadata.mimeType ?? "-"}</p>
            </div>
            <div>
              <p className={fieldLabelClassName}>File Size</p>
              <p className={valueClassName}>
                {metadata.fileSizeDisplay ?? metadata.fileSize ?? "-"}
              </p>
            </div>
            <div>
              <p className={fieldLabelClassName}>Uploaded By</p>
              <p className={valueClassName}>{metadata.uploadedBy ?? "-"}</p>
            </div>
            </div>
          ) : null}
          {documentItem.fileHistory?.length > 0 ? (
            <div>
              <p className={fieldLabelClassName}>File History Reference</p>
              <div className="mt-2 space-y-2">
                {documentItem.fileHistory.map((fileHistoryItem, index) => (
                  <div
                    className="rounded-lg border border-[#123A5A] bg-[#08233B] p-3 text-sm"
                    key={
                      fileHistoryItem.fileId ??
                      fileHistoryItem.storagePath ??
                      fileHistoryItem.fileMetadata?.fileId ??
                      `file-history-${index}`
                    }
                  >
                    <p className="font-semibold text-[#F8FAFC]">
                      {fileHistoryItem.fileMetadata?.originalFileName ?? "-"}
                    </p>
                    <p className="mt-1 text-xs text-[#94A3B8]">
                      Version {fileHistoryItem.activeVersion ?? "-"} -{" "}
                      {fileHistoryItem.fileMetadata?.uploadedAt
                        ? formatDateTime(fileHistoryItem.fileMetadata.uploadedAt)
                        : "-"}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          ) : null}
        </aside>

        <PreviewCanvas isPdf={fileExtension === "pdf"}>
          {fileExtension === "pdf" ? (
            <iframe
              className="h-full w-full bg-white"
              key={documentFile.objectUrl}
              src={documentFile.objectUrl}
              title={`${documentItem.documentNumber} PDF Viewer`}
            />
          ) : null}
          {["jpg", "jpeg", "png"].includes(fileExtension) ? (
            <img
              alt={metadata?.originalFileName ?? documentItem.documentNumber}
              className="rounded-md object-contain"
              key={documentFile.objectUrl}
              src={documentFile.objectUrl}
            />
          ) : null}
          {isDocxPreviewAvailable ? (
            <div className="w-[min(82vw,960px)] bg-white p-6 text-sm leading-6 text-[#0F172A]">
              <div className="mb-4 rounded-md border border-[#FACC15] bg-[#FEF3C7] p-3 text-xs font-semibold text-[#713F12]">
                DOCX preview is generated in the browser and may not match
                Microsoft Word exactly.
              </div>
              <div
                className="docx-preview space-y-3"
                dangerouslySetInnerHTML={{ __html: documentFile.previewHtml }}
              />
            </div>
          ) : null}
          {fileExtension === "docx" && !isDocxPreviewAvailable ? (
            <div className="w-[min(82vw,520px)] p-6 text-center text-sm text-[#94A3B8]">
              <p className="font-semibold text-[#F8FAFC]">
                DOCX preview is unavailable.
              </p>
              <p className="mt-2 max-w-md">
                File information is shown on the left. Use Download to open the
                file in a compatible document editor.
              </p>
              {documentFile?.previewError ? (
                <p className="mt-3 text-xs text-[#FCA5A5]">
                  {documentFile.previewError}
                </p>
              ) : null}
            </div>
          ) : null}
          {isSpreadsheetPreviewAvailable ? (
            <SpreadsheetPreview file={documentFile.file} />
          ) : null}
          {documentFile?.error ? (
            <div className="w-[min(82vw,520px)] p-6 text-center text-sm text-[#94A3B8]">
              <p className="font-semibold text-[#F8FAFC]">
                File is unavailable.
              </p>
              <p className="mt-2 max-w-md">
                The active file could not be loaded from the backend.
              </p>
            </div>
          ) : null}
        </PreviewCanvas>
      </div>
    </DocumentActionModal>
  );
};

export const WorkflowAttachmentCard = ({
  activeAction = null,
  attachment,
  disabled = false,
  errorMessage = "",
  onDownload,
  onView,
}) => {
  if (!attachment) {
    return null;
  }

  return (
    <div className="mt-4 rounded-lg border border-[#123A5A] bg-[#031528] p-3">
      <p className={fieldLabelClassName}>Attachment</p>
      <div className="mt-2 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex min-w-0 items-start gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md border border-[#123A5A] bg-[#08233B] text-[#00C8FF]">
            <Paperclip className="h-4 w-4" />
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-[#F8FAFC]">
              {attachment.originalFileName || "Workflow Attachment"}
            </p>
            <p className="mt-1 text-xs text-[#94A3B8]">
              {attachment.fileSizeDisplay ?? attachment.fileSize ?? "-"}
            </p>
          </div>
        </div>
        <div className="flex shrink-0 gap-2">
          <button
            className={secondaryButtonClassName}
            disabled={disabled}
            onClick={onView}
            type="button"
          >
            {activeAction === "view" ? (
              renderLoadingButtonContent("View")
            ) : (
              <>
                <Eye className="mr-2 h-4 w-4" />
                View
              </>
            )}
          </button>
          <button
            className={secondaryButtonClassName}
            disabled={disabled}
            onClick={onDownload}
            type="button"
          >
            {activeAction === "download" ? (
              renderLoadingButtonContent("Download")
            ) : (
              <>
                <Download className="mr-2 h-4 w-4" />
                Download
              </>
            )}
          </button>
        </div>
      </div>
      {errorMessage ? (
        <p className="mt-3 text-sm font-semibold text-[#FCA5A5]">
          {errorMessage}
        </p>
      ) : null}
    </div>
  );
};

export const CommentViewerModal = ({
  activeAttachmentAction = null,
  attachmentErrors = {},
  comments = [],
  documentItem,
  onAttachmentDownload = () => {},
  onAttachmentView = () => {},
  onClose,
}) => {
  return (
    <DocumentActionModal
      footer={
        <button className={primaryButtonClassName} onClick={onClose} type="button">
          Close
        </button>
      }
      onClose={onClose}
      title="Comment Viewer"
    >
      <div className="space-y-4">
        <div>
          <p className={fieldLabelClassName}>Document Number</p>
          <p className={valueClassName}>{documentItem.documentNumber}</p>
        </div>
        {comments.length > 0 ? (
          <div className="space-y-3">
            {comments.map((comment) => (
              <article
                className="rounded-lg border border-[#123A5A] bg-[#08233B] p-4"
                key={comment.id}
              >
                <div className="flex flex-col gap-1 md:flex-row md:items-center md:justify-between">
                  <p className="text-sm font-semibold text-[#00C8FF]">
                    {comment.workflowAction}
                  </p>
                  <p className="text-xs text-[#94A3B8]">
                    {formatCommentDateTime(comment.createdDate)}
                  </p>
                </div>
                <p className="mt-3 text-sm text-[#CBD5E1]">
                  {comment.workflowComment}
                </p>
                <p className="mt-3 text-xs text-[#94A3B8]">
                  By {formatCommentActor(comment)}
                </p>
                <WorkflowAttachmentCard
                  activeAction={
                    activeAttachmentAction?.commentId === comment.id
                      ? activeAttachmentAction.type
                      : null
                  }
                  attachment={comment.attachment}
                  disabled={Boolean(activeAttachmentAction)}
                  errorMessage={attachmentErrors[comment.id] ?? ""}
                  onDownload={() => onAttachmentDownload(comment)}
                  onView={() => onAttachmentView(comment)}
                />
              </article>
            ))}
          </div>
        ) : (
          <div className="rounded-lg border border-dashed border-[#123A5A] bg-[#031528] p-6 text-center text-sm text-[#94A3B8]">
            No workflow comments available.
          </div>
        )}
      </div>
    </DocumentActionModal>
  );
};

export const WorkflowAttachmentViewerModal = ({
  attachment,
  attachmentFile,
  onClose,
  onDownload,
  onRetry,
}) => {
  const metadata = attachmentFile?.metadata ?? attachment ?? {};
  const fileExtension = (
    metadata.fileExtension ??
    metadata.originalFileName?.split(".").pop() ??
    ""
  ).toLowerCase();
  const viewerType = attachmentFile?.viewerType;
  const isFileUnavailable = Boolean(attachmentFile?.error);
  const isUnsupported = !isFileUnavailable && (!viewerType || viewerType === "fallback");

  return (
    <DocumentActionModal
      footer={
        <>
          {isFileUnavailable ? (
            <button className={secondaryButtonClassName} onClick={onRetry} type="button">
              Retry
            </button>
          ) : null}
          {isUnsupported ? (
            <button className={secondaryButtonClassName} onClick={onDownload} type="button">
              Download
            </button>
          ) : null}
          <button className={primaryButtonClassName} onClick={onClose} type="button">
            Close
          </button>
        </>
      }
      onClose={onClose}
      size="viewer"
      title="View Workflow Attachment"
    >
      <div className="grid h-full min-h-0 grid-rows-[minmax(0,220px)_minmax(0,1fr)] gap-5 lg:grid-cols-[320px_minmax(0,1fr)] lg:grid-rows-none">
        <aside className="h-full min-h-0 space-y-4 overflow-y-auto overflow-x-hidden rounded-lg border border-[#123A5A] bg-[#031528] p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-md border border-[#123A5A] bg-[#08233B] text-[#00C8FF]">
              <FileText className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-[#F8FAFC]">
                {metadata.originalFileName || "Workflow Attachment"}
              </p>
              <p className="mt-1 text-xs text-[#94A3B8]">
                {(fileExtension || "-").toUpperCase()} -{" "}
                {metadata.fileSizeDisplay ?? metadata.fileSize ?? "-"}
              </p>
            </div>
          </div>
          <div className="grid gap-3 rounded-lg border border-[#123A5A] bg-[#08233B] p-4">
            <div>
              <p className={fieldLabelClassName}>MIME Type</p>
              <p className={valueClassName}>{metadata.mimeType ?? "-"}</p>
            </div>
            <div>
              <p className={fieldLabelClassName}>Uploaded By</p>
              <p className={valueClassName}>{metadata.uploadedBy ?? "-"}</p>
            </div>
            <div>
              <p className={fieldLabelClassName}>Uploaded At</p>
              <p className={valueClassName}>{formatDateTime(metadata.uploadedAt)}</p>
            </div>
          </div>
        </aside>

        <PreviewCanvas isPdf={viewerType === "pdf" && !isFileUnavailable}>
          {viewerType === "pdf" && !isFileUnavailable ? (
            <iframe
              className="h-full w-full bg-white"
              src={attachmentFile.objectUrl}
              title={`${metadata.originalFileName ?? "Workflow Attachment"} PDF Viewer`}
            />
          ) : null}
          {viewerType === "image" && !isFileUnavailable ? (
            <img
              alt={metadata.originalFileName ?? "Workflow Attachment"}
              className="rounded-md object-contain"
              src={attachmentFile.objectUrl}
            />
          ) : null}
          {isUnsupported ? (
            <div className="w-[min(82vw,520px)] p-6 text-center text-sm text-[#94A3B8]">
              <p className="font-semibold text-[#F8FAFC]">
                Attachment preview is not supported.
              </p>
              <p className="mt-2 max-w-md">
                File information is shown on the left. Use Download to open the
                file outside EDMS.
              </p>
            </div>
          ) : null}
          {isFileUnavailable ? (
            <div className="w-[min(82vw,520px)] p-6 text-center text-sm text-[#94A3B8]">
              <p className="font-semibold text-[#F8FAFC]">
                Workflow Attachment is unavailable.
              </p>
              <p className="mt-2 max-w-md">
                {attachmentFile.error}
              </p>
            </div>
          ) : null}
        </PreviewCanvas>
      </div>
    </DocumentActionModal>
  );
};

export const HistoryModal = ({ documentItem, onClose, timeline = [] }) => {
  return (
    <DocumentActionModal
      footer={
        <button className={primaryButtonClassName} onClick={onClose} type="button">
          Close
        </button>
      }
      onClose={onClose}
      title="Revision History"
    >
      <div className="space-y-4">
        <div>
          <p className={fieldLabelClassName}>Document Number</p>
          <p className={valueClassName}>{documentItem.documentNumber}</p>
        </div>
        {timeline.length > 0 ? (
          <div className="space-y-3">
            {timeline.map((timelineItem) => (
              <article
                className="rounded-lg border border-[#123A5A] bg-[#08233B] p-4"
                key={timelineItem.id}
              >
                <div className="flex flex-col gap-1 md:flex-row md:items-center md:justify-between">
                  <p className="text-sm font-semibold text-[#00C8FF]">
                    {timelineItem.workflowEvent}
                  </p>
                  <p className="text-xs text-[#94A3B8]">
                    {formatDateTime(timelineItem.createdDate)}
                  </p>
                </div>
                <dl className="mt-3 grid gap-3 text-sm md:grid-cols-3">
                  <div>
                    <dt className={fieldLabelClassName}>Activity</dt>
                    <dd className={valueClassName}>{timelineItem.activity}</dd>
                  </div>
                  <div>
                    <dt className={fieldLabelClassName}>Status</dt>
                    <dd className={valueClassName}>{timelineItem.status}</dd>
                  </div>
                  <div>
                    <dt className={fieldLabelClassName}>Revision</dt>
                    <dd className={valueClassName}>{timelineItem.revision}</dd>
                  </div>
                </dl>
                <p className="mt-3 text-xs text-[#94A3B8]">
                  By {formatTimelineActor(timelineItem)}
                </p>
              </article>
            ))}
          </div>
        ) : (
          <div className="rounded-lg border border-dashed border-[#123A5A] bg-[#031528] p-6 text-center text-sm text-[#94A3B8]">
            No document timeline available.
          </div>
        )}
      </div>
    </DocumentActionModal>
  );
};

export const ApprovalConfirmationModal = ({
  actionSummary,
  confirmLabel = "Confirm",
  documentItem,
  isDanger = false,
  isSubmitting = false,
  message,
  onCancel,
  onConfirm,
}) => {
  return (
    <DocumentActionModal
      footer={
        <>
          <button
            className={secondaryButtonClassName}
            disabled={isSubmitting}
            onClick={onCancel}
            type="button"
          >
            Cancel
          </button>
          <button
            className={isDanger ? dangerButtonClassName : primaryButtonClassName}
            disabled={isSubmitting}
            onClick={onConfirm}
            type="button"
          >
            {isSubmitting ? renderLoadingButtonContent("Confirming...") : confirmLabel}
          </button>
        </>
      }
      isCloseDisabled={isSubmitting}
      onClose={onCancel}
      title={confirmLabel}
    >
      <div className="space-y-4">
        <DocumentSummary documentItem={documentItem} />
        <div>
          <p className={fieldLabelClassName}>Action Summary</p>
          <p className={valueClassName}>{actionSummary}</p>
        </div>
        <p className="text-sm text-[#CBD5E1]">{message}</p>
      </div>
    </DocumentActionModal>
  );
};

export const ApprovalCommentModal = ({
  actionSummary,
  attachmentErrorMessage = "",
  attachmentPreview = null,
  comment,
  documentItem,
  errorMessage,
  isCommentRequired = false,
  isDanger = false,
  isSubmitting = false,
  onAttachmentChange = () => {},
  onAttachmentRemove = () => {},
  onCancel,
  onCommentChange,
  onSubmit,
  submitLabel,
  title,
}) => {
  return (
    <DocumentActionModal
      footer={
        <>
          <button
            className={secondaryButtonClassName}
            disabled={isSubmitting}
            onClick={onCancel}
            type="button"
          >
            Cancel
          </button>
          <button
            className={isDanger ? dangerButtonClassName : primaryButtonClassName}
            disabled={isSubmitting}
            onClick={onSubmit}
            type="button"
          >
            {isSubmitting ? renderLoadingButtonContent("Submitting...") : submitLabel}
          </button>
        </>
      }
      isCloseDisabled={isSubmitting}
      onClose={onCancel}
      title={title}
    >
      <div className="space-y-4">
        <DocumentSummary documentItem={documentItem} />
        <div>
          <p className={fieldLabelClassName}>Action Summary</p>
          <p className={valueClassName}>{actionSummary}</p>
        </div>
        <label className="block">
          <span className={fieldLabelClassName}>
            Comment {isCommentRequired ? "(Required)" : "(Optional)"}
          </span>
          <textarea
            className="mt-2 min-h-28 w-full rounded-md border border-[#123A5A] bg-[#08233B] px-3 py-2 text-sm text-[#F8FAFC] outline-none transition-colors placeholder:text-[#64748B] focus:border-[#0F7BFF]"
            onChange={(event) => onCommentChange(event.target.value)}
            placeholder="Write workflow comment..."
            value={comment}
          />
        </label>
        <WorkflowAttachmentField
          attachmentErrorMessage={attachmentErrorMessage}
          attachmentPreview={attachmentPreview}
          onAttachmentChange={onAttachmentChange}
          onAttachmentRemove={onAttachmentRemove}
        />
        {errorMessage ? (
          <p className="text-sm font-semibold text-[#FCA5A5]">{errorMessage}</p>
        ) : null}
      </div>
    </DocumentActionModal>
  );
};

export const CreateDocumentModal = ({
  drawing,
  onCancel,
  onSubmit,
  onValidationFailed = () => {},
}) => {
  const [formValue, setFormValue] = useState({
    area: "",
    daysUntilValidation: 5,
    description: "",
    documentNumber: "",
  });
  const [selectedFile, setSelectedFile] = useState(null);
  const [filePreview, setFilePreview] = useState(null);
  const [fileErrorMessage, setFileErrorMessage] = useState("");
  const [validationMessages, setValidationMessages] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (fieldName, value) => {
    setFormValue((currentValue) => ({
      ...currentValue,
      [fieldName]: value,
    }));
    setValidationMessages((currentMessages) => ({
      ...currentMessages,
      [fieldName]: "",
    }));
  };

  const handleFileSelectionError = (message) => {
    setSelectedFile(null);
    setFilePreview(null);
    setFileErrorMessage(message);
    onValidationFailed(message);
  };

  const handleFileChange = async (file) => {
    try {
      const nextFilePreview = await FileService.getUploadPreview(file);

      setSelectedFile(file);
      setFilePreview(nextFilePreview);
      setFileErrorMessage("");
      setValidationMessages((currentMessages) => ({
        ...currentMessages,
        file: "",
      }));
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Validasi file gagal.";

      handleFileSelectionError(message);
    }
  };

  const handleSubmit = async () => {
    const nextValidationMessages = {};

    if (!selectedFile) {
      nextValidationMessages.file = "Upload File wajib diisi.";
    }

    if (!formValue.documentNumber.trim()) {
      nextValidationMessages.documentNumber = "Document Number wajib diisi.";
    }

    if (!formValue.description.trim()) {
      nextValidationMessages.description = "Description wajib diisi.";
    }

    if (!formValue.area.trim()) {
      nextValidationMessages.area = "Area wajib diisi.";
    }

    if (
      formValue.daysUntilValidation === "" ||
      Number.isNaN(Number(formValue.daysUntilValidation))
    ) {
      nextValidationMessages.daysUntilValidation =
        "Days Until Validation wajib diisi.";
    }

    if (Object.keys(nextValidationMessages).length > 0) {
      const message = "Lengkapi seluruh field wajib sebelum submit.";

      setValidationMessages(nextValidationMessages);
      setFileErrorMessage(nextValidationMessages.file ?? "");
      onValidationFailed(message);
      return;
    }

    setIsSubmitting(true);
    try {
      await onSubmit({
        ...formValue,
        daysUntilValidation: Number(formValue.daysUntilValidation),
        drawing,
        file: selectedFile,
      });
    } catch {
      // Keep the entered values available when the service operation fails.
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <DocumentActionModal
      footer={
        <>
          <button className={secondaryButtonClassName} disabled={isSubmitting} onClick={onCancel} type="button">
            Cancel
          </button>
          <button className={primaryButtonClassName} disabled={isSubmitting} onClick={handleSubmit} type="button">
            {isSubmitting ? "Uploading..." : "Submit"}
          </button>
        </>
      }
      onClose={isSubmitting ? () => {} : onCancel}
      title="Create Document"
    >
      <div className="space-y-4">
        <FileUploadField
          errorMessage={fileErrorMessage || validationMessages.file}
          filePreview={filePreview}
          isDisabled={isSubmitting}
          onFileChange={handleFileChange}
          onFileSelectionError={handleFileSelectionError}
          required
        />
        <label className="block">
          <span className={fieldLabelClassName}>Document Number</span>
          <input
            className={inputClassName}
            onChange={(event) => handleChange("documentNumber", event.target.value)}
            placeholder="Enter document number"
            type="text"
            value={formValue.documentNumber}
          />
          {validationMessages.documentNumber ? (
            <p className={validationClassName}>
              {validationMessages.documentNumber}
            </p>
          ) : null}
        </label>
        <label className="block">
          <span className={fieldLabelClassName}>Description</span>
          <textarea
            className={textareaClassName}
            onChange={(event) => handleChange("description", event.target.value)}
            placeholder="Enter document description"
            value={formValue.description}
          />
          {validationMessages.description ? (
            <p className={validationClassName}>{validationMessages.description}</p>
          ) : null}
        </label>
        <div>
          <p className={fieldLabelClassName}>Drawing</p>
          <p className="mt-2 rounded-md border border-[#123A5A] bg-[#031528] px-3 py-2 text-sm font-semibold text-[#F8FAFC]">
            {drawing}
          </p>
        </div>
        <label className="block">
          <span className={fieldLabelClassName}>Area</span>
          <input
            className={inputClassName}
            onChange={(event) => handleChange("area", event.target.value)}
            placeholder="Enter area"
            type="text"
            value={formValue.area}
          />
          {validationMessages.area ? (
            <p className={validationClassName}>{validationMessages.area}</p>
          ) : null}
        </label>
        <label className="block">
          <span className={fieldLabelClassName}>Day Times For Review</span>
          <input
            className={inputClassName}
            min={0}
            onChange={(event) =>
              handleChange("daysUntilValidation", event.target.value)
            }
            type="number"
            value={formValue.daysUntilValidation}
          />
          {validationMessages.daysUntilValidation ? (
            <p className={validationClassName}>
              {validationMessages.daysUntilValidation}
            </p>
          ) : null}
        </label>
      </div>
    </DocumentActionModal>
  );
};

export const EditDocumentModal = ({
  allowUploadRevision = false,
  documentItem,
  onCancel,
  onSubmit,
  onValidationFailed = () => {},
}) => {
  const isUploadRevision = allowUploadRevision && [
    DOCUMENT_STATUS.PROCESS_COMMENT,
    DOCUMENT_STATUS.PROCESS_REJECT,
    DOCUMENT_STATUS.PROJECT_COMMENT,
    DOCUMENT_STATUS.PROJECT_REJECT,
  ].includes(documentItem.status);
  const [formValue, setFormValue] = useState({
    area: documentItem.area,
    daysUntilValidation: documentItem.daysUntilValidation,
    description: documentItem.description,
  });
  const [selectedFile, setSelectedFile] = useState(null);
  const [filePreview, setFilePreview] = useState(null);
  const [fileErrorMessage, setFileErrorMessage] = useState("");
  const [validationMessages, setValidationMessages] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (fieldName, value) => {
    setFormValue((currentValue) => ({
      ...currentValue,
      [fieldName]: value,
    }));
    setValidationMessages((currentMessages) => ({
      ...currentMessages,
      [fieldName]: "",
    }));
  };

  const handleFileSelectionError = (message) => {
    setSelectedFile(null);
    setFilePreview(null);
    setFileErrorMessage(message);
    onValidationFailed(message);
  };

  const handleFileChange = async (file) => {
    try {
      const nextFilePreview = await FileService.getUploadPreview(file);

      setSelectedFile(file);
      setFilePreview(nextFilePreview);
      setFileErrorMessage("");
      setValidationMessages((currentMessages) => ({
        ...currentMessages,
        file: "",
      }));
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Validasi file gagal.";

      handleFileSelectionError(message);
    }
  };

  const handleSubmit = async () => {
    const nextValidationMessages = {};

    if (isUploadRevision && !selectedFile) {
      nextValidationMessages.file = "Upload File wajib diisi untuk revision.";
    }

    if (!formValue.description.trim()) {
      nextValidationMessages.description = "Description wajib diisi.";
    }

    if (!formValue.area.trim()) {
      nextValidationMessages.area = "Area wajib diisi.";
    }

    if (
      formValue.daysUntilValidation === "" ||
      Number.isNaN(Number(formValue.daysUntilValidation))
    ) {
      nextValidationMessages.daysUntilValidation =
        "Days Until Validation wajib diisi.";
    }

    if (Object.keys(nextValidationMessages).length > 0) {
      const message = isUploadRevision
        ? "Lengkapi file revision dan seluruh field wajib sebelum submit."
        : "Lengkapi seluruh field wajib sebelum submit.";

      setValidationMessages(nextValidationMessages);
      setFileErrorMessage(nextValidationMessages.file ?? "");
      onValidationFailed(message);
      return;
    }

    setIsSubmitting(true);
    try {
      await onSubmit({
        ...formValue,
        daysUntilValidation: Number(formValue.daysUntilValidation),
        file: selectedFile,
        isUploadRevision,
      });
    } catch {
      // Keep the entered values available when the service operation fails.
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <DocumentActionModal
      footer={
        <>
          <button className={secondaryButtonClassName} disabled={isSubmitting} onClick={onCancel} type="button">
            Cancel
          </button>
          <button
            className={primaryButtonClassName}
            disabled={isSubmitting}
            onClick={handleSubmit}
            type="button"
          >
            {isSubmitting ? "Updating..." : "Submit"}
          </button>
        </>
      }
      onClose={isSubmitting ? () => {} : onCancel}
      title="Edit Document"
    >
      <div className="space-y-4">
        {isUploadRevision ? (
          <div className="rounded-lg border border-[#FACC15]/40 bg-[#FACC15]/10 p-4 text-sm text-[#FDE68A]">
            Upload Revision will replace the Active File. Backend will determine
            the next workflow status.
          </div>
        ) : null}
        <div
          className={
            isUploadRevision
              ? "grid gap-4 md:grid-cols-2 md:items-start"
              : "block"
          }
        >
          <div>
            <p className={fieldLabelClassName}>Document Number</p>
            <p className="mt-2 min-h-10 rounded-md border border-[#123A5A] bg-[#031528] px-3 py-2 text-sm font-semibold text-[#F8FAFC]">
              {documentItem.documentNumber}
            </p>
          </div>
          {isUploadRevision ? (
            <FileUploadField
              errorMessage={fileErrorMessage || validationMessages.file}
              filePreview={filePreview}
              isDisabled={isSubmitting}
              onFileChange={handleFileChange}
              onFileSelectionError={handleFileSelectionError}
              required
            />
          ) : null}
        </div>
        <label className="block">
          <span className={fieldLabelClassName}>Description</span>
          <textarea
            className={textareaClassName}
            onChange={(event) => handleChange("description", event.target.value)}
            value={formValue.description}
          />
          {validationMessages.description ? (
            <p className={validationClassName}>{validationMessages.description}</p>
          ) : null}
        </label>
        <label className="block">
          <span className={fieldLabelClassName}>Area</span>
          <input
            className={inputClassName}
            onChange={(event) => handleChange("area", event.target.value)}
            type="text"
            value={formValue.area}
          />
          {validationMessages.area ? (
            <p className={validationClassName}>{validationMessages.area}</p>
          ) : null}
        </label>
        <label className="block">
          <span className={fieldLabelClassName}>Day Times For Review</span>
          <input
            className={inputClassName}
            min={0}
            onChange={(event) =>
              handleChange("daysUntilValidation", event.target.value)
            }
            type="number"
            value={formValue.daysUntilValidation}
          />
          {validationMessages.daysUntilValidation ? (
            <p className={validationClassName}>
              {validationMessages.daysUntilValidation}
            </p>
          ) : null}
        </label>
        <div>
          <p className={fieldLabelClassName}>Active File</p>
          <div className="mt-2 rounded-lg border border-[#123A5A] bg-[#031528] p-3 text-sm text-[#CBD5E1]">
            {documentItem.fileMetadata?.originalFileName ?? "-"}
          </div>
        </div>
      </div>
    </DocumentActionModal>
  );
};

export const ArchiveConfirmationModal = ({
  archiveReason = "",
  documentItem,
  onArchive,
  onCancel,
  onReasonChange,
}) => {
  return (
    <DocumentActionModal
      footer={
        <>
          <button className={secondaryButtonClassName} onClick={onCancel} type="button">
            Cancel
          </button>
          <button className={dangerButtonClassName} onClick={onArchive} type="button">
            Archive
          </button>
        </>
      }
      onClose={onCancel}
      title="Archive Document"
    >
      <div className="space-y-4">
        <DocumentSummary documentItem={documentItem} />
        <div className="rounded-lg border border-[#64748B]/40 bg-[#0F172A] p-4 text-sm leading-6 text-[#CBD5E1]">
          <p>This document will be removed from active operations.</p>
          <p className="mt-3 font-semibold text-[#F8FAFC]">Archived documents:</p>
          <ul className="mt-2 list-disc space-y-1 pl-5">
            <li>remain available in Revision History</li>
            <li>remain available in Audit Trail</li>
            <li>can still be viewed</li>
            <li>can still be downloaded</li>
            <li>can be restored later</li>
          </ul>
        </div>
        <label className="block">
          <span className={fieldLabelClassName}>Reason (Optional)</span>
          <textarea
            className={textareaClassName}
            onChange={(event) => onReasonChange(event.target.value)}
            placeholder="Add archive reason..."
            value={archiveReason}
          />
        </label>
      </div>
    </DocumentActionModal>
  );
};

export default DocumentActionModal;
