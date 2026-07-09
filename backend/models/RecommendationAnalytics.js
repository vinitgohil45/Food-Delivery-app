import mongoose from 'mongoose';

const recommendationAnalyticsSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      index: true,
    },
    recommendationType: {
      type: String,
      required: true,
      index: true,
    },
    itemId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      index: true,
    },
    itemType: {
      type: String,
      enum: ['Restaurant', 'MenuItem'],
      required: true,
    },
    event: {
      type: String,
      enum: ['impression', 'click', 'conversion'],
      required: true,
      index: true,
    },
    meta: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
  },
  {
    timestamps: true,
  }
);

const RecommendationAnalytics = mongoose.model('RecommendationAnalytics', recommendationAnalyticsSchema);

export default RecommendationAnalytics;
