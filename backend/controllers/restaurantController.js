import Restaurant from '../models/Restaurant.js';
import RestaurantImages from '../models/RestaurantImages.js';
import Order from '../models/Order.js';
import MenuItem from '../models/MenuItem.js';
import { uploadImage, deleteImage } from '../services/cloudinaryService.js';
import { AppError } from '../middlewares/errorHandler.js';
import asyncHandler from '../middlewares/asyncHandler.js';

/**
 * @route   POST /api/v1/restaurants
 * @desc    Register a new restaurant (Owner only)
 * @access  Private (restaurant_owner, admin)
 */
export const createRestaurant = asyncHandler(async (req, res, next) => {
  const {
    name,
    cuisine,
    longitude,
    latitude,
    formattedAddress,
    openHour,
    closeHour,
    deliveryRadiusKm,
    minOrderValue,
    deliveryCharge,
    averagePreparationTimeMin,
    gstNumber,
    licenseNumber,
  } = req.body;

  // 1. Create spatial GeoJSON point
  const location = {
    type: 'Point',
    coordinates: [parseFloat(longitude), parseFloat(latitude)],
  };

  // 2. Initialize Restaurant record
  const restaurant = await Restaurant.create({
    owner: req.user._id,
    name,
    cuisine: Array.isArray(cuisine) ? cuisine : cuisine.split(',').map((c) => c.trim()),
    location,
    formattedAddress,
    openingHours: { open: openHour, close: closeHour },
    deliveryRadiusKm: parseFloat(deliveryRadiusKm),
    minOrderValue: parseFloat(minOrderValue),
    deliveryCharge: parseFloat(deliveryCharge),
    averagePreparationTimeMin: parseInt(averagePreparationTimeMin, 10),
    gstNumber,
    licenseNumber,
  });

  res.status(201).json({
    success: true,
    message: 'Restaurant registered successfully and is pending verification',
    data: restaurant,
    errors: null,
  });
});

/**
 * @route   GET /api/v1/restaurants
 * @desc    Get all restaurants with search, pagination, and filter parameters
 * @access  Public
 */
export const getRestaurants = asyncHandler(async (req, res, next) => {
  const page = parseInt(req.query.page, 10) || 1;
  const limit = parseInt(req.query.limit, 10) || 10;
  const skip = (page - 1) * limit;

  const query = { isDeleted: false, isVerified: true, isActive: true };

  // Filters
  if (req.query.cuisine) {
    query.cuisine = { $in: req.query.cuisine.split(',').map((c) => c.trim()) };
  }
  if (req.query.minOrderValue) {
    query.minOrderValue = { $lte: parseFloat(req.query.minOrderValue) };
  }
  if (req.query.rating) {
    query.averageRating = { $gte: parseFloat(req.query.rating) };
  }

  // Search
  if (req.query.search) {
    query.name = { $regex: req.query.search, $options: 'i' };
  }

  // Sort
  let sortBy = {};
  if (req.query.sortBy === 'rating') {
    sortBy = { averageRating: -1 };
  } else if (req.query.sortBy === 'deliveryTime') {
    sortBy = { averagePreparationTimeMin: 1 };
  } else {
    sortBy = { createdAt: -1 }; // default
  }

  const restaurants = await Restaurant.find(query)
    .sort(sortBy)
    .skip(skip)
    .limit(limit);

  const total = await Restaurant.countDocuments(query);

  res.status(200).json({
    success: true,
    message: 'Restaurants retrieved successfully',
    data: {
      restaurants,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit),
      },
    },
    errors: null,
  });
});

/**
 * @route   GET /api/v1/restaurants/nearby
 * @desc    Geospatial search for restaurants within delivery radius
 * @access  Public
 */
