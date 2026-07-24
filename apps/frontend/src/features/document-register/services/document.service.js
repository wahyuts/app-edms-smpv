import { EDMS_STORE } from "@/shared/services/indexeddb.service";
import { getActiveProjectId } from "@/shared/stores/project-context.store";
import { AuthorizationService } from "@/shared/services/authorization.service";
import { AuthService } from "@/features/auth/services/auth.service";
import { SlaEngineService } from "@/features/sla-management/services/sla-engine.service";
import { SlaFoundationMigrationService } from "@/features/sla-management/services/sla-foundation-migration.service";
import { SlaResponsiblePartyResolverService } from "@/features/sla-management/services/sla-responsible-party-resolver.service";
import { ProjectService } from "@/features/project/services/project.service";
import { PROJECT_STATUS } from "@/features/project/constants/project.constants";
import {
  NOTIFICATION_EVENT_TYPE,
  NotificationService,
} from "@/features/notification";
import {
  AUDIT_RESOURCE_TYPE,
  AUDIT_TRAIL_ACTION,
  AuditTrailService,
} from "@/features/audit-trail";

import {
  ACTION_CODE,
  DOCUMENT_LIFECYCLE,
  DOCUMENT_LIFECYCLE_FILTER,
  DOCUMENT_ACTION_PERMISSION,
  DOCUMENT_REGISTER_PERMISSION,
  DOCUMENT_REVISION,
  DOCUMENT_STATUS,
  OFFICIAL_ROLE,
  RESPONSIBLE_ROLE,
  SLA_STATUS,
} from "../constants/document.constants";
import {
  DocumentPersistenceRepository,
  DocumentRepository,
  HistoryRepository,
  RevisionRepository,
  WorkflowCommentRepository,
} from "../repositories/document.repository";
import { DocumentSeedService } from "./document-seed.service";
import { FileService } from "./file.service";
import { WorkflowAttachmentService } from "./workflow-attachment.service";

const workflowTransitionMatrix = {
  [DOCUMENT_STATUS.PROCESS_REVIEW]: {
    [ACTION_CODE.APPROVAL_A]: DOCUMENT_STATUS.PROJECT_REVIEW,
    [ACTION_CODE.APPROVAL_B]: DOCUMENT_STATUS.PROCESS_COMMENT,
    [ACTION_CODE.APPROVAL_C]: DOCUMENT_STATUS.PROCESS_REJECT,
  },
  [DOCUMENT_STATUS.PROJECT_REVIEW]: {
    [ACTION_CODE.APPROVAL_A]: DOCUMENT_STATUS.APPROVED,
    [ACTION_CODE.APPROVAL_B]: DOCUMENT_STATUS.PROJECT_COMMENT,
    [ACTION_CODE.APPROVAL_C]: DOCUMENT_STATUS.PROJECT_REJECT,
  },
};

const uploadRevisionTransitionMatrix = {
  [DOCUMENT_STATUS.PROCESS_COMMENT]: DOCUMENT_STATUS.PROCESS_REVIEW,
  [DOCUMENT_STATUS.PROCESS_REJECT]: DOCUMENT_STATUS.PROCESS_REVIEW,
  [DOCUMENT_STATUS.PROJECT_COMMENT]: DOCUMENT_STATUS.PROJECT_REVIEW,
  [DOCUMENT_STATUS.PROJECT_REJECT]: DOCUMENT_STATUS.PROJECT_REVIEW,
};

const revisionTransitionMatrix = {
  [DOCUMENT_STATUS.PROJECT_REVIEW]: DOCUMENT_REVISION.IFA_SUBMITTED,
  [DOCUMENT_STATUS.PROCESS_COMMENT]: DOCUMENT_REVISION.IFR_SUBMITTED,
  [DOCUMENT_STATUS.PROCESS_REJECT]: DOCUMENT_REVISION.IFR_SUBMITTED,
  [DOCUMENT_STATUS.PROJECT_COMMENT]: DOCUMENT_REVISION.IFA_SUBMITTED,
  [DOCUMENT_STATUS.PROJECT_REJECT]: DOCUMENT_REVISION.IFA_SUBMITTED,
  [DOCUMENT_STATUS.APPROVED]: DOCUMENT_REVISION.AS_BUILT,
};

const responsibleRoleByStatus = {
  [DOCUMENT_STATUS.PROCESS_REVIEW]: "Team Process",
  [DOCUMENT_STATUS.PROCESS_COMMENT]: "Document Owner",
  [DOCUMENT_STATUS.PROCESS_REJECT]: "Document Owner",
  [DOCUMENT_STATUS.PROJECT_REVIEW]: "Team Project",
  [DOCUMENT_STATUS.PROJECT_COMMENT]: "Document Owner",
  [DOCUMENT_STATUS.PROJECT_REJECT]: "Document Owner",
  [DOCUMENT_STATUS.APPROVED]: "None",
};

const workflowCommentTitleByAction = {
  [ACTION_CODE.APPROVAL_B]: "Approval B To Document Owner",
  [ACTION_CODE.APPROVAL_C]: "Approval C To Document Owner",
};

const notificationEventTypeByWorkflowAction = {
  [ACTION_CODE.APPROVAL_A]: NOTIFICATION_EVENT_TYPE.APPROVAL_A_COMPLETED,
  [ACTION_CODE.APPROVAL_B]: NOTIFICATION_EVENT_TYPE.APPROVAL_B_COMPLETED,
  [ACTION_CODE.APPROVAL_C]: NOTIFICATION_EVENT_TYPE.APPROVAL_C_COMPLETED,
};

let initializationPromise = null;

const initialize = async () => {
  if (!initializationPromise) {
    initializationPromise = DocumentSeedService.initialize()
      .then(() => SlaFoundationMigrationService.initialize())
      .catch((error) => {
        initializationPromise = null;
        throw error;
      });
  }

  return initializationPromise;
};

