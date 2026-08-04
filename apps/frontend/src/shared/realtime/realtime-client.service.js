import { env } from "@/app/config/env";

import {
  REALTIME_CONNECTION_STATUS,
  REALTIME_MAX_RECONNECT_DELAY_MS,
  REALTIME_MIN_RECONNECT_DELAY_MS,
  REALTIME_RECONNECT_JITTER_MS,
} from "./realtime.constants";
import realtimeEventDispatcher from "./realtime-event-dispatcher";
import { parseRealtimeEvent } from "./realtime-event-validator";

const buildRealtimeUrl = () => {
  const baseUrl = String(env.API_BASE_URL ?? "").replace(/\/+$/, "");

  return `${baseUrl}/v1/events`;
};

const buildAuthProbeUrl = () => {
  const baseUrl = String(env.API_BASE_URL ?? "").replace(/\/+$/, "");

  return `${baseUrl}/v1/auth/me`;
};

const getReconnectDelay = (attempt) => {
  const exponentialDelay = REALTIME_MIN_RECONNECT_DELAY_MS * (2 ** Math.max(0, attempt - 1));
  const cappedDelay = Math.min(exponentialDelay, REALTIME_MAX_RECONNECT_DELAY_MS);
  const jitter = Math.floor(Math.random() * REALTIME_RECONNECT_JITTER_MS);

  return Math.min(cappedDelay + jitter, REALTIME_MAX_RECONNECT_DELAY_MS);
};

export class RealtimeClient {
  constructor({
    dispatcher = realtimeEventDispatcher,
    eventSourceFactory = (url, options) => new EventSource(url, options),
    onRecovery = null,
    onStatusChange = null,
    projectId,
    userId,
  } = {}) {
    this.dispatcher = dispatcher;
    this.eventSource = null;
    this.eventSourceFactory = eventSourceFactory;
    this.isStopped = true;
    this.lastConnectedOnce = false;
    this.onRecovery = onRecovery;
    this.onStatusChange = onStatusChange;
    this.projectId = projectId;
    this.reconnectAttempt = 0;
    this.reconnectTimer = null;
    this.userId = userId;
    this.validationRequestId = 0;
  }

  emitStatus(status) {
    this.onStatusChange?.({
      projectId: this.projectId,
      status,
      userId: this.userId,
    });
  }

  start() {
    if (!this.userId || !this.projectId || typeof EventSource === "undefined") {
      this.stop();
      return;
    }

    this.isStopped = false;
    this.open();
  }

  open() {
    if (this.isStopped) return;

    this.closeEventSource();
    this.emitStatus(
      this.reconnectAttempt > 0
        ? REALTIME_CONNECTION_STATUS.RECONNECTING
        : REALTIME_CONNECTION_STATUS.CONNECTING,
    );

    const eventSource = this.eventSourceFactory(buildRealtimeUrl(), {
      withCredentials: true,
    });
    this.eventSource = eventSource;

    eventSource.onopen = () => {
      const wasReconnected = this.lastConnectedOnce && this.reconnectAttempt > 0;

      this.reconnectAttempt = 0;
      this.lastConnectedOnce = true;
      this.emitStatus(REALTIME_CONNECTION_STATUS.CONNECTED);

      if (wasReconnected) {
        const recoveryContext = {
          projectId: this.projectId,
          reason: "reconnected",
        };

        this.dispatcher.dispatchRecovery(recoveryContext);
        this.onRecovery?.(recoveryContext);
      }
    };

    eventSource.onmessage = (messageEvent) => {
      this.handleEventData(messageEvent.data);
    };

    eventSource.addEventListener("connected", (messageEvent) => {
      this.handleEventData(messageEvent.data);
    });

    eventSource.onerror = () => {
      if (this.isStopped) return;

      if (
        eventSource.readyState === EventSource.CLOSED ||
        eventSource.readyState === EventSource.CONNECTING
      ) {
        this.handleConnectionError();
      }
    };
  }

  handleEventData(rawData) {
    const event = parseRealtimeEvent(rawData);

    if (!event) return;
    if (event.projectId && String(event.projectId) !== String(this.projectId)) {
      return;
    }

    this.dispatcher.dispatch(event);
  }

  async handleConnectionError() {
    const requestId = this.validationRequestId + 1;
    this.validationRequestId = requestId;
    this.closeEventSource();

    try {
      const response = await fetch(buildAuthProbeUrl(), {
        credentials: "include",
        method: "GET",
      });

      if (this.isStopped || requestId !== this.validationRequestId) return;

      if ([401, 403].includes(response.status)) {
        this.stop();
        return;
      }
    } catch {
      if (this.isStopped || requestId !== this.validationRequestId) return;
    }

    this.scheduleReconnect();
  }

  scheduleReconnect() {
    if (this.isStopped || this.reconnectTimer) return;

    this.closeEventSource();
    this.reconnectAttempt += 1;
    this.emitStatus(REALTIME_CONNECTION_STATUS.RECONNECTING);

    const delayMs = getReconnectDelay(this.reconnectAttempt);

    this.reconnectTimer = window.setTimeout(() => {
      this.reconnectTimer = null;
      this.open();
    }, delayMs);
  }

  closeEventSource() {
    if (!this.eventSource) return;

    this.eventSource.close();
    this.eventSource = null;
  }

  stop() {
    this.isStopped = true;

    if (this.reconnectTimer) {
      window.clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }

    this.closeEventSource();
    this.emitStatus(REALTIME_CONNECTION_STATUS.STOPPED);
  }
}

export const createRealtimeClient = (options) => new RealtimeClient(options);

export const RealtimeClientService = {
  create: createRealtimeClient,
};

export default RealtimeClientService;
