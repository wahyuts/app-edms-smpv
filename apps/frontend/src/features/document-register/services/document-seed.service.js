import documentsDataset from "@/mocks/documents.json";
import documentTimelinesDataset from "@/mocks/document-timelines.json";
import workflowCommentsDataset from "@/mocks/workflow-comments.json";

import {
  DocumentPersistenceRepository,
  MetadataRepository,
} from "../repositories/document.repository";

const DEFAULT_PROJECT_ID = "PRJ-APP-001";
const DOCUMENT_SEED_VERSION = 2;
const SEED_COMPLETED_KEY = "documentSeedCompleted";
const SEED_VERSION_KEY = "documentSeedVersion";

const cloneValue = (value) => JSON.parse(JSON.stringify(value));

const createSeedRevision = (document, sequence = 1, fileReference = null) => {
  const metadata = fileReference?.fileMetadata ?? document.fileMetadata ?? {};
  const fileId = fileReference?.fileId ?? document.activeFileId ?? metadata.fileId;

    return {
      projectId: document.projectId ?? DEFAULT_PROJECT_ID,
      activeFileId: fileId ?? null,
    createdAt: metadata.uploadedAt ?? document.createdDate,
    createdBy: metadata.uploadedBy ?? document.createdBy,
    documentId: document.id,
    id: metadata.revisionId ?? `REV-${document.id}-${String(sequence).padStart(3, "0")}`,
    isActive: fileReference === null,
    revision: document.revision,
    storagePath: fileReference?.storagePath ?? document.storagePath ?? null,
  };
};

const buildSeedRecords = () => {
  const documents = cloneValue(documentsDataset.documents).map((document) => ({
    ...document,
    projectId: document.projectId ?? DEFAULT_PROJECT_ID,
  }));
  const revisions = documents.flatMap((document) => {
    const historicalRevisions = (document.fileHistory ?? []).map((fileReference, index) =>
      createSeedRevision(document, index + 1, fileReference),
    );
    const activeRevision = createSeedRevision(
      document,
      historicalRevisions.length + 1,
    );

    activeRevision.isActive = true;
    document.activeRevisionId = activeRevision.id;
    document.fileMetadata = {
      ...document.fileMetadata,
      documentId: document.id,
      fileName:
        document.fileMetadata?.fileName ??
        document.fileMetadata?.originalFileName ??
        "",
      isActive: true,
      revisionId: activeRevision.id,
      storageType: document.fileMetadata?.storageType ?? "indexeddb",
    };
    historicalRevisions.forEach((revision) => {
      revision.isActive = false;
    });
    document.fileHistory = (document.fileHistory ?? []).map((fileReference, index) => ({
      ...fileReference,
      fileMetadata: {
        ...fileReference.fileMetadata,
        documentId: document.id,
        fileName:
          fileReference.fileMetadata?.fileName ??
          fileReference.fileMetadata?.originalFileName ??
          "",
        isActive: false,
        revisionId: historicalRevisions[index]?.id ?? null,
        storageType: fileReference.fileMetadata?.storageType ?? "indexeddb",
      },
    }));

    return [...historicalRevisions, activeRevision];
  });

  return {
    comments: cloneValue(workflowCommentsDataset.workflowComments).map((comment) => ({
      ...comment,
      attachment: comment.attachment ?? null,
      projectId: comment.projectId ?? DEFAULT_PROJECT_ID,
    })),
    documents,
    history: cloneValue(documentTimelinesDataset.documentTimelines).map((record) => ({
      ...record,
      projectId: record.projectId ?? DEFAULT_PROJECT_ID,
    })),
    metadata: [
      { key: SEED_VERSION_KEY, value: DOCUMENT_SEED_VERSION },
      { key: SEED_COMPLETED_KEY, value: true },
    ],
    revisions,
  };
};

const initialize = async () => {
  const completedMetadata = await MetadataRepository.getById(SEED_COMPLETED_KEY);
  const versionMetadata = await MetadataRepository.getById(SEED_VERSION_KEY);

  if (
    completedMetadata?.value === true &&
    versionMetadata?.value === DOCUMENT_SEED_VERSION
  ) {
    return { seeded: false, version: DOCUMENT_SEED_VERSION };
  }

  await DocumentPersistenceRepository.runSeed(buildSeedRecords());
  return { seeded: true, version: DOCUMENT_SEED_VERSION };
};

export const DocumentSeedService = {
  DOCUMENT_SEED_VERSION,
  SEED_COMPLETED_KEY,
  SEED_VERSION_KEY,
  buildSeedRecords,
  initialize,
};

export default DocumentSeedService;
