import Notification from '../models/Notification.js';
import User from '../models/User.js';
import { emitSocketEvent } from '../socket/socket.js';
import {
  sendWelcomeEmail,
  sendOrderConfirmationEmail,
  sendPaymentConfirmationEmail,
  sendRestaurantVerificationEmail,
  sendPasswordResetEmail,
} from './emailService.js';
import logger from '../utils/logger.js';

/**
 * Dispatch a notification across In-App, Socket.IO, Email, and Push depending on user preferences
 */
export const sendNotification = async ({
  userId,
  title,
  message,
  type = 'system',
  priority = 'medium',
  emailData = null, // e.g. { template: 'welcome' } or { template: 'order', orderNumber, total }
}) => {
  try {
    const user = await User.findById(userId);
    if (!user) {
      logger.warn(`Failed to dispatch notification: User [${userId}] not found`);
      return null;
    }

    const preferences = user.notificationPreferences || { email: true, inApp: true, push: true };
    let notif = null;

    // 1. In-App & Socket.IO Notification
    if (preferences.inApp !== false) {
      notif = await Notification.create({
        user: userId,
        title,
        message,
        type,
        priority,
      });

      // Emit real-time event to user socket room
      emitSocketEvent(`user_${userId}`, 'notification:new', notif);
    }

    // 2. Email Notification (Mock template trigger)
    if (preferences.email !== false && emailData?.template) {
      const { template } = emailData;
      
      try {
        if (template === 'welcome') {
          await sendWelcomeEmail(user.email, user.name);
        } else if (template === 'order') {
          await sendOrderConfirmationEmail(user.email, user.name, emailData.orderNumber, emailData.total);
        } else if (template === 'payment') {
          await sendPaymentConfirmationEmail(user.email, user.name, emailData.orderNumber, emailData.amount, emailData.method);
        } else if (template === 'verification') {
          await sendRestaurantVerificationEmail(user.email, user.name, emailData.status);
        } else if (template === 'reset') {
          await sendPasswordResetEmail(user.email, user.name, emailData.otp);
        }
      } catch (err) {
        logger.error(`Failed to dispatch email for template [${template}]:`, err);
      }
    }

    // 3. PWA Push Notification (Mock/Logged)
    if (preferences.push !== false) {
      logger.info(`
        ==================================================
        📲 PWA PUSH NOTIFICATION DISPATCHED
        ==================================================
        To User: ${user.name} [ID: ${user._id}]
        Subscription registered: ${user.pushSubscription ? 'YES' : 'NO (Using mock sandbox endpoint)'}
        Title: ${title}
        Message: ${message}
        Priority: ${priority.toUpperCase()}
        ==================================================
      `);
    }

    return notif;
  } catch (err) {
    logger.error('Error dispatching notification:', err);
    return null;
  }
};
