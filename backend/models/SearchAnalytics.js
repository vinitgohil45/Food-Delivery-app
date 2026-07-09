import mongoose from 'mongoose';

const searchAnalyticsSchema = new mongoose.Schema(
  {
    query: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
      index: true,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      index: true,
    },
    searchTimeMs: {
      type: Number,
      required: true,
    },
    resultsCount: {
      type: Number,
      default: 0,
      index: true,
    },
    hasClicked: {
      type: Boolean,
      default: false,
      index: true,
    },
    hasOrdered: {
      type: Boolean,
      default: false,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

const SearchAnalytics = mongoose.model('SearchAnalytics', searchAnalyticsSchema);

export default SearchAnalytics;
