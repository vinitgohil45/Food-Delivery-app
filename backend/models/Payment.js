import mongoose from 'mongoose';

const paymentSchema = new mongoose.Schema(
  {
    order: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Order',
      required: [true, 'Payment must reference an Order'],
      index: true,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    gateway: {
      type: String,
      enum: ['stripe', 'razorpay', 'wallet', 'cod'],
      required: true,
    },
    transactionId: {
      type: String,
      required: function () {
        return this.gateway !== 'cod';
      },
      unique: true,
      sparse: true, // Allows null/missing values for COD before delivery
      index: true,
    },
    amount: {
      type: Number,
      required: true,
    },
    currency: {
      type: String,
      default: 'INR',
    },
    status: {
      type: String,
      enum: ['pending', 'completed', 'failed', 'refunded'],
      default: 'pending',
      index: true,
    },
    invoiceNumber: {
      type: String,
      unique: true,
      index: true,
    },
    refundDetails: {
      refundId: String,
      refundedAmount: Number,
      refundedAt: Date,
      reason: String,
    },
  },
  {
    timestamps: true,
  }
);

// Pre-save hook: Generate unique invoice number prefix
paymentSchema.pre('save', function (next) {
  if (!this.invoiceNumber) {
    this.invoiceNumber = `INV-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`;
  }
  next();
});

const Payment = mongoose.model('Payment', paymentSchema);

export default Payment;
