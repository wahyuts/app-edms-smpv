import { queryClient } from "@/shared/api/query-client";
import { getActiveProjectId } from "@/shared/stores/project-context.store";
import { AuthService } from "@/features/auth/services/auth.service";
import { apiClient } from "@/shared/api";
import { DocumentApiService } from "@/features/document-register/services/document-api.service";

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

export const NOTIFICATION_EVENT_OPTIONS = Object.values(NOTIFICATION_EVENT_TYPE);

const NOTIFICATION_TARGET_MODULE = {
  DOCUMENT_REGISTER: "documentRegister",
  ESCALATION_ALERT: "escalationAlert",
  SLA_MONITORING: "slaMonitoring",
};

const normalizeText = (value) => String(value ?? "").trim();
const normalizeKey = (value) => normalizeText(value).toLowerCase();

const getErrorMessage = (error, fallback = "Gagal memuat notifikasi.") => {
  if (error?.response?.data?.errors?.length) {
    return error.response.data.errors[0].message ?? fallback;
  }

  return error?.response?.data?.message ?? error?.message ?? fallback;
};

const throwNotificationApiError = (error, fallback) => {
  throw new Error(getErrorMessage(error, fallback));
};

const getCurrentUserId = () => AuthService.getCurrentUser()?.id ?? null;

const getRequiredActiveProjectId = () => {
  const activeProjectId = getActiveProjectId();
  if (!activeProjectId) {
    throw new Error("Project aktif wajib dipilih.");
  }

  return activeProjectId;
};

const notifyNotificationQueries = () => {
  queryClient.invalidateQueries({ queryKey: ["notifications"] });
};

const normalizeNotificationReadState = (notification = {}) => ({
  ...notification,
  read: Boolean(notification.read),
  readStatus: notification.readStatus ?? (notification.read ? "Read" : "Unread"),
});

const unwrapNotification = (response) =>
  normalizeNotificationReadState(response.data?.data ?? {});

const unwrapNotificationList = (response, query = {}) => {
  const payload = response.data?.data ?? {};

  return {
    data: (payload.data ?? []).map(normalizeNotificationReadState),
    pagination: payload.pagination ?? {
      page: Number(query.page) || 1,
      pageSize: Number(query.pageSize) || 10,
      totalItems: 0,
      totalPages: 1,
    },
  };
};

const unwrapSummary = (response) => {
  const payload = response.data?.data ?? {};

  return {
    read: Number(payload.read ?? 0),
    total: Number(payload.total ?? 0),
    unread: Number(payload.unread ?? 0),
  };
};

const toNotificationQuery = (query = {}) => {
  const activeProjectId = getRequiredActiveProjectId();
  const params = {
    direction: query.direction || undefined,
    eventType: query.eventType || undefined,
    page: query.page || undefined,
    pageSize: query.pageSize || undefined,
    projectId: activeProjectId,
    readStatus: query.readStatus || undefined,
    search: query.search || undefined,
    sortBy: query.sortBy || undefined,
  };

  return Object.fromEntries(
    Object.entries(params).filter(([, value]) => value !== undefined && value !== ""),
  );
};

const getCurrentUserNotifications = async (query = {}) => {
  if (!getCurrentUserId()) {
    return {
      data: [],
      pagination: {
        page: Number(query.page) || 1,
        pageSize: Number(query.pageSize) || 10,
        totalItems: 0,
        totalPages: 1,
      },
    };
  }

  try {
    return unwrapNotificationList(
      await apiClient.get("/v1/notifications", {
        params: toNotificationQuery(query),
      }),
      query,
    );
  } catch (error) {
    throwNotificationApiError(error, "Gagal memuat daftar notifikasi.");
  }
};

const getCurrentUserUnreadCount = async () => {
  if (!getCurrentUserId()) return 0;

  try {
    const response = await apiClient.get("/v1/notifications/unread-count", {
      params: { projectId: getRequiredActiveProjectId() },
    });

    return Number(response.data?.data?.unread ?? 0);
  } catch (error) {
    throwNotificationApiError(error, "Gagal memuat jumlah notifikasi.");
  }
};

const getCurrentUserNotificationSummary = async () => {
  if (!getCurrentUserId()) {
    return {
      read: 0,
      total: 0,
      unread: 0,
    };
  }

  try {
    return unwrapSummary(await apiClient.get("/v1/notifications/summary", {
      params: { projectId: getRequiredActiveProjectId() },
    }));
  } catch (error) {
    throwNotificationApiError(error, "Gagal memuat ringkasan notifikasi.");
  }
};

const getNotificationDetail = async (notificationId) => {
  const notificationResponse = await getCurrentUserNotifications({
    page: 1,
    pageSize: 100,
  });

  return notificationResponse.data.find((notification) =>
    String(notification.id) === String(notificationId),
  ) ?? null;
};

const markAsRead = async (notificationId) => {
  try {
    const notification = unwrapNotification(
      await apiClient.patch(`/v1/notifications/${notificationId}/read`),
    );

    notifyNotificationQueries();
    return notification;
  } catch (error) {
    throwNotificationApiError(error, "Gagal memperbarui notifikasi.");
  }
};

const markNotificationsAsRead = async (notificationIds = []) => {
  const uniqueNotificationIds = [...new Set(notificationIds.filter(Boolean))];
  if (uniqueNotificationIds.length === 0) return [];

  const updatedNotifications = await Promise.all(
    uniqueNotificationIds.map((notificationId) => markAsRead(notificationId)),
  );

  notifyNotificationQueries();
  return updatedNotifications;
};

