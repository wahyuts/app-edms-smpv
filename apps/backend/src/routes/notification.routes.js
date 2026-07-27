const express = require('express');
const notificationController = require('../controllers/notification.controller');
const authenticate = require('../middlewares/authenticate');
const { authorizeAnyPermission } = require('../middlewares/authorizePermissions');

const router = express.Router();

router.use(authenticate);
router.use(authorizeAnyPermission('notifications.view'));

router.get('/', notificationController.listNotifications);
router.get('/summary', notificationController.getSummary);
router.get('/unread-count', notificationController.getUnreadCount);
router.patch('/read-all', notificationController.markAllAsRead);
router.patch('/:notificationId/read', notificationController.markAsRead);
router.delete('/', notificationController.deleteNotifications);
router.delete('/:notificationId', notificationController.deleteNotification);

module.exports = router;
