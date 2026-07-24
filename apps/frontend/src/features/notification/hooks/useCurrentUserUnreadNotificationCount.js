import { useQuery } from "@tanstack/react-query";

import { AuthService } from "@/features/auth/services/auth.service";
import { useProjectContextStore } from "@/shared/stores/project-context.store";

import { NotificationService } from "../services/notification.service";

export const useCurrentUserUnreadNotificationCount = () => {
  const currentUser = AuthService.getCurrentUser();
  const activeProjectId = useProjectContextStore((state) => state.activeProject?.id);

  return useQuery({
    enabled: Boolean(currentUser?.id && activeProjectId),
    queryFn: NotificationService.getCurrentUserUnreadCount,
    queryKey: ["notifications", "unread-count", currentUser?.id ?? null, activeProjectId ?? null],
  });
};

export default useCurrentUserUnreadNotificationCount;
