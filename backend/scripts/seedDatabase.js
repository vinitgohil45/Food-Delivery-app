import mongoose from 'mongoose';
import bcryptjs from 'bcryptjs';
import User from '../models/User.js';
import Restaurant from '../models/Restaurant.js';
import RestaurantImages from '../models/RestaurantImages.js';
import MenuCategory from '../models/MenuCategory.js';
import MenuItem from '../models/MenuItem.js';
import Order from '../models/Order.js';
import Review from '../models/Review.js';
import Coupon from '../models/Coupon.js';
import Wallet from '../models/Wallet.js';
import { config } from '../config/env.js';

// Image URL maps for high-quality seeding
const bannerImagesByCuisine = {
  'Burgers': 'https://images.unsplash.com/photo-1571091718767-18b5b1457add?q=80&w=800',
  'Pizza': 'https://images.unsplash.com/photo-1513104890138-7c749659a591?q=80&w=800',
  'Biryani': 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?q=80&w=800',
  'North Indian': 'https://images.unsplash.com/photo-1585959552979-4b385b990f1e?q=80&w=800',
  'Chinese': 'https://images.unsplash.com/photo-1585032226651-759b368d7246?q=80&w=800',
  'South Indian': 'https://images.unsplash.com/photo-1668236543090-82eba5ee5976?q=80&w=800',
  'Street Food': 'https://images.unsplash.com/photo-1606491956689-2ea866880c84?q=80&w=800',
  'Rajasthani': 'https://images.unsplash.com/photo-1596797038530-2c107229654b?q=80&w=800',
  'Pasta': 'https://images.unsplash.com/photo-1551183053-bf91a1d81141?q=80&w=800',
  'Mexican': 'https://images.unsplash.com/photo-1565299585323-38d6b0865b47?q=80&w=800',
  'Japanese': 'https://images.unsplash.com/photo-1579871494447-9811cf80d66c?q=80&w=800',
  'Grill': 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?q=80&w=800',
  'Salads': 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?q=80&w=800',
  'Desserts': 'https://images.unsplash.com/photo-1587314168485-3236d6710814?q=80&w=800',
  'Coffee': 'https://images.unsplash.com/photo-1509042239860-f550ce710b93?q=80&w=800',
  'Breakfast': 'https://images.unsplash.com/photo-1525351484163-7529414344d8?q=80&w=800',
  'Middle Eastern': 'https://images.unsplash.com/photo-1541518763669-27fef04b14ea?q=80&w=800',
  'Seafood': 'https://images.unsplash.com/photo-1534080564583-6be75777b70a?q=80&w=800',
  'Fast Food': 'https://images.unsplash.com/photo-1561758033-d89a9ad46330?q=80&w=800',
  'Italian': 'https://images.unsplash.com/photo-1534080564583-6be75777b70a?q=80&w=800'
};

