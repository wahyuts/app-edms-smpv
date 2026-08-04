import { useCallback } from "react";

import { queryClient } from "@/shared/api/query-client";
import {
  REALTIME_EVENT_TYPE,
  useRealtimeEvent,
  useRealtimeRecovery,
} from "@/shared/realtime";
import { useProjectContextStore } from "@/shared/stores/project-context.store";

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

  const handleDocumentRuntimeEvent = useCallback(
    (event) => {
      if (!documentRuntimeEventTypes.has(event.type)) return;
      if (String(event.projectId ?? "") !== String(activeProjectId ?? "")) return;

      refreshDocumentRegisterAndDashboardQueries();
    },
    [activeProjectId],
  );

  const handleRecovery = useCallback(
    (context) => {
      if (String(context.projectId ?? "") !== String(activeProjectId ?? "")) return;

      refreshDocumentRegisterAndDashboardQueries();
    },
    [activeProjectId],
  );

  useRealtimeEvent(handleDocumentRuntimeEvent);
  useRealtimeRecovery(handleRecovery);
};

export default useRealtimeDocumentRuntimeSync;
