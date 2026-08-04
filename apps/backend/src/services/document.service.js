const {
  DOCUMENT_DRAWINGS,
  DOCUMENT_LIFECYCLE_STATUS,
  DOCUMENT_MESSAGES,
  DOCUMENT_RESPONSIBLE_ROLE,
  DOCUMENT_REVISION_LABEL,
  DOCUMENT_WORKFLOW_STATUS,
  STORED_FILE_CATEGORY,
} = require('../constants/document.constants');
const { PROJECT_STATUS } = require('../constants/administration.constants');
const documentRepository = require('../repositories/document.repository');
const projectRepository = require('../repositories/project.repository');
const projectMembershipRepository = require('../repositories/projectMembership.repository');
const storageService = require('./storage.service');
const uploadService = require('./upload.service');
const notificationService = require('./notification.service');
const realtimeDocumentPublisher = require('./realtimeDocumentPublisher.service');
const slaNotificationProducer = require('./slaNotificationProducer.service');
const auditService = require('./audit.service');
const {
  buildPagination,
  createEntityId,
  createHttpError,
  mapDuplicateError,
  normalizeText,
  parseListQuery,
} = require('../utils/administration');
const {
  buildCanonicalPhysicalFileName,
  buildRevisionStorageKey,
} = require('../utils/storageKeyBuilder');

const parseDocumentRegisterQuery = (query = {}) => {
  const lifecycle = normalizeText(query.lifecycle);
  return {
    ...parseListQuery(query, {
      allowedSortBy: [
        'area',
        'createdAt',
        'createdDate',
        'currentAssignee',
        'daysUntilValidation',
        'documentNumber',
        'drawing',
        'lastUpdated',
        'revision',
        'status',
        'updatedAt',
      ],
      defaultSortBy: 'lastUpdated',
    }),
    area: normalizeText(query.area),
    currentAssigneeUserId: normalizeText(query.currentAssigneeUserId),
    drawing: DOCUMENT_DRAWINGS.includes(query.drawing) ? query.drawing : null,
    lifecycle: lifecycle === 'All' ? null : (
      Object.values(DOCUMENT_LIFECYCLE_STATUS).includes(lifecycle)
        ? lifecycle
        : DOCUMENT_LIFECYCLE_STATUS.ACTIVE
    ),
    projectId: normalizeText(query.projectId),
    revision: Object.values(DOCUMENT_REVISION_LABEL).includes(query.revision) ? query.revision : null,
    status: Object.values(DOCUMENT_WORKFLOW_STATUS).includes(query.status) ? query.status : null,
  };
};

const assertTemporaryUploadAvailable = async ({ actorUserId, temporaryFileId }) => (
  uploadService.assertTemporaryUploadConsumable({ actorUserId, temporaryFileId })
);

const resolveProjectId = ({ activeProject, payload }) => {
  return payload.projectId || activeProject?.id || null;
};

const assertActiveProject = async (projectId) => {
  if (!projectId) {
    throw createHttpError('Project Aktif Wajib Dipilih', 422, [
      { field: 'projectId', message: 'Project Aktif Wajib Dipilih' },
    ]);
  }

  const project = await projectRepository.findProjectById(projectId);
  if (!project) {
    throw createHttpError('Project Tidak Ditemukan', 404);
  }

  if (project.status !== PROJECT_STATUS.ACTIVE) {
    throw createHttpError('Project Harus Active', 422, [
      { field: 'projectId', message: 'Project Harus Active' },
    ]);
  }

  return project;
};

const resolveReadableProjectId = async ({ activeProject, queryProjectId, userId }) => {
  const projectId = queryProjectId || activeProject?.id || null;

  if (!projectId) {
    throw createHttpError('Project Aktif Wajib Dipilih', 422, [
      { field: 'projectId', message: 'Project Aktif Wajib Dipilih' },
    ]);
  }

  const membership = await projectMembershipRepository.findActiveMembershipByProjectAndUser({
    projectId,
    userId,
  });

  if (!membership) {
    throw createHttpError('User Tidak Memiliki Akses Project', 403);
  }

  return projectId;
};

const assertDocumentNumberUnique = async ({ documentNumber, projectId }) => {
  const existingDocument = await documentRepository.findDocumentByProjectAndNumber({
    documentNumber,
    projectId,
  });

  if (existingDocument) {
    throw createHttpError(DOCUMENT_MESSAGES.DUPLICATE_DOCUMENT, 409, [
      { field: 'documentNumber', message: DOCUMENT_MESSAGES.DUPLICATE_DOCUMENT },
    ]);
  }
};

