import mongoose from 'mongoose';
import User from '../models/User.js';
import Restaurant from '../models/Restaurant.js';
import MenuItem from '../models/MenuItem.js';
import MenuCategory from '../models/MenuCategory.js';
import Address from '../models/Address.js';
import Order from '../models/Order.js';
import Cart from '../models/Cart.js';
import CartItem from '../models/CartItem.js';
import Payment from '../models/Payment.js';
import { config } from '../config/env.js';
import jwt from 'jsonwebtoken';

const API_URL = 'http://localhost:5000/api/v1';

async function runTests() {
  console.log('🏁 Starting Automated Payment Module Integration Tests...');

  // 1. Connect to MongoDB
  await mongoose.connect(config.mongoUri);
  console.log('🔌 Connected to database.');

  // Clean up mock users
  const custEmail = 'customer_pay_test@cravego.com';
  await User.deleteMany({ $or: [{ email: custEmail }, { phone: '9444444444' }] });
  const customer = await User.create({
    name: 'Test Customer',
    email: custEmail,
    phone: '9444444444',
    password: 'password123',
    role: 'customer',
    isEmailVerified: true,
  });

  // Generate secure JWT token for customer
  const token = jwt.sign(
    { id: customer._id, role: customer.role },
    config.jwtSecret,
    { expiresIn: config.jwtAccessExpire }
  );

  // Set up mock restaurant
  const ownerEmail = 'owner_pay_test@cravego.com';
  await User.deleteMany({ $or: [{ email: ownerEmail }, { phone: '6444444444' }] });
  const owner = await User.create({
    name: 'Test Restaurant Owner',
    email: ownerEmail,
    phone: '6444444444',
    password: 'password123',
    role: 'restaurant_owner',
  });

  await Restaurant.deleteMany({ owner: owner._id });
  const restaurant = await Restaurant.create({
    owner: owner._id,
    name: 'Mock Test Payment Hub',
    cuisine: ['Fast Food'],
    location: { type: 'Point', coordinates: [77.5946, 12.9716] },
    formattedAddress: 'Indiranagar, Bangalore',
    openingHours: { open: '09:00', close: '22:00' },
    gstNumber: '29ABCDE1234F1Z5',
    licenseNumber: '12345678901234',
    deliveryCharge: 30,
  });

  const category = await MenuCategory.create({
    restaurant: restaurant._id,
    name: 'Snacks',
  });

  const dish = await MenuItem.create({
    restaurant: restaurant._id,
    category: category._id,
    name: 'Garlic Breadsticks',
    price: 120,
    isVeg: true,
    inventoryCount: 10,
  });

  // Add user address
  await Address.deleteMany({ user: customer._id });
  const address = await Address.create({
    user: customer._id,
    houseFlatNo: '202, Cyber Heights',
    formattedAddress: 'Indiranagar, Bangalore',
    location: { type: 'Point', coordinates: [77.5946, 12.9716] },
  });

  console.log('🧹 Cleaned up old database records.');

  // 2. Place an unpaid Stripe order
  console.log('\nStep 1: Placing Order (unpaid Stripe method)...');
  let cart = await Cart.create({ user: customer._id, restaurant: restaurant._id });
  await CartItem.create({ cart: cart._id, menuItem: dish._id, quantity: 1 });

  const checkRes = await fetch(`${API_URL}/checkout`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify({
      addressId: address._id.toString(),
      paymentMethod: 'stripe',
      driverTip: 10,
    }),
  });
  const checkData = await checkRes.json();
  console.log('Checkout Response Status:', checkRes.status);
  
  if (!checkData.success) {
    throw new Error('Order checkout failed!');
  }

  const orderId = checkData.data._id;

  // 3. Create Payment Transaction Intent Session
  console.log('\nStep 2: Initializing Payment Intent Session...');
  const payRes = await fetch(`${API_URL}/payments/create-order`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify({
      orderId,
      gateway: 'stripe',
    }),
  });
  const payData = await payRes.json();
  console.log('Create Intent Response Status:', payRes.status);
  console.log('Create Intent Response Body:', JSON.stringify(payData, null, 2));

  if (!payData.success) {
    throw new Error('Payment intent creation failed!');
  }

  // 4. Simulate Webhook payment success
  console.log('\nStep 3: Simulating Success Webhook Event...');
  const webRes = await fetch(`${API_URL}/payments/webhook`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      simulatedType: 'stripe_success',
      orderId,
    }),
  });
  const webData = await webRes.json();
  console.log('Webhook Response Status:', webRes.status);
  
  if (webRes.status !== 200) {
    throw new Error('Webhook simulation failed!');
  }

  // 5. Verify database matches paid status
  console.log('\nStep 4: Verifying database transaction updates...');
  const updatedOrder = await Order.findById(orderId);
  console.log('Final Order Payment Status (should be paid):', updatedOrder.paymentStatus);
  if (updatedOrder.paymentStatus !== 'paid') {
    throw new Error('Payment webhook did not successfully update order paymentStatus to paid!');
  }

  const finalPayment = await Payment.findOne({ order: orderId });
  console.log('Final Payment Session status (should be completed):', finalPayment.status);
  if (finalPayment.status !== 'completed') {
    throw new Error('Payment status was not marked completed!');
  }

  // Clean up database
  await Payment.deleteMany({ order: orderId });
  await Order.deleteMany({ customer: customer._id });
  await Address.deleteMany({ user: customer._id });
  await MenuItem.deleteMany({ restaurant: restaurant._id });
  await MenuCategory.deleteMany({ restaurant: restaurant._id });
  await Restaurant.deleteMany({ owner: owner._id });
  await User.deleteMany({ _id: { $in: [customer._id, owner._id] } });
  await mongoose.connection.close();

  console.log('\n✅ All Payment Module integration tests passed successfully!');
  process.exit(0);
}

runTests().catch(async (err) => {
  console.error('❌ Test failed with error:', err);
  await mongoose.connection.close();
  process.exit(1);
});