const dishImagesByNameKeyword = {
  'burger': 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?q=80&w=400',
  'wrap': 'https://images.unsplash.com/photo-1626700051175-6518c4793f06?q=80&w=400',
  'fries': 'https://images.unsplash.com/photo-1573080496219-bb080dd4f877?q=80&w=400',
  'shake': 'https://images.unsplash.com/photo-1579954115545-a95591f28bfc?q=80&w=400',
  'pizza': 'https://images.unsplash.com/photo-1534308983496-4fabb1a015ee?q=80&w=400',
  'breadstick': 'https://images.unsplash.com/photo-1544982503-9f984c14501a?q=80&w=400',
  'popper': 'https://images.unsplash.com/photo-1541532713592-79a0317b6b77?q=80&w=400',
  'drink': 'https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?q=80&w=400',
  'biryani': 'https://images.unsplash.com/photo-1633945274405-b6c8069047b0?q=80&w=400',
  'tikka': 'https://images.unsplash.com/photo-1599487488170-d11ec9c172f0?q=80&w=400',
  'sweet': 'https://images.unsplash.com/photo-1587314168485-3236d6710814?q=80&w=400',
  'paneer': 'https://images.unsplash.com/photo-1631452180519-c014fe946bc7?q=80&w=400',
  'dal': 'https://images.unsplash.com/photo-1546833999-b9f581a1996d?q=80&w=400',
  'chicken': 'https://images.unsplash.com/photo-1604503468506-a8da13d82791?q=80&w=400',
  'naan': 'https://images.unsplash.com/photo-1601050690597-df056fb4ce78?q=80&w=400',
  'lassi': 'https://images.unsplash.com/photo-1553530666-ba11a7da3888?q=80&w=400',
  'noodle': 'https://images.unsplash.com/photo-1585032226651-759b368d7246?q=80&w=400',
  'rice': 'https://images.unsplash.com/photo-1596797038530-2c107229654b?q=80&w=400',
  'dimsum': 'https://images.unsplash.com/photo-1563245372-f21724e3856d?q=80&w=400',
  'soup': 'https://images.unsplash.com/photo-1547592165-e1d17fed6006?q=80&w=400',
  'dosa': 'https://images.unsplash.com/photo-1668236543090-82eba5ee5976?q=80&w=400',
  'idli': 'https://images.unsplash.com/photo-1589301760014-d929f3979dbc?q=80&w=400',
  'coffee': 'https://images.unsplash.com/photo-1509042239860-f550ce710b93?q=80&w=400',
  'vada': 'https://images.unsplash.com/photo-1589301760014-d929f3979dbc?q=80&w=400',
  'pav bhaji': 'https://images.unsplash.com/photo-1626132647523-66f5bf380027?q=80&w=400',
  'chaat': 'https://images.unsplash.com/photo-1606491956689-2ea866880c84?q=80&w=400',
  'tea': 'https://images.unsplash.com/photo-1576092768241-dec231879fc3?q=80&w=400',
  'thali': 'https://images.unsplash.com/photo-1589301760014-d929f3979dbc?q=80&w=400',
  'pasta': 'https://images.unsplash.com/photo-1551183053-bf91a1d81141?q=80&w=800',
  'lasagna': 'https://images.unsplash.com/photo-1574894709920-11b28e7367e3?q=80&w=400',
  'taco': 'https://images.unsplash.com/photo-1565299585323-38d6b0865b47?q=80&w=400',
  'nachos': 'https://images.unsplash.com/photo-1513456852971-30c0b8199d4d?q=80&w=400',
  'sushi': 'https://images.unsplash.com/photo-1579871494447-9811cf80d66c?q=80&w=400',
  'salad': 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?q=80&w=400',
  'toast': 'https://images.unsplash.com/photo-1525351484163-7529414344d8?q=80&w=400',
  'juice': 'https://images.unsplash.com/photo-1621506289937-a8e4df240d0b?q=80&w=400',
  'pastry': 'https://images.unsplash.com/photo-1587314168485-3236d6710814?q=80&w=400',
  'pancake': 'https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445?q=80&w=400',
  'oatmeal': 'https://images.unsplash.com/photo-1517686469429-8faf88b9f7ad?q=80&w=400',
  'shawarma': 'https://images.unsplash.com/photo-1633945274405-b6c8069047b0?q=80&w=400',
  'hummus': 'https://images.unsplash.com/photo-1577906096429-f73df2c32244?q=80&w=400',
  'falafel': 'https://images.unsplash.com/photo-1547058886-af779930e511?q=80&w=400',
  'prawn': 'https://images.unsplash.com/photo-1565557623262-b51c2513a641?q=80&w=400',
  'fish': 'https://images.unsplash.com/photo-1534080564583-6be75777b70a?q=80&w=400',
  'roll': 'https://images.unsplash.com/photo-1626700051175-6518c4793f06?q=80&w=400'
};

// Helper to look up dish image
function getDishImage(name) {
  const lowercase = name.toLowerCase();
  for (const [key, value] of Object.entries(dishImagesByNameKeyword)) {
    if (lowercase.includes(key)) {
      return value;
    }
  }
  return 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?q=80&w=400'; // Fallback food image
}

