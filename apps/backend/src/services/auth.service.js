const crypto = require('node:crypto');
const bcrypt = require('bcrypt');
const env = require('../config/env');
const {
  AUTH_TOKEN_TYPES,
  AUTH_MESSAGES,
} = require('../constants/auth.constants');
const authRepository = require('../repositories/auth.repository');
const authorizationService = require('./authorization.service');
const projectContextService = require('./projectContext.service');
const {
  generateAccessToken,
  generateRefreshToken,
  getExpiresAt,
  hashToken,
  verifyToken,
} = require('../utils/token');
const jwtConfig = require('../config/jwt');

const createAuthError = (message = AUTH_MESSAGES.UNAUTHENTICATED, statusCode = 401) => {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
};

const stripInternalUserFields = (user) => {
  const {
    passwordChangedAt,
    passwordChangedAtEpoch,
    permissions,
    role,
    ...publicUser
  } = user;
  return publicUser;
};

const isTokenIssuedBeforePasswordChange = (tokenIssuedAt, passwordChangedAtEpoch) => {
  if (!tokenIssuedAt || !passwordChangedAtEpoch) {
    return false;
  }

  const issuedAt = Number(tokenIssuedAt);
  const passwordChangedAt = Number(passwordChangedAtEpoch);

  return Number.isFinite(issuedAt) && Number.isFinite(passwordChangedAt) && issuedAt < passwordChangedAt;
};

const buildAuthPayload = async (user) => {
  const projectContext = await projectContextService.resolveProjectContext(user.id);
  const authorizedUser = await authorizationService.buildProjectAuthorizationContext(
    user,
    projectContext.officialRole
  );
  const publicUser = stripInternalUserFields(authorizedUser);

  return {
    user: publicUser,
    role: authorizedUser.role,
    permissions: authorizedUser.permissions,
    activeProject: projectContext.activeProject,
    activeMembership: projectContext.activeMembership,
    accessibleProjects: projectContext.accessibleProjects,
    officialRole: projectContext.officialRole,
  };
};

const login = async ({ username, password, deviceName, ipAddress }) => {
  const credential = await authRepository.findUserCredentialByUsername(username);

  if (!credential || credential.user.status !== 'Active' || !credential.credentialIsActive) {
    throw createAuthError(AUTH_MESSAGES.INVALID_CREDENTIALS);
  }

  const passwordMatches = await bcrypt.compare(password, credential.passwordHash);

  if (!passwordMatches) {
    throw createAuthError(AUTH_MESSAGES.INVALID_CREDENTIALS);
  }

  const refreshExpiresAt = getExpiresAt(jwtConfig.refreshTokenExpiresIn);
  const sessionId = crypto.randomUUID();
  const sessionFamilyId = crypto.randomUUID();
  const deviceId = crypto.randomUUID();
  const refreshToken = generateRefreshToken({
    userId: credential.user.id,
    sessionId,
  });
  const refreshTokenHash = hashToken(refreshToken);

  const session = await authRepository.createRefreshSession({
    sessionId,
    sessionFamilyId,
    deviceId,
    userId: credential.user.id,
    refreshTokenHash,
    expiresAt: refreshExpiresAt,
    deviceName,
    ipAddress,
  });
  const accessToken = generateAccessToken(credential.user.id);

  return {
    accessToken,
    refreshToken,
    accessTokenExpiresAt: getExpiresAt(jwtConfig.accessTokenExpiresIn),
    refreshTokenExpiresAt: refreshExpiresAt,
    ...(await buildAuthPayload(credential.user)),
  };
};

const getAuthenticatedUser = async (userId, tokenIssuedAt) => {
  const user = await authRepository.findActiveUserById(userId);

  if (!user) {
    throw createAuthError(AUTH_MESSAGES.UNAUTHENTICATED);
  }

  if (isTokenIssuedBeforePasswordChange(tokenIssuedAt, user.passwordChangedAtEpoch)) {
    throw createAuthError(AUTH_MESSAGES.UNAUTHENTICATED);
  }

  return buildAuthPayload(user);
};

const refresh = async ({ refreshToken, ipAddress }) => {
  let payload;

  try {
    payload = verifyToken(refreshToken, AUTH_TOKEN_TYPES.REFRESH);
  } catch (error) {
    throw createAuthError(AUTH_MESSAGES.INVALID_REFRESH_TOKEN);
  }

  const refreshTokenHash = hashToken(refreshToken);
  const session = await authRepository.findValidRefreshSession({
    sessionId: payload.sessionId,
    refreshTokenHash,
  });

  if (!session) {
    throw createAuthError(AUTH_MESSAGES.INVALID_REFRESH_TOKEN);
  }

  const user = await authRepository.findActiveUserById(session.user_id);

  if (!user) {
    throw createAuthError(AUTH_MESSAGES.UNAUTHENTICATED);
  }

  await authRepository.touchRefreshSession({
    sessionId: session.id,
    ipAddress,
  });

  const accessToken = generateAccessToken(user.id);

  return {
    accessToken,
    accessTokenExpiresAt: getExpiresAt(jwtConfig.accessTokenExpiresIn),
    ...(await buildAuthPayload(user)),
  };
};

const logout = async ({ refreshToken }) => {
  if (!refreshToken) {
    return { userId: null };
  }

  try {
    const payload = verifyToken(refreshToken, AUTH_TOKEN_TYPES.REFRESH);

    await authRepository.revokeRefreshSession({
      sessionId: payload.sessionId,
      refreshTokenHash: hashToken(refreshToken),
      reason: 'Logout',
    });

    return { userId: payload.sub };
  } catch (error) {
    return { userId: null };
  }
};

const changePassword = async ({ userId, currentPassword, newPassword }) => {
  const credential = await authRepository.findCredentialByUserId(userId);

  if (!credential || credential.userStatus !== 'Active' || !credential.credentialIsActive) {
    throw createAuthError(AUTH_MESSAGES.UNAUTHENTICATED);
  }

  const currentPasswordMatches = await bcrypt.compare(currentPassword, credential.passwordHash);

  if (!currentPasswordMatches) {
    throw createAuthError('Current password is incorrect');
  }

  const newPasswordMatchesCurrentHash = await bcrypt.compare(newPassword, credential.passwordHash);

  if (newPasswordMatchesCurrentHash) {
    throw createAuthError('New password must be different from current password', 400);
  }

  const passwordHash = await bcrypt.hash(newPassword, env.bcryptRounds);

  await authRepository.changePasswordAndRevokeSessions({
    userId,
    passwordHash,
  });

  return true;
};

module.exports = {
  createAuthError,
  login,
  getAuthenticatedUser,
  refresh,
  logout,
  changePassword,
};
