import { isValidRealtimeEvent } from "./realtime-event-validator";

const subscribers = new Set();
const recoverySubscribers = new Set();

const subscribe = (listener) => {
  if (typeof listener !== "function") return () => {};

  subscribers.add(listener);

  return () => {
    subscribers.delete(listener);
  };
};

const subscribeRecovery = (listener) => {
  if (typeof listener !== "function") return () => {};

  recoverySubscribers.add(listener);

  return () => {
    recoverySubscribers.delete(listener);
  };
};

const dispatch = (event) => {
  if (!isValidRealtimeEvent(event)) return false;

  subscribers.forEach((listener) => {
    listener(event);
  });

  return true;
};

const dispatchRecovery = (context = {}) => {
  recoverySubscribers.forEach((listener) => {
    listener({
      projectId: context.projectId ?? null,
      reconnectedAt: new Date().toISOString(),
      reason: context.reason ?? "reconnected",
    });
  });
};

export const realtimeEventDispatcher = {
  dispatch,
  dispatchRecovery,
  subscribe,
  subscribeRecovery,
};

export default realtimeEventDispatcher;
