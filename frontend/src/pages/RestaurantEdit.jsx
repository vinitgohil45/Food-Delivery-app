import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useParams, useNavigate } from 'react-router-dom';
import { useToast } from '../components/ui/Toast';
import { IoImageOutline, IoCloudUploadOutline, IoSaveOutline } from 'react-icons/io5';
import api from '../services/api';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import { z } from 'zod';

const formSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  cuisine: z.string().min(1, 'Cuisine is required'),
  longitude: z.coerce.number().min(-180).max(180),
  latitude: z.coerce.number().min(-90).max(90),
  formattedAddress: z.string().min(5, 'Address is required'),
  openHour: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/),
  closeHour: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/),
  deliveryRadiusKm: z.coerce.number().min(1),
  minOrderValue: z.coerce.number().min(0),
  deliveryCharge: z.coerce.number().min(0),
  averagePreparationTimeMin: z.coerce.number().min(5),
});

const RestaurantEdit = () => {
  const { id } = useParams();
  const toast = useToast();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [imageFiles, setImageFiles] = useState([]);
  const [isUploading, setIsUploading] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(formSchema),
  });

  useEffect(() => {
    const fetchRestaurantDetails = async () => {
      try {
        const response = await api.get(`/restaurants/${id}`);
        if (response.data?.success) {
          const rest = response.data.data.restaurant;
          setValue('name', rest.name);
          setValue('cuisine', rest.cuisine.join(', '));
          setValue('longitude', rest.location.coordinates[0]);
          setValue('latitude', rest.location.coordinates[1]);
          setValue('formattedAddress', rest.formattedAddress);
          setValue('openHour', rest.openingHours.open);
          setValue('closeHour', rest.openingHours.close);
          setValue('deliveryRadiusKm', rest.deliveryRadiusKm);
          setValue('minOrderValue', rest.minOrderValue);
          setValue('deliveryCharge', rest.deliveryCharge);
          setValue('averagePreparationTimeMin', rest.averagePreparationTimeMin);
        }
      } catch (error) {
        toast.error('Failed to load restaurant profile details');
        navigate('/restaurant_owner/dashboard');
      } finally {
        setIsLoading(false);
      }
    };
    fetchRestaurantDetails();
  }, [id, setValue, navigate, toast]);

  const onSubmit = async (data) => {
    setIsSaving(true);
    try {
      const response = await api.put(`/restaurants/${id}`, data);
      if (response.data?.success) {
        toast.success('Restaurant profile updated successfully!');
      }
    } catch (error) {
      toast.error('Failed to update restaurant profile');
    } finally {
      setIsSaving(false);
    }
  };

  const handleImageUpload = async (e) => {
    e.preventDefault();
    if (imageFiles.length === 0) {
      toast.error('Please select an image file first');
      return;
    }

    setIsUploading(true);
    const formData = new FormData();
    for (let i = 0; i < imageFiles.length; i++) {
      formData.append('images', imageFiles[i]);
    }
    formData.append('imageType', 'banner');
    formData.append('isPrimary', 'true');

    try {
      const response = await api.post(`/restaurants/${id}/upload-images`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      if (response.data?.success) {
        toast.success('Images uploaded successfully!');
        setImageFiles([]);
      }
    } catch (error) {
      toast.error('Failed to upload image assets');
    } finally {
      setIsUploading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="h-[60vh] flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-brand-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto py-6 flex flex-col gap-8">
      <div className="flex flex-col gap-1.5">
        <h1 className="text-3xl font-extrabold tracking-tight text-slate-800 dark:text-slate-100">
          Edit Restaurant Profile
        </h1>
        <p className="text-xs text-slate-500">Update configuration settings, hours, and store photos</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Form Column */}
        <form onSubmit={handleSubmit(onSubmit)} className="md:col-span-2 flex flex-col gap-6">
          <div className="p-6 rounded-3xl glass-card border border-slate-200/50 dark:border-white/5 shadow-premium flex flex-col gap-4">
            <Input label="Restaurant Name" {...register('name')} error={errors.name} />
            <Input label="Cuisine Types" {...register('cuisine')} error={errors.cuisine} />
            <Input label="Formatted Address" {...register('formattedAddress')} error={errors.formattedAddress} />
            <div className="grid grid-cols-2 gap-4">
              <Input label="Longitude" type="number" step="any" {...register('longitude')} error={errors.longitude} />
              <Input label="Latitude" type="number" step="any" {...register('latitude')} error={errors.latitude} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Input label="Open Hour" {...register('openHour')} error={errors.openHour} />
              <Input label="Close Hour" {...register('closeHour')} error={errors.closeHour} />
            </div>
            <div className="grid grid-cols-3 gap-4">
              <Input label="Radius (Km)" type="number" {...register('deliveryRadiusKm')} error={errors.deliveryRadiusKm} />
              <Input label="Min Order (₹)" type="number" {...register('minOrderValue')} error={errors.minOrderValue} />
              <Input label="Prep Time (Min)" type="number" {...register('averagePreparationTimeMin')} error={errors.averagePreparationTimeMin} />
            </div>
          </div>
          <Button type="submit" isLoading={isSaving} icon={<IoSaveOutline />}>
            Save Changes
          </Button>
        </form>

        {/* Media Upload Column */}
        <div className="flex flex-col gap-6">
          <div className="p-6 rounded-3xl glass-card border border-slate-200/50 dark:border-white/5 shadow-premium flex flex-col gap-4">
            <h3 className="font-bold text-sm text-brand-500 tracking-wide uppercase flex items-center gap-1.5">
              <IoImageOutline /> Store Assets
            </h3>
            <p className="text-[11px] text-slate-400">Upload primary cover banner and menu slides</p>
            
            <form onSubmit={handleImageUpload} className="flex flex-col gap-3">
              <input
                type="file"
                multiple
                accept="image/*"
                onChange={(e) => setImageFiles(e.target.files)}
                className="hidden"
                id="file-upload-input"
              />
              <label
                htmlFor="file-upload-input"
                className="border border-dashed border-slate-200 dark:border-neutral-800 rounded-2xl p-6 text-center cursor-pointer hover:bg-slate-50 dark:hover:bg-neutral-800 transition-colors flex flex-col items-center gap-2 text-slate-400"
              >
                <IoCloudUploadOutline className="text-3xl text-brand-400" />
                <span className="text-xs font-semibold text-slate-600 dark:text-slate-300">
                  {imageFiles.length > 0 ? `${imageFiles.length} files selected` : 'Select Store Photos'}
                </span>
                <span className="text-[10px] text-slate-400">JPEG, PNG or WEBP up to 5MB</span>
              </label>
              
              <Button type="submit" isLoading={isUploading} variant="outline" className="w-full">
                Upload Assets
              </Button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RestaurantEdit;
