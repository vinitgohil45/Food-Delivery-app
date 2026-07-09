import mongoose from 'mongoose';

const userPreferenceSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
      index: true,
    },
    favoriteCuisines: [
      {
        type: String,
        trim: true,
      },
    ],
    favoriteRestaurants: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Restaurant',
      },
    ],
    averageSpending: {
      type: Number,
      default: 0,
    },
    deliveryTimePreferenceMin: {
      type: Number,
      default: 45,
    },
    favoriteFoodType: {
      type: String,
      enum: ['veg', 'non-veg', 'both'],
      default: 'both',
    },
  },
  {
    timestamps: true,
  }
);

const UserPreference = mongoose.model('UserPreference', userPreferenceSchema);

export default UserPreference;
