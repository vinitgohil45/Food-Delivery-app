import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useToast } from '../components/ui/Toast';
import {
  ShoppingCart,
  Trash2,
  ArrowRight,
  Tag,
  Receipt,
  Minus,
  Plus
} from 'lucide-react';
import api from '../services/api';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '../utils/cn';

const Cart = () => {
  const toast = useToast();
  const navigate = useNavigate();
  const [cartData, setCartData] = useState(null);
  const [couponCode, setCouponCode] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchCart = async () => {
    try {
      const response = await api.get('/cart');
      if (response.data?.success) {
        setCartData(response.data.data);
      }
    } catch (error) {
      toast.error('Failed to load shopping cart details');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCart();
  }, []);

  const handleUpdateQty = async (menuItem, newQty) => {
    if (newQty < 1) {
      handleRemoveItem(menuItem);
      return;
    }

    try {
      const response = await api.patch('/cart/item', { menuItem, quantity: newQty });
      if (response.data?.success) {
        fetchCart();
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update item quantity');
    }
  };

  const handleRemoveItem = async (menuItem) => {
    try {
      const response = await api.delete(`/cart/item?menuItem=${menuItem}`);
      if (response.data?.success) {
        toast.success('Item removed from cart');
        fetchCart();
      }
    } catch (error) {
      toast.error('Failed to remove item');
    }
  };

  const handleClearCart = async () => {
    if (!window.confirm('Are you sure you want to clear your cart?')) return;
    try {
      const response = await api.delete('/cart');
      if (response.data?.success) {
        toast.success('Cart cleared successfully');
        setCartData({ cart: null, items: [], totals: { subtotal: 0 } });
        setAppliedCoupon(null);
      }
    } catch (error) {
      toast.error('Failed to clear cart');
    }
  };

  const handleApplyCoupon = async (e) => {
    e.preventDefault();
    if (!couponCode.trim()) return;

    try {
      const response = await api.post('/cart/apply-coupon', { code: couponCode.trim() });
      if (response.data?.success) {
        setAppliedCoupon(response.data.data);
        toast.success('Coupon applied successfully!');
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to apply coupon');
    }
  };

  if (isLoading) {
    return (
      <div className="h-[65vh] flex flex-col items-center justify-center">
        <div className="relative overflow-hidden bg-slate-200/80 dark:bg-neutral-800/70 before:absolute before:inset-0 before:-translate-x-full before:animate-[shimmer_2s_infinite] before:bg-gradient-to-r before:from-transparent before:via-white/20 dark:before:via-white/5 before:to-transparent w-12 h-12 rounded-2xl" />
      </div>
    );
  }

  const items = cartData?.items || [];
  const subtotal = cartData?.totals?.subtotal || 0;
  const restaurant = cartData?.cart?.restaurant;

  const gst = Math.round(subtotal * 0.05);
  const platformFee = items.length > 0 ? 2 : 0;
  const packingCharge = items.length > 0 ? 10 : 0;
  const deliveryCharge = restaurant?.deliveryCharge || 0;
  const discount = appliedCoupon ? appliedCoupon.discountAmount : 0;
  const grandTotal = subtotal + gst + platformFee + packingCharge + deliveryCharge - discount;

  if (items.length === 0) {
    return (
      <motion.div 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="h-[65vh] flex flex-col items-center justify-center text-center gap-5 px-4"
      >
        <div className="h-20 w-20 bg-slate-100 dark:bg-white/5 rounded-[24px] flex items-center justify-center text-3xl shadow-premium border border-slate-200/40 dark:border-white/5">
          <ShoppingCart className="text-slate-400 dark:text-neutral-500 w-8 h-8" />
        </div>
        <h2 className="text-xl font-bold tracking-tight text-slate-800 dark:text-slate-100">
          Your Cart is Empty
        </h2>
        <p className="text-xs text-slate-400 dark:text-neutral-500 max-w-xs leading-relaxed font-semibold">
          Explore delicious cuisines and fill up your cart with local favorites.
        </p>
        <Link to="/">
          <Button variant="primary" className="px-7">Browse Restaurants</Button>
        </Link>
      </motion.div>
    );
  }

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="max-w-4xl mx-auto py-6 flex flex-col gap-7"
    >
      <div className="flex justify-between items-center border-b border-slate-100 dark:border-white/5 pb-6 select-none">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-slate-800 dark:text-slate-100">
            Shopping Cart
          </h1>
          <p className="text-xs text-slate-400 dark:text-neutral-500 font-semibold mt-0.5">Ordering from: <span className="font-extrabold text-slate-600 dark:text-slate-350">{restaurant?.name}</span></p>
        </div>
        <button
          onClick={handleClearCart}
          className="text-xs font-bold text-rose-500 hover:text-rose-600 transition-colors flex items-center gap-1 cursor-pointer"
        >
          <Trash2 className="w-3.5 h-3.5" /> Clear Cart
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Items List */}
        <div className="md:col-span-2 flex flex-col gap-4">
          <AnimatePresence initial={false}>
            {items.map((item) => (
              <motion.div
                key={item._id}
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="overflow-hidden"
              >
                <Card className="flex justify-between items-center gap-4 p-5 rounded-[24px]">
                  <div className="flex items-center gap-3">
                    <span className={cn(
                      "w-2.5 h-2.5 rounded-sm flex items-center justify-center border",
                      item.menuItem?.isVeg ? 'border-emerald-500' : 'border-rose-500'
                    )}>
                      <span className={cn(
                        "w-1.5 h-1.5 rounded-full",
                        item.menuItem?.isVeg ? 'bg-emerald-500' : 'bg-rose-500'
                      )} />
                    </span>
                    <div>
                      <h4 className="font-extrabold text-slate-800 dark:text-slate-100 text-sm tracking-tight">{item.menuItem?.name}</h4>
                      <span className="text-[10px] text-slate-450 dark:text-neutral-500 font-bold">₹{item.menuItem?.price}</span>
                      {item.selectedCustomizations.length > 0 && (
                        <p className="text-[10px] text-slate-400 dark:text-neutral-500 mt-1 font-semibold">
                          Add-ons: {item.selectedCustomizations.map(c => `${c.optionName} (+₹${c.price})`).join(', ')}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-3.5">
                    {/* Quantity adjuster */}
                    <div className="flex items-center gap-3 bg-slate-50 dark:bg-white/5 px-2.5 py-1.5 rounded-xl border border-slate-200/40 dark:border-white/5 select-none">
                      <button onClick={() => handleUpdateQty(item.menuItem?._id, item.quantity - 1)} className="font-bold text-slate-450 dark:text-neutral-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors px-1 cursor-pointer text-xs"><Minus className="w-3 h-3" /></button>
                      <span className="text-xs font-bold text-slate-800 dark:text-slate-150">{item.quantity}</span>
                      <button onClick={() => handleUpdateQty(item.menuItem?._id, item.quantity + 1)} className="font-bold text-slate-450 dark:text-neutral-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors px-1 cursor-pointer text-xs"><Plus className="w-3 h-3" /></button>
                    </div>
                    <button
                      onClick={() => handleRemoveItem(item.menuItem?._id)}
                      className="p-2 text-slate-405 hover:text-rose-500 hover:bg-rose-500/10 rounded-xl transition-all cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </Card>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        {/* Sidebar Summary */}
        <div className="flex flex-col gap-6">
          {/* Coupon form */}
          <form onSubmit={handleApplyCoupon} className="p-5 rounded-[24px] glass-card-premium border border-slate-200/50 dark:border-white/5 flex flex-col gap-3">
            <h3 className="font-bold text-[10px] text-brand-500 uppercase tracking-widest flex items-center gap-1.5 select-none">
              <Tag className="w-3.5 h-3.5" /> Apply Promo Code
            </h3>
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="PROMOCODE"
                value={couponCode}
                onChange={(e) => setCouponCode(e.target.value)}
                className="bg-white/50 dark:bg-white/5 border border-slate-200/70 dark:border-white/5 rounded-xl px-3.5 py-2.5 text-xs font-extrabold uppercase flex-1 placeholder-slate-400 dark:placeholder-neutral-500 focus:outline-none focus:border-brand-500/50 text-slate-850 dark:text-slate-100"
              />
              <button type="submit" className="bg-brand-500 text-white font-extrabold text-xs px-4 py-2.5 rounded-xl hover:bg-brand-600 transition-all cursor-pointer active:scale-95 shadow-md shadow-brand-500/10 select-none">
                Apply
              </button>
            </div>
            {appliedCoupon && (
              <p className="text-[10px] text-emerald-500 font-bold select-none">
                ✓ Coupon {appliedCoupon.code} applied! Saved ₹{appliedCoupon.discountAmount}
              </p>
            )}
          </form>

          {/* Bill summary card */}
          <div className="p-6 rounded-[24px] glass-card-premium border border-slate-200/50 dark:border-white/5 flex flex-col gap-4">
            <h3 className="font-bold text-[10px] text-brand-500 uppercase tracking-widest flex items-center gap-1.5 select-none">
              <Receipt className="w-3.5 h-3.5" /> Bill Breakdown
            </h3>
            
            <ul className="flex flex-col gap-2.5 text-xs text-slate-650 dark:text-slate-350 border-b border-slate-100 dark:border-white/5 pb-4 font-semibold">
              <li className="flex justify-between">
                <span>Items Subtotal:</span>
                <span>₹{subtotal}</span>
              </li>
              <li className="flex justify-between">
                <span>GST (5%):</span>
                <span>₹{gst}</span>
              </li>
              <li className="flex justify-between">
                <span>Platform Fee:</span>
                <span>₹{platformFee}</span>
              </li>
              <li className="flex justify-between">
                <span>Packaging Fee:</span>
                <span>₹{packingCharge}</span>
              </li>
              <li className="flex justify-between">
                <span>Delivery Charge:</span>
                <span>₹{deliveryCharge}</span>
              </li>
              {discount > 0 && (
                <li className="flex justify-between text-emerald-500 font-bold">
                  <span>Coupon Discount:</span>
                  <span>-₹{discount}</span>
                </li>
              )}
            </ul>

            <div className="flex justify-between items-center font-extrabold text-slate-800 dark:text-slate-100 text-sm py-1">
              <span>Grand Total:</span>
              <span>₹{grandTotal}</span>
            </div>

            <Link to="/checkout">
              <Button className="w-full mt-2" icon={<ArrowRight className="w-4 h-4" />}>
                Proceed to Checkout
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default Cart;
