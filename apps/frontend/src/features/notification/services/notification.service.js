import { queryClient } from "@/shared/api/query-client";
import { getActiveProjectId } from "@/shared/stores/project-context.store";
import { AuthService } from "@/features/auth/services/auth.service";
import { UserService } from "@/features/user-management";
import {
  PROJECT_OFFICIAL_ROLE,
  PROJECT_STATUS,
} from "@/features/project/constants/project.constants";
import { ProjectService } from "@/features/project/services/project.service";
import {
  DOCUMENT_LIFECYCLE,
  DOCUMENT_STATUS,
  SLA_STATUS,
} from "@/features/document-register/constants/document.constants";
import { DocumentRepository } from "@/features/document-register/repositories/document.repository";
import { SlaEngineService } from "@/features/sla-management/services/sla-engine.service";
import {
  AUDIT_RESOURCE_TYPE,
  AUDIT_TRAIL_ACTION,
  AuditTrailService,
} from "@/features/audit-trail";

import { NotificationRepository } from "../repositories/notification.repository";

export const NOTIFICATION_EVENT_TYPE = {
  APPROVAL_A_COMPLETED: "Approval A Completed",
  APPROVAL_B_COMPLETED: "Approval B Completed",
  APPROVAL_C_COMPLETED: "Approval C Completed",
  DOCUMENT_APPROVED: "Document Approved",
  DOCUMENT_UPLOADED: "Document Uploaded",
  REVISION_UPLOADED: "Revision Uploaded",
  SLA_AT_RISK: "SLA At Risk",
  SLA_OVERDUE: "SLA Overdue",
};

const MESSAGE_DICTIONARY = {
  [NOTIFICATION_EVENT_TYPE.DOCUMENT_UPLOADED]: {
    message: "A new document is waiting for your review.",
    priority: "Medium",
    title: "New Review Task",
  },
  [NOTIFICATION_EVENT_TYPE.APPROVAL_A_COMPLETED]: {
    message: "A document is waiting for your project review.",
    priority: "Medium",
    title: "New Project Review Task",
  },
  [NOTIFICATION_EVENT_TYPE.APPROVAL_B_COMPLETED]: {
    message: "Document requires revision. Review comment and attachment are available.",
    priority: "High",
    title: "Revision Required",
  },
  [NOTIFICATION_EVENT_TYPE.APPROVAL_C_COMPLETED]: {
    message: "Document was not approved.",
    priority: "High",
    title: "Document Not Approved",
  },
  [NOTIFICATION_EVENT_TYPE.REVISION_UPLOADED]: {
    message: "A revised document is ready for review.",
    priority: "Medium",
    title: "Revision Ready for Review",
  },
  [NOTIFICATION_EVENT_TYPE.DOCUMENT_APPROVED]: {
    message: "The document has been approved.",
    priority: "Low",
    title: "Document Approved",
  },
  [NOTIFICATION_EVENT_TYPE.SLA_AT_RISK]: {
    message: "Document is approaching its SLA limit.",
    priority: "Medium",
    title: "SLA Warning",
  },
  [NOTIFICATION_EVENT_TYPE.SLA_OVERDUE]: {
    message: "Document has exceeded the SLA limit.",
    priority: "High",
    title: "SLA Overdue",
  },
};

const DIRECT_OPEN_UNAVAILABLE_MESSAGE = {
  ACCESS_DENIED:
    "Akses dokumen tidak tersedia.\n\nAnda tidak lagi memiliki akses ke Project atau dokumen terkait.",
  CLOSED_PROJECT:
    "Dokumen tidak dapat dibuka dari Notification.\n\nProject terkait telah ditutup secara permanen sehingga dokumen tidak lagi dapat diakses melalui modul operasional.",
  INACTIVE_PROJECT:
    "Dokumen tidak dapat dibuka dari Notification.\n\nProject terkait sedang tidak aktif. Hubungi Admin apabila akses ke Project masih diperlukan.",
  MISSING_DOCUMENT:
    "Dokumen tidak ditemukan.\n\nDokumen terkait mungkin telah dihapus dari data operasional, dipindahkan, atau sudah tidak tersedia.",
};

const SLA_DIRECT_OPEN_UNAVAILABLE_MESSAGE = {
  ACCESS_DENIED:
    "Akses tidak tersedia.\n\nAnda tidak lagi memiliki akses ke Project atau data terkait Notification ini.",
  CLOSED_PROJECT:
    "Data tidak dapat dibuka dari Notification.\n\nProject terkait telah ditutup secara permanen sehingga data SLA dan Escalation tidak lagi tersedia melalui modul operasional.",
  INACTIVE_PROJECT:
    "Data tidak dapat dibuka dari Notification.\n\nProject terkait sedang tidak aktif. Hubungi Admin apabila akses masih diperlukan.",
};

const NOTIFICATION_TARGET_MODULE = {
  DOCUMENT_REGISTER: "documentRegister",
  ESCALATION_ALERT: "escalationAlert",
  SLA_MONITORING: "slaMonitoring",
};

