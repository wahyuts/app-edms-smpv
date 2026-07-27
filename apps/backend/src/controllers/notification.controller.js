const notificationService = require('../services/notification.service');
const { errorResponse, successResponse } = require('../utils/response');

const listNotifications = async (req, res, next) => {
  try {
    return successResponse(res, {
      message: 'Notification Berhasil Dimuat',
      data: await notificationService.listCurrentUserNotifications({
        activeProject: req.activeProject,
        query: req.query,
        userId: req.user.id,
      }),
    });
  } catch (error) {
    next(error);
  }
};

const getSummary = async (req, res, next) => {
  try {
    return successResponse(res, {
      message: 'Summary Notification Berhasil Dimuat',
      data: await notificationService.getCurrentUserNotificationSummary({
        activeProject: req.activeProject,
        query: req.query,
        userId: req.user.id,
      }),
    });
  } catch (error) {
    next(error);
  }
};

const getUnreadCount = async (req, res, next) => {
  try {
    const summary = await notificationService.getCurrentUserNotificationSummary({
      activeProject: req.activeProject,
      query: req.query,
      userId: req.user.id,
    });

    return successResponse(res, {
      message: 'Unread Notification Berhasil Dimuat',
      data: { unread: summary.unread },
    });
  } catch (error) {
    next(error);
  }
};

const markAsRead = async (req, res, next) => {
  try {
    return successResponse(res, {
      message: 'Notification Berhasil Dibaca',
      data: await notificationService.markAsRead({
        notificationId: req.params.notificationId,
        userId: req.user.id,
      }),
    });
  } catch (error) {
    next(error);
  }
};

const markAllAsRead = async (req, res, next) => {
  try {
    return successResponse(res, {
      message: 'Semua Notification Berhasil Dibaca',
      data: await notificationService.markAllAsRead({
        activeProject: req.activeProject,
        query: req.query,
        userId: req.user.id,
      }),
    });
  } catch (error) {
    next(error);
  }
};

const deleteNotification = async (req, res, next) => {
  try {
    return successResponse(res, {
      message: 'Notification Berhasil Dihapus',
      data: await notificationService.deleteNotification({
        notificationId: req.params.notificationId,
        userId: req.user.id,
      }),
    });
  } catch (error) {
    next(error);
  }
};

const deleteNotifications = async (req, res, next) => {
  try {
    if (!Array.isArray(req.body?.notificationIds)) {
      return errorResponse(res, {
        statusCode: 422,
        message: 'Notification tidak valid',
        errors: [
          { field: 'notificationIds', message: 'notificationIds wajib berupa array' },
        ],
      });
    }

    return successResponse(res, {
      message: 'Notification Terpilih Berhasil Dihapus',
      data: await notificationService.deleteNotifications({
        activeProject: req.activeProject,
        notificationIds: req.body.notificationIds,
        query: req.query,
        userId: req.user.id,
      }),
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  deleteNotification,
  deleteNotifications,
  getSummary,
  getUnreadCount,
  listNotifications,
  markAllAsRead,
  markAsRead,
};
