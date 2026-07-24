import {
  EDMS_STORE,
  runEdmsTransaction,
  runStoreRequest,
} from "@/shared/services/indexeddb.service";

export const UserRepository = {
  create: (user) => runStoreRequest(
    EDMS_STORE.USERS,
    "readwrite",
    (store) => store.add(user),
  ),
  getAll: () => runStoreRequest(
    EDMS_STORE.USERS,
    "readonly",
    (store) => store.getAll(),
  ),
  getById: async (userId) => (
    await runStoreRequest(
      EDMS_STORE.USERS,
      "readonly",
      (store) => store.get(userId),
    )
  ) ?? null,
  getByUsername: async (username) => {
    const normalizedUsername = String(username ?? "").trim().toLowerCase();
    if (!normalizedUsername) return null;

    const users = await UserRepository.getAll();
    return users.find((user) =>
      String(user.username ?? "").trim().toLowerCase() === normalizedUsername,
    ) ?? null;
  },
  update: (user) => runStoreRequest(
    EDMS_STORE.USERS,
    "readwrite",
    (store) => store.put(user),
  ),
};

export const UserCredentialRepository = {
  create: (credential) => runStoreRequest(
    EDMS_STORE.USER_CREDENTIALS,
    "readwrite",
    (store) => store.add(credential),
  ),
  getByUserId: async (userId) => (
    await runStoreRequest(
      EDMS_STORE.USER_CREDENTIALS,
      "readonly",
      (store) => store.get(userId),
    )
  ) ?? null,
  update: (credential) => runStoreRequest(
    EDMS_STORE.USER_CREDENTIALS,
    "readwrite",
    (store) => store.put(credential),
  ),
};

export const UserMetadataRepository = {
  getById: async (key) => (
    await runStoreRequest(
      EDMS_STORE.METADATA,
      "readonly",
      (store) => store.get(key),
    )
  ) ?? null,
};

export const UserPersistenceRepository = {
  runMutation: (operation) => runEdmsTransaction(
    [EDMS_STORE.USERS, EDMS_STORE.USER_CREDENTIALS, EDMS_STORE.METADATA],
    "readwrite",
    operation,
  ),
  runSeedMerge: ({ credentials, metadata, users }) => runEdmsTransaction(
    [EDMS_STORE.USERS, EDMS_STORE.USER_CREDENTIALS, EDMS_STORE.METADATA],
    "readwrite",
    (stores) => {
      users.forEach((user) => {
        stores[EDMS_STORE.USERS].put(user);
      });
      credentials.forEach((credential) => {
        stores[EDMS_STORE.USER_CREDENTIALS].put(credential);
      });
      metadata.forEach((record) => {
        stores[EDMS_STORE.METADATA].put(record);
      });
    },
  ),
};

