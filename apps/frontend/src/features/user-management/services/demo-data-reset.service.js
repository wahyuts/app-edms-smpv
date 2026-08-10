import { env } from "@/app/config/env";
import { AuthService } from "@/features/auth/services/auth.service";
import { apiClient } from "@/shared/api";
import { queryClient } from "@/shared/api/query-client";
import { AuthorizationService } from "@/shared/services/authorization.service";
import { useProjectContextStore } from "@/shared/stores/project-context.store";

const BOOTSTRAP_USERNAME = "deny";
const CONFIRMATION_TEXT = "RESET ALL DEMO DATA";
const RESET_PERMISSION = "user-management.view";
const ADMIN_ROLE_NAME = "Admin";

const ACTIVE_PROJECT_STORAGE_KEY = "edms.activeProjectByUser";
const CURRENT_USER_STORAGE_KEY = "edms.currentUser";

export class DemoDataResetError extends Error {
  constructor(message, errors = []) {
    super(message);
    this.name = "DemoDataResetError";
    this.errors = errors;
  }
}

const isFeatureEnabled = () =>
  env.APP_ENV === "development" &&
  env.ENABLE_DEMO_RESET === true;

const assertFeatureEnabled = () => {
  if (!isFeatureEnabled()) {
    throw new DemoDataResetError("Reset All Demo Data is disabled by configuration.");
  }
};

const assertConfirmationText = (confirmationText) => {
  if (confirmationText !== CONFIRMATION_TEXT) {
    throw new DemoDataResetError("Confirmation text does not match.");
  }
};

const assertAuthorizedExecutor = () => {
  const currentUser = AuthService.getCurrentUser();
  const currentRole = AuthorizationService.getCurrentRole();

  if (!currentUser?.id) {
    throw new DemoDataResetError("User session is not available.");
  }
  if (currentRole?.name !== ADMIN_ROLE_NAME) {
    throw new DemoDataResetError("Only Admin can reset demo data.");
  }
  if (!AuthorizationService.hasPermission(RESET_PERMISSION)) {
    throw new DemoDataResetError("Admin permission is required to reset demo data.");
  }

  return currentUser;
};

const clearRuntimeState = async () => {
  const failures = [];

  try {
    queryClient.clear();
  } catch (error) {
    failures.push(error);
  }

  try {
    useProjectContextStore.getState().clearProjectContext();
  } catch (error) {
    failures.push(error);
  }

  try {
    if (typeof window !== "undefined" && window.localStorage) {
      window.localStorage.removeItem(ACTIVE_PROJECT_STORAGE_KEY);
      window.localStorage.removeItem(CURRENT_USER_STORAGE_KEY);
    }
    AuthService.clearCurrentUser();
  } catch (error) {
    failures.push(error);
  }

  if (failures.length > 0) {
    throw new DemoDataResetError("Reset data succeeded, but runtime state cleanup failed.");
  }
};

const getBackendErrorMessage = (error) =>
  error?.response?.data?.message ??
  error?.response?.data?.error?.message ??
  error?.message ??
  "Reset All Demo Data failed.";

const resetAllDemoData = async ({ confirmationText } = {}) => {
  assertFeatureEnabled();
  assertConfirmationText(confirmationText);
  assertAuthorizedExecutor();

  try {
    const response = await apiClient.post("/v1/development/reset", {
      confirmationText,
    });

    await clearRuntimeState();

    return {
      bootstrapUsername: BOOTSTRAP_USERNAME,
      result: response?.data?.data ?? null,
      success: true,
    };
  } catch (error) {
    throw new DemoDataResetError(getBackendErrorMessage(error));
  }
};

export const DemoDataResetService = {
  BOOTSTRAP_USERNAME,
  CONFIRMATION_TEXT,
  RESET_PERMISSION,
  isFeatureEnabled,
  resetAllDemoData,
};

export default DemoDataResetService;
