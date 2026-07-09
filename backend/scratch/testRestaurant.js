import mongoose from 'mongoose';
import User from '../models/User.js';
import Restaurant from '../models/Restaurant.js';
import RestaurantImages from '../models/RestaurantImages.js';
import Order from '../models/Order.js';
import { config } from '../config/env.js';
import jwt from 'jsonwebtoken';

const API_URL = 'http://localhost:5000/api/v1';

async function runTests() {
  console.log('🏁 Starting Automated Restaurant Module Tests...');

  // 1. Connect to MongoDB
  await mongoose.connect(config.mongoUri);
  console.log('🔌 Connected to database.');

  // Create a mock owner account to bypass auth constraints
  const email = 'owner_test@cravego.com';
  await User.deleteOne({ email });
  const owner = await User.create({
    name: 'Test Owner',
    email,
    phone: '7777777777',
    password: 'password123',
    role: 'restaurant_owner',
    isEmailVerified: true,
  });

  // Generate secure JWT token
  const token = jwt.sign(
    { id: owner._id, role: owner.role },
    config.jwtSecret,
    { expiresIn: config.jwtAccessExpire }
  );

  // Clean up any old restaurant records
  await Restaurant.deleteMany({ owner: owner._id });
  console.log('🧹 Cleaned up old test database records.');

  // 2. Test Restaurant Registration
  console.log('\nStep 1: Registering Restaurant...');
  const regPayload = {
    name: 'Test Gourmet Kitchen',
    cuisine: 'North Indian, Chinese',
    longitude: 77.5946,
    latitude: 12.9716,
    formattedAddress: 'Mock Cyber Plaza, Indiranagar',
    openHour: '09:00',
    closeHour: '23:00',
    deliveryRadiusKm: 5,
    minOrderValue: 150,
    deliveryCharge: 40,
    averagePreparationTimeMin: 30,
    gstNumber: '29ABCDE1234F1Z5',
    licenseNumber: '12345678901234',
  };

  const regRes = await fetch(`${API_URL}/restaurants`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify(regPayload),
  });
  const regData = await regRes.json();
  console.log('Registration Response Status:', regRes.status);
  console.log('Registration Response Body:', JSON.stringify(regData, null, 2));

  if (!regData.success) {
    throw new Error('Restaurant registration failed!');
  }

  const restaurantId = regData.data._id;

  // 3. Test Owner Restaurant Query
  console.log('\nStep 2: Querying Owner Outlets...');
  const ownerRes = await fetch(`${API_URL}/restaurants/owner/all`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });
  const ownerData = await ownerRes.json();
  console.log('Owner Query Response Status:', ownerRes.status);
  console.log('Owner Query Response Body:', JSON.stringify(ownerData, null, 2));

  if (!ownerData.success || ownerData.data.length === 0) {
    throw new Error('Owner restaurant query failed!');
  }

  // 4. Test Restaurant Analytics
  console.log('\nStep 3: Querying Restaurant Dashboard Analytics...');
  const analyticsRes = await fetch(`${API_URL}/restaurants/${restaurantId}/analytics`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });
  const analyticsData = await analyticsRes.json();
  console.log('Analytics Response Status:', analyticsRes.status);
  console.log('Analytics Response Body:', JSON.stringify(analyticsData, null, 2));

  if (!analyticsData.success) {
    throw new Error('Analytics query failed!');
  }

  // Clean up database
  await Restaurant.deleteMany({ owner: owner._id });
  await User.deleteOne({ _id: owner._id });
  await mongoose.connection.close();
  
  console.log('\n✅ All Restaurant Module integration tests passed successfully!');
  process.exit(0);
}

runTests().catch(async (err) => {
  console.error('❌ Test failed with error:', err);
  await mongoose.connection.close();
  process.exit(1);
});
