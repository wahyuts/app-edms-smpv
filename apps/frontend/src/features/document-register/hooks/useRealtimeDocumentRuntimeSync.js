import { useCallback, useEffect, useRef } from "react";

import { queryClient } from "@/shared/api/query-client";
import {
  REALTIME_EVENT_TYPE,
  useRealtimeEvent,
  useRealtimeRecovery,
} from "@/shared/realtime";
import { useProjectContextStore } from "@/shared/stores/project-context.store";

import { createRealtimeRefetchCoalescer } from "../utils/realtimeRefetchCoalescer";

const REALTIME_DOCUMENT_REFETCH_DELAY_MS = 500;

const documentRuntimeEventTypes = new Set([
  REALTIME_EVENT_TYPE.DOCUMENT_ARCHIVED,
  REALTIME_EVENT_TYPE.DOCUMENT_CREATED,
  REALTIME_EVENT_TYPE.DOCUMENT_RESTORED,
  REALTIME_EVENT_TYPE.DOCUMENT_UPDATED,
  REALTIME_EVENT_TYPE.REVISION_UPLOADED,
  REALTIME_EVENT_TYPE.WORKFLOW_CHANGED,
]);

const refreshDocumentRegisterAndDashboardQueries = () => {
  queryClient.invalidateQueries({ queryKey: ["documents"], refetchType: "active" });
  queryClient.invalidateQueries({ queryKey: ["dashboard"], refetchType: "active" });
};

export const useRealtimeDocumentRuntimeSync = () => {
  const activeProjectId = useProjectContextStore((state) => state.activeProject?.id);
  const refetchCoalescerRef = useRef(null);

  useEffect(() => {
    refetchCoalescerRef.current = createRealtimeRefetchCoalescer({
      delayMs: REALTIME_DOCUMENT_REFETCH_DELAY_MS,
      onFlush: refreshDocumentRegisterAndDashboardQueries,
    });

    return () => {
      refetchCoalescerRef.current?.cancel();
      refetchCoalescerRef.current = null;
    };
  }, []);

  useEffect(() => {
    refetchCoalescerRef.current?.cancel();
  }, [activeProjectId]);

  const handleDocumentRuntimeEvent = useCallback(
    (event) => {
      if (!documentRuntimeEventTypes.has(event.type)) return;
      if (String(event.projectId ?? "") !== String(activeProjectId ?? "")) return;

      refetchCoalescerRef.current?.schedule({
        eventId: event.eventId,
        projectId: activeProjectId,
        reason: event.type,
      });
    },
    [activeProjectId],
  );

  const handleRecovery = useCallback(
    (context) => {
      if (String(context.projectId ?? "") !== String(activeProjectId ?? "")) return;

      refetchCoalescerRef.current?.schedule({
        projectId: activeProjectId,
        reason: "recovery",
      });
    },
    [activeProjectId],
  );

  useRealtimeEvent(handleDocumentRuntimeEvent);
  useRealtimeRecovery(handleRecovery);
};

export default useRealtimeDocumentRuntimeSync;
