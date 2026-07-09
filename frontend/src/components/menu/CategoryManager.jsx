import React, { useState } from 'react';
import { IoAddOutline, IoTrashOutline, IoPencilOutline } from 'react-icons/io5';
import { useToast } from '../ui/Toast';
import api from '../../services/api';
import Input from '../ui/Input';
import Button from '../ui/Button';

const CategoryManager = ({ restaurantId, categories, onRefresh }) => {
  const toast = useToast();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!name.trim()) return;

    setIsSubmitting(true);
    try {
      const response = await api.post('/menu/category', {
        restaurant: restaurantId,
        name: name.trim(),
        description: description.trim(),
      });
      if (response.data?.success) {
        toast.success('Category added successfully!');
        setName('');
        setDescription('');
        onRefresh();
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to create category');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (categoryId) => {
    if (!window.confirm('Are you sure you want to delete this category?')) return;

    try {
      const response = await api.delete(`/menu/category/${categoryId}`);
      if (response.data?.success) {
        toast.success('Category deleted successfully!');
        onRefresh();
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to delete category (ensure it is empty first)');
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
      {/* List Categories */}
      <div className="md:col-span-2 p-6 rounded-3xl glass-card border border-slate-200/50 dark:border-white/5 shadow-premium flex flex-col gap-4">
        <h3 className="font-bold text-sm text-brand-500 uppercase tracking-wider">Active Categories</h3>
        
        {categories.length === 0 ? (
          <p className="text-xs text-slate-400 text-center py-6">No categories added yet.</p>
        ) : (
          <div className="flex flex-col gap-3">
            {categories.map((cat) => (
              <div key={cat._id} className="flex justify-between items-center p-4 rounded-2xl bg-white/40 dark:bg-neutral-900/40 border border-slate-200/35 dark:border-white/5">
                <div>
                  <h4 className="font-bold text-slate-800 dark:text-slate-100 text-sm">{cat.name}</h4>
                  {cat.description && <p className="text-[11px] text-slate-400 mt-0.5">{cat.description}</p>}
                </div>
                <button
                  onClick={() => handleDelete(cat._id)}
                  className="p-2 text-rose-500 hover:bg-rose-500/10 rounded-xl transition-colors"
                >
                  <IoTrashOutline className="text-base" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add Category Form */}
      <form onSubmit={handleCreate} className="p-6 rounded-3xl glass-card border border-slate-200/50 dark:border-white/5 shadow-premium flex flex-col gap-4">
        <h3 className="font-bold text-sm text-brand-500 uppercase tracking-wider">Create Category</h3>
        <Input
          label="Category Name"
          placeholder="e.g. Starters, Desserts"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <Input
          label="Description"
          placeholder="Optional category info"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />
        <Button type="submit" isLoading={isSubmitting} icon={<IoAddOutline />}>
          Add Category
        </Button>
      </form>
    </div>
  );
};

export default CategoryManager;