export const NOTIFICATION_EVENT_OPTIONS = Object.values(NOTIFICATION_EVENT_TYPE);

const cloneValue = (value) => JSON.parse(JSON.stringify(value));
const normalizeText = (value) => String(value ?? "").trim();
const normalizeKey = (value) => normalizeText(value).toLowerCase();
const normalizeNotificationReadState = (notification) => ({
  ...notification,
  readStatus: notification.read ? "Read" : "Unread",
});
const getNotificationProjectId = (notification) => notification?.projectId ?? null;
const getRequiredActiveProjectId = () => {
  const activeProjectId = getActiveProjectId();
  if (!activeProjectId) {
    throw new Error("Active Project is required.");
  }

  return activeProjectId;
};

const notifyNotificationQueries = () => {
  queryClient.invalidateQueries({ queryKey: ["notifications"] });
};

const createEntityId = (prefix) => {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return `${prefix}-${crypto.randomUUID()}`;
  }
  return `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2)}`;
};

const getCurrentUserId = () => AuthService.getCurrentUser()?.id ?? null;

const createActionTarget = (document) => {
  const drawingSegment = document?.drawing === "P&ID" ? "pid" : "pfd";
  return `/document-register/${drawingSegment}`;
};

class NotificationDirectOpenError extends Error {
  constructor(message, variant = "warning") {
    super(message);
    this.name = "NotificationDirectOpenError";
    this.variant = variant;
  }
}

const getRelatedDocumentNumber = (document) =>
  document?.documentNumber ?? document?.number ?? null;

const getNotificationRelatedDocumentId = (notification) =>
  notification?.relatedResourceId ??
  notification?.resourceId ??
  notification?.metadata?.relatedResourceId ??
  notification?.metadata?.resourceId ??
  null;

const getNotificationRelatedDocumentNumber = (notification) =>
  notification?.relatedDocumentNumber ??
  notification?.metadata?.relatedDocumentNumber ??
  notification?.metadata?.documentNumber ??
  null;

const getDrawingSegment = (document) => document?.drawing === "P&ID" ? "pid" : "pfd";

const getNotificationTargetModule = (notification) => {
  if (notification?.eventType === NOTIFICATION_EVENT_TYPE.SLA_AT_RISK) {
    return NOTIFICATION_TARGET_MODULE.SLA_MONITORING;
  }
  if (notification?.eventType === NOTIFICATION_EVENT_TYPE.SLA_OVERDUE) {
    return NOTIFICATION_TARGET_MODULE.ESCALATION_ALERT;
  }

  const normalizedTitle = normalizeKey(notification?.title);
  if (normalizedTitle === normalizeKey("SLA Warning")) {
    return NOTIFICATION_TARGET_MODULE.SLA_MONITORING;
  }
  if (normalizedTitle === normalizeKey("SLA Overdue")) {
    return NOTIFICATION_TARGET_MODULE.ESCALATION_ALERT;
  }

  return NOTIFICATION_TARGET_MODULE.DOCUMENT_REGISTER;
};

const getModuleUnavailableMessage = (targetModule, messageKey) => {
  if (targetModule === NOTIFICATION_TARGET_MODULE.DOCUMENT_REGISTER) {
    return DIRECT_OPEN_UNAVAILABLE_MESSAGE[messageKey];
  }

  return SLA_DIRECT_OPEN_UNAVAILABLE_MESSAGE[messageKey] ??
    DIRECT_OPEN_UNAVAILABLE_MESSAGE[messageKey];
};

const createArchivedMessage = ({ documentNumber, targetModule }) => {
  if (targetModule === NOTIFICATION_TARGET_MODULE.SLA_MONITORING) {
    return `Data SLA tidak dapat dibuka.\n\nDokumen ${documentNumber ?? "-"} telah diarsipkan dan tidak lagi tersedia pada SLA Monitoring aktif.`;
  }
  if (targetModule === NOTIFICATION_TARGET_MODULE.ESCALATION_ALERT) {
    return `Data Escalation tidak dapat dibuka.\n\nDokumen ${documentNumber ?? "-"} telah diarsipkan dan tidak lagi tersedia pada Escalation Alert aktif.`;
  }

  return `Dokumen tidak dapat dibuka dari Notification.\n\nDokumen ${documentNumber ?? "-"} telah diarsipkan dan tidak lagi tersedia pada Document Register aktif.`;
};

const createMissingOperationalRecordMessage = ({ documentNumber, targetModule }) => {
  if (targetModule === NOTIFICATION_TARGET_MODULE.SLA_MONITORING) {
    return `Data SLA tidak ditemukan.\n\nInformasi SLA untuk dokumen ${documentNumber ?? "-"} mungkin sudah berubah atau tidak lagi tersedia.`;
  }
  if (targetModule === NOTIFICATION_TARGET_MODULE.ESCALATION_ALERT) {
    return `Data Escalation tidak ditemukan.\n\nInformasi Escalation untuk dokumen ${documentNumber ?? "-"} mungkin sudah selesai, berubah, atau tidak lagi tersedia.`;
  }

  return DIRECT_OPEN_UNAVAILABLE_MESSAGE.MISSING_DOCUMENT;
};

