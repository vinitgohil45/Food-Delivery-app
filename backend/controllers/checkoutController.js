import Cart from '../models/Cart.js';
import CartItem from '../models/CartItem.js';
import Address from '../models/Address.js';
import MenuItem from '../models/MenuItem.js';
import Order from '../models/Order.js';
import OrderItem from '../models/OrderItem.js';
import Wallet from '../models/Wallet.js';
import WalletTransaction from '../models/WalletTransaction.js';
import Coupon from '../models/Coupon.js';
import Restaurant from '../models/Restaurant.js';
import { AppError } from '../middlewares/errorHandler.js';
import asyncHandler from '../middlewares/asyncHandler.js';
import { emitSocketEvent } from '../socket/socket.js';
import { sendNotification } from '../services/notificationService.js';

// Pricing Calculator Engine Helper
const calculateGrandTotal = async (userId, addressId, couponCode = '', driverTip = 0) => {
  const cart = await Cart.findOne({ user: userId });
  if (!cart || !cart.restaurant) {
    throw new AppError('Your cart is empty', 400);
  }

  const restaurant = await Restaurant.findById(cart.restaurant);
  if (!restaurant) {
    throw new AppError('Restaurant not found', 404);
  }

  // Calculate items subtotal
  const items = await CartItem.find({ cart: cart._id }).populate('menuItem');
  let subtotal = 0;
  for (const item of items) {
    if (!item.menuItem) continue;
    const custSum = item.selectedCustomizations.reduce((sum, c) => sum + c.price, 0);
    const basePrice = item.menuItem.discountPercent > 0
      ? Math.round(item.menuItem.price * (1 - item.menuItem.discountPercent / 100))
      : item.menuItem.price;

    subtotal += (basePrice + custSum) * item.quantity;
  }

  // Pricing constants
  const taxGst = Math.round(subtotal * 0.05); // 5% GST
  const platformFee = 2; // Flat 2 ₹
  const packingCharge = 10; // Flat 10 ₹
  const deliveryCharge = restaurant.deliveryCharge || 30;

  // Coupon calculations
  let discount = 0;
  let couponRef = null;
  if (couponCode) {
    const coupon = await Coupon.findOne({ code: couponCode.toUpperCase(), isActive: true });
    if (coupon && coupon.isValid(subtotal)) {
      couponRef = coupon;
      if (coupon.discountType === 'flat') {
        discount = coupon.discountValue;
      } else {
        discount = Math.round(subtotal * (coupon.discountValue / 100));
        if (coupon.maxDiscountAmount && discount > coupon.maxDiscountAmount) {
          discount = coupon.maxDiscountAmount;
        }
      }
    }
  }

  const grandTotal = subtotal + taxGst + platformFee + packingCharge + deliveryCharge + driverTip - discount;

  return {
    subtotal,
    taxGst,
    platformFee,
    packingCharge,
    deliveryCharge,
    discount,
    grandTotal: Math.max(0, grandTotal),
    coupon: couponRef,
    restaurant,
    items,
  };
};

/**
 * @route   GET /api/v1/checkout/summary
 * @desc    Get complete bill summary breakdown for current cart
 * @access  Private
 */
export const getCheckoutSummary = asyncHandler(async (req, res, next) => {
  const { couponCode, driverTip } = req.query;

  const summary = await calculateGrandTotal(
    req.user._id,
    null,
    couponCode,
    parseFloat(driverTip) || 0
  );

  res.status(200).json({
    success: true,
    message: 'Checkout summary calculated successfully',
    data: {
      subtotal: summary.subtotal,
      taxGst: summary.taxGst,
      platformFee: summary.platformFee,
      packingCharge: summary.packingCharge,
      deliveryCharge: summary.deliveryCharge,
      discount: summary.discount,
      grandTotal: summary.grandTotal,
    },
    errors: null,
  });
});

/**
 * @route   POST /api/v1/checkout
 * @desc    Place an order (Checkout submission)
 * @access  Private
 */