const resolveRequiredCurrentAssignee = async ({ projectId, responsibleRole }) => {
  const membership = await projectMembershipRepository.findActiveMembershipByProjectAndOfficialRole({
    officialRole: responsibleRole,
    projectId,
  });

  if (!membership) {
    throw createHttpError('Current Assignee Tidak Tersedia Untuk Project Ini', 409, [
      { field: 'currentAssignee', message: 'Current Assignee Tidak Tersedia Untuk Project Ini' },
    ]);
  }

  return membership;
};

const createDocument = async ({ activeProject, actorOfficialRole, actorUserFullName, actorUserId, payload }) => {
  const projectId = resolveProjectId({ activeProject, payload });
  const project = await assertActiveProject(projectId);
  await assertDocumentNumberUnique({ documentNumber: payload.documentNumber, projectId });
  const initialAssignee = await resolveRequiredCurrentAssignee({
    projectId,
    responsibleRole: DOCUMENT_RESPONSIBLE_ROLE.TEAM_PROCESS,
  });

  const temporaryMetadata = await assertTemporaryUploadAvailable({
    actorUserId,
    temporaryFileId: payload.temporaryFileId,
  });
  const documentType = await documentRepository.findDocumentTypeByDrawing(payload.drawing);
  const documentId = createEntityId(payload.drawing === 'PFD' ? 'DOC-PFD' : 'DOC-PID');
  const revisionId = createEntityId('REV');
  const fileId = createEntityId('FILE');
  const revisionLabel = DOCUMENT_REVISION_LABEL.IFR_SUBMITTED;
  const submittedAt = new Date();
  const physicalFileName = buildCanonicalPhysicalFileName({
    documentNumber: payload.documentNumber,
    fileId,
    originalFileName: temporaryMetadata.originalFileName,
    revisionLabel,
    submittedAt,
  });
  const permanentStorageKey = buildRevisionStorageKey({
    documentNumber: payload.documentNumber,
    physicalFileName,
    projectCode: project.projectCode,
    revisionLabel,
  });

  let finalized = false;

  try {
    await documentRepository.runInTransaction(async (connection) => {
      await documentRepository.insertDocument(connection, {
        id: documentId,
        projectId,
        documentTypeId: documentType?.id || null,
        documentNumber: payload.documentNumber,
        description: payload.description,
        drawing: payload.drawing,
        area: payload.area,
        daysUntilValidation: payload.daysUntilValidation,
        workflowStatus: DOCUMENT_WORKFLOW_STATUS.PROCESS_REVIEW,
        lifecycleStatus: DOCUMENT_LIFECYCLE_STATUS.ACTIVE,
        revisionLabel,
        responsibleRole: DOCUMENT_RESPONSIBLE_ROLE.TEAM_PROCESS,
        currentAssigneeUserId: initialAssignee.userId,
        createdByUserId: actorUserId,
      });
      await documentRepository.insertStoredFile(connection, {
        fileId,
        projectId,
        documentId,
        originalFileName: temporaryMetadata.originalFileName,
        physicalFileName,
        extension: temporaryMetadata.extension,
        mimeType: temporaryMetadata.mimeType,
        fileSize: temporaryMetadata.fileSize,
        storageKey: permanentStorageKey,
        relativePath: permanentStorageKey,
        fileCategory: STORED_FILE_CATEGORY.REVISION_FILE,
        checksum: temporaryMetadata.checksum || null,
        uploadedByUserId: actorUserId,
        isActive: true,
      });
      await documentRepository.insertRevision(connection, {
        id: revisionId,
        projectId,
        documentId,
        revisionLabel,
        revisionSequence: 1,
        fileId,
        storagePathLegacy: permanentStorageKey,
        isActive: true,
        sourceStatus: null,
        resultStatus: DOCUMENT_WORKFLOW_STATUS.PROCESS_REVIEW,
        createdByUserId: actorUserId,
      });
      await documentRepository.updateDocumentActivePointers(connection, {
        activeFileId: fileId,
        activeRevisionId: revisionId,
        documentId,
        updatedByUserId: actorUserId,
      });
      await documentRepository.insertDocumentHistory(connection, {
        id: createEntityId('DTH'),
        projectId,
        documentId,
        workflowEvent: 'Upload Document',
        activity: 'Upload Document',
        workflowStatus: DOCUMENT_WORKFLOW_STATUS.PROCESS_REVIEW,
        revisionLabel,
        lifecycleStatus: DOCUMENT_LIFECYCLE_STATUS.ACTIVE,
        reason: null,
        createdByUserId: actorUserId,
        createdByNameSnapshot: actorUserFullName || null,
        createdByOfficialRoleSnapshot: actorOfficialRole || DOCUMENT_RESPONSIBLE_ROLE.DOCUMENT_OWNER,
      });

      const consumedRows = await uploadService.consumeTemporaryUploadMetadata(connection, payload.temporaryFileId);
      if (consumedRows !== 1) {
        throw createHttpError(DOCUMENT_MESSAGES.TEMPORARY_NOT_FOUND, 409, [
          { field: 'temporaryFileId', message: DOCUMENT_MESSAGES.TEMPORARY_NOT_FOUND },
        ]);
      }
      await storageService.finalize(temporaryMetadata.storageKey, permanentStorageKey);
      finalized = true;
    });
  } catch (error) {
    if (finalized) {
      await storageService.delete(permanentStorageKey).catch(() => {});
    }

    const duplicateError = mapDuplicateError(error, DOCUMENT_MESSAGES.DUPLICATE_DOCUMENT, 'documentNumber');
    throw duplicateError || error;
  }

  const createdDocument = await documentRepository.findDocumentRegisterById(documentId);
  await notificationService.createDocumentNotificationsForOfficialRoles({
    document: {
      ...createdDocument,
      currentAssigneeUserId: initialAssignee.userId,
      responsibleRole: DOCUMENT_RESPONSIBLE_ROLE.TEAM_PROCESS,
      status: DOCUMENT_WORKFLOW_STATUS.PROCESS_REVIEW,
    },
    eventType: notificationService.NOTIFICATION_EVENT_TYPE.DOCUMENT_UPLOADED,
    officialRoles: [DOCUMENT_RESPONSIBLE_ROLE.TEAM_PROCESS],
  });
  await slaNotificationProducer.evaluateDocumentForSlaNotifications({
    document: createdDocument,
    triggerSource: 'document_create',
  });
  await auditService.recordActivitySafely({
    action: 'Upload Document',
    actorOfficialRole,
    actorUserFullName,
    actorUserId,
    projectId: createdDocument.projectId,
    reference: createdDocument.documentNumber,
    resourceId: createdDocument.id,
    resourceType: 'Document',
  });
  realtimeDocumentPublisher.publishDocumentCreated({
    actorUserId,
    document: createdDocument,
  });

  return createdDocument;
};

