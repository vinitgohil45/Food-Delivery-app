import mongoose from 'mongoose';

const pointSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ['Point'],
    required: true,
    default: 'Point',
  },
  coordinates: {
    type: [Number], // [longitude, latitude]
    required: [true, 'Please provide location coordinates'],
  },
});

const openingHoursSchema = new mongoose.Schema({
  open: { type: String, required: true }, // e.g. "09:00"
  close: { type: String, required: true }, // e.g. "23:00"
});

const restaurantSchema = new mongoose.Schema(
  {
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Restaurant must belong to an owner'],
    },
    name: {
      type: String,
      required: [true, 'Please provide restaurant name'],
      trim: true,
    },
    cuisine: [
      {
        type: String,
        required: [true, 'Please provide at least one cuisine type'],
      },
    ],
    location: {
      type: pointSchema,
      required: [true, 'Please provide restaurant location'],
    },
    formattedAddress: {
      type: String,
      required: [true, 'Please provide formatted address'],
    },
    averageRating: {
      type: Number,
      default: 0,
      min: [0, 'Rating cannot be less than 0'],
      max: [5, 'Rating cannot exceed 5'],
      set: (val) => Math.round(val * 10) / 10, // Round to 1 decimal place
    },
    totalReviews: {
      type: Number,
      default: 0,
    },
    image: {
      type: String,
      default: '',
    },
    openingHours: {
      type: openingHoursSchema,
      required: [true, 'Please configure opening and closing hours'],
    },
    deliveryRadiusKm: {
      type: Number,
      required: [true, 'Please configure delivery radius in Km'],
      default: 5,
    },
    minOrderValue: {
      type: Number,
      default: 0,
    },
    deliveryCharge: {
      type: Number,
      default: 0,
    },
    averagePreparationTimeMin: {
      type: Number,
      required: [true, 'Please configure average preparation time'],
      default: 30,
    },
    gstNumber: {
      type: String,
      required: [true, 'Please configure GST Registration Number'],
      trim: true,
    },
    licenseNumber: {
      type: String,
      required: [true, 'Please configure FSSAI License Number'],
      trim: true,
    },
    isVerified: {
      type: Boolean,
      default: false,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    isDeleted: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Indexes
restaurantSchema.index({ location: '2dsphere' }); // GeoSpatial Index
restaurantSchema.index({ owner: 1 });
restaurantSchema.index({ averageRating: -1 });
restaurantSchema.index(
  { name: 'text', cuisineType: 'text', formattedAddress: 'text' },
  { weights: { name: 10, cuisineType: 5, formattedAddress: 1 } }
);

// Virtuals
restaurantSchema.virtual('menu', {
  ref: 'MenuItem',
  localField: '_id',
  foreignField: 'restaurant',
});

restaurantSchema.virtual('reviews', {
  ref: 'Review',
  localField: '_id',
  foreignField: 'restaurant',
});

// Soft delete query middlewares
restaurantSchema.pre(/^find/, function (next) {
  this.find({ isDeleted: { $ne: true } });
  next();
});

// Instance Method - Check if restaurant is open now
restaurantSchema.methods.isOpenNow = function () {
  const now = new Date();
  const currentHour = now.getHours();
  const currentMinute = now.getMinutes();
  const currentTimeString = `${currentHour.toString().padStart(2, '0')}:${currentMinute.toString().padStart(2, '0')}`;
  
  const { open, close } = this.openingHours;
  return currentTimeString >= open && currentTimeString <= close;
};

const Restaurant = mongoose.model('Restaurant', restaurantSchema);

export default Restaurant;