// Pre-defined realistic menu structures for the 20 restaurants (6 dishes each)
const restaurantTemplates = [
  {
    name: 'Burger House',
    cuisine: ['Burgers', 'Fast Food', 'Beverages'],
    dishes: [
      { name: 'Classic Crunch Burger', price: 149, desc: 'Crispy veggie patty with creamy mayo and fresh lettuce', isVeg: true },
      { name: 'Double Cheese Tender Burger', price: 229, desc: 'Double grilled chicken patties layered with molten cheddar', isVeg: false },
      { name: 'Spicy Paneer Wrap', price: 179, desc: 'Soft tortilla roll wrapped around spiced cottage cheese cubes', isVeg: true },
      { name: 'Peri Peri Crinkle Fries', price: 99, desc: 'Golden crinkled potato wedges dusted in hot peri peri spice', isVeg: true },
      { name: 'Velvet Chocolate Shake', price: 129, desc: 'Creamy cold shake loaded with cocoa and chocolate chips', isVeg: true },
      { name: 'Double Patty Supreme Burger', price: 249, desc: 'Supreme size double patty burger loaded with relish and cheese', isVeg: false }
    ]
  },
  {
    name: 'Pizza Palace',
    cuisine: ['Pizza', 'Italian', 'Beverages'],
    dishes: [
      { name: 'Ultimate Farmhouse Pizza', price: 349, desc: 'Overloaded with bell peppers, corn, mushrooms, and olives', isVeg: true },
      { name: 'Fiery Chicken Feast Pizza', price: 429, desc: 'Spiced hot chunks of chicken sausage, red paprika, and onions', isVeg: false },
      { name: 'Stuffed Garlic Breadsticks', price: 149, desc: 'Fresh bread filled with cheese and jalapenos, served with dip', isVeg: true },
      { name: 'Cheesy Jalapeno Poppers', price: 119, desc: 'Crispy breaded bites with melted cheese and spicy jalapenos', isVeg: true },
      { name: 'Cool Blue Lagoon Drink', price: 99, desc: 'Chilled carbonated mocktail with citrus and blue curacao notes', isVeg: true },
      { name: 'Pepperoni Twist Pizza', price: 459, desc: 'Loaded with classic pepperoni cuts and extra mozzarella cheese', isVeg: false }
    ]
  },
  {
    name: 'Biryani Junction',
    cuisine: ['Biryani', 'Indian', 'Mughlai'],
    dishes: [
      { name: 'Hyderabadi Veg Dum Biryani', price: 249, desc: 'Fragrant basmati rice slow-cooked with seasonal vegetables', isVeg: true },
      { name: 'Royal Chicken Dum Biryani', price: 299, desc: 'Classic long-grain biryani with tender chicken pieces and egg', isVeg: false },
      { name: 'Lucknowi Mutton Biryani', price: 399, desc: 'Rich mutton pieces marinated in spices and slow-dum cooked', isVeg: false },
      { name: 'Classic Paneer Tikka Dry', price: 199, desc: 'Cottage cheese cubes charred in tandoor with onions and capsicum', isVeg: true },
      { name: 'Double Ka Meetha Sweet', price: 89, desc: 'Traditional bread pudding dessert soaked in saffron milk syrup', isVeg: true },
      { name: 'Special Egg Dum Biryani', price: 269, desc: 'Basmati rice cooked with boiled eggs and caramelized onions', isVeg: false }
    ]
  },
  {
    name: 'Punjabi Tadka',
    cuisine: ['North Indian', 'Punjabi', 'Mughlai'],
    dishes: [
      { name: 'Butter Paneer Masala combo', price: 269, desc: 'Creamy tomato gravy paneer with 2 butter naan flatbreads', isVeg: true },
      { name: 'Dhaba Style Dal Makhani', price: 189, desc: 'Rich black lentils simmered overnight with butter and fresh cream', isVeg: true },
      { name: 'Tandoori Chicken Half size', price: 289, desc: 'Traditional tandoor charcoal roasted spicy chicken segments', isVeg: false },
      { name: 'Soft Garlic Naan Bread', price: 59, desc: 'Clay oven flatbread flavored with minced garlic and butter', isVeg: true },
      { name: 'Sweet Malai Lassi drink', price: 79, desc: 'Chilled whipped thick yogurt topped with cardamom and nuts', isVeg: true },
      { name: 'Punjabi Kadhi Pakora bowl', price: 169, desc: 'Gram flour dumplings inside spiced sour yogurt curry gravy', isVeg: true }
    ]
  },
  {
    name: 'Chinese Wok',
    cuisine: ['Chinese', 'Asian', 'Noodles'],
    dishes: [
      { name: 'Veg Hakka Noodles platter', price: 169, desc: 'Stir fried thin wheat noodles with cabbage, carrots, and spring onion', isVeg: true },
      { name: 'Schezwan Fried Rice chicken', price: 219, desc: 'Spicy red-chili wok tossed rice loaded with egg and shredded chicken', isVeg: false },
      { name: 'Crispy Veg Chilli Dry', price: 189, desc: 'Deep fried baby corn and cauliflower tossed in sweet garlic sauce', isVeg: true },
      { name: 'Steamed Chicken Dimsums', price: 149, desc: 'Minced chicken dumplings inside thin wrapper sheets with spicy chutney', isVeg: false },
      { name: 'Hot and Sour Soup cup', price: 99, desc: 'Thick spicy broth with mushrooms, bamboo shoots, and green onion', isVeg: true },
      { name: 'Crispy Spring Rolls plate', price: 129, desc: 'Deep fried rolls packed with shredded carrot and glass noodles', isVeg: true }
    ]
  },
  {
    name: 'South Spice',
    cuisine: ['South Indian', 'Beverages'],
    dishes: [
      { name: 'Butter Masala Dosa roll', price: 119, desc: 'Crispy rice crepe filled with potato masala and topped with butter', isVeg: true },
      { name: 'Steamed Idli Vada duo', price: 89, desc: 'Fluffy steamed rice cakes and crispy lentil donuts with sambar', isVeg: true },
      { name: 'Rava Onion Masala Dosa', price: 139, desc: 'Crispy semolina batter crepe with chopped onions and spiced potato', isVeg: true },
      { name: 'Classic Filter Coffee cup', price: 49, desc: 'Traditional froth milk hot coffee brewed inside brass filters', isVeg: true },
      { name: 'Mysore Masala Dosa roll', price: 129, desc: 'Crispy rice crepe lined with spicy red chili garlic chutney inside', isVeg: true },
      { name: 'Steamed Rava Upma bowl', price: 79, desc: 'Roasted semolina cooked with daily spices, green chili, and ghee', isVeg: true }
    ]
  },
  {
    name: 'Mumbai Street Food',
    cuisine: ['Street Food', 'Snacks'],
    dishes: [
      { name: 'Special Cheese Vada Pav', price: 49, desc: 'Batter fried potato dumpling in bread bun topped with grated cheese', isVeg: true },
      { name: 'Spicy Pav Bhaji platter', price: 129, desc: 'Mashed mix vegetable curry loaded with butter and served with soft bread', isVeg: true },
      { name: 'Dahi Puri Chaat plate', price: 79, desc: 'Crisp puffed puris filled with potatoes, sweet yogurt, and chutneys', isVeg: true },
      { name: 'Cutting Masala Chai glass', price: 39, desc: 'Hot ginger and cardamom infused milk tea served in small glass', isVeg: true },
      { name: 'Crunchy Bhel Puri chaat', price: 69, desc: 'Puffed rice mixed with sev, raw mango pieces, and sweet tamarind sauce', isVeg: true },
      { name: 'Spicy Sev Puri platter', price: 79, desc: 'Flat papdis topped with potatoes, spicy chutneys, and fine sev', isVeg: true }
    ]
  },
  {
    name: 'Royal Thali',
    cuisine: ['Rajasthani', 'Gujarati', 'North Indian'],
    dishes: [
      { name: 'Premium Maharaja Thali', price: 349, desc: 'Grand platter with 3 curries, dal baati churma, rice, rotis, and sweets', isVeg: true },
      { name: 'Dal Baati Churma classic', price: 219, desc: 'Traditional baked wheat balls soaked in pure ghee with spicy dal', isVeg: true },
      { name: 'Gujarati Kadhi Khichdi combo', price: 179, desc: 'Light yellow spiced lentil rice porridge served with sweet-sour curd curry', isVeg: true },
      { name: 'Marwari Gatte Ki Sabzi bowl', price: 189, desc: 'Gram flour rounds cooked in spicy yogurt gravy Rajasthani style', isVeg: true },
      { name: 'Traditional Ker Sangri Dry', price: 229, desc: 'Desert berries and beans cooked in mustard oil with dry spices', isVeg: true },
      { name: 'Choormae Laddoo Sweet duo', price: 99, desc: 'Crushed wheat sweetened rounds loaded with pure ghee and dry fruits', isVeg: true }
    ]
  },
  {
    name: 'Pasta Corner',
    cuisine: ['Pasta', 'Italian', 'Continental'],
    dishes: [
      { name: 'Creamy White Alfredo Pasta', price: 249, desc: 'Penne pasta tossed in rich cheese sauce with broccoli and bell peppers', isVeg: true },
      { name: 'Tangy Chicken Arrabiata Pasta', price: 289, desc: 'Spicy garlic red tomato sauce pasta topped with shredded chicken strips', isVeg: false },
      { name: 'Cheesy Baked Lasagna slice', price: 319, desc: 'Layered pasta sheets baked with cottage cheese, spinach, and marinara', isVeg: true },
      { name: 'Warm Garlic Bread slices', price: 89, desc: 'Toasted baguette slices topped with butter garlic paste and oregano', isVeg: true },
      { name: 'Creamy Pesto Penne bowl', price: 259, desc: 'Pasta tossed in fresh basil cashew pesto cream sauce with cheese', isVeg: true },
      { name: 'Baked Macaroni Cheese tray', price: 279, desc: 'Macaroni baked in creamy sharp cheddar cheese sauce with crust top', isVeg: true }
    ]
  },
  {
    name: 'Taco Fiesta',
    cuisine: ['Mexican', 'Fast Food'],
    dishes: [
      { name: 'Crispy Paneer Loaded Taco', price: 139, desc: 'Corn shell tacos with fried paneer, salsa, guacamole, and sour cream', isVeg: true },
      { name: 'Fiesta Chicken Rice Bowl', price: 249, desc: 'Herb rice topped with grilled chicken, black beans, corn, and pico de gallo', isVeg: false },
      { name: 'Crispy Cheesy Nachos platter', price: 159, desc: 'Corn chips drenched in hot cheese sauce with sliced jalapenos and beans', isVeg: true },
      { name: 'Spicy Black Bean Burrito', price: 199, desc: 'Soft tortilla rolled with spiced black beans, rice, cheese, and salsa', isVeg: true },
      { name: 'Loaded Cheese Quesadillas', price: 179, desc: 'Grilled flour tortilla packed with melted jack cheese and sweet corn', isVeg: true },
      { name: 'Churro Sticks with Caramel', price: 119, desc: 'Fried sweet dough sticks dusted with cinnamon sugar and caramel dip', isVeg: true }
    ]
  },
  {
    name: 'Sushi World',
    cuisine: ['Japanese', 'Asian'],
    dishes: [
      { name: 'Classic Veg California Roll', price: 399, desc: 'Rolled sushi sheets filled with avocado, cucumber, and pickled radish', isVeg: true },
      { name: 'Premium Salmon Uramaki Roll', price: 499, desc: 'Vinegared rice roll wrapped around fresh salmon cuts and cream cheese', isVeg: false },
      { name: 'Edamame Chilli Pods bowl', price: 199, desc: 'Steamed green soybean pods tossed with garlic flakes and spicy sea salt', isVeg: true },
      { name: 'Crispy Prawn Tempura Roll', price: 459, desc: 'Crispy batter fried prawns rolled with cucumber and spicy mayo sauce', isVeg: false },
      { name: 'Standard Pickled Ginger side', price: 49, desc: 'Sweet sliced pickled ginger root to cleanse palate between sushi rolls', isVeg: true },
      { name: 'Warm Miso Soup cup', price: 99, desc: 'Traditional Japanese soybean paste broth with tofu cubes and seaweed', isVeg: true }
    ]
  },
  {
    name: 'BBQ Nation',
    cuisine: ['Grill', 'North Indian'],
    dishes: [
      { name: 'Charred Tandoori Mushroom Tikka', price: 219, desc: 'Juicy mushroom caps marinated in spiced curd and grilled over coals', isVeg: true },
      { name: 'Zesty Malai Chicken Tikka', price: 279, desc: 'Boneless chicken cubes grilled with cashew cream and green cardamom', isVeg: false },
      { name: 'Smoky Fish Tikka skewers', price: 329, desc: 'Charred fish fillets marinated in mustard oil and lemon juice mix', isVeg: false },
      { name: 'Spicy Paneer Shashlik dry', price: 239, desc: 'Charred cottage cheese cubes skewered with onion and capsicum slices', isVeg: true },
      { name: 'Grilled Cinnamon Pineapple', price: 119, desc: 'Fresh pineapple slices brushed with honey cinnamon syrup and grilled', isVeg: true },
      { name: 'Charred BBQ Chicken Wings', price: 259, desc: 'Chicken wings glazed in smoky sweet barbecue sauce and grilled on grates', isVeg: false }
    ]
  },
  {
    name: 'Healthy Bowl',
    cuisine: ['Salads', 'Healthy Food'],
    dishes: [
      { name: 'Mediterranean Quinoa Salad', price: 189, desc: 'Fluffy quinoa mixed with cucumber, tomatoes, feta cheese, and olive oil', isVeg: true },
      { name: 'Avocado Green Toast slice', price: 149, desc: 'Toasted sourdough bread topped with mashed avocado and cherry tomatoes', isVeg: true },
      { name: 'Protein Chicken Salad bowl', price: 229, desc: 'Mixed greens, boiled eggs, grilled chicken breast, and low-fat lemon dressing', isVeg: false },
      { name: 'Classic Greek Olive Salad', price: 169, desc: 'Slices of cucumber, feta, bell pepper, and kalamata olives with herbs', isVeg: true },
      { name: 'Tofu Avocado Super Salad', price: 199, desc: 'Steamed tofu cubes tossed with salad leaves, avocado, and flax seeds', isVeg: true },
      { name: 'Fresh Pressed Orange Juice', price: 99, desc: 'Slow juiced fresh pulpy oranges served cold without added sugar', isVeg: true }
    ]
  },
  {
    name: 'Dessert Heaven',
    cuisine: ['Desserts', 'Bakery', 'Ice Cream'],
    dishes: [
      { name: 'Molten Choco Lava Cake', price: 99, desc: 'Soft chocolate cake with warm oozing dark chocolate sauce center', isVeg: true },
      { name: 'Red Velvet Pastry slice', price: 119, desc: 'Layers of moist red velvet cake crumbed with sweet cream cheese frosting', isVeg: true },
      { name: 'Sizzling Brownie Hot Fudge', price: 169, desc: 'Warm walnut brownie served with vanilla scoop on hot sizzling plate', isVeg: true },
      { name: 'Red Velvet Cupcake sweet', price: 59, desc: 'Mini red velvet cake topped with vanilla cream cheese frosting swirl', isVeg: true },
      { name: 'Blueberry Cheesecake slice', price: 149, desc: 'Crust biscuit base topped with cream cheese and sweet blueberry glaze', isVeg: true },
      { name: 'Classic Vanilla Scoop cup', price: 49, desc: 'Double scoop of premium Madagascar vanilla bean ice cream bowl', isVeg: true }
    ]
  },
  {
    name: 'Coffee Culture',
    cuisine: ['Coffee', 'Beverages', 'Bakery'],
    dishes: [
      { name: 'Classic Hot Cappuccino cup', price: 109, desc: 'Double espresso shot with steamed milk foam and cocoa dusting', isVeg: true },
      { name: 'Chilled Hazelnut Frappe glass', price: 149, desc: 'Blended cold espresso cream shake with sweet hazelnut syrup drizzle', isVeg: true },
      { name: 'Warm Cinnamon Roll pastry', price: 89, desc: 'Baked spiral sweet bread spiced with cinnamon powder and sugar glaze', isVeg: true },
      { name: 'Double Espresso Shot cup', price: 79, desc: 'Strong double extraction of roasted Arabica coffee beans shot', isVeg: true },
      { name: 'Vanilla Latte Hot cup', price: 129, desc: 'Espresso combined with steamed milk and sweet vanilla extract syrup', isVeg: true },
      { name: 'Buttery French Croissant', price: 99, desc: 'Flaky baked crescent shaped pastry made with premium butter fold sheets', isVeg: true }
    ]
  },
  {
    name: 'The Breakfast Club',
    cuisine: ['Breakfast', 'Continental'],
    dishes: [
      { name: 'Classic English Breakfast platter', price: 269, desc: 'Scrambled eggs, chicken sausages, baked beans, grilled tomatoes, and toast', isVeg: false },
      { name: 'Fluffy Maple Pancake trio', price: 159, desc: 'Stack of three sweet hot pancakes served with butter cube and maple syrup', isVeg: true },
      { name: 'Healthy Fruit Oatmeal bowl', price: 139, desc: 'Warm milk oats topped with sliced bananas, apples, honey, and chia seeds', isVeg: true },
      { name: 'Baked French Toast stack', price: 149, desc: 'Egg batter soaked bread baked golden and dusted with sugar powder', isVeg: false },
      { name: 'Crispy Pork Bacon strips', price: 189, desc: 'Pan fried smoked pork belly strips served crispy hot on plate', isVeg: false },
      { name: 'Fluffy Triple Egg Omelette', price: 119, desc: 'Whipped eggs cooked with chopped onions, green chili, and cheese fold', isVeg: false }
    ]
  },
  {
    name: 'Arabian Nights',
    cuisine: ['Middle Eastern', 'Arabian'],
    dishes: [
      { name: 'Classic Chicken Shawarma wrap', price: 149, desc: 'Shredded grilled chicken wrapped in pita bread with garlic mayo sauce', isVeg: false },
      { name: 'Creamy Hummus with Pita bread', price: 169, desc: 'Boiled chickpea and tahini olive paste dip, served with warm flatbreads', isVeg: true },
      { name: 'Crispy Falafel Salad wrap', price: 129, desc: 'Fried chickpea balls wrapped in flatbread with onions, lettuce, and tahini', isVeg: true },
      { name: 'Spicy Arabian Falafel plate', price: 139, desc: 'Fried chickpea patties served with garlic dip and pickled vegetables', isVeg: true },
      { name: 'Arabian Mutton Kabsa Rice', price: 379, desc: 'Fragrant spiced long grain rice cooked with tender mutton cuts', isVeg: false },
      { name: 'Fattoush Fresh Salad bowl', price: 119, desc: 'Mixed green salad dressed with sumac spice and toasted pita chips', isVeg: true }
    ]
  },
  {
    name: 'Seafood Express',
    cuisine: ['Seafood', 'Coastal'],
    dishes: [
      { name: 'Crispy Golden Rava Fry Prawns', price: 349, desc: 'Deep fried prawns coated with spiced semolina batter, Mangalorean style', isVeg: false },
      { name: 'Goan Fish Curry with Steamed Rice', price: 299, desc: 'Traditional coconut milk fish curry with aromatic spices and basmati rice', isVeg: false },
      { name: 'Goan Prawn Curry bowl', price: 319, desc: 'Prawns cooked in tangy coconut milk curry with red chilies and tamarind', isVeg: false },
      { name: 'Butter Garlic Grilled Lobster', price: 799, desc: 'Lobster tail meat grilled in clarified garlic butter paste sauce', isVeg: false },
      { name: 'Rava Fried Pomfret Fish', price: 399, desc: 'Whole pomfret fish marinated in red spices and semolina coated fried', isVeg: false },
      { name: 'Coastal Steamed Rice bowl', price: 59, desc: 'Plain boiled local rice best paired with coastal fish curry bowls', isVeg: true }
    ]
  },
  {
    name: 'Wrap Station',
    cuisine: ['Fast Food', 'Snacks'],
    dishes: [
      { name: 'Double Egg Double Chicken Wrap', price: 189, desc: 'Egg coated flatbread wrap packed with roasted chicken cubes and spices', isVeg: false },
      { name: 'Zesty Veg Aloo Wrap roll', price: 99, desc: 'Crispy potato roll wrap with sweet onion rings and spicy green chutney', isVeg: true },
      { name: 'Spicy Egg Roll flatwrap', price: 89, desc: 'Fried eggs on flatbread rolled with onion, lemon juice, and red chili', isVeg: false },
      { name: 'Tandoori Paneer Tikka Wrap', price: 179, desc: 'Charred paneer rolled inside flatbread with green mint yogurt spread', isVeg: true },
      { name: 'Crunchy Veg Salad wrap', price: 119, desc: 'Wrap packed with cucumber, tomato, sweet corn, cabbage, and eggless mayo', isVeg: true },
      { name: 'Chilled Sweet Lemon Ice Tea', price: 79, desc: 'Cold brewed tea served with lemon juice extract and honey syrup', isVeg: true }
    ]
  },
  {
    name: 'Italian Oven',
    cuisine: ['Italian', 'Continental'],
    dishes: [
      { name: 'Wild Mushroom Risotto bowl', price: 289, desc: 'Italian Arborio rice simmered in mushroom broth with parmesan cheese', isVeg: true },
      { name: 'Cheesy Chicken Calzone pocket', price: 249, desc: 'Folded pizza pocket stuffed with mozzarella, grilled chicken, and basil sauce', isVeg: false },
      { name: 'Margarita Flatbread slice', price: 179, desc: 'Baked flatbread pizza topped with slice tomatoes, basil, and cheese', isVeg: true },
      { name: 'Baked Chicken Lasagna tray', price: 329, desc: 'Baked layers of pasta sheets, chicken bolognese, and white sauce', isVeg: false },
      { name: 'Creamy Tiramisu Pastry slice', price: 149, desc: 'Traditional Italian coffee flavored dessert topped with cocoa powder', isVeg: true },
      { name: 'Warm Cream Tomato Soup cup', price: 99, desc: 'Creamy tomato soup flavored with fresh basil leaves and oil drops', isVeg: true }
    ]
  }
];

