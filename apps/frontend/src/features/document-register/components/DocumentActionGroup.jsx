import { useCallback, useEffect, useRef, useState } from "react";
import {
  Clock3,
  Download,
  Eye,
  Loader2,
  Pencil,
  MessageSquare,
  Archive,
  RotateCcw,
} from "lucide-react";

import { AuthService } from "@/features/auth/services/auth.service";
import { useToast } from "@/shared/components/toast";
import { queryClient } from "@/shared/api/query-client";
import { usePermission } from "@/shared/hooks/usePermission";
import { useRealtimeEvent, useRealtimeRecovery } from "@/shared/realtime";
import { useProjectContextStore } from "@/shared/stores/project-context.store";

import {
  ACTION_CODE,
  DOCUMENT_LIFECYCLE,
  DOCUMENT_REGISTER_PERMISSION,
  DOCUMENT_STATUS,
  OFFICIAL_ROLE,
} from "../constants/document.constants";
import { DocumentApiService } from "../services/document-api.service";
import {
  COMMENT_VIEWER_UPDATED_NOTICE,
  isCommentActorSelfEvent,
  isCommentViewerRealtimeEvent,
} from "../utils/commentRealtimeSync";
import { getDocumentActionVisibility } from "../utils/documentActionVisibility";
import { synchronizeDocumentRuntimeQueries } from "../utils/documentRuntimeQuerySync";
import { createRealtimeRefetchCoalescer } from "../utils/realtimeRefetchCoalescer";
import {
  isActorSelfEvent,
  isRelevantWorkflowDetailEvent,
  shouldCloseWorkflowActionModal,
  shouldRefreshWorkflowDocumentViewer,
  WORKFLOW_DETAIL_STALE_NOTICE,
} from "../utils/workflowRealtimeSync";
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

const actionLoadingType = {
  APPROVAL_A: "approvalA",
  APPROVAL_B: "approvalB",
  APPROVAL_C: "approvalC",
  ARCHIVE: "archive",
  COMMENT: "comment",
  DOWNLOAD: "download",
  EDIT: "edit",
  HISTORY: "history",
  RESTORE: "restore",
  VIEW: "view",
};

const createExpectedWorkflowState = (document = {}) => ({
  activeRevisionId: document.activeRevisionId ?? null,
  currentAssigneeUserId: document.currentAssigneeUserId ?? null,
  workflowStatus: document.workflowStatus ?? document.status ?? null,
});

const isWorkflowConflictError = (error) =>
  error?.status === 409 &&
  ["WORKFLOW_CONFLICT", "REVISION_CONFLICT"].includes(error?.code);

const ActionButtonSpinner = ({ className = "h-4 w-4" }) => (
  <Loader2
    aria-hidden="true"
    className={["animate-spin", className].join(" ")}
  />
);

