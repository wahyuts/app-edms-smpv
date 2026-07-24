import { USER_STATUSES, UserService } from "@/features/user-management";
import {
  AUDIT_RESOURCE_TYPE,
  AUDIT_TRAIL_ACTION,
  AuditTrailService,
} from "@/features/audit-trail";

import {
  MockEmailRepository,
  PasswordResetRepository,
  PasswordResetTokenRepository,
} from "../repositories/password-reset.repository";
import { AuthSeedService } from "./auth-seed.service";

const CURRENT_USER_STORAGE_KEY = "edms.currentUser";
const CURRENT_USER_CHANGED_EVENT = "edms.current-user.changed";
const PASSWORD_RESET_GENERIC_MESSAGE = [
  "If the account information is valid, a password reset link has been sent to the registered email address.",
  "",
  "Please check your inbox and follow the instructions to continue.",
].join("\n");
const PASSWORD_RESET_TOKEN_TTL_MINUTES = 15;

let initializationPromise = null;

const initialize = async () => {
  if (!initializationPromise) {
    initializationPromise = AuthSeedService.initialize().catch((error) => {
      initializationPromise = null;
      throw error;
    });
  }

  return initializationPromise;
};

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

const mapAuthenticatedUser = (user) => ({
  id: user.id,
  name: user.name,
  userCode: user.userCode,
  username: user.username,
  fullName: user.fullName,
  email: user.email,
  department: user.department,
  position: user.position,
  roleId: user.roleId,
  isActive: user.isActive,
  status: user.status,
});

const canUseStorage = () => (
  typeof window !== "undefined" && Boolean(window.localStorage)
);

const setCurrentUser = (currentUser) => {
  if (!canUseStorage()) return;
  window.localStorage.setItem(CURRENT_USER_STORAGE_KEY, JSON.stringify(currentUser));
  window.dispatchEvent(
    new CustomEvent(CURRENT_USER_CHANGED_EVENT, { detail: currentUser }),
  );
};

const clearCurrentUser = () => {
  if (!canUseStorage()) return;
  window.localStorage.removeItem(CURRENT_USER_STORAGE_KEY);
  window.dispatchEvent(
    new CustomEvent(CURRENT_USER_CHANGED_EVENT, { detail: null }),
  );
};

const getCurrentUser = () => {
  if (!canUseStorage()) return null;
  const storedCurrentUser = window.localStorage.getItem(CURRENT_USER_STORAGE_KEY);
  if (!storedCurrentUser) return null;

  try {
    return JSON.parse(storedCurrentUser);
  } catch {
    clearCurrentUser();
    return null;
  }
};

const getPersistentAccount = async (username) => {
  await initialize();
  const user = await UserService.getUserByUsername(username);
  const credential = user
    ? await UserService.getCredentialByUserId(user.id)
    : null;

  return { credential, user };
};

const normalizeText = (value) => String(value ?? "").trim();
const normalizeKey = (value) => normalizeText(value).toLowerCase();

const createEntityId = (prefix) => {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return `${prefix}-${crypto.randomUUID()}`;
  }
  return `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2)}`;
};

const createMockResetToken = () => createEntityId("mock-reset-token");

const createExpiresAt = (createdAt) => {
  const expiresAt = new Date(createdAt);
  expiresAt.setMinutes(expiresAt.getMinutes() + PASSWORD_RESET_TOKEN_TTL_MINUTES);
  return expiresAt.toISOString();
};

