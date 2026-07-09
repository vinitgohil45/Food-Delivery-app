import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useToast } from '../components/ui/Toast';
import {
  Receipt,
  Calendar,
  RotateCw,
  Star,
  Bike,
} from 'lucide-react';
import api from '../services/api';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '../utils/cn';

const Orders = () => {
  const toast = useToast();
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // Ratings modal inline state
  const [ratingOrderId, setRatingOrderId] = useState(null);
  const [ratingScore, setRatingScore] = useState(5);
  const [ratingComment, setRatingComment] = useState('');
  const [isSubmittingRating, setIsSubmittingRating] = useState(false);

  const fetchOrders = async () => {
    try {
      const response = await api.get('/orders');
      if (response.data?.success) {
        setOrders(response.data.data.orders);
      }
    } catch (e) {
      toast.error('Failed to load order history list');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const handleReorder = async (orderId) => {
    try {
      const response = await api.post('/orders/reorder', { orderId });
      if (response.data?.success) {
        toast.success('Items added to cart!');
        navigate('/cart');
      }
    } catch (error) {
      toast.error('Failed to duplicate order items');
    }
  };

  const handleOpenInvoice = (orderId) => {
    window.open(`/api/v1/orders/invoice/${orderId}`, '_blank');
  };

  const submitRating = async (e) => {
    e.preventDefault();
    if (!ratingOrderId) return;

    setIsSubmittingRating(true);
    try {
      const response = await api.patch(`/orders/${ratingOrderId}/rate`, {
        rating: ratingScore,
        review: ratingComment.trim(),
      });
      if (response.data?.success) {
        toast.success('Thank you for your rating review!');
        setRatingOrderId(null);
        setRatingComment('');
        fetchOrders();
      }
    } catch (error) {
      toast.error('Failed to save rating');
    } finally {
      setIsSubmittingRating(false);
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
      className="max-w-4xl mx-auto py-6 flex flex-col gap-7"
    >
      <div className="border-b border-slate-100 dark:border-white/5 pb-6 select-none">
        <h1 className="text-2xl font-black tracking-tight text-slate-800 dark:text-slate-100 flex items-center gap-2.5">
          <Receipt className="text-brand-500 w-6.5 h-6.5" /> Order History
        </h1>
        <p className="text-xs text-slate-400 dark:text-neutral-500 font-semibold mt-1">View billing history, invoices, and active tracking streams.</p>
      </div>

      {orders.length === 0 ? (
        <div className="p-12 text-center border border-dashed border-slate-200 dark:border-white/5 rounded-[24px] flex flex-col items-center gap-4 select-none">
          <p className="text-xs text-slate-400 dark:text-neutral-500 font-semibold">You haven't placed any orders yet.</p>
          <Link to="/">
            <Button variant="primary" className="px-8">Order Now</Button>
          </Link>
        </div>
      ) : (
        <div className="flex flex-col gap-5">
          {orders.map((order) => (
            <Card key={order._id} className="flex flex-col gap-4.5 p-5 rounded-[24px] shadow-lg">
              {/* Header block */}
              <div className="flex justify-between items-start border-b border-slate-100 dark:border-white/5 pb-3">
                <div className="select-none">
                  <h4 className="font-extrabold text-slate-800 dark:text-slate-100 text-sm tracking-tight">
                    {order.restaurant?.name || 'CraveGo Kitchen'}
                  </h4>
                  <p className="text-[10px] font-bold text-slate-405 dark:text-neutral-500 flex items-center gap-1 mt-1">
                    <Calendar className="w-3.5 h-3.5 text-slate-400" /> {new Date(order.createdAt).toLocaleDateString()} • {order.orderNumber}
                  </p>
                </div>
                <span className={cn(
                  "px-2.5 py-0.5 rounded-full text-[8px] font-black uppercase tracking-widest select-none",
                  order.status === 'delivered' ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/20' : 
                  order.status === 'cancelled' ? 'bg-rose-50 text-rose-600 dark:bg-rose-950/20' : 
                  'bg-brand-50 text-brand-600 dark:bg-brand-950/20'
                )}>
                  {order.status}
                </span>
              </div>

              {/* Action block */}
              <div className="flex flex-wrap justify-between items-center gap-3">
                <span className="font-extrabold text-xs text-slate-700 dark:text-slate-350 select-none">
                  Total Paid: ₹{order.billing.grandTotal}
                </span>

                <div className="flex gap-2.5 select-none">
                  <Button variant="outline" size="sm" onClick={() => handleOpenInvoice(order._id)} className="px-4.5">
                    Invoice
                  </Button>
                  <Button variant="secondary" size="sm" icon={<RotateCw className="w-3.5 h-3.5" />} onClick={() => handleReorder(order._id)} className="px-4.5">
                    Reorder
                  </Button>
                  {!['delivered', 'cancelled'].includes(order.status) && (
                    <Link to={`/orders/${order._id}/track`}>
                      <Button variant="primary" size="sm" icon={<Bike className="w-3.5 h-3.5" />} className="px-4.5">
                        Track
                      </Button>
                    </Link>
                  )}
                  {order.status === 'delivered' && (
                    <Button variant="primary" size="sm" icon={<Star className="w-3.5 h-3.5" />} onClick={() => setRatingOrderId(order._id)} className="px-4.5">
                      Rate
                    </Button>
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Ratings Modal overlay */}
      <AnimatePresence>
        {ratingOrderId && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.form 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              onSubmit={submitRating} 
              className="max-w-md w-full p-6 rounded-[24px] bg-white dark:bg-[#0c0c14] border border-slate-200/50 dark:border-white/5 flex flex-col gap-4.5 shadow-2xl"
            >
              <h3 className="font-extrabold text-base text-slate-805 dark:text-slate-100 text-center tracking-tight">Rate Your Order</h3>
              
              {/* Stars selection */}
              <div className="flex justify-center gap-3.5 py-2 text-2xl text-amber-400 select-none">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button type="button" key={star} onClick={() => setRatingScore(star)} className="cursor-pointer transition-transform active:scale-90 hover:scale-110">
                    {star <= ratingScore ? '★' : '☆'}
                  </button>
                ))}
              </div>

              <textarea
                placeholder="Leave an optional review..."
                value={ratingComment}
                onChange={(e) => setRatingComment(e.target.value)}
                className="w-full bg-slate-50 dark:bg-white/5 border border-slate-200/60 dark:border-white/5 rounded-2xl p-4 text-xs font-semibold text-slate-800 dark:text-slate-100 placeholder-slate-400 dark:placeholder-neutral-500 focus:outline-none"
                rows="3"
              />

              <div className="flex justify-end gap-3.5 pt-2 select-none">
                <Button type="button" variant="outline" size="sm" onClick={() => setRatingOrderId(null)}>Cancel</Button>
                <Button type="submit" size="sm" isLoading={isSubmittingRating}>Submit</Button>
              </div>
            </motion.form>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default Orders;
