import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate, useLocation } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import { useEffect } from 'react';
import Profile from '../../pages/Profile';
import { supabase } from '../../lib/supabaseClient';
import NotificationBell from '../Notifications/NotificationBell';
import SupportCenter from '../Help/SupportCenter';


import { 
  Shield, 
  Upload, 
  FileText, 
  User,
  Menu,
  X
} from 'lucide-react';
import UserDropdown from './UserDropdown';
import { useTheme } from '../../contexts/ThemeContext';

export default function NavBar({ user }) {
  const [showUserDropdown, setShowUserDropdown] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { theme } = useTheme();
  const [profile, setProfile] = useState(null); // This line MUST exist
  const [showSupportModal, setShowSupportModal] = useState(false);


  const navItems = [
    { path: '/dashboard', label: 'Dashboard', icon: Shield },
    { path: '/upload', label: 'Upload', icon: Upload },
    { path: '/files', label: 'My Files', icon: FileText },
  ];

  const isActivePath = (path) => {
    if (path === '/dashboard') return location.pathname === '/';
    return location.pathname === path;
  };

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

  return (
    <>
      {/* 🔥 ENHANCED NAVBAR WITH COMPLETE THEME SUPPORT */}
      <nav className={`backdrop-blur-xl border-b shadow-2xl relative z-40 transition-all duration-300 ${
        theme === 'dark' 
          ? 'bg-slate-800/95 border-white/10 shadow-gray-900/20' 
          : 'bg-white/95 border-gray-200 shadow-gray-200/50'
      }`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="flex items-center space-x-3 cursor-pointer"
              onClick={() => navigate('/dashboard')}
            >
              <div className={`w-10 h-10 bg-gradient-to-r from-cyan-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg ${
                theme === 'dark' ? 'shadow-cyan-500/25' : 'shadow-cyan-500/30'
              }`}>
                <Shield className="w-6 h-6 text-white" />
              </div>
              <span className={`font-bold text-xl bg-gradient-to-r from-cyan-500 to-purple-600 bg-clip-text text-transparent ${
                theme === 'dark' ? 'drop-shadow-lg' : 'drop-shadow-sm'
              }`}>
                SecureVault
              </span>
            </motion.div>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center space-x-1">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = isActivePath(item.path);
                
                return (
                  <motion.button
                    key={item.path}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => navigate(item.path)}
                    className={`flex items-center space-x-2 px-4 py-2 rounded-xl font-medium transition-all duration-200 border ${
                      isActive
                        ? theme === 'dark'
                          ? 'bg-cyan-500/20 text-cyan-300 border-cyan-400/30 shadow-lg shadow-cyan-500/10'
                          : 'bg-cyan-500/15 text-cyan-600 border-cyan-400/40 shadow-lg shadow-cyan-500/15'
                        : theme === 'dark'
                          ? 'text-gray-300 hover:text-white hover:bg-white/10 border-transparent hover:border-white/20' 
                          : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100/80 border-transparent hover:border-gray-300'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span>{item.label}</span>
                  </motion.button>
                );
              })}
            </div>

      {/* Right Section */}
<div className="flex items-center space-x-3">

      <NotificationBell />

  {/* User Profile */}
  <motion.button
    whileHover={{ scale: 1.05 }}
    whileTap={{ scale: 0.95 }}
    onClick={() => setShowUserDropdown(!showUserDropdown)}
    className={`flex items-center space-x-3 backdrop-blur-lg rounded-2xl px-4 py-2 border transition-all duration-200 group shadow-lg ${
      theme === 'dark' 
        ? 'bg-white/10 border-white/20 hover:bg-white/15 text-white shadow-gray-900/30' 
        : 'bg-white/80 border-gray-300 hover:bg-white text-gray-900 shadow-gray-200/50'
    }`}
  >
    {/* Updated Avatar Section */}
    {profile?.profile_picture_url ? (
      <div className="w-8 h-8 rounded-full bg-gradient-to-r from-cyan-500 to-purple-600 overflow-hidden border border-white/20 shadow-md">
        <img 
          src={profile.profile_picture_url} 
          alt="Profile" 
          className="w-full h-full object-cover"
        />
      </div>
    ) : (
      <div className="w-8 h-8 bg-gradient-to-r from-cyan-500 to-purple-600 rounded-full flex items-center justify-center shadow-md">
        <User className="w-4 h-4 text-white" />
      </div>
    )}
    
    <span className={`font-medium hidden sm:block transition-colors ${
      theme === 'dark' 
        ? 'text-white group-hover:text-cyan-100' 
        : 'text-gray-900 group-hover:text-gray-700'
    }`}>
      {profile?.username || user?.user_metadata?.username || 'User'}
    </span>
  </motion.button>

              {/* Mobile Menu Button */}
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className={`md:hidden p-2 rounded-xl border transition-all duration-200 shadow-lg ${
                  theme === 'dark' 
                    ? 'bg-white/10 border-white/20 hover:bg-white/15 text-white shadow-gray-900/30' 
                    : 'bg-white/80 border-gray-300 hover:bg-white text-gray-900 shadow-gray-200/50'
                }`}
              >
                {mobileMenuOpen ? (
                  <X className="w-5 h-5" />
                ) : (
                  <Menu className="w-5 h-5" />
                )}
              </motion.button>
            </div>
          </div>

          {/* Mobile Menu */}
          <AnimatePresence>
            {mobileMenuOpen && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.3 }}
                className={`md:hidden border-t backdrop-blur-xl shadow-inner ${
                  theme === 'dark' 
                    ? 'border-white/10 bg-slate-800/95 shadow-gray-900/50' 
                    : 'border-gray-200 bg-white/95 shadow-gray-200/30'
                }`}
              >
                <div className="py-2 space-y-1">
                  {navItems.map((item) => {
                    const Icon = item.icon;
                    const isActive = isActivePath(item.path);
                    
                    return (
                      <motion.button
                        key={item.path}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -10 }}
                        transition={{ duration: 0.2 }}
                        whileHover={{ x: 4 }}
                        onClick={() => {
                          navigate(item.path);
                          setMobileMenuOpen(false);
                        }}
                        className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl font-medium transition-all duration-200 mx-2 ${
                          isActive
                            ? theme === 'dark'
                              ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-400/30'
                              : 'bg-cyan-500/15 text-cyan-600 border border-cyan-400/40'
                            : theme === 'dark'
                              ? 'text-gray-300 hover:text-white hover:bg-white/10' 
                              : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100/80'
                        }`}
                      >
                        <Icon className="w-4 h-4" />
                        <span>{item.label}</span>
                      </motion.button>
                    );
                  })}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

 {showUserDropdown && (
  <UserDropdown 
    user={user} 
    onClose={() => setShowUserDropdown(false)}
    onShowSupport={() => {
      setShowUserDropdown(false); // Close dropdown
      setShowSupportModal(true);  // Open support modal
    }}
  />
)}
      </nav>

      {/* Overlay */}
      {showUserDropdown && (
        <div 
          className="fixed inset-0 z-30"
          onClick={() => setShowUserDropdown(false)}
        />
      )}
      
{showSupportModal && (
  <SupportCenter onClose={() => setShowSupportModal(false)} />
)}
    </>
  );
}