const mapTokenValidationState = ({
  credential,
  now = new Date(),
  tokenRecord,
  user,
}) => {
  if (!tokenRecord || !user) return "invalid";
  if (tokenRecord.revokedAt) return "invalid";
  if (tokenRecord.usedAt) return "used";
  if (new Date(tokenRecord.expiresAt).getTime() <= now.getTime()) return "expired";
  if (!user.isActive || credential?.isActive === false) return "invalid";
  return "valid";
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

const login = async ({ username, password }) => {
  const { credential, user } = await getPersistentAccount(username);

  if (!user || !credential || !user.isActive || !credential.isActive) {
    return createFailedResponse("Invalid username or password.");
  }
  if (credential.password !== password) {
    return createFailedResponse("Invalid username or password.");
  }

  const authenticatedUser = mapAuthenticatedUser(user);
  setCurrentUser(authenticatedUser);
  await AuditTrailService.recordActivitySafely({
    action: AUDIT_TRAIL_ACTION.LOGIN,
    actor: authenticatedUser,
    resourceId: authenticatedUser.id,
    resourceType: AUDIT_RESOURCE_TYPE.AUTHENTICATION,
  });
  return createSuccessResponse("Login success.", { user: authenticatedUser });
};

const changePassword = async ({
  username,
  currentPassword,
  newPassword,
  confirmPassword,
}) => {
  const { credential, user } = await getPersistentAccount(username);

  if (!user || !credential || !user.isActive || !credential.isActive) {
    return createFailedResponse("User account is not available.");
  }
  if (credential.password !== currentPassword) {
    return createFailedResponse("Current password is not valid.");
  }
  if (newPassword !== confirmPassword) {
    return createFailedResponse("New password and confirmation password must match.");
  }

  await UserService.updateUserPassword(user.id, {
    confirmPassword,
    newPassword,
  });
  await AuditTrailService.recordActivitySafely({
    action: AUDIT_TRAIL_ACTION.CHANGE_PASSWORD,
    actor: mapAuthenticatedUser(user),
    resourceId: user.id,
    resourceType: AUDIT_RESOURCE_TYPE.USER_PROFILE,
  });
  return createSuccessResponse("Password changed successfully.");
};

const updateCurrentProfile = async ({ email, fullName } = {}) => {
  const currentUser = getCurrentUser();

  if (!currentUser?.username) {
    return createFailedResponse("User session is not available.");
  }

  const { user } = await getPersistentAccount(currentUser.username);

  if (!user || !user.isActive) {
    return createFailedResponse("User account is not available.");
  }

  try {
    const updatedUser = await UserService.updateUser(user.id, {
      department: user.department,
      email: String(email ?? "").trim(),
      name: String(fullName ?? "").trim(),
      status: user.status ?? (user.isActive ? USER_STATUSES.ACTIVE : USER_STATUSES.INACTIVE),
      username: user.username,
    });
    const authenticatedUser = mapAuthenticatedUser(updatedUser);

    setCurrentUser(authenticatedUser);
    await AuditTrailService.recordActivitySafely({
      action: AUDIT_TRAIL_ACTION.EDIT_PROFILE,
      actor: authenticatedUser,
      resourceId: authenticatedUser.id,
      resourceType: AUDIT_RESOURCE_TYPE.USER_PROFILE,
    });

    return createSuccessResponse("Profile updated successfully.", {
      user: authenticatedUser,
    });
  } catch (error) {
    return createFailedResponse(
      error?.errors?.[0]?.message ?? error?.message ?? "Profile update failed.",
      { errors: error?.errors ?? [] },
    );
  }
};

const forgotPassword = async ({ email, username }) => {
  await initialize();
  const requestId = createEntityId("password-reset-request");
  const requestedUsername = normalizeText(username);
  const requestedEmail = normalizeText(email);
  const { credential, user } = await getPersistentAccount(requestedUsername);
  const isAccountMatch =
    Boolean(user) &&
    Boolean(credential) &&
    user.isActive &&
    credential.isActive &&
    normalizeKey(user.email) === normalizeKey(requestedEmail);

  if (!isAccountMatch) {
    return createSuccessResponse(PASSWORD_RESET_GENERIC_MESSAGE, {
      requestId,
    });
  }

  const now = new Date().toISOString();
  const token = createMockResetToken();
  const emailId = createEntityId("mock-email");
  const tokenRecord = {
    createdAt: now,
    expiresAt: createExpiresAt(now),
    requestId,
    revokedAt: null,
    token,
    usedAt: null,
    userId: user.id,
  };
  const mockEmail = {
    createdAt: now,
    from: "APP Engineering EDMS",
    id: emailId,
    requestId,
    subject: "Reset Your EDMS Password",
    to: user.email,
    token,
    userId: user.id,
    username: user.username,
  };

  await PasswordResetRepository.revokeActiveTokensForUser(user.id, now);
  await PasswordResetRepository.createRequest({
    email: mockEmail,
    tokenRecord,
  });
  await AuditTrailService.recordActivitySafely({
    action: AUDIT_TRAIL_ACTION.PASSWORD_RESET_REQUESTED,
    actor: mapAuthenticatedUser(user),
    metadata: {
      requestId,
      targetUsername: user.username,
    },
    projectId: null,
    resourceId: user.id,
    resourceType: AUDIT_RESOURCE_TYPE.AUTHENTICATION,
  });

  return createSuccessResponse(PASSWORD_RESET_GENERIC_MESSAGE, {
    requestId,
  });
};

const validatePasswordResetToken = async (token) => {
  await initialize();
  const tokenValue = normalizeText(token);
  if (!tokenValue) {
    return createSuccessResponse("Reset token validated.", { state: "invalid" });
  }

  const tokenRecord = await PasswordResetTokenRepository.getByToken(tokenValue);
  const user = tokenRecord
    ? await UserService.getUserDetail(tokenRecord.userId)
    : null;
  const credential = user
    ? await UserService.getCredentialByUserId(user.id)
    : null;

  return createSuccessResponse("Reset token validated.", {
    state: mapTokenValidationState({ credential, tokenRecord, user }),
    token: tokenValue,
  });
};

const resetPassword = async ({ token, newPassword, confirmPassword }) => {
  if (newPassword !== confirmPassword) {
    return createFailedResponse("New password and confirmation password must match.");
  }

  const tokenValue = normalizeText(token);
  const tokenRecord = await PasswordResetTokenRepository.getByToken(tokenValue);
  const user = tokenRecord
    ? await UserService.getUserDetail(tokenRecord.userId)
    : null;
  const credential = user
    ? await UserService.getCredentialByUserId(user.id)
    : null;
  const state = mapTokenValidationState({ credential, tokenRecord, user });

  if (state !== "valid" || !credential?.isActive) {
    return createFailedResponse("Reset password link is not valid.", { state });
  }

  await UserService.updateUserPassword(user.id, {
    confirmPassword,
    newPassword,
  });
  await PasswordResetTokenRepository.update({
    ...tokenRecord,
    usedAt: new Date().toISOString(),
  });
  await AuditTrailService.recordActivitySafely({
    action: AUDIT_TRAIL_ACTION.PASSWORD_RESET_COMPLETED,
    actor: mapAuthenticatedUser(user),
    metadata: {
      requestId: tokenRecord.requestId,
      targetUsername: user.username,
    },
    projectId: null,
    resourceId: user.id,
    resourceType: AUDIT_RESOURCE_TYPE.AUTHENTICATION,
  });
  return createSuccessResponse("Password reset successfully.");
};

const getMockEmails = async ({ requestId } = {}) => {
  const emails = await MockEmailRepository.getAll();
  const filteredEmails = requestId
    ? emails.filter((email) => email.requestId === requestId)
    : emails;

  return filteredEmails.sort((firstEmail, secondEmail) =>
    new Date(secondEmail.createdAt).getTime() - new Date(firstEmail.createdAt).getTime(),
  );
};

const getMockEmailDetail = async (emailId) => {
  const email = await MockEmailRepository.getById(emailId);
  return email ? JSON.parse(JSON.stringify(email)) : null;
};

const logout = async () => {
  const currentUser = getCurrentUser();
  clearCurrentUser();
  await AuditTrailService.recordActivitySafely({
    action: AUDIT_TRAIL_ACTION.LOGOUT,
    actor: currentUser,
    resourceId: currentUser?.id ?? null,
    resourceType: AUDIT_RESOURCE_TYPE.AUTHENTICATION,
  });
  return createSuccessResponse("Logout success.");
};

export const AuthService = {
  changePassword,
  clearCurrentUser,
  forgotPassword,
  getCurrentUser,
  getMockEmailDetail,
  getMockEmails,
  initialize,
  login,
  logout,
  resetPassword,
  setCurrentUser,
  subscribeCurrentUserChange,
  updateCurrentProfile,
  validatePasswordResetToken,
};

export default AuthService;