const cloneValue = (value) => JSON.parse(JSON.stringify(value));
const getDocumentProjectId = (document) => document?.projectId ?? null;
const normalizeDocumentLifecycle = (document = {}) => ({
  ...document,
  lifecycle: Object.values(DOCUMENT_LIFECYCLE).includes(document.lifecycle)
    ? document.lifecycle
    : DOCUMENT_LIFECYCLE.ACTIVE,
});
const isArchivedDocument = (document) =>
  normalizeDocumentLifecycle(document).lifecycle === DOCUMENT_LIFECYCLE.ARCHIVED;

const getRequiredActiveProjectId = () => {
  const activeProjectId = getActiveProjectId();
  if (!activeProjectId) {
    throw new Error("Active Project is required.");
  }
  return activeProjectId;
};

const isDocumentInActiveProject = (document, activeProjectId = getActiveProjectId()) =>
  Boolean(activeProjectId) && getDocumentProjectId(document) === activeProjectId;

const assertDocumentInActiveProject = (document) => {
  if (!getDocumentProjectId(document)) {
    throw new Error("Document does not have Project Context.");
  }
  if (!isDocumentInActiveProject(document)) {
    throw new Error("Document does not belong to Active Project.");
  }
};

const assertActiveProjectAccess = async (projectId = getRequiredActiveProjectId()) =>
  ProjectService.assertCanAccessProject({
    projectId,
    user: AuthService.getCurrentUser(),
  });

const assertPermission = (permissionCode) => {
  if (permissionCode && !AuthorizationService.hasProjectPermission(permissionCode)) {
    throw new Error("Permission denied.");
  }
};

const assertProjectScopedRole = async ({
  allowedRoles,
  document,
  invalidRoleMessage = "Official Role is not valid for this Project action.",
  requiredRole,
}) => {
  const { membership } = await assertActiveProjectAccess(getDocumentProjectId(document));
  const roleOptions = allowedRoles?.length ? allowedRoles : requiredRole ? [requiredRole] : [];

  if (roleOptions.length > 0 && !roleOptions.includes(membership.officialRole)) {
    throw new Error(invalidRoleMessage);
  }

  return membership;
};

const getCurrentAssigneeForStatus = async ({ projectId, status }) => {
  const responsibleRole = responsibleRoleByStatus[status];
  if (!responsibleRole || responsibleRole === RESPONSIBLE_ROLE.NONE) return null;

  return ProjectService.resolveCurrentAssignee({
    officialRole: responsibleRole,
    projectId,
  });
};

const createEntityId = (prefix) => {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return `${prefix}-${crypto.randomUUID()}`;
  }
  return `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2)}`;
};

const reportNotificationConflict = (context, result) => {
  if (result?.conflict) {
    console.warn(`[Notification] ${context}: ${result.reason}`);
  }
};

const createWorkflowNotification = async (context, payload) => {
  const result = await NotificationService.createWorkflowNotification(payload);
  reportNotificationConflict(context, result);
  return result;
};

const normalizeWorkflowComment = (comment) => ({
  ...comment,
  attachment: WorkflowAttachmentService.normalizeAttachmentMetadata(comment?.attachment),
});

const normalizeFileMetadata = ({ documentId, fileId, isActive, metadata = {}, revisionId } = {}) => {
  const originalFileName = metadata.originalFileName ?? metadata.fileName ?? "";

  return {
    ...metadata,
    documentId: metadata.documentId ?? documentId,
    fileId: metadata.fileId ?? fileId ?? null,
    fileName: metadata.fileName ?? originalFileName,
    isActive: metadata.isActive ?? isActive,
    originalFileName,
    revisionId: metadata.revisionId ?? revisionId ?? null,
    storageType: metadata.storageType ?? "indexeddb",
  };
};

const normalizeDocumentFileState = (document) => ({
    ...normalizeDocumentLifecycle(document),
    fileHistory: (document.fileHistory ?? []).map((historyItem) => ({
      ...historyItem,
      fileMetadata: normalizeFileMetadata({
        documentId: document.id,
        fileId: historyItem.fileId,
        isActive: false,
        metadata: historyItem.fileMetadata,
        revisionId: historyItem.fileMetadata?.revisionId ?? document.revision,
      }),
    })),
    fileMetadata: normalizeFileMetadata({
      documentId: document.id,
      fileId: document.activeFileId,
      isActive: true,
      metadata: document.fileMetadata,
      revisionId: document.fileMetadata?.revisionId ?? document.revision,
    }),
});

const evaluateDocumentsWithResolvedSlaDisplay = async (documents, now) => {
  const normalizedDocuments = documents.map(normalizeDocumentFileState);
  const resolvedDocuments = await SlaResponsiblePartyResolverService.resolveDocuments(
    normalizedDocuments,
  );

  return resolvedDocuments.map((document) =>
    SlaEngineService.evaluate(document, now ?? new Date()),
  );
};

const buildFileMetadata = (uploadedFile, activeVersion = "1") => ({
  ...uploadedFile.metadata,
  activeVersion,
  isActive: true,
});

const DOCUMENT_NUMBER_DUPLICATE_MESSAGE =
  "Document Number sudah digunakan pada Project ini.";

const normalizeDocumentNumber = (documentNumber) =>
  String(documentNumber ?? "").trim();

const assertDocumentNumberIsUnique = async ({
  currentDocumentId = null,
  documentNumber,
  projectId,
}) => {
  if (!projectId) {
    throw new Error("Project Context is required for Document Number validation.");
  }

  const documents = await DocumentRepository.getByProjectAndDocumentNumber({
    documentNumber,
    projectId,
  });
  const isDuplicate = documents.some((document) =>
    document.id !== currentDocumentId,
  );

  if (isDuplicate) {
    throw new Error(DOCUMENT_NUMBER_DUPLICATE_MESSAGE);
  }
};

const normalizeSearchValue = (value) => String(value ?? "").trim().toLowerCase();
const getDocumentUpdatedAt = (document) => (
  document.lastUpdated ?? document.lastUpdatedAt ?? document.createdDate
);

const getSortableValue = (document, sortBy) => {
  if (sortBy === "slaTimer") {
    return document.slaTimer.totalMinutes;
  }
  return sortBy === "updatedAt" ? getDocumentUpdatedAt(document) : document[sortBy];
};

