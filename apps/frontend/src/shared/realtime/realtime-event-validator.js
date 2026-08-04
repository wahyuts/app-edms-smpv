import {
  REALTIME_EVENT_SCOPE,
  REALTIME_EVENT_VERSION,
} from "./realtime.constants";

const validScopes = new Set(Object.values(REALTIME_EVENT_SCOPE));

const isPresent = (value) =>
  value !== null && value !== undefined && String(value).trim() !== "";

export const parseRealtimeEvent = (rawData) => {
  if (!rawData) return null;

  try {
    return JSON.parse(rawData);
  } catch {
    return null;
  }
};

export const isValidRealtimeEvent = (event) => {
  if (!event || typeof event !== "object") return false;
  if (!isPresent(event.eventId)) return false;
  if (event.version !== REALTIME_EVENT_VERSION) return false;
  if (!isPresent(event.type)) return false;
  if (!validScopes.has(event.scope)) return false;
  if (!isPresent(event.resourceType)) return false;
  if (!isPresent(event.resourceId)) return false;

  if (
    [REALTIME_EVENT_SCOPE.PROJECT, REALTIME_EVENT_SCOPE.USER_PROJECT].includes(
      event.scope,
    ) &&
    !isPresent(event.projectId)
  ) {
    return false;
  }

  if (
    [REALTIME_EVENT_SCOPE.USER, REALTIME_EVENT_SCOPE.USER_PROJECT].includes(
      event.scope,
    ) &&
    !isPresent(event.recipientUserId)
  ) {
    return false;
  }

  return true;
};
