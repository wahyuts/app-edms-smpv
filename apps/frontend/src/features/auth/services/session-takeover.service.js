import { queryClient } from "@/shared/api/query-client";
import { useProjectContextStore } from "@/shared/stores/project-context.store";

import { useAuthStore } from "../stores/auth.store";
import { useSessionTakeoverStore } from "../stores/session-takeover.store";

export const SESSION_REPLACED_CODE = "SESSION_REPLACED";
export const SESSION_REPLACED_NOTICE_EVENT = "edms.auth.session-replaced";
export const SESSION_REPLACED_NOTICE_STORAGE_KEY = "edms.auth.sessionReplacedNotice";
export const SESSION_REPLACED_NOTICE = Object.freeze({
  message: "Your account has been signed in on another device. You will be logged out automatically.",
  title: "Session Replaced",
  variant: "warning",
});

let takeoverState = "NORMAL";

const isPublicRecoveryPath = (pathname = "") => {
  return pathname === "/forgot-password" ||
    pathname === "/check-email" ||
    pathname === "/reset-password" ||
    pathname.startsWith("/mock-email");
};

const shouldRedirectToLogin = () => {
  if (typeof window === "undefined") return false;

  return window.location.pathname !== "/login" &&
    !isPublicRecoveryPath(window.location.pathname);
};

const persistSessionReplacementNotice = () => {
  if (typeof window === "undefined" || !window.sessionStorage) return;

  try {
    window.sessionStorage.setItem(
      SESSION_REPLACED_NOTICE_STORAGE_KEY,
      JSON.stringify(SESSION_REPLACED_NOTICE),
    );
  } catch {
    // Ignore storage failures; auth cleanup and redirect must still continue.
  }
};

const dispatchSessionReplacementNotice = () => {
  if (typeof window === "undefined") return;

  window.dispatchEvent(
    new CustomEvent(SESSION_REPLACED_NOTICE_EVENT, {
      detail: SESSION_REPLACED_NOTICE,
    }),
  );
};

const completeSessionTakeover = () => {
  if (takeoverState === "COMPLETING_TAKEOVER") return;

  takeoverState = "COMPLETING_TAKEOVER";
  useSessionTakeoverStore.getState().markCompleting();

  const shouldRedirect = shouldRedirectToLogin();

  if (shouldRedirect) {
    persistSessionReplacementNotice();
  }

  useSessionTakeoverStore.getState().closeRealtimeModal();
  useAuthStore.getState().clearAuth();
  useProjectContextStore.getState().clearProjectContext();
  queryClient.clear();

  if (shouldRedirect) {
    window.location.replace("/login");
    return;
  }

  dispatchSessionReplacementNotice();
};

const handleHttpSessionReplaced = () => {
  if (takeoverState === "REALTIME_MODAL_ACTIVE") return;

  completeSessionTakeover();
};

const handleRealtimeSessionReplaced = () => {
  if (takeoverState !== "NORMAL") return false;

  takeoverState = "REALTIME_MODAL_ACTIVE";
  useSessionTakeoverStore.getState().openRealtimeModal();
  return true;
};

const resetSessionTakeoverStateForLogin = () => {
  takeoverState = "NORMAL";
  useSessionTakeoverStore.getState().resetSessionTakeoverState();
};

export const SessionTakeoverService = {
  completeSessionTakeover,
  handleHttpSessionReplaced,
  handleRealtimeSessionReplaced,
  resetSessionTakeoverStateForLogin,
};

export default SessionTakeoverService;
