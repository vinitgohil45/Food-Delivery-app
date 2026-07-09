import { Router } from 'express';
import Wallet from '../models/Wallet.js';
import WalletTransaction from '../models/WalletTransaction.js';
import { protect } from '../middlewares/authMiddleware.js';
import asyncHandler from '../middlewares/asyncHandler.js';

const router = Router();

router.use(protect);

router.get('/', asyncHandler(async (req, res, next) => {
  let wallet = await Wallet.findOne({ user: req.user._id });
  if (!wallet) {
    wallet = await Wallet.create({ user: req.user._id, balance: 500 }); // Give ₹500 welcome credit!
  }

  const transactions = await WalletTransaction.find({ wallet: wallet._id })
    .sort({ createdAt: -1 })
    .limit(10);

  res.status(200).json({
    success: true,
    message: 'Wallet retrieved successfully',
    data: {
      balance: wallet.balance,
      transactions,
    },
    errors: null,
  });
}));

router.post('/deposit', asyncHandler(async (req, res, next) => {
  const { amount } = req.body;
  
  if (!amount || amount <= 0) {
    return res.status(400).json({ success: false, message: 'Invalid deposit amount' });
  }

  let wallet = await Wallet.findOne({ user: req.user._id });
  if (!wallet) {
    wallet = await Wallet.create({ user: req.user._id, balance: 0 });
  }

  wallet.balance += parseFloat(amount);
  await wallet.save();

  await WalletTransaction.create({
    wallet: wallet._id,
    amount: parseFloat(amount),
    transactionType: 'credit',
    purpose: 'deposit',
    description: 'Added funds to CraveGo Wallet',
  });

  res.status(200).json({
    success: true,
    message: 'Deposit successful',
    data: { balance: wallet.balance },
    errors: null,
  });
}));

export default router;
