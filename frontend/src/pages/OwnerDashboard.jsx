import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../components/ui/Toast';
import {
  Utensils,
  DollarSign,
  TrendingUp,
  Plus,
  Menu,
  ToggleLeft,
  ToggleRight,
  ListOrdered,
  Percent,
} from 'lucide-react';
import api from '../services/api';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import { motion } from 'framer-motion';
import { cn } from '../utils/cn';

const OwnerDashboard = () => {
  const { user } = useAuth();
  const toast = useToast();
  const [restaurants, setRestaurants] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [orders, setOrders] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchOwnerData = async () => {
    try {
      const response = await api.get('/restaurants/owner/all');
      if (response.data?.success) {
        const list = response.data.data;
        setRestaurants(list);

        if (list.length > 0) {
          const primaryRestId = list[0]._id;
          const [analyticsRes, ordersRes] = await Promise.all([
            api.get(`/restaurants/${primaryRestId}/analytics`),
            api.get('/orders'),
          ]);
          if (analyticsRes.data?.success) setAnalytics(analyticsRes.data.data);
          if (ordersRes.data?.success) setOrders(ordersRes.data.data.orders);
        }
      }
    } catch (error) {
      toast.error('Failed to load owner dashboard stats');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchOwnerData();
  }, [toast]);

  const toggleRestaurantStatus = async (restaurantId, currentStatus) => {
    try {
      const response = await api.patch(`/restaurants/${restaurantId}/status`, {
        isActive: !currentStatus,
      });
      if (response.data?.success) {
        toast.success(response.data.message || 'Status updated successfully!');
        setRestaurants((prev) =>
          prev.map((r) => (r._id === restaurantId ? { ...r, isActive: !currentStatus } : r))
        );
      }
    } catch (error) {
      toast.error('Failed to update restaurant status');
    }
  };

  const handleUpdateOrderStatus = async (orderId, newStatus) => {
    try {
      const response = await api.patch(`/orders/${orderId}/status`, {
        status: newStatus,
        note: `Restaurant marked order as ${newStatus}`,
      });
      if (response.data?.success) {
        toast.success(`Order is now ${newStatus}`);
        setOrders((prev) =>
          prev.map((o) => (o._id === orderId ? { ...o, status: newStatus } : o))
        );
      }
    } catch (error) {
      toast.error('Failed to update order status');
    }
  };

  if (isLoading) {
    return (
      <div className="h-[65vh] flex flex-col items-center justify-center">
        <div className="relative overflow-hidden bg-slate-200/80 dark:bg-neutral-800/70 before:absolute before:inset-0 before:-translate-x-full before:animate-[shimmer_2s_infinite] before:bg-gradient-to-r before:from-transparent before:via-white/20 dark:before:via-white/5 before:to-transparent w-12 h-12 rounded-2xl" />
      </div>
    );
  }

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="flex flex-col gap-8 max-w-5xl mx-auto py-6"
    >
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4 border-b border-slate-150 dark:border-white/5 pb-6 select-none">
        <div className="flex items-center gap-4">
          <div className="h-16 w-16 rounded-[24px] bg-brand-500/10 text-brand-500 flex items-center justify-center text-3xl shadow-premium">
            <Utensils className="w-7 h-7 text-brand-500" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-slate-800 dark:text-slate-100 tracking-tight">{user?.name}</h1>
            <p className="text-xs text-slate-450 dark:text-neutral-500 uppercase tracking-widest font-extrabold mt-0.5">CraveGo Vendor Panel</p>
          </div>
        </div>
        <Link to="/restaurant/register" className="w-full sm:w-auto">
          <Button variant="primary" icon={<Plus className="w-4 h-4" />} className="w-full">
            Add New Restaurant
          </Button>
        </Link>
      </div>

      {restaurants.length === 0 ? (
        <div className="p-12 text-center rounded-[32px] border border-dashed border-slate-200 dark:border-white/5 flex flex-col items-center gap-4 select-none">
          <h2 className="text-lg font-black text-slate-700 dark:text-slate-200 tracking-tight">No restaurants listed</h2>
          <p className="text-xs text-slate-400 dark:text-neutral-500 max-w-sm font-semibold leading-relaxed">
            Register your kitchen, setup catalog categories, and start accepting deliveries.
          </p>
          <Link to="/restaurant/register">
            <Button variant="primary" className="px-8">Get Started</Button>
          </Link>
        </div>
      ) : (
        <>
          {/* Analytics Summary */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 select-none">
            <div className="p-6 rounded-[24px] glass-card-premium border border-slate-200/50 dark:border-white/5 shadow-xl flex flex-col gap-2">
              <DollarSign className="w-6 h-6 text-emerald-500" />
              <span className="text-slate-400 dark:text-neutral-550 text-xs font-bold uppercase tracking-wider">Total Revenue</span>
              <span className="text-2xl font-black text-slate-850 dark:text-slate-100 tracking-tight">
                ₹{analytics?.revenue || '0.00'}
              </span>
            </div>
            <div className="p-6 rounded-[24px] glass-card-premium border border-slate-200/50 dark:border-white/5 shadow-xl flex flex-col gap-2">
              <ListOrdered className="w-6 h-6 text-blue-500" />
              <span className="text-slate-400 dark:text-neutral-550 text-xs font-bold uppercase tracking-wider">Completed Orders</span>
              <span className="text-2xl font-black text-slate-850 dark:text-slate-100 tracking-tight">
                {analytics?.ordersCount || 0} Orders
              </span>
            </div>
            <div className="p-6 rounded-[24px] glass-card-premium border border-slate-200/50 dark:border-white/5 shadow-xl flex flex-col gap-2">
              <TrendingUp className="w-6 h-6 text-indigo-500" />
              <span className="text-slate-400 dark:text-neutral-550 text-xs font-bold uppercase tracking-wider">Average Order Value</span>
              <span className="text-2xl font-black text-slate-850 dark:text-slate-100 tracking-tight">
                ₹{analytics?.averageOrderValue || 0}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mt-2">
            {/* Outlets Listing */}
            <div className="lg:col-span-1 flex flex-col gap-4">
              <h2 className="text-lg font-black tracking-tight text-slate-800 dark:text-slate-100 select-none">
                Active Outlets
              </h2>
              <div className="flex flex-col gap-4">
                {restaurants.map((rest) => (
                  <Card key={rest._id} hoverEffect={false} className="flex flex-col gap-4.5 p-5 rounded-[24px] shadow-xl">
                    <div className="flex items-center gap-3.5 select-none">
                      <span className="h-10 w-10 rounded-2xl bg-brand-500/10 text-brand-500 flex items-center justify-center font-extrabold text-base tracking-tight shadow-sm">
                        {rest.name.charAt(0)}
                      </span>
                      <div>
                        <h4 className="font-extrabold text-slate-850 dark:text-slate-150 text-xs">{rest.name}</h4>
                        <span className={cn(
                          "inline-flex items-center px-2.5 py-0.5 rounded-full text-[8px] font-extrabold uppercase tracking-widest mt-1",
                          rest.isVerified ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/20' : 'bg-amber-50 text-amber-600 dark:bg-amber-950/20'
                        )}>
                          {rest.isVerified ? 'Verified' : 'Pending Review'}
                        </span>
                      </div>
                    </div>
                    <div className="flex gap-2.5 select-none">
                      <button
                        onClick={() => toggleRestaurantStatus(rest._id, rest.isActive)}
                        className={cn(
                          "p-2.5 rounded-xl border flex items-center gap-1.5 text-[10px] font-bold flex-1 justify-center transition-all cursor-pointer active:scale-95",
                          rest.isActive
                            ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20'
                            : 'bg-slate-100 text-slate-500 border-slate-200 dark:bg-neutral-800 dark:border-neutral-700'
                        )}
                      >
                        {rest.isActive ? <ToggleRight className="w-4 h-4 text-emerald-500" /> : <ToggleLeft className="w-4 h-4 text-slate-400" />} 
                        {rest.isActive ? 'Online' : 'Offline'}
                      </button>
                      <Link to={`/restaurant/menu`} className="flex-1">
                        <Button variant="secondary" className="w-full text-[10px] py-2.5 flex items-center justify-center gap-1.5" icon={<Menu className="w-3.5 h-3.5" />}>Menu</Button>
                      </Link>
                    </div>
                  </Card>
                ))}
              </div>
            </div>

            {/* Orders Management Log */}
            <div className="lg:col-span-2 flex flex-col gap-4">
              <h2 className="text-lg font-black tracking-tight text-slate-805 dark:text-slate-100 select-none">
                Incoming Orders
              </h2>

              {orders.length === 0 ? (
                <p className="text-xs text-slate-400 dark:text-neutral-550 text-center py-10 bg-slate-50 dark:bg-white/5 rounded-[24px] border border-dashed border-slate-205 dark:border-white/5 font-semibold select-none">
                  No active customer orders currently.
                </p>
              ) : (
                <div className="flex flex-col gap-4">
                  {orders.map((order) => (
                    <Card key={order._id} className="flex flex-col gap-4.5 p-5 rounded-[24px] shadow-xl">
                      <div className="flex justify-between items-center border-b border-slate-100 dark:border-white/5 pb-3">
                        <div className="select-none">
                          <span className="font-extrabold text-xs text-slate-800 dark:text-slate-100 tracking-tight">{order.orderNumber}</span>
                          <p className="text-[10px] font-semibold text-slate-400 dark:text-neutral-500 mt-1">Address: {order.deliveryAddress.formattedAddress}</p>
                        </div>
                        <span className="text-xs font-black text-slate-800 dark:text-slate-200 select-none">Total: ₹{order.billing.grandTotal}</span>
                      </div>

                      <div className="flex justify-between items-center select-none">
                        <span className={cn(
                          "px-2.5 py-0.5 rounded-full text-[8px] font-black uppercase tracking-widest",
                          order.status === 'placed' ? 'bg-amber-50 text-amber-600 dark:bg-amber-950/20' : 'bg-brand-50 text-brand-600'
                        )}>
                          {order.status}
                        </span>

                        <div className="flex gap-2.5">
                          {order.status === 'placed' && (
                            <>
                              <Button size="sm" variant="outline" onClick={() => handleUpdateOrderStatus(order._id, 'cancelled')} className="px-4">Reject</Button>
                              <Button size="sm" variant="primary" onClick={() => handleUpdateOrderStatus(order._id, 'accepted')} className="px-4">Accept</Button>
                            </>
                          )}
                          {order.status === 'accepted' && (
                            <Button size="sm" variant="primary" onClick={() => handleUpdateOrderStatus(order._id, 'preparing')} className="px-5">Prepare</Button>
                          )}
                          {order.status === 'preparing' && (
                            <Button size="sm" variant="primary" onClick={() => handleUpdateOrderStatus(order._id, 'prepared')} className="px-5">Ready for Pickup</Button>
                          )}
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </motion.div>
  );
};

export default OwnerDashboard;
