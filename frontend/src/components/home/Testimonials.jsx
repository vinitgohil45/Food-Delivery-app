import React from 'react';
import { IoStar } from 'react-icons/io5';
import Card from '../ui/Card';

const REVIEWS = [
  { id: 1, name: 'Aditya Sen', role: 'Daily Customer', text: 'CraveGo completely replaced my daily food ordering apps. The UI is incredibly fast, and my orders always arrive warm and fresh!', rating: 5 },
  { id: 2, name: 'Priya Sharma', role: 'Working Professional', text: 'I love how clean the checkout flows are. Having Wallet Payments and live tracking updates makes ordering lunches so convenient!', rating: 5 },
  { id: 3, name: 'Rohan Mehta', role: 'Gourmet Enthusiast', text: 'The restaurant catalog choices are amazing. I can find authentic local dishes and apply massive coupons like welcome150 easily.', rating: 5 },
];

const Testimonials = () => {
  return (
    <div className="flex flex-col gap-6">
      <div className="text-center sm:text-left flex flex-col gap-1.5">
        <span className="text-[10px] font-black uppercase tracking-widest text-brand-500">Testimonials</span>
        <h3 className="text-lg sm:text-xl font-black text-slate-800 dark:text-slate-100 tracking-tight">
          What our customers say about CraveGo ❤️
        </h3>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {REVIEWS.map((rev) => (
          <Card
            key={rev.id}
            className="flex flex-col gap-4 p-6 border border-slate-205/30 dark:border-white/5 bg-white dark:bg-neutral-900/60 rounded-[28px] relative hover:shadow-premium transition-all duration-300"
          >
            <div className="absolute top-2 right-6 text-slate-100 dark:text-neutral-800/40 text-7xl font-serif font-black select-none pointer-events-none z-0">“</div>
            
            {/* Stars */}
            <div className="flex gap-0.5 text-amber-500 relative z-10">
              {[...Array(rev.rating)].map((_, i) => (
                <IoStar key={i} className="text-xs" />
              ))}
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-350 leading-relaxed font-semibold relative z-10 italic">
              "{rev.text}"
            </p>

            <div className="flex flex-col mt-auto pt-3 border-t border-slate-105/30 dark:border-neutral-800/40 relative z-10">
              <span className="text-xs font-black text-slate-800 dark:text-slate-200">{rev.name}</span>
              <span className="text-[9px] font-bold text-slate-400 mt-0.5">{rev.role}</span>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default Testimonials;
