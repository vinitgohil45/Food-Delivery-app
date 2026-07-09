import mongoose from 'mongoose';

const walletTransactionSchema = new mongoose.Schema(
  {
    wallet: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Wallet',
      required: [true, 'Transaction must link to a Wallet'],
      index: true,
    },
    amount: {
      type: Number,
      required: true,
    },
    transactionType: {
      type: String,
      enum: ['credit', 'debit'],
      required: true,
    },
    purpose: {
      type: String,
      enum: ['deposit', 'order_payment', 'refund', 'referral_bonus', 'cashback'],
      required: true,
    },
    referenceId: {
      type: String, // Can store OrderId or PaymentId or ReferralId
      default: null,
    },
    description: String,
  },
  {
    timestamps: true,
  }
);

walletTransactionSchema.index({ wallet: 1, createdAt: -1 });

const WalletTransaction = mongoose.model('WalletTransaction', walletTransactionSchema);

export default WalletTransaction;
