import React, { useEffect, useState } from 'react';
import { useToast } from '../components/ui/Toast';
import {
  FolderOpen,
  ChefHat,
  Copy,
  Trash2,
  Pencil,
  Settings,
  Plus,
} from 'lucide-react';
import api from '../services/api';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';
import CategoryManager from '../components/menu/CategoryManager';
import MenuItemForm from '../components/menu/MenuItemForm';
import { motion } from 'framer-motion';
import { cn } from '../utils/cn';

const MenuDashboard = () => {
  const toast = useToast();
  const [restaurants, setRestaurants] = useState([]);
  const [selectedRestId, setSelectedRestId] = useState('');
  const [categories, setCategories] = useState([]);
  const [menuItems, setMenuItems] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('items'); // 'items' | 'categories'

  const [showForm, setShowForm] = useState(false);
  const [editItem, setEditItem] = useState(null);

  const fetchOwnersRestaurants = async () => {
    try {
      const response = await api.get('/restaurants/owner/all');
      if (response.data?.success) {
        setRestaurants(response.data.data);
        if (response.data.data.length > 0) {
          setSelectedRestId(response.data.data[0]._id);
        }
      }
    } catch (error) {
      toast.error('Failed to load restaurants');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchMenuData = async () => {
    if (!selectedRestId) return;
    try {
      const itemsRes = await api.get(`/menu?restaurant=${selectedRestId}`);
      if (itemsRes.data?.success) {
        setMenuItems(itemsRes.data.data.items);
        
        const catsMap = {};
        itemsRes.data.data.items.forEach(item => {
          if (item.category) {
            catsMap[item.category._id] = item.category;
          }
        });
        setCategories(Object.values(catsMap));
      }
    } catch (error) {
      toast.error('Failed to load menu list');
    }
  };

  useEffect(() => {
    fetchOwnersRestaurants();
  }, []);

  useEffect(() => {
    if (selectedRestId) {
      fetchMenuData();
    }
  }, [selectedRestId]);

  const handleDuplicate = async (itemId) => {
    try {
      const response = await api.post(`/menu/${itemId}/duplicate`);
      if (response.data?.success) {
        toast.success('Menu item duplicated successfully!');
        fetchMenuData();
      }
    } catch (error) {
      toast.error('Failed to duplicate item');
    }
  };

  const handleDelete = async (itemId) => {
    if (!window.confirm('Are you sure you want to delete this menu item?')) return;

    try {
      const response = await api.delete(`/menu/${itemId}`);
      if (response.data?.success) {
        toast.success('Menu item deleted');
        setMenuItems(prev => prev.filter(item => item._id !== itemId));
      }
    } catch (error) {
      toast.error('Failed to delete menu item');
    }
  };

  const handleToggleStatus = async (itemId, currentStatus) => {
    try {
      const response = await api.patch(`/menu/${itemId}/status`, {
        isAvailable: !currentStatus,
      });
      if (response.data?.success) {
        toast.success(`Dish is now ${!currentStatus ? 'available' : 'unavailable'}`);
        setMenuItems(prev =>
          prev.map(i => (i._id === itemId ? { ...i, isAvailable: !currentStatus } : i))
        );
      }
    } catch (error) {
      toast.error('Failed to toggle status');
    }
  };

  const handleUpdateStock = async (itemId) => {
    const currentStock = menuItems.find(i => i._id === itemId)?.inventoryCount || 0;
    const stockStr = window.prompt('Enter new stock count:', currentStock);
    if (stockStr === null) return;
    const count = parseInt(stockStr, 10);
    if (isNaN(count) || count < 0) {
      toast.error('Please enter a valid positive number');
      return;
    }

    try {
      const response = await api.patch(`/menu/${itemId}/inventory`, {
        inventoryCount: count,
      });
      if (response.data?.success) {
        toast.success('Inventory stock updated successfully');
        setMenuItems(prev =>
          prev.map(i => (i._id === itemId ? { ...i, inventoryCount: count, isAvailable: count > 0 ? i.isAvailable : false } : i))
        );
      }
    } catch (error) {
      toast.error('Failed to update stock count');
    }
  };

  if (isLoading) {
    return (
      <div className="h-[65vh] flex flex-col items-center justify-center">
        <div className="relative overflow-hidden bg-slate-200/80 dark:bg-neutral-800/70 before:absolute before:inset-0 before:-translate-x-full before:animate-[shimmer_2s_infinite] before:bg-gradient-to-r before:from-transparent before:via-white/20 dark:before:via-white/5 before:to-transparent w-12 h-12 rounded-2xl" />
      </div>
    );
  }

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="max-w-5xl mx-auto py-6 flex flex-col gap-6"
    >
      {/* Header Controls */}
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4 border-b border-slate-100 dark:border-white/5 pb-6 select-none">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-slate-800 dark:text-slate-100 flex items-center gap-2.5">
            <ChefHat className="text-brand-500 w-6.5 h-6.5" /> Catalog & Menu Management
          </h1>
          <p className="text-xs text-slate-400 dark:text-neutral-500 font-semibold mt-1">Configure your menu dishes, stock levels, and category headers.</p>
        </div>

        {restaurants.length > 0 && (
          <select
            value={selectedRestId}
            onChange={(e) => setSelectedRestId(e.target.value)}
            className="bg-white dark:bg-[#0c0c14] border border-slate-200/60 dark:border-white/5 px-4 py-2.5 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-300 focus:outline-none cursor-pointer"
          >
            {restaurants.map((r) => (
              <option key={r._id} value={r._id}>
                {r.name}
              </option>
            ))}
          </select>
        )}
      </div>

      {restaurants.length === 0 ? (
        <div className="p-12 text-center border border-dashed border-slate-200 dark:border-white/5 rounded-[24px] select-none font-semibold text-xs text-slate-400 dark:text-neutral-500">
          <p>Please register a restaurant outlet first to configure menu items.</p>
        </div>
      ) : showForm ? (
        <MenuItemForm
          restaurantId={selectedRestId}
          categories={categories}
          editItem={editItem}
          onCancel={() => {
            setShowForm(false);
            setEditItem(null);
          }}
          onRefresh={() => {
            setShowForm(false);
            setEditItem(null);
            fetchMenuData();
          }}
        />
      ) : (
        <div className="flex flex-col gap-6">
          {/* Navigation tabs */}
          <div className="flex border-b border-slate-100 dark:border-white/5 select-none">
            <button
              onClick={() => setActiveTab('items')}
              className={cn(
                "px-5 py-3 font-bold text-xs border-b-2 transition-all cursor-pointer",
                activeTab === 'items'
                  ? 'border-brand-500 text-brand-500'
                  : 'border-transparent text-slate-400 hover:text-slate-650'
              )}
            >
              Menu Items
            </button>
            <button
              onClick={() => setActiveTab('categories')}
              className={cn(
                "px-5 py-3 font-bold text-xs border-b-2 transition-all cursor-pointer",
                activeTab === 'categories'
                  ? 'border-brand-500 text-brand-500'
                  : 'border-transparent text-slate-400 hover:text-slate-650'
              )}
            >
              Categories Manager
            </button>
          </div>

          {activeTab === 'categories' ? (
            <CategoryManager
              restaurantId={selectedRestId}
              categories={categories}
              onRefresh={fetchMenuData}
            />
          ) : (
            <div className="flex flex-col gap-6">
              <div className="flex justify-end select-none">
                <Button
                  onClick={() => {
                    if (categories.length === 0) {
                      toast.info('Please add at least one category first.');
                      setActiveTab('categories');
                      return;
                    }
                    setShowForm(true);
                  }}
                  icon={<Plus className="w-4 h-4" />}
                >
                  Add Dish
                </Button>
              </div>

              {menuItems.length === 0 ? (
                <p className="text-xs text-slate-400 dark:text-neutral-550 text-center py-12 font-semibold select-none">No menu items listed yet.</p>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  {menuItems.map((item) => (
                    <Card key={item._id} className="flex flex-col justify-between gap-4 p-5 rounded-[24px] shadow-lg">
                      <div className="flex justify-between items-start gap-4">
                        <div className="flex items-start gap-3.5">
                          {item.image ? (
                            <img src={item.image} alt={item.name} className="h-14 w-14 rounded-xl object-cover" />
                          ) : (
                            <div className="h-14 w-14 bg-slate-50 dark:bg-white/5 rounded-xl flex items-center justify-center text-slate-400 text-lg select-none">
                              🍕
                            </div>
                          )}
                          <div>
                            <div className="flex items-center gap-2 select-none">
                              <span className={cn(
                                "w-2.5 h-2.5 border rounded-sm flex items-center justify-center",
                                item.isVeg ? 'border-emerald-500' : 'border-rose-500'
                              )}>
                                <span className={cn(
                                  "w-1.5 h-1.5 rounded-full",
                                  item.isVeg ? 'bg-emerald-500' : 'bg-rose-500'
                                )} />
                              </span>
                              <h4 className="font-extrabold text-slate-800 dark:text-slate-100 text-sm tracking-tight">{item.name}</h4>
                            </div>
                            <span className="text-[10px] font-black text-slate-400 dark:text-neutral-500 capitalize select-none">{item.category?.name}</span>
                            <div className="flex items-center gap-2 mt-1 select-none">
                              <span className="font-extrabold text-xs text-slate-800 dark:text-slate-150">₹{item.price}</span>
                              {item.discountPercent > 0 && (
                                <span className="text-[9px] font-extrabold text-emerald-500 bg-emerald-500/5 dark:bg-emerald-500/10 px-2 py-0.5 rounded">
                                  {item.discountPercent}% Off
                                </span>
                              )}
                            </div>
                            <p className="text-[10px] text-slate-400 dark:text-neutral-500 mt-2 font-bold flex items-center gap-1 select-none">
                              📦 Stock Level: <span className={cn("font-black", item.inventoryCount < 10 ? 'text-rose-500' : 'text-slate-600 dark:text-slate-350')}>{item.inventoryCount} left</span>
                            </p>
                          </div>
                        </div>
                      </div>

                      <div className="flex justify-end items-center gap-2.5 pt-3 border-t border-slate-100 dark:border-white/5 select-none">
                        <button
                          onClick={() => handleToggleStatus(item._id, item.isAvailable)}
                          className={cn(
                            "p-2 px-3 rounded-xl border flex items-center gap-1.5 text-[9px] font-black cursor-pointer active:scale-95 transition-all",
                            item.isAvailable
                              ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20'
                              : 'bg-slate-50 text-slate-400 border-slate-200 dark:bg-white/5 dark:border-white/10 dark:text-neutral-500'
                          )}
                        >
                          {item.isAvailable ? 'Available' : 'Disabled'}
                        </button>
                        <button
                          onClick={() => handleUpdateStock(item._id)}
                          className="p-2 px-3 border border-slate-200/60 dark:border-white/5 text-slate-500 dark:text-slate-405 hover:bg-slate-100/50 dark:hover:bg-white/10 rounded-xl transition-all text-[9px] font-black flex items-center gap-1.5 cursor-pointer active:scale-95"
                        >
                          <Settings className="w-3.5 h-3.5" /> Stock
                        </button>
                        <button
                          onClick={() => handleDuplicate(item._id)}
                          className="p-2 px-3 border border-slate-200/60 dark:border-white/5 text-slate-500 dark:text-slate-405 hover:bg-slate-100/50 dark:hover:bg-white/10 rounded-xl transition-all text-[9px] font-black flex items-center gap-1.5 cursor-pointer active:scale-95"
                        >
                          <Copy className="w-3.5 h-3.5" /> Clone
                        </button>
                        <button
                          onClick={() => {
                            setEditItem(item);
                            setShowForm(true);
                          }}
                          className="p-2 px-3.5 border border-slate-200/60 dark:border-white/5 text-slate-500 dark:text-slate-405 hover:bg-slate-100/50 dark:hover:bg-white/10 rounded-xl transition-all text-[9px] font-black cursor-pointer active:scale-95"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDelete(item._id)}
                          className="p-2 text-rose-500 hover:bg-rose-500/10 rounded-xl transition-colors cursor-pointer active:scale-90"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </motion.div>
  );
};

export default MenuDashboard;
