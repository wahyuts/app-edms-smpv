import { REALTIME_EVENT_TYPE } from "@/shared/realtime";

export const WORKFLOW_DETAIL_STALE_NOTICE =
  "Dokumen telah diperbarui oleh pengguna lain. Data dimuat ulang.";

export const workflowDetailRealtimeEventTypes = new Set([
  REALTIME_EVENT_TYPE.DOCUMENT_ARCHIVED,
  REALTIME_EVENT_TYPE.DOCUMENT_RESTORED,
  REALTIME_EVENT_TYPE.DOCUMENT_UPDATED,
  REALTIME_EVENT_TYPE.REVISION_UPLOADED,
  REALTIME_EVENT_TYPE.WORKFLOW_CHANGED,
]);

export const workflowActionModalTypes = new Set([
  "approvalA",
  "approvalB",
  "approvalC",
  "archive",
  "edit",
]);

export const workflowDocumentViewerModalTypes = new Set([
  "view",
]);

const normalizeId = (value) => String(value ?? "").trim();

export const isRelevantWorkflowDetailEvent = ({
  activeProjectId,
  documentId,
  event,
}) => {
  if (!event || !workflowDetailRealtimeEventTypes.has(event.type)) return false;
  if (normalizeId(event.projectId) !== normalizeId(activeProjectId)) return false;

  const eventDocumentId = event.documentId || (
    event.resourceType === "Document" ? event.resourceId : null
  );

  return normalizeId(eventDocumentId) === normalizeId(documentId);
};

export const isActorSelfEvent = ({ currentUserId, event }) =>
  Boolean(event?.actorUserId) &&
  normalizeId(event.actorUserId) === normalizeId(currentUserId);

export const shouldCloseWorkflowActionModal = (activeModal) =>
  workflowActionModalTypes.has(activeModal);

export const shouldRefreshWorkflowDocumentViewer = (activeModal) =>
  workflowDocumentViewerModalTypes.has(activeModal);