const compareValues = (firstValue, secondValue, direction) => {
  const multiplier = direction === "desc" ? -1 : 1;
  if (firstValue === secondValue) return 0;
  if (firstValue === null || firstValue === undefined) return 1;
  if (secondValue === null || secondValue === undefined) return -1;
  return firstValue > secondValue ? multiplier : -multiplier;
};

const parseTimestamp = (value) => {
  if (!value) return Number.NEGATIVE_INFINITY;

  const timestamp = new Date(value).getTime();
  return Number.isNaN(timestamp) ? Number.NEGATIVE_INFINITY : timestamp;
};

const getHistoryTimestamp = (historyRecord) => (
  historyRecord?.timestamp ??
  historyRecord?.createdDate ??
  historyRecord?.createdAt ??
  historyRecord?.eventTimestamp ??
  historyRecord?.eventAt
);

const getHistorySequence = (historyRecord) => {
  const sequence = Number(
    historyRecord?.sequence ??
    historyRecord?.historySequence ??
    historyRecord?.createdOrder,
  );

  return Number.isFinite(sequence) ? sequence : null;
};

const getHistoryIdTimestamp = (historyRecord) => {
  const idTimestamp = String(historyRecord?.id ?? "").match(/\d{10,}/)?.[0];
  const timestamp = Number(idTimestamp);

  return Number.isFinite(timestamp) ? timestamp : null;
};

const sortHistoryNewestFirst = (historyRecords = []) => (
  [...historyRecords]
    .map((record, sourceIndex) => ({ record, sourceIndex }))
    .sort((firstItem, secondItem) => {
      const timestampDiff =
        parseTimestamp(getHistoryTimestamp(secondItem.record)) -
        parseTimestamp(getHistoryTimestamp(firstItem.record));
      if (timestampDiff !== 0) return timestampDiff;

      const firstSequence = getHistorySequence(firstItem.record);
      const secondSequence = getHistorySequence(secondItem.record);
      if (firstSequence !== null || secondSequence !== null) {
        return (secondSequence ?? Number.NEGATIVE_INFINITY) -
          (firstSequence ?? Number.NEGATIVE_INFINITY);
      }

      const firstIdTimestamp = getHistoryIdTimestamp(firstItem.record);
      const secondIdTimestamp = getHistoryIdTimestamp(secondItem.record);
      if (firstIdTimestamp !== null || secondIdTimestamp !== null) {
        return (secondIdTimestamp ?? Number.NEGATIVE_INFINITY) -
          (firstIdTimestamp ?? Number.NEGATIVE_INFINITY);
      }

      if (firstItem.sourceIndex !== secondItem.sourceIndex) {
        return secondItem.sourceIndex - firstItem.sourceIndex;
      }

      return String(secondItem.record?.id ?? "").localeCompare(
        String(firstItem.record?.id ?? ""),
      );
    })
    .map(({ record }) => record)
);

const filterDocumentsByLifecycle = (documents, lifecycle = DOCUMENT_LIFECYCLE_FILTER.ACTIVE) => {
  if (lifecycle === DOCUMENT_LIFECYCLE_FILTER.ALL) return documents;
  if (lifecycle === DOCUMENT_LIFECYCLE_FILTER.ARCHIVED) {
    return documents.filter((document) => isArchivedDocument(document));
  }

  return documents.filter((document) => !isArchivedDocument(document));
};

const getDocumentsByLifecycle = async ({
  lifecycle = DOCUMENT_LIFECYCLE_FILTER.ACTIVE,
} = {}) => {
  await initialize();
  const activeProjectId = getRequiredActiveProjectId();
  await assertActiveProjectAccess(activeProjectId);
  const activeProjectDocuments = await DocumentRepository.getByProjectId(activeProjectId);
  const lifecycleDocuments = filterDocumentsByLifecycle(
    activeProjectDocuments.map(normalizeDocumentLifecycle),
    lifecycle,
  );

  return cloneValue(await evaluateDocumentsWithResolvedSlaDisplay(lifecycleDocuments));
};

const getDocuments = () => getDocumentsByLifecycle();

const getDocumentById = async (documentId) => {
  await initialize();
  const document = await DocumentRepository.getById(documentId);
  if (!document) return null;
  if (!getDocumentProjectId(document)) {
    throw new Error("Document does not have Project Context.");
  }
  if (!isDocumentInActiveProject(document)) return null;
  await assertActiveProjectAccess(getDocumentProjectId(document));

  const [evaluatedDocument] = await evaluateDocumentsWithResolvedSlaDisplay([document]);
  return cloneValue(evaluatedDocument);
};

const getDocumentsByDrawing = async (drawing, options = {}) => (
  (await getDocumentsByLifecycle(options)).filter((document) => document.drawing === drawing)
);

const getDocumentsByStatus = async (status) => (
  (await getDocuments()).filter((document) => document.status === status)
);

