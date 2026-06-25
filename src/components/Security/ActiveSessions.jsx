import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { supabase } from '../../lib/supabaseClient';
import { useTheme } from '../../contexts/ThemeContext';
import { Smartphone, Monitor, Globe, Clock, LogOut, Wifi, MapPin } from 'lucide-react';

export default function ActiveSessions({ user, onClose }) {
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [revoking, setRevoking] = useState(null);
  const { theme } = useTheme();

  useEffect(() => {
    fetchActiveSessions();
  }, []);

  const fetchActiveSessions = async () => {
    try {
      // Get current session from Supabase Auth
      const { data: { session: currentSession }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError) throw sessionError;

      if (currentSession) {
        // Parse user agent for device info
        const userAgent = navigator.userAgent;
        const deviceInfo = parseUserAgent(userAgent);
        
        // Get IP address and location
        const locationData = await fetchLocationData();
        
        // Create real session object
        const realSession = {
          id: currentSession.access_token, // Use access token as unique ID
          device: deviceInfo.device,
          browser: deviceInfo.browser,
          os: deviceInfo.os,
          ip: locationData.ip,
          location: locationData.location,
          lastActive: currentSession.user.last_sign_in_at || currentSession.user.created_at,
          current: true
        };
        
        setSessions([realSession]);
      } else {
        setSessions([]);
      }
    } catch (error) {
      console.error('Error fetching sessions:', error);
      setSessions([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchLocationData = async () => {
    try {
      // Get IP address
      const ipResponse = await fetch('https://api.ipify.org?format=json');
      const ipData = await ipResponse.json();
      
      // Get location from IP
      const locationResponse = await fetch(`https://ipapi.co/${ipData.ip}/json/`);
      const locationData = await locationResponse.json();
      
      return {
        ip: ipData.ip,
        location: locationData.city && locationData.country_name 
          ? `${locationData.city}, ${locationData.country_name}`
          : 'Location unavailable'
      };
    } catch (error) {
      console.log('Location fetch failed:', error);
      return {
        ip: 'Unknown',
        location: 'Location unavailable'
      };
    }
  };

  const parseUserAgent = (userAgent) => {
    // Enhanced user agent parsing
    let browser = 'Unknown';
    let os = 'Unknown';
    let device = 'Desktop';

    // Browser detection
    if (userAgent.includes('Chrome') && !userAgent.includes('Edg')) browser = 'Chrome';
    else if (userAgent.includes('Firefox')) browser = 'Firefox';
    else if (userAgent.includes('Safari') && !userAgent.includes('Chrome')) browser = 'Safari';
    else if (userAgent.includes('Edg')) browser = 'Edge';
    else if (userAgent.includes('Opera')) browser = 'Opera';

    // OS detection
    if (userAgent.includes('Windows')) os = 'Windows';
    else if (userAgent.includes('Mac')) os = 'macOS';
    else if (userAgent.includes('Linux')) os = 'Linux';
    else if (userAgent.includes('Android')) os = 'Android';
    else if (userAgent.includes('iOS') || userAgent.includes('iPhone') || userAgent.includes('iPad')) os = 'iOS';

    // Device detection
    if (userAgent.includes('Mobile') || userAgent.includes('Android') || userAgent.includes('iPhone') || userAgent.includes('iPad')) {
      device = 'Mobile';
    } else if (userAgent.includes('Tablet')) {
      device = 'Tablet';
    }

    // Get browser version
    const browserMatch = userAgent.match(/(Chrome|Firefox|Safari|Edg|Opera)\/([0-9.]+)/);
    if (browserMatch && browserMatch[2]) {
      browser += ` ${browserMatch[2].split('.')[0]}`;
    }

    return { browser, os, device };
  };

  const revokeSession = async (sessionId) => {
    setRevoking(sessionId);
    try {
      // Sign out the current session
      await supabase.auth.signOut();
      // Reload to go to login page
      window.location.href = '/login';
    } catch (error) {
      console.error('Error revoking session:', error);
    } finally {
      setRevoking(null);
    }
  };

  const formatLastActive = (timestamp) => {
    const diff = Date.now() - new Date(timestamp).getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) return `${days} day${days > 1 ? 's' : ''} ago`;
    if (hours > 0) return `${hours} hour${hours > 1 ? 's' : ''} ago`;
    if (minutes > 0) return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
    return 'Just now';
  };

  const getDeviceIcon = (device) => {
    if (device === 'Mobile') {
      return <Smartphone className="w-4 h-4" />;
    } else if (device === 'Tablet') {
      return <Monitor className="w-4 h-4" />;
    }
    return <Monitor className="w-4 h-4" />;
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className={`rounded-2xl p-6 w-full max-w-2xl max-h-[80vh] overflow-y-auto border ${
          theme === 'dark'
            ? 'bg-slate-800 border-white/20'
            : 'bg-white border-gray-200'
        }`}
      >
        <div className="flex items-center justify-between mb-6">
          <h2 className={`text-2xl font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
            Active Sessions
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
        ) : sessions.length === 0 ? (
          <div className={`text-center py-12 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
            <div className={`inline-flex items-center justify-center w-16 h-16 rounded-full mb-4 ${
              theme === 'dark' ? 'bg-gray-700' : 'bg-gray-200'
            }`}>
              <Wifi className="w-8 h-8" />
            </div>
            <p className="text-lg font-medium">No active sessions</p>
            <p className="mt-2">You are not currently logged in on any device.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {sessions.map((session) => (
              <div
                key={session.id}
                className={`p-4 rounded-xl border ${
                  theme === 'dark'
                    ? 'bg-white/5 border-white/10'
                    : 'bg-gray-50 border-gray-200'
                } ${session.current ? 'ring-2 ring-cyan-500/30' : ''}`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className={`p-2 rounded-lg ${
                      theme === 'dark' ? 'bg-cyan-500/20' : 'bg-cyan-500/15'
                    }`}>
                      {getDeviceIcon(session.device)}
                    </div>
                    <div>
                      <div className="flex items-center space-x-2">
                        <h3 className={`font-semibold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                          {session.browser} on {session.os}
                        </h3>
                        {session.current && (
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            theme === 'dark' ? 'bg-cyan-500/20 text-cyan-400' : 'bg-cyan-500/15 text-cyan-600'
                          }`}>
                            Current
                          </span>
                        )}
                      </div>
                      <div className="flex items-center space-x-4 mt-1">
                        <div className="flex items-center space-x-1">
                          <MapPin className={`w-3 h-3 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`} />
                          <span className={`text-xs ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                            {session.location}
                          </span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <Wifi className={`w-3 h-3 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`} />
                          <span className={`text-xs ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                            {session.ip}
                          </span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <Clock className={`w-3 h-3 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`} />
                          <span className={`text-xs ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                            {formatLastActive(session.lastActive)}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <button
                    onClick={() => revokeSession(session.id)}
                    disabled={revoking === session.id}
                    className={`p-2 rounded-lg transition-colors ${
                      theme === 'dark'
                        ? 'hover:bg-red-500/20 text-red-400 hover:text-red-300'
                        : 'hover:bg-red-500/15 text-red-500 hover:text-red-600'
                    } disabled:opacity-50`}
                  >
                    {revoking === session.id ? (
                      <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <LogOut className="w-4 h-4" />
                    )}
                  </button>
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
              Revoking your session will log you out immediately. You'll need to sign in again.
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}