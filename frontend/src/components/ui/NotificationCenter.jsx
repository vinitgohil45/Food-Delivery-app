import React, { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  IoNotificationsOutline,
  IoCheckmarkDoneOutline,
  IoTrashOutline,
  IoSettingsOutline,
  IoCloseOutline,
  IoMailOutline,
  IoPhonePortraitOutline,
  IoAppsOutline,
} from 'react-icons/io5';
import { useSocket } from '../../context/SocketContext';
import { useToast } from './Toast';
import api from '../../services/api';
import Button from './Button';

const NotificationCenter = () => {
  const socket = useSocket();
  const toast = useToast();
  const [isOpen, setIsOpen] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [preferences, setPreferences] = useState({ email: true, inApp: true, push: true });
  const [filter, setFilter] = useState('all'); // 'all', 'unread'
  const dropdownRef = useRef(null);

  // Click outside listener
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Fetch notifications
  const fetchNotifications = async () => {
    try {
      const { data } = await api.get('/notifications?limit=30');
      if (data?.success && data.data) {
        setNotifications(data.data.notifications || []);
        setUnreadCount(data.data.unreadCount || 0);
      }
    } catch (e) {
      // Fail silently if unauthenticated
    }
  };

  // Fetch preferences
  const fetchPreferences = async () => {
    try {
      const { data } = await api.get('/auth/me');
      if (data?.success && data.data?.notificationPreferences) {
        setPreferences(data.data.notificationPreferences);
      }
    } catch (e) {
      // Fail silently
    }
  };

  useEffect(() => {
    fetchNotifications();
    fetchPreferences();
  }, []);

  // Listen for socket events
  useEffect(() => {
    if (!socket) return;

    const handleNewNotification = (newNotif) => {
      setNotifications((prev) => [newNotif, ...prev].slice(0, 30));
      setUnreadCount((c) => c + 1);
    };

    const handleReadNotification = ({ ids }) => {
      setNotifications((prev) =>
        prev.map((n) => (ids.includes(n._id) ? { ...n, isRead: true } : n))
      );
      setUnreadCount((c) => Math.max(0, c - ids.length));
    };

    const handleReadAllNotification = () => {
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      setUnreadCount(0);
    };

    const handleDeleteNotification = ({ id }) => {
      setNotifications((prev) => {
        const target = prev.find((n) => n._id === id);
        if (target && !target.isRead) {
          setUnreadCount((c) => Math.max(0, c - 1));
        }
        return prev.filter((n) => n._id !== id);
      });
    };

    socket.on('notification:new', handleNewNotification);
    socket.on('notification:read', handleReadNotification);
    socket.on('notification:read_all', handleReadAllNotification);
    socket.on('notification:delete', handleDeleteNotification);

    return () => {
      socket.off('notification:new', handleNewNotification);
      socket.off('notification:read', handleReadNotification);
      socket.off('notification:read_all', handleReadAllNotification);
      socket.off('notification:delete', handleDeleteNotification);
    };
  }, [socket]);

  const handleMarkRead = async (id) => {
    try {
      await api.patch('/notifications/read', { id });
      setNotifications((prev) =>
        prev.map((n) => (n._id === id ? { ...n, isRead: true } : n))
      );
      setUnreadCount((c) => Math.max(0, c - 1));
    } catch (e) {
      toast.error('Failed to mark notification as read');
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await api.patch('/notifications/read-all');
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      setUnreadCount(0);
      toast.success('All notifications marked as read');
    } catch (e) {
      toast.error('Failed to mark all as read');
    }
  };

  const handleDelete = async (e, id) => {
    e.stopPropagation();
    try {
      await api.delete(`/notifications/${id}`);
      const target = notifications.find((n) => n._id === id);
      if (target && !target.isRead) {
        setUnreadCount((c) => Math.max(0, c - 1));
      }
      setNotifications((prev) => prev.filter((n) => n._id !== id));
      toast.success('Notification deleted');
    } catch (e) {
      toast.error('Failed to delete notification');
    }
  };

  const togglePreference = async (key) => {
    const updated = { ...preferences, [key]: !preferences[key] };
    setPreferences(updated);
    try {
      await api.put('/notifications/preferences', updated);
      toast.success('Notification channels updated');
    } catch (e) {
      toast.error('Failed to save settings');
    }
  };

  const displayedNotifications = notifications.filter((n) =>
    filter === 'all' ? true : !n.isRead
  );

  return (
    <div ref={dropdownRef} className="relative z-40">
      {/* Bell Trigger Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-10 h-10 rounded-full bg-white dark:bg-neutral-850 hover:bg-slate-50 dark:hover:bg-neutral-850 text-slate-700 dark:text-slate-200 flex items-center justify-center border border-slate-200/40 dark:border-white/5 shadow-sm transition-all relative"
        aria-label="View notifications"
      >
        <IoNotificationsOutline className="text-xl" />
        {unreadCount > 0 && (
          <span className="absolute top-2 right-2.5 w-2 h-2 rounded-full bg-rose-500 animate-ping" />
        )}
        {unreadCount > 0 && (
          <span className="absolute top-2 right-2.5 w-2 h-2 rounded-full bg-rose-500" />
        )}
      </button>

      {/* Floating Center Card Dropdown */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="absolute right-0 mt-3 w-80 sm:w-96 rounded-[28px] bg-white dark:bg-neutral-900 border border-slate-200/50 dark:border-white/5 shadow-premium overflow-hidden flex flex-col max-h-[500px]"
          >
            {/* Header controls */}
            <div className="p-4 border-b border-slate-100 dark:border-neutral-800/45 flex justify-between items-center bg-slate-50/50 dark:bg-neutral-950/30">
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-black text-slate-800 dark:text-slate-200">Alert Center</span>
                {unreadCount > 0 && (
                  <span className="text-[9px] font-black bg-rose-500 text-white px-2 py-0.5 rounded-full shrink-0">
                    {unreadCount} New
                  </span>
                )}
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowSettings(!showSettings)}
                  className={`text-sm p-1 rounded-lg transition-colors ${
                    showSettings
                      ? 'text-brand-500 bg-brand-50 dark:bg-brand-950/20'
                      : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-350'
                  }`}
                  title="Notification Preferences"
                >
                  <IoSettingsOutline />
                </button>
                {unreadCount > 0 && (
                  <button
                    onClick={handleMarkAllRead}
                    className="text-xs font-bold text-brand-500 hover:text-brand-600 flex items-center gap-0.5"
                    title="Mark all read"
                  >
                    <IoCheckmarkDoneOutline className="text-sm" />
                    <span className="hidden sm:inline">Mark all read</span>
                  </button>
                )}
              </div>
            </div>

            {/* Inner Content Block */}
            <div className="flex-1 overflow-y-auto min-h-[300px]">
              <AnimatePresence mode="wait">
                {showSettings ? (
                  /* Settings pane */
                  <motion.div
                    key="settings"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="p-5 flex flex-col gap-4"
                  >
                    <div className="flex justify-between items-center mb-1">
                      <h4 className="text-xs font-black text-slate-700 dark:text-slate-200 uppercase tracking-widest">
                        Dispatch Channels
                      </h4>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setShowSettings(false)}
                        className="p-1 rounded-full text-slate-400"
                      >
                        <IoCloseOutline className="text-lg" />
                      </Button>
                    </div>

                    <div className="flex flex-col gap-3">
                      <div className="flex justify-between items-center p-3 rounded-2xl bg-slate-50 dark:bg-neutral-850/40">
                        <span className="flex items-center gap-2 text-xs font-bold text-slate-700 dark:text-slate-250">
                          <IoAppsOutline className="text-base text-slate-450" /> In-App Feed Alerts
                        </span>
                        <input
                          type="checkbox"
                          checked={preferences.inApp}
                          onChange={() => togglePreference('inApp')}
                          className="w-4 h-4 rounded text-brand-500 focus:ring-brand-500 cursor-pointer"
                        />
                      </div>

                      <div className="flex justify-between items-center p-3 rounded-2xl bg-slate-50 dark:bg-neutral-850/40">
                        <span className="flex items-center gap-2 text-xs font-bold text-slate-700 dark:text-slate-250">
                          <IoMailOutline className="text-base text-slate-450" /> Email Notifications
                        </span>
                        <input
                          type="checkbox"
                          checked={preferences.email}
                          onChange={() => togglePreference('email')}
                          className="w-4 h-4 rounded text-brand-500 focus:ring-brand-500 cursor-pointer"
                        />
                      </div>

                      <div className="flex justify-between items-center p-3 rounded-2xl bg-slate-50 dark:bg-neutral-850/40">
                        <span className="flex items-center gap-2 text-xs font-bold text-slate-700 dark:text-slate-250">
                          <IoPhonePortraitOutline className="text-base text-slate-450" /> PWA Push Notifications
                        </span>
                        <input
                          type="checkbox"
                          checked={preferences.push}
                          onChange={() => togglePreference('push')}
                          className="w-4 h-4 rounded text-brand-500 focus:ring-brand-500 cursor-pointer"
                        />
                      </div>
                    </div>
                  </motion.div>
                ) : (
                  /* Alerts List pane */
                  <motion.div
                    key="list"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="flex flex-col"
                  >
                    {/* Filters tabs */}
                    <div className="flex gap-2 p-3 border-b border-slate-100 dark:border-neutral-800/40 text-[10px] font-bold uppercase tracking-widest text-slate-400">
                      <button
                        onClick={() => setFilter('all')}
                        className={`px-3 py-1 rounded-full ${
                          filter === 'all' ? 'bg-slate-105 dark:bg-neutral-800 text-slate-800 dark:text-white' : ''
                        }`}
                      >
                        All ({notifications.length})
                      </button>
                      <button
                        onClick={() => setFilter('unread')}
                        className={`px-3 py-1 rounded-full ${
                          filter === 'unread' ? 'bg-slate-105 dark:bg-neutral-800 text-slate-800 dark:text-white' : ''
                        }`}
                      >
                        Unread ({unreadCount})
                      </button>
                    </div>

                    {displayedNotifications.length === 0 ? (
                      <div className="flex flex-col items-center justify-center gap-2 py-16 text-slate-400">
                        <span className="text-4xl">🔔</span>
                        <p className="text-xs font-bold">No active notifications</p>
                      </div>
                    ) : (
                      <div className="flex flex-col divide-y divide-slate-100 dark:divide-neutral-800/40">
                        {displayedNotifications.map((notif) => (
                          <div
                            key={notif._id}
                            onClick={() => !notif.isRead && handleMarkRead(notif._id)}
                            className={`p-4 flex gap-3 transition-colors cursor-pointer relative ${
                              !notif.isRead
                                ? 'bg-brand-50/20 dark:bg-brand-950/5 hover:bg-brand-50/40 dark:hover:bg-brand-950/10'
                                : 'hover:bg-slate-50 dark:hover:bg-neutral-850/40'
                            }`}
                          >
                            {/* Unread circle */}
                            {!notif.isRead && (
                              <span className="absolute left-2 top-5 w-1.5 h-1.5 rounded-full bg-brand-500" />
                            )}
                            
                            <div className="flex-1 flex flex-col gap-1 pl-1">
                              <h5 className="text-xs font-black text-slate-800 dark:text-slate-100 leading-tight">
                                {notif.title}
                              </h5>
                              <p className="text-[10px] text-slate-500 dark:text-slate-400 leading-relaxed font-semibold">
                                {notif.message}
                              </p>
                              <span className="text-[8px] text-slate-400 dark:text-neutral-500 font-extrabold mt-1">
                                {new Date(notif.createdAt).toLocaleTimeString(undefined, {
                                  hour: '2-digit',
                                  minute: '2-digit',
                                })}
                              </span>
                            </div>

                            <button
                              onClick={(e) => handleDelete(e, notif._id)}
                              className="text-slate-400 hover:text-rose-500 self-center p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-neutral-850"
                              title="Delete notification"
                            >
                              <IoTrashOutline className="text-xs sm:text-sm" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default NotificationCenter;
