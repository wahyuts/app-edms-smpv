const notificationRepository = require('../repositories/notification.repository');
const projectMembershipRepository = require('../repositories/projectMembership.repository');
const auditService = require('./audit.service');
const { buildPagination, createEntityId, createHttpError, normalizeText, parseListQuery } = require('../utils/administration');

const NOTIFICATION_EVENT_TYPE = Object.freeze({
  APPROVAL_A_COMPLETED: 'Approval A Completed',
  APPROVAL_B_COMPLETED: 'Approval B Completed',
  APPROVAL_C_COMPLETED: 'Approval C Completed',
  DOCUMENT_APPROVED: 'Document Approved',
  DOCUMENT_UPLOADED: 'Document Uploaded',
  REVISION_UPLOADED: 'Revision Uploaded',
  SLA_AT_RISK: 'SLA At Risk',
  SLA_OVERDUE: 'SLA Overdue',
});

const SLA_NOTIFICATION_ROLES = Object.freeze([
  'Admin',
  'Document Owner',
  'Team Process',
  'Team Project',
]);

const messageDictionary = Object.freeze({
  [NOTIFICATION_EVENT_TYPE.DOCUMENT_UPLOADED]: {
    message: 'A new document is waiting for your review.',
    priority: 'Normal',
    title: 'New Review Task',
  },
  [NOTIFICATION_EVENT_TYPE.APPROVAL_A_COMPLETED]: {
    message: 'A document is waiting for your project review.',
    priority: 'Normal',
    title: 'New Project Review Task',
  },
  [NOTIFICATION_EVENT_TYPE.APPROVAL_B_COMPLETED]: {
    message: 'Document requires revision. Review comment and attachment are available.',
    priority: 'High',
    title: 'Revision Required',
  },
  [NOTIFICATION_EVENT_TYPE.APPROVAL_C_COMPLETED]: {
    message: 'Document was not approved.',
    priority: 'High',
    title: 'Document Not Approved',
  },
  [NOTIFICATION_EVENT_TYPE.REVISION_UPLOADED]: {
    message: 'A revised document is ready for review.',
    priority: 'Normal',
    title: 'Revision Ready for Review',
  },
  [NOTIFICATION_EVENT_TYPE.DOCUMENT_APPROVED]: {
    message: 'The document has been approved.',
    priority: 'Low',
    title: 'Document Approved',
  },
  [NOTIFICATION_EVENT_TYPE.SLA_AT_RISK]: {
    message: 'Document is approaching its SLA limit.',
    priority: 'Normal',
    title: 'SLA At Risk',
  },
  [NOTIFICATION_EVENT_TYPE.SLA_OVERDUE]: {
    message: 'Document has exceeded the SLA limit.',
    priority: 'High',
    title: 'SLA Overdue',
  },
});

const createActionTarget = (document, eventType) => {
  if (eventType === NOTIFICATION_EVENT_TYPE.SLA_AT_RISK) return '/sla-monitoring';
  if (eventType === NOTIFICATION_EVENT_TYPE.SLA_OVERDUE) return '/escalation-alert';

  const drawingSegment = document?.drawing === 'P&ID' ? 'pid' : 'pfd';
  return `/document-register/${drawingSegment}`;
};

const normalizeSlaCycleTimestamp = (value) => {
  if (!value) return null;
  const parsedDate = new Date(value);

  return Number.isNaN(parsedDate.getTime()) ? String(value) : parsedDate.toISOString();
};

const parseSlaCycleId = (cycleId = '') => {
  const parts = String(cycleId || '').split(':');
  if (parts.length < 3) {
    return {
      documentId: null,
      projectId: null,
      rawTimestamp: null,
      value: String(cycleId || ''),
    };
  }

  const [projectId, documentId, ...timestampParts] = parts;
  const rawTimestamp = timestampParts.join(':');
  const timestamp = normalizeSlaCycleTimestamp(rawTimestamp);

  return {
    documentId,
    projectId,
    rawTimestamp,
    timestamp,
    value: [projectId, documentId, timestamp].filter(Boolean).join(':'),
  };
};

const normalizeSlaCycleId = (cycleId = '') => parseSlaCycleId(cycleId).value;

const hasMillisecondPrecision = (value = '') => /\.\d{3}/.test(String(value));

const isSameSlaCycle = (existingCycleId, targetCycleId) => {
  const existing = parseSlaCycleId(existingCycleId);
  const target = parseSlaCycleId(targetCycleId);

  if (existing.value === target.value) return true;
  if (existing.projectId !== target.projectId || existing.documentId !== target.documentId) return false;
  if (hasMillisecondPrecision(existing.rawTimestamp)) return false;

  const existingDate = new Date(existing.timestamp);
  const targetDate = new Date(target.timestamp);
  if (Number.isNaN(existingDate.getTime()) || Number.isNaN(targetDate.getTime())) return false;

  return Math.floor(existingDate.getTime() / 1000) === Math.floor(targetDate.getTime() / 1000);
};

