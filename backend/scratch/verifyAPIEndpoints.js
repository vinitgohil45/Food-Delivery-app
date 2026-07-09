import axios from 'axios';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import User from '../models/User.js';
import Order from '../models/Order.js';
import Address from '../models/Address.js';
import Restaurant from '../models/Restaurant.js';
import DeliveryJob from '../models/DeliveryJob.js';

dotenv.config();

const API_URL = 'http://localhost:5000/api/v1';
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/cravego';

async function verify() {
  await mongoose.connect(MONGO_URI);
  console.log('Connected to Database.');

  // Clean old orders from test script
  await Order.deleteMany({ orderNumber: /^CG-VERIFY-/ });
  await DeliveryJob.deleteMany({});

  // 1. Customer login
  const customerRes = await axios.post(`${API_URL}/auth/login`, {
    email: 'customer@cravego.com',
    password: 'password123',
  });
  const customerToken = customerRes.data.data.accessToken;
  const customerUser = await User.findOne({ email: 'customer@cravego.com' });

  // Ensure customer address
  let address = await Address.findOne({ user: customerUser._id });
  if (!address) {
    address = await Address.create({
      user: customerUser._id,
      name: 'Home',
      formattedAddress: '123 Elite Residency, Bangalore',
      location: { type: 'Point', coordinates: [77.5946, 12.9716] },
    });
  }

  // Fetch a menu item
  const menuRes = await axios.get(`${API_URL}/menu`, {
    headers: { Authorization: `Bearer ${customerToken}` }
  });
  const item = menuRes.data.data.items[0];
  const restaurantId = item.restaurant;

  // Add to cart
  await axios.post(`${API_URL}/cart/add`, {
    menuItem: item._id,
    quantity: 1,
    selectedCustomizations: [],
  }, {
    headers: { Authorization: `Bearer ${customerToken}` }
  });

  // Checkout
  const checkoutRes = await axios.post(`${API_URL}/checkout`, {
    restaurantId,
    addressId: address._id.toString(),
    paymentMethod: 'cod',
  }, {
    headers: { Authorization: `Bearer ${customerToken}` }
  });
  const order = checkoutRes.data.data;
  
  // Update orderNumber prefix for tracking
  await Order.findByIdAndUpdate(order._id, { orderNumber: `CG-VERIFY-${Date.now().toString().slice(-4)}` });
  const updatedOrder = await Order.findById(order._id);

  // Restaurant Owner Login
  const targetRestaurant = await Restaurant.findById(restaurantId);
  const ownerUser = await User.findById(targetRestaurant.owner);
  const ownerLoginRes = await axios.post(`${API_URL}/auth/login`, {
    email: ownerUser.email,
    password: 'password123',
  });
  const ownerToken = ownerLoginRes.data.data.accessToken;

  // Move order to ready (prepared)
  await axios.patch(`${API_URL}/orders/${order._id}/status`, {
    status: 'accepted',
    note: 'Accepted',
  }, {
    headers: { Authorization: `Bearer ${ownerToken}` }
  });

  await axios.patch(`${API_URL}/orders/${order._id}/status`, {
    status: 'preparing',
    note: 'Preparing',
  }, {
    headers: { Authorization: `Bearer ${ownerToken}` }
  });

  await axios.patch(`${API_URL}/orders/${order._id}/status`, {
    status: 'prepared',
    note: 'Prepared',
  }, {
    headers: { Authorization: `Bearer ${ownerToken}` }
  });

  // Driver Login
  const driverLoginRes = await axios.post(`${API_URL}/auth/login`, {
    email: 'driver@cravego.com',
    password: 'password123',
  });
  const driverToken = driverLoginRes.data.data.accessToken;

  // ==========================================
  // Verify GET /api/v1/delivery/available-orders
  // ==========================================
  console.log('\n======================================================');
  console.log('GET /api/v1/delivery/available-orders');
  console.log('======================================================');
  console.log('Request: GET /api/v1/delivery/available-orders');
  console.log('Headers: Authorization Bearer token');
  try {
    const res = await axios.get(`${API_URL}/delivery/available-orders`, {
      headers: { Authorization: `Bearer ${driverToken}` }
    });
    console.log(`Status Code: ${res.status}`);
    console.log('Returned JSON:', JSON.stringify(res.data, null, 2));
  } catch (err) {
    console.log('Error:', err.response?.data || err.message);
  }

  // ==========================================
  // Verify POST /api/v1/delivery/reject/:orderId
  // ==========================================
  console.log('\n======================================================');
  console.log(`POST /api/v1/delivery/reject/${order._id}`);
  console.log('======================================================');
  console.log(`Request: POST /api/v1/delivery/reject/${order._id}`);
  console.log('Headers: Authorization Bearer token');
  try {
    const res = await axios.post(`${API_URL}/delivery/reject/${order._id}`, {}, {
      headers: { Authorization: `Bearer ${driverToken}` }
    });
    console.log(`Status Code: ${res.status}`);
    console.log('Returned JSON:', JSON.stringify(res.data, null, 2));
  } catch (err) {
    console.log('Error:', err.response?.data || err.message);
  }

  // ==========================================
  // Verify POST /api/v1/delivery/accept/:orderId
  // ==========================================
  console.log('\n======================================================');
  console.log(`POST /api/v1/delivery/accept/${order._id}`);
  console.log('======================================================');
  console.log(`Request: POST /api/v1/delivery/accept/${order._id}`);
  console.log('Headers: Authorization Bearer token');
  try {
    const res = await axios.post(`${API_URL}/delivery/accept/${order._id}`, {}, {
      headers: { Authorization: `Bearer ${driverToken}` }
    });
    console.log(`Status Code: ${res.status}`);
    console.log('Returned JSON:', JSON.stringify(res.data, null, 2));
  } catch (err) {
    console.log('Error:', err.response?.data || err.message);
  }

  // ==========================================
  // Verify GET /api/v1/delivery/my-orders
  // ==========================================
  console.log('\n======================================================');
  console.log('GET /api/v1/delivery/my-orders');
  console.log('======================================================');
  console.log('Request: GET /api/v1/delivery/my-orders');
  console.log('Headers: Authorization Bearer token');
  try {
    const res = await axios.get(`${API_URL}/delivery/my-orders`, {
      headers: { Authorization: `Bearer ${driverToken}` }
    });
    console.log(`Status Code: ${res.status}`);
    console.log('Returned JSON:', JSON.stringify(res.data, null, 2));
  } catch (err) {
    console.log('Error:', err.response?.data || err.message);
  }

  // ==========================================
  // Verify PATCH /api/v1/delivery/pickup
  // ==========================================
  console.log('\n======================================================');
  console.log('PATCH /api/v1/delivery/pickup');
  console.log('======================================================');
  console.log('Request: PATCH /api/v1/delivery/pickup');
  console.log(`Body: { orderId: "${order._id}" }`);
  console.log('Headers: Authorization Bearer token');
  try {
    const res = await axios.patch(`${API_URL}/delivery/pickup`, { orderId: order._id }, {
      headers: { Authorization: `Bearer ${driverToken}` }
    });
    console.log(`Status Code: ${res.status}`);
    console.log('Returned JSON:', JSON.stringify(res.data, null, 2));
  } catch (err) {
    console.log('Error:', err.response?.data || err.message);
  }

  // ==========================================
  // Verify PATCH /api/v1/delivery/delivered
  // ==========================================
  console.log('\n======================================================');
  console.log('PATCH /api/v1/delivery/delivered');
  console.log('======================================================');
  console.log('Request: PATCH /api/v1/delivery/delivered');
  console.log(`Body: { orderId: "${order._id}" }`);
  console.log('Headers: Authorization Bearer token');
  try {
    const res = await axios.patch(`${API_URL}/delivery/delivered`, { orderId: order._id }, {
      headers: { Authorization: `Bearer ${driverToken}` }
    });
    console.log(`Status Code: ${res.status}`);
    console.log('Returned JSON:', JSON.stringify(res.data, null, 2));
  } catch (err) {
    console.log('Error:', err.response?.data || err.message);
  }

  await mongoose.disconnect();
}

verify().catch(console.error);