// Helper to generate coordinates around central Bangalore
function generateCoordinates(index) {
  const baseLat = 12.9716;
  const baseLng = 77.5946;
  const offsetLat = (index - 10) * 0.005;
  const offsetLng = ((index * index) % 10 - 5) * 0.005;
  return [baseLng + offsetLng, baseLat + offsetLat];
}

async function seed() {
  console.log('🏁 Commencing Module 13 Database Seeding...');
  await mongoose.connect(config.mongoUri);
  console.log('🔌 Connected to database.');

  console.log('🧹 Clearing old records...');
  await User.deleteMany({});
  await Restaurant.deleteMany({});
  await RestaurantImages.deleteMany({});
  await MenuCategory.deleteMany({});
  await MenuItem.deleteMany({});
  await Order.deleteMany({});
  await Review.deleteMany({});
  await Coupon.deleteMany({});
  await Wallet.deleteMany({});
  console.log('✅ Collections cleared.');

  console.log('👤 Creating System Admin...');
  const admin = await User.create({
    name: 'CraveGo Admin',
    email: 'admin@cravego.com',
    phone: '9000000000',
    password: 'password123',
    role: 'admin',
    isEmailVerified: true,
  });

  console.log('👤 Creating Demo Customers...');
  const customerEmails = ['customer@cravego.com', 'alice@cravego.com', 'bob@cravego.com', 'charlie@cravego.com'];
  const customers = [];
  for (let i = 0; i < customerEmails.length; i++) {
    const cust = await User.create({
      name: `Demo User ${i + 1}`,
      email: customerEmails[i],
      phone: `911111111${i}`,
      password: 'password123',
      role: 'customer',
      isEmailVerified: true,
    });
    await Wallet.create({ user: cust._id, balance: 2000 });
    customers.push(cust);
  }

  console.log('🚴 Creating 30 Delivery Partners...');
  const drivers = [];
  for (let i = 1; i <= 30; i++) {
    const driver = await User.create({
      name: `Delivery Partner ${i}`,
      email: i === 1 ? 'driver@cravego.com' : `driver${i}@cravego.com`,
      phone: `92222222${i.toString().padStart(2, '0')}`,
      password: 'password123',
      role: 'delivery_partner',
      isEmailVerified: true,
    });
    drivers.push(driver);
  }

  console.log('🏠 Creating 20 Restaurant Owners, Restaurants, and Menu Items...');
  let totalDishes = 0;
  const restaurantList = [];

  for (let i = 0; i < restaurantTemplates.length; i++) {
    const template = restaurantTemplates[i];
    
    const owner = await User.create({
      name: `Owner ${template.name}`,
      email: i === 0 ? 'owner@cravego.com' : `owner${i + 1}@cravego.com`,
      phone: `93333333${i.toString().padStart(2, '0')}`,
      password: 'password123',
      role: 'restaurant_owner',
      isEmailVerified: true,
    });

    const restCoords = generateCoordinates(i);
    // Find cover image based on cuisine match or default to Burgers banner
    const cuisineKey = template.cuisine.find(c => bannerImagesByCuisine[c]) || 'Burgers';
    const restBannerUrl = bannerImagesByCuisine[cuisineKey];

    const restaurant = await Restaurant.create({
      owner: owner._id,
      name: template.name,
      cuisine: template.cuisine,
      image: restBannerUrl,
      location: { type: 'Point', coordinates: restCoords },
      formattedAddress: `${10 + i * 2}, Park Avenue Street, Sector ${i + 1}, Bangalore`,
      gstNumber: `29ABCDE${1000 + i}F1Z5`,
      licenseNumber: `1234567890123${i}`,
      openingHours: { open: '08:00', close: '23:00' },
      deliveryCharge: i % 2 === 0 ? 30 : 40,
      deliveryRadiusKm: 8,
      rating: 4.0 + (i % 10) * 0.1,
      reviewCount: 30 + i * 5,
      isVerified: true,
      isActive: true,
    });
    restaurantList.push(restaurant);

    // Save corresponding RestaurantImages documents
    await RestaurantImages.create({
      restaurant: restaurant._id,
      url: restBannerUrl,
      publicId: `banners/rest_${i}_img`,
      imageType: 'banner',
      isPrimary: true
    });

    const catStarters = await MenuCategory.create({ restaurant: restaurant._id, name: 'Starters' });
    const catMains = await MenuCategory.create({ restaurant: restaurant._id, name: 'Main Course' });

    for (let d = 0; d < template.dishes.length; d++) {
      const dishTemplate = template.dishes[d];
      const isStarter = d < 2;
      const dishImageUrl = getDishImage(dishTemplate.name);

      await MenuItem.create({
        restaurant: restaurant._id,
        category: isStarter ? catStarters._id : catMains._id,
        name: dishTemplate.name,
        description: dishTemplate.desc,
        price: dishTemplate.price,
        image: dishImageUrl,
        isVeg: dishTemplate.isVeg,
        isAvailable: true,
        inventoryCount: 20,
        spiceLevel: d % 3 === 0 ? 'medium' : d % 3 === 1 ? 'spicy' : 'none',
        preparationTime: 15 + (d * 2),
        rating: 4.1 + (d % 8) * 0.1,
        calories: 200 + (d * 50),
        protein: 10 + d,
        fat: 8 + d,
        carbs: 25 + d * 5,
        variants: [
          { name: 'Regular Size', priceDelta: 0 },
          { name: 'Large Size', priceDelta: 50 },
        ],
        addOns: [
          { name: 'Extra Cheese', price: 30 },
          { name: 'Spicy Sauce dip', price: 15 },
        ],
      });
      totalDishes++;
    }
  }

  console.log('🏷️ Generating 30 Coupons & Offers...');
  const promoCodes = [
    { code: 'CRAVE50', discountType: 'flat', value: 50, desc: 'Flat ₹50 off on order' },
    { code: 'CRAVE100', discountType: 'flat', value: 100, desc: 'Flat ₹100 off on order' },
    { code: 'WELCOME150', discountType: 'flat', value: 150, desc: 'Flat ₹150 off on first order' },
    { code: 'FESTIVAL20', discountType: 'percentage', value: 20, desc: 'Get 20% off on festive specials' },
    { code: 'BOGO', discountType: 'percentage', value: 50, desc: 'Buy 1 get 50% discount on next item' },
  ];

  for (let c = 0; c < 30; c++) {
    const template = promoCodes[c % promoCodes.length];
    await Coupon.create({
      code: `${template.code}_${c}`,
      discountType: template.discountType,
      discountValue: template.value,
      maxDiscountAmount: template.discountType === 'percentage' ? 100 : template.value,
      minOrderValue: 200,
      description: template.desc,
      startDate: new Date(),
      endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      isActive: true,
    });
  }

  for (const template of promoCodes) {
    await Coupon.create({
      code: template.code,
      discountType: template.discountType,
      discountValue: template.value,
      maxDiscountAmount: template.discountType === 'percentage' ? 120 : template.value,
      minOrderValue: 150,
      description: template.desc,
      startDate: new Date(),
      endDate: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000),
      isActive: true,
    });
  }

  console.log('💬 Generating 500+ Customer Reviews & matching Orders...');
  let reviewCount = 0;
  let orderCount = 0;
  for (let idx = 0; idx < restaurantList.length; idx++) {
    const rest = restaurantList[idx];
    
    // Generate ~26 reviews and matching orders per restaurant (26 * 20 = 520 reviews)
    for (let r = 0; r < 26; r++) {
      const reviewer = customers[r % customers.length];
      const ratingVal = 3 + (r % 3);

      const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
      const rand = Math.floor(1000 + Math.random() * 9000);
      const orderNumber = `ORD-${dateStr}-${idx}-${r}-${rand}`;
      
      const order = await Order.create({
        orderNumber,
        customer: reviewer._id,
        restaurant: rest._id,
        status: 'delivered',
        deliveryAddress: {
          formattedAddress: '123 Test Street, Bangalore',
          location: { type: 'Point', coordinates: [77.5946, 12.9716] }
        },
        billing: {
          itemTotal: 250,
          taxGst: 13,
          deliveryCharge: 30,
          platformFee: 2,
          packingCharge: 10,
          grandTotal: 305
        },
        paymentMethod: 'wallet',
        paymentStatus: 'paid',
        actualDeliveryTime: new Date()
      });
      orderCount++;

      await Review.create({
        user: reviewer._id,
        restaurant: rest._id,
        order: order._id,
        rating: ratingVal,
        comment: `Excellent food and great service! Tried their special options and absolutely loved it. Highly recommended.`,
        isVerifiedPurchase: true,
      });
      reviewCount++;
    }
  }

  console.log('⏳ Waiting for background rating aggregation updates...');
  await new Promise(resolve => setTimeout(resolve, 5000));

  await mongoose.connection.close();
  console.log('\n======================================================');
  console.log('🎉 SEEDING RUN COMPLETED SUCCESSFULLY!');
  console.log(`👤 System Admins: 1`);
  console.log(`👤 Demo Customers: ${customers.length}`);
  console.log(`🚴 Delivery Partners: ${drivers.length}`);
  console.log(`🏠 Restaurant Owners: ${restaurantTemplates.length}`);
  console.log(`🏠 Restaurants Listed: ${restaurantList.length}`);
  console.log(`🍕 Menu Items Loaded: ${totalDishes}`);
  console.log(`🏷️ Promo Coupons Loaded: ${30 + promoCodes.length}`);
  console.log(`💬 Historical Orders: ${orderCount}`);
  console.log(`💬 Reviews Logged: ${reviewCount}`);
  console.log('======================================================\n');
  process.exit(0);
}

seed().catch(async (error) => {
  console.error('❌ Seeding run failed:', error);
  await mongoose.connection.close();
  process.exit(1);
});