const createDocument = async ({
  area,
  createdBy = "Current User",
  daysUntilValidation = 0,
  description,
  documentNumber,
  drawing,
  file,
} = {}) => {
  await initialize();
  const activeProjectId = getRequiredActiveProjectId();
  const { membership: actorMembership } = await assertActiveProjectAccess(activeProjectId);
  assertPermission(DOCUMENT_REGISTER_PERMISSION.CREATE);
  const createdDate = new Date().toISOString();
  const normalizedDocumentNumber = normalizeDocumentNumber(documentNumber);
  const normalizedDaysUntilValidation = Number(daysUntilValidation) || 0;
  const documentId = createEntityId(`DOC-${drawing === "PFD" ? "PFD" : "PID"}`);
  const revisionId = createEntityId("REV");

  await assertDocumentNumberIsUnique({
    documentNumber: normalizedDocumentNumber,
    projectId: activeProjectId,
  });
  const currentAssignee = await getCurrentAssigneeForStatus({
    projectId: activeProjectId,
    status: DOCUMENT_STATUS.PROCESS_REVIEW,
  });
  if (!currentAssignee) {
    throw new Error("Current Assignee is not available for Active Project.");
  }

  const uploadedFile = await FileService.uploadDocumentFile({
    documentId,
    file,
    revisionId,
    uploadedBy: createdBy,
  });
  const documentBase = {
    id: documentId,
    projectId: activeProjectId,
    documentNumber: normalizedDocumentNumber,
    description,
    drawing,
    area,
    revision: DOCUMENT_REVISION.IFR_SUBMITTED,
    lifecycle: DOCUMENT_LIFECYCLE.ACTIVE,
    status: DOCUMENT_STATUS.PROCESS_REVIEW,
    responsibleRole: RESPONSIBLE_ROLE.TEAM_PROCESS,
    currentAssignee,
    daysUntilValidation: normalizedDaysUntilValidation,
    createdDate,
    createdBy,
    lastUpdated: createdDate,
    lastUpdatedBy: createdBy,
    activeFileId: uploadedFile.activeFileId,
    activeRevisionId: revisionId,
    fileHistory: [],
    fileMetadata: buildFileMetadata(uploadedFile),
    storagePath: uploadedFile.storagePath,
    ...SlaEngineService.createStatusEntry(
      { status: DOCUMENT_STATUS.PROCESS_REVIEW },
      DOCUMENT_STATUS.PROCESS_REVIEW,
      createdDate,
    ),
  };
  const nextDocument = SlaEngineService.evaluate(documentBase, createdDate);
  const revisionRecord = {
    activeFileId: uploadedFile.activeFileId,
    createdAt: createdDate,
    createdBy,
    documentId,
    id: revisionId,
    isActive: true,
    projectId: activeProjectId,
    revision: nextDocument.revision,
    storagePath: uploadedFile.storagePath,
  };
  const historyRecord = {
    id: createEntityId("DTL"),
    documentId,
    projectId: activeProjectId,
    workflowEvent: "Create Document Completed",
    activity: "Create Document",
    status: nextDocument.status,
    revision: nextDocument.revision,
    createdDate,
    createdBy,
    createdByOfficialRole: actorMembership.officialRole,
  };

  try {
    await DocumentPersistenceRepository.runMutation((stores) => {
      stores[EDMS_STORE.DOCUMENTS].add(nextDocument);
      stores[EDMS_STORE.DOCUMENT_REVISIONS].add(revisionRecord);
      stores[EDMS_STORE.DOCUMENT_HISTORY].add(historyRecord);
    });
  } catch (error) {
    await FileService.rollbackPreparedFile(uploadedFile).catch(() => {});
    throw error;
  }

  const [resolvedDocument] = await evaluateDocumentsWithResolvedSlaDisplay(
    [nextDocument],
    createdDate,
  );
  await createWorkflowNotification("Document Uploaded", {
    document: resolvedDocument,
    eventAt: createdDate,
    eventType: NOTIFICATION_EVENT_TYPE.DOCUMENT_UPLOADED,
    metadata: {
      workflowStatus: resolvedDocument.status,
    },
    officialRole: resolvedDocument.responsibleRole,
  });
  await AuditTrailService.recordActivitySafely({
    action: AUDIT_TRAIL_ACTION.UPLOAD_DOCUMENT,
    metadata: {
      drawing: resolvedDocument.drawing,
      revision: resolvedDocument.revision,
      status: resolvedDocument.status,
    },
    projectId: resolvedDocument.projectId,
    reference: resolvedDocument.documentNumber,
    resourceId: resolvedDocument.id,
    resourceType: AUDIT_RESOURCE_TYPE.DOCUMENT,
  });

  return cloneValue(resolvedDocument);
};

const searchDocuments = async (searchValue, documents) => {
  const sourceDocuments = documents ?? await getDocuments();
  const keyword = normalizeSearchValue(searchValue);
  if (!keyword) return cloneValue(sourceDocuments);
  const searchableFields = [
    "documentNumber", "description", "drawing", "area", "revision", "status",
    "currentAssignee", "slaStatus",
  ];
  return cloneValue(sourceDocuments.filter((document) =>
    searchableFields.some((fieldName) =>
      normalizeSearchValue(document[fieldName]).includes(keyword),
    ),
  ));
};

const sortDocuments = async (documents, { sortBy = "documentNumber", direction = "asc" } = {}) => {
  const sourceDocuments = documents ?? await getDocuments();
  return cloneValue([...sourceDocuments].sort((firstDocument, secondDocument) =>
    compareValues(
      getSortableValue(firstDocument, sortBy),
      getSortableValue(secondDocument, sortBy),
      direction,
    ),
  ));
};

const filterDocuments = async (documents, filters = {}) => {
  const sourceDocuments = documents ?? await getDocuments();
  return cloneValue(sourceDocuments.filter((document) =>
    Object.entries(filters).every(([fieldName, expectedValue]) => {
      if (expectedValue === undefined || expectedValue === null || expectedValue === "") return true;
      if (Array.isArray(expectedValue)) return expectedValue.includes(document[fieldName]);
      return document[fieldName] === expectedValue;
    }),
  ));
};

const updateDocument = async (documentId, updates = {}) => {
  await initialize();
  const currentDocument = await DocumentRepository.getById(documentId);
  if (!currentDocument) throw new Error("Document not found.");
  assertDocumentInActiveProject(currentDocument);
  if (isArchivedDocument(currentDocument)) {
    throw new Error("Archived Document cannot be edited.");
  }
  await assertActiveProjectAccess(getDocumentProjectId(currentDocument));
  assertPermission(DOCUMENT_REGISTER_PERMISSION.EDIT);

  const nextDocumentNumber = updates.documentNumber === undefined
    ? currentDocument.documentNumber
    : normalizeDocumentNumber(updates.documentNumber);

  await assertDocumentNumberIsUnique({
    currentDocumentId: documentId,
    documentNumber: nextDocumentNumber,
    projectId: getDocumentProjectId(currentDocument),
  });

  const updatedDocument = {
    ...currentDocument,
    area: updates.area ?? currentDocument.area,
    daysUntilValidation: updates.daysUntilValidation ?? currentDocument.daysUntilValidation,
    description: updates.description ?? currentDocument.description,
    documentNumber: nextDocumentNumber,
    lastUpdated: new Date().toISOString(),
    lastUpdatedBy: updates.updatedBy ?? "Current User",
  };
  const evaluatedDocument = SlaEngineService.evaluate(updatedDocument);
  await DocumentRepository.update(evaluatedDocument);
  const [resolvedDocument] = await evaluateDocumentsWithResolvedSlaDisplay([evaluatedDocument]);
  await AuditTrailService.recordActivitySafely({
    action: AUDIT_TRAIL_ACTION.EDIT_DOCUMENT,
    metadata: {
      revision: resolvedDocument.revision,
      status: resolvedDocument.status,
    },
    projectId: resolvedDocument.projectId,
    reference: resolvedDocument.documentNumber,
    resourceId: resolvedDocument.id,
    resourceType: AUDIT_RESOURCE_TYPE.DOCUMENT,
  });
  return cloneValue(resolvedDocument);
};

