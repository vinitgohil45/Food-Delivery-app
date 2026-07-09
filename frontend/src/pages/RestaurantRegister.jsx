import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useNavigate } from 'react-router-dom';
import { useToast } from '../components/ui/Toast';
import { IoBusinessOutline, IoPinOutline, IoTimeOutline, IoDocumentTextOutline } from 'react-icons/io5';
import api from '../services/api';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import { z } from 'zod';

const formSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  cuisine: z.string().min(1, 'Cuisine is required'),
  longitude: z.coerce.number().min(-180).max(180),
  latitude: z.coerce.number().min(-90).max(90),
  formattedAddress: z.string().min(5, 'Please provide full address'),
  openHour: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Format must be HH:MM'),
  closeHour: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Format must be HH:MM'),
  deliveryRadiusKm: z.coerce.number().min(1, 'Must be at least 1 Km'),
  minOrderValue: z.coerce.number().min(0),
  deliveryCharge: z.coerce.number().min(0),
  averagePreparationTimeMin: z.coerce.number().min(5),
  gstNumber: z.string().regex(/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/, 'Invalid GST format'),
  licenseNumber: z.string().length(14, 'FSSAI License must be 14 digits'),
});

const RestaurantRegister = () => {
  const toast = useToast();
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      cuisine: 'Chinese, Fast Food',
      longitude: 77.5946,
      latitude: 12.9716, // Bangalore default coords
      formattedAddress: '',
      openHour: '09:00',
      closeHour: '22:00',
      deliveryRadiusKm: 5,
      minOrderValue: 200,
      deliveryCharge: 30,
      averagePreparationTimeMin: 25,
      gstNumber: '29ABCDE1234F1Z5',
      licenseNumber: '12345678901234',
    },
  });

  const onSubmit = async (data) => {
    setIsSubmitting(true);
    try {
      const response = await api.post('/restaurants', data);
      if (response.data?.success) {
        toast.success('Restaurant registered! Verification is in progress.');
        navigate('/restaurant_owner/dashboard');
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to register restaurant.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Mock Map Coordinate selector
  const pickMockLocation = () => {
    const randomLng = (77.5946 + (Math.random() - 0.5) * 0.05).toFixed(4);
    const randomLat = (12.9716 + (Math.random() - 0.5) * 0.05).toFixed(4);
    setValue('longitude', parseFloat(randomLng));
    setValue('latitude', parseFloat(randomLat));
    setValue('formattedAddress', 'CraveGo Lane, Cyber Hub, Metro Park');
    toast.info(`Mock Location selected: [Lng: ${randomLng}, Lat: ${randomLat}]`);
  };

  return (
    <div className="max-w-3xl mx-auto py-6">
      <div className="flex flex-col gap-2 mb-8 text-center sm:text-left">
        <h1 className="text-3xl font-extrabold tracking-tight text-slate-800 dark:text-slate-100 flex items-center gap-2 justify-center sm:justify-start">
          <IoBusinessOutline className="text-brand-500" /> Partner With CraveGo
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          List your kitchen, configure menus, and access thousands of hungry customers nearby.
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-6">
        {/* Core Info */}
        <div className="p-6 rounded-3xl glass-card border border-slate-200/50 dark:border-white/5 shadow-premium flex flex-col gap-4">
          <h3 className="font-bold text-sm text-brand-500 tracking-wide uppercase">General Information</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input label="Restaurant Name" {...register('name')} error={errors.name} />
            <Input label="Cuisine Types (comma-separated)" {...register('cuisine')} error={errors.cuisine} />
          </div>
        </div>

        {/* Location Section */}
        <div className="p-6 rounded-3xl glass-card border border-slate-200/50 dark:border-white/5 shadow-premium flex flex-col gap-4">
          <div className="flex justify-between items-center">
            <h3 className="font-bold text-sm text-brand-500 tracking-wide uppercase">Geospatial Location</h3>
            <button
              type="button"
              onClick={pickMockLocation}
              className="text-xs font-semibold text-brand-500 hover:underline flex items-center gap-1"
            >
              <IoPinOutline /> Mock GPS Coordinates
            </button>
          </div>
          <Input label="Formatted Address" {...register('formattedAddress')} error={errors.formattedAddress} />
          <div className="grid grid-cols-2 gap-4">
            <Input label="Longitude" type="number" step="any" {...register('longitude')} error={errors.longitude} />
            <Input label="Latitude" type="number" step="any" {...register('latitude')} error={errors.latitude} />
          </div>
        </div>

        {/* Operating Rules */}
        <div className="p-6 rounded-3xl glass-card border border-slate-200/50 dark:border-white/5 shadow-premium flex flex-col gap-4">
          <h3 className="font-bold text-sm text-brand-500 tracking-wide uppercase flex items-center gap-1">
            <IoTimeOutline /> Operating & Delivery Rules
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <Input label="Opening Hour" placeholder="09:00" {...register('openHour')} error={errors.openHour} />
            <Input label="Closing Hour" placeholder="22:00" {...register('closeHour')} error={errors.closeHour} />
            <Input label="Radius (Km)" type="number" {...register('deliveryRadiusKm')} error={errors.deliveryRadiusKm} />
            <Input label="Min Order Value (₹)" type="number" {...register('minOrderValue')} error={errors.minOrderValue} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Input label="Delivery Charge (₹)" type="number" {...register('deliveryCharge')} error={errors.deliveryCharge} />
            <Input label="Avg Prep Time (Mins)" type="number" {...register('averagePreparationTimeMin')} error={errors.averagePreparationTimeMin} />
          </div>
        </div>

        {/* Tax and License Info */}
        <div className="p-6 rounded-3xl glass-card border border-slate-200/50 dark:border-white/5 shadow-premium flex flex-col gap-4">
          <h3 className="font-bold text-sm text-brand-500 tracking-wide uppercase flex items-center gap-1">
            <IoDocumentTextOutline /> Legal Certifications
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input label="GST Number" placeholder="29ABCDE1234F1Z5" {...register('gstNumber')} error={errors.gstNumber} />
            <Input label="FSSAI License Number (14 digits)" placeholder="12345678901234" {...register('licenseNumber')} error={errors.licenseNumber} />
          </div>
        </div>

        <Button type="submit" isLoading={isSubmitting} className="w-full">
          Submit Partner Application
        </Button>
      </form>
    </div>
  );
};

export default RestaurantRegister;