const assertActorMembership = async ({ projectId, userId }) => {
  const membership = await projectMembershipRepository.findActiveMembershipByProjectAndUser({
    projectId,
    userId,
  });

  if (!membership) {
    throw createHttpError('User Tidak Memiliki Akses Project', 403);
  }

  return membership;
};

const assertDocumentProjectIsActive = async (document) => assertActiveProject(document.projectId);

const updateDocument = async ({
  actorOfficialRole,
  actorUserFullName,
  actorUserId,
  documentId,
  payload,
}) => {
  const document = await getDocumentDetail({ documentId, userId: actorUserId });

  await assertDocumentProjectIsActive(document);
  if (document.lifecycle !== DOCUMENT_LIFECYCLE_STATUS.ACTIVE) {
    throw createHttpError('Archived Document Tidak Dapat Diedit', 409);
  }

  const membership = await assertActorMembership({
    projectId: document.projectId,
    userId: actorUserId,
  });
  if (![DOCUMENT_RESPONSIBLE_ROLE.DOCUMENT_OWNER, 'Admin'].includes(membership.officialRole)) {
    throw createHttpError('Official Role Tidak Sesuai Untuk Edit Document', 403);
  }

  const nextDrawing = payload.drawing ?? document.drawing;
  const documentType = await documentRepository.findDocumentTypeByDrawing(nextDrawing);
  const nextMetadata = {
    area: payload.area ?? document.area,
    daysUntilValidation: payload.daysUntilValidation ?? document.daysUntilValidation,
    description: payload.description ?? document.description,
    documentTypeId: documentType?.id || document.documentTypeId || null,
    drawing: nextDrawing,
  };

  await documentRepository.runInTransaction(async (connection) => {
    await documentRepository.updateDocumentMetadata(connection, {
      ...nextMetadata,
      documentId: document.id,
      updatedByUserId: actorUserId,
    });
    await documentRepository.insertDocumentHistory(connection, {
      id: createEntityId('DTH'),
      projectId: document.projectId,
      documentId: document.id,
      workflowEvent: 'Document Updated',
      activity: 'Edit Document',
      workflowStatus: document.status,
      revisionLabel: document.revision,
      lifecycleStatus: document.lifecycle,
      reason: null,
      createdByUserId: actorUserId,
      createdByNameSnapshot: actorUserFullName || null,
      createdByOfficialRoleSnapshot: actorOfficialRole || membership.officialRole,
    });
  });

  const updatedDocument = await documentRepository.findDocumentRegisterById(document.id);
  if (payload.daysUntilValidation !== undefined) {
    await slaNotificationProducer.evaluateDocumentForSlaNotifications({
      document: updatedDocument,
      triggerSource: 'days_until_validation_update',
    });
  }
  await auditService.recordActivitySafely({
    action: 'Edit Document',
    actorOfficialRole,
    actorUserFullName,
    actorUserId,
    metadata: {
      fields: Object.keys(payload),
      revision: updatedDocument.revision,
      status: updatedDocument.status,
    },
    projectId: updatedDocument.projectId,
    reference: updatedDocument.documentNumber,
    resourceId: updatedDocument.id,
    resourceType: 'Document',
  });
  realtimeDocumentPublisher.publishDocumentUpdated({
    actorUserId,
    document: updatedDocument,
    reason: payload.daysUntilValidation !== undefined
      ? 'document_updated_days_until_validation'
      : 'document_updated',
  });

  return updatedDocument;
};