const archiveDocument = async (documentId, { reason = "" } = {}) => {
  await initialize();
  const currentDocument = await DocumentRepository.getById(documentId);
  if (!currentDocument) throw new Error("Document not found.");
  assertDocumentInActiveProject(currentDocument);
  const project = await ProjectService.getProjectById(getDocumentProjectId(currentDocument));
  if (project?.status !== PROJECT_STATUS.ACTIVE) {
    throw new Error("Archive hanya diperbolehkan pada Project Active.");
  }
  await assertActiveProjectAccess(getDocumentProjectId(currentDocument));
  assertPermission(DOCUMENT_REGISTER_PERMISSION.ARCHIVE);
  const actorMembership = await assertProjectScopedRole({
    allowedRoles: [OFFICIAL_ROLE.ADMIN],
    document: currentDocument,
    invalidRoleMessage: "Only Admin can Archive Document.",
  });

  if (currentDocument.status !== DOCUMENT_STATUS.APPROVED) {
    throw new Error("Only Approved Document can be archived.");
  }
  if (isArchivedDocument(currentDocument)) {
    throw new Error("Document is already archived.");
  }

  const archivedAt = new Date().toISOString();
  const actorName =
    AuthService.getCurrentUser()?.fullName ??
    AuthService.getCurrentUser()?.name ??
    AuthService.getCurrentUser()?.username ??
    "Current User";
  const normalizedReason = String(reason ?? "").trim();
  const archivedDocument = normalizeDocumentLifecycle({
    ...currentDocument,
    archivedAt,
    archivedBy: actorName,
    archiveReason: normalizedReason,
    lastUpdated: archivedAt,
    lastUpdatedBy: actorName,
    lifecycle: DOCUMENT_LIFECYCLE.ARCHIVED,
  });

  await DocumentPersistenceRepository.runMutation((stores) => {
    stores[EDMS_STORE.DOCUMENTS].put(archivedDocument);
    stores[EDMS_STORE.DOCUMENT_HISTORY].add({
      id: createEntityId("DTL"),
      activity: AUDIT_TRAIL_ACTION.DOCUMENT_ARCHIVED,
      createdBy: actorName,
      createdByOfficialRole: actorMembership.officialRole,
      createdDate: archivedAt,
      documentId,
      lifecycle: DOCUMENT_LIFECYCLE.ARCHIVED,
      projectId: getDocumentProjectId(currentDocument),
      reason: normalizedReason,
      revision: currentDocument.revision,
      status: currentDocument.status,
      workflowEvent: AUDIT_TRAIL_ACTION.DOCUMENT_ARCHIVED,
    });
  });

  await AuditTrailService.recordActivitySafely({
    action: AUDIT_TRAIL_ACTION.DOCUMENT_ARCHIVED,
    metadata: {
      lifecycle: DOCUMENT_LIFECYCLE.ARCHIVED,
      reason: normalizedReason,
      revision: archivedDocument.revision,
      status: archivedDocument.status,
    },
    projectId: archivedDocument.projectId,
    reference: archivedDocument.documentNumber,
    resourceId: archivedDocument.id,
    resourceType: AUDIT_RESOURCE_TYPE.DOCUMENT,
  });

  return cloneValue(archivedDocument);
};

const restoreDocument = async (documentId) => {
  await initialize();
  const currentDocument = await DocumentRepository.getById(documentId);
  if (!currentDocument) throw new Error("Document not found.");
  assertDocumentInActiveProject(currentDocument);
  const project = await ProjectService.getProjectById(getDocumentProjectId(currentDocument));
  if (project?.status !== PROJECT_STATUS.ACTIVE) {
    throw new Error("Restore hanya diperbolehkan pada Project Active.");
  }
  await assertActiveProjectAccess(getDocumentProjectId(currentDocument));
  assertPermission(DOCUMENT_REGISTER_PERMISSION.ARCHIVE);
  const actorMembership = await assertProjectScopedRole({
    allowedRoles: [OFFICIAL_ROLE.ADMIN],
    document: currentDocument,
    invalidRoleMessage: "Only Admin can Restore Document.",
  });

  if (!isArchivedDocument(currentDocument)) {
    throw new Error("Only Archived Document can be restored.");
  }

  const restoredAt = new Date().toISOString();
  const actorName =
    AuthService.getCurrentUser()?.fullName ??
    AuthService.getCurrentUser()?.name ??
    AuthService.getCurrentUser()?.username ??
    "Current User";
  const restoredDocument = normalizeDocumentLifecycle({
    ...currentDocument,
    archivedAt: null,
    archivedBy: null,
    archiveReason: "",
    lastUpdated: restoredAt,
    lastUpdatedBy: actorName,
    lifecycle: DOCUMENT_LIFECYCLE.ACTIVE,
    restoredAt,
    restoredBy: actorName,
  });

  await DocumentPersistenceRepository.runMutation((stores) => {
    stores[EDMS_STORE.DOCUMENTS].put(restoredDocument);
    stores[EDMS_STORE.DOCUMENT_HISTORY].add({
      id: createEntityId("DTL"),
      activity: AUDIT_TRAIL_ACTION.DOCUMENT_RESTORED,
      createdBy: actorName,
      createdByOfficialRole: actorMembership.officialRole,
      createdDate: restoredAt,
      documentId,
      lifecycle: DOCUMENT_LIFECYCLE.ACTIVE,
      projectId: getDocumentProjectId(currentDocument),
      revision: currentDocument.revision,
      status: currentDocument.status,
      workflowEvent: AUDIT_TRAIL_ACTION.DOCUMENT_RESTORED,
    });
  });

  await AuditTrailService.recordActivitySafely({
    action: AUDIT_TRAIL_ACTION.DOCUMENT_RESTORED,
    metadata: {
      lifecycle: DOCUMENT_LIFECYCLE.ACTIVE,
      revision: restoredDocument.revision,
      status: restoredDocument.status,
    },
    projectId: restoredDocument.projectId,
    reference: restoredDocument.documentNumber,
    resourceId: restoredDocument.id,
    resourceType: AUDIT_RESOURCE_TYPE.DOCUMENT,
  });

  return cloneValue(restoredDocument);
};

