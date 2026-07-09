import mongoose from 'mongoose';
import User from '../models/User.js';
import Restaurant from '../models/Restaurant.js';
import MenuItem from '../models/MenuItem.js';
import MenuCategory from '../models/MenuCategory.js';
import Address from '../models/Address.js';
import Order from '../models/Order.js';
import Cart from '../models/Cart.js';
import CartItem from '../models/CartItem.js';
import Wallet from '../models/Wallet.js';
import { config } from '../config/env.js';
import jwt from 'jsonwebtoken';

const API_URL = 'http://localhost:5000/api/v1';

async function runTests() {
  console.log('🏁 Starting Automated Order Module Integration Tests...');

  // 1. Connect to MongoDB
  await mongoose.connect(config.mongoUri);
  console.log('🔌 Connected to database.');

  // Clean up mock users
  const custEmail = 'customer_order_test@cravego.com';
  await User.deleteMany({ $or: [{ email: custEmail }, { phone: '9555555555' }] });
  const customer = await User.create({
    name: 'Test Customer',
    email: custEmail,
    phone: '9555555555',
    password: 'password123',
    role: 'customer',
    isEmailVerified: true,
  });

  // Create Wallet for user
  await Wallet.deleteMany({ user: customer._id });
  await Wallet.create({ user: customer._id, balance: 1000 });

  // Generate secure JWT token for customer
  const custToken = jwt.sign(
    { id: customer._id, role: customer.role },
    config.jwtSecret,
    { expiresIn: config.jwtAccessExpire }
  );

  // Set up mock owner and restaurant
  const ownerEmail = 'owner_order_test@cravego.com';
  await User.deleteMany({ $or: [{ email: ownerEmail }, { phone: '6555555555' }] });
  const owner = await User.create({
    name: 'Test Restaurant Owner',
    email: ownerEmail,
    phone: '6555555555',
    password: 'password123',
    role: 'restaurant_owner',
  });

  // Generate secure JWT token for owner
  const ownerToken = jwt.sign(
    { id: owner._id, role: owner.role },
    config.jwtSecret,
    { expiresIn: config.jwtAccessExpire }
  );

  await Restaurant.deleteMany({ owner: owner._id });
  const restaurant = await Restaurant.create({
    owner: owner._id,
    name: 'Mock Test Pizza Hub',
    cuisine: ['Fast Food'],
    location: { type: 'Point', coordinates: [77.5946, 12.9716] },
    formattedAddress: 'Indiranagar, Bangalore',
    openingHours: { open: '09:00', close: '22:00' },
    gstNumber: '29ABCDE1234F1Z5',
    licenseNumber: '12345678901234',
    deliveryCharge: 40,
  });

  const category = await MenuCategory.create({
    restaurant: restaurant._id,
    name: 'Pizzas',
  });

  const dish = await MenuItem.create({
    restaurant: restaurant._id,
    category: category._id,
    name: 'Margherita Pizza',
    price: 250,
    isVeg: true,
    inventoryCount: 10,
  });

  // Add user address
  await Address.deleteMany({ user: customer._id });
  const address = await Address.create({
    user: customer._id,
    houseFlatNo: '101, Cyber Heights',
    formattedAddress: 'Indiranagar, Bangalore',
    location: { type: 'Point', coordinates: [77.5946, 12.9716] },
  });

  console.log('🧹 Cleaned up old database records.');

  // 2. Add item to cart and place order
  console.log('\nStep 1: Adding Item and Checking out...');
  let cart = await Cart.create({ user: customer._id, restaurant: restaurant._id });
  await CartItem.create({ cart: cart._id, menuItem: dish._id, quantity: 1 });

  const checkRes = await fetch(`${API_URL}/checkout`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${custToken}`,
    },
    body: JSON.stringify({
      addressId: address._id.toString(),
      paymentMethod: 'wallet',
      driverTip: 10,
    }),
  });
  const checkData = await checkRes.json();
  console.log('Checkout Response Body:', JSON.stringify(checkData, null, 2));

  if (!checkData.success) {
    throw new Error('Order creation failed!');
  }

  const orderId = checkData.data._id;

  // 3. Test Restaurant Accepting Order
  console.log('\nStep 2: Restaurant Owner Accepting Order...');
  const acceptRes = await fetch(`${API_URL}/orders/${orderId}/status`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${ownerToken}`,
    },
    body: JSON.stringify({
      status: 'accepted',
      note: 'Pizza Hub is accepting your order',
    }),
  });
  const acceptData = await acceptRes.json();
  console.log('Accept Status:', acceptRes.status);
  console.log('Accept Body:', JSON.stringify(acceptData, null, 2));

  if (!acceptData.success) {
    throw new Error('Accept status update failed!');
  }

  // 4. Test Fetching HTML Invoice
  console.log('\nStep 3: Fetching Printable HTML Invoice...');
  const invRes = await fetch(`${API_URL}/orders/invoice/${orderId}`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${custToken}`,
    },
  });
  console.log('Invoice Fetch HTTP Status:', invRes.status);
  const invHtml = await invRes.text();
  console.log('Invoice HTML length:', invHtml.length);

  if (invRes.status !== 200 || !invHtml.includes('CraveGo')) {
    throw new Error('HTML Invoice fetch failed!');
  }

  // Clean up database
  await Order.deleteMany({ customer: customer._id });
  await Address.deleteMany({ user: customer._id });
  await MenuItem.deleteMany({ restaurant: restaurant._id });
  await MenuCategory.deleteMany({ restaurant: restaurant._id });
  await Restaurant.deleteMany({ owner: owner._id });
  await Wallet.deleteMany({ user: customer._id });
  await User.deleteMany({ _id: { $in: [customer._id, owner._id] } });
  await mongoose.connection.close();

  console.log('\n✅ All Order Module integration tests passed successfully!');
  process.exit(0);
}

runTests().catch(async (err) => {
  console.error('❌ Test failed with error:', err);
  await mongoose.connection.close();
  process.exit(1);
});
