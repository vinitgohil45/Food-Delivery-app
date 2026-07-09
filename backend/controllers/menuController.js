import MenuCategory from '../models/MenuCategory.js';
import MenuItem from '../models/MenuItem.js';
import Restaurant from '../models/Restaurant.js';
import { uploadImage } from '../services/cloudinaryService.js';
import { AppError } from '../middlewares/errorHandler.js';
import asyncHandler from '../middlewares/asyncHandler.js';

// Helper to check restaurant ownership
const checkOwnership = async (restaurantId, userId) => {
  const restaurant = await Restaurant.findById(restaurantId);
  if (!restaurant) {
    throw new AppError('Restaurant not found', 404);
  }
  return restaurant.owner.toString() === userId.toString();
};

/* ==========================================================================
   CATEGORY CONTROLLERS
   ========================================================================== */

export const createMenuCategory = asyncHandler(async (req, res, next) => {
  const { restaurant, name, description, sequenceOrder } = req.body;

  const isOwner = await checkOwnership(restaurant, req.user._id);
  if (!isOwner && req.user.role !== 'admin') {
    return next(new AppError('You are not authorized to add categories to this restaurant', 403));
  }

  const category = await MenuCategory.create({
    restaurant,
    name,
    description,
    sequenceOrder: sequenceOrder || 0,
  });

  res.status(201).json({
    success: true,
    message: 'Menu category created successfully',
    data: category,
    errors: null,
  });
});

export const updateMenuCategory = asyncHandler(async (req, res, next) => {
  const category = await MenuCategory.findById(req.params.id);
  if (!category) {
    return next(new AppError('Menu category not found', 404));
  }

  const isOwner = await checkOwnership(category.restaurant, req.user._id);
  if (!isOwner && req.user.role !== 'admin') {
    return next(new AppError('Unauthorized', 403));
  }

  const updatedCategory = await MenuCategory.findByIdAndUpdate(
    req.params.id,
    req.body,
    { new: true, runValidators: true }
  );

  res.status(200).json({
    success: true,
    message: 'Menu category updated successfully',
    data: updatedCategory,
    errors: null,
  });
});

export const deleteMenuCategory = asyncHandler(async (req, res, next) => {
  const category = await MenuCategory.findById(req.params.id);
  if (!category) {
    return next(new AppError('Menu category not found', 404));
  }

  const isOwner = await checkOwnership(category.restaurant, req.user._id);
  if (!isOwner && req.user.role !== 'admin') {
    return next(new AppError('Unauthorized', 403));
  }

  // Check if items are associated with this category
  const hasItems = await MenuItem.exists({ category: category._id, isDeleted: false });
  if (hasItems) {
    return next(new AppError('Cannot delete category containing active menu items. Reassign or delete items first.', 400));
  }

  await category.deleteOne();

  res.status(200).json({
    success: true,
    message: 'Menu category deleted successfully',
    data: null,
    errors: null,
  });
});

/* ==========================================================================
   MENU ITEM CONTROLLERS
   ========================================================================== */

export const createMenuItem = asyncHandler(async (req, res, next) => {
  const {
    restaurant,
    category,
    name,
    description,
    price,
    discountPercent,
    isVeg,
    isJain,
    spicyLevel,
    averagePreparationTimeMin,
    ingredients,
    calories,
    proteinGrams,
    carbsGrams,
    fatsGrams,
    customizationGroups,
    inventoryCount,
  } = req.body;

  const isOwner = await checkOwnership(restaurant, req.user._id);
  if (!isOwner && req.user.role !== 'admin') {
    return next(new AppError('Unauthorized', 403));
  }

  const item = await MenuItem.create({
    restaurant,
    category,
    name,
    description,
    price: parseFloat(price),
    discountPercent: parseFloat(discountPercent) || 0,
    isVeg,
    isJain: isJain || false,
    spicyLevel: spicyLevel || 'none',
    averagePreparationTimeMin: parseInt(averagePreparationTimeMin, 10) || 20,
    ingredients: Array.isArray(ingredients) ? ingredients : ingredients?.split(',').map((i) => i.trim()),
    nutrition: {
      calories: parseInt(calories, 10) || 0,
      proteinGrams: parseInt(proteinGrams, 10) || 0,
      carbsGrams: parseInt(carbsGrams, 10) || 0,
      fatsGrams: parseInt(fatsGrams, 10) || 0,
    },
    customizationGroups: customizationGroups || [],
    inventoryCount: parseInt(inventoryCount, 10) || 99,
  });

  res.status(201).json({
    success: true,
    message: 'Menu item created successfully',
    data: item,
    errors: null,
  });
});

