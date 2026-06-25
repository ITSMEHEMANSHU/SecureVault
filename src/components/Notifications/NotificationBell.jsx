import React, { useState, useEffect, useRef,  useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, Check, ExternalLink, AlertCircle, CheckCircle, Info, AlertTriangle } from 'lucide-react';
import { supabase } from '../../lib/supabaseClient';
import { useTheme } from '../../contexts/ThemeContext';
import { useNotificationPreferences } from '../../contexts/NotificationPreferencesContext';

export default function NotificationBell() {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const { preferences, loading, updatePreferences } = useNotificationPreferences();
  const dropdownRef = useRef(null);
  const { theme } = useTheme();

    const refreshNotifications = useCallback(async () => {
    if (loading || !preferences.badge_enabled) return;
    
    console.log('🔄 Manually refreshing notifications...');
    await fetchNotifications();
  }, [loading, preferences.badge_enabled]);

    useEffect(() => {
    window.refreshNotifications = refreshNotifications;
    return () => {
      delete window.refreshNotifications;
    };
  }, [refreshNotifications]);

  // Fetch notifications and setup real-time - only if badges are enabled
  useEffect(() => {
    if (loading) return;

    console.log('🔔 NotificationBell - Badges enabled:', preferences.badge_enabled);
    
    if (preferences.badge_enabled) {
      fetchNotifications();
      setupRealtime();
    } else {
      setNotifications([]);
    }

    async function setupRealtime() {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const subscription = supabase
          .channel('notifications')
          .on(
            'postgres_changes',
            {
              event: 'INSERT',
              schema: 'public',
              table: 'notifications',
              filter: `user_id=eq.${user.id}`
            },
            (payload) => {
              console.log('🔄 Real-time notification received:', payload.new);
              if (preferences.badge_enabled) {
                setNotifications(prev => [payload.new, ...prev]);
              }
              
              if (preferences.push_enabled && Notification.permission === 'granted') {
                new Notification(payload.new.title, {
                  body: payload.new.message,
                  icon: '/favicon.ico',
                  tag: payload.new.id
                });
              }
            }
          )
          .on(
            'postgres_changes',
            {
              event: 'UPDATE',
              schema: 'public',
              table: 'notifications',
              filter: `user_id=eq.${user.id}`
            },
            (payload) => {
              console.log('🔄 Real-time notification updated:', payload.new);
              if (preferences.badge_enabled) {
                setNotifications(prev =>
                  prev.map(notif =>
                    notif.id === payload.new.id ? payload.new : notif
                  )
                );
              }
            }
          )
          .subscribe();

        return () => {
          subscription.unsubscribe();
        };
      } catch (error) {
        console.error('❌ Failed to setup real-time:', error);
      }
    }
  }, [preferences, loading]);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const fetchNotifications = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const response = await fetch(`http://localhost:5000/api/notifications/${user.id}`);
      
      if (!response.ok) return;
      
      const result = await response.json();
      if (result.success) {
        setNotifications(result.notifications || []);
      }
    } catch (error) {
      console.error('❌ Failed to fetch notifications:', error);
    }
  };

  const markAsRead = async (notificationId) => {
    try {
      const response = await fetch(`http://localhost:5000/api/notifications/${notificationId}/read`, {
        method: 'PUT'
      });

      if (response.ok) {
        setNotifications(prev => 
          prev.map(notif => 
            notif.id === notificationId 
              ? { ...notif, read: true, read_at: new Date().toISOString() }
              : notif
          )
        );
      }
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
    }
  };

  const markAllAsRead = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const response = await fetch(`http://localhost:5000/api/notifications/${user.id}/read-all`, {
        method: 'PUT'
      });

      if (response.ok) {
        setNotifications(prev => 
          prev.map(notif => ({ ...notif, read: true, read_at: new Date().toISOString() }))
        );
      }
    } catch (error) {
      console.error('Failed to mark all as read:', error);
    }
  };

  const requestNotificationPermission = async () => {
    if ('Notification' in window) {
      const permission = await Notification.requestPermission();
      
      if (permission === 'granted') {
        const success = await updatePreferences({ push_enabled: true });
        
        if (success) {
          const { data: { user } } = await supabase.auth.getUser();
          if (user) {
            await fetch('http://localhost:5000/api/notifications', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                userId: user.id,
                title: 'Push Notifications Enabled',
                message: 'You will now receive browser notifications for important updates.',
                type: 'success'
              })
            });
          }
          alert('Push notifications enabled! You will receive browser notifications.');
        }
      } else {
        await updatePreferences({ push_enabled: false });
        alert('Push notifications were denied. You can enable them in your browser settings.');
      }
    } else {
      alert('Your browser does not support push notifications.');
    }
  };

  const toggleBadgeNotifications = async () => {
    const success = await updatePreferences({ badge_enabled: !preferences.badge_enabled });
    
    if (success) {
      if (!preferences.badge_enabled) {
        setNotifications([]);
      } else {
        fetchNotifications();
      }
    }
  };

  // Don't show anything if loading
  if (loading) {
    return (
      <div className={`p-2 rounded-xl border ${
        theme === 'dark'
          ? 'bg-white/10 border-white/20'
          : 'bg-white/80 border-gray-300'
      }`}>
        <Bell className="w-5 h-5 animate-pulse" />
      </div>
    );
  }

  const unreadCount = preferences.badge_enabled 
    ? notifications.filter(n => !n.read).length 
    : 0;

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'success': return CheckCircle;
      case 'warning': return AlertTriangle;
      case 'error': return AlertCircle;
      default: return Info;
    }
  };

  const getNotificationColor = (type) => {
    switch (type) {
      case 'success': return 'text-green-400';
      case 'warning': return 'text-yellow-400';
      case 'error': return 'text-red-400';
      default: return 'text-blue-400';
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Notification Bell */}
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setIsOpen(!isOpen)}
        className={`relative p-2 rounded-xl border transition-all duration-200 ${
          theme === 'dark'
            ? 'bg-white/10 border-white/20 hover:bg-white/15 text-white'
            : 'bg-white/80 border-gray-300 hover:bg-white text-gray-700'
        }`}
      >
        <Bell className="w-5 h-5" />
        {preferences.badge_enabled && unreadCount > 0 && (
          <motion.span
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className={`absolute -top-1 -right-1 w-5 h-5 text-xs rounded-full flex items-center justify-center ${
              theme === 'dark' ? 'bg-red-500 text-white' : 'bg-red-500 text-white'
            }`}
          >
            {unreadCount > 9 ? '9+' : unreadCount}
          </motion.span>
        )}
      </motion.button>

      {/* Notifications Dropdown */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -10 }}
            transition={{ duration: 0.2 }}
            className={`absolute top-12 right-0 w-96 max-h-96 overflow-auto backdrop-blur-xl rounded-2xl shadow-2xl border z-50 ${
              theme === 'dark'
                ? 'bg-slate-800/95 border-white/10 shadow-gray-900/50'
                : 'bg-white/95 border-gray-200 shadow-gray-400/30'
            }`}
          >
            {/* Header */}
            <div className={`p-4 border-b ${
              theme === 'dark' ? 'border-white/10' : 'border-gray-200'
            }`}>
              <div className="flex items-center justify-between">
                <h3 className={`font-semibold ${
                  theme === 'dark' ? 'text-white' : 'text-gray-900'
                }`}>
                  Notifications
                  {preferences.badge_enabled && unreadCount > 0 && (
                    <span className={`ml-2 px-2 py-1 text-xs rounded-full ${
                      theme === 'dark'
                        ? 'bg-cyan-500/20 text-cyan-400'
                        : 'bg-cyan-500/15 text-cyan-600'
                    }`}>
                      {unreadCount} new
                    </span>
                  )}
                </h3>
                <div className="flex space-x-2">
                  {preferences.badge_enabled && unreadCount > 0 && (
                    <button
                      onClick={markAllAsRead}
                      className={`text-xs px-2 py-1 rounded-lg ${
                        theme === 'dark'
                          ? 'hover:bg-white/10 text-gray-400'
                          : 'hover:bg-gray-100 text-gray-600'
                      }`}
                    >
                      Mark all read
                    </button>
                  )}
                  <button
                    onClick={() => setIsOpen(false)}
                    className={`text-xs px-2 py-1 rounded-lg ${
                      theme === 'dark'
                        ? 'hover:bg-white/10 text-gray-400'
                        : 'hover:bg-gray-100 text-gray-600'
                    }`}
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>

            {/* Settings Section */}
            <div className={`p-3 border-b ${
              theme === 'dark' ? 'border-white/10 bg-white/5' : 'border-gray-200 bg-gray-50'
            }`}>
              <div className="flex items-center justify-between text-sm mb-2">
                <span className={theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}>
                  Show badges
                </span>
                <button
                  onClick={toggleBadgeNotifications}
                  className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
                    preferences.badge_enabled ? 'bg-cyan-500' : 'bg-gray-600'
                  }`}
                >
                  <span
                    className={`inline-block h-3 w-3 transform rounded-full bg-white transition-transform ${
                      preferences.badge_enabled ? 'translate-x-5' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>
              
              <div className="flex items-center justify-between text-sm">
                <span className={theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}>
                  Push notifications
                </span>
                <button
                  onClick={requestNotificationPermission}
                  className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
                    preferences.push_enabled ? 'bg-green-500' : 'bg-gray-600'
                  }`}
                >
                  <span
                    className={`inline-block h-3 w-3 transform rounded-full bg-white transition-transform ${
                      preferences.push_enabled ? 'translate-x-5' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>
            </div>

            {/* Notifications List */}
            <div className="max-h-80 overflow-auto">
              {!preferences.badge_enabled ? (
                <div className="p-8 text-center">
                  <Bell className={`w-12 h-12 mx-auto mb-4 ${
                    theme === 'dark' ? 'text-gray-600' : 'text-gray-400'
                  }`} />
                  <p className={theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}>
                    Notifications are disabled
                  </p>
                </div>
              ) : notifications.length === 0 ? (
                <div className="p-8 text-center">
                  <Bell className={`w-12 h-12 mx-auto mb-4 ${
                    theme === 'dark' ? 'text-gray-600' : 'text-gray-400'
                  }`} />
                  <p className={theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}>
                    No notifications yet
                  </p>
                </div>
              ) : (
                notifications.map((notification) => {
                  const IconComponent = getNotificationIcon(notification.type);
                  return (
                    <motion.div
                      key={notification.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      className={`p-4 border-b ${
                        theme === 'dark' 
                          ? 'border-white/5 hover:bg-white/5' 
                          : 'border-gray-100 hover:bg-gray-50/80'
                      } ${!notification.read ? (
                        theme === 'dark' 
                          ? 'bg-blue-500/10' 
                          : 'bg-blue-50'
                      ) : ''}`}
                    >
                      <div className="flex items-start space-x-3">
                        <div className={`p-2 rounded-lg ${
                          theme === 'dark' ? 'bg-white/10' : 'bg-gray-100'
                        }`}>
                          <IconComponent className={`w-4 h-4 ${getNotificationColor(notification.type)}`} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className={`font-medium text-sm ${
                            theme === 'dark' ? 'text-white' : 'text-gray-900'
                          }`}>
                            {notification.title}
                          </p>
                          <p className={`text-xs mt-1 ${
                            theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                          }`}>
                            {notification.message}
                          </p>
                          <p className={`text-xs mt-2 ${
                            theme === 'dark' ? 'text-gray-500' : 'text-gray-500'
                          }`}>
                            {new Date(notification.created_at).toLocaleDateString()}
                          </p>
                        </div>
                        <div className="flex space-x-1">
                          {!notification.read && (
                            <button
                              onClick={() => markAsRead(notification.id)}
                              className={`p-1 rounded ${
                                theme === 'dark'
                                  ? 'hover:bg-white/10 text-gray-400'
                                  : 'hover:bg-gray-200 text-gray-500'
                              }`}
                            >
                              <Check className="w-3 h-3" />
                            </button>
                          )}
                          {notification.action_url && (
                            <a
                              href={notification.action_url}
                              className={`p-1 rounded ${
                                theme === 'dark'
                                  ? 'hover:bg-white/10 text-gray-400'
                                  : 'hover:bg-gray-200 text-gray-500'
                              }`}
                            >
                              <ExternalLink className="w-3 h-3" />
                            </a>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  );
                })
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}