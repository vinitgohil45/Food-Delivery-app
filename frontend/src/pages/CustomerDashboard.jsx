import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../components/ui/Toast';
import {
  User,
  Wallet,
  MapPin,
  Clock,
  Plus,
  FileText
} from 'lucide-react';
import api from '../services/api';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import { motion } from 'framer-motion';
import { cn } from '../utils/cn';

const CustomerDashboard = () => {
  const { user } = useAuth();
  const toast = useToast();
  const [wallet, setWallet] = useState({ balance: 0, transactions: [] });
  const [addresses, setAddresses] = useState([]);
  const [orders, setOrders] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchDashboardData = async () => {
    try {
      const [walletRes, addressRes, ordersRes] = await Promise.all([
        api.get('/wallet'),
        api.get('/addresses'),
        api.get('/orders'),
      ]);

      if (walletRes.data?.success) setWallet(walletRes.data.data);
      if (addressRes.data?.success) setAddresses(addressRes.data.data);
      if (ordersRes.data?.success) setOrders(ordersRes.data.data.orders);
    } catch (error) {
      toast.error('Failed to load profile summary details');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const handleDeposit = async () => {
    const amountStr = window.prompt('Enter amount to deposit (₹):', '500');
    if (amountStr === null) return;
    const amount = parseFloat(amountStr);
    if (isNaN(amount) || amount <= 0) {
      toast.error('Please enter a valid positive amount');
      return;
    }

    try {
      const response = await api.post('/wallet/deposit', { amount });
      if (response.data?.success) {
        toast.success(`Successfully deposited ₹${amount}!`);
        fetchDashboardData();
      }
    } catch (e) {
      toast.error('Deposit failed');
    }
  };

  const handleOpenInvoice = (orderId) => {
    window.open(`/api/v1/orders/invoice/${orderId}`, '_blank');
  };

  if (isLoading) {
    return (
      <div className="h-[65vh] flex flex-col items-center justify-center">
        <div className="relative overflow-hidden bg-slate-200/80 dark:bg-neutral-800/70 before:absolute before:inset-0 before:-translate-x-full before:animate-[shimmer_2s_infinite] before:bg-gradient-to-r before:from-transparent before:via-white/20 dark:before:via-white/5 before:to-transparent w-12 h-12 rounded-2xl" />
      </div>
    );
  }

  const activeOrders = orders.filter(o => !['delivered', 'cancelled'].includes(o.status));

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="flex flex-col gap-8 max-w-4xl mx-auto py-6"
    >
      {/* Profile Header */}
      <div className="flex items-center gap-4 border-b border-slate-100 dark:border-white/5 pb-6 select-none">
        <div className="h-16 w-16 rounded-[24px] bg-brand-500/10 text-brand-500 flex items-center justify-center text-3xl shadow-premium">
          <User className="w-7 h-7 text-brand-500" />
        </div>
        <div>
          <h1 className="text-2xl font-black text-slate-800 dark:text-slate-100 tracking-tight">{user?.name}</h1>
          <p className="text-xs text-slate-450 dark:text-neutral-500 uppercase tracking-widest font-extrabold mt-0.5">{user?.role} Dashboard</p>
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 select-none">
        <div className="p-6 rounded-[24px] glass-card-premium border border-slate-200/50 dark:border-white/5 shadow-xl flex flex-col gap-2 relative">
          <Wallet className="w-6 h-6 text-emerald-500" />
          <span className="text-slate-400 dark:text-neutral-550 text-xs font-bold uppercase tracking-wider">Wallet Balance</span>
          <span className="text-2xl font-black text-slate-850 dark:text-slate-100 tracking-tight">₹{wallet.balance}</span>
          <button
            onClick={handleDeposit}
            className="absolute top-6 right-6 p-2 bg-emerald-500/10 hover:bg-emerald-500/25 text-emerald-600 rounded-xl transition-all cursor-pointer active:scale-90"
            title="Deposit Funds"
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>

        <div className="p-6 rounded-[24px] glass-card-premium border border-slate-200/50 dark:border-white/5 shadow-xl flex flex-col gap-2">
          <MapPin className="w-6 h-6 text-blue-500" />
          <span className="text-slate-400 dark:text-neutral-555 text-xs font-bold uppercase tracking-wider">Saved Addresses</span>
          <span className="text-2xl font-black text-slate-850 dark:text-slate-100 tracking-tight">{addresses.length} Locations</span>
        </div>

        <div className="p-6 rounded-[24px] glass-card-premium border border-slate-200/50 dark:border-white/5 shadow-xl flex flex-col gap-2">
          <Clock className="w-6 h-6 text-amber-500" />
          <span className="text-slate-400 dark:text-neutral-555 text-xs font-bold uppercase tracking-wider">Active Orders</span>
          <span className="text-2xl font-black text-slate-855 dark:text-slate-100 tracking-tight">
            {activeOrders.length > 0 ? `${activeOrders.length} Active` : 'None'}
          </span>
        </div>
      </div>

      {/* Orders History List inside dashboard */}
      <div className="flex flex-col gap-4">
        <h2 className="text-lg font-black tracking-tight text-slate-805 dark:text-slate-100 select-none">Recent Orders</h2>
        
        {orders.length === 0 ? (
          <p className="text-xs text-slate-400 dark:text-neutral-550 text-center py-8 font-semibold select-none">No recent orders placed.</p>
        ) : (
          <div className="flex flex-col gap-4">
            {orders.map((order) => (
              <Card key={order._id} className="flex justify-between items-center gap-4 p-5 rounded-[24px]">
                <div>
                  <h4 className="font-extrabold text-slate-800 dark:text-slate-100 text-sm tracking-tight">
                    {order.restaurant?.name || 'CraveGo Cafe'}
                  </h4>
                  <p className="text-[10px] font-bold text-slate-400 dark:text-neutral-500 mt-0.5">
                    Order {order.orderNumber} • ₹{order.billing.grandTotal}
                  </p>
                  <span className={cn(
                    "inline-flex items-center mt-2 px-2.5 py-0.5 rounded-full text-[8px] font-extrabold uppercase tracking-widest",
                    order.status === 'delivered' ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/20' : 
                    order.status === 'cancelled' ? 'bg-rose-50 text-rose-600 dark:bg-rose-950/20' : 
                    'bg-brand-50 text-brand-600 dark:bg-brand-950/20'
                  )}>
                    {order.status}
                  </span>
                </div>

                <div className="flex items-center gap-2 select-none">
                  <Button variant="outline" size="sm" onClick={() => handleOpenInvoice(order._id)} className="font-bold flex items-center gap-1.5 px-4">
                    <FileText className="w-3.5 h-3.5" /> Invoice
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </motion.div>
  );
};

export default CustomerDashboard;
