import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabaseClient';
import { useTheme } from '../../contexts/ThemeContext';
import SupportCenter from '../Help/SupportCenter';


import {
  User, Settings, Shield, Bell, HelpCircle,
  LogOut, Moon, Sun, Globe, Download,
  FileText, Key, Mail
} from 'lucide-react';

export default function UserDropdown({ user, onClose, onShowSupport }) {
  const [isOpen, setIsOpen] = useState(true);
  const dropdownRef = useRef(null);
  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme();
  const [profile, setProfile] = useState(null);
  const [showSupportModal, setShowSupportModal] = useState(false);


  // ADD THIS USEEFFECT TO FETCH PROFILE DATA
  useEffect(() => {
    const fetchProfile = async () => {
      if (user) {
        try {
          const { data, error } = await supabase
            .from('profiles')
            .select('username, profile_picture_url')
            .eq('id', user.id)
            .single();
          
          if (!error && data) {
            setProfile(data);
          }
        } catch (error) {
          console.error('Failed to fetch profile:', error);
        }
      }
    };
    
    fetchProfile();
  }, [user]);

  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
        setTimeout(() => onClose(), 300);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [onClose]);

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      navigate('/login');
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  const menuItems = [
    {
      icon: User,
      label: 'View Profile',
      description: 'Manage your account settings',
      color: 'text-blue-400',
      bgColor: 'bg-blue-500/20',
      onClick: () => navigate('/profile')
    },
    {
      icon: Settings,
      label: 'Preferences',
      description: 'Theme, language, notifications',
      color: 'text-purple-400',
      bgColor: 'bg-purple-500/20',
      onClick: () => navigate('/profile?tab=preferences')
    },
    {
      icon: Shield,
      label: 'Security',
      description: '2FA, password, sessions',
      color: 'text-green-400',
      bgColor: 'bg-green-500/20',
      onClick: () => navigate('/profile?tab=security')
    },
    {
      icon: Download,
      label: 'Quick Actions',
      description: 'Bulk download, verification',
      color: 'text-cyan-400',
      bgColor: 'bg-cyan-500/20',
      onClick: () => navigate('/dashboard')
    },
    {
      icon: theme === 'dark' ? Sun : Moon,
      label: theme === 'dark' ? 'Light Mode' : 'Dark Mode',
      description: theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme',
      color: theme === 'dark' ? 'text-yellow-400' : 'text-indigo-400',
      bgColor: theme === 'dark' ? 'bg-yellow-500/20' : 'bg-indigo-500/20',
      onClick: toggleTheme
    },
 {
    icon: HelpCircle,
    label: 'Help & Support',
    description: 'Documentation, contact',
    color: 'text-orange-400',
    bgColor: 'bg-orange-500/20',
    onClick: onShowSupport  // Use the callback from parent
  }
  ];

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          ref={dropdownRef}
          initial={{ opacity: 0, scale: 0.95, y: -10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: -10 }}
          transition={{ duration: 0.2 }}
          className={`absolute top-16 right-4 w-80 backdrop-blur-xl rounded-2xl shadow-2xl border z-50 overflow-hidden ${
            theme === 'dark'
              ? 'bg-slate-800/95 border-white/10 shadow-gray-900/50'
              : 'bg-white/95 border-gray-200 shadow-gray-400/30'
          }`}
        >
          {/* User Header - FIXED: Removed duplicate username */}
          <div className={`p-4 border-b ${
            theme === 'dark' 
              ? 'border-white/10 bg-gradient-to-r from-slate-800/50 to-slate-700/30' 
              : 'border-gray-200 bg-gradient-to-r from-white/50 to-gray-50/30'
          }`}>
            <div className="flex items-center space-x-3">
              {/* Profile Picture */}
              {profile?.profile_picture_url ? (
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-cyan-500 to-purple-600 overflow-hidden border border-white/20 shadow-lg">
                  <img 
                    src={profile.profile_picture_url} 
                    alt="Profile" 
                    className="w-full h-full object-cover"
                  />
                </div>
              ) : (
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-cyan-500 to-purple-600 flex items-center justify-center shadow-lg">
                  <User className="w-6 h-6 text-white" />
                </div>
              )}
              
              {/* User Info - FIXED: Single username display */}
              <div className="flex-1 min-w-0">
                <p className={`font-semibold truncate ${
                  theme === 'dark' ? 'text-white' : 'text-gray-900'
                }`}>
                  {profile?.username || user?.user_metadata?.username || 'User'}
                </p>
                <p className={`text-sm truncate ${
                  theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                }`}>
                  {user?.email}
                </p>
              </div>
            </div>
          </div>

          {/* Menu Items */}
          <div className="p-2">
            {menuItems.map((item, index) => (
              <motion.button
                key={item.label}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
                whileHover={{ scale: 1.02, x: 4 }}
                whileTap={{ scale: 0.98 }}
                onClick={item.onClick}
                className={`w-full flex items-center space-x-3 p-3 rounded-xl text-left transition-all duration-200 group ${
                  theme === 'dark'
                    ? 'hover:bg-white/10'
                    : 'hover:bg-gray-100/80'
                }`}
              >
                <div className={`p-2 rounded-lg transition-colors ${item.bgColor} ${
                  theme === 'dark' 
                    ? 'group-hover:shadow-lg group-hover:shadow-white/5' 
                    : 'group-hover:shadow-md group-hover:shadow-gray-400/20'
                }`}>
                  <item.icon className={`w-4 h-4 ${item.color}`} />
                </div>
                <div className="flex-1">
                  <p className={`font-medium text-sm ${
                    theme === 'dark' ? 'text-white' : 'text-gray-900'
                  }`}>
                    {item.label}
                  </p>
                  <p className={`text-xs ${
                    theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                  }`}>
                    {item.description}
                  </p>
                </div>
              </motion.button>
            ))}
          </div>

          {/* Footer */}
          <div className={`p-3 border-t ${
            theme === 'dark' 
              ? 'border-white/10 bg-white/5' 
              : 'border-gray-200 bg-gray-100/50'
          }`}>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleLogout}
              className={`w-full flex items-center justify-center space-x-2 px-4 py-2 rounded-xl transition-all duration-200 group ${
                theme === 'dark'
                  ? 'bg-red-500/20 text-red-400 hover:bg-red-500/30 hover:text-red-300'
                  : 'bg-red-500/15 text-red-600 hover:bg-red-500/25 hover:text-red-700'
              }`}
            >
              <LogOut className="w-4 h-4" />
              <span className="font-medium">Sign Out</span>
            </motion.button>
          </div>
        </motion.div>
      )}
     
    </AnimatePresence>
  );
}