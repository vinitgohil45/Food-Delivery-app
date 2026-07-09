import React from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { XCircle, RotateCcw, Home } from 'lucide-react';
import Button from '../components/ui/Button';
import { motion } from 'framer-motion';

const PaymentFailed = () => {
  const [searchParams] = useSearchParams();
  const errorMsg = searchParams.get('message') || 'The transaction was declined by the bank.';

  return (
    <div className="min-h-[70vh] flex items-center justify-center py-6 px-4">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="max-w-md w-full p-8 rounded-[32px] glass-card-premium border border-slate-200/50 dark:border-white/5 shadow-2xl flex flex-col items-center text-center gap-6"
      >
        <div className="h-20 w-20 bg-rose-500/10 text-rose-500 rounded-full flex items-center justify-center text-5xl select-none">
          <XCircle className="w-10 h-10 text-rose-500 animate-pulse" />
        </div>
        
        <div>
          <h1 className="text-2xl font-black tracking-tight text-slate-800 dark:text-slate-100">
            Payment Failed
          </h1>
          <p className="text-xs text-slate-400 dark:text-neutral-500 mt-2 font-semibold">
            We could not process your payment. No funds were debited.
          </p>
        </div>

        <div className="bg-rose-500/5 dark:bg-rose-500/10 p-4.5 rounded-2xl w-full border border-rose-200/20 text-xs text-rose-600 dark:text-rose-400 select-none">
          <p className="font-bold text-rose-405 dark:text-neutral-500 uppercase tracking-widest text-[9px]">Reason</p>
          <p className="font-extrabold mt-1">{errorMsg}</p>
        </div>

        <div className="flex flex-col gap-2 w-full select-none">
          <Link to="/cart">
            <Button className="w-full" icon={<RotateCcw className="w-4 h-4" />}>
              Retry Checkout
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

export default PaymentFailed;
