import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from '../models/User.js';

dotenv.config();

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/cravego';

async function run() {
  await mongoose.connect(MONGO_URI);
  const owners = await User.find({ role: 'restaurant_owner' });
  console.log(`Found ${owners.length} owners:`);
  owners.forEach(o => {
    console.log(`- ${o.name}: ${o.email}`);
  });
  await mongoose.disconnect();
}

run().catch(console.error);
