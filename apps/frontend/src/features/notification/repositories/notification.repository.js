import {
  EDMS_STORE,
  runEdmsTransaction,
  runStoreRequest,
} from "@/shared/services/indexeddb.service";

const storeName = EDMS_STORE.NOTIFICATIONS;

const cloneValue = (value) => JSON.parse(JSON.stringify(value));

const getAll = async () => cloneValue(
  await runStoreRequest(storeName, "readonly", (store) => store.getAll()),
);

const getById = async (notificationId) => (
  await runStoreRequest(storeName, "readonly", (store) => store.get(notificationId))
) ?? null;

const getByRecipient = async (recipientUserId) => cloneValue(
  await runStoreRequest(
    storeName,
    "readonly",
    (store) => store.index("recipientUserId").getAll(recipientUserId),
  ),
);

const getByRecipientAndProject = async ({ projectId, recipientUserId }) => cloneValue(
  await runStoreRequest(
    storeName,
    "readonly",
    (store) => store.index("recipientProject").getAll([recipientUserId, projectId]),
  ),
);

const getByProjectId = async (projectId) => cloneValue(
  await runStoreRequest(
    storeName,
    "readonly",
    (store) => store.index("projectId").getAll(projectId),
  ),
);

const create = async (notification) => {
  await runStoreRequest(storeName, "readwrite", (store) => store.add(notification));
  return cloneValue(notification);
};

const deleteById = (notificationId) =>
  runStoreRequest(storeName, "readwrite", (store) => store.delete(notificationId));

const deleteMany = async (notificationIds) => {
  const uniqueNotificationIds = [...new Set(notificationIds.filter(Boolean))];
  if (uniqueNotificationIds.length === 0) return 0;

  await runEdmsTransaction([storeName], "readwrite", (stores) => {
    uniqueNotificationIds.forEach((notificationId) => {
      stores[storeName].delete(notificationId);
    });
  });

  return uniqueNotificationIds.length;
};

const update = async (notification) => {
  await runStoreRequest(storeName, "readwrite", (store) => store.put(notification));
  return cloneValue(notification);
};

const markAllAsReadByRecipient = async ({ readAt, recipientUserId }) => {
  const notifications = await getByRecipient(recipientUserId);
  const unreadNotifications = notifications.filter((notification) => !notification.read);

  if (unreadNotifications.length === 0) return [];

  const updatedNotifications = unreadNotifications.map((notification) => ({
    ...notification,
    read: true,
    readAt,
    readStatus: "Read",
  }));

  await runEdmsTransaction([storeName], "readwrite", (stores) => {
    updatedNotifications.forEach((notification) => {
      stores[storeName].put(notification);
    });
  });

  return cloneValue(updatedNotifications);
};

const getUnreadCountByRecipient = async (recipientUserId) => {
  const notifications = await getByRecipient(recipientUserId);
  return notifications.filter((notification) => !notification.read).length;
};

const getUnreadCountByRecipientAndProject = async ({ projectId, recipientUserId }) => {
  const notifications = await getByRecipientAndProject({ projectId, recipientUserId });
  return notifications.filter((notification) => !notification.read).length;
};

const hasDuplicate = async (identityKey) => Boolean(
  await runStoreRequest(
    storeName,
    "readonly",
    (store) => store.index("identityKey").getKey(identityKey),
  ),
);

const clear = () => runStoreRequest(storeName, "readwrite", (store) => store.clear());

export const NotificationRepository = {
  clear,
  create,
  delete: deleteById,
  deleteMany,
  getAll,
  getById,
  getByProjectId,
  getByRecipient,
  getByRecipientAndProject,
  getUnreadCountByRecipient,
  getUnreadCountByRecipientAndProject,
  hasDuplicate,
  markAllAsReadByRecipient,
  update,
};

export default NotificationRepository;