export const getNearbyRestaurants = asyncHandler(async (req, res, next) => {
  const { longitude, latitude, maxDistanceKm } = req.query;

  if (!longitude || !latitude) {
    return next(new AppError('Please provide latitude and longitude coordinates', 400));
  }

  const radiusKm = parseFloat(maxDistanceKm) || 5;

  const restaurants = await Restaurant.find({
    isDeleted: false,
    isActive: true,
    isVerified: true,
    location: {
      $near: {
        $geometry: {
          type: 'Point',
          coordinates: [parseFloat(longitude), parseFloat(latitude)],
        },
        $maxDistance: radiusKm * 1000, // Distance in meters
      },
    },
  });

  res.status(200).json({
    success: true,
    message: `Found ${restaurants.length} restaurants within ${radiusKm}km`,
    data: restaurants,
    errors: null,
  });
});

/**
 * @route   GET /api/v1/restaurants/owner
 * @desc    Get restaurants belonging to logged-in owner
 * @access  Private (restaurant_owner, admin)
 */
export const getOwnerRestaurants = asyncHandler(async (req, res, next) => {
  const restaurants = await Restaurant.find({ owner: req.user._id, isDeleted: false });

  res.status(200).json({
    success: true,
    message: 'Owner restaurants retrieved successfully',
    data: restaurants,
    errors: null,
  });
});

/**
 * @route   GET /api/v1/restaurants/:id
 * @desc    Get restaurant detail by ID (including menu & photos)
 * @access  Public
 */
export const getRestaurantById = asyncHandler(async (req, res, next) => {
  const restaurant = await Restaurant.findById(req.params.id)
    .populate('owner', 'name email phone')
    .populate('menu')
    .populate({
      path: 'reviews',
      options: { limit: 5, sort: { createdAt: -1 } },
      populate: { path: 'user', select: 'name avatar' },
    });

  if (!restaurant || restaurant.isDeleted) {
    return next(new AppError('Restaurant not found', 404));
  }

  // Fetch images
  const images = await RestaurantImages.find({ restaurant: restaurant._id });

  res.status(200).json({
    success: true,
    message: 'Restaurant details retrieved',
    data: {
      restaurant,
      images,
    },
    errors: null,
  });
});

/**
 * @route   PUT /api/v1/restaurants/:id
 * @desc    Update restaurant profile (Owner only)
 * @access  Private (restaurant_owner, admin)
 */
export const updateRestaurant = asyncHandler(async (req, res, next) => {
  let restaurant = await Restaurant.findById(req.params.id);

  if (!restaurant || restaurant.isDeleted) {
    return next(new AppError('Restaurant not found', 404));
  }

  // Verify ownership
  if (restaurant.owner.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
    return next(new AppError('You are not authorized to edit this restaurant profile', 403));
  }

  const updateFields = { ...req.body };

  // Handle coordinates update
  if (req.body.longitude && req.body.latitude) {
    updateFields.location = {
      type: 'Point',
      coordinates: [parseFloat(req.body.longitude), parseFloat(req.body.latitude)],
    };
  }

  if (req.body.cuisine) {
    updateFields.cuisine = Array.isArray(req.body.cuisine)
      ? req.body.cuisine
      : req.body.cuisine.split(',').map((c) => c.trim());
  }

  if (req.body.openHour || req.body.closeHour) {
    updateFields.openingHours = {
      open: req.body.openHour || restaurant.openingHours.open,
      close: req.body.closeHour || restaurant.openingHours.close,
    };
  }

  restaurant = await Restaurant.findByIdAndUpdate(req.params.id, updateFields, {
    new: true,
    runValidators: true,
  });

  res.status(200).json({
    success: true,
    message: 'Restaurant profile updated successfully',
    data: restaurant,
    errors: null,
  });
});

/**
 * @route   PATCH /api/v1/restaurants/:id/status
 * @desc    Toggle restaurant status online/offline
 * @access  Private (restaurant_owner, admin)
 */
