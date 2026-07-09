import mongoose from 'mongoose';

const deliveryPartnerSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Delivery profile must belong to a user'],
      unique: true,
      index: true,
    },
    isOnline: {
      type: Boolean,
      default: false,
      index: true,
    },
    vehicleType: {
      type: String,
      enum: ['bicycle', 'motorcycle', 'scooter', 'car'],
      required: [true, 'Please specify vehicle type'],
    },
    vehicleNumber: {
      type: String,
      required: [true, 'Please specify vehicle registration number'],
      trim: true,
    },
    licenseNumber: {
      type: String,
      required: [true, 'Please specify driving license number'],
      trim: true,
    },
    currentLocation: {
      type: {
        type: String,
        enum: ['Point'],
        default: 'Point',
      },
      coordinates: {
        type: [Number], // [longitude, latitude]
        default: [0, 0],
      },
    },
    averageRating: {
      type: Number,
      default: 5.0,
      min: 0,
      max: 5,
    },
    totalDeliveries: {
      type: Number,
      default: 0,
    },
    earnings: {
      totalEarned: { type: Number, default: 0 },
      walletBalance: { type: Number, default: 0 },
    },
    status: {
      type: String,
      enum: ['available', 'assigned', 'on_trip', 'suspended'],
      default: 'available',
    },
  },
  {
    timestamps: true,
  }
);

deliveryPartnerSchema.index({ currentLocation: '2dsphere' });

const DeliveryPartner = mongoose.model('DeliveryPartner', deliveryPartnerSchema);

export default DeliveryPartner;
