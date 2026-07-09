import mongoose from 'mongoose';

const customizationOptionSchema = new mongoose.Schema({
  name: { type: String, required: true }, // e.g. "Extra Cheese"
  price: { type: Number, required: true, default: 0 },
});

const customizationGroupSchema = new mongoose.Schema({
  name: { type: String, required: true }, // e.g. "Choose Crust" or "Addons"
  minSelection: { type: Number, default: 0 },
  maxSelection: { type: Number, default: 1 },
  options: [customizationOptionSchema],
});

const nutritionSchema = new mongoose.Schema({
  calories: { type: Number, default: 0 },
  proteinGrams: { type: Number, default: 0 },
  carbsGrams: { type: Number, default: 0 },
  fatsGrams: { type: Number, default: 0 },
});

const menuItemSchema = new mongoose.Schema(
  {
    restaurant: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Restaurant',
      required: [true, 'Menu item must belong to a restaurant'],
    },
    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'MenuCategory',
      required: [true, 'Menu item must belong to a category'],
    },
    name: {
      type: String,
      required: [true, 'Please provide item name'],
      trim: true,
    },
    description: {
      type: String,
      trim: true,
      maxlength: [300, 'Description cannot exceed 300 characters'],
    },
    price: {
      type: Number,
      required: [true, 'Please configure item price'],
      min: [0, 'Price cannot be negative'],
    },
    discountPercent: {
      type: Number,
      default: 0,
      min: [0, 'Discount cannot be negative'],
      max: [100, 'Discount cannot exceed 100%'],
    },
    image: {
      type: String,
      default: '',
    },
    isAvailable: {
      type: Boolean,
      default: true,
    },
    isVeg: {
      type: Boolean,
      required: [true, 'Please specify if item is Vegetarian (true/false)'],
    },
    ingredients: [String],
    nutrition: nutritionSchema,
    customizationGroups: [customizationGroupSchema],
    inventoryCount: {
      type: Number,
      default: 99, // Simple stock tracking count
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

// Indexes for fast querying
menuItemSchema.index({ restaurant: 1, category: 1 });
menuItemSchema.index({ name: 'text', description: 'text' }); // Full Text Search index
menuItemSchema.index({ price: 1 });

// Virtual - calculate discounted price
menuItemSchema.virtual('finalPrice').get(function () {
  if (this.discountPercent > 0) {
    return Math.round(this.price * (1 - this.discountPercent / 100));
  }
  return this.price;
});

// Soft delete query middlewares
menuItemSchema.pre(/^find/, function (next) {
  this.find({ isDeleted: { $ne: true } });
  next();
});

const MenuItem = mongoose.model('MenuItem', menuItemSchema);

export default MenuItem;
