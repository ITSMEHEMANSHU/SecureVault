import React, { useState, useEffect } from "react";
import { motion } from 'framer-motion';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from "../lib/supabaseClient";
import { auth, RecaptchaVerifier, signInWithPhoneNumber } from "../lib/firebaseClient";
import { User, Mail, Lock, Phone, Shield, CheckCircle, ArrowRight, Zap, LockIcon, Globe, Eye, EyeOff } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';

export default function Register() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("");
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [recaptchaVerifier, setRecaptchaVerifier] = useState(null);
  const [activeTab, setActiveTab] = useState('email');
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();
  const { theme } = useTheme();

  useEffect(() => {
    try {
      const verifier = new RecaptchaVerifier(
        auth,
        "recaptcha-container",
        {
          size: "normal",
          callback: (response) => {
            console.log("reCAPTCHA solved:", response);
          },
          "expired-callback": () => {
            console.log("reCAPTCHA expired");
          }
        }
      );

      setRecaptchaVerifier(verifier);

      return () => {
        if (verifier) {
          verifier.clear();
        }
      };
    } catch (error) {
      console.error("Error setting up reCAPTCHA:", error);
    }
  }, []);

  const handleSendOtp = async () => {
    if (!phone) {
      alert("Please enter a phone number");
      return;
    }

    const formattedPhone = phone.startsWith('+') ? phone : `+91${phone}`;
    setLoading(true);

    try {
      if (!recaptchaVerifier) {
        throw new Error("reCAPTCHA not ready. Please wait...");
      }

      const confirmationResult = await signInWithPhoneNumber(
        auth,
        formattedPhone,
        recaptchaVerifier
      );

      window.confirmationResult = confirmationResult;
      setOtpSent(true);
      alert("OTP sent successfully!");

    } catch (error) {
      console.error("Error sending OTP:", error);

      if (error.code === 'auth/invalid-phone-number') {
        alert("Invalid phone number format. Please use +91XXXXXXXXXX");
      } else if (error.code === 'auth/too-many-requests') {
        alert("Too many attempts. Please try again later.");
      } else {
        alert("Failed to send OTP. Please try again.");
      }

      if (recaptchaVerifier) {
        recaptchaVerifier.clear();
        const newVerifier = new RecaptchaVerifier(
          auth,
          "recaptcha-container",
          { size: "normal" }
        );
        setRecaptchaVerifier(newVerifier);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    if (!otp) {
      alert("Please enter OTP");
      return;
    }

    setLoading(true);

    try {
      const result = await window.confirmationResult.confirm(otp);
      alert("Phone number verified successfully!");
      console.log("User verified:", result.user);

    } catch (error) {
      console.error("OTP verification failed:", error);

      if (error.code === 'auth/invalid-verification-code') {
        alert("Invalid OTP. Please check and try again.");
      } else {
        alert("OTP verification failed. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleEmailSignup = async () => {
    if (!username.trim()) {
      alert("Please choose a username");
      return;
    }
    if (!email.trim() || !password.trim()) {
      alert("Please enter a valid email and password");
      return;
    }

    setLoading(true);

    try {
      const { data: existingProfiles, error: profileError } = await supabase
        .from("profiles")
        .select("id")
        .eq("email", email)
        .limit(1);

      if (profileError) {
        console.error("Error checking profiles:", profileError);
        alert("Failed to verify email. Please try again.");
        return;
      }

      if (existingProfiles.length > 0) {
        alert("❌ This email is already registered. Please log in instead.");
        return;
      }

      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { username },
          emailRedirectTo: 'http://localhost:5173/auth/callback'
        },
      });

      if (error) {
        alert("Signup failed: " + error.message);
        return;
      }

      if (data?.user) {
        alert("✅ Signup successful! Please check your email for verification link.");
        setTimeout(() => {
          navigate('/login');
        }, 2000);
      } else {
        alert("⚠️ Signup could not proceed. Please try again.");
      }

    } catch (err) {
      console.error("Registration error:", err);
      alert("Registration failed. Please try again.");
    } finally {
      setLoading(false);
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
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-purple-500 to-pink-600 rounded-full mb-4 shadow-lg">
              <Shield className="w-8 h-8 text-white" />
            </div>
            <h1 className={`text-3xl font-bold mb-2 ${
              theme === 'dark' ? 'text-white' : 'text-gray-900'
            }`}>Create Account</h1>
            <p className={theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}>Join our secure platform</p>

            {/* Security Features */}
            <div className="mt-4 flex flex-wrap justify-center gap-2">
              <div className={`inline-flex items-center px-3 py-1 rounded-full text-xs border ${
                theme === 'dark'
                  ? 'bg-purple-500/20 text-purple-300 border-purple-400/30'
                  : 'bg-purple-100 text-purple-700 border-purple-200'
              }`}>
                <LockIcon className="w-3 h-3 mr-1" />
                End-to-End Encryption
              </div>
              <div className={`inline-flex items-center px-3 py-1 rounded-full text-xs border ${
                theme === 'dark'
                  ? 'bg-pink-500/20 text-pink-300 border-pink-400/30'
                  : 'bg-pink-100 text-pink-700 border-pink-200'
              }`}>
                <Globe className="w-3 h-3 mr-1" />
                Decentralized Storage
              </div>
            </div>
          </motion.div>

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
              Email Signup
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
              Phone Signup
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
                <User className={`absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 ${
                  theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
                }`} />
                <input
                  type="text"
                  placeholder="Choose a username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  disabled={loading}
                  className={`w-full pl-12 pr-4 py-4 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200 disabled:opacity-50 backdrop-blur-sm placeholder-${
                    theme === 'dark' ? 'gray-400' : 'gray-500'
                  } ${
                    theme === 'dark'
                      ? 'bg-white/10 border-white/20 text-white'
                      : 'bg-white border-gray-300 text-gray-800'
                  }`}
                />
              </div>

              <div className="relative">
                <Mail className={`absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 ${
                  theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
                }`} />
                <input
                  type="email"
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={loading}
                  className={`w-full pl-12 pr-4 py-4 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200 disabled:opacity-50 backdrop-blur-sm placeholder-${
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
                  placeholder="Create a password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={loading}
                  className={`w-full pl-12 pr-12 py-4 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200 disabled:opacity-50 backdrop-blur-sm placeholder-${
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

              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleEmailSignup}
                disabled={loading}
                className="w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white py-4 rounded-lg font-semibold hover:from-purple-700 hover:to-pink-700 transition-all duration-300 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center group"
              >
                {loading ? (
                  <div className="flex items-center justify-center">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                    Creating Account...
                  </div>
                ) : (
                  <div className="flex items-center">
                    <CheckCircle className="w-5 h-5 mr-2" />
                    Sign Up with Email
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
                  type="text"
                  placeholder="Phone number (10 digits)"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  disabled={loading || otpSent}
                  className={`w-full pl-12 pr-4 py-4 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200 disabled:opacity-50 backdrop-blur-sm placeholder-${
                    theme === 'dark' ? 'gray-400' : 'gray-500'
                  } ${
                    theme === 'dark'
                      ? 'bg-white/10 border-white/20 text-white'
                      : 'bg-white border-gray-300 text-gray-800'
                  }`}
                />
              </div>

              {!otpSent ? (
                <>
                  <div id="recaptcha-container" className="mb-4"></div>
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={handleSendOtp}
                    disabled={loading}
                    className="w-full bg-gradient-to-r from-green-600 to-teal-600 text-white py-4 rounded-lg font-semibold hover:from-green-700 hover:to-teal-700 transition-all duration-300 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center group"
                  >
                    {loading ? (
                      <div className="flex items-center justify-center">
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                        Sending OTP...
                      </div>
                    ) : (
                      <div className="flex items-center">
                        <Zap className="w-5 h-5 mr-2" />
                        Send OTP
                        <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
                      </div>
                    )}
                  </motion.button>
                </>
              ) : (
                <>
                  <div className="relative">
                    <Lock className={`absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 ${
                      theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
                    }`} />
                    <input
                      type="text"
                      placeholder="Enter 6-digit OTP"
                      value={otp}
                      onChange={(e) => setOtp(e.target.value)}
                      disabled={loading}
                      maxLength={6}
                      className={`w-full pl-12 pr-4 py-4 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200 disabled:opacity-50 backdrop-blur-sm placeholder-${
                        theme === 'dark' ? 'gray-400' : 'gray-500'
                      } ${
                        theme === 'dark'
                          ? 'bg-white/10 border-white/20 text-white'
                          : 'bg-white border-gray-300 text-gray-800'
                      }`}
                    />
                  </div>

                  <div className="flex space-x-3">
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={handleVerifyOtp}
                      disabled={loading}
                      className="flex-1 bg-gradient-to-r from-green-600 to-teal-600 text-white py-4 rounded-lg font-semibold hover:from-green-700 hover:to-teal-700 transition-all duration-300 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center group"
                    >
                      {loading ? (
                        <div className="flex items-center justify-center">
                          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                          Verifying...
                        </div>
                      ) : (
                        <div className="flex items-center">
                          <CheckCircle className="w-5 h-5 mr-2" />
                          Verify OTP
                          <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
                        </div>
                      )}
                    </motion.button>

                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => {
                        setOtpSent(false);
                        setOtp("");
                      }}
                      disabled={loading}
                      className={`px-6 py-4 rounded-lg font-semibold transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed ${
                        theme === 'dark'
                          ? 'bg-gray-600 text-white hover:bg-gray-700'
                          : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                      }`}
                    >
                      Change
                    </motion.button>
                  </div>
                </>
              )}
            </motion.div>
          )}

          <div className="mt-6 text-center">
            <p className={`text-sm ${
              theme === 'dark' ? 'text-gray-300' : 'text-gray-600'
            }`}>
              Already have an account?{' '}
              <Link to="/login" className="text-purple-400 hover:text-purple-300 font-medium transition-colors duration-200 underline">
                Sign in here
              </Link>
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}