import mongoose from 'mongoose';

const orderItemCustomizationSchema = new mongoose.Schema({
  groupName: { type: String, required: true },
  optionName: { type: String, required: true },
  price: { type: Number, default: 0 },
});

const orderItemSchema = new mongoose.Schema(
  {
    order: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Order',
      required: [true, 'OrderItem must belong to an order'],
      index: true,
    },
    menuItem: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'MenuItem',
      required: [true, 'OrderItem must reference a MenuItem'],
    },
    name: {
      type: String,
      required: [true, 'Preserve item name at order placement'],
    },
    price: {
      type: Number,
      required: [true, 'Preserve item price at order placement'],
    },
    quantity: {
      type: Number,
      required: true,
      min: [1, 'Quantity must be at least 1'],
    },
    selectedCustomizations: [orderItemCustomizationSchema],
  },
  {
    timestamps: true,
  }
);

orderItemSchema.index({ order: 1, menuItem: 1 });

const OrderItem = mongoose.model('OrderItem', orderItemSchema);

export default OrderItem;
