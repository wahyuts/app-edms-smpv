import { apiClient } from "@/shared/api";
import { queryClient } from "@/shared/api/query-client";

import {
  CURRENT_USER_CHANGED_EVENT,
  getAuthState,
  useAuthStore,
} from "../stores/auth.store";

const PASSWORD_RESET_GENERIC_MESSAGE =
  "Jika data akun valid, instruksi Reset Password telah dikirim.";
const LOGIN_MESSAGES = {
  invalidCredentials: "Username atau Password tidak benar.",
  passwordRequired: "Silakan masukkan Password Anda.",
  serverUnavailable: "Tidak dapat terhubung ke server.",
  sessionExpired: "Session telah berakhir.",
  usernameRequired: "Silakan masukkan Username Anda.",
};
const CHANGE_PASSWORD_MESSAGES = {
  currentPasswordIncorrect: "Current Password tidak benar.",
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
  const backendMessage = getErrorMessage(error, "Gagal mengubah Password.");

  if (backendMessage === "Current password is incorrect") {
    return CHANGE_PASSWORD_MESSAGES.currentPasswordIncorrect;
  }

  return backendMessage;
};

const getUpdateProfileErrorMessage = (error) => {
  const backendMessage = getErrorMessage(error, "Gagal memperbarui profil");

  if (backendMessage === "Email Sudah Digunakan") {
    return "Email sudah digunakan";
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
  status: user.status ?? (user.isActive ? "Active" : "Inactive"),
  userCode: user.userCode ?? "",
  username: user.username ?? "",
});

const mapAuthContext = (data = {}) => ({
  accessibleProjects: Array.isArray(data.accessibleProjects) ? data.accessibleProjects : [],
  activeMembership: data.activeMembership ?? null,
  activeProject: data.activeProject ?? null,
  permissions: Array.isArray(data.permissions) ? data.permissions : [],
  role: data.role ?? null,
  user: data.user ? mapUserIdentity(data.user) : null,
});

const isActiveProjectValid = ({ activeMembership, activeProject } = {}) =>
  Boolean(
    activeProject?.id &&
    activeProject.status === "Active" &&
    activeMembership?.id &&
    activeMembership.status === "Active",
  );

const maskProjectSelection = (context) => ({
  ...context,
  activeMembership: null,
  activeProject: null,
});

const setAuthContextFromResponse = (data = {}, options = {}) => {
  const backendContext = mapAuthContext(data);
  const requiredByOption = options.requireProjectSelection;
  const shouldRequireSelection = Boolean(
    backendContext.accessibleProjects.length > 0 &&
    (
      typeof requiredByOption === "boolean"
        ? requiredByOption
        : getAuthState().projectSelectionRequired
    ),
  );
  const context = shouldRequireSelection
    ? maskProjectSelection(backendContext)
    : backendContext;

  context.projectSelectionRequired = shouldRequireSelection;
  useAuthStore.getState().setAuthContext(context);
  return context;
};

const clearCurrentUser = () => {
  useAuthStore.getState().clearAuth();
  queryClient.clear();
};

const getCurrentUser = () => getAuthState().user;
const getCurrentRole = () => getAuthState().role;
const getCurrentPermissions = () => getAuthState().permissions;
const getAccessibleProjects = () => getAuthState().accessibleProjects;
const getActiveMembership = () => getAuthState().activeMembership;
const getActiveProject = () => getAuthState().activeProject;
const isProjectSelectionRequired = () => getAuthState().projectSelectionRequired;
const isAuthenticated = () => getAuthState().authenticated;
const hasValidActiveProject = () =>
  isActiveProjectValid({
    activeMembership: getActiveMembership(),
    activeProject: getActiveProject(),
  }) && !isProjectSelectionRequired();

const getPostAuthenticationDestination = () => {
  const accessibleProjects = getAccessibleProjects();

  if (accessibleProjects.length > 0 && !hasValidActiveProject()) {
    return "/select-project";
  }

  return "/dashboard";
};

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

const getMe = async (options = {}) => {
  const response = assertBackendSuccess(
    await apiClient.get("/v1/auth/me"),
    LOGIN_MESSAGES.sessionExpired,
  );
  const context = setAuthContextFromResponse(response.data?.data, options);

  return createSuccessResponse(response.data?.message ?? "Data User berhasil dimuat.", context);
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
    const meResponse = await getMe({ requireProjectSelection: true });

    return createSuccessResponse(
      loginResponse.data?.message ?? "Login berhasil.",
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
      "Logout gagal.",
    );
    clearCurrentUser();
    return createSuccessResponse(response.data?.message ?? "Logout berhasil.");
  } catch (error) {
    clearCurrentUser();
    return createFailedResponse(getErrorMessage(error, "Logout gagal."));
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
      "Gagal mengubah Password.",
    );

    clearCurrentUser();
    return createSuccessResponse(
      response.data?.message ?? "Password berhasil diubah. Login kembali.",
      response.data?.data ?? null,
    );
  } catch (error) {
    return createFailedResponse(getChangePasswordErrorMessage(error));
  }
};

const updateCurrentProfile = async ({ email, fullName, name } = {}) => {
  try {
    const response = assertBackendSuccess(
      await apiClient.patch("/v1/profile", {
        email,
        name: name ?? fullName,
      }),
      "Gagal memperbarui profil",
    );
    const refreshedProfile = await getMe();

    return createSuccessResponse(
      response.data?.message ?? "Profil berhasil diperbarui",
      {
        ...(response.data?.data ?? {}),
        user: refreshedProfile.data.user,
      },
    );
  } catch (error) {
    return createFailedResponse(
      getUpdateProfileErrorMessage(error),
      { errors: error?.response?.data?.errors ?? [] },
    );
  }
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
      "Link Reset Password tidak valid.",
    );

    return createSuccessResponse(response.data?.message ?? "Password berhasil direset.");
  } catch (error) {
    return createFailedResponse(
      getErrorMessage(error, "Link Reset Password tidak valid."),
      { state: "invalid" },
    );
  }
};

const validatePasswordResetToken = async (token) => {
  return createSuccessResponse("Token Reset Password divalidasi saat submit.", {
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
    accessibleProjects: getAuthState().accessibleProjects,
    activeMembership: getAuthState().activeMembership,
    ...getAuthState(),
    user: currentUser ? mapUserIdentity(currentUser) : null,
  });
};

const completeProjectSelection = async () => {
  return getMe({ requireProjectSelection: false });
};

export const AuthService = {
  changePassword,
  completeProjectSelection,
  clearCurrentUser,
  forgotPassword,
  getAccessibleProjects,
  getActiveMembership,
  getActiveProject,
  getCurrentPermissions,
  getCurrentRole,
  getCurrentUser,
  getMe,
  getMockEmailDetail,
  getMockEmails,
  getPostAuthenticationDestination,
  hasValidActiveProject,
  initialize,
  isAuthenticated,
  isProjectSelectionRequired,
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
