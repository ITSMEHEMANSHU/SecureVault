import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import { useTheme } from '../contexts/ThemeContext';
import AvatarCropper from '../components/AvatarCropper';
import { useNotificationPreferences } from '../contexts/NotificationPreferencesContext';
import { useRef } from 'react';
import { useSearchParams } from 'react-router-dom';


// Add these imports at the top
import Enable2FA from '../components/Enable2FA';
import ResetPassword from '../components/ResetPassword';
import ActiveSessions from '../components/Security/ActiveSessions';
import LoginHistory from '../components/Security/LoginHistory';
import ExportData from '../components/DataManagement/ExportData';
// import ClearTempFiles from '../components/DataManagement/ClearTempFiles';

import {
  User, Mail, Calendar, Upload, Database, Shield,
  Download, Settings, Bell, Globe, Moon, Key,
  LogOut, Camera, Edit3, Check, X, Trash2,
  Smartphone, Clock, ShieldCheck, Sun
} from 'lucide-react';

export default function Profile() {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [metrics, setMetrics] = useState({
    totalFiles: 0,
    storageUsed: 0,
    verifiedFiles: 0
  });
    const [searchParams] = useSearchParams();

  const [activeTab, setActiveTab] = useState('profile');
  const [loading, setLoading] = useState(true);
  const [editingField, setEditingField] = useState(null);
  const [editValue, setEditValue] = useState('');
  const { theme, toggleTheme } = useTheme();
  const { preferences, updatePreferences } = useNotificationPreferences();

  const navigate = useNavigate();
  const [uploading, setUploading] = useState(false);
  const [croppingImage, setCroppingImage] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const fileInputRef = useRef(null);

    const [show2FAModal, setShow2FAModal] = useState(false);
  const [showSessionsModal, setShowSessionsModal] = useState(false);
const [showLoginHistoryModal, setShowLoginHistoryModal] = useState(false);
const [showExportModal, setShowExportModal] = useState(false);
  const [showClearTempModal, setShowClearTempModal] = useState(false);

  const [twoFAEnabled, setTwoFAEnabled] = useState(false);

   useEffect(() => {
    const tab = searchParams.get('tab');
    if (tab && ['profile', 'security', 'preferences', 'quick-actions'].includes(tab)) {
      setActiveTab(tab);
    }
  }, [searchParams]);


  useEffect(() => {
    const fetchUserData = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
      
      if (user) {
        await fetchProfile(user.id);
        await fetchUserMetrics(user.id);
      }
    };

    
    fetchUserData();
  }, []); // Fixed: Added empty dependency array

  // Load user's saved theme preference
  useEffect(() => {
    const loadUserTheme = async () => {
      if (user && profile?.theme_preference) {
        const savedTheme = profile.theme_preference;
        const currentTheme = theme;
        
        if (savedTheme !== currentTheme) {
          console.log(`User's saved theme: ${savedTheme}, current: ${currentTheme}`);
        }
      }
    };
    
    loadUserTheme();
  }, [user, profile, theme]);

  useEffect(() => {
  check2FAStatus();
}, [user]);

