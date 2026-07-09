import mongoose from 'mongoose';
import User from '../models/User.js';
import Restaurant from '../models/Restaurant.js';
import MenuItem from '../models/MenuItem.js';
import Review from '../models/Review.js';
import Coupon from '../models/Coupon.js';
import Order from '../models/Order.js';
import { config } from '../config/env.js';

async function run() {
  await mongoose.connect(config.mongoUri);

  const usersCount = await User.countDocuments();
  const ownersCount = await User.countDocuments({ role: 'restaurant_owner' });
  const driversCount = await User.countDocuments({ role: 'delivery_partner' });
  const customersCount = await User.countDocuments({ role: 'customer' });
  
  const restaurantsCount = await Restaurant.countDocuments();
  const itemsCount = await MenuItem.countDocuments();
  const reviewsCount = await Review.countDocuments();
  const couponsCount = await Coupon.countDocuments();
  const ordersCount = await Order.countDocuments();

  console.log('\n======================================================');
  console.log('📊 CRAGO DATABASE VERIFICATION REPORT');
  console.log('======================================================');
  console.log(`👤 Total Users: ${usersCount}`);
  console.log(`   - Customers: ${customersCount}`);
  console.log(`   - Restaurant Owners: ${ownersCount}`);
  console.log(`   - Delivery Partners: ${driversCount}`);
  console.log(`🏠 Restaurants Listed: ${restaurantsCount}`);
  console.log(`🍕 Menu Items Loaded: ${itemsCount}`);
  console.log(`💬 Reviews Logged: ${reviewsCount}`);
  console.log(`🏷️ Promo Coupons Loaded: ${couponsCount}`);
  console.log(`📦 Historical Orders: ${ordersCount}`);
  console.log('======================================================\n');

  await mongoose.connection.close();
  process.exit(0);
}

run().catch(async (err) => {
  console.error(err);
  await mongoose.connection.close();
  process.exit(1);
});
