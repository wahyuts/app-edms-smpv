import usersDataset from "@/mocks/users.json";

import {
  DEFAULT_USER_STATUS,
  ROLE_ID_BY_NAME,
  ROLE_NAME_BY_ID,
  USER_STATUSES,
} from "../constants/user.constants";
import {
  UserCredentialRepository,
  UserMetadataRepository,
  UserPersistenceRepository,
  UserRepository,
} from "../repositories/user.repository";

const USER_COMPATIBILITY_VERSION = 1;
const USER_COMPATIBILITY_VERSION_KEY = "userCompatibilityVersion";
const AUTH_SEED_COMPLETED_KEY = "authSeedCompleted";
const AUTH_SEED_VERSION_KEY = "authSeedVersion";

const cloneValue = (value) => JSON.parse(JSON.stringify(value));

export const normalizeUserRecord = (user = {}) => {
  const officialRole =
    user.officialRole ??
    ROLE_NAME_BY_ID[user.roleId] ??
    ROLE_NAME_BY_ID[Number(user.roleId)] ??
    "Document Owner";
  const roleId = user.roleId ?? ROLE_ID_BY_NAME[officialRole];
  const name = String(user.name ?? user.fullName ?? "").trim();
  const isActive = user.isActive ?? user.status !== USER_STATUSES.INACTIVE;
  const status = user.status ?? (isActive ? USER_STATUSES.ACTIVE : USER_STATUSES.INACTIVE);

  return {
    ...user,
    department: user.department ?? "Document Control",
    email: user.email ?? "",
    fullName: user.fullName ?? name,
    isActive: status === USER_STATUSES.ACTIVE,
    name: name || user.username,
    officialRole,
    roleId,
    status: status || DEFAULT_USER_STATUS,
    updatedAt: user.updatedAt ?? null,
  };
};

const buildSeedUsers = () =>
  cloneValue(usersDataset.users).map(normalizeUserRecord);

const buildSeedCredentials = () =>
  cloneValue(usersDataset.userCredentials).map((credential) => ({
    ...credential,
    isActive: credential.isActive ?? true,
  }));

const getMissingSeedCredentials = async () => {
  const seedCredentials = buildSeedCredentials();
  const availability = await Promise.all(
    seedCredentials.map(async (credential) => ({
      credential,
      exists: Boolean(
        await UserCredentialRepository.getByUserId(credential.userId),
      ),
    })),
  );

  return availability
    .filter((item) => !item.exists)
    .map((item) => item.credential);
};

const initialize = async () => {
  const users = await UserRepository.getAll();
  const compatibilityVersion = await UserMetadataRepository.getById(
    USER_COMPATIBILITY_VERSION_KEY,
  );
  const now = new Date().toISOString();

  if (
    users.length > 0 &&
    compatibilityVersion?.value === USER_COMPATIBILITY_VERSION
  ) {
    return { seeded: false, version: USER_COMPATIBILITY_VERSION };
  }

  const sourceUsers = users.length > 0 ? users : buildSeedUsers();
  const sourceCredentials = users.length > 0
    ? await getMissingSeedCredentials()
    : buildSeedCredentials();
  const normalizedUsers = sourceUsers.map(normalizeUserRecord);
  const metadata = [
    { key: USER_COMPATIBILITY_VERSION_KEY, value: USER_COMPATIBILITY_VERSION },
    { key: AUTH_SEED_VERSION_KEY, value: USER_COMPATIBILITY_VERSION },
    { key: AUTH_SEED_COMPLETED_KEY, value: true },
    { key: "userCompatibilityMigratedAt", value: now },
  ];

  await UserPersistenceRepository.runSeedMerge({
    credentials: sourceCredentials,
    metadata,
    users: normalizedUsers,
  });

  return {
    migrated: users.length > 0,
    seeded: users.length === 0,
    version: USER_COMPATIBILITY_VERSION,
  };
};

export const UserSeedService = {
  initialize,
  normalizeUserRecord,
};

export default UserSeedService;
