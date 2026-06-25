import React from 'react';
import { motion } from 'framer-motion';
import { Download, File, CheckCircle } from 'lucide-react';
import { useTheme } from '../../contexts/ThemeContext';

export default function BulkActions() {
  const { theme } = useTheme();

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.4 }}
      className={`backdrop-blur-lg rounded-2xl p-6 border ${
        theme === 'dark'
          ? 'bg-white/5 border-white/10'
          : 'bg-white/80 border-gray-200'
      }`}
    >
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-3">
          <div className={`p-3 rounded-xl ${
            theme === 'dark' ? 'bg-blue-500/20' : 'bg-blue-500/15'
          }`}>
            <Download className="w-6 h-6 text-blue-400" />
          </div>
          <div>
            <h3 className={`font-semibold ${
              theme === 'dark' ? 'text-white' : 'text-gray-900'
            }`}>Bulk Download</h3>
            <p className={theme === 'dark' ? 'text-gray-400 text-sm' : 'text-gray-600 text-sm'}>
              Download multiple files as ZIP
            </p>
          </div>
        </div>
        <CheckCircle className="w-5 h-5 text-green-400" />
      </div>

      <div className={`text-sm ${
        theme === 'dark' ? 'text-gray-300' : 'text-gray-600'
      }`}>
        <p>• Select multiple files in My Files page</p>
        <p>• Download all as compressed ZIP</p>
        <p>• Maintains original file names and structure</p>
      </div>
    </motion.div>
  );
}