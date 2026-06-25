import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import { useTheme } from '../contexts/ThemeContext';

export default function Verify2FA() {
  const [verificationCode, setVerificationCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const navigate = useNavigate();
  const { theme } = useTheme();
  const hasCheckedAuth = useRef(false);

  useEffect(() => {
    if (hasCheckedAuth.current) return;
    hasCheckedAuth.current = true;

    console.log('🔐 Verify2FA mounted - running initial auth check');

    const checkAuthState = async () => {
      try {
        const { data: { user }, error: userError } = await supabase.auth.getUser();
        
        if (userError || !user) {
          console.log('❌ No user found, redirecting to login');
          sessionStorage.removeItem('2fa_required');
          sessionStorage.removeItem('2fa_verified');
          navigate('/login', { replace: true });
          return;
        }

        const is2FARequired = sessionStorage.getItem('2fa_required') === 'true';
        if (!is2FARequired) {
          sessionStorage.setItem('2fa_required', 'true');
        }

        const { data: factors, error: factorsError } = await supabase.auth.mfa.listFactors();
        
        if (factorsError) {
          console.error('Error checking factors:', factorsError);
          return;
        }
        
        const has2FA = factors.totp && factors.totp.length > 0;
        
        if (!has2FA) {
          console.log('ℹ️ No 2FA enabled, redirecting to upload');
          sessionStorage.removeItem('2fa_required');
          sessionStorage.setItem('2fa_verified', 'true');
          navigate('/upload', { replace: true });
          return;
        }

        console.log('✅ 2FA enabled, showing verification form');

      } catch (error) {
        console.error('Auth check error:', error);
        sessionStorage.removeItem('2fa_required');
        sessionStorage.removeItem('2fa_verified');
        navigate('/login', { replace: true });
      }
    };

    checkAuthState();
  }, [navigate]);

  useEffect(() => {
    return () => {
      console.log('🧹 Verify2FA unmounting');
    };
  }, []);

  const verifyCode = async () => {
    if (isVerifying) return;

    setLoading(true);
    setError('');
    setIsVerifying(true);
    
    try {
      console.log('🔐 Starting 2FA verification with code:', verificationCode);
      
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) {
        throw new Error('No active session found. Please login again.');
      }

      const { data: factors, error: factorsError } = await supabase.auth.mfa.listFactors();
      if (factorsError) {
        console.error('❌ Factors error:', factorsError);
        throw factorsError;
      }
      
      console.log('📋 Available factors:', factors);
      
      const totpFactor = factors.totp?.[0];
      if (!totpFactor) {
        console.error('❌ No TOTP factor found');
        throw new Error('No 2FA factor found. Please setup 2FA first.');
      }
      
      console.log('🎯 TOTP factor ID:', totpFactor.id);
      
      const { data: challenge, error: challengeError } = await supabase.auth.mfa.challenge({
        factorId: totpFactor.id
      });
      
      if (challengeError) {
        console.error('❌ Challenge error:', challengeError);
        throw challengeError;
      }
      
      console.log('✅ Challenge created:', challenge.id);
      
      const { data: verifyData, error: verifyError } = await supabase.auth.mfa.verify({
        factorId: totpFactor.id,
        challengeId: challenge.id,
        code: verificationCode
      });
      
      if (verifyError) {
        console.error('❌ Verification error:', verifyError);
        throw new Error('Invalid verification code. Please try again.');
      }
      
      console.log('✅ 2FA verification successful!', verifyData);
      
      localStorage.setItem('2fa_verified', 'true');
      localStorage.removeItem('2fa_required');
      sessionStorage.setItem('2fa_verified', 'true');
      sessionStorage.removeItem('2fa_required');
      
      navigate('/upload', { replace: true });
      
    } catch (err) {
      console.error('💥 2FA Verification error:', err);
      setError(err.message || 'Invalid verification code. Please try again.');
      setVerificationCode('');
    } finally {
      setLoading(false);
      setIsVerifying(false);
    }
  };

  const handleCancel = async () => {
    if (isVerifying) return;
    
    localStorage.removeItem('2fa_required');
    localStorage.removeItem('2fa_verified');
    sessionStorage.removeItem('2fa_required');
    sessionStorage.removeItem('2fa_verified');
    
    await supabase.auth.signOut();
    navigate('/login', { replace: true });
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && verificationCode.length === 6 && !loading) {
      verifyCode();
    }
  };

  return (
   <div className={`min-h-screen flex items-center justify-center p-4 transition-colors duration-300 ${
  theme === 'dark' 
    ? 'bg-[#0a0f2c]'   // Profile-like deep blue
    : 'bg-gradient-to-br from-gray-50 via-blue-50 to-purple-50'
}`}>

      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className={`absolute -top-40 -right-40 w-80 h-80 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse ${
          theme === 'dark' ? 'bg-purple-500' : 'bg-purple-400'
        }`}></div>
        <div className={`absolute -bottom-40 -left-40 w-80 h-80 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse ${
          theme === 'dark' ? 'bg-pink-500' : 'bg-pink-400'
        }`}></div>
        <div className={`absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-80 h-80 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse ${
          theme === 'dark' ? 'bg-blue-500' : 'bg-blue-400'
        }`}></div>
      </div>

      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className={`backdrop-blur-lg rounded-2xl shadow-2xl p-8 w-full max-w-md border ${
          theme === 'dark'
            ? 'bg-white/10 border-white/20'
            : 'bg-white/80 border-gray-200'
        }`}
      >
        <h2 className={`text-2xl font-bold mb-4 ${
          theme === 'dark' ? 'text-white' : 'text-gray-900'
        }`}>
          Two-Factor Verification
        </h2>
        
        <div className="space-y-4">
          <p className={theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}>
            Enter the 6-digit code from your authenticator app:
          </p>
          
          <input
            type="text"
            placeholder="000000"
            value={verificationCode}
            onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
            onKeyPress={handleKeyPress}
            className={`w-full p-3 border rounded-lg text-center text-xl font-mono focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 ${
              theme === 'dark'
                ? 'bg-white/10 border-white/20 text-white placeholder-gray-400'
                : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
            }`}
            maxLength={6}
            autoFocus
            disabled={loading}
          />
          
          {error && (
            <motion.div 
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`p-3 rounded-lg text-sm ${
                theme === 'dark'
                  ? 'bg-red-500/20 text-red-300 border border-red-400/30'
                  : 'bg-red-100 text-red-700 border border-red-200'
              }`}
            >
              {error}
            </motion.div>
          )}
          
          <div className="flex space-x-3">
            <button
              onClick={handleCancel}
              disabled={loading}
              className={`flex-1 py-3 rounded-lg border transition-colors disabled:opacity-50 ${
                theme === 'dark'
                  ? 'border-white/20 text-gray-300 hover:bg-white/10 hover:text-white'
                  : 'border-gray-300 text-gray-600 hover:bg-gray-50 hover:text-gray-800'
              }`}
            >
              Cancel & Logout
            </button>
            <button
              onClick={verifyCode}
              disabled={loading || verificationCode.length !== 6 || isVerifying}
              className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 text-white py-3 rounded-lg font-semibold hover:from-blue-700 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 flex items-center justify-center shadow-lg"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Verifying...
                </>
              ) : (
                'Verify'
              )}
            </button>
          </div>

          {/* Additional Help Text */}
          <div className={`text-xs text-center mt-4 ${
            theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
          }`}>
            Having trouble? Make sure your authenticator app time is synchronized
          </div>
        </div>
      </motion.div>
    </div>
  );
}