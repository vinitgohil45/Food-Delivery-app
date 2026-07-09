import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Order from '../models/Order.js';
import Restaurant from '../models/Restaurant.js';
import User from '../models/User.js';
import MenuItem from '../models/MenuItem.js';
import OrderItem from '../models/OrderItem.js';

dotenv.config();

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/cravego';

async function runDebug() {
  console.log('🔄 Connecting to MongoDB...');
  await mongoose.connect(MONGO_URI);
  console.log('✅ Connected to MongoDB.');

  try {
    // 1. Fetch resources
    console.log('\n--- 1. Fetching Sample User, Restaurant and MenuItem ---');
    const customer = await User.findOne({ role: 'customer' });
    const restaurant = await Restaurant.findOne({ isActive: true });
    
    if (!customer || !restaurant) {
      console.log('⚠️ Error: Need at least one customer and active restaurant in database to proceed.');
      process.exit(1);
    }
    console.log(`👤 Customer: ${customer.name} (${customer._id})`);
    console.log(`🍳 Restaurant: ${restaurant.name} (${restaurant._id})`);

    const menuItem = await MenuItem.findOne({ restaurant: restaurant._id });
    if (!menuItem) {
      console.log('⚠️ Error: Need at least one MenuItem for the restaurant.');
      process.exit(1);
    }
    console.log(`🍔 MenuItem: ${menuItem.name} (${menuItem._id})`);

    // 2. Place Order
    console.log('\n--- 2. Placing Order ---');
    const orderNumber = `CG-DEBUG-${Date.now().toString().slice(-6)}`;
    const order = await Order.create({
      orderNumber,
      customer: customer._id,
      restaurant: restaurant._id,
      status: 'placed',
      deliveryAddress: {
        formattedAddress: '123 Test Street, Bangalore',
        location: {
          type: 'Point',
          coordinates: [77.5946, 12.9716],
        },
      },
      billing: {
        itemTotal: menuItem.price,
        taxGst: Math.round(menuItem.price * 0.05),
        deliveryCharge: 30,
        platformFee: 2,
        grandTotal: menuItem.price + Math.round(menuItem.price * 0.05) + 32,
      },
      paymentMethod: 'cod',
      paymentStatus: 'pending',
    });

    await OrderItem.create({
      order: order._id,
      menuItem: menuItem._id,
      name: menuItem.name,
      price: menuItem.price,
      quantity: 1,
    });

    console.log(`📦 Order Created: ${order.orderNumber} (ID: ${order._id}), Status: ${order.status}`);

    // 3. Restaurant Accepts
    console.log('\n--- 3. Restaurant Accepts Order ---');
    order.status = 'accepted';
    await order.save();
    console.log(`📦 Order Accepted. Status: ${order.status}`);

    // 4. Preparing
    console.log('\n--- 4. Preparing ---');
    order.status = 'preparing';
    await order.save();
    console.log(`📦 Order Preparing. Status: ${order.status}`);

    // 5. Prepared (READY)
    console.log('\n--- 5. Marking Prepared (READY) ---');
    order.status = 'prepared';
    await order.save();
    console.log(`📦 Order Prepared. Status: ${order.status}`);

    // 6. Inspect exact document
    console.log('\n--- 6. Inspecting Order Document in Database ---');
    const freshOrder = await Order.findById(order._id)
      .populate('restaurant')
      .populate('customer');
    
    console.log(JSON.stringify({
      _id: freshOrder._id,
      orderNumber: freshOrder.orderNumber,
      status: freshOrder.status,
      deliveryPartner: freshOrder.deliveryPartner,
      restaurant: freshOrder.restaurant?.name,
      restaurantActive: freshOrder.restaurant?.isActive,
      customer: freshOrder.customer?.name,
      deliveryAddress: freshOrder.deliveryAddress,
      paymentStatus: freshOrder.paymentStatus,
    }, null, 2));

    // 7. Test Available Orders Query
    console.log('\n--- 7. Running Available Orders Query ---');
    const query = {
      status: 'prepared',
      deliveryPartner: null,
    };
    console.log('MongoDB Query Filter:', query);

    const availableOrders = await Order.find(query)
      .populate('restaurant')
      .populate('customer', 'name phone');

    const filtered = availableOrders.filter(
      (o) => o.restaurant && o.restaurant.isActive && o.deliveryAddress?.formattedAddress
    );

    console.log(`Results from DB count: ${availableOrders.length}`);
    console.log(`Filtered Available Orders count: ${filtered.length}`);
    if (filtered.length > 0) {
      console.log('Raw JSON first item:', JSON.stringify(filtered[0], null, 2));
    } else {
      console.log('⚠️ Warning: available-orders query returned empty array!');
    }

  } catch (err) {
    console.error('❌ Error during runDebug:', err);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔄 Disconnected from MongoDB.');
  }
}

runDebug();
