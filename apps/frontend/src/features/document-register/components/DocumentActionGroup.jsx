import { useEffect, useState } from "react";
import {
  Clock3,
  Download,
  Eye,
  Pencil,
  MessageSquare,
  Archive,
  RotateCcw,
} from "lucide-react";

import { useToast } from "@/shared/components/toast";
import { queryClient } from "@/shared/api/query-client";
import { usePermission } from "@/shared/hooks/usePermission";
import { useProjectContextStore } from "@/shared/stores/project-context.store";

import {
  ACTION_CODE,
  DOCUMENT_LIFECYCLE,
  DOCUMENT_REGISTER_PERMISSION,
  DOCUMENT_STATUS,
  OFFICIAL_ROLE,
} from "../constants/document.constants";
import { DocumentApiService } from "../services/document-api.service";
import { getDocumentActionVisibility } from "../utils/documentActionVisibility";
import {
  ApprovalCommentModal,
  ApprovalConfirmationModal,
  ArchiveConfirmationModal,
  CommentViewerModal,
  EditDocumentModal,
  HistoryModal,
  ViewDocumentModal,
  WorkflowAttachmentViewerModal,
} from "./DocumentActionModal";

const baseIconButtonClassName =
  "inline-flex h-8 w-8 items-center justify-center rounded-md border border-[#123A5A] bg-[#0B1F38] text-[#CBD5E1] transition-colors hover:border-[#0F7BFF] hover:bg-[#0B2B47] hover:text-white";

const reviewButtonStyles = {
  a: "border-[#14532D] bg-[#052E16] text-[#22C55E] hover:border-[#22C55E] hover:bg-[#064E3B]",
  b: "border-[#713F12] bg-[#422006] text-[#FACC15] hover:border-[#FACC15] hover:bg-[#713F12]",
  c: "border-[#7F1D1D] bg-[#450A0A] text-[#EF4444] hover:border-[#EF4444] hover:bg-[#7F1D1D]",
};

const modalType = {
  APPROVAL_A: "approvalA",
  APPROVAL_B: "approvalB",
  APPROVAL_C: "approvalC",
  ARCHIVE: "archive",
  ATTACHMENT_VIEWER: "attachmentViewer",
  COMMENT: "comment",
  EDIT: "edit",
  HISTORY: "history",
  VIEW: "view",
};

