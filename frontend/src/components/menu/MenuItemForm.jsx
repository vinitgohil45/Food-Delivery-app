import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useToast } from '../ui/Toast';
import { IoSaveOutline, IoCloudUploadOutline } from 'react-icons/io5';
import api from '../../services/api';
import Input from '../ui/Input';
import Button from '../ui/Button';
import { z } from 'zod';

const itemSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  description: z.string().max(300).optional(),
  price: z.coerce.number().min(0, 'Price must be positive'),
  discountPercent: z.coerce.number().min(0).max(100).optional(),
  category: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Select a valid category'),
  isVeg: z.coerce.boolean(),
  isJain: z.coerce.boolean().optional(),
  spicyLevel: z.enum(['none', 'low', 'medium', 'high']),
  averagePreparationTimeMin: z.coerce.number().min(1),
  ingredients: z.string().optional(),
  calories: z.coerce.number().min(0).optional(),
  proteinGrams: z.coerce.number().min(0).optional(),
  carbsGrams: z.coerce.number().min(0).optional(),
  fatsGrams: z.coerce.number().min(0).optional(),
  inventoryCount: z.coerce.number().min(0),
});

const MenuItemForm = ({ restaurantId, categories, editItem, onCancel, onRefresh }) => {
  const toast = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [imageFile, setImageFile] = useState(null);
  const [isUploading, setIsUploading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(itemSchema),
    defaultValues: editItem
      ? {
          name: editItem.name,
          description: editItem.description || '',
          price: editItem.price,
          discountPercent: editItem.discountPercent || 0,
          category: editItem.category._id || editItem.category,
          isVeg: editItem.isVeg,
          isJain: editItem.isJain || false,
          spicyLevel: editItem.spicyLevel || 'none',
          averagePreparationTimeMin: editItem.averagePreparationTimeMin || 20,
          ingredients: editItem.ingredients?.join(', ') || '',
          calories: editItem.nutrition?.calories || 0,
          proteinGrams: editItem.nutrition?.proteinGrams || 0,
          carbsGrams: editItem.nutrition?.carbsGrams || 0,
          fatsGrams: editItem.nutrition?.fatsGrams || 0,
          inventoryCount: editItem.inventoryCount || 99,
        }
      : {
          name: '',
          description: '',
          price: 150,
          discountPercent: 0,
          category: categories[0]?._id || '',
          isVeg: true,
          isJain: false,
          spicyLevel: 'none',
          averagePreparationTimeMin: 20,
          ingredients: '',
          calories: 120,
          proteinGrams: 5,
          carbsGrams: 20,
          fatsGrams: 4,
          inventoryCount: 99,
        },
  });

  const onSubmit = async (data) => {
    setIsSubmitting(true);
    try {
      let response;
      if (editItem) {
        response = await api.put(`/menu/${editItem._id}`, data);
      } else {
        response = await api.post('/menu', { ...data, restaurant: restaurantId });
      }

      if (response.data?.success) {
        const itemRecord = response.data.data;
        
        // Handle image upload if a file was selected
        if (imageFile) {
          setIsUploading(true);
          const formData = new FormData();
          formData.append('images', imageFile);
          await api.post(`/menu/${itemRecord._id}/upload-images`, formData, {
            headers: { 'Content-Type': 'multipart/form-data' },
          });
        }

        toast.success(`Menu item ${editItem ? 'updated' : 'added'} successfully!`);
        onRefresh();
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to save menu item');
    } finally {
      setIsSubmitting(false);
      setIsUploading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="p-6 rounded-3xl glass-card border border-slate-200/50 dark:border-white/5 shadow-premium flex flex-col gap-6">
      <h3 className="font-bold text-base text-brand-500 uppercase tracking-wider">
        {editItem ? 'Edit Menu Item' : 'Add New Menu Item'}
      </h3>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Input label="Dish Name" {...register('name')} error={errors.name} />
        <div>
          <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 block mb-1">Category</label>
          <select
            {...register('category')}
            className="w-full bg-white dark:bg-neutral-800 border border-slate-200 dark:border-neutral-700 p-2.5 rounded-2xl text-xs"
          >
            {categories.map((cat) => (
              <option key={cat._id} value={cat._id}>
                {cat.name}
              </option>
            ))}
          </select>
          {errors.category && <p className="text-[10px] text-rose-500 mt-1">{errors.category.message}</p>}
        </div>
      </div>

      <Input label="Description" {...register('description')} error={errors.description} />

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Input label="Base Price (₹)" type="number" {...register('price')} error={errors.price} />
        <Input label="Discount (%)" type="number" {...register('discountPercent')} error={errors.discountPercent} />
        <Input label="Stock Count" type="number" {...register('inventoryCount')} error={errors.inventoryCount} />
        <Input label="Prep Time (Min)" type="number" {...register('averagePreparationTimeMin')} error={errors.averagePreparationTimeMin} />
      </div>

      {/* Attributes */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 bg-slate-50 dark:bg-neutral-900/30 p-4 rounded-2xl">
        <div className="flex items-center gap-2">
          <input type="checkbox" id="isVeg-checkbox" {...register('isVeg')} className="rounded border-slate-300 text-brand-500" />
          <label htmlFor="isVeg-checkbox" className="text-xs font-semibold text-slate-600 dark:text-slate-300">Is Veg</label>
        </div>
        <div className="flex items-center gap-2">
          <input type="checkbox" id="isJain-checkbox" {...register('isJain')} className="rounded border-slate-300 text-brand-500" />
          <label htmlFor="isJain-checkbox" className="text-xs font-semibold text-slate-600 dark:text-slate-300">Is Jain Option</label>
        </div>
        <div>
          <label className="text-[10px] font-semibold text-slate-400 block mb-0.5">Spicy Level</label>
          <select
            {...register('spicyLevel')}
            className="w-full bg-white dark:bg-neutral-800 border border-slate-200 dark:border-neutral-700 px-2 py-1.5 rounded-xl text-xs"
          >
            <option value="none">None</option>
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
          </select>
        </div>
      </div>

      {/* Nutrition info */}
      <div className="flex flex-col gap-3">
        <h4 className="font-bold text-xs text-slate-400 uppercase tracking-wider">Nutrition Parameters</h4>
        <div className="grid grid-cols-4 gap-4">
          <Input label="Calories (kcal)" type="number" {...register('calories')} />
          <Input label="Protein (g)" type="number" {...register('proteinGrams')} />
          <Input label="Carbs (g)" type="number" {...register('carbsGrams')} />
          <Input label="Fats (g)" type="number" {...register('fatsGrams')} />
        </div>
      </div>

      {/* File Upload Selector */}
      <div className="flex flex-col gap-1.5">
        <label className="text-xs font-semibold text-slate-500 block">Dish Image Cover</label>
        <input
          type="file"
          accept="image/*"
          onChange={(e) => setImageFile(e.target.files[0])}
          className="hidden"
          id="item-file-upload"
        />
        <label
          htmlFor="item-file-upload"
          className="border border-dashed border-slate-200 dark:border-neutral-800 rounded-2xl p-4 text-center cursor-pointer hover:bg-slate-50 dark:hover:bg-neutral-800 transition-colors text-slate-400 flex items-center justify-center gap-2"
        >
          <IoCloudUploadOutline className="text-xl" />
          <span className="text-xs font-semibold">
            {imageFile ? imageFile.name : 'Select Cover Photo'}
          </span>
        </label>
      </div>

      <div className="flex justify-end gap-3 mt-4">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" isLoading={isSubmitting || isUploading} icon={<IoSaveOutline />}>
          Save Item
        </Button>
      </div>
    </form>
  );
};

export default MenuItemForm;
