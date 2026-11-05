import { useEffect, useRef } from "react";
import { REALTIME_EVENT_TYPE, useRealtimeEvent, useRealtimeRecovery } from "@/shared/realtime";
import { useProjectContextStore } from "@/shared/stores/project-context.store";
import { createRealtimeRefetchCoalescer } from "../utils/realtimeRefetchCoalescer";
import { waitForPermanentDeleteConfirmations } from "../utils/permanentDeleteConfirmation";

// Subscribe to the existing connection, not another EventSource or poller.
export const useRealtimePermanentDeleteSync = (refresh) => {
  const activeProjectId = useProjectContextStore((state) => state.activeProject?.id);
  const refreshRef = useRef(refresh);
  const coalescerRef = useRef(null);
  const seenRef = useRef(new Set());

  useEffect(() => { refreshRef.current = refresh; }, [refresh]);
  useEffect(() => {
    let active = true;
    let refreshPending = false;
    let refreshAgain = false;
    const coalescer = createRealtimeRefetchCoalescer({
      delayMs: 500,
      onFlush: async () => {
        if (refreshPending) { refreshAgain = true; return; }
        refreshPending = true;
        try {
          await waitForPermanentDeleteConfirmations(activeProjectId);
          const current = useProjectContextStore.getState().activeProject?.id;
          if (active && activeProjectId && String(current) === String(activeProjectId)) await refreshRef.current();
        } catch {
          // Query error handling/reconnect recovery remains responsible for reads.
        } finally {
          refreshPending = false;
          if (active && refreshAgain) {
            refreshAgain = false;
            coalescer.schedule({ projectId: activeProjectId });
          }
        }
      },
    });
    coalescerRef.current = coalescer;
    seenRef.current = new Set();
    return () => { active = false; coalescer.cancel(); coalescerRef.current = null; };
  }, [activeProjectId]);

  useRealtimeEvent((event) => {
    const current = useProjectContextStore.getState().activeProject?.id;
    // A newly selected project can have cached data from before this connection.
    if (event.type === REALTIME_EVENT_TYPE.CONNECTED && activeProjectId
      && String(event.projectId ?? "") === String(activeProjectId)
      && String(current ?? "") === String(activeProjectId)) {
      coalescerRef.current?.schedule({ projectId: activeProjectId });
      return;
    }
    if (event.type !== REALTIME_EVENT_TYPE.DOCUMENT_DELETED || !activeProjectId
      || String(event.projectId ?? "") !== String(activeProjectId)
      || String(current ?? "") !== String(activeProjectId) || !event.eventId) return;
    if (seenRef.current.has(event.eventId)) return;
    seenRef.current.add(event.eventId);
    if (seenRef.current.size > 1000) seenRef.current.delete(seenRef.current.values().next().value);
    coalescerRef.current?.schedule({ projectId: activeProjectId });
  });
  useRealtimeRecovery((context) => {
    const current = useProjectContextStore.getState().activeProject?.id;
    if (activeProjectId && String(context.projectId ?? "") === String(activeProjectId)
      && String(current ?? "") === String(activeProjectId)) {
      coalescerRef.current?.schedule({ projectId: activeProjectId });
    }
  });
};
