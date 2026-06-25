 import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { supabase } from '../../lib/supabaseClient';
import { useTheme } from '../../contexts/ThemeContext';
import { Trash2, Folder, File, CheckCircle, AlertTriangle, RefreshCw } from 'lucide-react';

export default function ClearTempFiles({ user, onClose }) {
  const [tempFiles, setTempFiles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [cleaning, setCleaning] = useState(false);
  const [scanning, setScanning] = useState(true);
  const [cleanedCount, setCleanedCount] = useState(0);
  const { theme } = useTheme();

  useEffect(() => {
    scanTempFiles();
  }, []);

  const scanTempFiles = async () => {
    setScanning(true);
    try {
      // Simulate scanning for temp files - in real app, you'd query your files table
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Mock temp files data - replace with actual query
      const mockTempFiles = [
        {
          id: 'temp-1',
          name: 'upload_cache_1.tmp',
          size: 2457600, // 2.4 MB
          created: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), // 2 hours ago
          type: 'cache'
        },
        {
          id: 'temp-2',
          name: 'preview_thumbnail.png',
          size: 512000, // 512 KB
          created: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(), // 6 hours ago
          type: 'preview'
        },
        {
          id: 'temp-3', 
          name: 'backup_export.zip',
          size: 15728640, // 15 MB
          created: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(), // 1 day ago
          type: 'backup'
        },
        {
          id: 'temp-4',
          name: 'session_data.json',
          size: 102400, // 100 KB
          created: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString(), // 12 hours ago
          type: 'session'
        }
      ];
      
      setTempFiles(mockTempFiles);
    } catch (error) {
      console.error('Error scanning temp files:', error);
    } finally {
      setScanning(false);
    }
  };

  const clearTempFiles = async () => {
    setCleaning(true);
    setCleanedCount(0);
    
    try {
      // Simulate cleaning process with progress
      for (let i = 0; i < tempFiles.length; i++) {
        await new Promise(resolve => setTimeout(resolve, 500));
        setCleanedCount(i + 1);
        
        // In real app, you'd delete actual files from storage
        // await supabase.storage.from('temp-files').remove([tempFiles[i].name]);
      }
      
      // Clear the list after cleaning
      setTempFiles([]);
      
      // Show success for 2 seconds before closing
      setTimeout(() => {
        onClose();
      }, 2000);
      
    } catch (error) {
      console.error('Error clearing temp files:', error);
      alert('Error clearing temporary files: ' + error.message);
    } finally {
      setCleaning(false);
    }
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatTimeAgo = (timestamp) => {
    const diff = Date.now() - new Date(timestamp).getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(hours / 24);
    
    if (days > 0) return `${days} day${days > 1 ? 's' : ''} ago`;
    if (hours > 0) return `${hours} hour${hours > 1 ? 's' : ''} ago`;
    return 'Less than 1 hour ago';
  };

  const getTotalSize = () => {
    return tempFiles.reduce((total, file) => total + file.size, 0);
  };

  const getFileTypeIcon = (type) => {
    switch (type) {
      case 'cache': return <RefreshCw className="w-4 h-4" />;
      case 'preview': return <File className="w-4 h-4" />;
      case 'backup': return <Folder className="w-4 h-4" />;
      case 'session': return <File className="w-4 h-4" />;
      default: return <File className="w-4 h-4" />;
    }
  };

  const getFileTypeColor = (type) => {
    switch (type) {
      case 'cache': return 'bg-orange-500/20 text-orange-400';
      case 'preview': return 'bg-blue-500/20 text-blue-400';
      case 'backup': return 'bg-purple-500/20 text-purple-400';
      case 'session': return 'bg-green-500/20 text-green-400';
      default: return 'bg-gray-500/20 text-gray-400';
    }
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
            Clear Temporary Files
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

        <div className="space-y-6">
          {/* Summary Card */}
          <div className={`p-4 rounded-xl border ${
            theme === 'dark' ? 'bg-blue-500/10 border-blue-500/20' : 'bg-blue-50 border-blue-200'
          }`}>
            <div className="flex items-center justify-between">
              <div>
                <p className={`font-semibold ${theme === 'dark' ? 'text-blue-300' : 'text-blue-800'}`}>
                  Temporary Files Found
                </p>
                <p className={`text-sm ${theme === 'dark' ? 'text-blue-400' : 'text-blue-600'}`}>
                  {tempFiles.length} files • {formatFileSize(getTotalSize())}
                </p>
              </div>
              <button
                onClick={scanTempFiles}
                disabled={scanning || cleaning}
                className={`p-2 rounded-lg transition-colors ${
                  theme === 'dark'
                    ? 'hover:bg-blue-500/20 text-blue-400 hover:text-blue-300'
                    : 'hover:bg-blue-500/15 text-blue-500 hover:text-blue-600'
                } disabled:opacity-50`}
              >
                <RefreshCw className={`w-5 h-5 ${scanning ? 'animate-spin' : ''}`} />
              </button>
            </div>
          </div>

          {/* Cleaning Progress */}
          {cleaning && (
            <div className={`p-4 rounded-xl border ${
              theme === 'dark' ? 'bg-green-500/10 border-green-500/20' : 'bg-green-50 border-green-200'
            }`}>
              <div className="flex items-center space-x-3">
                <CheckCircle className="w-5 h-5 text-green-500" />
                <div className="flex-1">
                  <p className={`font-medium ${theme === 'dark' ? 'text-green-300' : 'text-green-800'}`}>
                    Cleaning temporary files...
                  </p>
                  <p className={`text-sm ${theme === 'dark' ? 'text-green-400' : 'text-green-600'}`}>
                    {cleanedCount} of {tempFiles.length} files cleaned
                  </p>
                  <div className={`w-full rounded-full h-2 mt-2 ${theme === 'dark' ? 'bg-white/20' : 'bg-gray-200'}`}>
                    <motion.div
                      className="bg-gradient-to-r from-green-500 to-teal-500 h-2 rounded-full"
                      initial={{ width: 0 }}
                      animate={{ width: `${(cleanedCount / tempFiles.length) * 100}%` }}
                      transition={{ duration: 0.5 }}
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Success Message */}
          {cleanedCount === tempFiles.length && tempFiles.length > 0 && (
            <div className={`p-4 rounded-xl border ${
              theme === 'dark' ? 'bg-green-500/10 border-green-500/20' : 'bg-green-50 border-green-200'
            }`}>
              <div className="flex items-center space-x-3">
                <CheckCircle className="w-5 h-5 text-green-500" />
                <div>
                  <p className={`font-medium ${theme === 'dark' ? 'text-green-300' : 'text-green-800'}`}>
                    Cleanup Complete!
                  </p>
                  <p className={`text-sm ${theme === 'dark' ? 'text-green-400' : 'text-green-600'}`}>
                    {tempFiles.length} temporary files removed • {formatFileSize(getTotalSize())} freed
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Files List */}
          {scanning ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-3 text-cyan-500" />
                <p className={theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}>
                  Scanning for temporary files...
                </p>
              </div>
            </div>
          ) : tempFiles.length === 0 && !cleaning ? (
            <div className={`text-center py-12 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
              <div className={`inline-flex items-center justify-center w-16 h-16 rounded-full mb-4 ${
                theme === 'dark' ? 'bg-gray-700' : 'bg-gray-200'
              }`}>
                <CheckCircle className="w-8 h-8" />
              </div>
              <p className="text-lg font-medium">No Temporary Files</p>
              <p className="mt-2">Your storage is clean! No temporary files found.</p>
            </div>
          ) : (
            <div className="space-y-3">
              <h3 className={`font-semibold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                Files to be removed:
              </h3>
              {tempFiles.map((file) => (
                <div
                  key={file.id}
                  className={`p-3 rounded-lg border ${
                    theme === 'dark' ? 'bg-white/5 border-white/10' : 'bg-white border-gray-200'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className={`p-2 rounded-lg ${getFileTypeColor(file.type)}`}>
                        {getFileTypeIcon(file.type)}
                      </div>
                      <div>
                        <p className={`font-medium ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                          {file.name}
                        </p>
                        <div className="flex items-center space-x-4 mt-1">
                          <span className={`text-xs ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                            {formatFileSize(file.size)}
                          </span>
                          <span className={`text-xs ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                            {formatTimeAgo(file.created)}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className={`px-2 py-1 rounded-full text-xs font-medium ${
                      theme === 'dark' ? 'bg-gray-700 text-gray-300' : 'bg-gray-200 text-gray-700'
                    }`}>
                      {file.type}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Action Buttons */}
          {!scanning && tempFiles.length > 0 && !cleaning && cleanedCount === 0 && (
            <div className="flex space-x-3">
              <button
                onClick={onClose}
                className={`flex-1 py-3 rounded-lg border transition-colors ${
                  theme === 'dark'
                    ? 'border-white/20 text-gray-300 hover:bg-white/10 hover:text-white'
                    : 'border-gray-300 text-gray-600 hover:bg-gray-50 hover:text-gray-800'
                }`}
              >
                Cancel
              </button>
              <button
                onClick={clearTempFiles}
                disabled={cleaning}
                className="flex-1 bg-gradient-to-r from-red-600 to-pink-600 text-white py-3 rounded-lg font-semibold hover:from-red-700 hover:to-pink-700 transition-all duration-300 disabled:opacity-50 shadow-lg flex items-center justify-center"
              >
                <Trash2 className="w-5 h-5 mr-2" />
                Clear {tempFiles.length} Files
              </button>
            </div>
          )}

          {/* Information */}
          <div className={`p-4 rounded-xl border ${
            theme === 'dark' ? 'bg-yellow-500/10 border-yellow-500/20' : 'bg-yellow-50 border-yellow-200'
          }`}>
            <div className="flex items-center space-x-3">
              <AlertTriangle className={`w-5 h-5 ${theme === 'dark' ? 'text-yellow-400' : 'text-yellow-500'}`} />
              <p className={`text-sm ${theme === 'dark' ? 'text-yellow-300' : 'text-yellow-700'}`}>
                Temporary files include cache, previews, and backup files. Cleaning them will free up storage space but may require regenerating some previews.
              </p>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}