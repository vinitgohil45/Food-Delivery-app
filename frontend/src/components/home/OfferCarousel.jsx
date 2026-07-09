import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { IoChevronBack, IoChevronForward, IoTicketOutline } from 'react-icons/io5';

const OFFERS = [
  { code: 'CRAVE50', title: 'Craving Delicacies?', subtitle: 'Get Flat ₹50 OFF on any menu order', bg: 'from-orange-500 via-brand-500 to-rose-600' },
  { code: 'CRAVE100', title: 'Weekend Feast Treat', subtitle: 'Flat ₹100 OFF on orders above ₹200', bg: 'from-purple-600 via-indigo-500 to-blue-600' },
  { code: 'WELCOME150', title: 'First Bite Special', subtitle: 'Flat ₹150 OFF on your first CraveGo order', bg: 'from-emerald-600 via-teal-500 to-cyan-600' },
  { code: 'FESTIVAL20', title: 'Festive Gathering Offer', subtitle: 'Get 20% OFF on all group platters & meals', bg: 'from-amber-500 via-orange-500 to-yellow-600' },
  { code: 'BOGO', title: 'Double the Taste', subtitle: 'Buy 1 Get 50% discount on your next item', bg: 'from-rose-500 via-pink-500 to-red-600' },
];

const OfferCarousel = () => {
  const [current, setCurrent] = useState(0);
  const timerRef = useRef(null);

  const startTimer = () => {
    stopTimer();
    timerRef.current = setInterval(() => {
      setCurrent((prev) => (prev + 1) % OFFERS.length);
    }, 4500);
  };

  const stopTimer = () => {
    if (timerRef.current) clearInterval(timerRef.current);
  };

  useEffect(() => {
    startTimer();
    return () => stopTimer();
  }, []);

  const handleNext = () => {
    stopTimer();
    setCurrent((prev) => (prev + 1) % OFFERS.length);
    startTimer();
  };

  const handlePrev = () => {
    stopTimer();
    setCurrent((prev) => (prev - 1 + OFFERS.length) % OFFERS.length);
    startTimer();
  };

  return (
    <div className="relative w-full h-[140px] sm:h-[180px] rounded-[32px] overflow-hidden shadow-premium group">
      
      {/* Slides */}
      <div className="relative w-full h-full">
        <AnimatePresence mode="wait">
          {OFFERS.map((off, index) => {
            if (index !== current) return null;
            return (
              <motion.div
                key={off.code}
                initial={{ opacity: 0, x: 50 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -50 }}
                transition={{ duration: 0.5, ease: 'easeInOut' }}
                className={`absolute inset-0 bg-gradient-to-r ${off.bg} flex items-center justify-between p-8 text-white`}
              >
                {/* Promo Text */}
                <div className="flex flex-col gap-1.5 sm:gap-2.5 max-w-[70%]">
                  <span className="inline-flex items-center gap-1 bg-white/20 backdrop-blur-md px-2 py-0.5 rounded-lg text-[9px] font-black uppercase tracking-wider w-fit">
                    <IOTicketOutline className="text-[10px]" /> Promo Coupon
                  </span>
                  <h3 className="text-lg sm:text-2xl font-black tracking-tight leading-tight">{off.title}</h3>
                  <p className="text-white/80 text-[10px] sm:text-xs font-semibold">{off.subtitle}</p>
                </div>

                {/* Promo Code Bubble */}
                <div className="flex flex-col items-center justify-center p-3 sm:p-4 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 shadow-premium shrink-0">
                  <span className="text-[9px] font-bold text-white/70 uppercase tracking-widest">Apply Code</span>
                  <span className="text-sm sm:text-base font-black tracking-wider uppercase text-yellow-300 font-mono mt-0.5">
                    {off.code}
                  </span>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      {/* Navigation Buttons */}
      <button
        onClick={handlePrev}
        className="absolute left-4 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/10 backdrop-blur-md hover:bg-black/35 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
        aria-label="Previous offer"
      >
        <IoChevronBack className="text-lg" />
      </button>
      <button
        onClick={handleNext}
        className="absolute right-4 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/10 backdrop-blur-md hover:bg-black/35 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
        aria-label="Next offer"
      >
        <IoChevronForward className="text-lg" />
      </button>

      {/* Indicators */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-1.5 z-10">
        {OFFERS.map((_, i) => (
          <button
            key={i}
            onClick={() => {
              stopTimer();
              setCurrent(i);
              startTimer();
            }}
            className={`h-1.5 rounded-full transition-all duration-300 ${
              i === current ? 'w-5 bg-white' : 'w-1.5 bg-white/40'
            }`}
            aria-label={`Go to slide ${i + 1}`}
          />
        ))}
      </div>
    </div>
  );
};

// Fallback helper to avoid icon error
const IOTicketOutline = ({ className }) => (
  <svg stroke="currentColor" fill="none" strokeWidth="2" viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round" className={className} height="1em" width="1em" xmlns="http://www.w3.org/2000/svg">
    <path d="M2 9a3 3 0 0 1 0 6v2a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-2a3 3 0 0 1 0-6V7a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2Z"></path>
    <path d="M13 5v2"></path>
    <path d="M13 17v2"></path>
    <path d="M13 11v2"></path>
  </svg>
);

export default OfferCarousel;