export const updateRestaurantStatus = asyncHandler(async (req, res, next) => {
  const { isActive } = req.body;
  const restaurant = await Restaurant.findById(req.params.id);

  if (!restaurant || restaurant.isDeleted) {
    return next(new AppError('Restaurant not found', 404));
  }

  if (restaurant.owner.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
    return next(new AppError('Unauthorized access', 403));
  }

  restaurant.isActive = isActive;
  await restaurant.save();

  res.status(200).json({
    success: true,
    message: `Restaurant is now ${isActive ? 'online' : 'offline'}`,
    data: restaurant,
    errors: null,
  });
});

/**
 * @route   POST /api/v1/restaurants/:id/upload-images
 * @desc    Upload restaurant images (logo, banners) to Cloudinary
 * @access  Private (restaurant_owner, admin)
 */
export const uploadRestaurantImages = asyncHandler(async (req, res, next) => {
  const restaurant = await Restaurant.findById(req.params.id);

  if (!restaurant || restaurant.isDeleted) {
    return next(new AppError('Restaurant not found', 404));
  }

  if (restaurant.owner.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
    return next(new AppError('Unauthorized', 403));
  }

  if (!req.files || req.files.length === 0) {
    return next(new AppError('Please provide at least one image file', 400));
  }

  const { imageType, isPrimary } = req.body;
  const uploadedRecords = [];

  for (const file of req.files) {
    const uploadResult = await uploadImage(file.buffer, `restaurants/${restaurant._id}`);
    
    const imgRecord = await RestaurantImages.create({
      restaurant: restaurant._id,
      url: uploadResult.url,
      publicId: uploadResult.publicId,
      imageType: imageType || 'food',
      isPrimary: isPrimary === 'true',
    });
    
    uploadedRecords.push(imgRecord);
  }

  res.status(201).json({
    success: true,
    message: 'Images uploaded successfully',
    data: uploadedRecords,
    errors: null,
  });
});

/**
 * @route   GET /api/v1/restaurants/:id/analytics
 * @desc    Get dashboard analytics metrics for a restaurant (revenue, orders count)
 * @access  Private (restaurant_owner, admin)
 */
export const getRestaurantAnalytics = asyncHandler(async (req, res, next) => {
  const restaurant = await Restaurant.findById(req.params.id);

  if (!restaurant || restaurant.isDeleted) {
    return next(new AppError('Restaurant not found', 404));
  }

  if (restaurant.owner.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
    return next(new AppError('Unauthorized access', 403));
  }

  // Aggregate revenue and orders metrics
  const orderStats = await Order.aggregate([
    {
      $match: {
        restaurant: restaurant._id,
        status: 'delivered',
      },
    },
    {
      $group: {
        _id: '$restaurant',
        totalRevenue: { $sum: '$billing.grandTotal' },
        totalOrders: { $sum: 1 },
        averageOrderValue: { $avg: '$billing.grandTotal' },
      },
    },
  ]);

  const stats = orderStats[0] || {
    totalRevenue: 0,
    totalOrders: 0,
    averageOrderValue: 0,
  };

  // Get active menu items counts
  const menuItemsCount = await MenuItem.countDocuments({
    restaurant: restaurant._id,
    isDeleted: false,
  });

  res.status(200).json({
    success: true,
    message: 'Restaurant analytics retrieved successfully',
    data: {
      revenue: stats.totalRevenue,
      ordersCount: stats.totalOrders,
      averageOrderValue: Math.round(stats.averageOrderValue),
      menuItemsCount,
    },
    errors: null,
  });
});

/**
 * @route   DELETE /api/v1/restaurants/:id
 * @desc    Soft delete restaurant profile
 * @access  Private (restaurant_owner, admin)
 */
export const deleteRestaurant = asyncHandler(async (req, res, next) => {
  const restaurant = await Restaurant.findById(req.params.id);

  if (!restaurant || restaurant.isDeleted) {
    return next(new AppError('Restaurant not found', 404));
  }

  if (restaurant.owner.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
    return next(new AppError('Unauthorized access', 403));
  }

  restaurant.isDeleted = true;
  await restaurant.save();

  res.status(200).json({
    success: true,
    message: 'Restaurant deleted successfully',
    data: null,
    errors: null,
  });
});
