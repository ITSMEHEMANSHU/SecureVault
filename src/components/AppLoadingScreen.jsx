import React from 'react';
import { motion } from 'framer-motion';
import { useTheme } from '../contexts/ThemeContext';

export default function AppLoadingScreen({
  message = 'Loading...',
  accent = 'cyan',
  size = 'md',
}) {
  const { theme } = useTheme();

  const spinnerSize = size === 'lg' ? 'h-16 w-16 border-4' : 'h-10 w-10 border-[3px]';
  const accentClass = accent === 'blue'
    ? theme === 'dark'
      ? 'border-blue-400'
      : 'border-blue-500'
    : theme === 'dark'
      ? 'border-cyan-400'
      : 'border-cyan-500';

  return (
    <div
      className={`min-h-screen flex items-center justify-center relative overflow-hidden transition-colors duration-300 ${
        theme === 'dark'
          ? 'bg-[#0a0f2c]'
          : 'bg-gradient-to-br from-gray-50 via-blue-50 to-purple-50'
      }`}
    >
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className={`absolute -top-40 -right-40 w-80 h-80 rounded-full blur-3xl opacity-20 ${
          theme === 'dark' ? 'bg-cyan-500/20' : 'bg-cyan-400/20'
        }`} />
        <div className={`absolute -bottom-40 -left-40 w-80 h-80 rounded-full blur-3xl opacity-20 ${
          theme === 'dark' ? 'bg-purple-500/20' : 'bg-purple-400/20'
        }`} />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative z-10 text-center"
      >
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1.6, repeat: Infinity, ease: 'linear' }}
          className={`rounded-full ${spinnerSize} ${accentClass} border-t-transparent mx-auto mb-4`}
        />
        <p className={theme === 'dark' ? 'text-cyan-200' : 'text-blue-700'}>
          {message}
        </p>
      </motion.div>
    </div>
  );
}