const validateTargetOperationalRecord = ({ document, documentNumber, targetModule }) => {
  if (targetModule === NOTIFICATION_TARGET_MODULE.DOCUMENT_REGISTER) return;

  const evaluatedDocument = SlaEngineService.evaluate(document);
  const isActiveWorkflow = evaluatedDocument.status !== DOCUMENT_STATUS.APPROVED;
  const hasMatchingRecord =
    targetModule === NOTIFICATION_TARGET_MODULE.SLA_MONITORING
      ? isActiveWorkflow && evaluatedDocument.slaStatus === SLA_STATUS.AT_RISK
      : isActiveWorkflow && evaluatedDocument.slaStatus === SLA_STATUS.OVERDUE;

  if (!hasMatchingRecord) {
    throw new NotificationDirectOpenError(
      createMissingOperationalRecordMessage({ documentNumber, targetModule }),
      "warning",
    );
  }
};

const resolveNotificationDocument = async ({ notification, projectId }) => {
  const relatedDocumentId = getNotificationRelatedDocumentId(notification);

  if (relatedDocumentId) {
    const document = await DocumentRepository.getById(relatedDocumentId);

    return document?.projectId === projectId ? document : null;
  }

  const relatedDocumentNumber = getNotificationRelatedDocumentNumber(notification);
  if (!relatedDocumentNumber) return null;

  return (await DocumentRepository.getByProjectId(projectId)).find((document) =>
    normalizeKey(document.documentNumber) === normalizeKey(relatedDocumentNumber),
  ) ?? null;
};

const resolveDirectOpenTarget = async (notification) => {
  const currentUser = AuthService.getCurrentUser();
  const projectId = getNotificationProjectId(notification);
  const targetModule = getNotificationTargetModule(notification);

  if (!notification || notification.recipientUserId !== currentUser?.id || !projectId) {
    throw new NotificationDirectOpenError(
      getModuleUnavailableMessage(targetModule, "ACCESS_DENIED"),
      "error",
    );
  }

  const project = await ProjectService.getProjectById(projectId);
  if (!project) {
    throw new NotificationDirectOpenError(
      getModuleUnavailableMessage(targetModule, "ACCESS_DENIED"),
      "error",
    );
  }
  if (project.status === PROJECT_STATUS.CLOSED) {
    throw new NotificationDirectOpenError(
      getModuleUnavailableMessage(targetModule, "CLOSED_PROJECT"),
      "warning",
    );
  }
  if (project.status === PROJECT_STATUS.INACTIVE) {
    throw new NotificationDirectOpenError(
      getModuleUnavailableMessage(targetModule, "INACTIVE_PROJECT"),
      "warning",
    );
  }

  const membership = await ProjectService.getActiveMembership({
    projectId,
    user: currentUser,
  });
  if (!membership) {
    throw new NotificationDirectOpenError(
      getModuleUnavailableMessage(targetModule, "ACCESS_DENIED"),
      "error",
    );
  }

  const document = await resolveNotificationDocument({ notification, projectId });
  if (!document) {
    throw new NotificationDirectOpenError(
      DIRECT_OPEN_UNAVAILABLE_MESSAGE.MISSING_DOCUMENT,
      "error",
    );
  }
  if (document.projectId !== projectId) {
    throw new NotificationDirectOpenError(
      getModuleUnavailableMessage(targetModule, "ACCESS_DENIED"),
      "error",
    );
  }

  const relatedDocumentNumber =
    document.documentNumber ?? getNotificationRelatedDocumentNumber(notification);
  if (!relatedDocumentNumber) {
    throw new NotificationDirectOpenError(
      DIRECT_OPEN_UNAVAILABLE_MESSAGE.MISSING_DOCUMENT,
      "error",
    );
  }

  if (document.lifecycle === DOCUMENT_LIFECYCLE.ARCHIVED) {
    throw new NotificationDirectOpenError(
      createArchivedMessage({ documentNumber: relatedDocumentNumber, targetModule }),
      "warning",
    );
  }

  validateTargetOperationalRecord({
    document,
    documentNumber: relatedDocumentNumber,
    targetModule,
  });

  const query = new URLSearchParams({ documentNumber: relatedDocumentNumber });
  const routePathByModule = {
    [NOTIFICATION_TARGET_MODULE.DOCUMENT_REGISTER]:
      `/document-register/${getDrawingSegment(document)}`,
    [NOTIFICATION_TARGET_MODULE.ESCALATION_ALERT]: "/escalation-alert",
    [NOTIFICATION_TARGET_MODULE.SLA_MONITORING]: "/sla-monitoring",
  };
  const route = `${routePathByModule[targetModule]}?${query.toString()}`;
  const projectContext = projectId !== getActiveProjectId()
    ? await ProjectService.setActiveProjectForUser({ projectId, user: currentUser })
    : null;

  return {
    document,
    projectContext,
    route,
    searchValue: relatedDocumentNumber,
  };
};