const hasExistingSlaNotificationForCycle = async ({
  cycleId,
  document,
  eventType,
  recipient,
}) => {
  const targetCycleId = normalizeSlaCycleId(cycleId || document.slaStartedAt || document.updatedAt || document.lastUpdated);
  const existingNotifications = await notificationRepository.listSlaNotificationsByBusinessKey({
    eventType,
    projectId: document.projectId,
    recipientUserId: recipient.userId,
    relatedResourceId: document.id,
  });

  return existingNotifications.some((notification) =>
    isSameSlaCycle(
      notification.metadata?.cycleId || notification.identityKey?.split(':').slice(4).join(':'),
      targetCycleId
    )
  );
};

const resolveRecipientMembership = async ({ document, recipientOfficialRole, recipientUserId }) => {
  if (recipientUserId) {
    const membership = await projectMembershipRepository.findActiveMembershipByProjectAndUser({
      projectId: document.projectId,
      userId: recipientUserId,
    });
    return membership;
  }

  return projectMembershipRepository.findActiveMembershipByProjectAndOfficialRole({
    officialRole: recipientOfficialRole,
    projectId: document.projectId,
  });
};

const createDocumentNotification = async ({
  document,
  eventType,
  identityBasis,
  recipientOfficialRole,
  recipientUserId,
}) => {
  if (!document || !eventType) return null;

  const recipientMembership = await resolveRecipientMembership({
    document,
    recipientOfficialRole: recipientOfficialRole || document.responsibleRole,
    recipientUserId,
  });

  if (!recipientMembership) return null;

  const dictionary = messageDictionary[eventType] || {
    message: eventType,
    priority: 'Normal',
    title: eventType,
  };
  const identityKey = [
    eventType,
    document.projectId,
    document.id,
    recipientMembership.userId,
    identityBasis || document.activeRevisionId || document.updatedAt || document.lastUpdated,
  ].join(':');

  await notificationRepository.createNotification({
    id: createEntityId('NTF'),
    identityKey,
    projectId: document.projectId,
    recipientUserId: recipientMembership.userId,
    recipientProjectMembershipId: recipientMembership.id,
    eventType,
    title: dictionary.title,
    message: dictionary.message,
    priority: dictionary.priority,
    officialRole: recipientMembership.officialRole,
    recipientRole: recipientMembership.officialRole,
    relatedResourceType: 'Document',
    relatedResourceId: document.id,
    relatedDocumentNumber: document.documentNumber,
    actionTarget: createActionTarget(document, eventType),
    metadata: {
      workflowStatus: document.status,
      revision: document.revision,
    },
  });

  return true;
};

const resolveOfficialSlaRecipients = async (document) => {
  const memberships = await projectMembershipRepository.listActiveMembershipsByProjectAndOfficialRoles({
    officialRoles: SLA_NOTIFICATION_ROLES,
    projectId: document.projectId,
  });
  const uniqueByUserId = new Map();

  memberships.forEach((membership) => {
    if (!uniqueByUserId.has(membership.userId)) {
      uniqueByUserId.set(membership.userId, membership);
    }
  });

  return [...uniqueByUserId.values()];
};

const createSlaStateNotifications = async ({
  cycleId,
  document,
  eventType,
  metadata = {},
}) => {
  if (
    !document ||
    document.status === 'Approved' ||
    ![NOTIFICATION_EVENT_TYPE.SLA_AT_RISK, NOTIFICATION_EVENT_TYPE.SLA_OVERDUE].includes(eventType)
  ) {
    return {
      attemptedRecipientCount: 0,
      eventType,
    };
  }

  const recipients = await resolveOfficialSlaRecipients(document);
  const dictionary = messageDictionary[eventType];

  await Promise.all(recipients.map(async (recipient) => {
    if (await hasExistingSlaNotificationForCycle({
      cycleId,
      document,
      eventType,
      recipient,
    })) {
      return;
    }

    const normalizedCycleId = normalizeSlaCycleId(cycleId || document.slaStartedAt || document.updatedAt || document.lastUpdated);

    await notificationRepository.createNotification({
      id: createEntityId('NTF'),
      identityKey: [
        eventType,
        document.projectId,
        document.id,
        recipient.userId,
        normalizedCycleId,
      ].join(':'),
      projectId: document.projectId,
      recipientUserId: recipient.userId,
      recipientProjectMembershipId: recipient.id,
      eventType,
      title: dictionary.title,
      message: dictionary.message,
      priority: dictionary.priority,
      officialRole: recipient.officialRole,
      recipientRole: recipient.officialRole,
      relatedResourceType: 'Document',
      relatedResourceId: document.id,
      relatedDocumentNumber: document.documentNumber,
      actionTarget: createActionTarget(document, eventType),
      metadata: {
        ...metadata,
        cycleId: normalizedCycleId,
        revision: document.revision,
        slaStatus: document.slaStatus,
        workflowStatus: document.status,
      },
    });
  }));

  return {
    attemptedRecipientCount: recipients.length,
    eventType,
  };
};

