const { deliverRecipient } = require('../repositories/documentDeleteNotification.repository');
const { pending } = require('../utils/storageNamespace');
const realtime = require('./realtimePublisher.service');
const { REALTIME_EVENT_TYPE, REALTIME_EVENT_SCOPE, REALTIME_RESOURCE_TYPE } = require('../constants/realtime.constants');

// Completion snapshot doubles as a minimal durable delivery ledger, not a new
// notification system. In-app rows and each recipient receipt commit together.
const createDeleteNotificationDispatcher = ({ pool, hooks = {} }) => {
  const dispatch = async (operationId) => {
    if (typeof operationId !== 'string' || !operationId || operationId.length > 64) throw pending('DELETE_OPERATION_INVALID');
    const c = await pool.getConnection();
    try {
      for (;;) {
        await c.beginTransaction();
        try {
          const [[execution]] = await c.execute('SELECT phase,completion_snapshot FROM document_delete_executions WHERE operation_id=? FOR UPDATE', [operationId]);
          if (execution?.phase !== 'COMPLETED') { await c.rollback(); return { status: 'NOT_COMPLETED' }; }
          const snapshot = JSON.parse(execution.completion_snapshot);
          const delivery = snapshot.notificationDelivery;
          if (!delivery) { await c.rollback(); return { status: 'LEGACY_NOT_PREPARED' }; }
          if (snapshot.operationId !== operationId || delivery.version !== 1 || !Array.isArray(delivery.recipients)
            || !Array.isArray(delivery.deliveredUserIds) || !['PENDING','DELIVERED'].includes(delivery.state)) throw pending('DELETE_NOTIFICATION_SNAPSHOT_INVALID');
          if (delivery.state === 'DELIVERED') { await c.commit(); return { status: 'DELIVERED', recipientCount: delivery.recipients.length }; }
          const recipient = delivery.recipients.find((item) => !delivery.deliveredUserIds.includes(String(item.userId)));
          let notification;
          if (recipient) {
            notification = await deliverRecipient(c, snapshot, recipient);
            if (hooks.afterInsert) await hooks.afterInsert(recipient);
            delivery.deliveredUserIds.push(String(recipient.userId));
          }
          delivery.state = delivery.deliveredUserIds.length === delivery.recipients.length ? 'DELIVERED' : 'PENDING';
          await c.execute(`UPDATE document_delete_executions SET completion_snapshot=JSON_SET(completion_snapshot,'$.notificationDelivery',JSON_EXTRACT(?,'$'))
            WHERE operation_id=? AND phase='COMPLETED'`, [JSON.stringify(delivery), operationId]);
          await c.commit();
          if (notification) realtime.publishSafely({ type: REALTIME_EVENT_TYPE.NOTIFICATION_CREATED,
            scope: REALTIME_EVENT_SCOPE.USER_PROJECT, resourceType: REALTIME_RESOURCE_TYPE.NOTIFICATION,
            resourceId: notification.id, projectId: snapshot.projectId, recipientUserId: recipient.userId, reason: notification.eventType });
          if (hooks.afterRecipientCommit) await hooks.afterRecipientCommit(recipient);
        } catch (error) { await c.rollback().catch(() => {}); throw error; }
      }
    } finally { c.release(); }
  };
  return Object.freeze({ dispatch });
};

module.exports = { createDeleteNotificationDispatcher };