const getWorkflowCommentsByDocumentId = async (documentId) => {
  await initialize();
  const document = await DocumentRepository.getById(documentId);
  if (!document) return [];
  assertDocumentInActiveProject(document);
  await assertActiveProjectAccess(getDocumentProjectId(document));
  const comments = await WorkflowCommentRepository.getByDocumentAndProject({
    documentId,
    projectId: getDocumentProjectId(document),
  });
  return cloneValue(
    comments
      .map(normalizeWorkflowComment)
      .sort((firstComment, secondComment) =>
        new Date(secondComment.createdAt ?? secondComment.createdDate).getTime() -
        new Date(firstComment.createdAt ?? firstComment.createdDate).getTime(),
      ),
  );
};

const getDocumentTimelineByDocumentId = async (documentId) => {
  await initialize();
  const document = await DocumentRepository.getById(documentId);
  if (!document) return [];
  assertDocumentInActiveProject(document);
  await assertActiveProjectAccess(getDocumentProjectId(document));
  const historyRecords = await HistoryRepository.getByDocumentAndProject({
    documentId,
    projectId: getDocumentProjectId(document),
  });

  return cloneValue(sortHistoryNewestFirst(historyRecords));
};

const processWorkflowAction = async (
  documentId,
  workflowAction,
  {
    attachment = null,
    attachmentFile = null,
    comment = "",
    createdBy = "Current User",
  } = {},
) => {
  await initialize();
  const normalizedComment = comment.trim();
  const hasWorkflowAttachment = Boolean(attachmentFile || attachment);
  const supportsWorkflowAttachment = [
    ACTION_CODE.APPROVAL_B,
    ACTION_CODE.APPROVAL_C,
  ].includes(workflowAction);

  if (hasWorkflowAttachment && !supportsWorkflowAttachment) {
    throw new Error("Workflow Attachment is only supported for Approval B and Approval C.");
  }
  if (
    workflowAction === ACTION_CODE.APPROVAL_B &&
    !normalizedComment
  ) {
    throw new Error("Workflow Comment is required.");
  }
  const currentDocument = await DocumentRepository.getById(documentId);
  if (!currentDocument) throw new Error("Document not found.");
  assertDocumentInActiveProject(currentDocument);
  if (isArchivedDocument(currentDocument)) {
    throw new Error("Archived Document cannot run Workflow Action.");
  }
  const activeProjectId = getDocumentProjectId(currentDocument);
  const requiredRole = responsibleRoleByStatus[currentDocument.status];
  const actorMembership = await assertProjectScopedRole({
    document: currentDocument,
    requiredRole,
  });
  assertPermission(DOCUMENT_ACTION_PERMISSION[workflowAction]);
  const nextStatus = workflowTransitionMatrix[currentDocument.status]?.[workflowAction];
  if (!nextStatus) throw new Error("Workflow transition is not allowed.");
  const nextCurrentAssignee = await getCurrentAssigneeForStatus({
    projectId: activeProjectId,
    status: nextStatus,
  });
  if (nextStatus !== DOCUMENT_STATUS.APPROVED && !nextCurrentAssignee) {
    throw new Error("Current Assignee is not available for target Project status.");
  }

  const createdDate = new Date().toISOString();
  const previousSlaState = SlaEngineService.evaluate(currentDocument, createdDate);
  const nextRevision = revisionTransitionMatrix[nextStatus] ?? currentDocument.revision;
  const documentAfterTransition = {
    ...currentDocument,
    currentAssignee: nextCurrentAssignee,
    lastUpdated: createdDate,
    lastUpdatedBy: createdBy,
    revision: nextRevision,
    responsibleRole: responsibleRoleByStatus[nextStatus],
    status: nextStatus,
    ...SlaEngineService.createStatusEntry(currentDocument, nextStatus, createdDate),
  };
  const updatedDocument = SlaEngineService.evaluate(
    documentAfterTransition,
    createdDate,
  );
  const revisions = await RevisionRepository.getByDocument(documentId);
  const activeRevision = revisions.find((revision) => revision.isActive);
  const workflowCommentMessage = workflowAction === ACTION_CODE.APPROVAL_C
    ? normalizedComment || "Document is not approved"
    : normalizedComment;
  const shouldCreateWorkflowComment = Boolean(workflowCommentMessage || hasWorkflowAttachment);
  const workflowCommentId = shouldCreateWorkflowComment ? createEntityId("WFC") : null;
  const savedAttachment = attachmentFile
    ? await WorkflowAttachmentService.saveAttachment({
        commentId: workflowCommentId,
        documentId,
        file: attachmentFile,
        uploadedBy: createdBy,
      })
    : WorkflowAttachmentService.normalizeAttachmentMetadata(attachment);

  try {
    await DocumentPersistenceRepository.runMutation((stores) => {
      stores[EDMS_STORE.DOCUMENTS].put(updatedDocument);
      if (activeRevision) {
        stores[EDMS_STORE.DOCUMENT_REVISIONS].put({
          ...activeRevision,
          revision: nextRevision,
        });
      }
      if (shouldCreateWorkflowComment) {
        stores[EDMS_STORE.WORKFLOW_COMMENTS].add({
          id: workflowCommentId,
          attachment: savedAttachment,
          createdBy,
          createdByOfficialRole: actorMembership.officialRole,
          createdDate,
          documentId,
          projectId: activeProjectId,
          workflowAction: workflowCommentTitleByAction[workflowAction] ?? workflowAction,
          workflowComment: workflowCommentMessage,
        });
      }
      stores[EDMS_STORE.DOCUMENT_HISTORY].add({
        id: createEntityId("DTL"),
        documentId,
        projectId: activeProjectId,
        workflowEvent: `${workflowAction} Completed`,
        activity: workflowAction,
        status: nextStatus,
        revision: nextRevision,
        createdDate,
        createdBy,
        createdByOfficialRole: actorMembership.officialRole,
      });
    });
  } catch (error) {
    if (attachmentFile) {
      await WorkflowAttachmentService.deleteAttachment(savedAttachment).catch(() => {});
    }
    throw error;
  }

  const [resolvedDocument] = await evaluateDocumentsWithResolvedSlaDisplay(
    [updatedDocument],
    createdDate,
  );
  if (nextStatus !== DOCUMENT_STATUS.APPROVED) {
    await createWorkflowNotification(workflowAction, {
      document: resolvedDocument,
      eventAt: createdDate,
      eventType: notificationEventTypeByWorkflowAction[workflowAction],
      metadata: {
        previousStatus: currentDocument.status,
        workflowStatus: nextStatus,
      },
      officialRole: resolvedDocument.responsibleRole,
    });
  } else {
    await createWorkflowNotification("Document Approved", {
      document: resolvedDocument,
      eventAt: createdDate,
      eventType: NOTIFICATION_EVENT_TYPE.DOCUMENT_APPROVED,
      metadata: {
        identityBasis: resolvedDocument.activeRevisionId ?? createdDate,
        previousStatus: currentDocument.status,
        workflowStatus: nextStatus,
      },
      recipientOfficialRole: RESPONSIBLE_ROLE.DOCUMENT_OWNER,
    });
  }
  await AuditTrailService.recordActivitySafely({
    action: workflowAction,
    metadata: {
      nextStatus,
      previousStatus: currentDocument.status,
      revision: resolvedDocument.revision,
    },
    projectId: resolvedDocument.projectId,
    reference: resolvedDocument.documentNumber,
    resourceId: resolvedDocument.id,
    resourceType: AUDIT_RESOURCE_TYPE.DOCUMENT,
  });
  if (savedAttachment) {
    await AuditTrailService.recordActivitySafely({
      action: AUDIT_TRAIL_ACTION.WORKFLOW_ATTACHMENT,
      identityKey: [
        AUDIT_TRAIL_ACTION.WORKFLOW_ATTACHMENT,
        workflowCommentId,
        savedAttachment.storagePath ?? savedAttachment.fileId,
      ].join(":"),
      metadata: {
        attachmentName: savedAttachment.originalFileName ?? null,
        workflowAction,
      },
      projectId: resolvedDocument.projectId,
      reference: resolvedDocument.documentNumber,
      resourceId: savedAttachment.fileId ?? workflowCommentId,
      resourceType: AUDIT_RESOURCE_TYPE.WORKFLOW_ATTACHMENT,
    });
  }
  if (nextStatus === DOCUMENT_STATUS.APPROVED) {
    await AuditTrailService.recordActivitySafely({
      action: AUDIT_TRAIL_ACTION.DOCUMENT_APPROVED,
      identityKey: [
        AUDIT_TRAIL_ACTION.DOCUMENT_APPROVED,
        resolvedDocument.id,
        resolvedDocument.activeRevisionId,
      ].join(":"),
      metadata: {
        previousStatus: currentDocument.status,
        revision: resolvedDocument.revision,
      },
      projectId: resolvedDocument.projectId,
      reference: resolvedDocument.documentNumber,
      resourceId: resolvedDocument.id,
      resourceType: AUDIT_RESOURCE_TYPE.DOCUMENT,
    });
  }
  if (
    previousSlaState.slaStatus === SLA_STATUS.OVERDUE &&
    resolvedDocument.slaStatus !== SLA_STATUS.OVERDUE
  ) {
    await AuditTrailService.recordActivitySafely({
      action: AUDIT_TRAIL_ACTION.ESCALATION_RESOLVED,
      identityKey: [
        AUDIT_TRAIL_ACTION.ESCALATION_RESOLVED,
        resolvedDocument.id,
        previousSlaState.slaStartedAt ?? previousSlaState.lastUpdated ?? previousSlaState.createdDate,
        createdDate,
      ].join(":"),
      metadata: {
        nextStatus,
        previousStatus: currentDocument.status,
      },
      projectId: resolvedDocument.projectId,
      reference: resolvedDocument.documentNumber,
      resourceId: resolvedDocument.id,
      resourceType: AUDIT_RESOURCE_TYPE.ESCALATION,
    });
  }

  return cloneValue({ document: resolvedDocument, previousStatus: currentDocument.status, nextStatus });
};

