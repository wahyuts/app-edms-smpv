import { REALTIME_EVENT_TYPE } from "@/shared/realtime";

export const COMMENT_VIEWER_UPDATED_NOTICE = "Data komentar telah diperbarui.";

const normalizeId = (value) => String(value ?? "").trim();

export const isCommentViewerRealtimeEvent = ({
  activeProjectId,
  documentId,
  event,
}) => {
  if (!event || event.type !== REALTIME_EVENT_TYPE.COMMENT_CREATED) return false;
  if (normalizeId(event.projectId) !== normalizeId(activeProjectId)) return false;

  return normalizeId(event.documentId) === normalizeId(documentId);
};

export const isCommentActorSelfEvent = ({ currentUserId, event }) =>
  Boolean(event?.actorUserId) &&
  normalizeId(event.actorUserId) === normalizeId(currentUserId);
