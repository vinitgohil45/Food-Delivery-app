import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from '../models/User.js';

dotenv.config();

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/cravego';

async function run() {
  await mongoose.connect(MONGO_URI);
  console.log('Connected to DB');

  const u = await User.findOne({ email: 'driver@cravego.com' });
  console.log('User found:', JSON.stringify(u, null, 2));

  await mongoose.disconnect();
}

run().catch(console.error);
