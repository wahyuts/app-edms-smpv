import { apiClient } from "@/shared/api";

import {
  CURRENT_USER_CHANGED_EVENT,
  getAuthState,
  useAuthStore,
} from "../stores/auth.store";

const PASSWORD_RESET_GENERIC_MESSAGE =
  "If the account exists, password recovery instructions have been sent.";
const LOGIN_MESSAGES = {
  invalidCredentials: [
    "Username atau Password yang Anda masukkan tidak benar.",
    "",
    "Silakan periksa kembali dan coba lagi.",
  ].join("\n"),
  passwordRequired: "Silakan masukkan Password Anda.",
  serverUnavailable: [
    "Tidak dapat terhubung ke server.",
    "",
    "Silakan coba beberapa saat lagi.",
  ].join("\n"),
  sessionExpired: [
    "Sesi Anda telah berakhir.",
    "",
    "Silakan login kembali.",
  ].join("\n"),
  usernameRequired: "Silakan masukkan Username Anda.",
};
const CHANGE_PASSWORD_MESSAGES = {
  currentPasswordIncorrect: [
    "Current Password yang Anda masukkan tidak benar.",
    "",
    "Silakan periksa kembali dan coba lagi.",
  ].join("\n"),
};

let initializationPromise = null;

const createSuccessResponse = (message, data = null) => ({
  success: true,
  message,
  data,
});

const createFailedResponse = (message, data = null) => ({
  success: false,
  message,
  data,
});

const getErrorMessage = (error, fallbackMessage) => {
  return error?.response?.data?.message ?? error?.message ?? fallbackMessage;
};

const getFriendlyAuthErrorMessage = (error, fallbackMessage) => {
  if (!error?.response) {
    return LOGIN_MESSAGES.serverUnavailable;
  }

  if (error.response.status === 401) {
    return fallbackMessage;
  }

  return fallbackMessage;
};

const getChangePasswordErrorMessage = (error) => {
  const backendMessage = getErrorMessage(error, "Change password failed");

  if (backendMessage === "Current password is incorrect") {
    return CHANGE_PASSWORD_MESSAGES.currentPasswordIncorrect;
  }

  return backendMessage;
};

const assertBackendSuccess = (response, fallbackMessage) => {
  if (response?.data?.success === false) {
    const error = new Error(response.data.message ?? fallbackMessage);
    error.response = response;
    throw error;
  }

  return response;
};

const mapUserIdentity = (user = {}) => ({
  department: user.departmentNameSnapshot ?? user.department ?? "",
  departmentId: user.departmentId ?? null,
  departmentNameSnapshot: user.departmentNameSnapshot ?? null,
  email: user.email ?? "",
  fullName: user.fullName ?? user.name ?? "",
  id: user.id ?? null,
  isActive: user.status ? user.status === "Active" : Boolean(user.isActive),
  name: user.fullName ?? user.name ?? "",
  position: user.position ?? null,
  roleId: user.roleId ?? null,
  status: user.status ?? (user.isActive ? "Active" : "Inactive"),
  userCode: user.userCode ?? "",
  username: user.username ?? "",
});

const mapAuthContext = (data = {}) => ({
  activeProject: data.activeProject ?? null,
  officialRole: data.officialRole ?? null,
  permissions: Array.isArray(data.permissions) ? data.permissions : [],
  role: data.role ?? null,
  user: data.user ? mapUserIdentity(data.user) : null,
});

const setAuthContextFromResponse = (data = {}) => {
  const context = mapAuthContext(data);
  useAuthStore.getState().setAuthContext(context);
  return context;
};

const clearCurrentUser = () => {
  useAuthStore.getState().clearAuth();
};

const getCurrentUser = () => getAuthState().user;
const getCurrentRole = () => getAuthState().role;
const getCurrentPermissions = () => getAuthState().permissions;
const getActiveProject = () => getAuthState().activeProject;
const getOfficialRole = () => getAuthState().officialRole;
const isAuthenticated = () => getAuthState().authenticated;

const subscribeCurrentUserChange = (listener) => {
  if (typeof window === "undefined") return () => {};

  const handleCurrentUserChange = (event) => {
    listener(event.detail ?? getCurrentUser());
  };

  window.addEventListener(CURRENT_USER_CHANGED_EVENT, handleCurrentUserChange);

  return () => {
    window.removeEventListener(CURRENT_USER_CHANGED_EVENT, handleCurrentUserChange);
  };
};

const getMe = async () => {
  const response = assertBackendSuccess(
    await apiClient.get("/v1/auth/me"),
    LOGIN_MESSAGES.sessionExpired,
  );
  const context = setAuthContextFromResponse(response.data?.data);

  return createSuccessResponse(response.data?.message ?? "Current user retrieved", context);
};

const initialize = async () => {
  if (!initializationPromise) {
    initializationPromise = (async () => {
      useAuthStore.getState().setAuthLoading(true);

      try {
        await getMe();
      } catch {
        useAuthStore.getState().clearAuth();
      } finally {
        useAuthStore.getState().setAuthLoading(false);
      }
    })().catch((error) => {
      initializationPromise = null;
      throw error;
    });
  }

  return initializationPromise;
};

