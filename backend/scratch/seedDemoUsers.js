import mongoose from 'mongoose';
import User from '../models/User.js';
import { config } from '../config/env.js';

const demoUsers = [
  {
    name: 'Demo Customer',
    email: 'customer@cravego.com',
    phone: '9876543210',
    password: 'password123',
    role: 'customer',
    isEmailVerified: true,
    isPhoneVerified: true,
  },
  {
    name: 'Demo Owner',
    email: 'owner@cravego.com',
    phone: '9876543211',
    password: 'password123',
    role: 'restaurant_owner',
    isEmailVerified: true,
    isPhoneVerified: true,
  },
  {
    name: 'Demo Driver',
    email: 'driver@cravego.com',
    phone: '9876543212',
    password: 'password123',
    role: 'delivery_partner',
    isEmailVerified: true,
    isPhoneVerified: true,
  },
  {
    name: 'Demo Admin',
    email: 'admin@cravego.com',
    phone: '9876543213',
    password: 'password123',
    role: 'admin',
    isEmailVerified: true,
    isPhoneVerified: true,
  },
];

async function seed() {
  console.log('🌱 Seeding demo accounts in MongoDB...');
  await mongoose.connect(config.mongoUri);

  for (const demoUser of demoUsers) {
    // Delete existing demo record
    await User.deleteMany({ email: demoUser.email });
    
    // Create new demo user
    const user = await User.create(demoUser);
    console.log(`✅ Created demo account: [${user.role}] -> Email: [${user.email}] / Password: [password123]`);
  }

  await mongoose.connection.close();
  console.log('🎉 Seeding completed successfully!');
  process.exit(0);
}

seed().catch(async (error) => {
  console.error('❌ Seeding failed:', error);
  await mongoose.connection.close();
  process.exit(1);
});
