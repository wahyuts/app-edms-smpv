import {
  EDMS_STORE,
  runEdmsTransaction,
  runStoreRequest,
} from "@/shared/services/indexeddb.service";

const cloneValue = (value) => JSON.parse(JSON.stringify(value));

const createRepository = (storeName) => ({
  clear: () => runStoreRequest(storeName, "readwrite", (store) => store.clear()),
  count: () => runStoreRequest(storeName, "readonly", (store) => store.count()),
  create: (record) => runStoreRequest(storeName, "readwrite", (store) => store.add(record)),
  delete: (id) => runStoreRequest(storeName, "readwrite", (store) => store.delete(id)),
  exists: async (id) => Boolean(await runStoreRequest(
    storeName,
    "readonly",
    (store) => store.getKey(id),
  )),
  getAll: async () => cloneValue(
    await runStoreRequest(storeName, "readonly", (store) => store.getAll()),
  ),
  getById: async (id) => (
    await runStoreRequest(storeName, "readonly", (store) => store.get(id))
  ) ?? null,
  getByProjectId: async (projectId) => cloneValue(
    await runStoreRequest(
      storeName,
      "readonly",
      (store) => store.index("projectId").getAll(projectId),
    ),
  ),
  getByProjectAndDocumentNumber: async ({ documentNumber, projectId }) => {
    const normalizedDocumentNumber = String(documentNumber ?? "").trim().toLowerCase();
    const projectDocuments = await runStoreRequest(
      storeName,
      "readonly",
      (store) => store.index("projectId").getAll(projectId),
    );

    return cloneValue(
      projectDocuments.filter((document) =>
        String(document.documentNumber ?? "").trim().toLowerCase() ===
          normalizedDocumentNumber,
      ),
    );
  },
  update: (record) => runStoreRequest(storeName, "readwrite", (store) => store.put(record)),
});

const createDocumentChildRepository = (storeName) => ({
  ...createRepository(storeName),
  deleteByDocument: async (documentId) => {
    const records = await runStoreRequest(
      storeName,
      "readonly",
      (store) => store.index("documentId").getAll(documentId),
    );

    await runEdmsTransaction([storeName], "readwrite", (stores) => {
      records.forEach((record) => stores[storeName].delete(record.id));
    });
  },
  getByDocument: () => {
    throw new Error("documentId is required.");
  },
});

const createIndexedChildRepository = (storeName) => {
  const repository = createDocumentChildRepository(storeName);

  return {
    ...repository,
    getByDocument: (documentId) => runStoreRequest(
      storeName,
      "readonly",
      (store) => store.index("documentId").getAll(documentId),
    ),
    getByDocumentAndProject: async ({ documentId, projectId }) => cloneValue(
      await runStoreRequest(
        storeName,
        "readonly",
        (store) => store.index("documentProject").getAll([documentId, projectId]),
      ),
    ),
  };
};

export const DocumentRepository = createRepository(EDMS_STORE.DOCUMENTS);
export const RevisionRepository = createIndexedChildRepository(
  EDMS_STORE.DOCUMENT_REVISIONS,
);
export const HistoryRepository = createIndexedChildRepository(
  EDMS_STORE.DOCUMENT_HISTORY,
);
export const WorkflowCommentRepository = createIndexedChildRepository(
  EDMS_STORE.WORKFLOW_COMMENTS,
);
export const CommentReadReceiptRepository = {
  ...createIndexedChildRepository(EDMS_STORE.COMMENT_READ_RECEIPTS),
  getByUserAndDocument: (userId, documentId) => runStoreRequest(
    EDMS_STORE.COMMENT_READ_RECEIPTS,
    "readonly",
    (store) => store.index("userDocument").getAll([userId, documentId]),
  ),
  markCommentsAsRead: ({ comments, documentId, projectId, readAt, userId }) =>
    runEdmsTransaction(
      [EDMS_STORE.COMMENT_READ_RECEIPTS],
      "readwrite",
      (stores) => {
        comments.forEach((comment) => {
          stores[EDMS_STORE.COMMENT_READ_RECEIPTS].put({
            commentId: comment.id,
            documentId,
            id: `${userId}:${comment.id}`,
            projectId,
            readAt,
            userId,
          });
        });
      },
    ),
};
export const MetadataRepository = createRepository(EDMS_STORE.METADATA);

