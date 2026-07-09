import mongoose from 'mongoose';

const bannerSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Please provide banner title'],
      trim: true,
    },
    imageUrl: {
      type: String,
      required: [true, 'Please provide banner image URL'],
    },
    linkType: {
      type: String,
      enum: ['restaurant', 'category', 'offer', 'external'],
      required: true,
    },
    linkValue: {
      type: String, // ID of restaurant/category or external url
      required: true,
    },
    sequenceOrder: {
      type: Number,
      default: 0,
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
    startDate: Date,
    endDate: Date,
  },
  {
    timestamps: true,
  }
);

bannerSchema.index({ sequenceOrder: 1, isActive: 1 });

const Banner = mongoose.model('Banner', bannerSchema);

export default Banner;