const isActiveUser = (user) => user?.isActive === true || user?.status === "Active";
const adminNotificationEventTypes = new Set([
  NOTIFICATION_EVENT_TYPE.APPROVAL_B_COMPLETED,
  NOTIFICATION_EVENT_TYPE.APPROVAL_C_COMPLETED,
  NOTIFICATION_EVENT_TYPE.DOCUMENT_APPROVED,
  NOTIFICATION_EVENT_TYPE.SLA_AT_RISK,
  NOTIFICATION_EVENT_TYPE.SLA_OVERDUE,
]);
const adminNotificationWorkflowStatuses = new Set([
  DOCUMENT_STATUS.PROCESS_COMMENT,
  DOCUMENT_STATUS.PROCESS_REJECT,
  DOCUMENT_STATUS.PROJECT_COMMENT,
  DOCUMENT_STATUS.PROJECT_REJECT,
]);
const duplicateControlledSlaEventTypes = new Set([
  NOTIFICATION_EVENT_TYPE.SLA_AT_RISK,
  NOTIFICATION_EVENT_TYPE.SLA_OVERDUE,
]);
const slaNotificationRecipientRoles = [
  PROJECT_OFFICIAL_ROLE.ADMIN,
  PROJECT_OFFICIAL_ROLE.DOCUMENT_OWNER,
  PROJECT_OFFICIAL_ROLE.TEAM_PROCESS,
  PROJECT_OFFICIAL_ROLE.TEAM_PROJECT,
];

const resolveOfficialRole = ({ document, officialRole, recipientOfficialRole, recipientUserRef }) =>
  normalizeText(
    officialRole ??
      recipientOfficialRole ??
      document?.responsibleRole ??
      document?.officialRole ??
      recipientUserRef,
  );

const resolveOfficialRoles = (payload) => {
  const roleOptions = [
    ...(Array.isArray(payload.officialRoles) ? payload.officialRoles : []),
    ...(Array.isArray(payload.recipientOfficialRoles) ? payload.recipientOfficialRoles : []),
    payload.officialRole,
    payload.recipientOfficialRole,
  ]
    .map(normalizeText)
    .filter(Boolean);

  if (roleOptions.length > 0) return roleOptions;

  const fallbackRole = resolveOfficialRole(payload);
  return fallbackRole ? [fallbackRole] : [];
};

const resolveRecipientUsers = async ({
  document,
  officialRole,
  officialRoles,
  recipientOfficialRole,
  recipientOfficialRoles,
  recipientUserId,
  recipientUserRef,
}) => {
  if (recipientUserId) {
    const user = await UserService.getUserDetail(recipientUserId);
    const projectId = document?.projectId ?? getRequiredActiveProjectId();
    const membership = projectId
      ? await ProjectService.getActiveMembership({ projectId, user })
      : null;

    return user && isActiveUser(user) && membership ? [{
      ...user,
      officialRole: membership.officialRole,
      projectMembershipId: membership.id,
    }] : [];
  }

  const roleKeys = new Set(
    resolveOfficialRoles({
      document,
      officialRole,
      officialRoles,
      recipientOfficialRole,
      recipientOfficialRoles,
      recipientUserRef,
    })
      .map(normalizeKey)
      .filter((roleKey) => roleKey && roleKey !== "none"),
  );
  if (roleKeys.size === 0) return [];

  const projectId = document?.projectId ?? getRequiredActiveProjectId();
  const [users, memberships] = await Promise.all([
    UserService.getUsers(),
    ProjectService.getActiveProjectMemberships(projectId),
  ]);
  const activeUsersById = new Map(
    users.filter(isActiveUser).map((user) => [String(user.id), user]),
  );

  return memberships
    .filter((membership) => roleKeys.has(normalizeKey(membership.officialRole)))
    .map((membership) => {
      const user = activeUsersById.get(String(membership.userId));

      return user
        ? {
            ...user,
            officialRole: membership.officialRole,
            projectMembershipId: membership.id,
          }
        : null;
    })
    .filter(Boolean);
};

const resolveProjectAdminRecipientUsers = async ({ document, metadata = {} }) => {
  const projectId = document?.projectId ?? metadata.projectId ?? getRequiredActiveProjectId();
  const project = await ProjectService.getProjectById(projectId);

  if (project?.status !== PROJECT_STATUS.ACTIVE) return [];

  return (await ProjectService.getActiveUsersByOfficialRole({
    officialRole: PROJECT_OFFICIAL_ROLE.ADMIN,
    projectId,
  })).map((user) => ({
    ...user,
    officialRole: user.projectOfficialRole ?? PROJECT_OFFICIAL_ROLE.ADMIN,
    projectMembershipId: user.projectMembershipId ?? null,
  }));
};

