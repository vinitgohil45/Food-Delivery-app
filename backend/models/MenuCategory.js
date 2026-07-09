import mongoose from 'mongoose';

const menuCategorySchema = new mongoose.Schema(
  {
    restaurant: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Restaurant',
      required: [true, 'Menu category must be linked to a restaurant'],
    },
    name: {
      type: String,
      required: [true, 'Please provide menu category name'],
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
    sequenceOrder: {
      type: Number,
      default: 0, // Used to sort categories on the menu page
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

// Compound index to guarantee uniqueness of category name per restaurant
menuCategorySchema.index({ restaurant: 1, name: 1 }, { unique: true });
menuCategorySchema.index({ restaurant: 1, sequenceOrder: 1 });

const MenuCategory = mongoose.model('MenuCategory', menuCategorySchema);

export default MenuCategory;
