import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useSocket } from '../context/SocketContext';
import { useToast } from '../components/ui/Toast';
import {
  Bike,
  MapPin,
  Clock,
  Utensils,
  CheckCircle2,
} from 'lucide-react';
import api from '../services/api';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';
import { motion } from 'framer-motion';

const TrackOrder = () => {
  const { id } = useParams();
  const socket = useSocket();
  const toast = useToast();
  const [order, setOrder] = useState(null);
  const [driverPos, setDriverPos] = useState({ lat: 50, lng: 50 }); // simulated SVG map grid percentage
  const [eta, setEta] = useState(25); // minutes remaining

  const fetchOrderDetails = async () => {
    try {
      const response = await api.get(`/orders/${id}`);
      if (response.data?.success) {
        setOrder(response.data.data);
      }
    } catch (e) {
      toast.error('Failed to load tracking details');
    }
  };

  useEffect(() => {
    fetchOrderDetails();

    if (socket) {
      socket.emit('join:order', { orderId: id });

      // Live status listeners
      const handleStatusUpdate = (updatedOrder) => {
        setOrder(updatedOrder);
        toast.info(`🔔 Order Status Updated: ${updatedOrder.status.toUpperCase()}`);
      };

      socket.on(`order:accepted`, handleStatusUpdate);
      socket.on(`order:preparing`, handleStatusUpdate);
      socket.on(`order:ready`, handleStatusUpdate);
      socket.on(`order:picked_up`, (updatedOrder) => {
        handleStatusUpdate(updatedOrder);
        animateDriver();
      });
      socket.on(`order:on_the_way`, handleStatusUpdate);
      socket.on(`order:delivered`, handleStatusUpdate);

      // Live location updates
      socket.on('order:location', ({ latitude, longitude }) => {
        setDriverPos({ lat: 60, lng: 45 });
        setEta(prev => Math.max(2, prev - 2));
      });

      return () => {
        socket.emit('leave:order', { orderId: id });
        socket.off(`order:accepted`);
        socket.off(`order:preparing`);
        socket.off(`order:ready`);
        socket.off(`order:picked_up`);
        socket.off(`order:on_the_way`);
        socket.off(`order:delivered`);
        socket.off('order:location');
      };
    }
  }, [id, socket]);

  // Simulate smooth driver marker progression along route
  const animateDriver = () => {
    let progress = 0;
    const interval = setInterval(() => {
      progress += 5;
      const startX = 25; // restaurant
      const endX = 75; // customer
      const currentX = startX + (endX - startX) * (progress / 100);
      setDriverPos({ lat: 50, lng: currentX });
      setEta(Math.max(1, Math.round(25 * (1 - progress / 100))));

      if (progress >= 100) {
        clearInterval(interval);
      }
    }, 3000);
  };

  if (!order) {
    return (
      <div className="h-[65vh] flex flex-col items-center justify-center">
        <div className="relative overflow-hidden bg-slate-200/80 dark:bg-neutral-800/70 before:absolute before:inset-0 before:-translate-x-full before:animate-[shimmer_2s_infinite] before:bg-gradient-to-r before:from-transparent before:via-white/20 dark:before:via-white/5 before:to-transparent w-12 h-12 rounded-2xl" />
      </div>
    );
  }

  const steps = [
    { label: 'Placed', key: 'placed' },
    { label: 'Accepted', key: 'accepted' },
    { label: 'Preparing', key: 'preparing' },
    { label: 'Ready', key: 'prepared' },
    { label: 'On the Way', key: 'on_the_way' },
    { label: 'Delivered', key: 'delivered' },
  ];

  const currentStepIndex = steps.findIndex(s => s.key === order.status);

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="max-w-5xl mx-auto py-6 flex flex-col gap-8"
    >
      <div className="border-b border-slate-100 dark:border-white/5 pb-6 select-none">
        <h1 className="text-2xl font-black tracking-tight text-slate-800 dark:text-slate-100 flex items-center gap-2.5">
          <Bike className="text-brand-500 w-6.5 h-6.5" /> Live Order Tracking
        </h1>
        <p className="text-xs text-slate-400 dark:text-neutral-500 font-semibold mt-1">Order: {order.orderNumber} • {order.restaurant?.name}</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Side: Timeline Progress */}
        <div className="lg:col-span-1 flex flex-col gap-6">
          <Card className="flex flex-col gap-6 p-5 rounded-[24px] shadow-xl">
            <h3 className="font-extrabold text-[10px] text-slate-405 dark:text-neutral-500 uppercase tracking-widest border-b border-slate-100 dark:border-white/5 pb-3.5 select-none">
              Delivery Progress
            </h3>
            
            <div className="flex flex-col gap-7 relative pl-6 border-l-2 border-slate-100 dark:border-white/5 ml-3">
              {steps.map((step, index) => {
                const isCompleted = index <= currentStepIndex && order.status !== 'cancelled';
                const isActive = index === currentStepIndex;

                return (
                  <div key={step.key} className="relative flex items-start gap-4">
                    <div className={`absolute -left-[32px] h-4.5 w-4.5 rounded-full border-2 flex items-center justify-center transition-all ${
                      isActive ? 'bg-brand-500 border-brand-500 animate-pulse scale-110' :
                      isCompleted ? 'bg-emerald-500 border-emerald-500' :
                      'bg-white dark:bg-[#0c0c14] border-slate-200 dark:border-white/10'
                    }`}>
                      {isCompleted && !isActive && <CheckCircle2 className="text-white w-2.5 h-2.5" />}
                    </div>

                    <div className="flex flex-col select-none">
                      <span className={`text-xs font-black tracking-tight ${
                        isActive ? 'text-brand-500' :
                        isCompleted ? 'text-slate-800 dark:text-slate-200' :
                        'text-slate-400 dark:text-neutral-550'
                      }`}>
                        {step.label}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>

          {/* Driver Card Info */}
          {order.deliveryPartner && (
            <Card className="flex items-center gap-4.5 p-4.5 rounded-[24px] shadow-xl">
              <div className="h-12 w-12 rounded-2xl bg-brand-500/10 text-brand-500 flex items-center justify-center text-2xl">
                <Bike className="w-5.5 h-5.5 text-brand-500" />
              </div>
              <div className="select-none">
                <h4 className="font-extrabold text-slate-850 dark:text-slate-150 text-xs">
                  {order.deliveryPartner.name}
                </h4>
                <p className="text-[10px] font-semibold text-slate-400 dark:text-neutral-500 mt-0.5">Valued Delivery Partner • {order.deliveryPartner.phone}</p>
              </div>
            </Card>
          )}
        </div>

        {/* Right Side: Map & Route details */}
        <div className="lg:col-span-2 flex flex-col gap-6">
          {/* Estimated time banner */}
          <div className="p-6 rounded-[24px] bg-brand-500/5 dark:bg-brand-500/10 border border-brand-500/10 flex justify-between items-center select-none shadow-md">
            <div className="flex items-center gap-3.5">
              <Clock className="w-7 h-7 text-brand-500 animate-pulse" />
              <div>
                <h4 className="font-extrabold text-brand-500 text-sm tracking-tight">Estimated Delivery Time</h4>
                <p className="text-[10px] font-semibold text-slate-450 dark:text-neutral-500 mt-0.5">Arriving in approximately {eta} minutes</p>
              </div>
            </div>
            <span className="text-2xl font-black text-brand-500 tracking-tight">{eta} min</span>
          </div>

          {/* Custom SVG Map Router */}
          <div className="h-80 rounded-[32px] bg-slate-900 border border-white/5 relative overflow-hidden flex items-center justify-center shadow-2xl">
            {/* Grid pattern overlays */}
            <div className="absolute inset-0 opacity-10 bg-[linear-gradient(to_right,#808080_1px,transparent_1px),linear-gradient(to_bottom,#808080_1px,transparent_1px)] bg-[size:24px_24px]" />

            <svg className="w-full h-full p-8" viewBox="0 0 100 100" preserveAspectRatio="none">
              <line x1="25" y1="50" x2="75" y2="50" stroke="#f44336" strokeWidth="1" strokeDasharray="3,3" opacity="0.3" />
              <line x1="25" y1="50" x2={driverPos.lng} y2="50" stroke="#f44336" strokeWidth="1.5" strokeLinecap="round" />

              {/* Restaurant marker */}
              <g transform="translate(25, 50)">
                <circle r="4" fill="#ff9800" opacity="0.2" className="animate-ping" />
                <circle r="3.2" fill="#ff9800" />
                <foreignObject x="-4" y="-4" width="8" height="8">
                  <Utensils className="text-white w-2 h-2 mx-auto" />
                </foreignObject>
              </g>

              {/* Driver marker */}
              {['picked_up', 'on_the_way'].includes(order.status) && (
                <g transform={`translate(${driverPos.lng}, 50)`}>
                  <circle r="5" fill="#f44336" opacity="0.3" className="animate-ping" />
                  <circle r="4" fill="#f44336" />
                  <foreignObject x="-4.5" y="-4.5" width="9" height="9">
                    <Bike className="text-white w-2.5 h-2.5 mx-auto" />
                  </foreignObject>
                </g>
              )}

              {/* Customer marker */}
              <g transform="translate(75, 50)">
                <circle r="4" fill="#4caf50" opacity="0.2" className="animate-ping" />
                <circle r="3.2" fill="#4caf50" />
                <foreignObject x="-4" y="-4" width="8" height="8">
                  <MapPin className="text-white w-2.5 h-2.5 mx-auto" />
                </foreignObject>
              </g>
            </svg>

            {/* Label overlays */}
            <span className="absolute top-6 left-12 text-[10px] font-black text-amber-500 uppercase tracking-widest select-none">
              Outlet ({order.restaurant?.name})
            </span>
            <span className="absolute bottom-6 right-12 text-[10px] font-black text-emerald-500 uppercase tracking-widest select-none">
              Your Location
            </span>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default TrackOrder;
