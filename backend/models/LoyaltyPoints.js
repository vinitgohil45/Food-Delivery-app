import mongoose from 'mongoose';

const loyaltyPointsSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Loyalty points record must target a user'],
      unique: true,
      index: true,
    },
    currentPoints: {
      type: Number,
      default: 0,
      min: 0,
    },
    lifetimeEarned: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

const LoyaltyPoints = mongoose.model('LoyaltyPoints', loyaltyPointsSchema);

export default LoyaltyPoints;