const processUploadRevision = async (
  documentId,
  { area, createdBy = "Current User", daysUntilValidation, description, file } = {},
) => {
  await initialize();
  const currentDocument = await DocumentRepository.getById(documentId);
  if (!currentDocument) throw new Error("Document not found.");
  assertDocumentInActiveProject(currentDocument);
  if (isArchivedDocument(currentDocument)) {
    throw new Error("Archived Document cannot upload revision.");
  }
  const activeProjectId = getDocumentProjectId(currentDocument);
  assertPermission(DOCUMENT_REGISTER_PERMISSION.EDIT);
  const nextStatus = uploadRevisionTransitionMatrix[currentDocument.status];
  if (!nextStatus) throw new Error("Upload Revision tidak tersedia pada status Document saat ini.");
  const actorMembership = await assertProjectScopedRole({
    allowedRoles: [
      RESPONSIBLE_ROLE.DOCUMENT_OWNER,
      OFFICIAL_ROLE.ADMIN,
    ],
    document: currentDocument,
    invalidRoleMessage:
      "Official Role tidak memiliki hak untuk melakukan Upload Revision pada Project ini.",
  });
  const nextCurrentAssignee = await getCurrentAssigneeForStatus({
    projectId: activeProjectId,
    status: nextStatus,
  });
  if (!nextCurrentAssignee) {
    throw new Error("Current Assignee is not available for target Project status.");
  }

  const createdDate = new Date().toISOString();
  const previousSlaState = SlaEngineService.evaluate(currentDocument, createdDate);
  const currentFileHistory = currentDocument.fileHistory ?? [];
  const previousActiveFile = currentDocument.activeFileId || currentDocument.storagePath
    ? {
        activeVersion: currentDocument.fileMetadata?.activeVersion ?? String(currentFileHistory.length + 1),
        fileId: currentDocument.activeFileId,
        fileMetadata: { ...currentDocument.fileMetadata, isActive: false },
        storagePath: currentDocument.storagePath,
      }
    : null;
  const currentVersion = Number(
    currentDocument.fileMetadata?.activeVersion ?? currentFileHistory.length + 1,
  );
  const nextVersion = String(
    Number.isFinite(currentVersion) ? currentVersion + 1 : currentFileHistory.length + 2,
  );
  const revisionId = createEntityId("REV");
  const preparedFile = await FileService.prepareFileReplacement({
    documentId,
    file,
    revisionId,
    uploadedBy: createdBy,
  });
  const activeFile = await FileService.finalizeFileReplacement({
    previousFile: previousActiveFile,
    replacementFile: preparedFile,
  });
  const documentAfterTransition = {
    ...currentDocument,
    area: area ?? currentDocument.area,
    activeFileId: activeFile.activeFileId,
    activeRevisionId: revisionId,
    currentAssignee: nextCurrentAssignee,
    daysUntilValidation: daysUntilValidation ?? currentDocument.daysUntilValidation,
    description: description ?? currentDocument.description,
    fileHistory: previousActiveFile
      ? [...currentFileHistory, previousActiveFile]
      : currentFileHistory,
    fileMetadata: buildFileMetadata(activeFile, nextVersion),
    lastUpdated: createdDate,
    lastUpdatedBy: createdBy,
    responsibleRole: responsibleRoleByStatus[nextStatus],
    storagePath: activeFile.storagePath,
    status: nextStatus,
    ...SlaEngineService.createStatusEntry(currentDocument, nextStatus, createdDate),
  };
  const updatedDocument = SlaEngineService.evaluate(
    documentAfterTransition,
    createdDate,
  );
  const revisions = await RevisionRepository.getByDocument(documentId);

  try {
    await DocumentPersistenceRepository.runMutation((stores) => {
      stores[EDMS_STORE.DOCUMENTS].put(updatedDocument);
      revisions.filter((revision) => revision.isActive).forEach((revision) => {
        stores[EDMS_STORE.DOCUMENT_REVISIONS].put({ ...revision, isActive: false });
      });
      stores[EDMS_STORE.DOCUMENT_REVISIONS].add({
        activeFileId: activeFile.activeFileId,
        createdAt: createdDate,
        createdBy,
        documentId,
        id: revisionId,
        isActive: true,
        projectId: activeProjectId,
        revision: updatedDocument.revision,
        storagePath: activeFile.storagePath,
      });
      stores[EDMS_STORE.DOCUMENT_HISTORY].add({
        id: createEntityId("DTL"),
        documentId,
        projectId: activeProjectId,
        workflowEvent: "Upload Revision Completed",
        activity: "Upload Revision",
        status: nextStatus,
        revision: updatedDocument.revision,
        createdDate,
        createdBy,
        createdByOfficialRole: actorMembership.officialRole,
      });
    });
  } catch (error) {
    await FileService.rollbackFileReplacement({
      previousFile: previousActiveFile,
      replacementFile: activeFile,
    });
    throw error;
  }

  const [resolvedDocument] = await evaluateDocumentsWithResolvedSlaDisplay(
    [updatedDocument],
    createdDate,
  );
  await createWorkflowNotification("Upload Revision", {
    document: resolvedDocument,
    eventAt: createdDate,
    eventType: NOTIFICATION_EVENT_TYPE.REVISION_UPLOADED,
    metadata: {
      previousStatus: currentDocument.status,
      workflowStatus: nextStatus,
    },
    officialRole: resolvedDocument.responsibleRole,
  });
  await AuditTrailService.recordActivitySafely({
    action: AUDIT_TRAIL_ACTION.UPLOAD_REVISION,
    identityKey: [
      AUDIT_TRAIL_ACTION.UPLOAD_REVISION,
      resolvedDocument.id,
      revisionId,
    ].join(":"),
    metadata: {
      nextStatus,
      previousStatus: currentDocument.status,
      revision: resolvedDocument.revision,
    },
    projectId: resolvedDocument.projectId,
    reference: resolvedDocument.documentNumber,
    resourceId: resolvedDocument.id,
    resourceType: AUDIT_RESOURCE_TYPE.DOCUMENT,
  });
  if (
    previousSlaState.slaStatus === SLA_STATUS.OVERDUE &&
    resolvedDocument.slaStatus !== SLA_STATUS.OVERDUE
  ) {
    await AuditTrailService.recordActivitySafely({
      action: AUDIT_TRAIL_ACTION.ESCALATION_RESOLVED,
      identityKey: [
        AUDIT_TRAIL_ACTION.ESCALATION_RESOLVED,
        resolvedDocument.id,
        previousSlaState.slaStartedAt ?? previousSlaState.lastUpdated ?? previousSlaState.createdDate,
        revisionId,
      ].join(":"),
      metadata: {
        nextStatus,
        previousStatus: currentDocument.status,
      },
      projectId: resolvedDocument.projectId,
      reference: resolvedDocument.documentNumber,
      resourceId: resolvedDocument.id,
      resourceType: AUDIT_RESOURCE_TYPE.ESCALATION,
    });
  }

  return cloneValue({ document: resolvedDocument, previousStatus: currentDocument.status, nextStatus });
};

export const DocumentService = {
  archiveDocument,
  createDocument,
  filterDocuments,
  getDocumentById,
  getDocumentTimelineByDocumentId,
  getDocuments,
  getDocumentsByLifecycle,
  getDocumentsByDrawing,
  getDocumentsByStatus,
  getWorkflowCommentsByDocumentId,
  initialize,
  processUploadRevision,
  processWorkflowAction,
  restoreDocument,
  searchDocuments,
  sortDocuments,
  updateDocument,
};

export default DocumentService;
