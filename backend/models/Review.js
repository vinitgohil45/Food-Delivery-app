import mongoose from 'mongoose';
import Restaurant from './Restaurant.js';

const reviewSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Review must belong to a user'],
      index: true,
    },
    restaurant: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Restaurant',
      required: [true, 'Review must associate with a Restaurant'],
      index: true,
    },
    order: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Order',
      required: [true, 'Review must reference an Order'],
      unique: true, // One review per order
    },
    rating: {
      type: Number,
      required: [true, 'Please provide rating score'],
      min: 1,
      max: 5,
      index: true,
    },
    comment: {
      type: String,
      trim: true,
      maxlength: [500, 'Comment cannot exceed 500 characters'],
    },
    photos: [String], // Cloudinary photo URLs
    likes: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
    helpfulCount: {
      type: Number,
      default: 0,
    },
    isReported: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

// Compound index
reviewSchema.index({ restaurant: 1, rating: -1 });

// Static method to calculate average rating for a restaurant
reviewSchema.statics.calcAverageRating = async function (restaurantId) {
  const stats = await this.aggregate([
    {
      $match: { restaurant: restaurantId },
    },
    {
      $group: {
        _id: '$restaurant',
        nRating: { $sum: 1 },
        avgRating: { $avg: '$rating' },
      },
    },
  ]);

  if (stats.length > 0) {
    await Restaurant.findByIdAndUpdate(restaurantId, {
      totalReviews: stats[0].nRating,
      averageRating: stats[0].avgRating,
    });
  } else {
    await Restaurant.findByIdAndUpdate(restaurantId, {
      totalReviews: 0,
      averageRating: 0,
    });
  }
};

// Trigger calculation on save
reviewSchema.post('save', function () {
  this.constructor.calcAverageRating(this.restaurant);
});

// Trigger calculation on delete or update
reviewSchema.post(/^findOneAnd/, async function (doc) {
  if (doc) {
    await doc.constructor.calcAverageRating(doc.restaurant);
  }
});

const Review = mongoose.model('Review', reviewSchema);

export default Review;
