import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import { auth, RecaptchaVerifier, signInWithPhoneNumber } from '../lib/firebaseClient';
import { Mail, Phone, Lock, Eye, EyeOff, Shield, ArrowRight, RotateCcw } from 'lucide-react';
import Verify2FA from '../components/Verify2FA';
import { useTheme } from '../contexts/ThemeContext';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [confirmationResult, setConfirmationResult] = useState(null);
  const [showPassword, setShowPassword] = useState(false);
  const [activeTab, setActiveTab] = useState('email');
  const [loading, setLoading] = useState({
    email: false,
    phone: false,
    otp: false,
    reset: false
  });
  const [resetEmail, setResetEmail] = useState('');
  const [showResetForm, setShowResetForm] = useState(false);
  const [resetSuccess, setResetSuccess] = useState(false);
  const [show2FA, setShow2FA] = useState(false);
  const [userAfter2FA, setUserAfter2FA] = useState(null);

  const navigate = useNavigate();
  const location = useLocation();
  const { theme } = useTheme();

  // ✅ Check for email verification success
  useEffect(() => {
    const urlParams = new URLSearchParams(location.search);
    const message = urlParams.get('message');
    
    if (message === 'email_verified_success') {
      alert('✅ Email verified successfully! You can now log in.');
      navigate('/login', { replace: true });
    }
    
    const verificationSuccess = sessionStorage.getItem('verification_success');
    if (verificationSuccess) {
      alert('✅ Email verified successfully! You can now log in.');
      sessionStorage.removeItem('verification_success');
    }
    
    const verificationError = sessionStorage.getItem('verification_error');
    if (verificationError) {
      alert('❌ Email verification failed: ' + verificationError);
      sessionStorage.removeItem('verification_error');
    }
  }, [location, navigate]);

  // ✅ Enhanced email login with better verification check
  const handleEmailLogin = async () => {
    setLoading(prev => ({ ...prev, email: true }));
    
    try {
      console.log('🔐 Attempting login for:', email);
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (error) {
        console.error('❌ Login error:', error);
        
        if (error.message.includes('Email not confirmed') || error.message.includes('email_not_confirmed')) {
          const { data: userData } = await supabase.auth.getUser();
          console.log('📧 User email confirmation status:', userData.user?.email_confirmed_at);
          
          alert('❌ Email not verified yet. Please check your inbox and click the verification link.');
          
          const resend = confirm('Would you like us to resend the verification email?');
          if (resend) {
            const { error: resendError } = await supabase.auth.resend({
              type: 'signup',
              email: email
            });
            if (!resendError) {
              alert('📧 Verification email sent! Please check your inbox.');
            }
          }
          return;
        }
        alert('Login failed: ' + error.message);
        return;
      }

      if (data.user && !data.user.email_confirmed_at) {
        console.log('❌ User email not confirmed in session');
        alert('❌ Email not verified. Please check your inbox and click the verification link.');
        
        await supabase.auth.signOut();
        sessionStorage.removeItem('2fa_required');
        return;
      }

      console.log('✅ Login successful, user confirmed:', data.user.email_confirmed_at);

      sessionStorage.setItem('2fa_required', 'true');

      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const { data: { user: currentUser }, error: userError } = await supabase.auth.getUser();
      
      if (userError || !currentUser) {
        console.error('Error getting user after login:', userError);
        sessionStorage.removeItem('2fa_required');
        navigate('/upload');
        return;
      }

      const { data: factors, error: factorsError } = await supabase.auth.mfa.listFactors();
      
      if (factorsError) {
        console.error('Error checking 2FA:', factorsError);
        sessionStorage.removeItem('2fa_required');
        navigate('/upload');
        return;
      }

      console.log('🔐 MFA Factors:', factors);
      
      const has2FA = factors.totp && factors.totp.length > 0;
      console.log('📱 2FA Enabled:', has2FA);

      if (has2FA) {
        console.log('🚨 Redirecting to 2FA verification page...');
        window.location.href = '/verify-2fa';
      } else {
        sessionStorage.removeItem('2fa_required');
        navigate('/upload');
      }
    } catch (err) {
      console.error('Login error:', err);
      sessionStorage.removeItem('2fa_required');
      alert('Login failed: ' + err.message);
    } finally {
      setLoading(prev => ({ ...prev, email: false }));
    }
  };

  const sendOtp = async () => {
    if (!phone) {
      alert("Please enter a phone number");
      return;
    }

    setLoading(prev => ({ ...prev, phone: true }));
    const formattedPhone = phone.startsWith('+') ? phone : `+91${phone}`;
    
    try {
      const verifier = new RecaptchaVerifier(
        auth,
        "recaptcha-container-login",
        { size: "normal" }
      );

      const confirmation = await signInWithPhoneNumber(auth, formattedPhone, verifier);
      setConfirmationResult(confirmation);
      alert("OTP sent successfully!");
      
    } catch (error) {
      console.error("Error sending OTP:", error);
      alert("Failed to send OTP: " + error.message);
    } finally {
      setLoading(prev => ({ ...prev, phone: false }));
    }
  };

  const handle2FAVerify = (success) => {
    setShow2FA(false);

    if (success && userAfter2FA) {
      const userId = userAfter2FA.id;
      const username = userAfter2FA.user_metadata?.username || 'User';

      localStorage.setItem('userId', userId);
      localStorage.setItem('username', username);

      navigate('/upload');
    } else {
      setUserAfter2FA(null);
      alert('2FA verification failed');
    }
  };

  const verifyOtp = async () => {
    setLoading(prev => ({ ...prev, otp: true }));
    try {
      const result = await confirmationResult.confirm(otp);
      alert("Logged in with phone");
      navigate('/upload');
    } catch (error) {
      alert("Invalid OTP: " + error.message);
    }
    setLoading(prev => ({ ...prev, otp: false }));
  };

  const handlePasswordReset = async () => {
    setLoading(prev => ({ ...prev, reset: true }));
    const { error } = await supabase.auth.resetPasswordForEmail(resetEmail, {
      redirectTo: `${window.location.origin}/reset-password`
    });

    if (error) {
      alert(error.message);
    } else {
      setResetSuccess(true);
    }
    setLoading(prev => ({ ...prev, reset: false }));
  };

  const resetForm = () => {
    setShowResetForm(false);
    setResetEmail('');
    setResetSuccess(false);
  };

  return (
   <div className={`min-h-screen flex items-center justify-center p-4 transition-colors duration-300 ${
  theme === 'dark' 
    ? 'bg-[#0a0f2c]'   // Profile-like deep blue
    : 'bg-gradient-to-br from-gray-50 via-blue-50 to-purple-50'
}`}>

      {/* Animated background */}
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
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md relative z-10"
      >
        <div className={`backdrop-blur-lg rounded-2xl shadow-2xl p-8 border ${
          theme === 'dark'
            ? 'bg-white/10 border-white/20'
            : 'bg-white/80 border-gray-200'
        }`}>
          <motion.div
            initial={{ scale: 0.9 }}
            animate={{ scale: 1 }}
            className="text-center mb-8"
          >
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full mb-4 shadow-lg">
              <Shield className="w-8 h-8 text-white" />
            </div>
            <h1 className={`text-3xl font-bold mb-2 ${
              theme === 'dark' ? 'text-white' : 'text-gray-900'
            }`}>
              {showResetForm ? 'Reset Password' : 'Welcome Back'}
            </h1>
            <p className={theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}>
              {showResetForm ? 'Enter your email to receive reset instructions' : 'Sign in to your secure account'}
            </p>
          </motion.div>

          {/* Reset Password Form */}
          {showResetForm ? (
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3 }}
              className="space-y-4"
            >
              {resetSuccess ? (
                <div className="text-center py-6">
                  <div className="inline-flex items-center justify-center w-16 h-16 bg-green-500/20 rounded-full mb-4">
                    <svg className="w-8 h-8 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                    </svg>
                  </div>
                  <h3 className={`text-xl font-semibold mb-2 ${
                    theme === 'dark' ? 'text-white' : 'text-gray-900'
                  }`}>Check Your Email</h3>
                  <p className={theme === 'dark' ? 'text-gray-300 mb-6' : 'text-gray-600 mb-6'}>
                    We've sent password reset instructions to {resetEmail}
                  </p>
                  <button
                    onClick={resetForm}
                    className={`flex items-center justify-center w-full py-3 rounded-lg font-medium transition-colors ${
                      theme === 'dark'
                        ? 'bg-white/10 text-white hover:bg-white/20'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    <RotateCcw className="w-4 h-4 mr-2" />
                    Back to Login
                  </button>
                </div>
              ) : (
                <>
                  <div className="relative">
                    <Mail className={`absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 ${
                      theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
                    }`} />
                    <input
                      type="email"
                      placeholder="Enter your email"
                      value={resetEmail}
                      onChange={(e) => setResetEmail(e.target.value)}
                      className={`w-full pl-12 pr-4 py-4 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 backdrop-blur-sm placeholder-${
                        theme === 'dark' ? 'gray-400' : 'gray-500'
                      } ${
                        theme === 'dark'
                          ? 'bg-white/10 border-white/20 text-white'
                          : 'bg-white border-gray-300 text-gray-800'
                      }`}
                    />
                  </div>

                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={handlePasswordReset}
                    disabled={loading.reset || !resetEmail}
                    className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-4 rounded-lg font-semibold hover:from-blue-700 hover:to-purple-700 transition-all duration-300 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center group"
                  >
                    {loading.reset ? (
                      <div className="flex items-center justify-center">
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                        Sending...
                      </div>
                    ) : (
                      'Send Reset Instructions'
                    )}
                  </motion.button>

                  <button
                    onClick={resetForm}
                    className={`w-full py-3 rounded-lg font-medium transition-colors ${
                      theme === 'dark' ? 'text-gray-300 hover:text-white' : 'text-gray-600 hover:text-gray-800'
                    }`}
                  >
                    Back to Login
                  </button>
                </>
              )}
            </motion.div>
          ) : (
            <>
              {/* Tab Navigation */}
              <div className={`flex rounded-lg p-1 mb-6 backdrop-blur-sm ${
                theme === 'dark' ? 'bg-white/10' : 'bg-gray-100'
              }`}>
                <button
                  onClick={() => setActiveTab('email')}
                  className={`flex-1 py-3 px-4 rounded-md text-sm font-medium transition-all duration-300 ${
                    activeTab === 'email'
                      ? theme === 'dark'
                        ? 'bg-white text-slate-800 shadow-md'
                        : 'bg-white text-gray-800 shadow-md'
                      : theme === 'dark'
                        ? 'text-gray-300 hover:text-white'
                        : 'text-gray-600 hover:text-gray-800'
                  }`}
                >
                  Email Login
                </button>
                <button
                  onClick={() => setActiveTab('phone')}
                  className={`flex-1 py-3 px-4 rounded-md text-sm font-medium transition-all duration-300 ${
                    activeTab === 'phone'
                      ? theme === 'dark'
                        ? 'bg-white text-slate-800 shadow-md'
                        : 'bg-white text-gray-800 shadow-md'
                      : theme === 'dark'
                        ? 'text-gray-300 hover:text-white'
                        : 'text-gray-600 hover:text-gray-800'
                  }`}
                >
                  Phone Login
                </button>
              </div>

              {activeTab === 'email' && (
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.3 }}
                  className="space-y-4"
                >
                  <div className="relative">
                    <Mail className={`absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 ${
                      theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
                    }`} />
                    <input
                      type="email"
                      placeholder="Enter your email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className={`w-full pl-12 pr-4 py-4 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 backdrop-blur-sm placeholder-${
                        theme === 'dark' ? 'gray-400' : 'gray-500'
                      } ${
                        theme === 'dark'
                          ? 'bg-white/10 border-white/20 text-white'
                          : 'bg-white border-gray-300 text-gray-800'
                      }`}
                    />
                  </div>

                  <div className="relative">
                    <Lock className={`absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 ${
                      theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
                    }`} />
                    <input
                      type={showPassword ? "text" : "password"}
                      placeholder="Enter your password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className={`w-full pl-12 pr-12 py-4 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 backdrop-blur-sm placeholder-${
                        theme === 'dark' ? 'gray-400' : 'gray-500'
                      } ${
                        theme === 'dark'
                          ? 'bg-white/10 border-white/20 text-white'
                          : 'bg-white border-gray-300 text-gray-800'
                      }`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className={`absolute right-3 top-1/2 transform -translate-y-1/2 transition-colors ${
                        theme === 'dark' ? 'text-gray-400 hover:text-white' : 'text-gray-500 hover:text-gray-700'
                      }`}
                    >
                      {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>

                  <div className="text-right">
                    <button
                      onClick={() => setShowResetForm(true)}
                      className="text-sm text-blue-400 hover:text-blue-300 transition-colors"
                    >
                      Forgot Password?
                    </button>
                  </div>

                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={handleEmailLogin}
                    disabled={loading.email}
                    className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-4 rounded-lg font-semibold hover:from-blue-700 hover:to-purple-700 transition-all duration-300 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center group"
                  >
                    {loading.email ? (
                      <div className="flex items-center justify-center">
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                        Signing in...
                      </div>
                    ) : (
                      <div className="flex items-center">
                        Sign In with Email
                        <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
                      </div>
                    )}
                  </motion.button>
                </motion.div>
              )}

              {activeTab === 'phone' && (
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.3 }}
                  className="space-y-4"
                >
                  <div className="relative">
                    <Phone className={`absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 ${
                      theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
                    }`} />
                    <input
                      type="tel"
                      placeholder="+91 Phone Number"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className={`w-full pl-12 pr-4 py-4 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200 backdrop-blur-sm placeholder-${
                        theme === 'dark' ? 'gray-400' : 'gray-500'
                      } ${
                        theme === 'dark'
                          ? 'bg-white/10 border-white/20 text-white'
                          : 'bg-white border-gray-300 text-gray-800'
                      }`}
                    />
                  </div>

                  <div id="recaptcha-container-login" className="mb-4"></div>

                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={sendOtp}
                    disabled={loading.phone}
                    className="w-full bg-gradient-to-r from-green-600 to-teal-600 text-white py-4 rounded-lg font-semibold hover:from-green-700 hover:to-teal-700 transition-all duration-300 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center group"
                  >
                    {loading.phone ? (
                      <div className="flex items-center justify-center">
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                        Sending OTP...
                      </div>
                    ) : (
                      <div className="flex items-center">
                        Send OTP
                        <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
                      </div>
                    )}
                  </motion.button>

                  <div className="relative">
                    <Lock className={`absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 ${
                      theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
                    }`} />
                    <input
                      type="text"
                      placeholder="Enter OTP"
                      value={otp}
                      onChange={(e) => setOtp(e.target.value)}
                      className={`w-full pl-12 pr-4 py-4 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200 backdrop-blur-sm placeholder-${
                        theme === 'dark' ? 'gray-400' : 'gray-500'
                      } ${
                        theme === 'dark'
                          ? 'bg-white/10 border-white/20 text-white'
                          : 'bg-white border-gray-300 text-gray-800'
                      }`}
                    />
                  </div>

                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={verifyOtp}
                    disabled={loading.otp || !otp}
                    className="w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white py-4 rounded-lg font-semibold hover:from-purple-700 hover:to-pink-700 transition-all duration-300 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center group"
                  >
                    {loading.otp ? (
                      <div className="flex items-center justify-center">
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                        Verifying...
                      </div>
                    ) : (
                      <div className="flex items-center">
                        Verify OTP
                        <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
                      </div>
                    )}
                  </motion.button>
                </motion.div>
              )}

              <div className="mt-6 text-center">
                <p className={`text-sm ${
                  theme === 'dark' ? 'text-gray-300' : 'text-gray-600'
                }`}>
                  Don't have an account?{' '}
                  <Link 
                    to="/register" 
                    className="text-blue-400 hover:text-blue-300 font-medium transition-colors duration-200 underline"
                  >
                    Register here
                  </Link>
                </p>
              </div>
            </>
          )}
        </div>
      </motion.div>
    </div>
  );
}