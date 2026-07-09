import mongoose from 'mongoose';

const trendingSearchSchema = new mongoose.Schema(
  {
    query: {
      type: String,
      required: true,
      trim: true,
      unique: true,
      lowercase: true,
      index: true,
    },
    volume: {
      type: Number,
      default: 1,
      index: true,
    },
    growthRate: {
      type: Number,
      default: 0,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

const TrendingSearch = mongoose.model('TrendingSearch', trendingSearchSchema);

export default TrendingSearch;
