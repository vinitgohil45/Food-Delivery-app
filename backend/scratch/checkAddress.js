import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Address from '../models/Address.js';
import User from '../models/User.js';

dotenv.config();

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/cravego';

async function run() {
  await mongoose.connect(MONGO_URI);
  const u = await User.findOne({ email: 'customer@cravego.com' });
  const addrs = await Address.find({ user: u._id });
  console.log(`Customer has ${addrs.length} addresses:`);
  console.log(JSON.stringify(addrs, null, 2));
  await mongoose.disconnect();
}

run().catch(console.error);
