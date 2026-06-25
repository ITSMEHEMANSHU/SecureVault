import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import { useTheme } from '../contexts/ThemeContext';
import BulkActions from '../components/Dashboard/BulkActions';
import NotificationBell from '../components/Notifications/NotificationBell';
import { ethers } from 'ethers';



import { 
  Upload, FileText, Shield, Database, Download, 
  Zap, Clock, User, Settings, LogOut, HelpCircle,
  Bell, Search, ArrowRight, TrendingUp, CheckCircle,
  Cloud, Lock, Globe, Cpu
} from 'lucide-react';

export default function Dashboard() {
  const [user, setUser] = useState(null);
  const [metrics, setMetrics] = useState({
    totalFiles: 0,
    storageUsed: 0,
    verifiedFiles: 0,
    recentActivity: []
  });

  const [blockchainStatus, setBlockchainStatus] = useState({
  status: 'checking',
  network: 'Sepolia',
  latestBlock: 0,
  verifiedFiles: 0,
  gasPrice: '0'
});
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { theme } = useTheme();
    const [userProfile, setUserProfile] = useState(null); // ✅ ADD THIS
      const [twoFAEnabled, setTwoFAEnabled] = useState(false); // ✅ ADD THIS
      

     // ✅ CORRECT 2FA Status Check Function for Dashboard
const check2FAStatus = async () => {
  if (!user) return;
  
  try {
    console.log('🔐 Checking 2FA status for user:', user.id);
    
    const { data: factors, error } = await supabase.auth.mfa.listFactors();
    
    console.log('🔐 2FA Factors response:', { factors, error });
    
    if (error) {
      console.error('❌ Error fetching 2FA factors:', error);
      setTwoFAEnabled(false);
      return;
    }

    // Check if TOTP factor exists and is verified
    const hasTOTP = factors?.totp && factors.totp.length > 0;
    const isVerified = hasTOTP ? factors.totp[0].status === 'verified' : false;
    
    console.log('🔐 2FA Status:', { hasTOTP, isVerified, factors: factors?.totp });
    
    setTwoFAEnabled(hasTOTP && isVerified);
    
  } catch (error) {
    console.error('❌ Error checking 2FA status:', error);
    setTwoFAEnabled(false);
  }
};

useEffect(() => {
  if (user) {
    check2FAStatus();
  }
}, [user]);

const checkBlockchainStatus = async () => {
  try {
    console.log('🔗 Connecting to Sepolia...');
    
    // Create provider with your RPC
    const provider = new ethers.JsonRpcProvider(
      'https://sepolia.infura.io/v3/d7f9fae683654fc39f321aeb06539751'
    );

    // 1. Check network status - FIXED for ethers v6
    const network = await provider.getNetwork();
    const blockNumber = await provider.getBlockNumber();
    const feeData = await provider.getFeeData(); // ✅ REPLACED getGasPrice
    
    console.log('🔗 Network info:', { 
      network: network.name, 
      blockNumber, 
      gasPrice: feeData.gasPrice 
    });

    // 2. Check your contract (basic check - see if it exists)
    let contractConnected = false;
    try {
      const code = await provider.getCode('0xC6CC5EbC439B6cCa2d3a352198BE435797f975B2');
      contractConnected = code !== '0x';
      console.log('🔗 Contract check:', { contractConnected, codeLength: code.length });
    } catch (contractError) {
      console.log('🔗 Contract not accessible:', contractError);
    }

    // 3. Check wallet activity from your database
    const walletActivity = await checkWalletActivityFromDB();

    // 4. Get verified files count from your database
    const verifiedFiles = await getVerifiedFilesCount();

    setBlockchainStatus({
      status: 'Connected',
      network: network.name,
      latestBlock: blockNumber,
      verifiedFiles: verifiedFiles,
      gasPrice: feeData.gasPrice ? ethers.formatUnits(feeData.gasPrice, 'gwei') : '0', // ✅ FIXED
      contractConnected: contractConnected,
      walletActivity: walletActivity
    });

    console.log('✅ Blockchain status updated:', {
      status: 'Connected',
      blockNumber,
      gasPrice: feeData.gasPrice ? ethers.formatUnits(feeData.gasPrice, 'gwei') : '0'
    });

  } catch (error) {
    console.error('❌ Blockchain connection failed:', error);
    setBlockchainStatus({
      status: 'Disconnected',
      network: 'Sepolia',
      latestBlock: 0,
      verifiedFiles: 0,
      gasPrice: '0',
      contractConnected: false,
      walletActivity: 0,
      error: error.message
    });
  }
};
useEffect(() => {
  if (user) {
    checkBlockchainStatus();
  }
}, [user]);


const checkWalletActivityFromDB = async () => {
  try {
    const { data: transactions, error } = await supabase
      .from('blockchain_transactions')
      .select('id, status, created_at')
      .eq('status', 'confirmed')
      .order('created_at', { ascending: false })
      .limit(50);

    if (!error && transactions) {
      return transactions.length;
    }
    return 0;
  } catch (error) {
    console.error('Error fetching wallet activity:', error);
    return 0;
  }
};

const getVerifiedFilesCount = async () => {
  try {
    // ✅ CORRECT QUERY: Count files that have blockchain transactions
    const { data: files, error } = await supabase
      .from('files')
      .select(`
        id,
        blockchain_transactions (
          id, status
        )
      `)
      .eq('user_id', user.id);

    if (error) {
      console.error('Error fetching verified files:', error);
      return 0;
    }

    // Count files that have at least one blockchain transaction
    const verifiedFiles = files?.filter(file => 
      file.blockchain_transactions && 
      file.blockchain_transactions.length > 0
    ).length || 0;

    console.log('✅ Verified files count:', verifiedFiles, 'out of', files?.length);
    return verifiedFiles;

  } catch (error) {
    console.error('Error counting verified files:', error);
    return 0;
  }
};
useEffect(() => {
  if (blockchainStatus.verifiedFiles > 0 && blockchainStatus.verifiedFiles !== metrics.verifiedFiles) {
    console.log('🔄 Syncing verified files count:', blockchainStatus.verifiedFiles);
    setMetrics(prev => ({
      ...prev,
      verifiedFiles: blockchainStatus.verifiedFiles
    }));
  }
}, [blockchainStatus.verifiedFiles]);

useEffect(() => {
    const getUserData = async () => {
      try {
        setLoading(true);
        
        // 1. Get auth user
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        if (authError) throw authError;
        
        setUser(user);

        if (user) {
       // In your Dashboard.jsx, replace the profile query with:
const { data: profile, error: profileError } = await supabase
  .from('profiles')
  .select('username, email, profile_picture_url, theme_preference, last_login, created_at')
  .eq('id', user.id)
  .single();

          console.log('🔍 Profile data:', profile); // Debug log
          console.log('🔍 User metadata:', user.user_metadata); // Debug log

          if (!profileError && profile) {
            setUserProfile(profile);
          } else {
            console.warn('No profile found, using user_metadata');
            // If no profile exists, create one from user_metadata
            setUserProfile({ 
              username: user.user_metadata?.username || 'User',
              full_name: user.user_metadata?.full_name,
              avatar_url: user.user_metadata?.avatar_url 
            });
          }

          // 3. Fetch metrics
          await fetchUserMetrics(user.id);
        }
      } catch (error) {
        console.error('Error fetching user data:', error);
      } finally {
        setLoading(false);
      }
    };

    getUserData();
  }, []);

  // Get the current username - ALWAYS use profile data first
const getCurrentUsername = () => {
  // Priority: 1. profiles.username → 2. user_metadata.username → 3. 'User'
  if (userProfile && userProfile.username) {
    return userProfile.username;
  }
  if (user?.user_metadata?.username) {
    return user.user_metadata.username;
  }
  if (user?.email) {
    return user.email.split('@')[0]; // Use email prefix as fallback
  }
  return 'User';
};

  const fetchUserMetrics = async (userId) => {
  try {
    // ✅ USE CORRECT COLUMNS: name and uploaded_at
    const { data: files, error: filesError } = await supabase
      .from('files')
      .select('id, name, size, uploaded_at, blockchain_transactions(status)')
      .eq('user_id', userId)
      .order('uploaded_at', { ascending: false }); // ✅ ORDER BY UPLOAD TIME

    if (filesError) throw filesError;

    const totalFiles = files?.length || 0;
    const storageUsed = files?.reduce((acc, file) => acc + (file.size || 0), 0) || 0;
    const verifiedFiles = files?.filter(file => 
      file.blockchain_transactions && 
      file.blockchain_transactions.length > 0 &&
      file.blockchain_transactions[0].status === 'verified'
    ).length || 0;

    // ✅ REAL DATA: Use actual file names and uploaded_at timestamps
    const recentActivity = files?.slice(0, 5).map(file => ({
      id: file.id,
      name: file.name, // ✅ ACTUAL FILE NAME
      action: 'uploaded',
      timestamp: file.uploaded_at, // ✅ ACTUAL UPLOAD TIME
      size: file.size
    })) || [];

    setMetrics({
      totalFiles,
      storageUsed,
      verifiedFiles,
      recentActivity
    });
  } catch (error) {
    console.error('Error fetching metrics:', error);
  }
};

const formatTimestamp = (timestamp) => {
  if (!timestamp) return 'Recently';
  
  // ✅ Convert UTC timestamp to local time
  const now = new Date();
  const fileTime = new Date(timestamp + 'Z'); // Add 'Z' to force UTC interpretation
  const diffMs = now - fileTime;
  const diffMins = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins} min ago`;
  if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
  if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
  
  // ✅ Show actual date in local time
  return fileTime.toLocaleDateString() + ' ' + fileTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const MetricCard = ({ title, value, subtitle, icon: Icon, color, delay = 0 }) => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
      whileHover={{ scale: 1.02, y: -5 }}
      className={`bg-gradient-to-br ${color} backdrop-blur-lg rounded-3xl p-6 border shadow-2xl hover:shadow-cyan-500/10 transition-all duration-300 group ${
        theme === 'dark' 
          ? 'border-white/20' 
          : 'border-gray-200/50 shadow-gray-200/20'
      }`}
    >
      <div className="flex items-center justify-between mb-4">
        <div className={`p-3 rounded-2xl ${
          theme === 'dark' ? 'bg-white/20' : 'bg-white/40'
        }`}>
          <Icon className="w-6 h-6 text-white" />
        </div>
        <TrendingUp className={`w-5 h-5 transition-colors ${
          theme === 'dark' 
            ? 'text-white/60 group-hover:text-white/80' 
            : 'text-white/70 group-hover:text-white/90'
        }`} />
      </div>
      <h3 className="text-2xl font-bold text-white mb-2">{value}</h3>
      <p className="text-white/90 font-semibold mb-1">{title}</p>
      <p className={`text-sm ${
        theme === 'dark' ? 'text-white/70' : 'text-white/80'
      }`}>{subtitle}</p>
    </motion.div>
  );

  const QuickAction = ({ title, description, icon: Icon, color, onClick, delay = 0 }) => (
    <motion.button
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay }}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      onClick={onClick}
      className={`backdrop-blur-lg rounded-2xl p-6 border text-left group transition-all duration-300 ${
        theme === 'dark'
          ? 'bg-white/5 border-white/10 hover:bg-white/10 hover:border-cyan-400/30'
          : 'bg-white/80 border-gray-200/60 hover:bg-white hover:border-cyan-400/40 shadow-sm hover:shadow-md'
      }`}
    >
      <div className="flex items-start justify-between mb-4">
        <div className={`p-3 rounded-xl ${
          color === 'cyan' ? 'bg-cyan-500/20' :
          color === 'purple' ? 'bg-purple-500/20' :
          color === 'green' ? 'bg-green-500/20' :
          'bg-blue-500/20'
        }`}>
          <Icon className={`w-6 h-6 ${
            color === 'cyan' ? 'text-cyan-400' :
            color === 'purple' ? 'text-purple-400' :
            color === 'green' ? 'text-green-400' :
            'text-blue-400'
          }`} />
        </div>
        <ArrowRight className={`w-5 h-5 transition-all ${
          color === 'cyan' ? 'text-cyan-400/60 group-hover:text-cyan-400' :
          color === 'purple' ? 'text-purple-400/60 group-hover:text-purple-400' :
          color === 'green' ? 'text-green-400/60 group-hover:text-green-400' :
          'text-blue-400/60 group-hover:text-blue-400'
        } group-hover:translate-x-1`} />
      </div>
      <h3 className={`text-lg font-semibold mb-2 ${
        theme === 'dark' ? 'text-white' : 'text-gray-900'
      }`}>{title}</h3>
      <p className={theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}>{description}</p>
    </motion.button>
  );

  if (loading) {
    return (
      <div className={`min-h-screen flex items-center justify-center transition-colors duration-300 ${
        theme === 'dark' 
          ? 'bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900' 
          : 'bg-gradient-to-br from-gray-50 via-purple-50 to-blue-50'
      }`}>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className={`text-center ${
            theme === 'dark' ? 'text-white' : 'text-gray-900'
          }`}
        >
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
            className={`w-16 h-16 border-4 rounded-full mx-auto mb-4 ${
              theme === 'dark' 
                ? 'border-cyan-400 border-t-transparent' 
                : 'border-cyan-500 border-t-transparent'
            }`}
          />
          <p className={theme === 'dark' ? 'text-cyan-300' : 'text-cyan-600'}>
            Loading your secure dashboard...
          </p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen relative overflow-hidden transition-colors duration-300">

      {/* Animated Background */}
      <div className="absolute inset-0 overflow-hidden">
        <div className={`absolute top-0 left-0 w-72 h-72 rounded-full blur-3xl animate-float ${
          theme === 'dark' ? 'bg-cyan-500/10' : 'bg-cyan-400/20'
        }`}></div>
        <div className={`absolute bottom-0 right-0 w-96 h-96 rounded-full blur-3xl animate-float ${
          theme === 'dark' ? 'bg-purple-500/10' : 'bg-purple-400/20'
        }`} style={{ animationDelay: '2s' }}></div>
        <div className={`absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-64 h-64 rounded-full blur-3xl animate-pulse-slow ${
          theme === 'dark' ? 'bg-blue-500/5' : 'bg-blue-400/15'
        }`}></div>
      </div>

      <div className="relative z-10 py-8 px-4">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center justify-between mb-8"
          >
            <div>
              <h1 className={`text-4xl font-bold mb-2 ${
                theme === 'dark' ? 'text-white' : 'text-gray-900'
              }`}>
                Welcome back, <span className="bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent">
                  {getCurrentUsername()}! {/* ✅ USE THE FUNCTION */}
                </span>
              </h1>
              <p className={theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}>
                Here's your security overview
              </p>
            </div>
            
            <div className="flex items-center space-x-4">
              {/* <motion.button 
                whileHover={{ scale: 1.05 }} 
                whileTap={{ scale: 0.95 }} 
                className={`p-3 rounded-2xl border transition-all ${
                  theme === 'dark'
                    ? 'bg-white/10 border-white/20 hover:bg-white/15 text-gray-400 hover:text-white'
                    : 'bg-white/80 border-gray-300 hover:bg-white text-gray-600 hover:text-gray-900 shadow-sm'
                }`}
              >
                <Bell className="w-5 h-5" />
              </motion.button> */}
              
              {/* <motion.button 
                whileHover={{ scale: 1.05 }} 
                whileTap={{ scale: 0.95 }}
                onClick={() => navigate('/profile')}
                className={`flex items-center space-x-3 backdrop-blur-lg rounded-2xl px-4 py-3 border transition-all group ${
                  theme === 'dark'
                    ? 'bg-white/10 border-white/20 hover:bg-white/15 text-white'
                    : 'bg-white/80 border-gray-300 hover:bg-white text-gray-900 shadow-sm'
                }`}
              >
                <div className="w-8 h-8 bg-gradient-to-r from-cyan-500 to-purple-600 rounded-full flex items-center justify-center shadow-md">
                  <User className="w-4 h-4 text-white" />
                </div>
                <span className={`font-medium ${
                  theme === 'dark' ? 'text-white' : 'text-gray-900'
                }`}>
                  {user?.user_metadata?.username || 'User'}
                </span>
              </motion.button> */}
            </div>
          </motion.div>

          {/* Metrics Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <MetricCard
              title="Total Files"
              value={metrics.totalFiles}
              subtitle="Secured in your vault"
              icon={FileText}
              color="from-blue-500/20 to-blue-600/20"
              delay={0.1}
            />
            <MetricCard
              title="Storage Used"
              value={formatFileSize(metrics.storageUsed)}
              subtitle="Across all files"
              icon={Database}
              color="from-purple-500/20 to-purple-600/20"
              delay={0.2}
            />
            <MetricCard
              title="Blockchain Verified"
              value={metrics.verifiedFiles}
              subtitle="Immutable records"
              icon={Shield}
              color="from-green-500/20 to-green-600/20"
              delay={0.3}
            />
            <MetricCard
              title="Security Score"
              value="100%"
              subtitle="Maximum protection"
              icon={Lock}
              color="from-cyan-500/20 to-cyan-600/20"
              delay={0.4}
            />
          </div>

          {/* Main Content Grid */}
          <div className="grid lg:grid-cols-3 gap-8">
            {/* Quick Actions */}
            <div className="lg:col-span-2">
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className="mb-6"
              >
                <h2 className={`text-2xl font-bold mb-4 ${
                  theme === 'dark' ? 'text-white' : 'text-gray-900'
                }`}>Quick Actions</h2>
                <div className="grid md:grid-cols-2 gap-4">
                  <QuickAction
                    title="Upload Files"
                    description="Encrypt and store new files with blockchain verification"
                    icon={Upload}
                    color="cyan"
                    onClick={() => navigate('/upload')}
                    delay={0.1}
                  />
                  <QuickAction
                    title="My Files"
                    description="Manage and access your secured files"
                    icon={FileText}
                    color="purple"
                    onClick={() => navigate('/files')}
                    delay={0.2}
                  />
                  <QuickAction
                    title="Security Settings"
                    description="Configure 2FA and security preferences"
                    icon={Shield}
                    color="green"
                    onClick={() => navigate('/profile')}
                    delay={0.3}
                  />
                    <QuickAction
                    title="Bulk Actions"
                    description="Download or verify multiple files at once"
                    icon={Download}
                    color="blue"
                    onClick={() => {
                        // You can either show a modal or navigate to a dedicated page
                        // For now, let's show an alert that directs to the new component
                        alert('Bulk Action in MyFiles.');
                    }}
                    delay={0.4}
                    />      
                </div>
              </motion.div>

             {/* Recent Activity */}
<motion.div
  initial={{ opacity: 0, x: -20 }}
  animate={{ opacity: 1, x: 0 }}
  transition={{ delay: 0.5 }}
  className={`backdrop-blur-lg rounded-3xl p-6 border ${
    theme === 'dark'
      ? 'bg-white/5 border-white/10'
      : 'bg-white/80 border-gray-200/60 shadow-sm'
  }`}
>
  <h2 className={`text-2xl font-bold mb-4 ${
    theme === 'dark' ? 'text-white' : 'text-gray-900'
  }`}>Recent Activity</h2>

  <div className="space-y-3">
    {metrics.recentActivity.length > 0 ? (
      metrics.recentActivity.map((activity, index) => (
        <motion.div
          key={activity.id}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 + index * 0.1 }}
          className={`flex items-center justify-between p-3 rounded-xl border ${
            theme === 'dark'
              ? 'bg-white/5 border-white/5'
              : 'bg-white border-gray-200/60'
          }`}
        >
          <div className="flex items-center space-x-3">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
              theme === 'dark' ? 'bg-green-500/20' : 'bg-green-500/15'
            }`}>
              <CheckCircle className="w-4 h-4 text-green-400" />
            </div>
            <div className="flex-1 min-w-0">
              <p className={`font-medium truncate ${
                theme === 'dark' ? 'text-white' : 'text-gray-900'
              }`}>
                {activity.name} {/* ✅ SHOW ACTUAL FILE NAME */}
              </p>
              <p className={`text-sm ${
                theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
              }`}>
                {/* ✅ SHOW ACTUAL UPLOAD TIME */}
                {formatTimestamp(activity.timestamp)}
              </p>
            </div>
          </div>
          <div className={`text-sm font-medium ${
            theme === 'dark' ? 'text-cyan-400' : 'text-cyan-600'
          }`}>
            {formatFileSize(activity.size)} {/* ✅ SHOW FILE SIZE */}
          </div>
        </motion.div>
      ))
    ) : (
      <div className={`text-center py-8 ${
        theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
      }`}>
        <FileText className="w-12 h-12 mx-auto mb-3 opacity-50" />
        <p>No recent activity</p>
        <p className="text-sm">Upload your first file to get started</p>
      </div>
    )}
  </div>
