import mongoose from 'mongoose';

const searchHistorySchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      index: true,
    },
    query: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    count: {
      type: Number,
      default: 1,
    },
    clickCount: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

searchHistorySchema.index({ user: 1, query: 1 }, { unique: true });

const SearchHistory = mongoose.model('SearchHistory', searchHistorySchema);

export default SearchHistory;