export const createOrder = asyncHandler(async (req, res, next) => {
  const { addressId, paymentMethod, couponCode, driverTip } = req.body;

  // 1. Fetch address
  const address = await Address.findById(addressId);
  if (!address || address.user.toString() !== req.user._id.toString()) {
    return next(new AppError('Delivery address not found or invalid', 400));
  }

  // 2. Perform pricing engine verification
  const calc = await calculateGrandTotal(
    req.user._id,
    addressId,
    couponCode,
    parseFloat(driverTip) || 0
  );

  // 3. Enforce inventory stock check
  for (const item of calc.items) {
    if (item.menuItem.inventoryCount < item.quantity) {
      return next(new AppError(`Stock exceeded for item: ${item.menuItem.name}`, 400));
    }
  }

  // 4. Wallet payment deduction checks
  if (paymentMethod === 'wallet') {
    let wallet = await Wallet.findOne({ user: req.user._id });
    if (!wallet || wallet.balance < calc.grandTotal) {
      return next(new AppError('Insufficient wallet balance to place this order', 400));
    }

    wallet.balance -= calc.grandTotal;
    await wallet.save();

    // Create wallet transaction record
    await WalletTransaction.create({
      wallet: wallet._id,
      amount: calc.grandTotal,
      transactionType: 'debit',
      purpose: 'order_payment',
      description: `Payment for CraveGo order`,
    });
  }

  // 5. Decrement Menu Item stock parameters
  for (const item of calc.items) {
    item.menuItem.inventoryCount -= item.quantity;
    if (item.menuItem.inventoryCount === 0) {
      item.menuItem.isAvailable = false;
    }
    await item.menuItem.save();
  }

  // 6. Generate order numbers
  const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const rand = Math.floor(1000 + Math.random() * 9000);
  const orderNumber = `ORD-${dateStr}-${rand}`;

  // 7. Create Order document
  const order = await Order.create({
    orderNumber,
    customer: req.user._id,
    restaurant: calc.restaurant._id,
    status: 'placed',
    deliveryAddress: {
      formattedAddress: address.formattedAddress,
      location: address.location,
      instructions: address.deliveryInstructions || '',
    },
    billing: {
      itemTotal: calc.subtotal,
      taxGst: calc.taxGst,
      deliveryCharge: calc.deliveryCharge,
      platformFee: calc.platformFee,
      packingCharge: calc.packingCharge,
      couponDiscount: calc.discount,
      driverTip: parseFloat(driverTip) || 0,
      grandTotal: calc.grandTotal,
    },
    paymentMethod,
    paymentStatus: paymentMethod === 'wallet' ? 'paid' : 'pending',
    coupon: calc.coupon ? calc.coupon._id : null,
  });

  // 8. Create OrderItem child documents
  for (const item of calc.items) {
    await OrderItem.create({
      order: order._id,
      menuItem: item.menuItem._id,
      name: item.menuItem.name,
      price: item.menuItem.price,
      quantity: item.quantity,
      selectedCustomizations: item.selectedCustomizations,
    });
  }

  // 9. Wipe customer shopping cart
  const cart = await Cart.findOne({ user: req.user._id });
  await CartItem.deleteMany({ cart: cart._id });
  cart.restaurant = null;
  await cart.save();

  // Real-time socket notification signals
  emitSocketEvent('restaurant_owners', 'order:new', order);
  emitSocketEvent('admins', 'order:new', order);

  // Dispatch customer notification
  await sendNotification({
    userId: req.user._id,
    title: 'Order Placed Successfully! 🎉',
    message: `Your order ${order.orderNumber} for ₹${order.billing.grandTotal} has been successfully placed.`,
    type: 'order_update',
    priority: 'high',
    emailData: {
      template: 'order',
      orderNumber: order.orderNumber,
      total: order.billing.grandTotal,
    },
  });

  // Dispatch merchant notification
  if (calc.restaurant?.owner) {
    await sendNotification({
      userId: calc.restaurant.owner,
      title: 'New Order Received 🛒',
      message: `You have received a new order ${order.orderNumber} containing ${calc.items.length} items.`,
      type: 'system',
      priority: 'high',
    });
  }

  res.status(201).json({
    success: true,
    message: 'Order placed successfully!',
    data: order,
    errors: null,
  });
});