const deduplicateRecipientUsers = (recipientUsers) => {
  const uniqueRecipients = new Map();

  recipientUsers.forEach((recipientUser) => {
    if (!recipientUser?.id) return;
    const recipientKey = String(recipientUser.id);

    if (!uniqueRecipients.has(recipientKey)) {
      uniqueRecipients.set(recipientKey, recipientUser);
    }
  });

  return [...uniqueRecipients.values()];
};

const shouldIncludeProjectAdminRecipients = ({ eventType, metadata = {} }) => {
  if (!adminNotificationEventTypes.has(eventType)) return false;

  if (
    eventType === NOTIFICATION_EVENT_TYPE.APPROVAL_B_COMPLETED ||
    eventType === NOTIFICATION_EVENT_TYPE.APPROVAL_C_COMPLETED
  ) {
    return adminNotificationWorkflowStatuses.has(metadata.workflowStatus);
  }

  return true;
};

const getAdminRecipientReason = (eventType) =>
  eventType === NOTIFICATION_EVENT_TYPE.DOCUMENT_APPROVED
    ? "Document Approved"
    : eventType === NOTIFICATION_EVENT_TYPE.SLA_AT_RISK
      ? "SLA Warning"
      : eventType === NOTIFICATION_EVENT_TYPE.SLA_OVERDUE
        ? "SLA Overdue"
        : eventType === NOTIFICATION_EVENT_TYPE.APPROVAL_C_COMPLETED
          ? "Document Not Approved"
          : "Revision Required";

const excludeCurrentActor = (recipientUsers) => {
  const currentUserId = getCurrentUserId();
  if (!currentUserId) return recipientUsers;

  return recipientUsers.filter((recipientUser) =>
    String(recipientUser.id) !== String(currentUserId),
  );
};

const createNotificationPayload = ({
  document,
  eventAt,
  eventType,
  metadata = {},
  recipientUser,
}) => {
  const messageDefinition = MESSAGE_DICTIONARY[eventType];
  if (!messageDefinition) {
    throw new Error(`Notification message is not defined for event: ${eventType}.`);
  }

  const createdAt = eventAt ?? new Date().toISOString();
  const projectId = document?.projectId ?? metadata.projectId ?? getRequiredActiveProjectId();
  const recipientUserId = recipientUser.id;
  const relatedResourceId = document?.id ?? metadata.relatedResourceId ?? null;
  const identityBasis =
    metadata.identityBasis ??
    document?.activeRevisionId ??
    document?.lastUpdated ??
    createdAt;
  const identityKey = [
    eventType,
    projectId,
    recipientUserId,
    relatedResourceId,
    identityBasis,
  ].map((value) => normalizeKey(value)).join(":");

  return {
    id: createEntityId("NOT"),
    actionTarget: createActionTarget(document),
    createdAt,
    eventType,
    identityKey,
    message: messageDefinition.message,
    metadata: {
      ...metadata,
      officialRole: recipientUser.officialRole ?? null,
      projectMembershipId: recipientUser.projectMembershipId ?? null,
      projectId,
    },
    officialRole: recipientUser.officialRole ?? null,
    priority: messageDefinition.priority,
    projectId,
    read: false,
    readAt: null,
    readStatus: "Unread",
    recipientRole: recipientUser.officialRole ?? null,
    recipientUserId,
    recipientProjectMembershipId: recipientUser.projectMembershipId ?? null,
    relatedDocumentNumber: getRelatedDocumentNumber(document),
    relatedResourceId,
    relatedResourceType: "Engineering Document",
    title: messageDefinition.title,
  };
};

const isUniqueConstraintError = (error) =>
  error?.name === "ConstraintError" ||
  normalizeKey(error?.message).includes("constraint");

const createNotificationsForRecipients = async (payload, recipientUsers) =>
  Promise.all(
    recipientUsers.map(async (recipientUser) => {
      const notification = createNotificationPayload({
        ...payload,
        recipientUser,
      });

      if (await NotificationRepository.hasDuplicate(notification.identityKey)) {
        return { duplicate: true, notification: null };
      }

      try {
        return {
          duplicate: false,
          notification: await NotificationRepository.create(notification),
        };
      } catch (error) {
        if (isUniqueConstraintError(error)) {
          return { duplicate: true, notification: null };
        }

        throw error;
      }
    }),
  );

const getSlaNotificationIdentityBasis = (eventType, document) => [
  eventType,
  document?.projectId,
  document?.id,
].join(":");

const createSlaDuplicateGroupKey = (notification) => [
  notification.eventType,
  notification.projectId,
  notification.recipientUserId,
  notification.relatedResourceId,
].map((value) => normalizeKey(value)).join(":");

const sortByCreatedAt = (notifications) => [...notifications].sort(
  (firstNotification, secondNotification) =>
    new Date(firstNotification.createdAt ?? 0).getTime() -
    new Date(secondNotification.createdAt ?? 0).getTime(),
);

