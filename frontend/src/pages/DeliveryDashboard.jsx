import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../components/ui/Toast';
import {
  Bike,
  Compass,
  Briefcase,
  Wallet,
  RotateCw,
  MapPin,
  CheckCircle2,
  Activity,
} from 'lucide-react';
import api from '../services/api';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import { motion } from 'framer-motion';
import { cn } from '../utils/cn';

const DeliveryDashboard = () => {
  const { user } = useAuth();
  const toast = useToast();
  const [availableOrders, setAvailableOrders] = useState([]);
  const [myOrders, setMyOrders] = useState([]);
  const [earnings, setEarnings] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(null);

  const fetchDriverData = async () => {
    try {
      const [availableRes, myRes] = await Promise.all([
        api.get('/delivery/available-orders'),
        api.get('/delivery/my-orders'),
      ]);

      if (availableRes.data?.success) {
        setAvailableOrders(availableRes.data.data || []);
      }
      if (myRes.data?.success) {
        const runs = myRes.data.data || [];
        setMyOrders(runs);

        const delivered = runs.filter(o => o.status === 'delivered');
        const sum = delivered.reduce((acc, o) => acc + (o.billing?.driverTip || 0) + (o.billing?.deliveryCharge || 30), 0);
        setEarnings(sum);
      }
    } catch (e) {
      toast.error('Failed to load delivery runs');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDriverData();
    const interval = setInterval(fetchDriverData, 15000);
    return () => clearInterval(interval);
  }, []);

  const handleAcceptJob = async (orderId) => {
    setIsUpdating(orderId);
    try {
      const response = await api.post(`/delivery/accept/${orderId}`);
      if (response.data?.success) {
        toast.success('You have accepted this delivery run! 🚴');
        fetchDriverData();
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to accept run');
    } finally {
      setIsUpdating(null);
    }
  };

  const handleUpdateStatus = async (orderId, newStatus) => {
    setIsUpdating(orderId);
    try {
      let endpoint = `/orders/${orderId}/status`;
      let payload = { status: newStatus, note: `Driver marked order as ${newStatus}` };

      if (newStatus === 'picked_up') {
        endpoint = '/delivery/pickup';
        payload = { orderId };
      } else if (newStatus === 'delivered') {
        endpoint = '/delivery/delivered';
        payload = { orderId };
      }

      const response = await api.patch(endpoint, payload);
      if (response.data?.success) {
        toast.success(`Run status updated: ${newStatus}`);
        fetchDriverData();
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update run status');
    } finally {
      setIsUpdating(null);
    }
  };

  if (isLoading) {
    return (
      <div className="h-[65vh] flex flex-col items-center justify-center">
        <div className="relative overflow-hidden bg-slate-200/80 dark:bg-neutral-800/70 before:absolute before:inset-0 before:-translate-x-full before:animate-[shimmer_2s_infinite] before:bg-gradient-to-r before:from-transparent before:via-white/20 dark:before:via-white/5 before:to-transparent w-12 h-12 rounded-2xl" />
      </div>
    );
  }

  const activeTrip = myOrders.find(o => ['prepared', 'picked_up', 'on_the_way'].includes(o.status));

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="flex flex-col gap-8 max-w-4xl mx-auto py-6 px-4"
    >
      {/* Header */}
      <div className="flex justify-between items-center gap-4 flex-wrap border-b border-slate-100 dark:border-white/5 pb-6 select-none">
        <div className="flex items-center gap-4">
          <div className="h-16 w-16 rounded-[24px] bg-brand-500/10 text-brand-500 flex items-center justify-center text-3xl shrink-0 shadow-premium">
            <Bike className="w-7 h-7 text-brand-500" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-black text-slate-800 dark:text-slate-100 tracking-tight">{user?.name}</h1>
            <p className="text-[10px] font-extrabold text-slate-450 dark:text-neutral-500 uppercase tracking-widest mt-0.5">Delivery Partner Dashboard</p>
          </div>
        </div>
        
        <Button variant="outline" size="sm" onClick={fetchDriverData} className="rounded-xl flex items-center gap-2 select-none px-4">
          <RotateCw className="w-3.5 h-3.5" />
          <span>Refresh</span>
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 select-none">
        <div className="p-6 rounded-[24px] bg-white dark:bg-[#0c0c14] border border-slate-200/50 dark:border-white/5 shadow-xl flex flex-col gap-2">
          <Wallet className="w-6 h-6 text-emerald-500" />
          <span className="text-slate-400 dark:text-neutral-550 text-xs font-bold uppercase tracking-wider">Today's Earnings</span>
          <span className="text-xl font-black text-slate-850 dark:text-slate-100 tracking-tight">₹{earnings}</span>
        </div>
        <div className="p-6 rounded-[24px] bg-white dark:bg-[#0c0c14] border border-slate-200/50 dark:border-white/5 shadow-xl flex flex-col gap-2">
          <Briefcase className="w-6 h-6 text-blue-500" />
          <span className="text-slate-400 dark:text-neutral-550 text-xs font-bold uppercase tracking-wider">Trips Completed</span>
          <span className="text-xl font-black text-slate-850 dark:text-slate-100 tracking-tight">
            {myOrders.filter(o => o.status === 'delivered').length} Runs
          </span>
        </div>
        <div className="p-6 rounded-[24px] bg-white dark:bg-[#0c0c14] border border-slate-200/50 dark:border-white/5 shadow-xl flex flex-col gap-2">
          <Compass className="w-6 h-6 text-indigo-500" />
          <span className="text-slate-400 dark:text-neutral-550 text-xs font-bold uppercase tracking-wider">Active Trip</span>
          <span className="text-xl font-black text-slate-855 dark:text-slate-100 tracking-tight">
            {activeTrip ? 'In Progress' : 'No Job'}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-2">
        {/* Active Trip detail */}
        <div className="flex flex-col gap-4">
          <h2 className="text-lg font-black tracking-tight text-slate-805 dark:text-slate-100 select-none">
            Active Navigation Run 📍
          </h2>
          {activeTrip ? (
            <Card className="flex flex-col gap-5 p-5 border border-slate-200/50 dark:border-white/5 bg-white dark:bg-[#0c0c14] rounded-[24px] shadow-xl">
              <div>
                <span className="text-[8px] font-black uppercase tracking-widest bg-brand-50 dark:bg-brand-950/20 text-brand-500 px-2 py-0.5 rounded select-none">
                  Status: {activeTrip.status === 'prepared' ? 'Ready for Pickup' : activeTrip.status.replace('_', ' ')}
                </span>
                <h4 className="font-extrabold text-slate-850 dark:text-slate-150 text-base mt-2 tracking-tight">
                  {activeTrip.restaurant?.name}
                </h4>
                <p className="text-[11px] font-semibold text-slate-400 dark:text-neutral-500 mt-1 select-none">
                  Deliver to: {activeTrip.deliveryAddress?.formattedAddress}
                </p>
                <p className="text-[11px] text-emerald-500 font-extrabold mt-1 select-none">
                  Collect Amount: ₹{activeTrip.billing?.grandTotal} ({activeTrip.paymentMethod.toUpperCase()})
                </p>
              </div>
              
              <div className="flex gap-2 border-t border-slate-100 dark:border-white/5 pt-3.5 select-none">
                {activeTrip.status === 'prepared' && (
                  <Button
                    className="w-full py-3 rounded-2xl text-xs font-black"
                    isLoading={isUpdating === activeTrip._id}
                    onClick={() => handleUpdateOrderStatus(activeTrip._id, 'picked_up')}
                  >
                    Confirm Pickup 🥡
                  </Button>
                )}
                {activeTrip.status === 'picked_up' && (
                  <Button
                    className="w-full py-3 rounded-2xl text-xs font-black"
                    isLoading={isUpdating === activeTrip._id}
                    onClick={() => handleUpdateOrderStatus(activeTrip._id, 'on_the_way')}
                  >
                    Mark On The Way 🛵
                  </Button>
                )}
                {activeTrip.status === 'on_the_way' && (
                  <Button
                    className="w-full py-3 rounded-2xl text-xs font-black bg-emerald-500 hover:bg-emerald-600 border-emerald-500 hover:border-emerald-600 shadow-md shadow-emerald-500/10"
                    isLoading={isUpdating === activeTrip._id}
                    onClick={() => handleUpdateOrderStatus(activeTrip._id, 'delivered')}
                  >
                    Confirm Drop-Off & Delivery ✅
                  </Button>
                )}
              </div>
            </Card>
          ) : (
            <p className="text-xs text-slate-400 dark:text-neutral-550 py-12 text-center border border-dashed border-slate-205 dark:border-white/5 rounded-[24px] bg-slate-50/20 dark:bg-white/5 font-semibold select-none">
              No active navigation route. Accept a job from the list to start.
            </p>
          )}
        </div>

        {/* Available Jobs list */}
        <div className="flex flex-col gap-4">
          <h2 className="text-lg font-black tracking-tight text-slate-805 dark:text-slate-100 select-none">
            Available Radial Runs 📦
          </h2>
          {availableOrders.length === 0 ? (
            <p className="text-xs text-slate-400 dark:text-neutral-550 py-12 text-center border border-dashed border-slate-205 dark:border-white/5 rounded-[24px] bg-slate-50/20 dark:bg-white/5 font-semibold select-none">
              No pending driverless pickup jobs nearby.
            </p>
          ) : (
            <div className="flex flex-col gap-3">
              {availableOrders.map((order) => (
                <Card key={order._id} className="flex justify-between items-center gap-4 p-4 bg-white dark:bg-[#0c0c14] border border-slate-200/40 dark:border-white/5 rounded-2xl shadow-md">
                  <div className="min-w-0 select-none">
                    <h4 className="font-extrabold text-slate-800 dark:text-slate-150 text-xs truncate">
                      {order.restaurant?.name}
                    </h4>
                    <p className="text-[10px] text-slate-400 dark:text-neutral-500 font-semibold truncate mt-0.5">
                      Deliver: {order.deliveryAddress?.formattedAddress}
                    </p>
                  </div>
                  <Button
                    size="sm"
                    isLoading={isUpdating === order._id}
                    onClick={() => handleAcceptJob(order._id)}
                    className="py-1.5 px-4 rounded-xl text-[10px] font-black shrink-0 select-none"
                  >
                    Accept
                  </Button>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
};

export default DeliveryDashboard;