const markAllAsRead = async () => {
  try {
    const response = await apiClient.patch("/v1/notifications/read-all", undefined, {
      params: { projectId: getRequiredActiveProjectId() },
    });

    notifyNotificationQueries();
    return response.data?.data ?? { updatedCount: 0 };
  } catch (error) {
    throwNotificationApiError(error, "Gagal menandai semua notifikasi sudah dibaca.");
  }
};

const deleteCurrentUserNotifications = async (notificationIds = []) => {
  const uniqueNotificationIds = [...new Set(notificationIds.filter(Boolean))];
  if (uniqueNotificationIds.length === 0) {
    return { deletedCount: 0, deletedIds: [] };
  }

  try {
    const response = await apiClient.delete("/v1/notifications", {
      data: { notificationIds: uniqueNotificationIds },
      params: { projectId: getRequiredActiveProjectId() },
    });

    notifyNotificationQueries();
    return response.data?.data ?? {
      deletedCount: 0,
      deletedIds: uniqueNotificationIds,
    };
  } catch (error) {
    throwNotificationApiError(error, "Gagal menghapus notifikasi.");
  }
};

const getNotificationTargetModule = (notification) => {
  if (notification?.eventType === NOTIFICATION_EVENT_TYPE.SLA_AT_RISK) {
    return NOTIFICATION_TARGET_MODULE.SLA_MONITORING;
  }
  if (notification?.eventType === NOTIFICATION_EVENT_TYPE.SLA_OVERDUE) {
    return NOTIFICATION_TARGET_MODULE.ESCALATION_ALERT;
  }

  const normalizedTitle = normalizeKey(notification?.title);
  if (normalizedTitle === normalizeKey("SLA At Risk") || normalizedTitle === normalizeKey("SLA Warning")) {
    return NOTIFICATION_TARGET_MODULE.SLA_MONITORING;
  }
  if (normalizedTitle === normalizeKey("SLA Overdue")) {
    return NOTIFICATION_TARGET_MODULE.ESCALATION_ALERT;
  }

  return NOTIFICATION_TARGET_MODULE.DOCUMENT_REGISTER;
};

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

const createDocumentRegisterRoute = ({ document, notification }) => {
  const documentNumber =
    document?.documentNumber ?? getNotificationRelatedDocumentNumber(notification);
  const query = documentNumber
    ? `?${new URLSearchParams({ documentNumber }).toString()}`
    : "";

  if (document?.drawing) {
    return `/document-register/${getDrawingSegment(document)}${query}`;
  }

  const actionTarget = notification?.actionTarget;
  if (typeof actionTarget === "string" && actionTarget.startsWith("/document-register/")) {
    return `${actionTarget.split("?")[0]}${query}`;
  }

  return `/document-register/pfd${query}`;
};

const createOperationalRoute = ({ notification, route }) => {
  const documentNumber = getNotificationRelatedDocumentNumber(notification);
  const query = documentNumber
    ? `?${new URLSearchParams({ documentNumber }).toString()}`
    : "";

  return `${route}${query}`;
};

const resolveDirectOpenTarget = async (notification) => {
  if (!notification) {
    throw new Error("Notifikasi tidak dapat dibuka.");
  }

  const activeProjectId = getRequiredActiveProjectId();
  if (notification.projectId && String(notification.projectId) !== String(activeProjectId)) {
    throw new Error("Notifikasi tidak sesuai dengan project aktif.");
  }

  const targetModule = getNotificationTargetModule(notification);

  if (targetModule === NOTIFICATION_TARGET_MODULE.SLA_MONITORING) {
    return {
      projectContext: null,
      route: createOperationalRoute({ notification, route: "/sla-monitoring" }),
      searchValue: getNotificationRelatedDocumentNumber(notification),
    };
  }

  if (targetModule === NOTIFICATION_TARGET_MODULE.ESCALATION_ALERT) {
    return {
      projectContext: null,
      route: createOperationalRoute({ notification, route: "/escalation-alert" }),
      searchValue: getNotificationRelatedDocumentNumber(notification),
    };
  }

  const relatedDocumentId = getNotificationRelatedDocumentId(notification);
  const document = relatedDocumentId
    ? await DocumentApiService.getDocumentById(relatedDocumentId)
    : null;

  return {
    document,
    projectContext: null,
    route: createDocumentRegisterRoute({ document, notification }),
    searchValue: document?.documentNumber ?? getNotificationRelatedDocumentNumber(notification),
  };
};

const createBackendOwnedNotificationResult = () => ({
  created: false,
  duplicate: false,
  notifications: [],
  skipped: true,
  reason: "Notification runtime dikelola oleh backend.",
});

const createWorkflowNotification = async () => createBackendOwnedNotificationResult();
const createSlaStateNotification = async () => createBackendOwnedNotificationResult();
const createEscalationNotification = async () => createBackendOwnedNotificationResult();
const getNotificationsByRecipient = async (recipientUserId) =>
  String(recipientUserId) === String(getCurrentUserId())
    ? (await getCurrentUserNotifications({ page: 1, pageSize: 100 })).data
    : [];
const hasDuplicate = async () => false;

export const NotificationService = {
  createEscalationNotification,
  createSlaStateNotification,
  createWorkflowNotification,
  deleteCurrentUserNotifications,
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
};

export default NotificationService;
