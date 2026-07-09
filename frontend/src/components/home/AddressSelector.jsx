import React, { useState, useEffect } from 'react';
import { MapPin, Navigation, ChevronDown } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '../../utils/cn';

const PRESETS = [
  { name: 'Bangalore Central', address: 'MG Road, Central Bangalore, KA 560001', lat: 12.9716, lng: 77.5946 },
  { name: 'Indiranagar Tech-hub', address: '12th Main Rd, HAL 2nd Stage, Bangalore, KA 560038', lat: 12.9784, lng: 77.6408 },
  { name: 'Koramangala Residency', address: '80 Feet Road, Koramangala 4th Block, Bangalore, KA 560034', lat: 12.9338, lng: 77.6244 },
];

const AddressSelector = ({ onLocationSelect }) => {
  const [selected, setSelected] = useState(PRESETS[0]);
  const [isOpen, setIsOpen] = useState(false);
  const [isLocating, setIsLocating] = useState(false);

  useEffect(() => {
    if (onLocationSelect) {
      onLocationSelect({ latitude: selected.lat, longitude: selected.lng, address: selected.address });
    }
  }, []);

  const handlePresetSelect = (preset) => {
    setSelected(preset);
    setIsOpen(false);
    if (onLocationSelect) {
      onLocationSelect({ latitude: preset.lat, longitude: preset.lng, address: preset.address });
    }
  };

  const handleGPSLocate = () => {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser.');
      return;
    }
    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const gpsLoc = {
          name: 'My Current Location',
          address: 'Central Bangalore GPS Coordinates',
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        };
        setSelected(gpsLoc);
        setIsLocating(false);
        setIsOpen(false);
        if (onLocationSelect) {
          onLocationSelect({ latitude: gpsLoc.lat, longitude: gpsLoc.lng, address: gpsLoc.address });
        }
      },
      (error) => {
        console.error('GPS locate error, falling back to preset', error);
        setIsLocating(false);
        alert('Could not retrieve GPS coordinates. Defaulting to preset location.');
      }
    );
  };

  return (
    <div className="relative text-left">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2.5 px-4.5 py-2 rounded-2xl bg-white/60 dark:bg-white/5 hover:bg-white/95 dark:hover:bg-white/10 transition-all border border-slate-200/50 dark:border-white/5 text-slate-800 dark:text-slate-200 backdrop-blur-md shadow-premium cursor-pointer active:scale-98"
      >
        <MapPin className="text-brand-500 w-4.5 h-4.5" />
        <div className="flex flex-col text-left">
          <span className="text-[9px] font-bold uppercase tracking-widest text-slate-400 dark:text-neutral-500 select-none">Deliver to</span>
          <span className="text-xs font-black line-clamp-1 max-w-[140px] sm:max-w-[200px]">{selected.name}</span>
        </div>
        <ChevronDown className="text-slate-400 w-3.5 h-3.5 ml-0.5 transition-transform duration-300 group-hover:translate-y-0.5" />
      </button>

      <AnimatePresence>
        {isOpen && (
          <>
            <div className="fixed inset-0 z-30" onClick={() => setIsOpen(false)} />
            
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 8 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 8 }}
              className="absolute left-0 mt-2.5 z-40 w-76 p-5 rounded-[24px] glass-card-premium border border-slate-200/50 dark:border-white/5 shadow-2xl flex flex-col gap-4"
            >
              <button
                onClick={handleGPSLocate}
                disabled={isLocating}
                className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-gradient-to-r from-brand-500 to-brand-600 hover:from-brand-600 hover:to-brand-700 text-white text-xs font-bold transition-all disabled:opacity-60 cursor-pointer active:scale-95 shadow-lg shadow-brand-500/10"
              >
                <Navigation className={cn("w-3.5 h-3.5", isLocating ? 'animate-spin' : '')} />
                <span>{isLocating ? 'Locating...' : 'Use Current GPS Location'}</span>
              </button>

              <div className="h-px bg-slate-100 dark:bg-white/5 my-0.5" />

              <span className="text-[9px] font-bold text-slate-400 dark:text-neutral-500 uppercase tracking-widest px-1 select-none">
                Saved Locations
              </span>

              <div className="flex flex-col gap-1.5">
                {PRESETS.map((preset) => (
                  <button
                    key={preset.name}
                    onClick={() => handlePresetSelect(preset)}
                    className={cn(
                      "flex flex-col text-left p-3 rounded-xl transition-all select-none cursor-pointer",
                      selected.name === preset.name
                        ? "bg-brand-50 dark:bg-brand-950/20 border border-brand-500/10"
                        : "hover:bg-slate-100/50 dark:hover:bg-white/5 border border-transparent"
                    )}
                  >
                    <span className="text-xs font-bold text-slate-800 dark:text-slate-150">{preset.name}</span>
                    <span className="text-[10px] text-slate-450 dark:text-neutral-500 line-clamp-1 mt-0.5">{preset.address}</span>
                  </button>
                ))}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};

export default AddressSelector;
