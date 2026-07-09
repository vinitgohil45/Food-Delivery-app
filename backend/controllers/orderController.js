import Order from '../models/Order.js';
import OrderItem from '../models/OrderItem.js';
import Restaurant from '../models/Restaurant.js';
import User from '../models/User.js';
import Cart from '../models/Cart.js';
import CartItem from '../models/CartItem.js';
import Wallet from '../models/Wallet.js';
import WalletTransaction from '../models/WalletTransaction.js';
import Review from '../models/Review.js';
import DeliveryJob from '../models/DeliveryJob.js';
import { AppError } from '../middlewares/errorHandler.js';
import asyncHandler from '../middlewares/asyncHandler.js';
import { emitSocketEvent } from '../socket/socket.js';
import { sendNotification } from '../services/notificationService.js';

/**
 * @route   GET /api/v1/orders
 * @desc    Get order history list based on user role (customer, owner, driver, admin)
 * @access  Private
 */
export const getOrders = asyncHandler(async (req, res, next) => {
  const page = parseInt(req.query.page, 10) || 1;
  const limit = parseInt(req.query.limit, 10) || 10;
  const skip = (page - 1) * limit;

  let query = {};

  if (req.user.role === 'customer') {
    query.customer = req.user._id;
  } else if (req.user.role === 'restaurant_owner') {
    // Find all restaurants owned by this owner
    const ownedOutlets = await Restaurant.find({ owner: req.user._id });
    const outletIds = ownedOutlets.map((r) => r._id);
    query.restaurant = { $in: outletIds };
  } else if (req.user.role === 'delivery_partner') {
    // Return assigned orders or orders pending driver pickup (status prepared)
    query = {
      $or: [
        { deliveryPartner: req.user._id },
        { status: 'prepared', deliveryPartner: null },
      ],
    };
  }

  const orders = await Order.find(query)
    .populate('restaurant', 'name formattedAddress')
    .populate('customer', 'name email phone')
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit);

  const total = await Order.countDocuments(query);

  res.status(200).json({
    success: true,
    message: 'Orders retrieved successfully',
    data: {
      orders,
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
 * @route   GET /api/v1/orders/:id
 * @desc    Get detailed order specifications by ID
 * @access  Private
 */
export const getOrderById = asyncHandler(async (req, res, next) => {
  const order = await Order.findById(req.params.id)
    .populate('restaurant', 'name formattedAddress phone gstNumber licenseNumber')
    .populate('customer', 'name email phone')
    .populate('deliveryPartner', 'name phone')
    .populate('items');

  if (!order) {
    return next(new AppError('Order not found', 404));
  }

  // Authorize check
  if (
    req.user.role === 'customer' && order.customer._id.toString() !== req.user._id.toString()
  ) {
    return next(new AppError('Unauthorized access to this order details', 403));
  }

  res.status(200).json({
    success: true,
    message: 'Order details retrieved',
    data: order,
    errors: null,
  });
});

/**
 * @route   PATCH /api/v1/orders/:id/status
 * @desc    Update order lifecycle status
 * @access  Private (restaurant_owner, delivery_partner, admin)
 */
export const updateOrderStatus = asyncHandler(async (req, res, next) => {
  const { status, note } = req.body;
  const order = await Order.findById(req.params.id);

  if (!order) {
    return next(new AppError('Order not found', 404));
  }

  // Role validation constraints
  if (req.user.role === 'restaurant_owner') {
    const isOwner = await Restaurant.exists({ _id: order.restaurant, owner: req.user._id });
    if (!isOwner) return next(new AppError('You do not own this restaurant', 403));

    // Owners can only mark preparing/prepared states
    if (!['accepted', 'preparing', 'prepared'].includes(status)) {
      return next(new AppError('Restricted status transition for restaurant owners', 400));
    }
  } else if (req.user.role === 'delivery_partner') {
    // Drivers can only update delivery trip coordinates states
    if (!['picked_up', 'on_the_way', 'delivered'].includes(status)) {
      return next(new AppError('Restricted status transition for delivery partners', 400));
    }
    // Set driver reference on pickup
    if (status === 'picked_up') {
      order.deliveryPartner = req.user._id;
    }
  }

  order.status = status;
  if (status === 'delivered') {
    order.paymentStatus = 'paid';
    order.actualDeliveryTime = new Date();
  }

  // Push into timeline
  order.timeline.push({
    status,
    timestamp: new Date(),
    note: note || `Order status updated to ${status}`,
  });

  await order.save();

  // Socket notification emits
  emitSocketEvent(`order_${order._id}`, `order:${status}`, order);
  emitSocketEvent(`user_${order.customer}`, `order:${status}`, order);
  if (status === 'prepared') {
    await DeliveryJob.findOneAndUpdate(
      { order: order._id },
      {
        status: 'waiting_for_driver',
        driverAssigned: false,
        available: true,
        restaurant: order.restaurant,
        customer: order.customer,
        deliveryAddress: order.deliveryAddress,
      },
      { upsert: true, new: true }
    );
    emitSocketEvent('delivery_partners', 'order:ready', order);
    emitSocketEvent('delivery_partners', 'delivery:new', order);
  }

  // Dispatch customer notification
  let title = 'Order Update';
  let message = `Your order status is now ${status}.`;
  if (status === 'accepted') {
    title = 'Order Accepted! 🍳';
    message = 'The restaurant has accepted your order and will start preparing it shortly.';
  } else if (status === 'preparing') {
    title = 'Preparing your meal 🧑‍🍳';
    message = 'Your delicious treats are being freshly cooked!';
  } else if (status === 'prepared') {
    title = 'Food Ready! 🥡';
    message = 'Your order has been packaged and is ready for pickup.';
  } else if (status === 'picked_up') {
    title = 'Order Picked Up! 🚴';
    message = 'Our delivery partner has picked up your food and is heading your way.';
  } else if (status === 'on_the_way') {
    title = 'Out for Delivery 🛵';
    message = 'Your delivery partner is nearby. Keep your phone handy!';
  } else if (status === 'delivered') {
    title = 'Delivered! 😋';
    message = 'Enjoy your delicious meal! Don\'t forget to rate your experience.';
  }

  await sendNotification({
    userId: order.customer,
    title,
    message,
    type: 'order_update',
    priority: 'high',
  });

  res.status(200).json({
    success: true,
    message: `Order status set to ${status}`,
    data: order,
    errors: null,
  });
});

/**
 * @route   PATCH /api/v1/orders/:id/cancel
 * @desc    Cancel order (with wallet refund calculations)
 * @access  Private
 */
export const cancelOrder = asyncHandler(async (req, res, next) => {
  const { reason } = req.body;
  const order = await Order.findById(req.params.id);

  if (!order) return next(new AppError('Order not found', 404));

  // Customers can only cancel if order has not been accepted by restaurant
  if (req.user.role === 'customer') {
    if (order.customer.toString() !== req.user._id.toString()) {
      return next(new AppError('Unauthorized', 403));
    }
    if (order.status !== 'placed') {
      return next(new AppError('Cannot cancel order after it has been accepted/prepared', 400));
    }
  }

  order.status = 'cancelled';
  order.timeline.push({
    status: 'cancelled',
    timestamp: new Date(),
    note: `Order cancelled. Reason: ${reason}`,
  });

  // Handle wallet refunds
  if (order.paymentStatus === 'paid' && order.paymentMethod === 'wallet') {
    let wallet = await Wallet.findOne({ user: order.customer });
    if (wallet) {
      wallet.balance += order.billing.grandTotal;
      await wallet.save();

      await WalletTransaction.create({
        wallet: wallet._id,
        amount: order.billing.grandTotal,
        transactionType: 'credit',
        purpose: 'refund',
        description: `Refund for cancelled order ${order.orderNumber}`,
      });
      order.paymentStatus = 'refunded';
    }
  }

  await order.save();

  // Socket notification emits
  emitSocketEvent(`order_${order._id}`, 'order:cancelled', order);
  emitSocketEvent(`user_${order.customer}`, 'order:cancelled', order);

  // Notify customer
  await sendNotification({
    userId: order.customer,
    title: 'Order Cancelled ❌',
    message: `Your order ${order.orderNumber} has been cancelled. Reason: ${reason || 'Not specified'}.${
      order.paymentStatus === 'refunded' ? ` ₹${order.billing.grandTotal} has been refunded to your wallet.` : ''
    }`,
    type: 'order_update',
    priority: 'high',
  });

  // Notify restaurant owner
  const rest = await Restaurant.findById(order.restaurant);
  if (rest?.owner) {
    await sendNotification({
      userId: rest.owner,
      title: 'Order Cancelled ❌',
      message: `Order ${order.orderNumber} has been cancelled.`,
      type: 'system',
      priority: 'high',
    });
  }

  res.status(200).json({
    success: true,
    message: 'Order cancelled successfully',
    data: order,
    errors: null,
  });
});

/**
 * @route   PATCH /api/v1/orders/:id/assign-driver
 * @desc    Assign delivery partner to an order
 * @access  Private (admin, restaurant_owner)
 */
export const assignDriver = asyncHandler(async (req, res, next) => {
  const { deliveryPartnerId } = req.body;
  const order = await Order.findById(req.params.id);

  if (!order) return next(new AppError('Order not found', 404));

  order.deliveryPartner = deliveryPartnerId;
  order.timeline.push({
    status: order.status,
    timestamp: new Date(),
    note: 'Delivery partner assigned to order',
  });

  await order.save();

  // Socket notification emits
  emitSocketEvent(`order_${order._id}`, 'driver:assigned', order);
  emitSocketEvent(`user_${order.customer}`, 'driver:assigned', order);

  // Notify customer
  await sendNotification({
    userId: order.customer,
    title: 'Delivery Partner Assigned 🚴',
    message: `A delivery partner has been assigned to pick up your order ${order.orderNumber}.`,
    type: 'order_update',
    priority: 'medium',
  });

  // Notify delivery partner
  await sendNotification({
    userId: deliveryPartnerId,
    title: 'New Delivery Request 🚴',
    message: `You have been assigned to deliver order ${order.orderNumber}.`,
    type: 'system',
    priority: 'high',
  });

  res.status(200).json({
    success: true,
    message: 'Delivery partner assigned successfully',
    data: order,
    errors: null,
  });
});

/**
 * @route   PATCH /api/v1/orders/:id/rate
 * @desc    Rate and review order
 * @access  Private (customer)
 */
export const rateOrder = asyncHandler(async (req, res, next) => {
  const { rating, review } = req.body;
  const order = await Order.findById(req.params.id);

  if (!order) return next(new AppError('Order not found', 404));

  if (order.customer.toString() !== req.user._id.toString()) {
    return next(new AppError('Unauthorized', 403));
  }

  if (order.status !== 'delivered') {
    return next(new AppError('Cannot rate order before it has been delivered', 400));
  }

  // Create review mapping record
  const reviewDoc = await Review.create({
    user: req.user._id,
    restaurant: order.restaurant,
    order: order._id,
    rating,
    comment: review || '',
  });

  // Notify restaurant owner
  const rest = await Restaurant.findById(order.restaurant);
  if (rest?.owner) {
    await sendNotification({
      userId: rest.owner,
      title: 'New Review Received ⭐',
      message: `Your restaurant ${rest.name} received a ${rating}-star review for order ${order.orderNumber}.`,
      type: 'system',
      priority: 'medium',
    });
  }

  res.status(201).json({
    success: true,
    message: 'Order rated and reviewed successfully',
    data: reviewDoc,
    errors: null,
  });
});

/**
 * @route   POST /api/v1/orders/reorder
 * @desc    Re-add items of previous order into active cart
 * @access  Private (customer)
 */
export const reorder = asyncHandler(async (req, res, next) => {
  const { orderId } = req.body;
  const order = await Order.findById(orderId);
  if (!order) return next(new AppError('Order not found', 404));

  const items = await OrderItem.find({ order: order._id });

  // 1. Fetch or create cart
  let cart = await Cart.findOne({ user: req.user._id });
  if (!cart) {
    cart = await Cart.create({ user: req.user._id });
  }

  // 2. Clear current cart items
  await CartItem.deleteMany({ cart: cart._id });

  // 3. Populate new items
  cart.restaurant = order.restaurant;
  await cart.save();

  for (const item of items) {
    await CartItem.create({
      cart: cart._id,
      menuItem: item.menuItem,
      quantity: item.quantity,
      selectedCustomizations: item.selectedCustomizations,
    });
  }

  res.status(200).json({
    success: true,
    message: 'Items added to cart. Directing to cart page.',
    data: cart,
    errors: null,
  });
});

/**
 * @route   GET /api/v1/orders/invoice/:id
 * @desc    Generate printable HTML invoice sheet
 * @access  Private
 */
export const getOrderInvoice = asyncHandler(async (req, res, next) => {
  const order = await Order.findById(req.params.id)
    .populate('restaurant', 'name formattedAddress gstNumber licenseNumber')
    .populate('customer', 'name email phone')
    .populate('items');

  if (!order) return next(new AppError('Order not found', 404));

  // Build high-fidelity printable HTML
  const invoiceHtml = `
    <!DOCTYPE html>
    <html>
    <head>
      <title>Invoice - ${order.orderNumber}</title>
      <style>
        body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; color: #333; margin: 40px; }
        .invoice-box { max-width: 800px; margin: auto; padding: 30px; border: 1px solid #eee; box-shadow: 0 0 10px rgba(0, 0, 0, .15); font-size: 14px; line-height: 24px; }
        .header { display: flex; justify-content: space-between; border-bottom: 2px solid #f44336; pb: 20px; margin-bottom: 20px; }
        .logo { font-size: 24px; font-weight: bold; color: #f44336; }
        .invoice-details { text-align: right; }
        .section-title { font-weight: bold; margin-top: 20px; border-bottom: 1px solid #eee; padding-bottom: 5px; }
        table { width: 100%; border-collapse: collapse; margin-top: 20px; }
        th, td { padding: 10px; border: 1px solid #eee; text-align: left; }
        th { bg-color: #f9f9f9; }
        .totals { margin-top: 20px; text-align: right; }
        .totals p { margin: 5px 0; }
        .grand-total { font-size: 16px; font-weight: bold; color: #f44336; }
      </style>
    </head>
    <body>
      <div class="invoice-box">
        <div class="header">
          <div>
            <div class="logo">CraveGo</div>
            <p>${order.restaurant.name}<br>${order.restaurant.formattedAddress}<br>GSTIN: ${order.restaurant.gstNumber}</p>
          </div>
          <div class="invoice-details">
            <h2>INVOICE</h2>
            <p>Order #: ${order.orderNumber}<br>Date: ${new Date(order.createdAt).toLocaleDateString()}<br>Payment Method: ${order.paymentMethod.toUpperCase()}</p>
          </div>
        </div>

        <div class="section-title">Bill To:</div>
        <p>${order.customer.name}<br>Phone: ${order.customer.phone}<br>Address: ${order.deliveryAddress.formattedAddress}</p>

        <table>
          <thead>
            <tr>
              <th>Item</th>
              <th>Qty</th>
              <th>Base Price</th>
              <th>Total Price</th>
            </tr>
          </thead>
          <tbody>
            ${order.items.map((i) => `
              <tr>
                <td>${i.name} ${i.selectedCustomizations.length > 0 ? `(${i.selectedCustomizations.map(c => c.optionName).join(', ')})` : ''}</td>
                <td>${i.quantity}</td>
                <td>₹${i.price}</td>
                <td>₹${i.price * i.quantity}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>

        <div class="totals">
          <p>Items Subtotal: ₹${order.billing.itemTotal}</p>
          <p>GST (5%): ₹${order.billing.taxGst}</p>
          <p>Platform Fee: ₹${order.billing.platformFee}</p>
          <p>Packaging Charge: ₹${order.billing.packingCharge}</p>
          <p>Delivery Fee: ₹${order.billing.deliveryCharge}</p>
          ${order.billing.couponDiscount > 0 ? `<p style="color: green">Discount: -₹${order.billing.couponDiscount}</p>` : ''}
          ${order.billing.driverTip > 0 ? `<p>Driver Tip: ₹${order.billing.driverTip}</p>` : ''}
          <hr>
          <p class="grand-total">Grand Total: ₹${order.billing.grandTotal}</p>
        </div>
      </div>
    </body>
    </html>
  `;

  res.setHeader('Content-Type', 'text/html');
  res.status(200).send(invoiceHtml);
});
