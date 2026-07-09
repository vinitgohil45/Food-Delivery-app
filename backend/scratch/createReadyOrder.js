import axios from 'axios';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import User from '../models/User.js';
import Order from '../models/Order.js';
import Address from '../models/Address.js';
import Restaurant from '../models/Restaurant.js';

dotenv.config();

const API_URL = 'http://localhost:5000/api/v1';
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/cravego';

async function run() {
  console.log('🔄 Connecting to MongoDB...');
  await mongoose.connect(MONGO_URI);
  console.log('✅ Connected.');

  try {
    // 1. Customer login
    console.log('👤 Logging in as Customer...');
    const customerLoginRes = await axios.post(`${API_URL}/auth/login`, {
      email: 'customer@cravego.com',
      password: 'password123',
    });
    const customerToken = customerLoginRes.data?.data?.accessToken;

    // 2. Fetch MenuItem
    const menuRes = await axios.get(`${API_URL}/menu`, {
      headers: { Authorization: `Bearer ${customerToken}` }
    });
    const item = menuRes.data?.data?.items[0];
    const restaurantId = item.restaurant;

    // 3. Ensure address
    const customer = await User.findOne({ email: 'customer@cravego.com' });
    let address = await Address.findOne({ user: customer._id });
    if (!address) {
      address = await Address.create({
        user: customer._id,
        name: 'Home',
        formattedAddress: '123 Elite Residency, Bangalore',
        location: {
          type: 'Point',
          coordinates: [77.5946, 12.9716],
        },
      });
    }

    // 4. Add to cart
    await axios.post(`${API_URL}/cart/add`, {
      menuItem: item._id,
      quantity: 1,
      selectedCustomizations: [],
    }, {
      headers: { Authorization: `Bearer ${customerToken}` }
    });

    // 5. Checkout
    const checkoutRes = await axios.post(`${API_URL}/checkout`, {
      restaurantId,
      addressId: address._id.toString(),
      paymentMethod: 'cod',
    }, {
      headers: { Authorization: `Bearer ${customerToken}` }
    });
    const order = checkoutRes.data?.data;
    console.log(`📦 Order Placed: ${order.orderNumber}`);

    // 6. Owner login
    const targetRestaurant = await Restaurant.findById(restaurantId);
    const ownerUser = await User.findById(targetRestaurant.owner);
    const ownerLoginRes = await axios.post(`${API_URL}/auth/login`, {
      email: ownerUser.email,
      password: 'password123',
    });
    const ownerToken = ownerLoginRes.data?.data?.accessToken;

    // 7. Transition to prepared (READY)
    await axios.patch(`${API_URL}/orders/${order._id}/status`, {
      status: 'accepted',
      note: 'Kitchen accepted the order request.',
    }, {
      headers: { Authorization: `Bearer ${ownerToken}` }
    });

    await axios.patch(`${API_URL}/orders/${order._id}/status`, {
      status: 'preparing',
      note: 'Chef is preparing your fresh meal.',
    }, {
      headers: { Authorization: `Bearer ${ownerToken}` }
    });

    const preparedRes = await axios.patch(`${API_URL}/orders/${order._id}/status`, {
      status: 'prepared',
      note: 'Meal prepared and boxed! Ready for pickup.',
    }, {
      headers: { Authorization: `Bearer ${ownerToken}` }
    });

    console.log(`\n🎉 Success! Order ${order.orderNumber} is now in "prepared" state.`);
    console.log('Log in to the Delivery Dashboard on the browser:');
    console.log('- Email: driver@cravego.com');
    console.log('- Password: password123');
    console.log('You should immediately see this order under "Available Radial Runs"!');

  } catch (err) {
    console.error('❌ Error:', err);
  } finally {
    await mongoose.disconnect();
    console.log('🔄 Disconnected.');
  }
}

run();
