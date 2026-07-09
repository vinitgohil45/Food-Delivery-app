import mongoose from 'mongoose';

const orderStatusTimelineSchema = new mongoose.Schema({
  status: {
    type: String,
    enum: ['placed', 'accepted', 'preparing', 'prepared', 'picked_up', 'on_the_way', 'delivered', 'cancelled'],
    required: true,
  },
  timestamp: {
    type: Date,
    default: Date.now,
  },
  note: String,
});

const orderSchema = new mongoose.Schema(
  {
    orderNumber: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    customer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Order must belong to a customer'],
      index: true,
    },
    restaurant: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Restaurant',
      required: [true, 'Order must belong to a restaurant'],
      index: true,
    },
    deliveryPartner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User', // References User record with role delivery_partner
      default: null,
      index: true,
    },
    status: {
      type: String,
      enum: ['placed', 'accepted', 'preparing', 'prepared', 'picked_up', 'on_the_way', 'delivered', 'cancelled'],
      default: 'placed',
      index: true,
    },
    timeline: [orderStatusTimelineSchema],
    deliveryAddress: {
      formattedAddress: { type: String, required: true },
      location: {
        type: { type: String, enum: ['Point'], default: 'Point' },
        coordinates: [Number],
      },
      instructions: String,
    },
    billing: {
      itemTotal: { type: Number, required: true },
      taxGst: { type: Number, required: true, default: 0 },
      deliveryCharge: { type: Number, required: true, default: 0 },
      platformFee: { type: Number, required: true, default: 2 },
      packingCharge: { type: Number, required: true, default: 0 },
      couponDiscount: { type: Number, default: 0 },
      driverTip: { type: Number, default: 0 },
      grandTotal: { type: Number, required: true },
    },
    paymentMethod: {
      type: String,
      enum: ['stripe', 'razorpay', 'wallet', 'cod'],
      required: true,
    },
    paymentStatus: {
      type: String,
      enum: ['pending', 'paid', 'failed', 'refunded'],
      default: 'pending',
    },
    coupon: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Coupon',
      default: null,
    },
    estimatedDeliveryTime: {
      type: Date,
    },
    actualDeliveryTime: {
      type: Date,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Indexes
orderSchema.index({ createdAt: -1 });

// Virtual relationship to map OrderItems
orderSchema.virtual('items', {
  ref: 'OrderItem',
  localField: '_id',
  foreignField: 'order',
});

// Hook - automatically record timeline on status changes
orderSchema.pre('save', function (next) {
  if (this.isModified('status')) {
    this.timeline.push({
      status: this.status,
      timestamp: new Date(),
      note: `Order status set to ${this.status}`,
    });
  }
  next();
});

const Order = mongoose.model('Order', orderSchema);

export default Order;
