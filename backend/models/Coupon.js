import mongoose from 'mongoose';

const couponSchema = new mongoose.Schema(
  {
    code: {
      type: String,
      required: [true, 'Please provide coupon code'],
      unique: true,
      trim: true,
      uppercase: true,
      index: true,
    },
    discountType: {
      type: String,
      enum: ['percentage', 'flat'],
      required: true,
    },
    discountValue: {
      type: Number,
      required: [true, 'Please provide discount amount/percent'],
      min: [0, 'Discount value cannot be negative'],
    },
    maxDiscountAmount: {
      type: Number, // Applicable for percentage coupons
      default: null,
    },
    minOrderValue: {
      type: Number,
      default: 0,
      min: [0, 'Minimum order value cannot be negative'],
    },
    startDate: {
      type: Date,
      required: true,
    },
    endDate: {
      type: Date,
      required: true,
    },
    usageLimit: {
      type: Number,
      default: null, // Total number of times this coupon can be used
    },
    usageCount: {
      type: Number,
      default: 0,
    },
    maxPerUser: {
      type: Number,
      default: 1, // Number of times one customer can use this coupon
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

// Check if coupon is valid now
couponSchema.methods.isValid = function (orderValue = 0) {
  const now = new Date();
  if (!this.isActive) return false;
  if (now < this.startDate || now > this.endDate) return false;
  if (this.usageLimit && this.usageCount >= this.usageLimit) return false;
  if (orderValue < this.minOrderValue) return false;
  return true;
};

const Coupon = mongoose.model('Coupon', couponSchema);

export default Coupon;
