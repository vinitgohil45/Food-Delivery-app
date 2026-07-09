import mongoose from 'mongoose';

const recommendationCacheSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      index: true,
    },
    sessionKey: {
      type: String,
      index: true,
    },
    recommendationType: {
      type: String,
      required: true,
      index: true,
    },
    recommendations: [
      {
        itemType: { type: String, enum: ['Restaurant', 'MenuItem'], required: true },
        itemId: { type: mongoose.Schema.Types.ObjectId, required: true },
        score: { type: Number, default: 0 },
        reason: { type: String, default: '' },
        confidence: { type: Number, default: 1 },
      },
    ],
    expiresAt: {
      type: Date,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

// TTL index to automatically remove expired caches
recommendationCacheSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

const RecommendationCache = mongoose.model('RecommendationCache', recommendationCacheSchema);

export default RecommendationCache;
