import mongoose from 'mongoose';

const searchClickSchema = new mongoose.Schema(
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
  },
  {
    timestamps: true,
  }
);

const SearchClick = mongoose.model('SearchClick', searchClickSchema);

export default SearchClick;
