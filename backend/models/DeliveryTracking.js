import mongoose from 'mongoose';

const coordinateLogSchema = new mongoose.Schema({
  coordinates: {
    type: [Number], // [longitude, latitude]
    required: true,
  },
  timestamp: {
    type: Date,
    default: Date.now,
  },
});

const deliveryTrackingSchema = new mongoose.Schema(
  {
    order: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Order',
      required: [true, 'Tracking must link to an active Order'],
      unique: true,
      index: true,
    },
    deliveryPartner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    currentLocation: {
      type: {
        type: String,
        enum: ['Point'],
        default: 'Point',
      },
      coordinates: {
        type: [Number], // [longitude, latitude]
        required: true,
      },
    },
    bearing: {
      type: Number, // Angle/direction driver is facing
      default: 0,
    },
    history: [coordinateLogSchema],
  },
  {
    timestamps: true,
  }
);

deliveryTrackingSchema.index({ currentLocation: '2dsphere' });

const DeliveryTracking = mongoose.model('DeliveryTracking', deliveryTrackingSchema);

export default DeliveryTracking;