const login = async ({ username, password }) => {
  const normalizedUsername = String(username ?? "").trim();

  if (!normalizedUsername) {
    return createFailedResponse(LOGIN_MESSAGES.usernameRequired);
  }

  if (!String(password ?? "")) {
    return createFailedResponse(LOGIN_MESSAGES.passwordRequired);
  }

  try {
    const loginResponse = assertBackendSuccess(
      await apiClient.post("/v1/auth/login", {
        password,
        username: normalizedUsername,
      }),
      LOGIN_MESSAGES.invalidCredentials,
    );
    const meResponse = await getMe();

    return createSuccessResponse(
      loginResponse.data?.message ?? "Login successful",
      meResponse.data,
    );
  } catch (error) {
    clearCurrentUser();
    return createFailedResponse(
      getFriendlyAuthErrorMessage(error, LOGIN_MESSAGES.invalidCredentials),
    );
  }
};

const refresh = async () => {
  try {
    const response = assertBackendSuccess(
      await apiClient.post("/v1/auth/refresh"),
      LOGIN_MESSAGES.sessionExpired,
    );
    const context = setAuthContextFromResponse(response.data?.data);

    return createSuccessResponse(response.data?.message ?? "Token refreshed", context);
  } catch (error) {
    clearCurrentUser();
    return createFailedResponse(
      getFriendlyAuthErrorMessage(error, LOGIN_MESSAGES.sessionExpired),
    );
  }
};

const logout = async () => {
  try {
    const response = assertBackendSuccess(
      await apiClient.post("/v1/auth/logout"),
      "Logout failed",
    );
    clearCurrentUser();
    return createSuccessResponse(response.data?.message ?? "Logout successful");
  } catch (error) {
    clearCurrentUser();
    return createFailedResponse(getErrorMessage(error, "Logout failed"));
  }
};

const changePassword = async ({
  currentPassword,
  newPassword,
  confirmNewPassword,
  confirmPassword,
}) => {
  try {
    const response = assertBackendSuccess(
      await apiClient.post("/v1/auth/change-password", {
        confirmNewPassword: confirmNewPassword ?? confirmPassword,
        currentPassword,
        newPassword,
      }),
      "Change password failed",
    );

    clearCurrentUser();
    return createSuccessResponse(
      response.data?.message ?? "Password changed successfully. Please log in again.",
      response.data?.data ?? null,
    );
  } catch (error) {
    return createFailedResponse(getChangePasswordErrorMessage(error));
  }
};

const updateCurrentProfile = async () => {
  return createFailedResponse("Profile update is not available from backend yet.", {
    errors: [],
  });
};

const forgotPassword = async ({ registeredEmail, username }) => {
  try {
    const response = assertBackendSuccess(
      await apiClient.post("/v1/password/forgot", { registeredEmail, username }),
      PASSWORD_RESET_GENERIC_MESSAGE,
    );
    return createSuccessResponse(
      response.data?.message ?? PASSWORD_RESET_GENERIC_MESSAGE,
      response.data?.data ?? { requestId: null },
    );
  } catch (error) {
    return createFailedResponse(
      getErrorMessage(error, PASSWORD_RESET_GENERIC_MESSAGE),
      { requestId: null },
    );
  }
};

const resetPassword = async ({ token, newPassword, confirmPassword }) => {
  if (newPassword !== confirmPassword) {
    return createFailedResponse("New password and confirmation password must match.");
  }

  try {
    const response = assertBackendSuccess(
      await apiClient.post("/v1/password/reset", {
        newPassword,
        token,
      }),
      "Reset password link is not valid.",
    );

    return createSuccessResponse(response.data?.message ?? "Password reset successfully.");
  } catch (error) {
    return createFailedResponse(
      getErrorMessage(error, "Reset password link is not valid."),
      { state: "invalid" },
    );
  }
};

const validatePasswordResetToken = async (token) => {
  return createSuccessResponse("Reset token validation is handled during reset.", {
    state: token ? "valid" : "invalid",
    token,
  });
};

const getMockEmails = async ({ requestId } = {}) => {
  const emails = await (async () => {
    try {
      const response = await apiClient.get("/v1/dev/email-outbox");
      return response.data?.data?.emails ?? [];
    } catch {
      return [];
    }
  })();

  const filteredEmails = requestId
    ? emails.filter((email) => email.requestId === requestId)
    : emails;

  return filteredEmails.sort((firstEmail, secondEmail) =>
    new Date(secondEmail.requestedAt ?? secondEmail.createdAt).getTime() -
    new Date(firstEmail.requestedAt ?? firstEmail.createdAt).getTime(),
  );
};

const getMockEmailDetail = async (emailId) => {
  try {
    const response = await apiClient.get(`/v1/dev/email-outbox/${emailId}`);
    return response.data?.data?.email ?? null;
  } catch {
    return null;
  }
};

const setCurrentUser = (currentUser) => {
  useAuthStore.getState().setAuthContext({
    ...getAuthState(),
    user: currentUser ? mapUserIdentity(currentUser) : null,
  });
};

export const AuthService = {
  changePassword,
  clearCurrentUser,
  forgotPassword,
  getActiveProject,
  getCurrentPermissions,
  getCurrentRole,
  getCurrentUser,
  getMe,
  getMockEmailDetail,
  getMockEmails,
  getOfficialRole,
  initialize,
  isAuthenticated,
  login,
  logout,
  refresh,
  resetPassword,
  setCurrentUser,
  subscribeCurrentUserChange,
  updateCurrentProfile,
  validatePasswordResetToken,
};

export default AuthService;