const archiveDocument = async ({
  actorOfficialRole,
  actorUserFullName,
  actorUserId,
  documentId,
  payload = {},
}) => {
  const document = await getDocumentDetail({ documentId, userId: actorUserId });

  await assertDocumentProjectIsActive(document);
  const membership = await assertActorMembership({
    projectId: document.projectId,
    userId: actorUserId,
  });
  if (membership.officialRole !== 'Admin') {
    throw createHttpError('Only Admin can Archive Document', 403);
  }
  if (document.lifecycle !== DOCUMENT_LIFECYCLE_STATUS.ACTIVE) {
    throw createHttpError('Document sudah Archived', 409);
  }
  if (document.status !== DOCUMENT_WORKFLOW_STATUS.APPROVED) {
    throw createHttpError('Only Approved Document can be archived', 422, [
      { field: 'status', message: 'Only Approved Document can be archived' },
    ]);
  }

  await documentRepository.runInTransaction(async (connection) => {
    await documentRepository.updateDocumentLifecycleStatus(connection, {
      archiveReason: payload.reason,
      documentId: document.id,
      lifecycleStatus: DOCUMENT_LIFECYCLE_STATUS.ARCHIVED,
      updatedByUserId: actorUserId,
    });
    await documentRepository.insertDocumentHistory(connection, {
      id: createEntityId('DTH'),
      projectId: document.projectId,
      documentId: document.id,
      workflowEvent: 'Document Archived',
      activity: 'Document Archived',
      workflowStatus: document.status,
      revisionLabel: document.revision,
      lifecycleStatus: DOCUMENT_LIFECYCLE_STATUS.ARCHIVED,
      reason: payload.reason || null,
      createdByUserId: actorUserId,
      createdByNameSnapshot: actorUserFullName || null,
      createdByOfficialRoleSnapshot: actorOfficialRole || membership.officialRole,
    });
  });

  const archivedDocument = await documentRepository.findDocumentRegisterById(document.id);
  await auditService.recordActivitySafely({
    action: 'Document Archived',
    actorOfficialRole,
    actorUserFullName,
    actorUserId,
    metadata: {
      lifecycle: archivedDocument.lifecycle,
      reason: payload.reason || null,
      revision: archivedDocument.revision,
      status: archivedDocument.status,
    },
    projectId: archivedDocument.projectId,
    reference: archivedDocument.documentNumber,
    resourceId: archivedDocument.id,
    resourceType: 'Document',
  });
  realtimeDocumentPublisher.publishDocumentArchived({
    actorUserId,
    document: archivedDocument,
  });

  return archivedDocument;
};

