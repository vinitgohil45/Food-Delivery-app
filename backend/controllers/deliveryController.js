import Order from '../models/Order.js';
import Restaurant from '../models/Restaurant.js';
import User from '../models/User.js';
import DeliveryJob from '../models/DeliveryJob.js';
import { AppError } from '../middlewares/errorHandler.js';
import asyncHandler from '../middlewares/asyncHandler.js';
import { emitSocketEvent } from '../socket/socket.js';
import { sendNotification } from '../services/notificationService.js';

/**
 * @route   GET /api/v1/delivery/available-orders
 * @desc    Get all orders that are prepared and waiting for a driver
 * @access  Private (delivery_partner)
 */
export const getAvailableOrders = asyncHandler(async (req, res, next) => {
  // Query delivery jobs that are waiting for driver and available
  const jobs = await DeliveryJob.find({
    status: 'waiting_for_driver',
    available: true,
  })
    .populate({
      path: 'order',
      populate: { path: 'customer', select: 'name phone' }
    })
    .populate('restaurant');

  // Filter out invalid/deleted/inactive items
  const filteredJobs = jobs.filter(
    (job) => job.order && !job.order.isDeleted && job.restaurant && job.restaurant.isActive && job.deliveryAddress?.formattedAddress
  );

  const formatted = filteredJobs.map(job => ({
    _id: job.order._id,
    orderNumber: job.order.orderNumber,
    status: 'prepared', // Backward compatibility for prepared UI state
    deliveryAddress: job.deliveryAddress,
    billing: job.order.billing,
    customer: job.order.customer,
    restaurant: job.restaurant,
    deliveryPartner: null,
  }));

  res.status(200).json({
    success: true,
    data: formatted,
  });
});

/**
 * @route   GET /api/v1/delivery/my-orders
 * @desc    Get delivery partner's accepted/active/completed runs
 * @access  Private (delivery_partner)
 */
export const getMyOrders = asyncHandler(async (req, res, next) => {
  const jobs = await DeliveryJob.find({
    deliveryPartner: req.user._id,
  })
    .populate({
      path: 'order',
      populate: { path: 'customer', select: 'name phone' }
    })
    .populate('restaurant')
    .sort({ updatedAt: -1 });

  const formatted = jobs.map(job => ({
    _id: job.order._id,
    orderNumber: job.order.orderNumber,
    status: job.order.status,
    deliveryAddress: job.deliveryAddress,
    billing: job.order.billing,
    customer: job.order.customer,
    restaurant: job.restaurant,
    deliveryPartner: job.deliveryPartner,
    paymentMethod: job.order.paymentMethod,
    paymentStatus: job.order.paymentStatus,
  }));

  res.status(200).json({
    success: true,
    data: formatted,
  });
});

/**
 * @route   POST /api/v1/delivery/accept/:orderId
 * @desc    Accept delivery request and assign partner
 * @access  Private (delivery_partner)
 */
export const acceptOrder = asyncHandler(async (req, res, next) => {
  const { orderId } = req.params;
  const order = await Order.findById(orderId);

  if (!order) {
    return next(new AppError('Order not found', 404));
  }

  const job = await DeliveryJob.findOne({ order: orderId });
  if (!job) {
    return next(new AppError('Delivery job not found', 404));
  }

  if (job.deliveryPartner || !job.available) {
    return next(new AppError('This order has already been accepted by another driver', 400));
  }

  // Update order partner reference
  order.deliveryPartner = req.user._id;
  
  order.timeline.push({
    status: order.status,
    timestamp: new Date(),
    note: `Delivery partner ${req.user.name} accepted the job request.`,
  });

  await order.save();

  // Update delivery job parameters
  job.status = 'assigned';
  job.driverAssigned = true;
  job.available = false;
  job.deliveryPartner = req.user._id;
  await job.save();

  // Socket notification emits
  emitSocketEvent(`order_${order._id}`, 'driver:assigned', order);
  emitSocketEvent(`user_${order.customer}`, 'driver:assigned', order);
  emitSocketEvent('delivery_partners', 'delivery:accepted', { orderId: order._id, driverId: req.user._id });

  // Notifications
  await sendNotification({
    userId: order.customer,
    title: 'Delivery Partner Assigned 🚴',
    message: `Delivery Partner ${req.user.name} is on the way to pick up your order.`,
    type: 'order_update',
    priority: 'high',
  });

  const rest = await Restaurant.findById(order.restaurant);
  if (rest?.owner) {
    await sendNotification({
      userId: rest.owner,
      title: 'Driver Assigned 🚴',
      message: `Delivery driver ${req.user.name} accepted order ${order.orderNumber}.`,
      type: 'system',
      priority: 'medium',
    });
  }

  res.status(200).json({
    success: true,
    message: 'Delivery job accepted successfully',
    data: order,
  });
});

