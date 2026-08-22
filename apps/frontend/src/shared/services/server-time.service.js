import { apiClient } from "@/shared/api";

const SERVER_TIME_SYNC_INTERVAL_MS = 60 * 1000;

let timeState = {
  error: null,
  lastSyncedAt: null,
  performanceAtSync: null,
  roundTripTimeMs: null,
  serverEpochAtSync: null,
  source: null,
  status: "idle",
};
let syncPromise = null;
let syncIntervalId = null;
let syncSubscriberCount = 0;

const listeners = new Set();

const notifyListeners = () => {
  listeners.forEach((listener) => listener());
};

const setTimeState = (nextState) => {
  timeState = {
    ...timeState,
    ...nextState,
  };
  notifyListeners();
};

const getServerNowEpoch = () => {
  if (timeState.serverEpochAtSync === null || timeState.performanceAtSync === null) {
    return null;
  }

  return timeState.serverEpochAtSync + (performance.now() - timeState.performanceAtSync);
};

const getSnapshot = () => ({
  ...timeState,
  estimatedServerNow: getServerNowEpoch(),
  isSynchronized: timeState.serverEpochAtSync !== null,
});

const subscribe = (listener) => {
  listeners.add(listener);

  return () => {
    listeners.delete(listener);
  };
};

const synchronize = async () => {
  if (syncPromise) return syncPromise;

  syncPromise = (async () => {
    const requestStartedAt = performance.now();

    try {
      const response = await apiClient.get("/v1/system/time");
      const responseReceivedAt = performance.now();
      const roundTripTimeMs = responseReceivedAt - requestStartedAt;
      const serverNow = response.data?.data?.serverNow;
      const serverEpoch = Date.parse(serverNow);

      if (!Number.isFinite(serverEpoch)) {
        throw new Error("Server time response tidak valid.");
      }

      setTimeState({
        error: null,
        lastSyncedAt: serverNow,
        performanceAtSync: responseReceivedAt,
        roundTripTimeMs,
        serverEpochAtSync: serverEpoch + (roundTripTimeMs / 2),
        source: response.data?.data?.source ?? "mysql-utc",
        status: "synchronized",
      });
    } catch (error) {
      setTimeState({
        error: error instanceof Error ? error.message : "Server time sync failed.",
        status: timeState.serverEpochAtSync === null ? "error" : "stale",
      });
    } finally {
      syncPromise = null;
    }
  })();

  return syncPromise;
};

const startAutoSynchronization = () => {
  syncSubscriberCount += 1;

  if (!syncIntervalId) {
    synchronize();
    syncIntervalId = window.setInterval(() => {
      synchronize();
    }, SERVER_TIME_SYNC_INTERVAL_MS);
  }
};

const stopAutoSynchronization = () => {
  syncSubscriberCount = Math.max(0, syncSubscriberCount - 1);

  if (syncSubscriberCount === 0 && syncIntervalId) {
    window.clearInterval(syncIntervalId);
    syncIntervalId = null;
  }
};

export const ServerTimeService = {
  getSnapshot,
  getServerNowEpoch,
  startAutoSynchronization,
  stopAutoSynchronization,
  subscribe,
  synchronize,
  syncIntervalMs: SERVER_TIME_SYNC_INTERVAL_MS,
};

export default ServerTimeService;