const cleanupDuplicateSlaNotifications = async ({ projectId, recipientUserId }) => {
  const notifications = await NotificationRepository.getByRecipientAndProject({
    projectId,
    recipientUserId,
  });
  const groups = new Map();

  notifications
    .filter((notification) =>
      duplicateControlledSlaEventTypes.has(notification.eventType) &&
      notification.relatedResourceId,
    )
    .forEach((notification) => {
      const groupKey = createSlaDuplicateGroupKey(notification);
      groups.set(groupKey, [...(groups.get(groupKey) ?? []), notification]);
    });

  const duplicateNotifications = [...groups.values()]
    .flatMap((groupNotifications) => sortByCreatedAt(groupNotifications).slice(1));

  if (duplicateNotifications.length === 0) return notifications;

  await Promise.all(duplicateNotifications.map((notification) =>
    NotificationRepository.delete(notification.id),
  ));
  notifyNotificationQueries();

  const duplicateIds = new Set(duplicateNotifications.map((notification) => notification.id));
  return notifications.filter((notification) => !duplicateIds.has(notification.id));
};

const createNotification = async (payload) => {
  const shouldIncludeAdmins =
    payload.includeProjectAdmins && shouldIncludeProjectAdminRecipients(payload);
  const [rawPrimaryRecipientUsers, rawAdminRecipientUsers] = await Promise.all([
    resolveRecipientUsers(payload),
    shouldIncludeAdmins
      ? resolveProjectAdminRecipientUsers(payload)
      : Promise.resolve([]),
  ]);
  const primaryRecipientUsers = deduplicateRecipientUsers(rawPrimaryRecipientUsers);
  const primaryRecipientIds = new Set(primaryRecipientUsers.map((recipientUser) =>
    String(recipientUser.id),
  ));
  const adminRecipientUsers = excludeCurrentActor(rawAdminRecipientUsers)
    .filter((recipientUser) => !primaryRecipientIds.has(String(recipientUser.id)));
  const recipientUsers = deduplicateRecipientUsers([
    ...primaryRecipientUsers,
    ...adminRecipientUsers,
  ]);

  if (recipientUsers.length === 0) {
    return {
      conflict: true,
      created: false,
      duplicate: false,
      notifications: [],
      reason: "No active user account was found for the notification official role.",
    };
  }

  const primaryResults = await createNotificationsForRecipients(
    payload,
    primaryRecipientUsers,
  );
  const adminResults = await createNotificationsForRecipients(
    {
      ...payload,
      metadata: {
        ...payload.metadata,
        adminRecipientReason: getAdminRecipientReason(payload.eventType),
        sourceEventType: payload.eventType,
      },
    },
    adminRecipientUsers,
  );
  const results = [...primaryResults, ...adminResults];
  const createdNotifications = results
    .filter((result) => result.notification)
    .map((result) => result.notification);

  if (createdNotifications.length > 0) {
    notifyNotificationQueries();
    await Promise.all(createdNotifications.map((notification) =>
      AuditTrailService.recordActivitySafely({
        action: AUDIT_TRAIL_ACTION.NOTIFICATION_CREATED,
        identityKey: [
          AUDIT_TRAIL_ACTION.NOTIFICATION_CREATED,
          notification.id,
        ].join(":"),
        metadata: {
          eventType: notification.eventType,
          recipientUserId: notification.recipientUserId,
        },
        projectId: notification.projectId,
        reference: notification.relatedDocumentNumber ?? notification.id,
        resourceId: notification.id,
        resourceType: AUDIT_RESOURCE_TYPE.NOTIFICATION,
      }),
    ));
  }

  return {
    created: createdNotifications.length > 0,
    duplicate: results.every((result) => result.duplicate),
    duplicateCount: results.filter((result) => result.duplicate).length,
    notification: createdNotifications[0] ?? null,
    notifications: createdNotifications,
    recipientCount: recipientUsers.length,
  };
};

const createWorkflowNotification = async ({
  document,
  eventAt,
  eventType,
  metadata,
  officialRole,
  officialRoles,
  recipientOfficialRole,
  recipientOfficialRoles,
  recipientUserId,
  recipientUserRef,
} = {}) => createNotification({
  document,
  eventAt,
  eventType,
  includeProjectAdmins: true,
  metadata,
  officialRole,
  officialRoles,
  recipientOfficialRole,
  recipientOfficialRoles,
  recipientUserId,
  recipientUserRef,
});

const createSlaStateNotification = async ({ document, eventAt, eventType } = {}) => {
  if (
    ![
      NOTIFICATION_EVENT_TYPE.SLA_AT_RISK,
      NOTIFICATION_EVENT_TYPE.SLA_OVERDUE,
    ].includes(eventType)
  ) {
    throw new Error(`SLA notification event is not supported: ${eventType}.`);
  }

  return createNotification({
    document,
    eventAt: eventAt ?? document?.slaTimer?.calculatedAt,
    eventType,
    metadata: {
      identityBasis: getSlaNotificationIdentityBasis(eventType, document),
      slaStatus: document?.slaStatus,
    },
    recipientOfficialRoles: slaNotificationRecipientRoles,
  });
};