const restoreDocument = async ({
  actorOfficialRole,
  actorUserFullName,
  actorUserId,
  documentId,
}) => {
  const document = await getDocumentDetail({ documentId, userId: actorUserId });

  await assertDocumentProjectIsActive(document);
  const membership = await assertActorMembership({
    projectId: document.projectId,
    userId: actorUserId,
  });
  if (membership.officialRole !== 'Admin') {
    throw createHttpError('Only Admin can Restore Document', 403);
  }
  if (document.lifecycle !== DOCUMENT_LIFECYCLE_STATUS.ARCHIVED) {
    throw createHttpError('Only Archived Document can be restored', 422, [
      { field: 'lifecycle', message: 'Only Archived Document can be restored' },
    ]);
  }

  await documentRepository.runInTransaction(async (connection) => {
    await documentRepository.updateDocumentLifecycleStatus(connection, {
      documentId: document.id,
      lifecycleStatus: DOCUMENT_LIFECYCLE_STATUS.ACTIVE,
      updatedByUserId: actorUserId,
    });
    await documentRepository.insertDocumentHistory(connection, {
      id: createEntityId('DTH'),
      projectId: document.projectId,
      documentId: document.id,
      workflowEvent: 'Document Restored',
      activity: 'Document Restored',
      workflowStatus: document.status,
      revisionLabel: document.revision,
      lifecycleStatus: DOCUMENT_LIFECYCLE_STATUS.ACTIVE,
      reason: null,
      createdByUserId: actorUserId,
      createdByNameSnapshot: actorUserFullName || null,
      createdByOfficialRoleSnapshot: actorOfficialRole || membership.officialRole,
    });
  });

  const restoredDocument = await documentRepository.findDocumentRegisterById(document.id);
  await auditService.recordActivitySafely({
    action: 'Document Restored',
    actorOfficialRole,
    actorUserFullName,
    actorUserId,
    metadata: {
      lifecycle: restoredDocument.lifecycle,
      revision: restoredDocument.revision,
      status: restoredDocument.status,
    },
    projectId: restoredDocument.projectId,
    reference: restoredDocument.documentNumber,
    resourceId: restoredDocument.id,
    resourceType: 'Document',
  });
  realtimeDocumentPublisher.publishDocumentRestored({
    actorUserId,
    document: restoredDocument,
  });

  return restoredDocument;
};

const listDocuments = async ({ activeProject, query, userId }) => {
  const listQuery = parseDocumentRegisterQuery(query);
  const projectId = await resolveReadableProjectId({
    activeProject,
    queryProjectId: listQuery.projectId,
    userId,
  });
  const result = await documentRepository.listDocumentRegister({
    ...listQuery,
    projectId,
    userId,
  });

  return {
    data: result.rows,
    pagination: buildPagination({
      page: listQuery.page,
      pageSize: listQuery.pageSize,
      totalItems: result.totalItems,
    }),
  };
};

const getDocumentDetail = async ({ documentId, userId }) => {
  const document = await documentRepository.findDocumentRegisterById(documentId, { userId });

  if (!document) {
    throw createHttpError('Document Tidak Ditemukan', 404);
  }

  await resolveReadableProjectId({
    activeProject: null,
    queryProjectId: document.projectId,
    userId,
  });

  return document;
};

const getDocumentHistory = async ({ documentId, userId }) => {
  const document = await getDocumentDetail({ documentId, userId });

  return documentRepository.listDocumentHistory({
    documentId: document.id,
    projectId: document.projectId,
  });
};

const getWorkflowComments = async ({ documentId, userId }) => {
  const document = await getDocumentDetail({ documentId, userId });

  return documentRepository.listWorkflowComments({
    documentId: document.id,
    projectId: document.projectId,
  });
};

const markWorkflowCommentsRead = async ({ documentId, userId }) => {
  const document = await getDocumentDetail({ documentId, userId });
  const markedReadCount = await documentRepository.markWorkflowCommentsReadForUser({
    documentId: document.id,
    projectId: document.projectId,
    userId,
  });

  return {
    documentId: document.id,
    markedReadCount,
  };
};

const listDocumentRevisions = async ({ documentId, userId }) => {
  const document = await getDocumentDetail({ documentId, userId });
  const revisions = await documentRepository.listDocumentRevisions({
    documentId: document.id,
    projectId: document.projectId,
  });

  return revisions.map((revision) => ({
    ...revision,
    downloadUrl: `/api/v1/documents/${document.id}/revisions/${revision.id}/download`,
    viewUrl: `/api/v1/documents/${document.id}/revisions/${revision.id}/view`,
  }));
};

module.exports = {
  archiveDocument,
  createDocument,
  getDocumentDetail,
  getDocumentHistory,
  getWorkflowComments,
  listDocumentRevisions,
  listDocuments,
  markWorkflowCommentsRead,
  restoreDocument,
  updateDocument,
};