export const getMenuItems = asyncHandler(async (req, res, next) => {
  const page = parseInt(req.query.page, 10) || 1;
  const limit = parseInt(req.query.limit, 10) || 20;
  const skip = (page - 1) * limit;

  const query = { isDeleted: false };

  // Filters
  if (req.query.restaurant) query.restaurant = req.query.restaurant;
  if (req.query.category) query.category = req.query.category;
  if (req.query.veg) query.isVeg = req.query.veg === 'true';
  if (req.query.jain) query.isJain = req.query.jain === 'true';
  if (req.query.spicyLevel) query.spicyLevel = req.query.spicyLevel;
  if (req.query.isAvailable) query.isAvailable = req.query.isAvailable === 'true';

  // Search
  if (req.query.search) {
    query.name = { $regex: req.query.search, $options: 'i' };
  }

  // Sort
  let sortBy = {};
  if (req.query.sortBy === 'priceAsc') sortBy = { price: 1 };
  else if (req.query.sortBy === 'priceDesc') sortBy = { price: -1 };
  else if (req.query.sortBy === 'discount') sortBy = { discountPercent: -1 };
  else sortBy = { createdAt: -1 };

  const items = await MenuItem.find(query)
    .populate('category', 'name')
    .sort(sortBy)
    .skip(skip)
    .limit(limit);

  const total = await MenuItem.countDocuments(query);

  res.status(200).json({
    success: true,
    message: 'Menu items retrieved',
    data: {
      items,
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

export const getMenuItemById = asyncHandler(async (req, res, next) => {
  const item = await MenuItem.findById(req.params.id).populate('category', 'name');
  if (!item || item.isDeleted) {
    return next(new AppError('Menu item not found', 404));
  }

  res.status(200).json({
    success: true,
    message: 'Menu item details retrieved',
    data: item,
    errors: null,
  });
});

export const updateMenuItem = asyncHandler(async (req, res, next) => {
  let item = await MenuItem.findById(req.params.id);
  if (!item || item.isDeleted) {
    return next(new AppError('Menu item not found', 404));
  }

  const isOwner = await checkOwnership(item.restaurant, req.user._id);
  if (!isOwner && req.user.role !== 'admin') {
    return next(new AppError('Unauthorized', 403));
  }

  const updateFields = { ...req.body };
  if (req.body.ingredients) {
    updateFields.ingredients = Array.isArray(req.body.ingredients)
      ? req.body.ingredients
      : req.body.ingredients.split(',').map((i) => i.trim());
  }

  if (req.body.calories || req.body.proteinGrams || req.body.carbsGrams || req.body.fatsGrams) {
    updateFields.nutrition = {
      calories: parseInt(req.body.calories || item.nutrition.calories, 10),
      proteinGrams: parseInt(req.body.proteinGrams || item.nutrition.proteinGrams, 10),
      carbsGrams: parseInt(req.body.carbsGrams || item.nutrition.carbsGrams, 10),
      fatsGrams: parseInt(req.body.fatsGrams || item.nutrition.fatsGrams, 10),
    };
  }

  item = await MenuItem.findByIdAndUpdate(req.params.id, updateFields, {
    new: true,
    runValidators: true,
  });

  res.status(200).json({
    success: true,
    message: 'Menu item updated successfully',
    data: item,
    errors: null,
  });
});

export const deleteMenuItem = asyncHandler(async (req, res, next) => {
  const item = await MenuItem.findById(req.params.id);
  if (!item || item.isDeleted) {
    return next(new AppError('Menu item not found', 404));
  }

  const isOwner = await checkOwnership(item.restaurant, req.user._id);
  if (!isOwner && req.user.role !== 'admin') {
    return next(new AppError('Unauthorized', 403));
  }

  item.isDeleted = true;
  await item.save();

  res.status(200).json({
    success: true,
    message: 'Menu item deleted successfully',
    data: null,
    errors: null,
  });
});

export const updateItemStatus = asyncHandler(async (req, res, next) => {
  const { isAvailable } = req.body;
  const item = await MenuItem.findById(req.params.id);

  if (!item || item.isDeleted) {
    return next(new AppError('Menu item not found', 404));
  }

  const isOwner = await checkOwnership(item.restaurant, req.user._id);
  if (!isOwner && req.user.role !== 'admin') {
    return next(new AppError('Unauthorized', 403));
  }

  item.isAvailable = isAvailable;
  await item.save();

  res.status(200).json({
    success: true,
    message: `Menu item is now ${isAvailable ? 'available' : 'unavailable'}`,
    data: item,
    errors: null,
  });
});

export const updateItemInventory = asyncHandler(async (req, res, next) => {
  const { inventoryCount } = req.body;
  const item = await MenuItem.findById(req.params.id);

  if (!item || item.isDeleted) {
    return next(new AppError('Menu item not found', 404));
  }

  const isOwner = await checkOwnership(item.restaurant, req.user._id);
  if (!isOwner && req.user.role !== 'admin') {
    return next(new AppError('Unauthorized', 403));
  }

  item.inventoryCount = inventoryCount;
  // Auto-disable item availability if stock hits 0
  if (inventoryCount === 0) {
    item.isAvailable = false;
  }
  await item.save();

  res.status(200).json({
    success: true,
    message: `Menu item inventory updated to ${inventoryCount}`,
    data: item,
    errors: null,
  });
});

export const duplicateMenuItem = asyncHandler(async (req, res, next) => {
  const sourceItem = await MenuItem.findById(req.params.id);
  if (!sourceItem || sourceItem.isDeleted) {
    return next(new AppError('Source menu item not found', 404));
  }

  const isOwner = await checkOwnership(sourceItem.restaurant, req.user._id);
  if (!isOwner && req.user.role !== 'admin') {
    return next(new AppError('Unauthorized', 403));
  }

  // Clone source data parameters
  const clonedObject = sourceItem.toObject();
  delete clonedObject._id;
  delete clonedObject.createdAt;
  delete clonedObject.updatedAt;
  delete clonedObject.__v;
  delete clonedObject.id;

  clonedObject.name = `${sourceItem.name} (Copy)`;
  clonedObject.isAvailable = false; // Disable copies by default

  const duplicate = await MenuItem.create(clonedObject);

  res.status(201).json({
    success: true,
    message: 'Menu item duplicated successfully',
    data: duplicate,
    errors: null,
  });
});

export const uploadMenuItemImages = asyncHandler(async (req, res, next) => {
  const item = await MenuItem.findById(req.params.id);
  if (!item || item.isDeleted) {
    return next(new AppError('Menu item not found', 404));
  }

  const isOwner = await checkOwnership(item.restaurant, req.user._id);
  if (!isOwner && req.user.role !== 'admin') {
    return next(new AppError('Unauthorized', 403));
  }

  if (!req.files || req.files.length === 0) {
    return next(new AppError('Please provide at least one image file', 400));
  }

  // Upload first image to CDN and update item
  const uploadResult = await uploadImage(req.files[0].buffer, `restaurants/${item.restaurant}/menu`);
  item.image = uploadResult.url;
  await item.save();

  res.status(200).json({
    success: true,
    message: 'Menu item image uploaded successfully',
    data: item,
    errors: null,
  });
});