const ActionIconButton = ({
  disabled = false,
  icon: Icon,
  isLoading = false,
  label,
  onClick,
  showIndicator = false,
}) => {
  return (
    <button
      aria-label={label}
      className={[baseIconButtonClassName, "relative"].join(" ")}
      disabled={disabled}
      onClick={onClick}
      title={label}
      type="button"
    >
      {isLoading ? <ActionButtonSpinner /> : <Icon className="h-4 w-4" />}
      {showIndicator ? (
        <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full border border-[#061B2F] bg-[#EF4444] px-1 text-[10px] font-bold leading-none text-white">
          !
        </span>
      ) : null}
    </button>
  );
};

const ReviewActionButton = ({
  children,
  disabled = false,
  isLoading = false,
  label,
  onClick,
  tone,
}) => {
  return (
    <button
      aria-label={label}
      className={[
        "inline-flex h-8 w-8 items-center justify-center rounded-md border text-xs font-bold transition-colors",
        reviewButtonStyles[tone],
      ].join(" ")}
      disabled={disabled}
      onClick={onClick}
      title={label}
      type="button"
    >
      {isLoading ? <ActionButtonSpinner className="h-3.5 w-3.5" /> : children}
    </button>
  );
};

export const DocumentActionGroup = ({
  actionMode = "workflow",
  activeAction: controlledActiveAction = undefined,
  documentItem,
  isDashboard = false,
  onActiveActionChange = undefined,
  onWorkflowComplete = () => {},
}) => {
  const { showToast } = useToast();
  const { hasProjectPermission } = usePermission();
  const [activeModal, setActiveModal] = useState(null);
  const [localActiveAction, setLocalActiveAction] = useState(null);
  const [attachmentErrors, setAttachmentErrors] = useState({});
  const [attachmentViewerFile, setAttachmentViewerFile] = useState(null);
  const [comments, setComments] = useState([]);
  const [detailDocument, setDetailDocument] = useState(documentItem);
  const [documentFile, setDocumentFile] = useState(null);
  const [localReadState, setLocalReadState] = useState({
    documentId: null,
    unreadCommentCount: 0,
  });
  const [timeline, setTimeline] = useState([]);
  const [workflowAttachmentFile, setWorkflowAttachmentFile] = useState(null);
  const [workflowAttachmentPreview, setWorkflowAttachmentPreview] = useState(null);
  const [workflowAttachmentErrorMessage, setWorkflowAttachmentErrorMessage] = useState("");
  const [archiveReason, setArchiveReason] = useState("");
  const [workflowComment, setWorkflowComment] = useState("");
  const [selectedWorkflowAttachment, setSelectedWorkflowAttachment] = useState(null);
  const [validationMessage, setValidationMessage] = useState("");
  const [workflowExpectedState, setWorkflowExpectedState] = useState(
    createExpectedWorkflowState(documentItem),
  );
  const activeModalRef = useRef(activeModal);
  const isControlledActionLock = controlledActiveAction !== undefined &&
    typeof onActiveActionChange === "function";
  const activeAction = isControlledActionLock
    ? controlledActiveAction
    : localActiveAction;
  const activeActionRef = useRef(activeAction);
  const commentRefetchCoalescerRef = useRef(null);
  const detailRefetchCoalescerRef = useRef(null);

  const activeMembership = useProjectContextStore((state) => state.activeMembership);
  const activeProjectId = useProjectContextStore((state) => state.activeProject?.id);
  const projectRoleName = activeMembership?.officialRole;
  const currentUserId = AuthService.getCurrentUser()?.id ?? null;
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
  const hasUnreadComments = Boolean(documentItem?.hasUnreadComments) &&
    !(
      localReadState.documentId === documentItem?.id &&
      localReadState.unreadCommentCount === Number(documentItem?.unreadCommentCount ?? 0)
    );
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
  const currentActiveAction =
    activeAction?.documentId === documentItem.id &&
    String(activeAction?.projectId ?? "") === String(activeProjectId ?? "")
      ? activeAction.type
      : null;
  const isActionLocked = Boolean(currentActiveAction);

  const setActiveActionState = useCallback((nextAction) => {
    activeActionRef.current = nextAction;
    if (isControlledActionLock) {
      onActiveActionChange(nextAction);
      return;
    }

    setLocalActiveAction(nextAction);
  }, [isControlledActionLock, onActiveActionChange]);

  const runAction = useCallback(async (actionType, handler) => {
    const activeActionSnapshot = activeActionRef.current;

    if (
      activeActionSnapshot?.documentId === documentItem.id &&
      String(activeActionSnapshot?.projectId ?? "") === String(activeProjectId ?? "")
    ) {
      return;
    }

    const nextAction = {
      documentId: documentItem.id,
      projectId: activeProjectId,
      type: actionType,
    };

    setActiveActionState(nextAction);

    try {
      await handler();
    } finally {
      const latestAction = activeActionRef.current;
      if (
        latestAction?.documentId === nextAction.documentId &&
        String(latestAction?.projectId ?? "") === String(nextAction.projectId ?? "") &&
        latestAction?.type === nextAction.type
      ) {
        setActiveActionState(null);
      }
    }
  }, [activeProjectId, documentItem.id, setActiveActionState]);

  useEffect(() => {
    activeActionRef.current = activeAction;
  }, [activeAction]);

  useEffect(() => {
    return () => {
      activeActionRef.current = null;
      if (documentFile?.objectUrl) {
        window.URL.revokeObjectURL(documentFile.objectUrl);
      }
      if (attachmentViewerFile?.objectUrl) {
        window.URL.revokeObjectURL(attachmentViewerFile.objectUrl);
      }
    };
  }, [attachmentViewerFile, documentFile]);

  const setActiveModalState = useCallback((nextModal) => {
    activeModalRef.current = nextModal;
    setActiveModal(nextModal);
  }, []);

  const closeModal = useCallback(() => {
    if (documentFile?.objectUrl) {
      window.URL.revokeObjectURL(documentFile.objectUrl);
    }
    if (attachmentViewerFile?.objectUrl) {
      window.URL.revokeObjectURL(attachmentViewerFile.objectUrl);
    }

    setActiveModalState(null);
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
    setWorkflowExpectedState(createExpectedWorkflowState(documentItem));
    setSelectedWorkflowAttachment(null);
    setValidationMessage("");
  }, [attachmentViewerFile, documentFile, documentItem, setActiveModalState]);

  useEffect(() => {
    activeModalRef.current = activeModal;
  }, [activeModal]);

  const refetchWorkflowDetail = useCallback(async ({
    event = null,
    forceStale = false,
    showNotice = true,
  } = {}) => {
    const activeModalSnapshot = activeModalRef.current;
    const isSelfEvent = isActorSelfEvent({ currentUserId, event });
    const shouldCloseModal =
      forceStale ||
      (shouldCloseWorkflowActionModal(activeModalSnapshot) && !isSelfEvent);

    if (shouldCloseModal) {
      closeModal();
    }

    await synchronizeDocumentRuntimeQueries({
      refreshCurrentSurface: onWorkflowComplete,
    });

    try {
      const latestDocument = await DocumentApiService.getDocumentById(documentItem.id);
      setDetailDocument(latestDocument);
      setWorkflowExpectedState(createExpectedWorkflowState(latestDocument));

      if (
        shouldRefreshWorkflowDocumentViewer(activeModalSnapshot) &&
        !shouldCloseModal
      ) {
        const latestDocumentFile =
          await DocumentApiService.getDocumentPreview(latestDocument);
        const nextObjectUrl = window.URL.createObjectURL(latestDocumentFile.file);

        setDocumentFile((currentDocumentFile) => {
          if (currentDocumentFile?.objectUrl) {
            window.URL.revokeObjectURL(currentDocumentFile.objectUrl);
          }

          return {
            ...latestDocumentFile,
            objectUrl: nextObjectUrl,
          };
        });
      }
    } catch {
      // Existing register/dashboard refetch remains the recovery source if detail fetch fails.
    }

    if (shouldCloseModal && showNotice && !isSelfEvent) {
      showToast({
        message: WORKFLOW_DETAIL_STALE_NOTICE,
        variant: "warning",
      });
    }
  }, [closeModal, currentUserId, documentItem.id, onWorkflowComplete, showToast]);

  useEffect(() => {
    detailRefetchCoalescerRef.current = createRealtimeRefetchCoalescer({
      delayMs: 500,
      onFlush: refetchWorkflowDetail,
    });

    return () => {
      detailRefetchCoalescerRef.current?.cancel();
      detailRefetchCoalescerRef.current = null;
    };
  }, [refetchWorkflowDetail]);

  useEffect(() => {
    detailRefetchCoalescerRef.current?.cancel();
  }, [activeProjectId, documentItem.id]);

  const handleWorkflowDetailRealtimeEvent = useCallback(
    (event) => {
      if (!isRelevantWorkflowDetailEvent({
        activeProjectId,
        documentId: documentItem.id,
        event,
      })) {
        return;
      }

      detailRefetchCoalescerRef.current?.schedule({ event });
    },
    [activeProjectId, documentItem.id],
  );

  const handleWorkflowDetailRecovery = useCallback(
    (context) => {
      if (String(context.projectId ?? "") !== String(activeProjectId ?? "")) return;

      detailRefetchCoalescerRef.current?.schedule({
        forceStale: Boolean(activeModalRef.current),
        showNotice: Boolean(activeModalRef.current),
      });
    },
    [activeProjectId],
  );

  useRealtimeEvent(handleWorkflowDetailRealtimeEvent);
  useRealtimeRecovery(handleWorkflowDetailRecovery);

  const refetchCommentViewer = useCallback(async ({
    event = null,
    showNotice = true,
  } = {}) => {
    if (activeModalRef.current !== modalType.COMMENT) return;

    const nextComments = await DocumentApiService.getWorkflowComments(documentItem.id);
    setComments(nextComments);

    await DocumentApiService.markWorkflowCommentsRead(documentItem.id);
    setLocalReadState({
      documentId: documentItem.id,
      unreadCommentCount: Number(documentItem?.unreadCommentCount ?? 0),
    });
    await queryClient.invalidateQueries({ queryKey: ["documents"] });

    if (
      showNotice &&
      !isCommentActorSelfEvent({ currentUserId, event })
    ) {
      showToast({
        message: COMMENT_VIEWER_UPDATED_NOTICE,
        variant: "warning",
      });
    }
  }, [currentUserId, documentItem.id, documentItem.unreadCommentCount, showToast]);

  useEffect(() => {
    commentRefetchCoalescerRef.current = createRealtimeRefetchCoalescer({
      delayMs: 500,
      onFlush: refetchCommentViewer,
    });

    return () => {
      commentRefetchCoalescerRef.current?.cancel();
      commentRefetchCoalescerRef.current = null;
    };
  }, [refetchCommentViewer]);

  useEffect(() => {
    commentRefetchCoalescerRef.current?.cancel();
  }, [activeProjectId, documentItem.id]);

  const handleCommentRealtimeEvent = useCallback(
    (event) => {
      if (activeModalRef.current !== modalType.COMMENT) return;
      if (!isCommentViewerRealtimeEvent({
        activeProjectId,
        documentId: documentItem.id,
        event,
      })) {
        return;
      }

      commentRefetchCoalescerRef.current?.schedule({ event });
    },
    [activeProjectId, documentItem.id],
  );

  const handleCommentRecovery = useCallback(
    (context) => {
      if (activeModalRef.current !== modalType.COMMENT) return;
      if (String(context.projectId ?? "") !== String(activeProjectId ?? "")) return;

      commentRefetchCoalescerRef.current?.schedule({ showNotice: false });
    },
    [activeProjectId],
  );

  useRealtimeEvent(handleCommentRealtimeEvent);
  useRealtimeRecovery(handleCommentRecovery);

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
      setActiveModalState(modalType.VIEW);
    } catch (error) {
      showToast({
        message:
          error instanceof Error ? error.message : "View Document failed.",
        variant: "error",
      });
      setDocumentFile({
        error: error instanceof Error ? error.message : "View Document failed.",
      });
      setActiveModalState(modalType.VIEW);
    }
  };

  const openEditDocument = async () => {
    try {
      const documentDetail = await DocumentApiService.getDocumentById(documentItem.id);
      setDetailDocument(documentDetail);
      setActiveModalState(modalType.EDIT);
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

      setComments(documentComments);
      setAttachmentErrors({});
      setActiveModalState(modalType.COMMENT);
      await DocumentApiService.markWorkflowCommentsRead(documentItem.id);
      setLocalReadState({
        documentId: documentItem.id,
        unreadCommentCount: Number(documentItem?.unreadCommentCount ?? 0),
      });
      await queryClient.invalidateQueries({ queryKey: ["documents"] });
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
    setActiveModalState(modalType.COMMENT);
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
      setActiveModalState(modalType.ATTACHMENT_VIEWER);
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
      setActiveModalState(modalType.ATTACHMENT_VIEWER);
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
      setActiveModalState(modalType.HISTORY);
    } catch (error) {
      showToast({
        message:
          error instanceof Error ? error.message : "History Document gagal dimuat.",
        variant: "error",
      });
    }
  };

  const openWorkflowModal = async (nextModalType) => {
    try {
      const latestDocument = await DocumentApiService.getDocumentById(documentItem.id);
      const latestVisibility = getDocumentActionVisibility({
        hasPermission: hasProjectPermission,
        roleName: projectRoleName,
        status: latestDocument?.status,
      });
      const actionByModalType = {
        [modalType.APPROVAL_A]: ACTION_CODE.APPROVAL_A,
        [modalType.APPROVAL_B]: ACTION_CODE.APPROVAL_B,
        [modalType.APPROVAL_C]: ACTION_CODE.APPROVAL_C,
      };
      const requiredAction = actionByModalType[nextModalType];

      if (
        latestDocument?.lifecycle === DOCUMENT_LIFECYCLE.ARCHIVED ||
        !latestVisibility.workflowActions.includes(requiredAction)
      ) {
        await synchronizeDocumentRuntimeQueries({
          refreshCurrentSurface: onWorkflowComplete,
        });
        showToast({
          message: "Dokumen telah diperbarui. Data terbaru telah dimuat.",
          variant: "warning",
        });
        return;
      }

      setDetailDocument(latestDocument);
      setWorkflowExpectedState(createExpectedWorkflowState(latestDocument));
      setWorkflowAttachmentFile(null);
      setWorkflowAttachmentPreview(null);
      setWorkflowAttachmentErrorMessage("");
      setWorkflowComment("");
      setValidationMessage("");
      setActiveModalState(nextModalType);
    } catch (error) {
      showToast({
        message:
          error instanceof Error ? error.message : "Detail Document gagal dimuat.",
        variant: "error",
      });
    }
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
        await DocumentApiService.uploadRevision(documentItem.id, {
          area: formValue.area,
          daysUntilValidation: formValue.daysUntilValidation,
          description: formValue.description,
          expectedState: createExpectedWorkflowState(detailDocument),
          file: formValue.file,
        });

        closeModal();
        await synchronizeDocumentRuntimeQueries({
          refreshCurrentSurface: onWorkflowComplete,
        });
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
      await synchronizeDocumentRuntimeQueries({
        refreshCurrentSurface: onWorkflowComplete,
      });
      showToast({
        message: "Edit Document berhasil.",
        variant: "success",
      });
    } catch (error) {
      if (isWorkflowConflictError(error)) {
        closeModal();
        await synchronizeDocumentRuntimeQueries({
          refreshCurrentSurface: onWorkflowComplete,
        });
        showToast({
          message: "Dokumen telah diperbarui oleh pengguna lain. Data dimuat ulang.",
          variant: "warning",
        });
        return;
      }
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
      await synchronizeDocumentRuntimeQueries({
        refreshCurrentSurface: onWorkflowComplete,
      });
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
      await synchronizeDocumentRuntimeQueries({
        refreshCurrentSurface: onWorkflowComplete,
      });
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
        await DocumentApiService.approveDocument(documentItem.id, {
          expectedState: workflowExpectedState,
        });
      } else if (workflowAction === ACTION_CODE.APPROVAL_B) {
        await DocumentApiService.submitApprovalWithComment(documentItem.id, {
          attachmentFile,
          comment,
          expectedState: workflowExpectedState,
        });
      } else if (workflowAction === ACTION_CODE.APPROVAL_C) {
        await DocumentApiService.rejectDocument(documentItem.id, {
          attachmentFile,
          comment,
          expectedState: workflowExpectedState,
        });
      }

      closeModal();
      await synchronizeDocumentRuntimeQueries({
        refreshCurrentSurface: onWorkflowComplete,
      });
      showToast({
        message: `${workflowAction} berhasil diproses.`,
        variant: "success",
      });
    } catch (error) {
      const nextMessage =
        error instanceof Error ? error.message : `${workflowAction} gagal diproses.`;

      if (isWorkflowConflictError(error)) {
        closeModal();
        await synchronizeDocumentRuntimeQueries({
          refreshCurrentSurface: onWorkflowComplete,
        });
        showToast({
          message: "Dokumen telah diperbarui oleh pengguna lain. Data dimuat ulang.",
          variant: "warning",
        });
        return;
      }

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
              disabled={isActionLocked}
              icon={Eye}
              isLoading={currentActiveAction === actionLoadingType.VIEW}
              label="View Document"
              onClick={() => runAction(actionLoadingType.VIEW, openViewDocument)}
            />
          ) : null}
          {!isReadOnlyActionMode && !isArchivedDocument && canEditDocument ? (
            <ActionIconButton
              disabled={isActionLocked}
              icon={Pencil}
              isLoading={currentActiveAction === actionLoadingType.EDIT}
              label="Edit Document"
              onClick={() => runAction(actionLoadingType.EDIT, openEditDocument)}
            />
          ) : null}
          {workflowVisibility.topActions.includes(ACTION_CODE.DOWNLOAD) ? (
            <ActionIconButton
              disabled={isActionLocked}
              icon={Download}
              isLoading={currentActiveAction === actionLoadingType.DOWNLOAD}
              label="Download Document"
              onClick={() => runAction(actionLoadingType.DOWNLOAD, downloadDocument)}
            />
          ) : null}
          {workflowVisibility.topActions.includes(ACTION_CODE.COMMENT) ? (
            <ActionIconButton
              disabled={isActionLocked}
              icon={MessageSquare}
              isLoading={currentActiveAction === actionLoadingType.COMMENT}
              label="View Comments"
              onClick={() => runAction(actionLoadingType.COMMENT, openCommentViewer)}
              showIndicator={hasUnreadComments && currentActiveAction !== actionLoadingType.COMMENT}
            />
          ) : null}
          {!isReadOnlyActionMode && canArchiveDocument ? (
            <ActionIconButton
              disabled={isActionLocked}
              icon={Archive}
              isLoading={currentActiveAction === actionLoadingType.ARCHIVE}
              label="Archive Document"
              onClick={() => runAction(actionLoadingType.ARCHIVE, () => {
                setActiveModalState(modalType.ARCHIVE);
              })}
            />
          ) : null}
          {!isReadOnlyActionMode && canRestoreDocument ? (
            <ActionIconButton
              disabled={isActionLocked}
              icon={RotateCcw}
              isLoading={currentActiveAction === actionLoadingType.RESTORE}
              label="Restore Document"
              onClick={() => runAction(actionLoadingType.RESTORE, submitRestoreDocument)}
            />
          ) : null}
        </div>

        {isReadOnlyActionMode ? null : workflowVisibility.showHistory ? (
          <button
            className="inline-flex h-8 w-full items-center justify-center gap-1.5 rounded-md border border-[#6D3FD6]/60 bg-[#3B0764] px-3 text-xs font-semibold text-white transition-colors hover:border-[#A78BFA] hover:bg-[#581C87]"
            disabled={isActionLocked}
            onClick={() => runAction(actionLoadingType.HISTORY, openHistory)}
            title="View History"
            type="button"
          >
            {currentActiveAction === actionLoadingType.HISTORY ? (
              <ActionButtonSpinner className="h-3.5 w-3.5" />
            ) : (
              <Clock3 className="h-3.5 w-3.5" />
            )}
            <span className="inline-flex min-w-[3.25rem] justify-center">
              {currentActiveAction === actionLoadingType.HISTORY ? "" : "History"}
            </span>
          </button>
        ) : (
          <div className="grid grid-cols-3 gap-2">
            {workflowVisibility.workflowActions.includes(ACTION_CODE.APPROVAL_A) ? (
              <ReviewActionButton
                disabled={isActionLocked}
                isLoading={currentActiveAction === actionLoadingType.APPROVAL_A}
                label="Approved"
                onClick={() => runAction(
                  actionLoadingType.APPROVAL_A,
                  () => openWorkflowModal(modalType.APPROVAL_A),
                )}
                tone="a"
              >
                A
              </ReviewActionButton>
            ) : null}
            {workflowVisibility.workflowActions.includes(ACTION_CODE.APPROVAL_B) ? (
              <ReviewActionButton
                disabled={isActionLocked}
                isLoading={currentActiveAction === actionLoadingType.APPROVAL_B}
                label="Approved with Comment"
                onClick={() => runAction(
                  actionLoadingType.APPROVAL_B,
                  () => openWorkflowModal(modalType.APPROVAL_B),
                )}
                tone="b"
              >
                B
              </ReviewActionButton>
            ) : null}
            {workflowVisibility.workflowActions.includes(ACTION_CODE.APPROVAL_C) ? (
              <ReviewActionButton
                disabled={isActionLocked}
                isLoading={currentActiveAction === actionLoadingType.APPROVAL_C}
                label="Not Approved"
                onClick={() => runAction(
                  actionLoadingType.APPROVAL_C,
                  () => openWorkflowModal(modalType.APPROVAL_C),
                )}
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
          documentItem={detailDocument}
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
          documentItem={detailDocument}
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
          documentItem={detailDocument}
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
