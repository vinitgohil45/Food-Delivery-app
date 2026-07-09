import mongoose from 'mongoose';

const popularSearchSchema = new mongoose.Schema(
  {
    query: {
      type: String,
      required: true,
      trim: true,
      unique: true,
      lowercase: true,
      index: true,
    },
    count: {
      type: Number,
      default: 1,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

const PopularSearch = mongoose.model('PopularSearch', popularSearchSchema);

export default PopularSearch;
