import { Router } from 'express';
import Address from '../models/Address.js';
import { protect } from '../middlewares/authMiddleware.js';
import asyncHandler from '../middlewares/asyncHandler.js';

const router = Router();

router.use(protect);

router.get('/', asyncHandler(async (req, res, next) => {
  const addresses = await Address.find({ user: req.user._id });
  res.status(200).json({
    success: true,
    message: 'Addresses retrieved successfully',
    data: addresses,
    errors: null,
  });
}));

router.post('/', asyncHandler(async (req, res, next) => {
  const { addressType, houseFlatNo, landmark, formattedAddress, longitude, latitude, deliveryInstructions } = req.body;
  
  const address = await Address.create({
    user: req.user._id,
    addressType: addressType || 'home',
    houseFlatNo,
    landmark,
    formattedAddress,
    location: {
      type: 'Point',
      coordinates: [parseFloat(longitude) || 77.5946, parseFloat(latitude) || 12.9716],
    },
    deliveryInstructions,
  });

  res.status(201).json({
    success: true,
    message: 'Address created successfully',
    data: address,
    errors: null,
  });
}));

export default router;
