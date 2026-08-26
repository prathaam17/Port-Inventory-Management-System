const { AuditLog, Notification } = require('../models');

const isUUID = (str) => {
  return typeof str === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str);
};

/**
 * Logs an administrative or operational action to the database.
 * Safely handles string or UUID user identifiers.
 * Also triggers a role-specific notification if requested.
 */
const logActivity = async (req, action, details, notifyRole = null, notifyMsg = null, affectedTable = null) => {
  try {
    const rawUserId = req && req.user ? req.user.id : null;
    const userId = isUUID(rawUserId) ? rawUserId : null;
    const username = req && req.user ? req.user.username : 'SYSTEM';
    const role = req && req.user ? req.user.role : 'SYSTEM';

    // Log to Audit Log
    await AuditLog.create({
      userId,
      username,
      role,
      action,
      details,
      affectedTable
    });

    // Create a notification if required
    if (notifyRole && notifyMsg) {
      await Notification.create({
        title: action.replace(/_/g, ' '),
        message: notifyMsg,
        roleTarget: notifyRole,
        isRead: false
      });
    }

    console.log(`[AUDIT] User: ${username} | Action: ${action} | Details: ${details}`);
  } catch (error) {
    console.error('Logging activity failed:', error.message);
  }
};

module.exports = {
  logActivity
};