const resolveProjectId = async ({ activeProject, queryProjectId, userId }) => {
  const projectId = queryProjectId || activeProject?.id || null;
  if (!projectId) {
    throw createHttpError('Project Aktif Wajib Dipilih', 422);
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

const listCurrentUserNotifications = async ({ activeProject, query = {}, userId }) => {
  const projectId = await resolveProjectId({
    activeProject,
    queryProjectId: normalizeText(query.projectId),
    userId,
  });
  const listQuery = parseListQuery(query, {
    allowedSortBy: ['createdAt', 'eventType', 'priority', 'readStatus', 'title'],
    defaultSortBy: 'createdAt',
  });
  const search = listQuery.search.toLowerCase();
  const eventType = normalizeText(query.eventType);
  const readStatus = normalizeText(query.readStatus);
  let notifications = await notificationRepository.listNotificationsByRecipient({
    projectId,
    recipientUserId: userId,
  });

  if (search) {
    notifications = notifications.filter((notification) => [
      notification.title,
      notification.message,
      notification.eventType,
      notification.relatedDocumentNumber,
      notification.readStatus,
    ].some((value) => normalizeText(value).toLowerCase().includes(search)));
  }
  if (eventType) {
    notifications = notifications.filter((notification) => notification.eventType === eventType);
  }
  if (readStatus) {
    notifications = notifications.filter((notification) => notification.readStatus === readStatus);
  }

  notifications.sort((first, second) => {
    const firstValue = first[listQuery.sortBy] ?? first.createdAt;
    const secondValue = second[listQuery.sortBy] ?? second.createdAt;
    if (firstValue === secondValue) return 0;
    const result = firstValue > secondValue ? 1 : -1;
    return listQuery.direction === 'asc' ? result : -result;
  });

  const pagedNotifications = notifications.slice(listQuery.offset, listQuery.offset + listQuery.limit);

  return {
    data: pagedNotifications,
    pagination: buildPagination({
      page: listQuery.page,
      pageSize: listQuery.pageSize,
      totalItems: notifications.length,
    }),
  };
};

const getCurrentUserNotificationSummary = async ({ activeProject, query = {}, userId }) => {
  const projectId = await resolveProjectId({
    activeProject,
    queryProjectId: normalizeText(query.projectId),
    userId,
  });
  const notifications = await notificationRepository.listNotificationsByRecipient({
    projectId,
    recipientUserId: userId,
  });
  const unread = notifications.filter((notification) => !notification.read).length;

  return {
    read: notifications.length - unread,
    total: notifications.length,
    unread,
  };
};

const markAsRead = async ({ notificationId, userId }) => {
  const notification = await notificationRepository.findNotificationById(notificationId);
  if (!notification || Number(notification.recipientUserId) !== Number(userId)) {
    throw createHttpError('Notification Tidak Ditemukan', 404);
  }
  await notificationRepository.markNotificationRead({ notificationId, recipientUserId: userId });
  const updatedNotification = await notificationRepository.findNotificationById(notificationId);
  await auditService.recordActivitySafely({
    action: 'Notification Read',
    actorUserId: userId,
    identityKey: ['Notification Read', notificationId, userId].join(':'),
    metadata: {
      eventType: updatedNotification.eventType,
    },
    projectId: updatedNotification.projectId,
    reference: updatedNotification.relatedDocumentNumber || updatedNotification.id,
    resourceId: updatedNotification.id,
    resourceType: 'Notification',
  });

  return updatedNotification;
};

const markAllAsRead = async ({ activeProject, query = {}, userId }) => {
  const projectId = await resolveProjectId({
    activeProject,
    queryProjectId: normalizeText(query.projectId),
    userId,
  });

  return {
    updatedCount: await notificationRepository.markAllNotificationsRead({
      projectId,
      recipientUserId: userId,
    }),
  };
};

const deleteNotification = async ({ notificationId, userId }) => {
  return {
    deletedCount: await notificationRepository.deleteNotification({
      notificationId,
      recipientUserId: userId,
    }),
    deletedIds: [notificationId],
  };
};

const deleteNotifications = async ({ activeProject, notificationIds = [], query = {}, userId }) => {
  const normalizedIds = [...new Set(notificationIds.map((id) => normalizeText(id)).filter(Boolean))];
  if (normalizedIds.length === 0) {
    throw createHttpError('Notification Wajib Dipilih', 422, [
      { field: 'notificationIds', message: 'Notification Wajib Dipilih' },
    ]);
  }
  const projectId = await resolveProjectId({
    activeProject,
    queryProjectId: normalizeText(query.projectId),
    userId,
  });
  const deletedCount = await notificationRepository.deleteNotifications({
    notificationIds: normalizedIds,
    projectId,
    recipientUserId: userId,
  });

  return {
    deletedCount,
    deletedIds: normalizedIds,
  };
};

module.exports = {
  NOTIFICATION_EVENT_TYPE,
  createDocumentNotification,
  createSlaStateNotifications,
  deleteNotifications,
  getCurrentUserNotificationSummary,
  listCurrentUserNotifications,
  markAllAsRead,
  markAsRead,
  deleteNotification,
};
