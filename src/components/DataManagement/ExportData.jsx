import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { supabase } from '../../lib/supabaseClient';
import { useTheme } from '../../contexts/ThemeContext';
import { Download, FileText, Database, User, Shield, Calendar, CheckCircle, Clock } from 'lucide-react';

export default function ExportData({ user, onClose }) {
  const [exportType, setExportType] = useState('all');
  const [format, setFormat] = useState('json');
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [exportHistory, setExportHistory] = useState([]);
  const { theme } = useTheme();

  useEffect(() => {
  const savedHistory = localStorage.getItem(`exportHistory_${user.id}`);
  if (savedHistory) {
    setExportHistory(JSON.parse(savedHistory));
  }
}, [user.id]);

// Save to localStorage whenever history changes
useEffect(() => {
  if (exportHistory.length > 0) {
    localStorage.setItem(`exportHistory_${user.id}`, JSON.stringify(exportHistory));
  }
}, [exportHistory, user.id]);

//   useEffect(() => {
//     fetchExportHistory();
//   }, []);

//   const fetchExportHistory = async () => {
//     // In a real app, you'd fetch from your backend
//     const mockHistory = [
//       {
//         id: '1',
//         type: 'all_data',
//         format: 'json',
//         size: '2.4 MB',
//         createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(), // 1 day ago
//         status: 'completed'
//       },
//       {
//         id: '2',
//         type: 'profile_data', 
//         format: 'csv',
//         size: '1.1 MB',
//         createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(), // 1 week ago
//         status: 'completed'
//       }
//     ];
//     setExportHistory(mockHistory);
//   };

  const gatherExportData = async () => {
    setLoading(true);
    setProgress(0);
    
    try {
      const exportData = {
        metadata: {
          exported_at: new Date().toISOString(),
          user_id: user.id,
          export_type: exportType,
          format: format
        }
      };

      setProgress(20);

      // 1. Profile Data
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (!profileError && profile) {
        exportData.profile = profile;
      }
      setProgress(40);

      // 2. Files Data (if applicable)
      if (exportType === 'all' || exportType === 'files') {
        const { data: files, error: filesError } = await supabase
          .from('files')
          .select('*')
          .eq('user_id', user.id);

        if (!filesError && files) {
          exportData.files = files;
        }
      }
      setProgress(60);

      // 3. Session Data (from auth)
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        exportData.session = {
          created_at: session.user.created_at,
          last_sign_in: session.user.last_sign_in_at,
          email: session.user.email
        };
      }
      setProgress(80);

      // 4. Additional user data
      exportData.account_info = {
        email: user.email,
        created_at: user.created_at,
        last_sign_in: user.last_sign_in_at
      };

      setProgress(100);

      // Generate and download file
      await generateDownloadFile(exportData);

      // Add to export history
      const newExport = {
        id: `export-${Date.now()}`,
        type: exportType,
        format: format,
        size: calculateSize(exportData),
        createdAt: new Date().toISOString(),
        status: 'completed'
      };
setExportHistory(prev => {
  const updated = [newExport, ...prev.slice(0, 9)]; // Keep last 10 exports
  return updated;
});

    } catch (error) {
      console.error('Export error:', error);
      alert('Error exporting data: ' + error.message);
    } finally {
      setLoading(false);
      setProgress(0);
    }
  };

  const calculateSize = (data) => {
    const size = new Blob([JSON.stringify(data)]).size;
    if (size < 1024) return `${size} B`;
    if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`;
    return `${(size / (1024 * 1024)).toFixed(1)} MB`;
  };

  const generateDownloadFile = async (data) => {
    let content, mimeType, extension;

    if (format === 'json') {
      content = JSON.stringify(data, null, 2);
      mimeType = 'application/json';
      extension = 'json';
    } else if (format === 'csv') {
      content = convertToCSV(data);
      mimeType = 'text/csv';
      extension = 'csv';
    }

    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `securefile_export_${new Date().toISOString().split('T')[0]}.${extension}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const convertToCSV = (data) => {
    // Simple CSV conversion - you can enhance this
    let csv = 'Data Type,Key,Value\n';
    
    // Profile data
    if (data.profile) {
      Object.entries(data.profile).forEach(([key, value]) => {
        csv += `Profile,${key},"${value}"\n`;
      });
    }
    
    // Files data
    if (data.files) {
      data.files.forEach((file, index) => {
        Object.entries(file).forEach(([key, value]) => {
          csv += `File_${index},${key},"${value}"\n`;
        });
      });
    }
    
    return csv;
  };

  const formatDate = (timestamp) => {
    return new Date(timestamp).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getExportTypeIcon = (type) => {
    switch (type) {
      case 'all': return <Database className="w-4 h-4" />;
      case 'profile': return <User className="w-4 h-4" />;
      case 'files': return <FileText className="w-4 h-4" />;
      default: return <Download className="w-4 h-4" />;
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
            Export Account Data
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
          {/* Export Options */}
          <div className={`p-4 rounded-xl border ${
            theme === 'dark' ? 'bg-white/5 border-white/10' : 'bg-gray-50 border-gray-200'
          }`}>
            <h3 className={`font-semibold mb-4 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
              Export Options
            </h3>
            
            <div className="grid md:grid-cols-2 gap-4">
              {/* Data Type Selection */}
              <div>
                <label className={`block text-sm font-medium mb-2 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                  Data to Export
                </label>
                <select
                  value={exportType}
                  onChange={(e) => setExportType(e.target.value)}
                  className={`w-full p-3 rounded-lg border focus:ring-2 focus:ring-cyan-500 focus:border-transparent ${
                    theme === 'dark'
                      ? 'bg-white/10 border-white/20 text-white'
                      : 'bg-white border-gray-300 text-gray-900'
                  }`}
                >
                  <option value="all">All Data</option>
                  <option value="profile">Profile Information</option>
                  <option value="files">Files & Uploads</option>
                </select>
              </div>

              {/* Format Selection */}
              <div>
                <label className={`block text-sm font-medium mb-2 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                  Export Format
                </label>
                <select
                  value={format}
                  onChange={(e) => setFormat(e.target.value)}
                  className={`w-full p-3 rounded-lg border focus:ring-2 focus:ring-cyan-500 focus:border-transparent ${
                    theme === 'dark'
                      ? 'bg-white/10 border-white/20 text-white'
                      : 'bg-white border-gray-300 text-gray-900'
                  }`}
                >
                  <option value="json">JSON</option>
                  <option value="csv">CSV</option>
                </select>
              </div>
            </div>

            {/* Progress Bar */}
            {loading && (
              <div className="mt-4">
                <div className="flex justify-between text-sm mb-2">
                  <span className={theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}>
                    Preparing export...
                  </span>
                  <span className={theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}>
                    {progress}%
                  </span>
                </div>
                <div className={`w-full rounded-full h-2 ${theme === 'dark' ? 'bg-white/20' : 'bg-gray-200'}`}>
                  <motion.div
                    className="bg-gradient-to-r from-cyan-500 to-blue-500 h-2 rounded-full"
                    initial={{ width: 0 }}
                    animate={{ width: `${progress}%` }}
                    transition={{ duration: 0.5 }}
                  />
                </div>
              </div>
            )}

            {/* Export Button */}
            <button
              onClick={gatherExportData}
              disabled={loading}
              className="w-full mt-4 bg-gradient-to-r from-cyan-600 to-blue-600 text-white py-3 rounded-lg font-semibold hover:from-cyan-700 hover:to-blue-700 transition-all duration-300 disabled:opacity-50 shadow-lg flex items-center justify-center"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                  Exporting Data...
                </>
              ) : (
                <>
                  <Download className="w-5 h-5 mr-2" />
                  Export Data
                </>
              )}
            </button>
          </div>

         {/* Export History */}
<div className={`p-4 rounded-xl border ${
  theme === 'dark' ? 'bg-white/5 border-white/10' : 'bg-gray-50 border-gray-200'
}`}>
  <h3 className={`font-semibold mb-4 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
    Export History
  </h3>
  
  {exportHistory.length === 0 ? (
    <div className={`text-center py-6 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
      <FileText className="w-12 h-12 mx-auto mb-3 opacity-50" />
      <p>No exports yet</p>
      <p className="text-sm mt-1">Your export history will appear here</p>
    </div>
  ) : (
    <div className="space-y-3">
      {exportHistory.map((exportItem) => (
        <div
          key={exportItem.id}
          className={`p-3 rounded-lg border ${
            theme === 'dark' ? 'bg-white/5 border-white/10' : 'bg-white border-gray-200'
          }`}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className={`p-2 rounded-lg ${
                theme === 'dark' ? 'bg-green-500/20' : 'bg-green-500/15'
              }`}>
                <CheckCircle className="w-4 h-4 text-green-500" />
              </div>
              <div>
                <p className={`font-medium ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                  {exportItem.type === 'all' ? 'All Data' : 
                   exportItem.type === 'profile' ? 'Profile Data' : 'Files Data'}
                </p>
                <p className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                  {exportItem.format.toUpperCase()} • {exportItem.size}
                </p>
              </div>
            </div>
            <div className="text-right">
              <p className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                {formatDate(exportItem.createdAt)}
              </p>
            </div>
          </div>
        </div>
      ))}
    </div>
  )}
</div>

          {/* Information */}
          <div className={`p-4 rounded-xl border ${
            theme === 'dark' ? 'bg-blue-500/10 border-blue-500/20' : 'bg-blue-50 border-blue-200'
          }`}>
            <div className="flex items-center space-x-3">
              <Shield className={`w-5 h-5 ${theme === 'dark' ? 'text-blue-400' : 'text-blue-500'}`} />
              <p className={`text-sm ${theme === 'dark' ? 'text-blue-300' : 'text-blue-700'}`}>
                Your data export includes all your account information, files metadata, and profile details. 
                Large exports may take a few moments to prepare.
              </p>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}