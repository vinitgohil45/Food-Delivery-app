import Cart from '../models/Cart.js';
import CartItem from '../models/CartItem.js';
import MenuItem from '../models/MenuItem.js';
import Coupon from '../models/Coupon.js';
import { AppError } from '../middlewares/errorHandler.js';
import asyncHandler from '../middlewares/asyncHandler.js';

/**
 * Helper to calculate subtotal of items in a cart
 */
const calculateSubtotal = async (cartId) => {
  const items = await CartItem.find({ cart: cartId }).populate('menuItem');
  let subtotal = 0;
  for (const item of items) {
    if (!item.menuItem) continue;
    // Calculate customization prices
    const custTotal = item.selectedCustomizations.reduce((acc, c) => acc + c.price, 0);
    // Use finalPrice virtual (taking discount into account)
    const basePrice = item.menuItem.discountPercent > 0
      ? Math.round(item.menuItem.price * (1 - item.menuItem.discountPercent / 100))
      : item.menuItem.price;

    subtotal += (basePrice + custTotal) * item.quantity;
  }
  return subtotal;
};

/**
 * @route   GET /api/v1/cart
 * @desc    Get current user's cart details and billing totals
 * @access  Private
 */
export const getCart = asyncHandler(async (req, res, next) => {
  let cart = await Cart.findOne({ user: req.user._id }).populate({
    path: 'restaurant',
    select: 'name formattedAddress deliveryCharge minOrderValue',
  });

  if (!cart) {
    cart = await Cart.create({ user: req.user._id });
  }

  const items = await CartItem.find({ cart: cart._id }).populate({
    path: 'menuItem',
    select: 'name price discountPercent isVeg image isAvailable inventoryCount',
  });

  // Calculate items subtotal
  let itemsSubtotal = 0;
  for (const item of items) {
    if (!item.menuItem) continue;
    const custSum = item.selectedCustomizations.reduce((sum, c) => sum + c.price, 0);
    const basePrice = item.menuItem.discountPercent > 0
      ? Math.round(item.menuItem.price * (1 - item.menuItem.discountPercent / 100))
      : item.menuItem.price;

    itemsSubtotal += (basePrice + custSum) * item.quantity;
  }

  res.status(200).json({
    success: true,
    message: 'Cart retrieved successfully',
    data: {
      cart,
      items,
      totals: {
        subtotal: itemsSubtotal,
      },
    },
    errors: null,
  });
});

/**
 * @route   POST /api/v1/cart/add
 * @desc    Add item to cart
 * @access  Private
 */
export const addToCart = asyncHandler(async (req, res, next) => {
  const { menuItem, quantity, selectedCustomizations, instructions } = req.body;

  // 1. Fetch menu item details
  const dish = await MenuItem.findById(menuItem);
  if (!dish || dish.isDeleted) {
    return next(new AppError('Menu item not found', 404));
  }

  if (!dish.isAvailable || dish.inventoryCount < quantity) {
    return next(new AppError(`Item is out of stock. Only ${dish.inventoryCount} items left.`, 400));
  }

  // 2. Fetch or create cart
  let cart = await Cart.findOne({ user: req.user._id });
  if (!cart) {
    cart = await Cart.create({ user: req.user._id });
  }

  // 3. Enforce single restaurant rule
  if (cart.restaurant && cart.restaurant.toString() !== dish.restaurant.toString()) {
    // Check if cart has items
    const hasItems = await CartItem.exists({ cart: cart._id });
    if (hasItems) {
      return res.status(409).json({
        success: false,
        message: 'Your cart contains items from another restaurant. Replace cart items?',
        data: { conflict: true },
        errors: null,
      });
    }
  }

  // 4. Update cart restaurant reference
  cart.restaurant = dish.restaurant;
  await cart.save();

  // 5. Look for duplicate item with exact customizations
  const existingItem = await CartItem.findOne({
    cart: cart._id,
    menuItem,
    // Note: custom logic to match arrays can be complex, let's look for matching configurations or just create a new entry
  });

  if (existingItem) {
    existingItem.quantity += quantity;
    if (dish.inventoryCount < existingItem.quantity) {
      return next(new AppError(`Stock limit exceeded. Only ${dish.inventoryCount} items left.`, 400));
    }
    await existingItem.save();
  } else {
    await CartItem.create({
      cart: cart._id,
      menuItem,
      quantity,
      selectedCustomizations: selectedCustomizations || [],
      instructions,
    });
  }

  res.status(200).json({
    success: true,
    message: 'Item added to cart successfully',
    data: cart,
    errors: null,
  });
});

