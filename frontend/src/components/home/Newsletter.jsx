import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { IoMailOutline, IoChevronForward } from 'react-icons/io5';
import Button from '../ui/Button';
import { useToast } from '../ui/Toast';

const Newsletter = () => {
  const toast = useToast();
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubscribe = (e) => {
    e.preventDefault();
    if (!email) return;

    setIsSubmitting(true);
    setTimeout(() => {
      toast.success('Successfully subscribed to CraveGo Newsletter! Check your inbox for hot deals.');
      setEmail('');
      setIsSubmitting(false);
    }, 1200);
  };

  return (
    <section className="relative rounded-[40px] overflow-hidden bg-slate-900 text-white p-8 sm:p-12 border border-neutral-800 shadow-premium">
      {/* Decorative Blur Spheres */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-brand-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-64 h-64 bg-rose-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="relative z-10 max-w-4xl mx-auto flex flex-col md:flex-row items-center justify-between gap-8">
        <div className="flex flex-col gap-2.5 text-center md:text-left max-w-lg">
          <span className="text-[10px] font-black uppercase tracking-widest text-brand-400">Newsletter Subscription</span>
          <h3 className="text-2xl sm:text-3xl font-black tracking-tight leading-tight">
            Unlock exclusive dining deals, coupons, & recipes!
          </h3>
          <p className="text-xs text-neutral-450 leading-relaxed font-semibold">
            Subscribe now to receive weekly hand-picked top-rated culinary discounts and platform news straight to your mailbox.
          </p>
        </div>

        <form onSubmit={handleSubscribe} className="w-full max-w-md flex flex-col sm:flex-row items-center gap-3">
          <div className="w-full relative flex items-center">
            <IoMailOutline className="absolute left-4 text-neutral-500 text-lg pointer-events-none" />
            <input
              type="email"
              placeholder="Enter your email address"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full py-3.5 pl-12 pr-4 rounded-2xl bg-neutral-850 border border-neutral-800 text-xs text-white placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-brand-500 transition-all font-semibold"
            />
          </div>
          <Button
            type="submit"
            variant="primary"
            isLoading={isSubmitting}
            className="w-full sm:w-auto py-3.5 px-6 rounded-2xl text-xs font-bold flex items-center justify-center gap-1.5 shrink-0"
          >
            <span>Subscribe</span>
            <IoChevronForward className="text-sm" />
          </Button>
        </form>
      </div>
    </section>
  );
};

export default Newsletter;