</motion.div> 

                                {/* <BulkActions user={user} /> */}

            </div>


            {/* Security Status */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.6 }}
              className="space-y-6"
            >
              {/* Security Status */}
              <div className={`backdrop-blur-lg rounded-3xl p-6 border ${
                theme === 'dark'
                  ? 'bg-white/5 border-white/10'
                  : 'bg-white/80 border-gray-200/60 shadow-sm'
              }`}>
                <h2 className={`text-2xl font-bold mb-4 ${
                  theme === 'dark' ? 'text-white' : 'text-gray-900'
                }`}>Security Status</h2>
                <div className="space-y-4">
                  {[
                    { name: 'Encryption', status: 'Active', icon: Lock, color: 'text-green-400' },
 { 
  name: 'Blockchain', 
  status: blockchainStatus.status,
  icon: Globe, 
  color: blockchainStatus.status === 'Connected' ? 'text-green-400' : 
         blockchainStatus.status === 'checking' ? 'text-yellow-400' : 'text-red-400',
  description: `Block #${blockchainStatus.latestBlock} • ${blockchainStatus.verifiedFiles} verified`
},
 { name: '2FA', 
        status: twoFAEnabled ? 'Enabled' : 'Disabled', // ✅ DYNAMIC STATUS
        icon: Shield, 
        color: twoFAEnabled ? 'text-green-400' : 'text-red-400' // ✅ COLOR CHANGES
      },
                          { name: 'IPFS Storage', status: 'Connected', icon: Cloud, color: 'text-cyan-400' },
                  ].map((item, index) => (
                    <motion.div
                      key={item.name}
                      initial={{ opacity: 0, x: 10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.7 + index * 0.1 }}
                      className={`flex items-center justify-between p-3 rounded-xl ${
                        theme === 'dark' ? 'bg-white/5' : 'bg-white/60'
                      }`}
                    >
                      <div className="flex items-center space-x-3">
                        <item.icon className={`w-5 h-5 ${item.color}`} />
                        <span className={`font-medium ${
                          theme === 'dark' ? 'text-white' : 'text-gray-900'
                        }`}>{item.name}</span>
                      </div>
                      <span className={`text-sm font-medium ${item.color}`}>{item.status}</span>
                    </motion.div>
                  ))}
                </div>
              </div>

              {/* Quick Stats */}
              <div className={`bg-gradient-to-br backdrop-blur-lg rounded-3xl p-6 border ${
                theme === 'dark'
                  ? 'from-cyan-500/10 to-purple-500/10 border-cyan-400/20'
                  : 'from-cyan-400/15 to-purple-400/15 border-cyan-300/40 shadow-sm'
              }`}>
                <h2 className={`text-xl font-bold mb-4 ${
                  theme === 'dark' ? 'text-white' : 'text-gray-900'
                }`}>System Status</h2>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className={theme === 'dark' ? 'text-cyan-300' : 'text-cyan-600'}>
                      Storage Health
                    </span>
                    <span className="text-green-400 font-semibold">Optimal</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className={theme === 'dark' ? 'text-cyan-300' : 'text-cyan-600'}>
                      Blockchain Sync
                    </span>
                    <span className="text-green-400 font-semibold">100%</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className={theme === 'dark' ? 'text-cyan-300' : 'text-cyan-600'}>
                      Encryption
                    </span>
                    <span className="text-green-400 font-semibold">AES-256</span>
                  </div>
                </div>
              </div>

              {/* Support Card */}
              <motion.div
                whileHover={{ scale: 1.02 }}
                className={`backdrop-blur-lg rounded-3xl p-6 border text-center group cursor-pointer transition-all ${
                  theme === 'dark'
                    ? 'bg-white/5 border-white/10 hover:bg-white/10'
                    : 'bg-white/80 border-gray-200/60 hover:bg-white shadow-sm hover:shadow-md'
                }`}
              >
                <HelpCircle className={`w-12 h-12 mx-auto mb-3 group-hover:scale-110 transition-transform ${
                  theme === 'dark' ? 'text-cyan-400' : 'text-cyan-500'
                }`} />
                <h3 className={`font-bold mb-2 ${
                  theme === 'dark' ? 'text-white' : 'text-gray-900'
                }`}>Need Help?</h3>
                <p className={`text-sm mb-4 ${
                  theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                }`}>Our support team is here 24/7</p>
                <button className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
                  theme === 'dark'
                    ? 'bg-cyan-500/20 text-cyan-300 hover:bg-cyan-500/30'
                    : 'bg-cyan-500/15 text-cyan-600 hover:bg-cyan-500/25'
                }`}>
                  Contact Support
                </button>
              </motion.div>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
}