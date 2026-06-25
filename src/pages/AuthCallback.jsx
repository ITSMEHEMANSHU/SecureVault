import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useTheme } from '../contexts/ThemeContext';

export default function AuthCallback() {
  const navigate = useNavigate();
  const { theme } = useTheme();

  useEffect(() => {
    // The email is already verified by Supabase at this point
    // We just need to redirect to login
    setTimeout(() => {
      navigate('/login?message=email_verified_success');
    }, 2000);
  }, [navigate]);

  return (
    <div className={`min-h-screen flex items-center justify-center p-4 transition-colors duration-300 ${
      theme === 'dark' 
        ? 'bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900' 
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
        className={`backdrop-blur-lg rounded-2xl shadow-2xl p-8 border text-center max-w-md w-full ${
          theme === 'dark'
            ? 'bg-white/10 border-white/20'
            : 'bg-white/80 border-gray-200'
        }`}
      >
        {/* Success Icon */}
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.2, type: "spring" }}
          className={`inline-flex items-center justify-center w-20 h-20 rounded-full mb-6 ${
            theme === 'dark' ? 'bg-green-500/20' : 'bg-green-100'
          }`}
        >
          <svg 
            className={`w-10 h-10 ${theme === 'dark' ? 'text-green-400' : 'text-green-600'}`} 
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
          </svg>
        </motion.div>

        <h2 className={`text-2xl font-bold mb-4 ${
          theme === 'dark' ? 'text-white' : 'text-gray-900'
        }`}>
          Email Verified Successfully!
        </h2>
        
        <p className={`mb-6 ${
          theme === 'dark' ? 'text-gray-300' : 'text-gray-600'
        }`}>
          Your email has been verified. You can now log in to your account.
        </p>

        {/* Loading Animation */}
        <div className="flex flex-col items-center space-y-4">
          <div className={`w-full rounded-full h-2 ${
            theme === 'dark' ? 'bg-white/20' : 'bg-gray-200'
          }`}>
            <motion.div
              className="bg-gradient-to-r from-green-500 to-teal-500 h-2 rounded-full"
              initial={{ width: 0 }}
              animate={{ width: '100%' }}
              transition={{ duration: 2 }}
            />
          </div>
          
          <p className={`text-sm ${
            theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
          }`}>
            Redirecting to login page...
          </p>
        </div>

        {/* Manual Redirect Option */}
        <motion.button
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1 }}
          onClick={() => navigate('/login?message=email_verified_success')}
          className={`mt-6 py-2 px-6 rounded-lg font-medium transition-all duration-300 ${
            theme === 'dark'
              ? 'bg-white/10 text-white hover:bg-white/20 border border-white/20'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200 border border-gray-300'
          }`}
        >
          Click here if not redirected
        </motion.button>
      </motion.div>
    </div>
  );
}