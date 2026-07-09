import mongoose from 'mongoose';
import User from '../models/User.js';
import Restaurant from '../models/Restaurant.js';
import RestaurantImages from '../models/RestaurantImages.js';
import RestaurantCategory from '../models/RestaurantCategory.js';
import MenuCategory from '../models/MenuCategory.js';
import MenuItem from '../models/MenuItem.js';
import Cart from '../models/Cart.js';
import CartItem from '../models/CartItem.js';
import Order from '../models/Order.js';
import OrderItem from '../models/OrderItem.js';
import Address from '../models/Address.js';
import Coupon from '../models/Coupon.js';
import Payment from '../models/Payment.js';
import DeliveryPartner from '../models/DeliveryPartner.js';
import DeliveryTracking from '../models/DeliveryTracking.js';
import Review from '../models/Review.js';
import Notification from '../models/Notification.js';
import Wishlist from '../models/Wishlist.js';
import Wallet from '../models/Wallet.js';
import WalletTransaction from '../models/WalletTransaction.js';
import LoyaltyPoints from '../models/LoyaltyPoints.js';
import Referral from '../models/Referral.js';
import Banner from '../models/Banner.js';
import Offer from '../models/Offer.js';
import Chat from '../models/Chat.js';
import SupportTicket from '../models/SupportTicket.js';

console.log('🏁 Starting Mongoose models schema compilation verification...');

const modelsList = {
  User,
  Restaurant,
  RestaurantImages,
  RestaurantCategory,
  MenuCategory,
  MenuItem,
  Cart,
  CartItem,
  Order,
  OrderItem,
  Address,
  Coupon,
  Payment,
  DeliveryPartner,
  DeliveryTracking,
  Review,
  Notification,
  Wishlist,
  Wallet,
  WalletTransaction,
  LoyaltyPoints,
  Referral,
  Banner,
  Offer,
  Chat,
  SupportTicket
};

console.log('\n==================================================');
console.log('📦 LIST OF COMPILED MODELS');
console.log('==================================================');
Object.entries(modelsList).forEach(([key, model]) => {
  console.log(`✅ Model compiled: [${key}] -> MongoDB Collection: [${model.collection.name}]`);
});
console.log('==================================================');

console.log('\n🎉 Verification completed successfully! All 26 models compiled cleanly.');
process.exit(0);
