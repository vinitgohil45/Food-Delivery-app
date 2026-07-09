import mongoose from 'mongoose';

const selectedCustomizationSchema = new mongoose.Schema({
  groupName: { type: String, required: true }, // e.g. "Choose Crust"
  optionName: { type: String, required: true }, // e.g. "Cheese Burst"
  price: { type: Number, default: 0 },
});

const cartItemSchema = new mongoose.Schema(
  {
    cart: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Cart',
      required: [true, 'CartItem must belong to a cart'],
      index: true,
    },
    menuItem: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'MenuItem',
      required: [true, 'CartItem must reference a MenuItem'],
    },
    quantity: {
      type: Number,
      required: true,
      min: [1, 'Quantity must be at least 1'],
      default: 1,
    },
    selectedCustomizations: [selectedCustomizationSchema],
  },
  {
    timestamps: true,
  }
);

// Compound index to help update items
cartItemSchema.index({ cart: 1, menuItem: 1 });

const CartItem = mongoose.model('CartItem', cartItemSchema);

export default CartItem;
