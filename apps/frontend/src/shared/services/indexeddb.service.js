export const EDMS_DATABASE_NAME = "edms-file-storage";
export const EDMS_DATABASE_VERSION = 10;

export const EDMS_STORE = {
  DOCUMENTS: "documents",
  DOCUMENT_REVISIONS: "documentRevisions",
  DOCUMENT_HISTORY: "documentHistory",
  FILES: "files",
  METADATA: "metadata",
  WORKFLOW_COMMENTS: "workflowComments",
  COMMENT_READ_RECEIPTS: "commentReadReceipts",
  NOTIFICATIONS: "notifications",
  USERS: "users",
  USER_CREDENTIALS: "userCredentials",
  DEPARTMENTS: "departments",
  AUDIT_TRAIL: "auditTrail",
  PROJECTS: "projects",
  PROJECT_MEMBERSHIPS: "projectMemberships",
  PASSWORD_RESET_TOKENS: "passwordResetTokens",
  MOCK_EMAILS: "mockEmails",
};

const createStore = (database, transaction, name, options, indexes = []) => {
  const store = database.objectStoreNames.contains(name)
    ? transaction.objectStore(name)
    : database.createObjectStore(name, options);

  indexes.forEach(({ keyPath, name: indexName, options: indexOptions }) => {
    if (!store.indexNames.contains(indexName)) {
      store.createIndex(indexName, keyPath, indexOptions);
    }
  });
};

export const openEdmsDatabase = () => {
  if (typeof window === "undefined" || !window.indexedDB) {
    return Promise.reject(new Error("Browser data storage is not available."));
  }

  return new Promise((resolve, reject) => {
    const request = window.indexedDB.open(
      EDMS_DATABASE_NAME,
      EDMS_DATABASE_VERSION,
    );

    request.onerror = () => reject(new Error("Unable to open browser data storage."));
    request.onblocked = () => reject(new Error("Browser data storage upgrade is blocked."));
    request.onupgradeneeded = () => {
      const database = request.result;
      const transaction = request.transaction;

      createStore(database, transaction, EDMS_STORE.FILES, { keyPath: "storagePath" });
      createStore(
        database,
        transaction,
        EDMS_STORE.DOCUMENTS,
        { keyPath: "id" },
        [{ keyPath: "projectId", name: "projectId", options: { unique: false } }],
      );
      createStore(
        database,
        transaction,
        EDMS_STORE.DOCUMENT_REVISIONS,
        { keyPath: "id" },
        [
          { keyPath: "documentId", name: "documentId", options: { unique: false } },
          { keyPath: "projectId", name: "projectId", options: { unique: false } },
          {
            keyPath: ["documentId", "projectId"],
            name: "documentProject",
            options: { unique: false },
          },
        ],
      );
      createStore(
        database,
        transaction,
        EDMS_STORE.DOCUMENT_HISTORY,
        { keyPath: "id" },
        [
          { keyPath: "documentId", name: "documentId", options: { unique: false } },
          { keyPath: "projectId", name: "projectId", options: { unique: false } },
          {
            keyPath: ["documentId", "projectId"],
            name: "documentProject",
            options: { unique: false },
          },
        ],
      );
      createStore(database, transaction, EDMS_STORE.METADATA, { keyPath: "key" });
      createStore(
        database,
        transaction,
        EDMS_STORE.WORKFLOW_COMMENTS,
        { keyPath: "id" },
        [
          { keyPath: "documentId", name: "documentId", options: { unique: false } },
          { keyPath: "projectId", name: "projectId", options: { unique: false } },
          {
            keyPath: ["documentId", "projectId"],
            name: "documentProject",
            options: { unique: false },
          },
        ],
      );
      createStore(
        database,
        transaction,
        EDMS_STORE.COMMENT_READ_RECEIPTS,
        { keyPath: "id" },
        [
          { keyPath: "documentId", name: "documentId", options: { unique: false } },
          {
            keyPath: ["userId", "documentId"],
            name: "userDocument",
            options: { unique: false },
          },
          { keyPath: "projectId", name: "projectId", options: { unique: false } },
        ],
      );
      createStore(
        database,
        transaction,
        EDMS_STORE.NOTIFICATIONS,
        { keyPath: "id" },
        [
          { keyPath: "recipientUserId", name: "recipientUserId", options: { unique: false } },
          { keyPath: "projectId", name: "projectId", options: { unique: false } },
          {
            keyPath: ["recipientUserId", "projectId"],
            name: "recipientProject",
            options: { unique: false },
          },
          { keyPath: "identityKey", name: "identityKey", options: { unique: true } },
        ],
      );
      createStore(
        database,
        transaction,
        EDMS_STORE.USERS,
        { keyPath: "id" },
        [{ keyPath: "username", name: "username", options: { unique: true } }],
      );
      createStore(
        database,
        transaction,
        EDMS_STORE.USER_CREDENTIALS,
        { keyPath: "userId" },
      );
      createStore(
        database,
        transaction,
        EDMS_STORE.DEPARTMENTS,
        { keyPath: "id" },
        [{ keyPath: "nameKey", name: "nameKey", options: { unique: true } }],
      );
      createStore(
        database,
        transaction,
        EDMS_STORE.AUDIT_TRAIL,
        { keyPath: "id" },
        [
          { keyPath: "identityKey", name: "identityKey", options: { unique: true } },
          { keyPath: "createdAt", name: "createdAt", options: { unique: false } },
          { keyPath: "action", name: "action", options: { unique: false } },
          { keyPath: "actorUserId", name: "actorUserId", options: { unique: false } },
          { keyPath: "projectId", name: "projectId", options: { unique: false } },
        ],
      );
      createStore(
        database,
        transaction,
        EDMS_STORE.PROJECTS,
        { keyPath: "id" },
        [{ keyPath: "projectCode", name: "projectCode", options: { unique: true } }],
      );
      createStore(
        database,
        transaction,
        EDMS_STORE.PROJECT_MEMBERSHIPS,
        { keyPath: "id" },
        [
          { keyPath: "userId", name: "userId", options: { unique: false } },
          { keyPath: "projectId", name: "projectId", options: { unique: false } },
          {
            keyPath: ["userId", "projectId", "officialRole"],
            name: "userProjectRole",
            options: { unique: false },
          },
        ],
      );
      createStore(
        database,
        transaction,
        EDMS_STORE.PASSWORD_RESET_TOKENS,
        { keyPath: "token" },
        [
          { keyPath: "userId", name: "userId", options: { unique: false } },
          { keyPath: "requestId", name: "requestId", options: { unique: false } },
        ],
      );
      createStore(
        database,
        transaction,
        EDMS_STORE.MOCK_EMAILS,
        { keyPath: "id" },
        [
          { keyPath: "requestId", name: "requestId", options: { unique: false } },
          { keyPath: "createdAt", name: "createdAt", options: { unique: false } },
        ],
      );
    };
    request.onsuccess = () => resolve(request.result);
  });
};