const createEscalationNotification = async ({ document, eventAt } = {}) =>
  createSlaStateNotification({
    document,
    eventAt,
    eventType: NOTIFICATION_EVENT_TYPE.SLA_OVERDUE,
  });

const sortNotifications = (notifications, { direction = "desc", sortBy = "createdAt" } = {}) => {
  const multiplier = direction === "asc" ? 1 : -1;
  return [...notifications].sort((firstNotification, secondNotification) => {
    const firstValue = firstNotification[sortBy] ?? "";
    const secondValue = secondNotification[sortBy] ?? "";
    if (firstValue === secondValue) return 0;
    return firstValue > secondValue ? multiplier : -multiplier;
  });
};

const searchNotifications = (notifications, search = "") => {
  const keyword = normalizeKey(search);
  if (!keyword) return notifications;

  return notifications.filter((notification) =>
    [
      notification.title,
      notification.message,
      notification.relatedDocumentNumber,
    ].some((fieldValue) => normalizeKey(fieldValue).includes(keyword)),
  );
};

const filterNotifications = (notifications, filters = {}) =>
  notifications.filter((notification) => {
    if (filters.readStatus && notification.readStatus !== filters.readStatus) return false;
    if (filters.eventType && notification.eventType !== filters.eventType) return false;
    if (filters.priority && notification.priority !== filters.priority) return false;
    return true;
  });

const paginateNotifications = (notifications, { page = 1, pageSize = 10 } = {}) => {
  const normalizedPageSize = Math.max(1, Number(pageSize) || 10);
  const totalItems = notifications.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / normalizedPageSize));
  const normalizedPage = Math.min(Math.max(1, Number(page) || 1), totalPages);
  const startIndex = (normalizedPage - 1) * normalizedPageSize;

  return {
    data: cloneValue(notifications.slice(startIndex, startIndex + normalizedPageSize)),
    pagination: {
      page: normalizedPage,
      pageSize: normalizedPageSize,
      totalItems,
      totalPages,
    },
  };
};

const getCurrentUserNotifications = async (query = {}) => {
  const currentUserId = getCurrentUserId();
  if (!currentUserId) return paginateNotifications([], query);
  const activeProjectId = getRequiredActiveProjectId();

  const notifications = (await cleanupDuplicateSlaNotifications({
    projectId: activeProjectId,
    recipientUserId: currentUserId,
  }))
    .map(normalizeNotificationReadState);
  const filteredNotifications = filterNotifications(
    searchNotifications(notifications, query.search),
    query,
  );

  return paginateNotifications(
    sortNotifications(filteredNotifications, {
      direction: query.direction ?? query.order,
      sortBy: query.sortBy ?? query.sort,
    }),
    query,
  );
};

const getCurrentUserUnreadCount = async () => {
  const currentUserId = getCurrentUserId();
  if (!currentUserId) return 0;
  const activeProjectId = getRequiredActiveProjectId();

  const notifications = await cleanupDuplicateSlaNotifications({
    projectId: activeProjectId,
    recipientUserId: currentUserId,
  });

  return notifications.filter((notification) => !notification.read).length;
};

const getCurrentUserNotificationSummary = async () => {
  const currentUserId = getCurrentUserId();
  if (!currentUserId) {
    return {
      read: 0,
      total: 0,
      unread: 0,
    };
  }

  const notifications = await cleanupDuplicateSlaNotifications({
    projectId: getRequiredActiveProjectId(),
    recipientUserId: currentUserId,
  });
  const normalizedNotifications = notifications.map(normalizeNotificationReadState);
  const unread = normalizedNotifications.filter((notification) => !notification.read).length;

  return {
    read: normalizedNotifications.length - unread,
    total: normalizedNotifications.length,
    unread,
  };
};

const getNotificationDetail = async (notificationId) => {
  const currentUserId = getCurrentUserId();
  const activeProjectId = getRequiredActiveProjectId();
  const notification = await NotificationRepository.getById(notificationId);

  if (
    !notification ||
    notification.recipientUserId !== currentUserId ||
    getNotificationProjectId(notification) !== activeProjectId
  ) {
    return null;
  }

  return cloneValue(normalizeNotificationReadState(notification));
};

const getCurrentUserOwnedNotificationsByIds = async (notificationIds = []) => {
  const currentUserId = getCurrentUserId();
  if (!currentUserId) return [];
  const activeProjectId = getRequiredActiveProjectId();
  const uniqueNotificationIds = [...new Set(notificationIds.filter(Boolean))];

  const notifications = await Promise.all(
    uniqueNotificationIds.map((notificationId) =>
      NotificationRepository.getById(notificationId),
    ),
  );

  return notifications.filter((notification) =>
    notification &&
    notification.recipientUserId === currentUserId &&
    getNotificationProjectId(notification) === activeProjectId,
  );
};

