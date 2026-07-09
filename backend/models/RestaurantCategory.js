import mongoose from 'mongoose';

const restaurantCategorySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Please provide category name'],
      unique: true,
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
    image: {
      type: String,
      default: '',
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

restaurantCategorySchema.index({ name: 1 }, { unique: true });

const RestaurantCategory = mongoose.model('RestaurantCategory', restaurantCategorySchema);

export default RestaurantCategory;
