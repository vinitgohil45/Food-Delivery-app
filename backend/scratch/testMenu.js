import mongoose from 'mongoose';
import User from '../models/User.js';
import Restaurant from '../models/Restaurant.js';
import MenuCategory from '../models/MenuCategory.js';
import MenuItem from '../models/MenuItem.js';
import { config } from '../config/env.js';
import jwt from 'jsonwebtoken';

const API_URL = 'http://localhost:5000/api/v1';

async function runTests() {
  console.log('🏁 Starting Automated Menu Module Integration Tests...');

  // 1. Connect to MongoDB
  await mongoose.connect(config.mongoUri);
  console.log('🔌 Connected to database.');

  // Create a mock owner account to bypass auth constraints
  const email = 'menu_owner_test@cravego.com';
  await User.deleteMany({ $or: [{ email }, { phone: '8888888888' }] });
  const owner = await User.create({
    name: 'Test Menu Owner',
    email,
    phone: '8888888888',
    password: 'password123',
    role: 'restaurant_owner',
    isEmailVerified: true,
  });

  // Generate secure JWT token
  const token = jwt.sign(
    { id: owner._id, role: owner.role },
    config.jwtSecret,
    { expiresIn: config.jwtAccessExpire }
  );

  // Set up mock restaurant
  await Restaurant.deleteMany({ owner: owner._id });
  const restaurant = await Restaurant.create({
    owner: owner._id,
    name: 'Test Menu Restaurant',
    cuisine: ['Fast Food'],
    location: { type: 'Point', coordinates: [77.5946, 12.9716] },
    formattedAddress: 'Indiranagar Main Road, Bangalore',
    openingHours: { open: '09:00', close: '22:00' },
    gstNumber: '29ABCDE1234F1Z5',
    licenseNumber: '12345678901234',
  });

  console.log('🧹 Cleaned up old test database records.');

  // 2. Test Category Creation
  console.log('\nStep 1: Creating Menu Category...');
  const catRes = await fetch(`${API_URL}/menu/category`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify({
      restaurant: restaurant._id.toString(),
      name: 'Burgers',
      description: 'Vibrant hot grilled burgers',
    }),
  });
  const catData = await catRes.json();
  console.log('Category Create Response Status:', catRes.status);
  console.log('Category Create Response Body:', JSON.stringify(catData, null, 2));

  if (!catData.success) {
    throw new Error('Category creation failed!');
  }

  const categoryId = catData.data._id;

  // 3. Test Menu Item Creation
  console.log('\nStep 2: Creating Menu Item...');
  const itemRes = await fetch(`${API_URL}/menu`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify({
      restaurant: restaurant._id.toString(),
      category: categoryId,
      name: 'Double Cheese Grilled Burger',
      description: 'Loaded with double cheddar, fresh lettuce, and jalapenos',
      price: 180,
      discountPercent: 10,
      isVeg: true,
      isJain: false,
      spicyLevel: 'medium',
      averagePreparationTimeMin: 15,
      ingredients: 'Cheddar, Buns, Lettuce, Jalapenos',
      calories: 350,
      proteinGrams: 12,
      carbsGrams: 40,
      fatsGrams: 18,
      inventoryCount: 50,
    }),
  });
  const itemData = await itemRes.json();
  console.log('Item Create Response Status:', itemRes.status);
  console.log('Item Create Response Body:', JSON.stringify(itemData, null, 2));

  if (!itemData.success) {
    throw new Error('Item creation failed!');
  }

  const itemId = itemData.data._id;

  // 4. Test Menu Item Duplication
  console.log('\nStep 3: Duplicating Menu Item...');
  const dupRes = await fetch(`${API_URL}/menu/${itemId}/duplicate`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });
  const dupData = await dupRes.json();
  console.log('Duplication Response Status:', dupRes.status);
  console.log('Duplication Response Body:', JSON.stringify(dupData, null, 2));

  if (!dupData.success) {
    throw new Error('Item duplication failed!');
  }

  // 5. Test Menu Item Listing Query
  console.log('\nStep 4: Querying Menu List...');
  const listRes = await fetch(`${API_URL}/menu?restaurant=${restaurant._id.toString()}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  });
  const listData = await listRes.json();
  console.log('List Query Response Status:', listRes.status);
  console.log('Number of Items found:', listData.data?.items?.length || 0);

  if (!listData.success || listData.data?.items?.length === 0) {
    throw new Error('Menu list query failed!');
  }

  // Clean up database
  await MenuItem.deleteMany({ restaurant: restaurant._id });
  await MenuCategory.deleteMany({ restaurant: restaurant._id });
  await Restaurant.deleteOne({ _id: restaurant._id });
  await User.deleteOne({ _id: owner._id });
  await mongoose.connection.close();
  
  console.log('\n✅ All Menu Module integration tests passed successfully!');
  process.exit(0);
}

runTests().catch(async (err) => {
  console.error('❌ Test failed with error:', err);
  await mongoose.connection.close();
  process.exit(1);
});
