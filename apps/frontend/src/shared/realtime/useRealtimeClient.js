import { useEffect, useRef } from "react";

import { AuthService } from "@/features/auth/services/auth.service";
import { useProjectContextStore } from "@/shared/stores/project-context.store";

import { createRealtimeClient } from "./realtime-client.service";

export const useRealtimeClient = () => {
  const clientRef = useRef(null);
  const activeProject = useProjectContextStore((state) => state.activeProject);
  const activeMembership = useProjectContextStore((state) => state.activeMembership);
  const isProjectContextInitialized = useProjectContextStore((state) => state.isInitialized);
  const userId = AuthService.getCurrentUser()?.id ?? null;
  const projectId = activeProject?.id ?? null;
  const canConnect = Boolean(
    userId &&
    projectId &&
    activeProject?.status === "Active" &&
    activeMembership?.id &&
    activeMembership?.status === "Active" &&
    isProjectContextInitialized &&
    !AuthService.isProjectSelectionRequired(),
  );

  useEffect(() => {
    clientRef.current?.stop();
    clientRef.current = null;

    if (!canConnect) return undefined;

    const client = createRealtimeClient({
      projectId,
      userId,
    });

    clientRef.current = client;
    client.start();

    return () => {
      client.stop();
      if (clientRef.current === client) {
        clientRef.current = null;
      }
    };
  }, [canConnect, projectId, userId]);
};

export default useRealtimeClient;
