import mongoose from 'mongoose';
import User from '../models/User.js';
import Restaurant from '../models/Restaurant.js';
import MenuItem from '../models/MenuItem.js';
import MenuCategory from '../models/MenuCategory.js';
import Coupon from '../models/Coupon.js';
import Address from '../models/Address.js';
import Order from '../models/Order.js';
import Cart from '../models/Cart.js';
import CartItem from '../models/CartItem.js';
import Wallet from '../models/Wallet.js';
import { config } from '../config/env.js';
import jwt from 'jsonwebtoken';

const API_URL = 'http://localhost:5000/api/v1';

async function runTests() {
  console.log('🏁 Starting Automated Cart & Checkout Module Integration Tests...');

  // 1. Connect to MongoDB
  await mongoose.connect(config.mongoUri);
  console.log('🔌 Connected to database.');

  // Clean up mock users
  const email = 'customer_test@cravego.com';
  await User.deleteMany({ $or: [{ email }, { phone: '9999999999' }] });
  const customer = await User.create({
    name: 'Test Customer',
    email,
    phone: '9999999999',
    password: 'password123',
    role: 'customer',
    isEmailVerified: true,
  });

  // Create Wallet for user
  await Wallet.deleteMany({ user: customer._id });
  await Wallet.create({ user: customer._id, balance: 1000 });

  // Generate secure JWT token
  const token = jwt.sign(
    { id: customer._id, role: customer.role },
    config.jwtSecret,
    { expiresIn: config.jwtAccessExpire }
  );

  // Set up mock restaurant and menu item
  const ownerEmail = 'restaurant_owner_test@cravego.com';
  await User.deleteOne({ email: ownerEmail });
  const owner = await User.create({
    name: 'Test Restaurant Owner',
    email: ownerEmail,
    phone: '6666666666',
    password: 'password123',
    role: 'restaurant_owner',
  });

  await Restaurant.deleteMany({ owner: owner._id });
  const restaurant = await Restaurant.create({
    owner: owner._id,
    name: 'Mock Test Cafe',
    cuisine: ['Fast Food'],
    location: { type: 'Point', coordinates: [77.5946, 12.9716] },
    formattedAddress: 'Indiranagar, Bangalore',
    openingHours: { open: '09:00', close: '22:00' },
    gstNumber: '29ABCDE1234F1Z5',
    licenseNumber: '12345678901234',
    deliveryCharge: 35,
  });

  const category = await MenuCategory.create({
    restaurant: restaurant._id,
    name: 'Beverages',
  });

  const dish = await MenuItem.create({
    restaurant: restaurant._id,
    category: category._id,
    name: 'Special cold coffee',
    price: 150,
    isVeg: true,
    inventoryCount: 10,
  });

  // Add user address
  await Address.deleteMany({ user: customer._id });
  const address = await Address.create({
    user: customer._id,
    houseFlatNo: '302, Cyber Tower',
    formattedAddress: 'Indiranagar Hub, Bangalore',
    location: { type: 'Point', coordinates: [77.5946, 12.9716] },
  });

  // Add Coupon
  const couponCode = 'CRAVE50';
  await Coupon.deleteOne({ code: couponCode });
  await Coupon.create({
    code: couponCode,
    discountType: 'flat',
    discountValue: 50,
    minOrderValue: 100,
    startDate: new Date(Date.now() - 86400000), // yesterday
    endDate: new Date(Date.now() + 86400000), // tomorrow
  });

  console.log('🧹 Cleaned up old database records.');

  // 2. Test Adding Item to Cart
  console.log('\nStep 1: Adding Item to Cart...');
  const addRes = await fetch(`${API_URL}/cart/add`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify({
      menuItem: dish._id.toString(),
      quantity: 2,
    }),
  });
  const addData = await addRes.json();
  console.log('Add Cart Response Status:', addRes.status);
  console.log('Add Cart Response Body:', JSON.stringify(addData, null, 2));

  if (!addData.success) {
    throw new Error('Add to cart failed!');
  }

  // 3. Test Apply Coupon
  console.log('\nStep 2: Applying Coupon Code...');
  const cpnRes = await fetch(`${API_URL}/cart/apply-coupon`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify({
      code: couponCode,
    }),
  });
  const cpnData = await cpnRes.json();
  console.log('Coupon Apply Status:', cpnRes.status);
  console.log('Coupon Apply Body:', JSON.stringify(cpnData, null, 2));

  if (!cpnData.success) {
    throw new Error('Apply coupon failed!');
  }

  // 4. Test Checkout Order Placement
  console.log('\nStep 3: Placing Order (Checkout)...');
  const checkRes = await fetch(`${API_URL}/checkout`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify({
      addressId: address._id.toString(),
      paymentMethod: 'wallet',
      driverTip: 20,
    }),
  });
  const checkData = await checkRes.json();
  console.log('Checkout Response Status:', checkRes.status);
  console.log('Checkout Response Body:', JSON.stringify(checkData, null, 2));

  if (!checkData.success) {
    throw new Error('Checkout failed!');
  }

  // 5. Assert database updates
  console.log('\nStep 4: Verifying database decrements & states...');
  const updatedDish = await MenuItem.findById(dish._id);
  console.log('Updated stock count of Special cold coffee (originally 10, ordered 2):', updatedDish.inventoryCount);
  if (updatedDish.inventoryCount !== 8) {
    throw new Error('Inventory count did not decrement correctly!');
  }

  const updatedWallet = await Wallet.findOne({ user: customer._id });
  console.log('Updated wallet balance (originally 1000, order total should deduct):', updatedWallet.balance);
  if (updatedWallet.balance >= 1000) {
    throw new Error('Wallet balance did not deduct correctly!');
  }

  const updatedCart = await Cart.findOne({ user: customer._id });
  const cartItemsCount = await CartItem.countDocuments({ cart: updatedCart._id });
  console.log('Cart Items count after checkout:', cartItemsCount);
  if (cartItemsCount !== 0) {
    throw new Error('Cart was not cleared after checkout!');
  }

  // Clean up database
  await Order.deleteMany({ customer: customer._id });
  await Address.deleteMany({ user: customer._id });
  await MenuItem.deleteMany({ restaurant: restaurant._id });
  await MenuCategory.deleteMany({ restaurant: restaurant._id });
  await Restaurant.deleteMany({ owner: owner._id });
  await Coupon.deleteOne({ code: couponCode });
  await Wallet.deleteMany({ user: customer._id });
  await User.deleteMany({ _id: { $in: [customer._id, owner._id] } });
  await mongoose.connection.close();

  console.log('\n✅ All Cart & Checkout Module integration tests passed successfully!');
  process.exit(0);
}

runTests().catch(async (err) => {
  console.error('❌ Test failed with error:', err);
  await mongoose.connection.close();
  process.exit(1);
});