export const requestToPromise = (request) => {
  return new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new Error("IndexedDB request failed."));
  });
};

export const runEdmsTransaction = async (storeNames, mode, operation) => {
  const database = await openEdmsDatabase();

  return new Promise((resolve, reject) => {
    const transaction = database.transaction(storeNames, mode);
    const stores = Object.fromEntries(
      storeNames.map((storeName) => [storeName, transaction.objectStore(storeName)]),
    );
    let result;

    try {
      result = operation(stores, transaction);
    } catch (error) {
      transaction.abort();
      database.close();
      reject(error);
      return;
    }

    transaction.oncomplete = () => {
      database.close();
      resolve(result);
    };
    transaction.onerror = () => {
      database.close();
      reject(transaction.error ?? new Error("Browser data transaction failed."));
    };
    transaction.onabort = () => {
      database.close();
      reject(transaction.error ?? new Error("Browser data transaction was aborted."));
    };
  });
};

export const runStoreRequest = async (storeName, mode, operation) => {
  const database = await openEdmsDatabase();
  const transaction = database.transaction(storeName, mode);
  const completion = new Promise((resolve, reject) => {
    transaction.oncomplete = resolve;
    transaction.onerror = () => reject(
      transaction.error ?? new Error("Browser data transaction failed."),
    );
    transaction.onabort = () => reject(
      transaction.error ?? new Error("Browser data transaction was aborted."),
    );
  });
  const request = operation(transaction.objectStore(storeName));

  try {
    const result = await requestToPromise(request);
    await completion;
    return result;
  } finally {
    database.close();
  }
};
