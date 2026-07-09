import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useToast } from '../components/ui/Toast';
import {
  Star,
  Clock,
  MapPin,
  Plus,
  ShoppingCart,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../services/api';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import FrequentlyBoughtTogether from '../components/home/FrequentlyBoughtTogether';
import { cn } from '../utils/cn';

const RestaurantDetails = () => {
  const { id } = useParams();
  const toast = useToast();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [menuItems, setMenuItems] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // Customizations modal state
  const [customizingItem, setCustomizingItem] = useState(null);
  const [selectedVariant, setSelectedVariant] = useState(null);
  const [selectedAddOns, setSelectedAddOns] = useState([]);
  const [isAddingToCart, setIsAddingToCart] = useState(false);

  useEffect(() => {
    const fetchDetails = async () => {
      try {
        const [restRes, menuRes] = await Promise.all([
          api.get(`/restaurants/${id}`),
          api.get(`/menu?restaurant=${id}`)
        ]);

        if (restRes.data?.success) setData(restRes.data.data);
        if (menuRes.data?.success) {
          const itemsList = menuRes.data.data?.items || menuRes.data.data?.menuItems || menuRes.data.data;
          setMenuItems(Array.isArray(itemsList) ? itemsList : []);
        }
        
        // Log browse view to database
        api.post('/recommendations/recently-viewed', { restaurantId: id }).catch(() => {});
      } catch (error) {
        toast.error('Failed to load restaurant details and menu');
      } finally {
        setIsLoading(false);
      }
    };
    fetchDetails();
  }, [id]);

  const handleAddClick = (item) => {
    // If item has variants or add-ons, open custom modal
    if ((item.variants && item.variants.length > 0) || (item.addOns && item.addOns.length > 0)) {
      setCustomizingItem(item);
      setSelectedVariant(item.variants?.[0] || null);
      setSelectedAddOns([]);
    } else {
      addToCartDirect(item, null, []);
    }
  };

  const addToCartDirect = async (item, variant, addOns) => {
    setIsAddingToCart(true);
    try {
      // Build selected customizations array
      const selectedCustomizations = [];
      if (variant) {
        selectedCustomizations.push({
          groupName: 'Size',
          optionName: variant.name,
          price: variant.priceDelta || 0
        });
      }
      addOns.forEach(add => {
        selectedCustomizations.push({
          groupName: 'Add-on',
          optionName: add.name,
          price: add.price || 0
        });
      });

      const response = await api.post('/cart/add', {
        menuItem: item._id,
        quantity: 1,
        selectedCustomizations
      });

      if (response.data?.success) {
        toast.success(`Added ${item.name} to cart!`);
        setCustomizingItem(null);
      }
    } catch (error) {
      const msg = error.response?.data?.message || 'Failed to add item to cart';
      if (msg.includes('different restaurant')) {
        // Option to reset cart
        if (window.confirm('Your cart contains items from another restaurant. Discard cart and add this item?')) {
          try {
            await api.delete('/cart/clear');
            // Retry add
            await addToCartDirect(item, variant, addOns);
          } catch (e) {
            toast.error('Failed to reset cart. Try again.');
          }
        }
      } else {
        toast.error(msg);
      }
    } finally {
      setIsAddingToCart(false);
    }
  };

  const toggleAddOn = (addOn) => {
    setSelectedAddOns(prev => {
      const exists = prev.find(a => a.name === addOn.name);
      if (exists) {
        return prev.filter(a => a.name !== addOn.name);
      } else {
        return [...prev, addOn];
      }
    });
  };

  if (isLoading) {
    return (
      <div className="flex flex-col gap-8 max-w-5xl mx-auto py-8">
        <div className="h-[250px] w-full rounded-[24px] bg-slate-200 dark:bg-neutral-800 animate-pulse" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="md:col-span-2 flex flex-col gap-6">
            <div className="h-10 bg-slate-200 dark:bg-neutral-800 rounded-xl w-1/3 animate-pulse" />
            {[1, 2, 3].map(i => (
              <div key={i} className="h-28 bg-slate-200 dark:bg-neutral-800 rounded-[24px] animate-pulse" />
            ))}
          </div>
          <div className="h-[300px] bg-slate-200 dark:bg-neutral-800 rounded-[24px] animate-pulse" />
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="h-[60vh] flex flex-col items-center justify-center text-center">
        <h2 className="text-xl font-bold mb-2">Restaurant Not Found</h2>
        <Link to="/" className="text-brand-500 font-bold hover:underline">Back to Home</Link>
      </div>
    );
  }

  const restaurant = data;

  // Group menu items by category name safely
  const groupedMenu = menuItems.reduce((acc, item) => {
    const catName = item.category?.name || 'Main Course';
    if (!acc[catName]) acc[catName] = [];
    acc[catName].push(item);
    return acc;
  }, {});

  return (
    <div className="flex flex-col gap-8 pb-12">
      {/* Banner */}
      <div className="relative h-[220px] sm:h-[320px] w-full rounded-[32px] overflow-hidden shadow-xl bg-slate-100 dark:bg-neutral-800">
        {restaurant?.image ? (
          <img src={restaurant.image} alt={restaurant.name} className="w-full h-full object-cover" loading="lazy" />
        ) : (
          <div className="w-full h-full flex items-center justify-center"><span className="text-6xl select-none">🍳</span></div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/35 to-transparent pointer-events-none" />
        
        {/* Info overlay */}
        <div className="absolute bottom-6 left-6 right-6 text-white flex flex-col gap-2">
          <div className="flex flex-wrap gap-2">
            {restaurant?.cuisine?.map((c) => (
              <span key={c} className="text-[9px] font-extrabold px-2.5 py-0.5 bg-white/20 backdrop-blur-md rounded-full select-none uppercase tracking-wide">
                {c}
              </span>
            ))}
          </div>
          <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight select-none">{restaurant?.name}</h1>
          <p className="text-xs text-slate-350 flex items-center gap-1 font-medium">
            <MapPin className="w-3.5 h-3.5 text-slate-400" /> {restaurant?.formattedAddress}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Main Details and Menu */}
        <div className="md:col-span-2 flex flex-col gap-8">
          {/* Metrics */}
          <div className="grid grid-cols-3 gap-4 text-center">
            <div className="p-4 rounded-2xl glass-card-premium border border-slate-200/50 dark:border-white/5 flex flex-col items-center gap-1 select-none">
              <span className="flex items-center gap-1 text-amber-500 font-black text-base">
                <Star className="w-4 h-4 fill-amber-500 text-amber-500" /> {restaurant?.averageRating ? restaurant.averageRating.toFixed(1) : '4.5'}
              </span>
              <span className="text-[9px] text-slate-400 dark:text-neutral-500 font-extrabold uppercase tracking-wider">{restaurant?.totalReviews || 0} Reviews</span>
            </div>
            <div className="p-4 rounded-2xl glass-card-premium border border-slate-200/50 dark:border-white/5 flex flex-col items-center gap-1 select-none">
              <span className="flex items-center gap-1 text-brand-500 font-black text-base">
                <Clock className="w-4 h-4 text-brand-500" /> {restaurant?.averagePreparationTimeMin || '30'}m
              </span>
              <span className="text-[9px] text-slate-400 dark:text-neutral-500 font-extrabold uppercase tracking-wider">Prep Time</span>
            </div>
            <div className="p-4 rounded-2xl glass-card-premium border border-slate-200/50 dark:border-white/5 flex flex-col items-center gap-1 select-none">
              <span className="flex items-center gap-1 text-emerald-500 font-black text-base">
                ₹{restaurant?.deliveryCharge || 0}
              </span>
              <span className="text-[9px] text-slate-400 dark:text-neutral-500 font-extrabold uppercase tracking-wider">Delivery Fee</span>
            </div>
          </div>

          {/* Menu Sections */}
          <div className="flex flex-col gap-8">
            <h2 className="text-xl font-black tracking-tight text-slate-800 dark:text-slate-100 flex items-center gap-2 select-none">
              <ShoppingCart className="text-brand-500 w-5 h-5" /> Menu Catalog
            </h2>

            {Object.keys(groupedMenu).map((catName) => (
              <div key={catName} className="flex flex-col gap-4">
                <h3 className="font-extrabold text-xs text-brand-500 uppercase tracking-widest border-b border-slate-100 dark:border-white/5 pb-2 select-none">
                  {catName}
                </h3>
                
                <div className="flex flex-col gap-4">
                  {groupedMenu[catName].map((item) => (
                    <Card key={item._id} className="flex justify-between items-center gap-6 p-5 rounded-[24px]">
                      <div className="flex-1 flex flex-col gap-1.5">
                        <div className="flex items-center gap-2">
                          <span className={cn("h-2 w-2 rounded-full", item.isVeg ? 'bg-emerald-500' : 'bg-rose-500')} title={item.isVeg ? 'Veg' : 'Non-Veg'} />
                          <h4 className="font-extrabold text-slate-800 dark:text-slate-100 text-sm tracking-tight">{item.name}</h4>
                        </div>
                        <p className="text-[11px] text-slate-400 dark:text-neutral-500 leading-relaxed max-w-md font-semibold">{item.description}</p>
                        <span className="font-extrabold text-xs text-slate-800 dark:text-slate-200 mt-1">₹{item.price}</span>
                      </div>

                      <div className="flex flex-col items-center gap-2.5 flex-shrink-0">
                        {item.image && (
                          <div className="w-20 h-20 rounded-2xl overflow-hidden bg-slate-100 dark:bg-neutral-850 border border-slate-200/30 dark:border-white/5">
                            <img src={item.image} alt={item.name} className="w-full h-full object-cover" loading="lazy" />
                          </div>
                        )}
                        <Button variant="primary" size="sm" icon={<Plus className="w-3.5 h-3.5" />} onClick={() => handleAddClick(item)} className="px-5">
                          Add
                        </Button>
                      </div>
                    </Card>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Sidebar Info */}
        <div className="flex flex-col gap-6">
          {/* Frequently Bought Together recommendations */}
          {menuItems.length > 0 && (
            <FrequentlyBoughtTogether menuItemId={menuItems[0]._id} />
          )}

          <div className="p-6 rounded-[24px] glass-card-premium border border-slate-200/50 dark:border-white/5 shadow-premium flex flex-col gap-4">
            <h3 className="font-extrabold text-xs text-brand-500 uppercase tracking-wider select-none">Store Information</h3>
            <ul className="flex flex-col gap-3.5 text-xs text-slate-600 dark:text-slate-300 font-semibold">
              <li className="flex justify-between">
                <span className="text-slate-400 dark:text-neutral-500 font-bold uppercase tracking-wider text-[10px]">Opening Hours</span>
                <span>
                  {restaurant?.openingHours?.open || '08:00'} - {restaurant?.openingHours?.close || '23:00'}
                </span>
              </li>
              <li className="flex justify-between">
                <span className="text-slate-400 dark:text-neutral-500 font-bold uppercase tracking-wider text-[10px]">Delivery Radius</span>
                <span>{restaurant?.deliveryRadiusKm || 5} Km</span>
              </li>
              <li className="flex justify-between">
                <span className="text-slate-400 dark:text-neutral-500 font-bold uppercase tracking-wider text-[10px]">GST Number</span>
                <span className="font-mono">{restaurant?.gstNumber || 'N/A'}</span>
              </li>
              <li className="flex justify-between">
                <span className="text-slate-400 dark:text-neutral-500 font-bold uppercase tracking-wider text-[10px]">FSSAI License</span>
                <span className="font-mono">{restaurant?.licenseNumber || 'N/A'}</span>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Customizations Modal */}
      <AnimatePresence>
        {customizingItem && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="max-w-md w-full p-6 rounded-[24px] bg-white dark:bg-[#0c0c14] border border-slate-200/50 dark:border-white/5 flex flex-col gap-5.5 shadow-2xl relative"
            >
              <div>
                <h3 className="font-extrabold text-base text-slate-800 dark:text-slate-100 tracking-tight">Customize "{customizingItem.name}"</h3>
                <p className="text-[10px] font-semibold text-slate-400 dark:text-neutral-500 mt-1 select-none">Select size and optional toppings below.</p>
              </div>

              {/* Variants */}
              {customizingItem.variants && customizingItem.variants.length > 0 && (
                <div className="flex flex-col gap-2">
                  <span className="text-[10px] font-bold text-slate-400 dark:text-neutral-500 uppercase tracking-widest select-none">Size Options</span>
                  <div className="flex flex-col gap-1.5">
                    {customizingItem.variants.map((v) => (
                      <label key={v.name} className="flex justify-between items-center p-3 rounded-2xl border border-slate-100 dark:border-white/5 cursor-pointer hover:bg-slate-50 dark:hover:bg-white/5 text-xs select-none">
                        <div className="flex items-center gap-2.5 font-bold text-slate-700 dark:text-slate-200">
                          <input
                            type="radio"
                            name="variant"
                            checked={selectedVariant?.name === v.name}
                            onChange={() => setSelectedVariant(v)}
                            className="text-brand-500 focus:ring-brand-500 focus:ring-offset-0 w-4 h-4 cursor-pointer"
                          />
                          <span>{v.name}</span>
                        </div>
                        <span className="font-extrabold text-slate-500 dark:text-neutral-400">+₹{v.priceDelta}</span>
                      </label>
                    ))}
                  </div>
                </div>
              )}

              {/* Add-ons */}
              {customizingItem.addOns && customizingItem.addOns.length > 0 && (
                <div className="flex flex-col gap-2">
                  <span className="text-[10px] font-bold text-slate-400 dark:text-neutral-500 uppercase tracking-widest select-none">Add-ons (Optional)</span>
                  <div className="flex flex-col gap-1.5">
                    {customizingItem.addOns.map((add) => {
                      const isChecked = !!selectedAddOns.find(a => a.name === add.name);
                      return (
                        <label key={add.name} className="flex justify-between items-center p-3 rounded-2xl border border-slate-100 dark:border-white/5 cursor-pointer hover:bg-slate-50 dark:hover:bg-white/5 text-xs select-none">
                          <div className="flex items-center gap-2.5 font-bold text-slate-700 dark:text-slate-200">
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={() => toggleAddOn(add)}
                              className="rounded text-brand-500 focus:ring-brand-500 focus:ring-offset-0 w-4 h-4 cursor-pointer"
                            />
                            <span>{add.name}</span>
                          </div>
                          <span className="font-extrabold text-slate-500 dark:text-neutral-400">+₹{add.price}</span>
                        </label>
                      );
                    })}
                  </div>
                </div>
              )}

              <div className="flex justify-end gap-3.5 border-t border-slate-100 dark:border-white/5 pt-4.5">
                <Button variant="outline" size="sm" onClick={() => setCustomizingItem(null)}>Cancel</Button>
                <Button size="sm" isLoading={isAddingToCart} onClick={() => addToCartDirect(customizingItem, selectedVariant, selectedAddOns)}>
                  Add to Basket
                </Button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default RestaurantDetails;
