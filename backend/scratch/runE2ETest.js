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

async function test() {
  console.log('🔄 Connecting to MongoDB...');
  await mongoose.connect(MONGO_URI);
  console.log('✅ Connected to MongoDB.');

  try {
    // Clean old debug orders to keep test clean
    await Order.deleteMany({ orderNumber: /^CG-TEST-/ });
    console.log('🧹 Cleaned up old CG-TEST orders.');

    // 1. Customer login
    console.log('\n--- 1. Logging in as Customer ---');
    const customerLoginRes = await axios.post(`${API_URL}/auth/login`, {
      email: 'customer@cravego.com',
      password: 'password123',
    });
    const customerToken = customerLoginRes.data?.data?.accessToken;
    console.log('✅ Logged in. Token:', customerToken.slice(0, 30) + '...');

    // 2. Fetch Restaurant and MenuItem
    console.log('\n--- 2. Fetching Menu ---');
    const menuRes = await axios.get(`${API_URL}/menu`, {
      headers: { Authorization: `Bearer ${customerToken}` }
    });
    const menuItems = menuRes.data?.data?.items || [];
    if (menuItems.length === 0) {
      throw new Error('No menu items found in database. Seed database first.');
    }
    const item = menuItems[0];
    const restaurantId = item.restaurant;
    console.log(`Using Restaurant ID: ${restaurantId}, MenuItem ID: ${item._id} (${item.name})`);

    // Ensure customer address exists
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
    console.log(`Using Address ID: ${address._id}`);

    // 3. Place Order (Simulate Checkout)
    console.log('\n--- 3. Customer placing order ---');
    
    // Add item to cart first
    await axios.post(`${API_URL}/cart/add`, {
      menuItem: item._id,
      quantity: 1,
      selectedCustomizations: [],
    }, {
      headers: { Authorization: `Bearer ${customerToken}` }
    });
    console.log('🛒 Item added to database cart.');

    const checkoutRes = await axios.post(`${API_URL}/checkout`, {
      restaurantId,
      addressId: address._id.toString(),
      paymentMethod: 'cod',
    }, {
      headers: { Authorization: `Bearer ${customerToken}` }
    });

    const order = checkoutRes.data?.data;
    console.log(`✅ Order Placed: ${order.orderNumber} (ID: ${order._id})`);

    // 4. Restaurant Owner Login
    console.log('\n--- 4. Logging in as Restaurant Owner ---');
    const targetRestaurant = await Restaurant.findById(restaurantId);
    const ownerUser = await User.findById(targetRestaurant.owner);
    console.log(`Restaurant Owner is: ${ownerUser.name} (${ownerUser.email})`);

    const ownerLoginRes = await axios.post(`${API_URL}/auth/login`, {
      email: ownerUser.email,
      password: 'password123',
    });
    const ownerToken = ownerLoginRes.data?.data?.accessToken;
    console.log('✅ Logged in as Owner.');

    // 5. Accept Order
    console.log('\n--- 5. Restaurant Accepts Order ---');
    const acceptRes = await axios.patch(`${API_URL}/orders/${order._id}/status`, {
      status: 'accepted',
      note: 'Kitchen accepted the order request.',
    }, {
      headers: { Authorization: `Bearer ${ownerToken}` }
    });
    console.log(`Status updated to: ${acceptRes.data?.data?.status}`);

    // 6. Preparing Order
    console.log('\n--- 6. Restaurant Prepares Order ---');
    const prepRes = await axios.patch(`${API_URL}/orders/${order._id}/status`, {
      status: 'preparing',
      note: 'Chef is preparing your fresh meal.',
    }, {
      headers: { Authorization: `Bearer ${ownerToken}` }
    });
    console.log(`Status updated to: ${prepRes.data?.data?.status}`);

    // 7. Prepared Order (Ready for pickup)
    console.log('\n--- 7. Restaurant Marks Prepared (READY) ---');
    const preparedRes = await axios.patch(`${API_URL}/orders/${order._id}/status`, {
      status: 'prepared',
      note: 'Meal prepared and boxed! Ready for pickup.',
    }, {
      headers: { Authorization: `Bearer ${ownerToken}` }
    });
    console.log(`Status updated to: ${preparedRes.data?.data?.status}`);

    // Verify DeliveryJob details in database
    console.log('\n--- 7b. Verifying DeliveryJob creation in DB ---');
    const dbJob = await DeliveryJob.findOne({ order: order._id });
    if (!dbJob) {
      throw new Error('DeliveryJob document was not created automatically!');
    }
    console.log('✅ DeliveryJob found in DB:');
    console.log(`  ID: ${dbJob._id}`);
    console.log(`  Status: ${dbJob.status}`);
    console.log(`  DriverAssigned: ${dbJob.driverAssigned}`);
    console.log(`  Available: ${dbJob.available}`);
    console.log(`  DeliveryPartner: ${dbJob.deliveryPartner}`);
    console.log(`  CreatedAt: ${dbJob.createdAt}`);
    console.log(`  UpdatedAt: ${dbJob.updatedAt}`);

    // 8. Driver Login
    console.log('\n--- 8. Logging in as Delivery Driver ---');
    const driverLoginRes = await axios.post(`${API_URL}/auth/login`, {
      email: 'driver@cravego.com',
      password: 'password123',
    });
    const driverToken = driverLoginRes.data?.data?.accessToken;
    console.log('✅ Logged in as Driver.');

    // 9. Fetch Available Orders
    console.log('\n--- 9. Querying Available Orders for Driver ---');
    const availableRes = await axios.get(`${API_URL}/delivery/available-orders`, {
      headers: { Authorization: `Bearer ${driverToken}` }
    });
    const available = availableRes.data?.data || [];
    console.log(`Driver sees ${available.length} available orders:`);
    available.forEach(o => {
      console.log(`- Order: ${o.orderNumber}, Restaurant: ${o.restaurant?.name}, Address: ${o.deliveryAddress?.formattedAddress}`);
    });

    if (available.length === 0) {
      throw new Error('No available orders visible to driver!');
    }

    const targetOrder = available.find(o => o._id === order._id);
    if (!targetOrder) {
      throw new Error('Placed order not visible in driver list!');
    }
    console.log('✅ Placed order is visible to driver!');

    // 10. Accept Job
    console.log('\n--- 10. Driver Accepts Job ---');
    const acceptJobRes = await axios.post(`${API_URL}/delivery/accept/${order._id}`, {}, {
      headers: { Authorization: `Bearer ${driverToken}` }
    });
    console.log(`✅ Accepted Job successfully. Assigned Partner ID: ${acceptJobRes.data?.data?.deliveryPartner}`);

    // 11. Verify order disappears from Available Orders
    console.log('\n--- 11. Verifying available-orders is empty ---');
    const recheckRes = await axios.get(`${API_URL}/delivery/available-orders`, {
      headers: { Authorization: `Bearer ${driverToken}` }
    });
    console.log(`Available orders count: ${recheckRes.data?.data?.length}`);

    // 12. Verify order is in Active Delivery List
    console.log('\n--- 12. Querying Active Deliveries ---');
    const activeRes = await axios.get(`${API_URL}/delivery/my-orders`, {
      headers: { Authorization: `Bearer ${driverToken}` }
    });
    const active = activeRes.data?.data || [];
    console.log(`Driver active orders count: ${active.length}`);
    const activeMatch = active.find(o => o._id === order._id);
    console.log(`Active run: ${activeMatch?.orderNumber}, status: ${activeMatch?.status}`);

    // 13. Driver pickup
    console.log('\n--- 13. Driver confirms pickup ---');
    const pickupRes = await axios.patch(`${API_URL}/delivery/pickup`, { orderId: order._id }, {
      headers: { Authorization: `Bearer ${driverToken}` }
    });
    console.log(`Status updated to: ${pickupRes.data?.data?.status}`);

    // 14. Driver delivers
    console.log('\n--- 14. Driver confirms delivery ---');
    const deliveryRes = await axios.patch(`${API_URL}/delivery/delivered`, { orderId: order._id }, {
      headers: { Authorization: `Bearer ${driverToken}` }
    });
    console.log(`Status updated to: ${deliveryRes.data?.data?.status}, Payment: ${deliveryRes.data?.data?.paymentStatus}`);

    console.log('\n👑 ALL Lifecycle Steps Executed Successfully!');

  } catch (err) {
    console.error('❌ E2E Test Failed:', err.response?.data || err.message);
  } finally {
    await mongoose.disconnect();
    console.log('🔄 Disconnected.');
  }
}

test();
