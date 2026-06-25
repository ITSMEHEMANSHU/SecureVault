import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { supabase } from '../lib/supabaseClient';
import QRCode from 'qrcode';
import { useTheme } from '../contexts/ThemeContext';

export default function Enable2FA({ user, onClose }) {
  const [step, setStep] = useState(1);
  const [qrCode, setQrCode] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [factorId, setFactorId] = useState('');
  const [showDisable2FA, setShowDisable2FA] = useState(false);
  const [disableVerificationCode, setDisableVerificationCode] = useState('');
  const [secret, setSecret] = useState('');
  const { theme } = useTheme();

  useEffect(() => {
    check2FAStatus();
  }, []);

  const check2FAStatus = async () => {
    setLoading(true);
    try {
      const { data: factors, error: factorsError } = await supabase.auth.mfa.listFactors();
      
      if (factorsError) throw factorsError;
      
      const hasTOTP = factors.totp && factors.totp.length > 0;
      
      if (hasTOTP) {
        setStep(5); // Show management
      } else {
        setStep(1); // Show enable
      }
    } catch (err) {
      setError('Cannot check 2FA status: ' + err.message);
    }
    setLoading(false);
  };

  const start2FAEnrollment = async () => {
    setLoading(true);
    setError('');
    
    try {
      const { data, error } = await supabase.auth.mfa.enroll({
        factorType: 'totp',
        friendlyName: `${user.email} (SecureFile)`
      });
      
      if (error) throw error;
      
      const secret = data.totp.secret;
      setSecret(secret);
      
      const qrData = `otpauth://totp/SecureFile:${user.email}?secret=${secret}&issuer=SecureFile&algorithm=SHA1&digits=6&period=30`;
      
      const customQRCode = await QRCode.toDataURL(qrData);
      
      setQrCode(customQRCode);
      setFactorId(data.id);
      setStep(2);
    } catch (err) {
      setError(err.message);
    }
    setLoading(false);
  };

  const verify2FASetup = async () => {
    setLoading(true);
    setError('');
    
    try {
      const { data, error } = await supabase.auth.mfa.challengeAndVerify({
        factorId: factorId,
        code: verificationCode
      });
      
      if (error) throw error;
      
      setTimeout(() => {
        alert('2FA enabled successfully! Please sign in again.');
        supabase.auth.signOut();
      }, 1500);
      
      setStep(3);
    } catch (err) {
      setError('Invalid verification code. Please try again.');
    }
    setLoading(false);
  };

  const startDisable2FA = () => {
    setShowDisable2FA(true);
    setError('');
  };

  const verifyAndDisable2FA = async () => {
    setLoading(true);
    setError('');
    
    try {
      const { data: factors, error: factorsError } = await supabase.auth.mfa.listFactors();
      if (factorsError) throw factorsError;
      
      const totpFactor = factors.totp[0];
      if (!totpFactor) {
        throw new Error('No 2FA factor found');
      }
      
      const { data: challenge, error: challengeError } = await supabase.auth.mfa.challenge({
        factorId: totpFactor.id
      });
      
      if (challengeError) throw challengeError;
      
      const { data: verifyData, error: verifyError } = await supabase.auth.mfa.verify({
        factorId: totpFactor.id,
        challengeId: challenge.id,
        code: disableVerificationCode
      });
      
      if (verifyError) throw verifyError;
      
      const { error: unenrollError } = await supabase.auth.mfa.unenroll({
        factorId: totpFactor.id
      });
      
      if (unenrollError) throw unenrollError;
      
      setShowDisable2FA(false);
      setDisableVerificationCode('');
      setTimeout(() => {
        alert('2FA disabled successfully!');
        check2FAStatus();
      }, 500);
      
    } catch (err) {
      console.error('Disable 2FA error:', err);
      setError('Failed to disable 2FA: ' + err.message);
    }
    setLoading(false);
  };

  const cancelDisable2FA = () => {
    setShowDisable2FA(false);
    setDisableVerificationCode('');
    setError('');
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className={`rounded-2xl p-6 w-full max-w-md border ${
          theme === 'dark'
            ? 'bg-slate-800 border-white/20'
            : 'bg-white border-gray-200'
        }`}
      >
        <h2 className={`text-2xl font-bold mb-4 ${
          theme === 'dark' ? 'text-white' : 'text-gray-900'
        }`}>
          Two-Factor Authentication
        </h2>

        {step === 1 && (
          <div className="space-y-4">
            <p className={theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}>
              Enable 2FA for extra security on your account.
            </p>
            <button
              onClick={start2FAEnrollment}
              disabled={loading}
              className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-3 rounded-lg font-semibold hover:from-blue-700 hover:to-purple-700 transition-all duration-300 disabled:opacity-50 shadow-lg"
            >
              {loading ? 'Starting...' : 'Enable 2FA'}
            </button>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-4">
            <p className={theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}>
              Scan this QR code with Google Authenticator:
            </p>
            <div className="flex justify-center">
              <img 
                src={qrCode} 
                alt="QR Code for 2FA setup" 
                className={`w-48 h-48 border rounded-lg ${
                  theme === 'dark' ? 'border-white/20' : 'border-gray-300'
                }`} 
              />
            </div>

            {/* Manual Setup Section */}
            <div className={`p-4 rounded-lg ${
              theme === 'dark' ? 'bg-white/10' : 'bg-gray-50'
            }`}>
              <p className={`text-sm font-medium mb-2 ${
                theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
              }`}>
                Manual Setup:
              </p>
              <p className={`text-xs mb-2 ${
                theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
              }`}>
                If you can't scan the QR code, enter this secret manually:
              </p>
              <code className={`block p-2 rounded text-xs break-all font-mono ${
                theme === 'dark' 
                  ? 'bg-white/10 text-gray-300' 
                  : 'bg-gray-100 text-gray-700'
              }`}>
                {secret || 'Loading...'}
              </code>
            </div>
            
            <input
              type="text"
              placeholder="Enter 6-digit code"
              value={verificationCode}
              onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
              className={`w-full p-3 border rounded-lg text-center text-xl font-mono focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 ${
                theme === 'dark'
                  ? 'bg-white/10 border-white/20 text-white placeholder-gray-400'
                  : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
              }`}
              maxLength={6}
            />
            <button
              onClick={verify2FASetup}
              disabled={loading || verificationCode.length !== 6}
              className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-3 rounded-lg font-semibold hover:from-blue-700 hover:to-purple-700 transition-all duration-300 disabled:opacity-50 shadow-lg"
            >
              {loading ? 'Verifying...' : 'Verify & Enable'}
            </button>
          </div>
        )}

        {step === 3 && (
          <div className="text-center space-y-4">
            <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto ${
              theme === 'dark' ? 'bg-green-500/20' : 'bg-green-100'
            }`}>
              <svg className={`w-8 h-8 ${theme === 'dark' ? 'text-green-400' : 'text-green-600'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
              </svg>
            </div>
            <p className={`font-semibold ${
              theme === 'dark' ? 'text-green-400' : 'text-green-600'
            }`}>
              2FA Enabled Successfully!
            </p>
            <p className={`text-sm ${
              theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
            }`}>
              You will be signed out automatically to activate 2FA.
            </p>
          </div>
        )}

        {step === 5 && (
          <div className="space-y-4 text-center">
            <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto ${
              theme === 'dark' ? 'bg-green-500/20' : 'bg-green-100'
            }`}>
              <svg className={`w-8 h-8 ${theme === 'dark' ? 'text-green-400' : 'text-green-600'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
              </svg>
            </div>
            <p className={`font-semibold ${
              theme === 'dark' ? 'text-green-400' : 'text-green-600'
            }`}>
              2FA is Active
            </p>
            <p className={`text-sm ${
              theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
            }`}>
              Two-factor authentication is enabled on your account.
            </p>
            <button
              onClick={startDisable2FA}
              disabled={loading}
              className="w-full bg-gradient-to-r from-red-600 to-pink-600 text-white py-3 rounded-lg font-semibold hover:from-red-700 hover:to-pink-700 transition-all duration-300 disabled:opacity-50 shadow-lg"
            >
              Disable 2FA
            </button>
          </div>
        )}

        {/* Disable 2FA Verification Modal */}
        {showDisable2FA && (
          <div className={`absolute inset-0 flex items-center justify-center z-10 rounded-2xl ${
            theme === 'dark' ? 'bg-black/70' : 'bg-black/50'
          }`}>
            <div className={`p-6 rounded-lg w-full max-w-sm border ${
              theme === 'dark'
                ? 'bg-slate-800 border-white/20'
                : 'bg-white border-gray-200'
            }`}>
              <h3 className={`text-lg font-bold mb-3 ${
                theme === 'dark' ? 'text-white' : 'text-gray-900'
              }`}>
                Verify 2FA to Disable
              </h3>
              <p className={`text-sm mb-4 ${
                theme === 'dark' ? 'text-gray-300' : 'text-gray-600'
              }`}>
                Enter your current 2FA code to disable two-factor authentication.
              </p>
              
              <input
                type="text"
                placeholder="000000"
                value={disableVerificationCode}
                onChange={(e) => setDisableVerificationCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                className={`w-full p-3 border rounded-lg text-center text-xl font-mono mb-4 focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all duration-200 ${
                  theme === 'dark'
                    ? 'bg-white/10 border-white/20 text-white placeholder-gray-400'
                    : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                }`}
                maxLength={6}
                autoFocus
              />
              
              {error && (
                <div className={`mb-4 p-3 rounded-lg text-sm border ${
                  theme === 'dark'
                    ? 'bg-red-500/20 border-red-500/50 text-red-300'
                    : 'bg-red-100 border-red-200 text-red-700'
                }`}>
                  {error}
                </div>
              )}
              
              <div className="flex space-x-3">
                <button
                  onClick={cancelDisable2FA}
                  disabled={loading}
                  className={`flex-1 py-2 rounded-lg border transition-colors disabled:opacity-50 ${
                    theme === 'dark'
                      ? 'border-white/20 text-gray-300 hover:bg-white/10 hover:text-white'
                      : 'border-gray-300 text-gray-600 hover:bg-gray-50 hover:text-gray-800'
                  }`}
                >
                  Cancel
                </button>
                <button
                  onClick={verifyAndDisable2FA}
                  disabled={loading || disableVerificationCode.length !== 6}
                  className="flex-1 bg-gradient-to-r from-red-600 to-pink-600 text-white py-2 rounded-lg font-semibold hover:from-red-700 hover:to-pink-700 transition-all duration-300 disabled:opacity-50 shadow-lg"
                >
                  {loading ? 'Disabling...' : 'Disable'}
                </button>
              </div>
            </div>
          </div>
        )}

        {error && !showDisable2FA && (
          <div className={`mt-4 p-3 rounded-lg text-sm border ${
            theme === 'dark'
              ? 'bg-red-500/20 border-red-500/50 text-red-300'
              : 'bg-red-100 border-red-200 text-red-700'
          }`}>
            {error}
          </div>
        )}

        <button
          onClick={onClose}
          disabled={loading}
          className={`w-full mt-4 py-2 rounded-lg border transition-colors disabled:opacity-50 ${
            theme === 'dark'
              ? 'border-white/20 text-gray-300 hover:bg-white/10 hover:text-white'
              : 'border-gray-300 text-gray-600 hover:bg-gray-50 hover:text-gray-800'
          }`}
        >
          Close
        </button>
      </motion.div>
    </div>
  );
}