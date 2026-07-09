import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Order from '../models/Order.js';
import DeliveryJob from '../models/DeliveryJob.js';

dotenv.config();

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/cravego';

async function run() {
  await mongoose.connect(MONGO_URI);

  const order = await Order.findOne({ status: 'prepared' });
  if (!order) {
    console.log('No prepared order found in DB. Run scratch/createReadyOrder.js first!');
  } else {
    console.log('======================================================');
    console.log('MongoDB Order Document:');
    console.log('======================================================');
    console.log(JSON.stringify(order, null, 2));

    const job = await DeliveryJob.findOne({ order: order._id });
    console.log('\n======================================================');
    console.log('MongoDB DeliveryJob Document:');
    console.log('======================================================');
    console.log(JSON.stringify(job, null, 2));
  }

  await mongoose.disconnect();
}

run().catch(console.error);