export const DocumentPersistenceRepository = {
  runSlaFoundationMigration: ({ documents, metadata }) => runEdmsTransaction(
    [EDMS_STORE.DOCUMENTS, EDMS_STORE.METADATA],
    "readwrite",
    (stores) => {
      documents.forEach((document) => stores[EDMS_STORE.DOCUMENTS].put(document));
      stores[EDMS_STORE.METADATA].put(metadata);
    },
  ),
  clearDocumentData: () => runEdmsTransaction(
    [
      EDMS_STORE.DOCUMENTS,
      EDMS_STORE.DOCUMENT_REVISIONS,
      EDMS_STORE.DOCUMENT_HISTORY,
      EDMS_STORE.METADATA,
      EDMS_STORE.WORKFLOW_COMMENTS,
      EDMS_STORE.COMMENT_READ_RECEIPTS,
    ],
    "readwrite",
    (stores) => {
      stores[EDMS_STORE.DOCUMENTS].clear();
      stores[EDMS_STORE.DOCUMENT_REVISIONS].clear();
      stores[EDMS_STORE.DOCUMENT_HISTORY].clear();
      stores[EDMS_STORE.WORKFLOW_COMMENTS].clear();
      stores[EDMS_STORE.COMMENT_READ_RECEIPTS].clear();
      stores[EDMS_STORE.METADATA].delete("documentSeedVersion");
      stores[EDMS_STORE.METADATA].delete("documentSeedCompleted");
      stores[EDMS_STORE.METADATA].delete("slaFoundationMigrationVersion");
    },
  ),
  deleteDocumentGraph: async (documentId) => {
    const revisions = await RevisionRepository.getByDocument(documentId);
    const history = await HistoryRepository.getByDocument(documentId);
    const comments = await WorkflowCommentRepository.getByDocument(documentId);
    const readReceipts = await CommentReadReceiptRepository.getByDocument(documentId);

    await runEdmsTransaction(
      [
        EDMS_STORE.DOCUMENTS,
        EDMS_STORE.DOCUMENT_REVISIONS,
        EDMS_STORE.DOCUMENT_HISTORY,
        EDMS_STORE.WORKFLOW_COMMENTS,
        EDMS_STORE.COMMENT_READ_RECEIPTS,
      ],
      "readwrite",
      (stores) => {
        stores[EDMS_STORE.DOCUMENTS].delete(documentId);
        revisions.forEach((record) => stores[EDMS_STORE.DOCUMENT_REVISIONS].delete(record.id));
        history.forEach((record) => stores[EDMS_STORE.DOCUMENT_HISTORY].delete(record.id));
        comments.forEach((record) => stores[EDMS_STORE.WORKFLOW_COMMENTS].delete(record.id));
        readReceipts.forEach((record) =>
          stores[EDMS_STORE.COMMENT_READ_RECEIPTS].delete(record.id),
        );
      },
    );
  },
  runMutation: (operation) => runEdmsTransaction(
    [
      EDMS_STORE.DOCUMENTS,
      EDMS_STORE.DOCUMENT_REVISIONS,
      EDMS_STORE.DOCUMENT_HISTORY,
      EDMS_STORE.WORKFLOW_COMMENTS,
    ],
    "readwrite",
    operation,
  ),
  runSeed: (records) => runEdmsTransaction(
    [
      EDMS_STORE.DOCUMENTS,
      EDMS_STORE.DOCUMENT_REVISIONS,
      EDMS_STORE.DOCUMENT_HISTORY,
      EDMS_STORE.METADATA,
      EDMS_STORE.WORKFLOW_COMMENTS,
    ],
    "readwrite",
    (stores) => {
      records.documents.forEach((record) => stores[EDMS_STORE.DOCUMENTS].put(record));
      records.revisions.forEach((record) => stores[EDMS_STORE.DOCUMENT_REVISIONS].put(record));
      records.history.forEach((record) => stores[EDMS_STORE.DOCUMENT_HISTORY].put(record));
      records.comments.forEach((record) => stores[EDMS_STORE.WORKFLOW_COMMENTS].put(record));
      records.metadata.forEach((record) => stores[EDMS_STORE.METADATA].put(record));
    },
  ),
  runProjectContextMigration: ({ defaultProjectId, metadata }) => runEdmsTransaction(
    [
      EDMS_STORE.DOCUMENTS,
      EDMS_STORE.DOCUMENT_REVISIONS,
      EDMS_STORE.DOCUMENT_HISTORY,
      EDMS_STORE.WORKFLOW_COMMENTS,
      EDMS_STORE.COMMENT_READ_RECEIPTS,
      EDMS_STORE.NOTIFICATIONS,
      EDMS_STORE.AUDIT_TRAIL,
      EDMS_STORE.METADATA,
    ],
    "readwrite",
    (stores) => {
      [
        EDMS_STORE.DOCUMENTS,
        EDMS_STORE.DOCUMENT_REVISIONS,
        EDMS_STORE.DOCUMENT_HISTORY,
        EDMS_STORE.WORKFLOW_COMMENTS,
        EDMS_STORE.COMMENT_READ_RECEIPTS,
        EDMS_STORE.NOTIFICATIONS,
      ].forEach((storeName) => {
        const request = stores[storeName].getAll();
        request.onsuccess = () => {
          request.result
            .filter((record) => !record.projectId)
            .forEach((record) => {
              stores[storeName].put({ ...record, projectId: defaultProjectId });
            });
        };
      });

      const auditRequest = stores[EDMS_STORE.AUDIT_TRAIL].getAll();
      auditRequest.onsuccess = () => {
        auditRequest.result
          .filter((record) => !record.projectId && record.resourceType !== "Authentication")
          .forEach((record) => {
            stores[EDMS_STORE.AUDIT_TRAIL].put({
              ...record,
              projectId: defaultProjectId,
            });
          });
      };

      stores[EDMS_STORE.METADATA].put(metadata);
    },
  ),
};
