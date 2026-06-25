import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { supabase } from '../../lib/supabaseClient';
import { useTheme } from '../../contexts/ThemeContext';
import { Calendar, MapPin, Monitor, Shield, AlertCircle, CheckCircle } from 'lucide-react';

export default function LoginHistory({ user, onClose }) {
  const [loginHistory, setLoginHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const { theme } = useTheme();

  useEffect(() => {
    fetchLoginHistory();
  }, []);

  const fetchLoginHistory = async () => {
  try {
    const { data: { user: currentUser }, error: userError } = await supabase.auth.getUser();
    if (userError) throw userError;

    if (currentUser) {
      // 1. Get current profile with login_history
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('login_history')
        .eq('id', currentUser.id)
        .single();

      if (profileError) throw profileError;

      const history = [];
      
      // 2. Add existing login history from database
      if (profile.login_history && Array.isArray(profile.login_history)) {
        history.push(...profile.login_history);
      }

      // 3. Add current session (if not already logged)
      const { data: { session } } = await supabase.auth.getSession();
      if (session && session.user.last_sign_in_at) {
        const userAgent = navigator.userAgent;
        const deviceInfo = parseUserAgent(userAgent);
        const locationData = await fetchLocationData();
        
        const currentLogin = {
          id: `login-${Date.now()}`,
          timestamp: new Date().toISOString(),
          device: deviceInfo.device,
          browser: deviceInfo.browser,
          os: deviceInfo.os,
          ip: locationData.ip,
          location: locationData.location,
          status: 'success',
          type: 'login'
        };

        // Check if this login is already in history
        const isAlreadyLogged = history.some(entry => 
          Math.abs(new Date(entry.timestamp) - new Date(currentLogin.timestamp)) < 60000 // Within 1 minute
        );

        if (!isAlreadyLogged) {
          history.unshift(currentLogin); // Add to beginning
          
          // 4. Update profiles table with new login history
          await supabase
            .from('profiles')
            .update({ login_history: history })
            .eq('id', currentUser.id);
        }
      }

      setLoginHistory(history.slice(0, 10)); // Show last 10 entries
    }
  } catch (error) {
    console.error('Error fetching login history:', error);
    setLoginHistory([]);
  } finally {
    setLoading(false);
  }
};

  const fetchLocationData = async () => {
    try {
      const ipResponse = await fetch('https://api.ipify.org?format=json');
      const ipData = await ipResponse.json();
      
      const locationResponse = await fetch(`https://ipapi.co/${ipData.ip}/json/`);
      const locationData = await locationResponse.json();
      
      return {
        ip: ipData.ip,
        location: locationData.city && locationData.country_name 
          ? `${locationData.city}, ${locationData.country_name}`
          : 'Location unavailable'
      };
    } catch (error) {
      return {
        ip: 'Unknown',
        location: 'Location unavailable'
      };
    }
  };

  const parseUserAgent = (userAgent) => {
    let browser = 'Unknown';
    let os = 'Unknown';
    let device = 'Desktop';

    if (userAgent.includes('Chrome') && !userAgent.includes('Edg')) browser = 'Chrome';
    else if (userAgent.includes('Firefox')) browser = 'Firefox';
    else if (userAgent.includes('Safari') && !userAgent.includes('Chrome')) browser = 'Safari';
    else if (userAgent.includes('Edg')) browser = 'Edge';

    if (userAgent.includes('Windows')) os = 'Windows';
    else if (userAgent.includes('Mac')) os = 'macOS';
    else if (userAgent.includes('Linux')) os = 'Linux';
    else if (userAgent.includes('Android')) os = 'Android';
    else if (userAgent.includes('iOS') || userAgent.includes('iPhone') || userAgent.includes('iPad')) os = 'iOS';

    if (userAgent.includes('Mobile') || userAgent.includes('Android') || userAgent.includes('iPhone') || userAgent.includes('iPad')) {
      device = 'Mobile';
    }

    const browserMatch = userAgent.match(/(Chrome|Firefox|Safari|Edg|Opera)\/([0-9.]+)/);
    if (browserMatch && browserMatch[2]) {
      browser += ` ${browserMatch[2].split('.')[0]}`;
    }

    return { browser, os, device };
  };

  const formatTimestamp = (timestamp) => {
    return new Date(timestamp).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusIcon = (status, type) => {
    if (status === 'success') {
      return <CheckCircle className="w-4 h-4 text-green-500" />;
    }
    if (type === 'account_created') {
      return <Shield className="w-4 h-4 text-blue-500" />;
    }
    return <AlertCircle className="w-4 h-4 text-red-500" />;
  };

  const getTypeLabel = (type) => {
    switch (type) {
      case 'login': return 'Login';
      case 'account_created': return 'Account Created';
      case 'failed': return 'Failed Login';
      default: return 'Activity';
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className={`rounded-2xl p-6 w-full max-w-4xl max-h-[80vh] overflow-y-auto border ${
          theme === 'dark'
            ? 'bg-slate-800 border-white/20'
            : 'bg-white border-gray-200'
        }`}
      >
        <div className="flex items-center justify-between mb-6">
          <h2 className={`text-2xl font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
            Login History
          </h2>
          <button
            onClick={onClose}
            className={`p-2 rounded-lg transition-colors ${
              theme === 'dark'
                ? 'hover:bg-white/10 text-gray-400 hover:text-white'
                : 'hover:bg-gray-100 text-gray-500 hover:text-gray-700'
            }`}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-cyan-500"></div>
          </div>
        ) : loginHistory.length === 0 ? (
          <div className={`text-center py-12 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
            <div className={`inline-flex items-center justify-center w-16 h-16 rounded-full mb-4 ${
              theme === 'dark' ? 'bg-gray-700' : 'bg-gray-200'
            }`}>
              <Calendar className="w-8 h-8" />
            </div>
            <p className="text-lg font-medium">No login history found</p>
            <p className="mt-2">Your login activity will appear here.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {loginHistory.map((entry, index) => (
              <div
                key={entry.id}
                className={`p-4 rounded-xl border ${
                  theme === 'dark'
                    ? 'bg-white/5 border-white/10'
                    : 'bg-gray-50 border-gray-200'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-4 flex-1">
                    <div className={`p-2 rounded-lg mt-1 ${
                      theme === 'dark' ? 'bg-cyan-500/20' : 'bg-cyan-500/15'
                    }`}>
                      {getStatusIcon(entry.status, entry.type)}
                    </div>
                    
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <h3 className={`font-semibold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                          {getTypeLabel(entry.type)}
                        </h3>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          entry.status === 'success' 
                            ? theme === 'dark' ? 'bg-green-500/20 text-green-400' : 'bg-green-100 text-green-700'
                            : theme === 'dark' ? 'bg-red-500/20 text-red-400' : 'bg-red-100 text-red-700'
                        }`}>
                          {entry.status === 'success' ? 'Success' : 'Failed'}
                        </span>
                      </div>
                      
                      <div className="grid md:grid-cols-2 gap-4 text-sm">
                        <div className="space-y-2">
                          <div className="flex items-center space-x-2">
                            <Calendar className={`w-4 h-4 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`} />
                            <span className={theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}>
                              {formatTimestamp(entry.timestamp)}
                            </span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Monitor className={`w-4 h-4 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`} />
                            <span className={theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}>
                              {entry.browser} • {entry.os} • {entry.device}
                            </span>
                          </div>
                        </div>
                        
                        <div className="space-y-2">
                          <div className="flex items-center space-x-2">
                            <MapPin className={`w-4 h-4 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`} />
                            <span className={theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}>
                              {entry.location}
                            </span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <svg className={`w-4 h-4 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                            </svg>
                            <span className={theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}>
                              IP: {entry.ip}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        <div className={`mt-6 p-4 rounded-xl border ${
          theme === 'dark' ? 'bg-blue-500/10 border-blue-500/20' : 'bg-blue-50 border-blue-200'
        }`}>
          <div className="flex items-center space-x-3">
            <svg className={`w-5 h-5 ${theme === 'dark' ? 'text-blue-400' : 'text-blue-500'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className={`text-sm ${theme === 'dark' ? 'text-blue-300' : 'text-blue-700'}`}>
              This shows your recent account activity. Contact support if you see any suspicious login attempts.
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}