const check2FAStatus = async () => {
  if (!user) return;
  
  try {
    const { data: factors, error } = await supabase.auth.mfa.listFactors();
    if (!error && factors.totp && factors.totp.length > 0) {
      setTwoFAEnabled(true);
    } else {
      setTwoFAEnabled(false);
    }
  } catch (error) {
    console.error('Error checking 2FA status:', error);
    setTwoFAEnabled(false);
  }
};

  // CORRECTED: Moved handlePushNotificationToggle outside of useEffect
  const handlePushNotificationToggle = async () => {
    if (!preferences.push_enabled) {
      const permission = await Notification.requestPermission();
      if (permission === 'granted') {
        const success = await updatePreferences({ push_enabled: true });
        if (success) {
          alert('Push notifications enabled! You will receive browser alerts.');
        }
      } else {
        alert('Push notifications were denied. You can enable them in your browser settings.');
      }
    } else {
      const success = await updatePreferences({ push_enabled: false });
      if (success) {
        alert('Push notifications disabled. You will no longer receive browser alerts.');
      }
    }
  };

  const fetchProfile = async (userId) => {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();
    
    if (!error && data) {
      setProfile(data);
    }
    setLoading(false);
  };

  const fetchUserMetrics = async (userId) => {
    const { data: files, error } = await supabase
      .from('files')
      .select('id, size, blockchain_transactions(status)')
      .eq('user_id', userId);

    if (!error && files) {
      const totalFiles = files.length;
      const storageUsed = files.reduce((acc, file) => acc + (file.size || 0), 0);
      const verifiedFiles = files.filter(file => 
        file.blockchain_transactions && 
        file.blockchain_transactions.length > 0 &&
        file.blockchain_transactions[0].status === 'verified'
      ).length;

      setMetrics({ totalFiles, storageUsed, verifiedFiles });
    }
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const handleSaveEdit = async (field) => {
    if (!user || !editValue.trim()) return;

    try {
      // Validate username
      if (field === 'username') {
        if (editValue.length < 3) {
          alert('Username must be at least 3 characters long');
          return;
        }
        if (editValue.length > 30) {
          alert('Username must be less than 30 characters');
          return;
        }
        // Check if username contains only allowed characters
        if (!/^[a-zA-Z0-9_-]+$/.test(editValue)) {
          alert('Username can only contain letters, numbers, underscores, and hyphens');
          return;
        }
      }

      setLoading(true);

      // Update in Supabase
      const { data, error } = await supabase
        .from('profiles')
        .update({ [field]: editValue.trim() })
        .eq('id', user.id)
        .select();

      if (error) {
        if (error.code === '23505') { // Unique constraint violation
          throw new Error('This username is already taken. Please choose another one.');
        }
        throw error;
      }

      // Update local state
      setProfile(prev => ({ ...prev, [field]: editValue.trim() }));
      setEditingField(null);
      setEditValue('');
      
      // Show success message
      alert(`${field === 'username' ? 'Username' : 'Email'} updated successfully!`);

    } catch (error) {
      console.error('❌ Error updating profile:', error);
      alert(`Failed to update ${field}: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleCancelEdit = () => {
    setEditingField(null);
    setEditValue('');
  };

  const startEditing = (field, currentValue) => {
    if (loading) return; // Prevent editing while loading
    setEditingField(field);
    setEditValue(currentValue || '');
  };

  // Enhanced theme toggle that saves to database
  const handleThemeToggle = async () => {
    const newTheme = theme === 'dark' ? 'light' : 'dark';
    
    try {
      if (user) {
        const { error } = await supabase
          .from('profiles')
          .update({ theme_preference: newTheme })
          .eq('id', user.id);

        if (error) {
          console.error('Failed to save theme preference:', error);
        } else {
          console.log('Theme preference saved to database:', newTheme);
          setProfile(prev => ({ ...prev, theme_preference: newTheme }));
        }
      }
      
      toggleTheme();
      
    } catch (error) {
      console.error('Error updating theme:', error);
      toggleTheme();
    }
  };

  const handleAvatarClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileSelect = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    // Validate file type and size
    if (!file.type.startsWith('image/')) {
      alert('Please select an image file (JPEG, PNG, etc.)');
      return;
    }
    
    if (file.size > 5 * 1024 * 1024) {
      alert('Please select an image smaller than 5MB');
      return;
    }

    // Show cropper instead of uploading directly
    const imageUrl = URL.createObjectURL(file);
    setSelectedFile(file);
    setCroppingImage(imageUrl);
  };

  const handleSaveCroppedImage = async (croppedBlob) => {
    setUploading(true);
    
    try {
      const formData = new FormData();
      formData.append('avatar', croppedBlob, 'avatar.jpg');

      console.log('📤 Uploading cropped profile picture...');
      
      const response = await fetch(`http://localhost:5000/api/profile/${user.id}/avatar`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Server error: ${response.status} - ${errorText}`);
      }

      const result = await response.json();

      if (result.success) {
        setProfile(result.profile);
        alert('Profile picture updated successfully!');
      } else {
        throw new Error(result.error || 'Unknown error');
      }
    } catch (error) {
      console.error('❌ Failed to upload profile picture:', error);
      alert('Failed to upload profile picture: ' + error.message);
    } finally {
      setUploading(false);
      setCroppingImage(null);
      setSelectedFile(null);
      // Clean up object URL
      if (croppingImage) {
        URL.revokeObjectURL(croppingImage);
      }
    }
  };

  const handleCancelCrop = () => {
    setCroppingImage(null);
    setSelectedFile(null);
    if (croppingImage) {
      URL.revokeObjectURL(croppingImage);
    }
  };

  const handleRemoveAvatar = async () => {
    if (!confirm('Are you sure you want to remove your profile picture?')) return;

    try {
      const response = await fetch(`http://localhost:5000/api/profile/${user.id}/avatar`, {
        method: 'DELETE',
      });

      const result = await response.json();

      if (result.success) {
        setProfile(result.profile);
        alert('Profile picture removed successfully!');
      } else {
        throw new Error(result.error);
      }
    } catch (error) {
      console.error('❌ Failed to remove profile picture:', error);
      alert('Failed to remove profile picture');
    }
  };

  const handlePasswordChange = async () => {
  setLoading(true);
  try {
    const { error } = await supabase.auth.resetPasswordForEmail(user.email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    
    if (error) throw error;
    
    alert('Password reset email sent! Check your inbox to continue.');
  } catch (error) {
    alert('Error sending reset email: ' + error.message);
  } finally {
    setLoading(false);
  }
};

 const SecurityStatusCard = ({ title, status, description, icon: Icon, color, onClick }) => (
  <motion.div
    whileHover={{ scale: 1.02, y: -2 }}
    onClick={onClick} // ADD THIS
    className={`backdrop-blur-lg rounded-2xl p-6 border cursor-pointer transition-all ${
      theme === 'dark' 
        ? 'bg-white/5 border-white/10 hover:bg-white/10' 
        : 'bg-white/80 border-gray-200 hover:bg-white'
    }`}
  >
      <div className="flex items-center justify-between mb-4">
        <div className={`p-3 rounded-xl ${color}`}>
          <Icon className="w-6 h-6 text-white" />
        </div>
        <div className={`px-3 py-1 rounded-full text-xs font-medium ${
          status === 'Active' 
            ? theme === 'dark' ? 'bg-green-500/20 text-green-400' : 'bg-green-100 text-green-700'
            : theme === 'dark' ? 'bg-yellow-500/20 text-yellow-400' : 'bg-yellow-100 text-yellow-700'
        }`}>
          {status}
        </div>
      </div>
      <h3 className={`font-semibold mb-2 ${
        theme === 'dark' ? 'text-white' : 'text-gray-900'
      }`}>{title}</h3>
      <p className={theme === 'dark' ? 'text-gray-400 text-sm' : 'text-gray-600 text-sm'}>
        {description}
      </p>
    </motion.div>
  );

  const PreferenceToggle = ({ title, description, icon: Icon, enabled, onToggle, isTheme = false }) => (
    <div className={`flex items-center justify-between p-4 rounded-xl border ${
      theme === 'dark' 
        ? 'bg-white/5 border-white/10' 
        : 'bg-gray-50 border-gray-200'
    }`}>
      <div className="flex items-center space-x-4">
        <div className={`p-2 rounded-lg ${isTheme ? 'bg-cyan-500/20' : 'bg-cyan-500/20'}`}>
          <Icon className={`w-5 h-5 ${isTheme ? 'text-cyan-400' : 'text-cyan-400'}`} />
        </div>
        <div>
          <h4 className={`font-medium ${
            theme === 'dark' ? 'text-white' : 'text-gray-900'
          }`}>{title}</h4>
          <p className={theme === 'dark' ? 'text-gray-400 text-sm' : 'text-gray-600 text-sm'}>
            {description}
          </p>
          {isTheme && (
            <p className={`text-xs mt-1 ${
              theme === 'dark' ? 'text-cyan-300' : 'text-cyan-600'
            }`}>
              Current: {theme === 'dark' ? 'Dark Mode' : 'Light Mode'}
            </p>
          )}
        </div>
      </div>
      <button
        onClick={onToggle}
        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
          enabled ? 'bg-cyan-500' : 'bg-gray-600'
        }`}
      >
        <span
          className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
            enabled ? 'translate-x-6' : 'translate-x-1'
          }`}
        />
      </button>
    </div>
  );

  if (loading) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${
        theme === 'dark' 
          ? 'bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900' 
          : 'bg-gradient-to-br from-slate-100 via-purple-100 to-slate-100'
      }`}>
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
          className="w-12 h-12 border-4 border-cyan-400 border-t-transparent rounded-full"
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Background Elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className={`absolute top-0 right-0 w-96 h-96 rounded-full blur-3xl ${
          theme === 'dark' ? 'bg-cyan-500/10' : 'bg-cyan-400/20'
        }`}></div>
        <div className={`absolute bottom-0 left-0 w-96 h-96 rounded-full blur-3xl ${
          theme === 'dark' ? 'bg-purple-500/10' : 'bg-purple-400/20'
        }`}></div>
      </div>

      <div className="relative z-10 py-8 px-4">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center justify-between mb-8"
          >
            <div>
              <h1 className={`text-4xl font-bold mb-2 ${
                theme === 'dark' ? 'text-white' : 'text-gray-900'
              }`}>Profile Settings</h1>
              <p className={theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}>
                Manage your account and preferences
              </p>
            </div>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => navigate('/dashboard')}
              className={`backdrop-blur-lg px-6 py-3 rounded-2xl border transition-all ${
                theme === 'dark' 
                  ? 'bg-white/10 border-white/20 text-white hover:bg-white/15'
                  : 'bg-gray-100 border-gray-300 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Back to Dashboard
            </motion.button>
          </motion.div>

          <div className="grid lg:grid-cols-4 gap-8">
            {/* Sidebar */}
            <div className="lg:col-span-1">
              <div className={`backdrop-blur-lg rounded-3xl p-6 border sticky top-8 ${
                theme === 'dark' 
                  ? 'bg-white/5 border-white/10' 
                  : 'bg-white/80 border-gray-200'
              }`}>
                {/* Avatar Section */}
                <div className="text-center mb-8">
                  <div className="relative inline-block mb-4">
                    {profile?.profile_picture_url ? (
                      <div className="w-20 h-20 rounded-full bg-gradient-to-br from-cyan-400 to-purple-500 overflow-hidden border-2 border-white/20 shadow-lg">
                        <img 
                          src={profile.profile_picture_url} 
                          alt="Profile" 
                          className="w-full h-full object-cover"
                        />
                      </div>
                    ) : (
                      <div className="w-20 h-20 rounded-full bg-gradient-to-br from-cyan-400 to-purple-500 flex items-center justify-center border-2 border-white/20 shadow-lg">
                        <User className="w-8 h-8 text-white" />
                      </div>
                    )}
                    
                    <motion.button 
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={handleAvatarClick}
                      disabled={uploading}
                      className={`absolute -bottom-1 -right-1 p-2 rounded-full backdrop-blur-lg border-2 ${
                        theme === 'dark' 
                          ? 'bg-slate-800 border-cyan-400/50 text-white' 
                          : 'bg-white border-cyan-500 text-gray-700'
                      } ${uploading ? 'opacity-50 cursor-not-allowed' : 'hover:shadow-lg hover:border-cyan-400'}`}
                    >
                      {uploading ? (
                        <motion.div
                          animate={{ rotate: 360 }}
                          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                          className="w-4 h-4 border-2 border-cyan-400 border-t-transparent rounded-full"
                        />
                      ) : (
                        <Camera className="w-4 h-4" />
                      )}
                    </motion.button>
                    
                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={handleFileSelect}
                      accept="image/*"
                      className="hidden"
                    />
                  </div>
                  
                  <h2 className={`font-bold text-lg ${
                    theme === 'dark' ? 'text-white' : 'text-gray-900'
                  }`}>
                    {profile?.username || 'User'}
                  </h2>
                  <p className={theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}>
                    {user?.email}
                  </p>
                  
                  {profile?.profile_picture_url && (
                    <motion.button
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      onClick={handleRemoveAvatar}
                      className={`mt-2 text-xs px-3 py-1 rounded-full ${
                        theme === 'dark' 
                          ? 'bg-red-500/20 text-red-400 hover:bg-red-500/30' 
                          : 'bg-red-500/15 text-red-600 hover:bg-red-500/25'
                      }`}
                    >
                      Remove Picture
                    </motion.button>
                  )}
                </div>

                {/* Cropper Modal */}
                {croppingImage && (
                  <AvatarCropper
                    image={croppingImage}
                    onCancel={handleCancelCrop}
                    onSave={handleSaveCroppedImage}
                  />
                )}

                <nav className="space-y-2">
                  {[
                    { id: 'profile', label: 'Profile Info', icon: User },
                    { id: 'security', label: 'Security', icon: Shield },
                    { id: 'preferences', label: 'Preferences', icon: Settings },
                    { id: 'quick-actions', label: 'Quick Actions', icon: Download },
                  ].map((item) => (
                    <button
                      key={item.id}
                      onClick={() => setActiveTab(item.id)}
                      className={`w-full flex items-center space-x-3 p-3 rounded-xl text-left transition-all ${
                        activeTab === item.id
                          ? theme === 'dark'
                            ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-400/30'
                            : 'bg-cyan-500/20 text-cyan-700 border border-cyan-400/30'
                          : theme === 'dark'
                            ? 'text-gray-400 hover:text-white hover:bg-white/10'
                            : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100/80'
                      }`}
                    >
                      <item.icon className="w-5 h-5" />
                      <span className="font-medium">{item.label}</span>
                    </button>
                  ))}
                </nav>
              </div>
            </div>

            {/* Main Content */}
            <div className="lg:col-span-3">
              {/* Profile Info Tab */}
              {activeTab === 'profile' && (
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="space-y-6"
                >
                  {/* Account Metrics */}
                  <div className="grid md:grid-cols-3 gap-6 mb-8">
                    {[
                      { 
                        metric: metrics.totalFiles, 
                        label: 'Total Files', 
                        icon1: Upload, 
                        icon2: Database,
                        gradient: theme === 'dark' ? 'from-blue-500/20 to-blue-600/20' : 'from-blue-100 to-blue-200',
                        border: theme === 'dark' ? 'border-blue-200/20' : 'border-blue-200',
                        text: theme === 'dark' ? 'text-blue-300' : 'text-blue-600'
                      },
                      { 
                        metric: formatFileSize(metrics.storageUsed), 
                        label: 'Storage Used', 
                        icon1: Database, 
                        icon2: Shield,
                        gradient: theme === 'dark' ? 'from-purple-500/20 to-purple-600/20' : 'from-purple-100 to-purple-200',
                        border: theme === 'dark' ? 'border-purple-200/20' : 'border-purple-200',
                        text: theme === 'dark' ? 'text-purple-300' : 'text-purple-600'
                      },
                      { 
                        metric: metrics.verifiedFiles, 
                        label: 'Verified Files', 
                        icon1: ShieldCheck, 
                        icon2: Check,
                        gradient: theme === 'dark' ? 'from-green-500/20 to-green-600/20' : 'from-green-100 to-green-200',
                        border: theme === 'dark' ? 'border-green-200/20' : 'border-green-200',
                        text: theme === 'dark' ? 'text-green-300' : 'text-green-600'
                      },
                    ].map((item, index) => (
                      <div 
                        key={index}
                        className={`bg-gradient-to-br ${item.gradient} backdrop-blur-lg rounded-2xl p-6 border ${item.border}`}
                      >
                        <div className="flex items-center justify-between mb-4">
                          <item.icon1 className={`w-8 h-8 ${item.text}`} />
                          <item.icon2 className={`w-5 h-5 ${item.text} opacity-60`} />
                        </div>
                        <h3 className={`text-2xl font-bold mb-2 ${
                          theme === 'dark' ? 'text-white' : 'text-gray-900'
                        }`}>{item.metric}</h3>
                        <p className={`font-semibold ${item.text}`}>{item.label}</p>
                      </div>
                    ))}
                  </div>

                  {/* Profile Information */}
                  <div className={`backdrop-blur-lg rounded-3xl p-6 border ${
                    theme === 'dark' 
                      ? 'bg-white/5 border-white/10' 
                      : 'bg-white/80 border-gray-200'
                  }`}>
                    <h2 className={`text-2xl font-bold mb-6 ${
                      theme === 'dark' ? 'text-white' : 'text-gray-900'
                    }`}>Profile Information</h2>
                    <div className="space-y-6">
                      {[
                        { 
                          label: 'Username', 
                          value: profile?.username, 
                          icon: User, 
                          field: 'username',
                          editable: true,
                          type: 'text'
                        },
                        { 
                          label: 'Email', 
                          value: user?.email, 
                          icon: Mail, 
                          field: 'email',
                          editable: false,
                          type: 'email'
                        },
                        { 
                          label: 'Member Since', 
                          value: formatDate(profile?.created_at), 
                          icon: Calendar, 
                          field: null,
                          editable: false 
                        },
                      ].map((item) => (
                        <div key={item.label} className={`flex items-center justify-between p-4 rounded-xl border ${
                          theme === 'dark' 
                            ? 'bg-white/5 border-white/10' 
                            : 'bg-gray-50 border-gray-200'
                        }`}>
                          <div className="flex items-center space-x-4">
                            <div className="p-2 bg-cyan-500/20 rounded-lg">
                              <item.icon className="w-5 h-5 text-cyan-400" />
                            </div>
                            <div className="flex-1">
                              <h4 className={`font-medium ${
                                theme === 'dark' ? 'text-white' : 'text-gray-900'
                              }`}>{item.label}</h4>
                              {editingField === item.field ? (
                                <div className="flex items-center space-x-2 mt-1">
                                  <input
                                    type={item.type}
                                    value={editValue}
                                    onChange={(e) => setEditValue(e.target.value)}
                                    className={`border border-cyan-400/30 rounded-lg px-3 py-2 text-sm w-64 ${
                                      theme === 'dark' 
                                        ? 'bg-slate-700 text-white' 
                                        : 'bg-white text-gray-900'
                                    }`}
                                    autoFocus
                                    placeholder={`Enter your ${item.label.toLowerCase()}`}
                                  />
                                  <button
                                    onClick={() => handleSaveEdit(item.field)}
                                    className="p-2 text-green-500 hover:text-green-400 transition-colors"
                                    disabled={!editValue.trim()}
                                  >
                                    <Check className="w-4 h-4" />
                                  </button>
                                  <button
                                    onClick={handleCancelEdit}
                                    className="p-2 text-red-500 hover:text-red-400 transition-colors"
                                  >
                                    <X className="w-4 h-4" />
                                  </button>
                                </div>
                              ) : (
                                <p className={theme === 'dark' ? 'text-gray-400 text-sm' : 'text-gray-600 text-sm'}>
                                  {item.value}
                                </p>
                              )}
                            </div>
                          </div>
                          {item.editable && !editingField && (
                            <button
                              onClick={() => startEditing(item.field, item.value)}
                              disabled={loading}
                              className={`p-2 rounded-lg transition-all ${
                                theme === 'dark' 
                                  ? 'hover:bg-white/10 text-gray-400 hover:text-white' 
                                  : 'hover:bg-gray-200 text-gray-500 hover:text-gray-700'
                              } ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
                            >
                              {loading ? (
                                <motion.div
                                  animate={{ rotate: 360 }}
                                  transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                                  className="w-4 h-4 border-2 border-cyan-400 border-t-transparent rounded-full"
                                />
                              ) : (
                                <Edit3 className="w-4 h-4" />
                              )}
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </motion.div>
              )}

              {/* Security Tab */}
              {activeTab === 'security' && (
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="space-y-6"
                >
                  <div className={`backdrop-blur-lg rounded-3xl p-6 border ${
                    theme === 'dark' 
                      ? 'bg-white/5 border-white/10' 
                      : 'bg-white/80 border-gray-200'
                  }`}>
                    <h2 className={`text-2xl font-bold mb-6 ${
                      theme === 'dark' ? 'text-white' : 'text-gray-900'
                    }`}>Security Settings</h2>
                    <div className="grid md:grid-cols-2 gap-6">
                      <SecurityStatusCard
                            title="Two-Factor Authentication"
                            status={twoFAEnabled ? "Enabled" : "Disabled"}
                            description={twoFAEnabled ? "Extra security layer active" : "Add extra security to your account"}
                            icon={Shield}
                            color={twoFAEnabled ? "bg-green-500/20" : "bg-gray-500/20"}
                            onClick={() => setShow2FAModal(true)}
                            />
                        <SecurityStatusCard
                        title="Password"
                        status="Strong"
                        description="Last changed 30 days ago"
                        icon={Key}
                        color="bg-blue-500/20"
                        onClick={handlePasswordChange}  // ADD THIS
                        />
                    <SecurityStatusCard
                        title="Active Sessions"
                        status="Current Session"
                        description="View your current login session"
                        icon={Smartphone}
                        color="bg-purple-500/20"
                        onClick={() => setShowSessionsModal(true)}
                        />
                    <SecurityStatusCard
                        title="Login History"
                        status="View All"
                        description="Track your account activity"
                        icon={Clock}
                        color="bg-cyan-500/20"
                        onClick={() => setShowLoginHistoryModal(true)}
                        />
                    </div>
                  </div>
                </motion.div>
              )}

              {/* Preferences Tab */}
              {activeTab === 'preferences' && (
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="space-y-6"
                >
                  <div className={`backdrop-blur-lg rounded-3xl p-6 border ${
                    theme === 'dark' 
                      ? 'bg-white/5 border-white/10' 
                      : 'bg-white/80 border-gray-200'
                  }`}>
                    <h2 className={`text-2xl font-bold mb-6 ${
                      theme === 'dark' ? 'text-white' : 'text-gray-900'
                    }`}>Preferences</h2>
                    <div className="space-y-4">
                      {/* Theme Toggle */}
                      <PreferenceToggle
                        title="Dark Mode"
                        description="Switch between dark and light theme"
                        icon={theme === 'dark' ? Moon : Sun}
                        enabled={theme === 'dark'}
                        onToggle={handleThemeToggle}
                        isTheme={true}
                      />

                      {/* Email Notifications */}
                      <PreferenceToggle
                        title="Email Notifications"
                        description="Receive email alerts for important activities"
                        icon={Mail}
                        enabled={profile?.notifications_enabled || true}
                        onToggle={async () => {
                          const newValue = !profile?.notifications_enabled;
                          try {
                            const { error } = await supabase
                              .from('profiles')
                              .update({ notifications_enabled: newValue })
                              .eq('id', user.id);
                            
                            if (!error) {
                              setProfile(prev => ({ ...prev, notifications_enabled: newValue }));
                            }
                          } catch (error) {
                            console.error('Failed to update notifications:', error);
                          }
                        }}
                      />
                      
                      {/* Push Notifications - USING CONTEXT */}
                      <PreferenceToggle
                        title="Push Notifications"
                        description="Get real-time browser notifications for important events"
                        icon={Bell}
                        enabled={preferences.push_enabled}
                        onToggle={handlePushNotificationToggle}
                      />
                    </div>
                  </div>
                </motion.div>
              )}

              {/* Quick Actions Tab */}
              {activeTab === 'quick-actions' && (
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="space-y-6"
                >
                  <div className={`backdrop-blur-lg rounded-3xl p-6 border ${
                    theme === 'dark' 
                      ? 'bg-white/5 border-white/10' 
                      : 'bg-white/80 border-gray-200'
                  }`}>
                    <h2 className={`text-2xl font-bold mb-6 ${
                      theme === 'dark' ? 'text-white' : 'text-gray-900'
                    }`}>Quick Actions</h2>
                    <div className="grid md:grid-cols-2 gap-4">
                      {[
                        { label: 'Download All Files', icon: Download, action: () => alert('Bulk download starting...') },
                        // { label: 'Bulk Verify Files', icon: ShieldCheck, action: () => alert('Starting bulk verification...') },
                        { label: 'Export Account Data', icon: Database, action: () => setShowExportModal(true) },
                        // { label: 'Clear Temp Files', icon: Trash2, action: () => setShowClearTempModal(true) },
                      ].map((action) => (
                        <motion.button
                          key={action.label}
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          onClick={action.action}
                          className={`flex items-center space-x-3 p-4 rounded-xl border text-left transition-all ${
                            theme === 'dark'
                              ? 'bg-white/5 border-white/10 hover:bg-white/10 text-white'
                              : 'bg-gray-50 border-gray-200 hover:bg-gray-100 text-gray-900'
                          }`}
                        >
                          <action.icon className="w-5 h-5 text-cyan-400" />
                          <span className="font-medium">{action.label}</span>
                        </motion.button>
                      ))}
                    </div>
                  </div>
                </motion.div>
              )}
            </div>
          </div>
        </div>
      </div>

      {showSessionsModal && (
  <ActiveSessions 
    user={user} 
    onClose={() => setShowSessionsModal(false)} 
  />
)}

{showLoginHistoryModal && (
  <LoginHistory 
    user={user} 
    onClose={() => setShowLoginHistoryModal(false)} 
  />
)}

{showExportModal && (
  <ExportData 
    user={user} 
    onClose={() => setShowExportModal(false)} 
  />
)}

{/* {showClearTempModal && (
  <ClearTempFiles 
    user={user} 
    onClose={() => setShowClearTempModal(false)} 
  />

)} */}

{show2FAModal && (
  <Enable2FA 
    user={user} 
    onClose={() => {
      setShow2FAModal(false);
      check2FAStatus(); // Refresh status when modal closes
    }}
  />
)}
    </div>
  );
}