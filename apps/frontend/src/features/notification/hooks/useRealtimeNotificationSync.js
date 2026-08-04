import { useCallback } from "react";

import { AuthService } from "@/features/auth/services/auth.service";
import { queryClient } from "@/shared/api/query-client";
import {
  REALTIME_EVENT_TYPE,
  useRealtimeEvent,
  useRealtimeRecovery,
} from "@/shared/realtime";
import { useProjectContextStore } from "@/shared/stores/project-context.store";

const refreshNotificationQueries = () => {
  queryClient.invalidateQueries({ queryKey: ["notifications"] });
  queryClient.refetchQueries({ queryKey: ["notifications"], type: "active" });
};

export const useRealtimeNotificationSync = () => {
  const activeProjectId = useProjectContextStore((state) => state.activeProject?.id);
  const currentUserId = AuthService.getCurrentUser()?.id ?? null;

  const handleNotificationEvent = useCallback(
    (event) => {
      if (event.type !== REALTIME_EVENT_TYPE.NOTIFICATION_CREATED) return;
      if (String(event.projectId ?? "") !== String(activeProjectId ?? "")) return;
      if (String(event.recipientUserId ?? "") !== String(currentUserId ?? "")) return;

      refreshNotificationQueries();
    },
    [activeProjectId, currentUserId],
  );

  const handleRecovery = useCallback(
    (context) => {
      if (String(context.projectId ?? "") !== String(activeProjectId ?? "")) return;
      if (!currentUserId) return;

      refreshNotificationQueries();
    },
    [activeProjectId, currentUserId],
  );

  useRealtimeEvent(handleNotificationEvent);
  useRealtimeRecovery(handleRecovery);
};

export default useRealtimeNotificationSync;