/**
 * @route   PATCH /api/v1/cart/item
 * @desc    Update quantity of an item in cart
 * @access  Private
 */
export const updateCartItem = asyncHandler(async (req, res, next) => {
  const { menuItem, quantity } = req.body;

  const cart = await Cart.findOne({ user: req.user._id });
  if (!cart) return next(new AppError('Cart not found', 404));

  const item = await CartItem.findOne({ cart: cart._id, menuItem });
  if (!item) return next(new AppError('Item not found in cart', 404));

  // Check stock
  const dish = await MenuItem.findById(menuItem);
  if (dish.inventoryCount < quantity) {
    return next(new AppError(`Only ${dish.inventoryCount} items left in stock`, 400));
  }

  item.quantity = quantity;
  await item.save();

  res.status(200).json({
    success: true,
    message: 'Cart item quantity updated',
    data: item,
    errors: null,
  });
});

/**
 * @route   DELETE /api/v1/cart/item
 * @desc    Remove an item from cart
 * @access  Private
 */
export const removeCartItem = asyncHandler(async (req, res, next) => {
  const { menuItem } = req.query;

  const cart = await Cart.findOne({ user: req.user._id });
  if (!cart) return next(new AppError('Cart not found', 404));

  await CartItem.deleteOne({ cart: cart._id, menuItem });

  // If no items remain, set restaurant reference to null
  const remaining = await CartItem.exists({ cart: cart._id });
  if (!remaining) {
    cart.restaurant = null;
    await cart.save();
  }

  res.status(200).json({
    success: true,
    message: 'Item removed from cart',
    data: cart,
    errors: null,
  });
});

/**
 * @route   DELETE /api/v1/cart
 * @desc    Clear all items in cart
 * @access  Private
 */
export const clearCart = asyncHandler(async (req, res, next) => {
  const cart = await Cart.findOne({ user: req.user._id });
  if (!cart) return next(new AppError('Cart not found', 404));

  await CartItem.deleteMany({ cart: cart._id });
  cart.restaurant = null;
  await cart.save();

  res.status(200).json({
    success: true,
    message: 'Cart cleared successfully',
    data: cart,
    errors: null,
  });
});

/**
 * @route   POST /api/v1/cart/apply-coupon
 * @desc    Verify and calculate coupon discount for cart
 * @access  Private
 */
export const applyCoupon = asyncHandler(async (req, res, next) => {
  const { code } = req.body;

  const coupon = await Coupon.findOne({ code: code.toUpperCase(), isActive: true });
  if (!coupon) return next(new AppError('Invalid or expired coupon code', 400));

  const cart = await Cart.findOne({ user: req.user._id });
  if (!cart) return next(new AppError('Cart not found', 404));

  const subtotal = await calculateSubtotal(cart._id);

  if (!coupon.isValid(subtotal)) {
    return next(new AppError(`Coupon requires a minimum order value of ₹${coupon.minOrderValue}`, 400));
  }

  // Calculate discount
  let discount = 0;
  if (coupon.discountType === 'flat') {
    discount = coupon.discountValue;
  } else {
    discount = Math.round(subtotal * (coupon.discountValue / 100));
    if (coupon.maxDiscountAmount && discount > coupon.maxDiscountAmount) {
      discount = coupon.maxDiscountAmount;
    }
  }

  res.status(200).json({
    success: true,
    message: 'Coupon validated successfully',
    data: {
      code: coupon.code,
      discountAmount: discount,
    },
    errors: null,
  });
});
