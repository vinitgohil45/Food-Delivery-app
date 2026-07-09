import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from '../models/User.js';
import Order from '../models/Order.js';
import Restaurant from '../models/Restaurant.js';

dotenv.config();

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/cravego';

async function run() {
  console.log('🔄 Connecting to MongoDB...');
  await mongoose.connect(MONGO_URI);
  console.log('✅ Connected.');

  try {
    console.log('\n--- 1. Fetching all Users with role "delivery_partner" ---');
    const drivers = await User.find({ role: 'delivery_partner' });
    console.log(`Found ${drivers.length} delivery partners:`);
    drivers.forEach(d => {
      console.log(`- Name: ${d.name}, Email: ${d.email}, ID: ${d._id}`);
    });

    console.log('\n--- 2. Fetching all Orders with status "prepared" ---');
    const preparedOrders = await Order.find({ status: 'prepared' })
      .populate('restaurant')
      .populate('customer');
    
    console.log(`Found ${preparedOrders.length} prepared orders:`);
    preparedOrders.forEach(o => {
      console.log(JSON.stringify({
        _id: o._id,
        orderNumber: o.orderNumber,
        status: o.status,
        deliveryPartner: o.deliveryPartner,
        restaurantName: o.restaurant?.name,
        restaurantActive: o.restaurant?.isActive,
        deliveryAddress: o.deliveryAddress?.formattedAddress,
      }, null, 2));
    });

    console.log('\n--- 3. Running getAvailableOrders controller query logic ---');
    // Let's run the exact query filter from deliveryController:
    const query = {
      status: 'prepared',
      deliveryPartner: null,
    };
    const orders = await Order.find(query)
      .populate('restaurant')
      .populate('customer', 'name phone');

    const filtered = orders.filter(
      (order) => order.restaurant && order.restaurant.isActive && order.deliveryAddress?.formattedAddress
    );

    console.log(`Available orders: ${filtered.length}`);
    filtered.forEach(o => {
      console.log(`- Order: ${o.orderNumber}, Restaurant: ${o.restaurant.name}`);
    });

  } catch (err) {
    console.error(err);
  } finally {
    await mongoose.disconnect();
    console.log('🔄 Disconnected.');
  }
}

run();
