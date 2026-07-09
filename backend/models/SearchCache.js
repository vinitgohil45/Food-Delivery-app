import mongoose from 'mongoose';

const searchCacheSchema = new mongoose.Schema(
  {
    key: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    results: {
      restaurants: [
        {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'Restaurant',
        },
      ],
      menuItems: [
        {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'MenuItem',
        },
      ],
      didYouMean: {
        type: String,
        default: '',
      },
    },
    expiresAt: {
      type: Date,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

searchCacheSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

const SearchCache = mongoose.model('SearchCache', searchCacheSchema);

export default SearchCache;
