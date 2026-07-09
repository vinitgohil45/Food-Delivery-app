import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Order from '../models/Order.js';
import Restaurant from '../models/Restaurant.js';
import User from '../models/User.js';

dotenv.config();

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/cravego';

async function run() {
  await mongoose.connect(MONGO_URI);
  console.log('Connected to DB');

  const orders = await Order.find({}).populate('restaurant').populate('customer').populate('deliveryPartner');
  console.log(`Total orders in DB: ${orders.length}`);
  
  orders.forEach((o, i) => {
    console.log(`[Order ${i+1}]`);
    console.log(`  ID: ${o._id}`);
    console.log(`  OrderNumber: ${o.orderNumber}`);
    console.log(`  Status: ${o.status}`);
    console.log(`  PaymentStatus: ${o.paymentStatus}`);
    console.log(`  Customer: ${o.customer?.name} (${o.customer?.email})`);
    console.log(`  Restaurant: ${o.restaurant?.name} (Active: ${o.restaurant?.isActive})`);
    console.log(`  Address: ${o.deliveryAddress?.formattedAddress}`);
    console.log(`  DeliveryPartner: ${o.deliveryPartner?.name || 'None'}`);
  });

  await mongoose.disconnect();
}

run().catch(console.error);
