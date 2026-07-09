import React from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { CheckCircle2, Receipt, Home } from 'lucide-react';
import Button from '../components/ui/Button';
import { motion } from 'framer-motion';

const PaymentSuccess = () => {
  const [searchParams] = useSearchParams();
  const orderNumber = searchParams.get('orderNo') || 'ORD-2026-MOCK';

  return (
    <div className="min-h-[70vh] flex items-center justify-center py-6 px-4">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="max-w-md w-full p-8 rounded-[32px] glass-card-premium border border-slate-200/50 dark:border-white/5 shadow-2xl flex flex-col items-center text-center gap-6"
      >
        <div className="h-20 w-20 bg-emerald-500/10 text-emerald-500 rounded-full flex items-center justify-center text-5xl animate-bounce select-none">
          <CheckCircle2 className="w-10 h-10 text-emerald-500" />
        </div>
        
        <div>
          <h1 className="text-2xl font-black tracking-tight text-slate-800 dark:text-slate-100">
            Payment Successful!
          </h1>
          <p className="text-xs text-slate-400 dark:text-neutral-500 mt-2 font-semibold">
            Your transaction has completed successfully. The restaurant is preparing your food.
          </p>
        </div>

        <div className="bg-slate-50 dark:bg-white/5 p-4.5 rounded-2xl w-full border border-slate-200/35 dark:border-white/5 text-xs text-slate-600 dark:text-slate-350 select-none">
          <p className="font-bold text-slate-400 dark:text-neutral-500 uppercase tracking-widest text-[9px]">Order Reference</p>
          <p className="font-extrabold text-slate-800 dark:text-slate-100 mt-1">{orderNumber}</p>
        </div>

        <div className="flex flex-col gap-2 w-full select-none">
          <Link to="/profile/orders">
            <Button className="w-full" icon={<Receipt className="w-4 h-4" />}>
              Track Order History
            </Button>
          </Link>
          <Link to="/">
            <Button variant="outline" className="w-full" icon={<Home className="w-4 h-4" />}>
              Back to Home
            </Button>
          </Link>
        </div>
      </motion.div>
    </div>
  );
};

export default PaymentSuccess;