const markAsRead = async (notificationId) => {
  const currentUserId = getCurrentUserId();
  const activeProjectId = getRequiredActiveProjectId();
  const notification = await NotificationRepository.getById(notificationId);

  if (
    !notification ||
    notification.recipientUserId !== currentUserId ||
    getNotificationProjectId(notification) !== activeProjectId
  ) {
    throw new Error("Notification was not found for current user.");
  }
  if (notification.read) return cloneValue(notification);

  const updatedNotification = await NotificationRepository.update({
    ...notification,
    read: true,
    readAt: new Date().toISOString(),
    readStatus: "Read",
  });
  await AuditTrailService.recordActivitySafely({
    action: AUDIT_TRAIL_ACTION.NOTIFICATION_READ,
    identityKey: [
      AUDIT_TRAIL_ACTION.NOTIFICATION_READ,
      notification.id,
      currentUserId,
    ].join(":"),
    metadata: {
      eventType: notification.eventType,
    },
    projectId: notification.projectId,
    reference: notification.relatedDocumentNumber ?? notification.id,
    resourceId: notification.id,
    resourceType: AUDIT_RESOURCE_TYPE.NOTIFICATION,
  });

  notifyNotificationQueries();
  return updatedNotification;
};

const markNotificationsAsRead = async (notificationIds = []) => {
  const currentUserId = getCurrentUserId();
  if (!currentUserId) return [];

  const notifications = await getCurrentUserOwnedNotificationsByIds(notificationIds);
  const unreadNotifications = notifications.filter((notification) => !notification.read);
  if (unreadNotifications.length === 0) return [];

  const readAt = new Date().toISOString();
  const updatedNotifications = await Promise.all(unreadNotifications.map((notification) =>
    NotificationRepository.update({
      ...notification,
      read: true,
      readAt,
      readStatus: "Read",
    }),
  ));
  await Promise.all(updatedNotifications.map((notification) =>
    AuditTrailService.recordActivitySafely({
      action: AUDIT_TRAIL_ACTION.NOTIFICATION_READ,
      identityKey: [
        AUDIT_TRAIL_ACTION.NOTIFICATION_READ,
        notification.id,
        currentUserId,
      ].join(":"),
      metadata: {
        eventType: notification.eventType,
      },
      projectId: notification.projectId,
      reference: notification.relatedDocumentNumber ?? notification.id,
      resourceId: notification.id,
      resourceType: AUDIT_RESOURCE_TYPE.NOTIFICATION,
    }),
  ));

  notifyNotificationQueries();
  return cloneValue(updatedNotifications.map(normalizeNotificationReadState));
};

const markAllAsRead = async () => {
  const currentUserId = getCurrentUserId();
  if (!currentUserId) return [];
  const activeProjectId = getRequiredActiveProjectId();

  const notifications = (await NotificationRepository.getByRecipientAndProject({
    projectId: activeProjectId,
    recipientUserId: currentUserId,
  })).filter((notification) => !notification.read);
  const readAt = new Date().toISOString();
  const updatedNotifications = await Promise.all(notifications.map((notification) =>
    NotificationRepository.update({
      ...notification,
      read: true,
      readAt,
      readStatus: "Read",
    }),
  ));
  await Promise.all(updatedNotifications.map((notification) =>
    AuditTrailService.recordActivitySafely({
      action: AUDIT_TRAIL_ACTION.NOTIFICATION_READ,
      identityKey: [
        AUDIT_TRAIL_ACTION.NOTIFICATION_READ,
        notification.id,
        currentUserId,
      ].join(":"),
      metadata: {
        eventType: notification.eventType,
      },
      projectId: notification.projectId,
      reference: notification.relatedDocumentNumber ?? notification.id,
      resourceId: notification.id,
      resourceType: AUDIT_RESOURCE_TYPE.NOTIFICATION,
    }),
  ));

  notifyNotificationQueries();
  return updatedNotifications;
};

const deleteCurrentUserNotifications = async (notificationIds = []) => {
  const notifications = await getCurrentUserOwnedNotificationsByIds(notificationIds);
  if (notifications.length === 0) return { deletedCount: 0, deletedIds: [] };

  const deletedIds = notifications.map((notification) => notification.id);
  const deletedCount = await NotificationRepository.deleteMany(deletedIds);

  notifyNotificationQueries();
  return {
    deletedCount,
    deletedIds,
  };
};

const getNotificationsByRecipient = async (recipientUserId) =>
  (await NotificationRepository.getByRecipientAndProject({
    projectId: getRequiredActiveProjectId(),
    recipientUserId,
  }))
    .map(normalizeNotificationReadState);

const hasDuplicate = (identityKey) => NotificationRepository.hasDuplicate(identityKey);

export const NotificationService = {
  createEscalationNotification,
  createSlaStateNotification,
  createWorkflowNotification,
  deleteCurrentUserNotifications,
  filterNotifications,
  getCurrentUserNotifications,
  getCurrentUserNotificationSummary,
  getCurrentUserUnreadCount,
  getNotificationDetail,
  getNotificationsByRecipient,
  hasDuplicate,
  markAllAsRead,
  markNotificationsAsRead,
  markAsRead,
  resolveDirectOpenTarget,
  searchNotifications,
  sortNotifications,
};

export default NotificationService;
