import Notification from '../models/Notification.js';
import User from '../models/User.js';
import { AppError } from '../middlewares/errorHandler.js';
import asyncHandler from '../middlewares/asyncHandler.js';
import { emitSocketEvent } from '../socket/socket.js';

/**
 * @route   GET /api/v1/notifications
 * @desc    Get current user's notifications (supports page pagination & read filter)
 * @access  Private
 */
export const getNotifications = asyncHandler(async (req, res, next) => {
  const page = parseInt(req.query.page, 10) || 1;
  const limit = parseInt(req.query.limit, 10) || 15;
  const skip = (page - 1) * limit;

  const query = { user: req.user._id };
  
  if (req.query.isRead) {
    query.isRead = req.query.isRead === 'true';
  }

  const notifications = await Notification.find(query)
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit);

  const total = await Notification.countDocuments(query);
  const unreadCount = await Notification.countDocuments({ user: req.user._id, isRead: false });

  res.status(200).json({
    success: true,
    message: 'Notifications retrieved successfully',
    data: {
      notifications,
      unreadCount,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit),
      },
    },
    errors: null,
  });
});

/**
 * @route   PATCH /api/v1/notifications/read
 * @desc    Mark specific notification(s) as read
 * @access  Private
 */
export const markRead = asyncHandler(async (req, res, next) => {
  const { ids, id } = req.body;
  const targetIds = Array.isArray(ids) ? ids : id ? [id] : [];

  if (targetIds.length === 0) {
    return next(new AppError('Please provide notification IDs to mark as read', 400));
  }

  await Notification.updateMany(
    { _id: { $in: targetIds }, user: req.user._id },
    { $set: { isRead: true } }
  );

  // Emit event to update socket client state
  emitSocketEvent(`user_${req.user._id}`, 'notification:read', { ids: targetIds });

  res.status(200).json({
    success: true,
    message: 'Notifications marked as read successfully',
    data: targetIds,
    errors: null,
  });
});

/**
 * @route   PATCH /api/v1/notifications/read-all
 * @desc    Mark all of current user's notifications as read
 * @access  Private
 */
export const markAllRead = asyncHandler(async (req, res, next) => {
  await Notification.updateMany(
    { user: req.user._id, isRead: false },
    { $set: { isRead: true } }
  );

  emitSocketEvent(`user_${req.user._id}`, 'notification:read_all', null);

  res.status(200).json({
    success: true,
    message: 'All notifications marked as read',
    data: null,
    errors: null,
  });
});

/**
 * @route   DELETE /api/v1/notifications/:id
 * @desc    Delete a notification by ID
 * @access  Private
 */
export const deleteNotification = asyncHandler(async (req, res, next) => {
  const notif = await Notification.findOne({ _id: req.params.id, user: req.user._id });
  
  if (!notif) {
    return next(new AppError('Notification not found or unauthorized', 404));
  }

  await notif.deleteOne();

  emitSocketEvent(`user_${req.user._id}`, 'notification:delete', { id: req.params.id });

  res.status(200).json({
    success: true,
    message: 'Notification deleted successfully',
    data: req.params.id,
    errors: null,
  });
});

/**
 * @route   PUT /api/v1/notifications/preferences
 * @desc    Update notification preference configuration
 * @access  Private
 */
export const updatePreferences = asyncHandler(async (req, res, next) => {
  const { email, inApp, push } = req.body;
  
  const user = await User.findById(req.user._id);
  if (!user) {
    return next(new AppError('User not found', 404));
  }

  if (email !== undefined) user.notificationPreferences.email = email;
  if (inApp !== undefined) user.notificationPreferences.inApp = inApp;
  if (push !== undefined) user.notificationPreferences.push = push;

  await user.save();

  res.status(200).json({
    success: true,
    message: 'Notification preferences updated successfully',
    data: user.notificationPreferences,
    errors: null,
  });
});

/**
 * @route   POST /api/v1/notifications/push-subscribe
 * @desc    Register user PWA Push subscription payload
 * @access  Private
 */
export const updatePushSubscription = asyncHandler(async (req, res, next) => {
  const { subscription } = req.body;

  const user = await User.findById(req.user._id);
  if (!user) {
    return next(new AppError('User not found', 404));
  }

  user.pushSubscription = subscription || null;
  await user.save();

  res.status(200).json({
    success: true,
    message: 'Push subscription registered successfully',
    data: null,
    errors: null,
  });
});