/**
 * @route   POST /api/v1/delivery/reject/:orderId
 * @desc    Reject/skip delivery run
 * @access  Private (delivery_partner)
 */
export const rejectOrder = asyncHandler(async (req, res, next) => {
  // Reject/skip operation returns success as it allows the driver to filter/dismiss on client
  res.status(200).json({
    success: true,
    message: 'Delivery run rejected/skipped',
  });
});

/**
 * @route   PATCH /api/v1/delivery/location
 * @desc    Update driver live location coordinates
 * @access  Private (delivery_partner)
 */
export const updateLocation = asyncHandler(async (req, res, next) => {
  const { orderId, latitude, longitude } = req.body;

  if (!orderId || latitude === undefined || longitude === undefined) {
    return next(new AppError('Please provide orderId, latitude, and longitude', 400));
  }

  const order = await Order.findById(orderId);
  if (!order) return next(new AppError('Order not found', 404));

  // Stream live update to order room
  emitSocketEvent(`order_${orderId}`, 'delivery:location', {
    orderId,
    latitude,
    longitude,
    timestamp: new Date(),
  });

  res.status(200).json({
    success: true,
    message: 'Location coordinate stream sent successfully',
  });
});

/**
 * @route   PATCH /api/v1/delivery/pickup
 * @desc    Mark order as picked up (on the way)
 * @access  Private (delivery_partner)
 */
export const pickupOrder = asyncHandler(async (req, res, next) => {
  const { orderId } = req.body;
  const order = await Order.findOne({ _id: orderId, deliveryPartner: req.user._id });

  if (!order) {
    return next(new AppError('Order not found or unauthorized', 404));
  }

  // Update matching delivery job status
  const job = await DeliveryJob.findOne({ order: orderId, deliveryPartner: req.user._id });
  if (job) {
    job.status = 'picked_up';
    await job.save();
  }

  order.status = 'picked_up';
  order.timeline.push({
    status: 'picked_up',
    timestamp: new Date(),
    note: 'Driver picked up your food package from the kitchen.',
  });

  await order.save();

  // Socket emits
  emitSocketEvent(`order_${order._id}`, 'order:picked_up', order);
  emitSocketEvent(`user_${order.customer}`, 'order:picked_up', order);
  emitSocketEvent(`order_${order._id}`, 'delivery:picked-up', order);

  await sendNotification({
    userId: order.customer,
    title: 'Order Picked Up! 🚴',
    message: 'Your food has been picked up and is heading your way.',
    type: 'order_update',
    priority: 'high',
  });

  res.status(200).json({
    success: true,
    message: 'Order status set to picked_up',
    data: order,
  });
});

/**
 * @route   PATCH /api/v1/delivery/delivered
 * @desc    Mark order as delivered (completed)
 * @access  Private (delivery_partner)
 */
export const deliverOrder = asyncHandler(async (req, res, next) => {
  const { orderId } = req.body;
  const order = await Order.findOne({ _id: orderId, deliveryPartner: req.user._id });

  if (!order) {
    return next(new AppError('Order not found or unauthorized', 404));
  }

  // Update matching delivery job status
  const job = await DeliveryJob.findOne({ order: orderId, deliveryPartner: req.user._id });
  if (job) {
    job.status = 'delivered';
    await job.save();
  }

  order.status = 'delivered';
  order.paymentStatus = 'paid';
  order.actualDeliveryTime = new Date();
  
  order.timeline.push({
    status: 'delivered',
    timestamp: new Date(),
    note: 'Order successfully delivered. Bon Appétit!',
  });

  await order.save();

  // Socket emits
  emitSocketEvent(`order_${order._id}`, 'order:delivered', order);
  emitSocketEvent(`user_${order.customer}`, 'order:delivered', order);
  emitSocketEvent(`order_${order._id}`, 'delivery:delivered', order);

  await sendNotification({
    userId: order.customer,
    title: 'Delivered! 😋',
    message: 'Enjoy your delicious meal! Don\'t forget to rate your experience.',
    type: 'order_update',
    priority: 'high',
  });

  res.status(200).json({
    success: true,
    message: 'Order marked as delivered successfully',
    data: order,
  });
});