const ActionIconButton = ({ icon: Icon, label, onClick, showIndicator = false }) => {
  return (
    <button
      aria-label={label}
      className={[baseIconButtonClassName, "relative"].join(" ")}
      onClick={onClick}
      title={label}
      type="button"
    >
      <Icon className="h-4 w-4" />
      {showIndicator ? (
        <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full border border-[#061B2F] bg-[#EF4444] px-1 text-[10px] font-bold leading-none text-white">
          !
        </span>
      ) : null}
    </button>
  );
};

const ReviewActionButton = ({ children, label, onClick, tone }) => {
  return (
    <button
      aria-label={label}
      className={[
        "inline-flex h-8 w-8 items-center justify-center rounded-md border text-xs font-bold transition-colors",
        reviewButtonStyles[tone],
      ].join(" ")}
      onClick={onClick}
      title={label}
      type="button"
    >
      {children}
    </button>
  );
};

export const DocumentActionGroup = ({
  actionMode = "workflow",
  documentItem,
  isDashboard = false,
  onWorkflowComplete = () => {},
}) => {
  const { showToast } = useToast();
  const { hasProjectPermission } = usePermission();
  const [activeModal, setActiveModal] = useState(null);
  const [attachmentErrors, setAttachmentErrors] = useState({});
  const [attachmentViewerFile, setAttachmentViewerFile] = useState(null);
  const [comments, setComments] = useState([]);
  const [detailDocument, setDetailDocument] = useState(documentItem);
  const [documentFile, setDocumentFile] = useState(null);
  const [hasUnreadComments, setHasUnreadComments] = useState(false);
  const [timeline, setTimeline] = useState([]);
  const [workflowAttachmentFile, setWorkflowAttachmentFile] = useState(null);
  const [workflowAttachmentPreview, setWorkflowAttachmentPreview] = useState(null);
  const [workflowAttachmentErrorMessage, setWorkflowAttachmentErrorMessage] = useState("");
  const [archiveReason, setArchiveReason] = useState("");
  const [workflowComment, setWorkflowComment] = useState("");
  const [selectedWorkflowAttachment, setSelectedWorkflowAttachment] = useState(null);
  const [validationMessage, setValidationMessage] = useState("");

  const activeMembership = useProjectContextStore((state) => state.activeMembership);
  const projectRoleName = activeMembership?.officialRole;
  const isArchivedDocument = documentItem?.lifecycle === DOCUMENT_LIFECYCLE.ARCHIVED;
  const defaultVisibility = getDocumentActionVisibility({
    hasPermission: hasProjectPermission,
    roleName: projectRoleName,
    status: documentItem?.status,
  });
  const isReadOnlyActionMode = actionMode === "readOnly";
  const visibility = isReadOnlyActionMode
    ? {
        topActions: [
          ACTION_CODE.VIEW,
          ACTION_CODE.DOWNLOAD,
          ACTION_CODE.COMMENT,
        ].filter((actionCode) =>
          hasProjectPermission(
            actionCode === ACTION_CODE.DOWNLOAD
              ? DOCUMENT_REGISTER_PERMISSION.DOWNLOAD
              : DOCUMENT_REGISTER_PERMISSION.VIEW,
          ),
        ),
        workflowActions: [],
        showHistory: false,
      }
    : isArchivedDocument
      ? {
          topActions: [
            ACTION_CODE.VIEW,
            ACTION_CODE.DOWNLOAD,
          ].filter((actionCode) =>
            hasProjectPermission(
              actionCode === ACTION_CODE.DOWNLOAD
                ? DOCUMENT_REGISTER_PERMISSION.DOWNLOAD
                : DOCUMENT_REGISTER_PERMISSION.VIEW,
            ),
          ),
          workflowActions: [],
          showHistory: false,
      }
    : defaultVisibility;
  const workflowVisibility = visibility;
  const canEditDocument = hasProjectPermission(DOCUMENT_REGISTER_PERMISSION.EDIT);
  const canArchiveDocument =
    !isDashboard &&
    !isArchivedDocument &&
    documentItem?.status === DOCUMENT_STATUS.APPROVED &&
    projectRoleName === OFFICIAL_ROLE.ADMIN &&
    hasProjectPermission(DOCUMENT_REGISTER_PERMISSION.ARCHIVE);
  const canRestoreDocument =
    !isDashboard &&
    isArchivedDocument &&
    projectRoleName === OFFICIAL_ROLE.ADMIN &&
    hasProjectPermission(DOCUMENT_REGISTER_PERMISSION.ARCHIVE);

  useEffect(() => {
    return () => {
      if (documentFile?.objectUrl) {
        window.URL.revokeObjectURL(documentFile.objectUrl);
      }
      if (attachmentViewerFile?.objectUrl) {
        window.URL.revokeObjectURL(attachmentViewerFile.objectUrl);
      }
    };
  }, [attachmentViewerFile, documentFile]);

  const closeModal = () => {
    if (documentFile?.objectUrl) {
      window.URL.revokeObjectURL(documentFile.objectUrl);
    }
    if (attachmentViewerFile?.objectUrl) {
      window.URL.revokeObjectURL(attachmentViewerFile.objectUrl);
    }

    setActiveModal(null);
    setAttachmentErrors({});
    setAttachmentViewerFile(null);
    setComments([]);
    setDocumentFile(null);
    setTimeline([]);
    setWorkflowAttachmentFile(null);
    setWorkflowAttachmentPreview(null);
    setWorkflowAttachmentErrorMessage("");
    setArchiveReason("");
    setWorkflowComment("");
    setSelectedWorkflowAttachment(null);
    setValidationMessage("");
  };

  const openViewDocument = async () => {
    try {
      const documentDetail = await DocumentApiService.getDocumentById(documentItem.id);
      const activeDocumentFile = await DocumentApiService.getDocumentPreview(documentDetail);
      const objectUrl = window.URL.createObjectURL(activeDocumentFile.file);

      setDetailDocument(documentDetail);
      setDocumentFile({
        ...activeDocumentFile,
        objectUrl,
      });
      setActiveModal(modalType.VIEW);
    } catch (error) {
      showToast({
        message:
          error instanceof Error ? error.message : "View Document failed.",
        variant: "error",
      });
      setDocumentFile({
        error: error instanceof Error ? error.message : "View Document failed.",
      });
      setActiveModal(modalType.VIEW);
    }
  };

  const openEditDocument = async () => {
    try {
      const documentDetail = await DocumentApiService.getDocumentById(documentItem.id);
      setDetailDocument(documentDetail);
      setActiveModal(modalType.EDIT);
    } catch (error) {
      showToast({
        message:
          error instanceof Error ? error.message : "Detail Document gagal dimuat.",
        variant: "error",
      });
    }
  };

  const openCommentViewer = async () => {
    try {
      const documentComments =
        await DocumentApiService.getWorkflowComments(documentItem.id);

      setHasUnreadComments(false);
      setComments(documentComments);
      setAttachmentErrors({});
      setActiveModal(modalType.COMMENT);
    } catch (error) {
      showToast({
        message:
          error instanceof Error
            ? error.message
            : "Workflow Comment gagal dimuat.",
        variant: "error",
      });
    }
  };

  const closeAttachmentViewer = () => {
    if (attachmentViewerFile?.objectUrl) {
      window.URL.revokeObjectURL(attachmentViewerFile.objectUrl);
    }

    setAttachmentViewerFile(null);
    setSelectedWorkflowAttachment(null);
    setActiveModal(modalType.COMMENT);
  };

  const setAttachmentError = (commentId, message) => {
    setAttachmentErrors((currentErrors) => ({
      ...currentErrors,
      [commentId]: message,
    }));
  };

  const clearAttachmentError = (commentId) => {
    setAttachmentErrors((currentErrors) => {
      const nextErrors = { ...currentErrors };
      delete nextErrors[commentId];
      return nextErrors;
    });
  };

  const openAttachmentViewer = async (comment) => {
    const attachment = comment?.attachment ?? null;

    if (!attachment) {
      return;
    }

    if (attachmentViewerFile?.objectUrl) {
      window.URL.revokeObjectURL(attachmentViewerFile.objectUrl);
    }

    setSelectedWorkflowAttachment({ commentId: comment.id, attachment });
    clearAttachmentError(comment.id);

    try {
      const attachmentPreview =
        await DocumentApiService.getWorkflowAttachmentPreview({
          attachment,
          documentId: documentItem.id,
        });
      const objectUrl = window.URL.createObjectURL(attachmentPreview.file);

      setAttachmentViewerFile({
        ...attachmentPreview,
        objectUrl,
      });
      setActiveModal(modalType.ATTACHMENT_VIEWER);
    } catch (error) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : "Workflow Attachment gagal dimuat.";

      setAttachmentError(comment.id, errorMessage);
      setAttachmentViewerFile({
        error: errorMessage,
        metadata: attachment,
      });
      setActiveModal(modalType.ATTACHMENT_VIEWER);
      showToast({
        message: errorMessage,
        variant: "error",
      });
    }
  };

  const downloadWorkflowAttachment = async (comment) => {
    const attachment = comment?.attachment ?? null;

    if (!attachment) {
      return;
    }

    try {
      await DocumentApiService.downloadWorkflowAttachment({
        attachment,
        documentId: documentItem.id,
      });
      clearAttachmentError(comment.id);
      showToast({
        message: "Workflow Attachment downloaded.",
        variant: "success",
      });
    } catch (error) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : "Workflow Attachment gagal diunduh.";

      setAttachmentError(comment.id, errorMessage);
      showToast({
        message: errorMessage,
        variant: "error",
      });
    }
  };

  const retryAttachmentViewer = () => {
    if (!selectedWorkflowAttachment) {
      return;
    }

    openAttachmentViewer({
      attachment: selectedWorkflowAttachment.attachment,
      id: selectedWorkflowAttachment.commentId,
    });
  };

  const downloadSelectedWorkflowAttachment = () => {
    if (!selectedWorkflowAttachment) {
      return;
    }

    downloadWorkflowAttachment({
      attachment: selectedWorkflowAttachment.attachment,
      id: selectedWorkflowAttachment.commentId,
    });
  };

  const openHistory = async () => {
    try {
      const [documentHistory, revisionHistory] = await Promise.all([
        DocumentApiService.getDocumentHistory(documentItem.id),
        DocumentApiService.getDocumentRevisions(documentItem.id),
      ]);
      const revisionTimeline = revisionHistory.map((revisionItem) => ({
        id: `revision-${revisionItem.id}`,
        activity: "Revision",
        createdBy: revisionItem.uploader,
        createdDate: revisionItem.uploadedAt,
        revision: revisionItem.revision,
        status: revisionItem.resultStatus,
        workflowEvent: revisionItem.isActive
          ? "Active Revision"
          : "Previous Revision",
      }));

      setTimeline([...documentHistory, ...revisionTimeline]);
      setActiveModal(modalType.HISTORY);
    } catch (error) {
      showToast({
        message:
          error instanceof Error ? error.message : "History Document gagal dimuat.",
        variant: "error",
      });
    }
  };

  const openWorkflowModal = (nextModalType) => {
    setWorkflowAttachmentFile(null);
    setWorkflowAttachmentPreview(null);
    setWorkflowAttachmentErrorMessage("");
    setWorkflowComment("");
    setValidationMessage("");
    setActiveModal(nextModalType);
  };

  const handleWorkflowAttachmentChange = ({
    errorMessage = "",
    file = null,
    preview = null,
  } = {}) => {
    setWorkflowAttachmentFile(file);
    setWorkflowAttachmentPreview(preview);
    setWorkflowAttachmentErrorMessage(errorMessage);
    setValidationMessage("");
  };

  const removeWorkflowAttachment = () => {
    setWorkflowAttachmentFile(null);
    setWorkflowAttachmentPreview(null);
    setWorkflowAttachmentErrorMessage("");
    setValidationMessage("");
  };

  const downloadDocument = async () => {
    try {
      await DocumentApiService.downloadDocumentFile(documentItem);

      showToast({
        message: "Download Document berhasil.",
        variant: "success",
      });
    } catch (error) {
      showToast({
        message:
          error instanceof Error ? error.message : "Download Document failed.",
        variant: "error",
      });
    }
  };

  const submitEditDocument = async (formValue) => {
    try {
      if (formValue.isUploadRevision) {
        await DocumentApiService.uploadRevision(documentItem.id, formValue.file);

        closeModal();
        await queryClient.invalidateQueries({ queryKey: ["documents"] });
        onWorkflowComplete();
        showToast({
          message: "Upload Revision berhasil.",
          variant: "success",
        });
        return;
      }

      await DocumentApiService.updateDocument(documentItem.id, {
        area: formValue.area,
        daysUntilValidation: formValue.daysUntilValidation,
        description: formValue.description,
      });

      closeModal();
      await queryClient.invalidateQueries({ queryKey: ["documents"] });
      onWorkflowComplete();
      showToast({
        message: "Edit Document berhasil.",
        variant: "success",
      });
    } catch (error) {
      showToast({
        message:
          error instanceof Error ? error.message : "Edit Document gagal.",
        variant: "error",
      });
      throw error;
    }
  };

  const submitArchiveDocument = async () => {
    try {
      await DocumentApiService.archiveDocument(documentItem.id, {
        reason: archiveReason,
      });

      closeModal();
      await queryClient.invalidateQueries({ queryKey: ["documents"] });
      onWorkflowComplete();
      showToast({
        message: "Document berhasil diarsipkan.",
        variant: "success",
      });
    } catch (error) {
      showToast({
        message: error instanceof Error ? error.message : "Archive Document failed.",
        variant: "error",
      });
    }
  };

  const submitRestoreDocument = async () => {
    try {
      await DocumentApiService.restoreDocument(documentItem.id);

      closeModal();
      await queryClient.invalidateQueries({ queryKey: ["documents"] });
      onWorkflowComplete();
      showToast({
        message: "Document berhasil direstore.",
        variant: "success",
      });
    } catch (error) {
      showToast({
        message: error instanceof Error ? error.message : "Restore Document failed.",
        variant: "error",
      });
    }
  };

  const executeWorkflowAction = async (
    workflowAction,
    comment = "",
    attachmentFile = null,
  ) => {
    try {
      if (workflowAction === ACTION_CODE.APPROVAL_A) {
        await DocumentApiService.approveDocument(documentItem.id);
      } else if (workflowAction === ACTION_CODE.APPROVAL_B) {
        await DocumentApiService.submitApprovalWithComment(documentItem.id, {
          attachmentFile,
          comment,
        });
      } else if (workflowAction === ACTION_CODE.APPROVAL_C) {
        await DocumentApiService.rejectDocument(documentItem.id, {
          attachmentFile,
          comment,
        });
      }

      closeModal();
      await queryClient.invalidateQueries({ queryKey: ["documents"] });
      onWorkflowComplete();
      showToast({
        message: `${workflowAction} berhasil diproses.`,
        variant: "success",
      });
    } catch (error) {
      const nextMessage =
        error instanceof Error ? error.message : `${workflowAction} gagal diproses.`;

      setValidationMessage(nextMessage);
      showToast({
        message: nextMessage,
        variant: "error",
      });
    }
  };

  const submitApprovalB = () => {
    if (!workflowComment.trim()) {
      setValidationMessage("Workflow Comment wajib diisi.");
      return;
    }

    executeWorkflowAction(
      ACTION_CODE.APPROVAL_B,
      workflowComment,
      workflowAttachmentFile,
    );
  };

  return (
    <>
      <div className="flex w-max flex-col gap-2">
        <div className="flex flex-wrap gap-2">
          {workflowVisibility.topActions.includes(ACTION_CODE.VIEW) ? (
            <ActionIconButton
              icon={Eye}
              label="View Document"
              onClick={openViewDocument}
            />
          ) : null}
          {!isReadOnlyActionMode && !isArchivedDocument && canEditDocument ? (
            <ActionIconButton
              icon={Pencil}
              label="Edit Document"
              onClick={openEditDocument}
            />
          ) : null}
          {workflowVisibility.topActions.includes(ACTION_CODE.DOWNLOAD) ? (
            <ActionIconButton
              icon={Download}
              label="Download Document"
              onClick={downloadDocument}
            />
          ) : null}
          {workflowVisibility.topActions.includes(ACTION_CODE.COMMENT) ? (
            <ActionIconButton
              icon={MessageSquare}
              label="View Comments"
              onClick={openCommentViewer}
              showIndicator={hasUnreadComments}
            />
          ) : null}
          {!isReadOnlyActionMode && canArchiveDocument ? (
            <ActionIconButton
              icon={Archive}
              label="Archive Document"
              onClick={() => setActiveModal(modalType.ARCHIVE)}
            />
          ) : null}
          {!isReadOnlyActionMode && canRestoreDocument ? (
            <ActionIconButton
              icon={RotateCcw}
              label="Restore Document"
              onClick={submitRestoreDocument}
            />
          ) : null}
        </div>

        {isReadOnlyActionMode ? null : workflowVisibility.showHistory ? (
          <button
            className="inline-flex h-8 w-full items-center justify-center gap-1.5 rounded-md border border-[#6D3FD6]/60 bg-[#3B0764] px-3 text-xs font-semibold text-white transition-colors hover:border-[#A78BFA] hover:bg-[#581C87]"
            onClick={openHistory}
            title="View History"
            type="button"
          >
            <Clock3 className="h-3.5 w-3.5" />
            <span>History</span>
          </button>
        ) : (
          <div className="grid grid-cols-3 gap-2">
            {workflowVisibility.workflowActions.includes(ACTION_CODE.APPROVAL_A) ? (
              <ReviewActionButton
                label="Approved"
                onClick={() => openWorkflowModal(modalType.APPROVAL_A)}
                tone="a"
              >
                A
              </ReviewActionButton>
            ) : null}
            {workflowVisibility.workflowActions.includes(ACTION_CODE.APPROVAL_B) ? (
              <ReviewActionButton
                label="Approved with Comment"
                onClick={() => openWorkflowModal(modalType.APPROVAL_B)}
                tone="b"
              >
                B
              </ReviewActionButton>
            ) : null}
            {workflowVisibility.workflowActions.includes(ACTION_CODE.APPROVAL_C) ? (
              <ReviewActionButton
                label="Not Approved"
                onClick={() => openWorkflowModal(modalType.APPROVAL_C)}
                tone="c"
              >
                C
              </ReviewActionButton>
            ) : null}
          </div>
        )}
      </div>

      {activeModal === modalType.VIEW ? (
        <ViewDocumentModal
          documentFile={documentFile}
          documentItem={detailDocument}
          onClose={closeModal}
          onDownload={downloadDocument}
        />
      ) : null}
      {activeModal === modalType.COMMENT ? (
        <CommentViewerModal
          attachmentErrors={attachmentErrors}
          comments={comments}
          documentItem={documentItem}
          onAttachmentDownload={downloadWorkflowAttachment}
          onAttachmentView={openAttachmentViewer}
          onClose={closeModal}
        />
      ) : null}
      {activeModal === modalType.ATTACHMENT_VIEWER ? (
        <WorkflowAttachmentViewerModal
          attachment={selectedWorkflowAttachment?.attachment}
          attachmentFile={attachmentViewerFile}
          onClose={closeAttachmentViewer}
          onDownload={downloadSelectedWorkflowAttachment}
          onRetry={retryAttachmentViewer}
        />
      ) : null}
      {activeModal === modalType.EDIT ? (
        <EditDocumentModal
          documentItem={detailDocument}
          onCancel={closeModal}
          onValidationFailed={(message) =>
            showToast({
              message,
              variant: "warning",
            })
          }
          onSubmit={submitEditDocument}
          allowUploadRevision
        />
      ) : null}
      {activeModal === modalType.ARCHIVE ? (
        <ArchiveConfirmationModal
          archiveReason={archiveReason}
          documentItem={documentItem}
          onCancel={closeModal}
          onReasonChange={setArchiveReason}
          onArchive={submitArchiveDocument}
        />
      ) : null}
      {activeModal === modalType.HISTORY ? (
        <HistoryModal
          documentItem={documentItem}
          onClose={closeModal}
          timeline={timeline}
        />
      ) : null}
      {activeModal === modalType.APPROVAL_A ? (
        <ApprovalConfirmationModal
          actionSummary="Approval A will continue the document to the next workflow status."
          confirmLabel="Confirm"
          documentItem={documentItem}
          message="Are you sure you want to approve this document?"
          onCancel={closeModal}
          onConfirm={() => executeWorkflowAction(ACTION_CODE.APPROVAL_A)}
        />
      ) : null}
      {activeModal === modalType.APPROVAL_B ? (
        <ApprovalCommentModal
          actionSummary="Approval B will return the document with comment according to the workflow."
          attachmentErrorMessage={workflowAttachmentErrorMessage}
          attachmentPreview={workflowAttachmentPreview}
          comment={workflowComment}
          documentItem={documentItem}
          errorMessage={validationMessage}
          onAttachmentChange={handleWorkflowAttachmentChange}
          onAttachmentRemove={removeWorkflowAttachment}
          onCancel={closeModal}
          onCommentChange={(nextComment) => {
            setWorkflowComment(nextComment);
            setValidationMessage("");
          }}
          onSubmit={submitApprovalB}
          isCommentRequired
          submitLabel="Submit"
          title="Approved with Comment"
        />
      ) : null}
      {activeModal === modalType.APPROVAL_C ? (
        <ApprovalCommentModal
          actionSummary="Approval C will mark the document as not approved according to the workflow."
          attachmentErrorMessage={workflowAttachmentErrorMessage}
          attachmentPreview={workflowAttachmentPreview}
          comment={workflowComment}
          documentItem={documentItem}
          errorMessage={validationMessage}
          isDanger
          onAttachmentChange={handleWorkflowAttachmentChange}
          onAttachmentRemove={removeWorkflowAttachment}
          onCancel={closeModal}
          onCommentChange={(nextComment) => {
            setWorkflowComment(nextComment);
            setValidationMessage("");
          }}
          onSubmit={() =>
            executeWorkflowAction(
              ACTION_CODE.APPROVAL_C,
              workflowComment,
              workflowAttachmentFile,
            )
          }
          submitLabel="Submit"
          title="Not Approved"
        />
      ) : null}
    </>
  );
};

export default DocumentActionGroup;
