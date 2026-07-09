import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '../components/ui/Toast';
import {
  MapPin,
  Wallet,
  CreditCard,
  Coins,
  CheckCircle2,
  Plus
} from 'lucide-react';
import api from '../services/api';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';
import Input from '../components/ui/Input';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '../utils/cn';

const Checkout = () => {
  const toast = useToast();
  const navigate = useNavigate();
  const [addresses, setAddresses] = useState([]);
  const [selectedAddrId, setSelectedAddrId] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('cod');
  const [driverTip, setDriverTip] = useState(0);
  const [cartData, setCartData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isPlacingOrder, setIsPlacingOrder] = useState(false);

  // Add Address Form inline state
  const [showAddAddress, setShowAddAddress] = useState(false);
  const [houseFlatNo, setHouseFlatNo] = useState('');
  const [formattedAddress, setFormattedAddress] = useState('');
  const [landmark, setLandmark] = useState('');
  const [isSavingAddress, setIsSavingAddress] = useState(false);

  const fetchAddresses = async () => {
    try {
      const response = await api.get('/addresses');
      if (response.data?.success) {
        setAddresses(response.data.data);
        if (response.data.data.length > 0) {
          setSelectedAddrId(response.data.data[0]._id);
        }
      }
    } catch (e) {
      toast.error('Failed to load saved addresses');
    }
  };

  const fetchCartAndSummary = async () => {
    try {
      const response = await api.get('/cart');
      if (response.data?.success) {
        setCartData(response.data.data);
      }
    } catch (e) {
      toast.error('Failed to load cart totals');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAddresses();
    fetchCartAndSummary();
  }, []);

  const handleAddAddress = async (e) => {
    e.preventDefault();
    if (!houseFlatNo.trim() || !formattedAddress.trim()) {
      toast.error('Please fill in required address fields');
      return;
    }

    setIsSavingAddress(true);
    try {
      const response = await api.post('/addresses', {
        houseFlatNo: houseFlatNo.trim(),
        formattedAddress: formattedAddress.trim(),
        landmark: landmark.trim(),
        addressType: 'home',
      });
      if (response.data?.success) {
        toast.success('Address saved successfully!');
        setHouseFlatNo('');
        setFormattedAddress('');
        setLandmark('');
        setShowAddAddress(false);
        fetchAddresses();
      }
    } catch (error) {
      toast.error('Failed to save new address');
    } finally {
      setIsSavingAddress(false);
    }
  };

  const handlePlaceOrder = async () => {
    if (!selectedAddrId) {
      toast.error('Please select a delivery address');
      return;
    }

    setIsPlacingOrder(true);
    try {
      const response = await api.post('/checkout', {
        addressId: selectedAddrId,
        paymentMethod,
        driverTip,
      });

      if (response.data?.success) {
        toast.success('🎉 Order placed successfully! Directing you to tracker...');
        navigate('/profile');
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to place order');
    } finally {
      setIsPlacingOrder(false);
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
  const grandTotal = subtotal + gst + platformFee + packingCharge + deliveryCharge + driverTip;

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="max-w-4xl mx-auto py-6 flex flex-col gap-7"
    >
      <h1 className="text-2xl font-black tracking-tight text-slate-800 dark:text-slate-100 border-b border-slate-100 dark:border-white/5 pb-6 select-none">
        Checkout Checkout
      </h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Address & Payment Columns */}
        <div className="md:col-span-2 flex flex-col gap-6">
          {/* Address Section */}
          <div className="p-6 rounded-[24px] glass-card-premium border border-slate-200/50 dark:border-white/5 flex flex-col gap-4 shadow-xl">
            <div className="flex justify-between items-center select-none">
              <h3 className="font-bold text-[10px] text-brand-500 uppercase tracking-widest flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5" /> Delivery Address
              </h3>
              <button
                onClick={() => setShowAddAddress(!showAddAddress)}
                className="text-xs font-bold text-brand-500 hover:text-brand-600 transition-colors flex items-center gap-0.5 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" /> Add New
              </button>
            </div>

            {showAddAddress ? (
              <form onSubmit={handleAddAddress} className="flex flex-col gap-3.5 p-5 bg-slate-50 dark:bg-white/5 rounded-2xl border border-slate-200/40 dark:border-white/5">
                <Input label="Flat/House/Office No." value={houseFlatNo} onChange={(e) => setHouseFlatNo(e.target.value)} required />
                <Input label="Complete Address" placeholder="e.g. Indiranagar Metro Lane 4" value={formattedAddress} onChange={(e) => setFormattedAddress(e.target.value)} required />
                <Input label="Landmark (Optional)" value={landmark} onChange={(e) => setLandmark(e.target.value)} />
                <div className="flex justify-end gap-2.5 mt-2">
                  <Button type="button" variant="outline" size="sm" onClick={() => setShowAddAddress(false)}>Cancel</Button>
                  <Button type="submit" size="sm" isLoading={isSavingAddress}>Save Address</Button>
                </div>
              </form>
            ) : addresses.length === 0 ? (
              <p className="text-xs text-slate-400 dark:text-neutral-500 text-center py-4 font-semibold select-none">No saved addresses found. Add one above to proceed.</p>
            ) : (
              <div className="flex flex-col gap-3">
                {addresses.map((addr) => (
                  <div
                    key={addr._id}
                    onClick={() => setSelectedAddrId(addr._id)}
                    className={cn(
                      "p-4.5 rounded-2xl border cursor-pointer transition-all flex justify-between items-center select-none active:scale-98",
                      selectedAddrId === addr._id
                        ? "border-brand-500 bg-brand-500/5 dark:bg-brand-500/10"
                        : "border-slate-200/50 dark:border-white/5 bg-white/40 dark:bg-white/5 hover:border-slate-300/60 dark:hover:border-white/10"
                    )}
                  >
                    <div>
                      <h4 className="font-extrabold text-[10px] uppercase tracking-widest text-slate-700 dark:text-slate-300">{addr.addressType}</h4>
                      <p className="text-[11px] font-semibold text-slate-400 dark:text-neutral-500 mt-1">
                        {addr.houseFlatNo}, {addr.formattedAddress}
                      </p>
                    </div>
                    {selectedAddrId === addr._id && <CheckCircle2 className="w-5 h-5 text-brand-500" />}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Payment Section */}
          <div className="p-6 rounded-[24px] glass-card-premium border border-slate-200/50 dark:border-white/5 flex flex-col gap-4 shadow-xl">
            <h3 className="font-bold text-[10px] text-brand-500 uppercase tracking-widest flex items-center gap-1.5 select-none">
              <Wallet className="w-3.5 h-3.5" /> Choose Payment Mode
            </h3>
            
            <div className="grid grid-cols-2 gap-4">
              <button
                onClick={() => setPaymentMethod('cod')}
                className={cn(
                  "p-5 rounded-2xl border flex flex-col items-center gap-2.5 text-xs font-bold transition-all cursor-pointer select-none active:scale-95",
                  paymentMethod === 'cod' 
                    ? "border-brand-500 bg-brand-500/5 dark:bg-brand-500/10 text-brand-500" 
                    : "border-slate-200/60 dark:border-white/5 hover:bg-slate-100/50 dark:hover:bg-white/5 text-slate-650 dark:text-slate-350"
                )}
              >
                <Coins className="w-6 h-6" /> Cash on Delivery
              </button>
              <button
                onClick={() => setPaymentMethod('wallet')}
                className={cn(
                  "p-5 rounded-2xl border flex flex-col items-center gap-2.5 text-xs font-bold transition-all cursor-pointer select-none active:scale-95",
                  paymentMethod === 'wallet' 
                    ? "border-brand-500 bg-brand-500/5 dark:bg-brand-500/10 text-brand-500" 
                    : "border-slate-200/60 dark:border-white/5 hover:bg-slate-100/50 dark:hover:bg-white/5 text-slate-650 dark:text-slate-350"
                )}
              >
                <Wallet className="w-6 h-6" /> Wallet Balance
              </button>
            </div>
          </div>
        </div>

        {/* Sidebar Bill Summary & Place Order */}
        <div className="p-6 rounded-[24px] glass-card-premium border border-slate-200/50 dark:border-white/5 flex flex-col gap-4.5 h-fit shadow-xl">
          <h3 className="font-bold text-[10px] text-brand-500 uppercase tracking-widest select-none">Order Summary</h3>
          
          {/* Driver Tip Select */}
          <div className="flex flex-col gap-2 select-none">
            <label className="text-[9px] font-bold text-slate-400 dark:text-neutral-500 uppercase tracking-widest">Add Driver Tip</label>
            <div className="grid grid-cols-4 gap-2">
              {[0, 20, 30, 50].map((tip) => (
                <button
                  key={tip}
                  onClick={() => setDriverTip(tip)}
                  className={cn(
                    "py-2 border rounded-xl text-xs font-extrabold transition-all cursor-pointer select-none active:scale-90",
                    driverTip === tip 
                      ? "border-brand-500 bg-brand-500/5 dark:bg-brand-500/10 text-brand-500" 
                      : "border-slate-200/60 dark:border-white/5 hover:bg-slate-100/50 dark:hover:bg-white/5 text-slate-650 dark:text-slate-350"
                  )}
                >
                  {tip === 0 ? 'None' : `₹${tip}`}
                </button>
              ))}
            </div>
          </div>

          <ul className="flex flex-col gap-2.5 text-xs text-slate-650 dark:text-slate-350 border-b border-slate-100 dark:border-white/5 pb-4.5 mt-2 font-semibold">
            <li className="flex justify-between">
              <span>Items Total:</span>
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
            {driverTip > 0 && (
              <li className="flex justify-between">
                <span>Driver Tip:</span>
                <span>₹{driverTip}</span>
              </li>
            )}
          </ul>

          <div className="flex justify-between items-center font-extrabold text-slate-800 dark:text-slate-100 text-sm">
            <span>Grand Total:</span>
            <span>₹{grandTotal}</span>
          </div>

          <Button onClick={handlePlaceOrder} isLoading={isPlacingOrder} className="w-full mt-2 select-none">
            Confirm and Place Order
          </Button>
        </div>
      </div>
    </motion.div>
  );
};

export default Checkout;
