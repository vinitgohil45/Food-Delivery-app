import React from 'react';
import { useAuth } from '../context/AuthContext';
import { ShieldAlert, Users, Store, ListOrdered } from 'lucide-react';
import { motion } from 'framer-motion';

const AdminDashboard = () => {
  const { user } = useAuth();

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="flex flex-col gap-8 max-w-4xl mx-auto py-6"
    >
      <div className="flex items-center gap-4 border-b border-slate-100 dark:border-white/5 pb-6 select-none">
        <div className="h-16 w-16 rounded-[24px] bg-brand-500/10 text-brand-500 flex items-center justify-center text-3xl shadow-premium">
          <ShieldAlert className="w-7 h-7 text-brand-500" />
        </div>
        <div>
          <h1 className="text-2xl font-black text-slate-800 dark:text-slate-100 tracking-tight">{user?.name}</h1>
          <p className="text-xs text-slate-450 dark:text-neutral-500 uppercase tracking-widest font-extrabold mt-0.5">System Administrator Panel</p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 select-none">
        <div className="p-6 rounded-[24px] glass-card-premium border border-slate-200/50 dark:border-white/5 shadow-xl flex flex-col gap-2">
          <Users className="w-6 h-6 text-blue-500" />
          <span className="text-slate-400 dark:text-neutral-550 text-xs font-bold uppercase tracking-wider">Total Users</span>
          <span className="text-xl font-black text-slate-850 dark:text-slate-100 tracking-tight">1</span>
        </div>
        <div className="p-6 rounded-[24px] glass-card-premium border border-slate-200/50 dark:border-white/5 shadow-xl flex flex-col gap-2">
          <Store className="w-6 h-6 text-emerald-500" />
          <span className="text-slate-400 dark:text-neutral-550 text-xs font-bold uppercase tracking-wider">Registered Restaurants</span>
          <span className="text-xl font-black text-slate-850 dark:text-slate-100 tracking-tight">0 Shops</span>
        </div>
        <div className="p-6 rounded-[24px] glass-card-premium border border-slate-200/50 dark:border-white/5 shadow-xl flex flex-col gap-2">
          <ListOrdered className="w-6 h-6 text-rose-500" />
          <span className="text-slate-400 dark:text-neutral-550 text-xs font-bold uppercase tracking-wider">Total Orders</span>
          <span className="text-xl font-black text-slate-850 dark:text-slate-100 tracking-tight">0 Orders</span>
        </div>
      </div>
    </motion.div>
  );
};

export default AdminDashboard;
