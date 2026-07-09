import mongoose from 'mongoose';

const deliveryJobSchema = new mongoose.Schema(
  {
    order: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Order',
      required: true,
      unique: true,
      index: true,
    },
    status: {
      type: String,
      enum: ['waiting_for_driver', 'assigned', 'picked_up', 'delivered', 'cancelled'],
      default: 'waiting_for_driver',
      index: true,
    },
    driverAssigned: {
      type: Boolean,
      default: false,
      index: true,
    },
    available: {
      type: Boolean,
      default: true,
      index: true,
    },
    deliveryPartner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
      index: true,
    },
    restaurant: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Restaurant',
      required: true,
      index: true,
    },
    customer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    deliveryAddress: {
      formattedAddress: { type: String, required: true },
      location: {
        type: { type: String, enum: ['Point'], default: 'Point' },
        coordinates: [Number],
      },
    },
  },
  {
    timestamps: true,
  }
);

const DeliveryJob = mongoose.model('DeliveryJob', deliveryJobSchema);

export default DeliveryJob;
