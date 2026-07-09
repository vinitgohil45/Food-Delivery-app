import mongoose from 'mongoose';

const restaurantImagesSchema = new mongoose.Schema(
  {
    restaurant: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Restaurant',
      required: [true, 'Images must be associated with a restaurant'],
      index: true,
    },
    url: {
      type: String,
      required: [true, 'Please provide image URL'],
    },
    publicId: {
      type: String,
      required: [true, 'Please provide Cloudinary public ID'],
    },
    imageType: {
      type: String,
      enum: ['logo', 'banner', 'interior', 'food', 'menu_card'],
      default: 'food',
    },
    isPrimary: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

restaurantImagesSchema.index({ restaurant: 1, imageType: 1 });

const RestaurantImages = mongoose.model('RestaurantImages', restaurantImagesSchema);

export default RestaurantImages;
