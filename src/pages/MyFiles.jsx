import React, { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from 'framer-motion';
import axios from "axios";
import { Download, CheckCircle, AlertCircle, File, FileText, Image, Video, Music, Archive, Link, ExternalLink, Clock, Database, Upload, Search, Filter, MoreVertical, Shield, ShieldCheck, ShieldAlert, Trash2, X, Check } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import { useTheme } from '../contexts/ThemeContext';
import JSZip from 'jszip';

export default function MyFiles() {
  const [files, setFiles] = useState([]);
  const [filteredFiles, setFilteredFiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [verifying, setVerifying] = useState(null);
  const [downloading, setDownloading] = useState(null);
  const [deleting, setDeleting] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState("newest");
  const [selectedFile, setSelectedFile] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(null);
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [showBulkDeleteModal, setShowBulkDeleteModal] = useState(false);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const navigate = useNavigate();
  const { theme } = useTheme();

  // Memoized file processing for better performance
  const processedFiles = useMemo(() => {
    return files.map(file => ({
      ...file,
      searchableName: file.name.toLowerCase(),
      extension: file.name.split('.').pop().toLowerCase()
    }));
  }, [files]);

  useEffect(() => {
  const fetchFiles = async () => {
  try {
    console.log("🔄 Getting user from Supabase...");
    
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError) {
      console.error("❌ User error:", userError);
      setLoading(false);
      return;
    }

    if (!user) {
      console.log("❌ No user logged in - redirecting to login");
      setLoading(false);
      navigate("/login");
      return;
    }

    console.log("✅ User found:", user.id);

    // ✅ FIXED: Join with blockchain_transactions to get verification status
    const { data, error: filesError } = await supabase
      .from('files')
      .select(`
        *,
        blockchain_transactions (
          tx_hash,
          status,
          created_at
        )
      `)
      .eq('user_id', user.id)
      .order('uploaded_at', { ascending: false });

    if (filesError) {
      throw filesError;
    }

    // ✅ Process the data to include txHash from blockchain_transactions
    const processedData = (data || []).map(file => ({
      ...file,
      // Use the tx_hash from blockchain_transactions if it exists
      txHash: file.blockchain_transactions && file.blockchain_transactions.length > 0 
        ? file.blockchain_transactions[0].tx_hash 
        : null,
      // Also keep the blockchain_transactions array for reference
      blockchainStatus: file.blockchain_transactions && file.blockchain_transactions.length > 0 
        ? file.blockchain_transactions[0].status 
        : null
    }));

    console.log("✅ Files with blockchain data:", processedData);
    
    setFiles(processedData);
    setFilteredFiles(processedData);
      
  } catch (error) {
    console.error("❌ Error fetching files:", error);
    setFiles([]);
    setFilteredFiles([]);
  } finally {
    setLoading(false);
  }
};

  fetchFiles();
}, [navigate]);


  useEffect(() => {
    if (!processedFiles.length) return;

    let result = processedFiles.filter(file =>
      file.searchableName.includes(searchTerm.toLowerCase())
    );

    // Sort files
    result.sort((a, b) => {
      switch (sortBy) {
        case "newest":
          return new Date(b.uploaded_at) - new Date(a.uploaded_at);
        case "oldest":
          return new Date(a.uploaded_at) - new Date(b.uploaded_at);
        case "name":
          return a.name.localeCompare(b.name);
        case "size":
          return b.size - a.size;
        default:
          return 0;
      }
    });

    setFilteredFiles(result);
  }, [searchTerm, sortBy, processedFiles]);

  const getFileIcon = (fileName) => {
    const extension = fileName.split('.').pop().toLowerCase();
    const iconMap = {
      'pdf': FileText,
      'doc': FileText,
      'docx': FileText,
      'txt': FileText,
      'jpg': Image,
      'jpeg': Image,
      'png': Image,
      'gif': Image,
      'mp4': Video,
      'avi': Video,
      'mov': Video,
      'mp3': Music,
      'wav': Music,
      'zip': Archive,
      'rar': Archive,
      '7z': Archive,
    };
    
    const IconComponent = iconMap[extension] || File;
    return <IconComponent className="w-6 h-6" />;
  };

 const getFileTypeColor = (fileName) => {
  const extension = fileName.split('.').pop().toLowerCase();
  const colorMap = {
    'pdf': theme === 'dark' ? 'from-red-500/30 to-red-600/30 border-red-400/30' : 'from-red-500/20 to-red-600/20 border-red-200',
    'doc': theme === 'dark' ? 'from-blue-500/30 to-blue-600/30 border-blue-400/30' : 'from-blue-500/20 to-blue-600/20 border-blue-200',
    'docx': theme === 'dark' ? 'from-blue-500/30 to-blue-600/30 border-blue-400/30' : 'from-blue-500/20 to-blue-600/20 border-blue-200',
    'txt': theme === 'dark' ? 'from-gray-500/30 to-gray-600/30 border-gray-400/30' : 'from-gray-500/20 to-gray-600/20 border-gray-200',
    'jpg': theme === 'dark' ? 'from-pink-500/30 to-pink-600/30 border-pink-400/30' : 'from-pink-500/20 to-pink-600/20 border-pink-200',
    'jpeg': theme === 'dark' ? 'from-pink-500/30 to-pink-600/30 border-pink-400/30' : 'from-pink-500/20 to-pink-600/20 border-pink-200',
    'png': theme === 'dark' ? 'from-pink-500/30 to-pink-600/30 border-pink-400/30' : 'from-pink-500/20 to-pink-600/20 border-pink-200',
    'gif': theme === 'dark' ? 'from-pink-500/30 to-pink-600/30 border-pink-400/30' : 'from-pink-500/20 to-pink-600/20 border-pink-200',
    'mp4': theme === 'dark' ? 'from-purple-500/30 to-purple-600/30 border-purple-400/30' : 'from-purple-500/20 to-purple-600/20 border-purple-200',
    'avi': theme === 'dark' ? 'from-purple-500/30 to-purple-600/30 border-purple-400/30' : 'from-purple-500/20 to-purple-600/20 border-purple-200',
    'mov': theme === 'dark' ? 'from-purple-500/30 to-purple-600/30 border-purple-400/30' : 'from-purple-500/20 to-purple-600/20 border-purple-200',
    'mp3': theme === 'dark' ? 'from-green-500/30 to-green-600/30 border-green-400/30' : 'from-green-500/20 to-green-600/20 border-green-200',
    'wav': theme === 'dark' ? 'from-green-500/30 to-green-600/30 border-green-400/30' : 'from-green-500/20 to-green-600/20 border-green-200',
    'zip': theme === 'dark' ? 'from-yellow-500/30 to-yellow-600/30 border-yellow-400/30' : 'from-yellow-500/20 to-yellow-600/20 border-yellow-200',
    'rar': theme === 'dark' ? 'from-yellow-500/30 to-yellow-600/30 border-yellow-400/30' : 'from-yellow-500/20 to-yellow-600/20 border-yellow-200',
    '7z': theme === 'dark' ? 'from-yellow-500/30 to-yellow-600/30 border-yellow-400/30' : 'from-yellow-500/20 to-yellow-600/20 border-yellow-200',
  };
  
  return colorMap[extension] || (theme === 'dark' 
    ? 'from-gray-500/30 to-gray-600/30 border-gray-400/30' 
    : 'from-gray-500/20 to-gray-600/20 border-gray-200'
  );
};

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const handleDownload = async (file) => {
    setDownloading(file.id);
    try {
      const response = await axios.post(
        "http://localhost:5000/api/download",
        { cid: file.cid, iv: file.iv },
        { responseType: "blob", timeout: 30000 }
      );

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", file.name);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error("❌ Download failed:", error);
      alert("Download failed");
    } finally {
      setDownloading(null);
    }
  };

  const handleVerify = async (cid, fileId) => {
  setVerifying(cid);
  try {
    // First check if we already have a transaction in database
    const { data: existingTx, error: txCheckError } = await supabase
      .from('blockchain_transactions')
      .select('tx_hash, status')
      .eq('file_id', fileId)
      .limit(1);

    if (txCheckError) {
      console.error('❌ Error checking existing transaction:', txCheckError);
    }

    if (existingTx && existingTx.length > 0 && existingTx[0].tx_hash && !existingTx[0].tx_hash.startsWith('legacy') && !existingTx[0].tx_hash.startsWith('temp')) {
      // Already in database with real tx_hash - just update local state
      setFiles(prevFiles => 
        prevFiles.map(file => 
          file.id === fileId ? { 
            ...file, 
            txHash: existingTx[0].tx_hash,
            blockchainStatus: existingTx[0].status
          } : file
        )
      );
      console.log('✅ File already verified in database with real tx_hash');
      return;
    }

    // Check blockchain directly
    const response = await axios.get(
      `http://localhost:5000/api/verify/${cid}`,
      { 
        timeout: 15000,
        headers: {
          'Content-Type': 'application/json'
        }
      }
    );

    console.log('🔍 Verification API response:', response.data);

    if (response.data && response.data.success) {
      // File exists on blockchain - create/update the database record
      let insertError = null;
      
      if (existingTx && existingTx.length > 0) {
        // Update existing record
        const { error } = await supabase
          .from('blockchain_transactions')
          .update({
            tx_hash: response.data.txHash,
            file_hash: response.data.storedHash || '',
            contract_address: response.data.contractAddress || '',
            status: 'verified',
            created_at: new Date().toISOString()
          })
          .eq('file_id', fileId);
        insertError = error;
      } else {
        // Insert new record
        const { error } = await supabase
          .from('blockchain_transactions')
          .insert({
            file_id: fileId,
            tx_hash: response.data.txHash,
            cid: cid,
            file_hash: response.data.storedHash || '',
            contract_address: response.data.contractAddress || '',
            status: 'verified',
            created_at: new Date().toISOString()
          });
        insertError = error;
      }

      if (insertError) {
        console.error('❌ Failed to store verification:', insertError);
      } else {
        console.log('✅ Updated blockchain transaction record');
      }

      // Update local state
      setFiles(prevFiles => 
        prevFiles.map(file => 
          file.id === fileId ? { 
            ...file, 
            txHash: response.data.txHash,
            blockchainStatus: 'verified'
          } : file
        )
      );
    } else {
      // Handle specific error messages
      if (response.data && response.data.message) {
        if (response.data.message.includes('Contract not deployed')) {
          alert("❌ Blockchain contract not deployed. Please contact administrator.");
        } else {
          alert("❌ Verification failed: " + response.data.message);
        }
      } else {
        alert("❌ File not found on blockchain");
      }
    }
  } catch (error) {
    console.error("❌ Verification failed:", error);
    if (error.response) {
      console.error("Server response:", error.response.data);
      if (error.response.data && error.response.data.message) {
        alert("Verification failed: " + error.response.data.message);
      } else {
        alert("Verification failed: Server error");
      }
    } else {
      alert("Verification failed: " + error.message);
    }
  } finally {
    setVerifying(null);
  }
};

  const handleDelete = async (fileId, cid) => {
    setDeleting(fileId);
    try {
      // Call backend to delete from IPFS
      const response = await axios.delete(
        `http://localhost:5000/api/delete/${cid}`,
        { timeout: 15000 }
      );

      if (response.data && response.data.success) {
        // Update local state
        setFiles(prevFiles => prevFiles.filter(file => file.id !== fileId));
        setFilteredFiles(prevFiles => prevFiles.filter(file => file.id !== fileId));
        
        console.log('✅ File deleted successfully');
        alert("✅ File deleted successfully");
        
        // Close modal after successful deletion
        setShowDeleteModal(null);
      } else {
        throw new Error(response.data?.message || 'Failed to delete file from IPFS');
      }
    } catch (error) {
      console.error("❌ Delete failed:", error);
      alert("Delete failed: " + error.message);
    } finally {
      setDeleting(null);
    }
  };

  const handleBulkDelete = async () => {
    setDeleting('bulk');
    try {
      const deletePromises = selectedFiles.map(fileId => {
        const file = files.find(f => f.id === fileId);
        if (file) {
          return axios.delete(`http://localhost:5000/api/delete/${file.cid}`, { timeout: 15000 });
        }
        return Promise.resolve();
      });

      const results = await Promise.all(deletePromises);
      
      // Update local state
      setFiles(prevFiles => prevFiles.filter(file => !selectedFiles.includes(file.id)));
      setFilteredFiles(prevFiles => prevFiles.filter(file => !selectedFiles.includes(file.id)));
      setSelectedFiles([]);
      
      console.log('✅ Files deleted successfully');
      alert(`✅ ${selectedFiles.length} files deleted successfully`);
      
      // Close modal
      setShowBulkDeleteModal(false);
    } catch (error) {
      console.error("❌ Bulk delete failed:", error);
      alert("Bulk delete failed: " + error.message);
    } finally {
      setDeleting(null);
    }
  };

  const toggleFileSelection = (fileId) => {
    setSelectedFiles(prev => {
      if (prev.includes(fileId)) {
        return prev.filter(id => id !== fileId);
      } else {
        return [...prev, fileId];
      }
    });
  };

  const selectAllFiles = () => {
    if (selectedFiles.length === filteredFiles.length) {
      setSelectedFiles([]);
    } else {
      setSelectedFiles(filteredFiles.map(file => file.id));
    }
  };

  // Add this function after the other handle functions
const handleBulkDownload = async () => {
  if (selectedFiles.length === 0) {
    alert("Please select files to download");
    return;
  }

  setDownloading('bulk');
  
  try {
    const zip = new JSZip();
    const selectedFileData = files.filter(f => selectedFiles.includes(f.id));
    
    // Download all files and add to zip
    for (let i = 0; i < selectedFileData.length; i++) {
      const file = selectedFileData[i];
      
      try {
        const response = await axios.post(
          "http://localhost:5000/api/download",
          { cid: file.cid, iv: file.iv },
          { responseType: "blob", timeout: 30000 }
        );
        
        // Add file to zip with original name
        zip.file(file.name, response.data);
        
      } catch (error) {
        console.error(`Failed to download ${file.name}:`, error);
        // Continue with other files even if one fails
      }
    }

    // Generate the zip file
    const zipContent = await zip.generateAsync({ 
      type: "blob",
      compression: "DEFLATE",
      compressionOptions: { level: 6 }
    });

    // Create download link for the zip
    const url = window.URL.createObjectURL(zipContent);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `secured-files-${new Date().getTime()}.zip`);
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);

    setSelectedFiles([]);
    alert(`✅ ${selectedFileData.length} files downloaded as ZIP successfully!`);
    
  } catch (error) {
    console.error("❌ Bulk download failed:", error);
    alert("Bulk download failed: " + error.message);
  } finally {
    setDownloading(null);
  }
};

  const FileDetailModal = ({ file, onClose }) => (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        onClick={(e) => e.stopPropagation()}
        className={`backdrop-blur-lg rounded-3xl shadow-2xl max-w-md w-full border ${
          theme === 'dark'
            ? 'bg-slate-800/95 border-white/20'
            : 'bg-white/95 border-gray-200'
        }`}
      >
<div className={`p-6 bg-gradient-to-r ${getFileTypeColor(file.name)} rounded-t-3xl border-b ${
  theme === 'dark' ? 'bg-opacity-30' : 'bg-opacity-20'
}`}>
            <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              {getFileIcon(file.name)}
              <h3 className="text-xl font-bold text-white truncate drop-shadow-lg">{file.name}</h3>
            </div>
            <button onClick={onClose} className="text-white/80 hover:text-white text-2xl font-light">
              ×
            </button>
          </div>
        </div>
        
        <div className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className={`p-3 rounded-xl ${
              theme === 'dark' ? 'bg-white/10' : 'bg-gray-100/50'
            }`}>
              <label className={`text-sm font-medium ${
                theme === 'dark' ? 'text-gray-300' : 'text-gray-600'
              }`}>Size</label>
              <p className={`font-semibold ${
                theme === 'dark' ? 'text-white' : 'text-gray-800'
              }`}>{formatFileSize(file.size)}</p>
            </div>
            <div className={`p-3 rounded-xl ${
              theme === 'dark' ? 'bg-white/10' : 'bg-gray-100/50'
            }`}>
              <label className={`text-sm font-medium ${
                theme === 'dark' ? 'text-gray-300' : 'text-gray-600'
              }`}>Uploaded</label>
              <p className={`font-semibold ${
                theme === 'dark' ? 'text-white' : 'text-gray-800'
              }`}>{new Date(file.uploaded_at).toLocaleDateString()}</p>
            </div>
          </div>
          
          <div className={`p-3 rounded-xl ${
            theme === 'dark' ? 'bg-white/10' : 'bg-gray-100/50'
          }`}>
            <label className={`text-sm font-medium ${
              theme === 'dark' ? 'text-gray-300' : 'text-gray-600'
            }`}>IPFS CID</label>
            <p className={`font-mono text-sm break-all ${
              theme === 'dark' ? 'text-white' : 'text-gray-800'
            }`}>{file.cid}</p>
          </div>
          
          {file.txHash && (
            <div className={`p-3 rounded-xl border ${
              theme === 'dark'
                ? 'bg-green-500/10 border-green-400/30'
                : 'bg-green-100/50 border-green-200'
            }`}>
              <label className={`text-sm font-medium ${
                theme === 'dark' ? 'text-green-300' : 'text-green-700'
              }`}>Transaction Hash</label>
              <p className={`font-mono text-sm break-all ${
                theme === 'dark' ? 'text-green-300' : 'text-green-800'
              }`}>{file.txHash}</p>
            </div>
          )}
        </div>
        
        <div className="p-6 border-t border-white/20 flex space-x-3">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => handleDownload(file)}
            className="flex-1 flex items-center justify-center gap-2 bg-gradient-to-r from-blue-500 to-blue-600 text-white py-3 rounded-xl font-semibold hover:from-blue-600 hover:to-blue-700 transition-all shadow-lg"
          >
            <Download className="w-5 h-5" />
            Download
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => handleVerify(file.cid, file.id)}
            disabled={verifying === file.cid || (file.txHash && !file.txHash.startsWith('legacy') && !file.txHash.startsWith('temp'))}
            className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-semibold transition-all shadow-lg ${
              verifying === file.cid || (file.txHash && !file.txHash.startsWith('legacy') && !file.txHash.startsWith('temp'))
                ? theme === 'dark'
                  ? 'bg-gray-500/30 text-gray-300 cursor-not-allowed'
                  : 'bg-gray-400/30 text-gray-500 cursor-not-allowed'
                : 'bg-gradient-to-r from-purple-500 to-purple-600 text-white hover:from-purple-600 hover:to-purple-700'
            }`}
          >
            {verifying === file.cid ? (
              <>
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                  className="w-4 h-4 border-2 border-white border-t-transparent rounded-full"
                />
                Verifying...
              </>
            ) : (file.txHash && !file.txHash.startsWith('legacy') && !file.txHash.startsWith('temp')) ? (
              <>
                <ShieldCheck className="w-5 h-5" />
                Verified
              </>
            ) : (
              <>
                <Shield className="w-5 h-5" />
                Verify
              </>
            )}
          </motion.button>
        </div>
        
        <div className="p-6 pt-0">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setShowDeleteModal(file)}
            className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-red-500 to-red-600 text-white py-3 rounded-xl font-semibold hover:from-red-600 hover:to-red-700 transition-all shadow-lg"
          >
            <Trash2 className="w-5 h-5" />
            Delete File
          </motion.button>
        </div>
      </motion.div>
    </motion.div>
  );

  const DeleteConfirmationModal = ({ file, onConfirm, onCancel }) => (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      onClick={onCancel}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        onClick={(e) => e.stopPropagation()}
        className={`backdrop-blur-lg rounded-3xl shadow-2xl max-w-md w-full border ${
          theme === 'dark'
            ? 'bg-slate-800/95 border-white/20'
            : 'bg-white/95 border-gray-200'
        }`}
      >
        <div className="p-6 bg-gradient-to-r from-red-500/20 to-red-600/20 rounded-t-3xl border-b border-red-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-red-500/20 rounded-full">
                <Trash2 className="w-6 h-6 text-red-500" />
              </div>
              <h3 className="text-xl font-bold text-red-700">Delete File</h3>
            </div>
            <button onClick={onCancel} className="text-red-700/80 hover:text-red-700 text-2xl font-light">
              ×
            </button>
          </div>
        </div>
        
        <div className="p-6">
          <p className={`mb-6 ${
            theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
          }`}>
            Are you sure you want to delete <span className="font-semibold">{file.name}</span>? 
            This action cannot be undone and will permanently remove the file from IPFS and our database.
          </p>
          
          <div className="flex space-x-3">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={onCancel}
              className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-semibold transition-all ${
                theme === 'dark'
                  ? 'bg-gray-600 text-gray-300 hover:bg-gray-500'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              <X className="w-5 h-5" />
              Cancel
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => onConfirm(file.id, file.cid)}
              disabled={deleting === file.id}
              className="flex-1 flex items-center justify-center gap-2 bg-gradient-to-r from-red-500 to-red-600 text-white py-3 rounded-xl font-semibold hover:from-red-600 hover:to-red-700 transition-all shadow-lg disabled:opacity-50"
            >
              {deleting === file.id ? (
                <>
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                    className="w-4 h-4 border-2 border-white border-t-transparent rounded-full"
                  />
                  Deleting...
                </>
              ) : (
                <>
                  <Trash2 className="w-5 h-5" />
                  Delete
                </>
              )}
            </motion.button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );

  const BulkDeleteConfirmationModal = ({ files, onConfirm, onCancel }) => (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      onClick={onCancel}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        onClick={(e) => e.stopPropagation()}
        className={`backdrop-blur-lg rounded-3xl shadow-2xl max-w-md w-full border ${
          theme === 'dark'
            ? 'bg-slate-800/95 border-white/20'
            : 'bg-white/95 border-gray-200'
        }`}
      >
        <div className="p-6 bg-gradient-to-r from-red-500/20 to-red-600/20 rounded-t-3xl border-b border-red-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-red-500/20 rounded-full">
                <Trash2 className="w-6 h-6 text-red-500" />
              </div>
              <h3 className="text-xl font-bold text-red-700">Delete Files</h3>
            </div>
            <button onClick={onCancel} className="text-red-700/80 hover:text-red-700 text-2xl font-light">
              ×
            </button>
          </div>
        </div>
        
        <div className="p-6">
          <p className={`mb-4 ${
            theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
          }`}>
            Are you sure you want to delete these <span className="font-semibold">{files.length} files</span>? 
            This action cannot be undone and will permanently remove the files from IPFS and our database.
          </p>
          
          <div className={`max-h-40 overflow-y-auto mb-6 rounded-lg p-3 ${
            theme === 'dark' ? 'bg-gray-700/50' : 'bg-gray-100/50'
          }`}>
            <ul className="space-y-1">
              {files.map(file => (
                <li key={file.id} className={`text-sm flex items-center ${
                  theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                }`}>
                  <File className="w-4 h-4 mr-2" />
                  <span className="truncate">{file.name}</span>
                </li>
              ))}
            </ul>
          </div>
          
          <div className="flex space-x-3">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={onCancel}
              className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-semibold transition-all ${
                theme === 'dark'
                  ? 'bg-gray-600 text-gray-300 hover:bg-gray-500'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              <X className="w-5 h-5" />
              Cancel
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={onConfirm}
              disabled={deleting === 'bulk'}
              className="flex-1 flex items-center justify-center gap-2 bg-gradient-to-r from-red-500 to-red-600 text-white py-3 rounded-xl font-semibold hover:from-red-600 hover:to-red-700 transition-all shadow-lg disabled:opacity-50"
            >
              {deleting === 'bulk' ? (
                <>
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                    className="w-4 h-4 border-2 border-white border-t-transparent rounded-full"
                  />
                  Deleting...
                </>
              ) : (
                <>
                  <Trash2 className="w-5 h-5" />
                  Delete All
                </>
              )}
            </motion.button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );

  if (loading) {
    return (
      <div className={`min-h-screen flex items-center justify-center relative transition-colors duration-300 ${
  theme === 'dark'
    ? 'bg-gradient-to-br from-blue-900 via-blue-950 to-blue-900'
    : 'bg-gradient-to-br from-gray-50 via-purple-50 to-blue-50'
}`}>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className={`text-center ${
            theme === 'dark' ? 'text-white' : 'text-gray-900'
          }`}
        >
          <div className="relative">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
              className={`rounded-full h-20 w-20 border-4 mx-auto mb-6 border-t-transparent ${
                theme === 'dark' 
                  ? 'border-blue-400' 
                  : 'border-blue-500'
              }`}
            />
            <div className="absolute inset-0 flex items-center justify-center">
              <Database className={`w-8 h-8 ${
                theme === 'dark' ? 'text-blue-300' : 'text-blue-500'
              }`} />
            </div>
          </div>
          
          <h3 className={`text-xl font-semibold mb-2 bg-gradient-to-r from-blue-300 to-purple-300 bg-clip-text text-transparent`}>
            Loading Your Digital Vault
          </h3>
          <p className={theme === 'dark' ? 'text-blue-200 mb-4' : 'text-blue-600 mb-4'}>
            Securely accessing your files...
          </p>
          
          {/* Progress Bar */}
          <div className={`w-64 h-2 rounded-full overflow-hidden mx-auto ${
            theme === 'dark' ? 'bg-blue-900/50' : 'bg-blue-200/50'
          }`}>
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${loadingProgress}%` }}
              transition={{ duration: 0.5 }}
              className="h-full bg-gradient-to-r from-blue-400 to-purple-400 rounded-full"
            />
          </div>
          <p className={theme === 'dark' ? 'text-blue-200 text-sm mt-2' : 'text-blue-600 text-sm mt-2'}>
            {loadingProgress}%
          </p>
        </motion.div>
      </div>
    );
  }

  return (
  <div className="min-h-screen relative overflow-hidden transition-colors duration-300">

      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className={`absolute -top-40 -left-40 w-80 h-80 rounded-full blur-3xl animate-pulse ${
          theme === 'dark' ? 'bg-purple-500/10' : 'bg-purple-400/20'
        }`}></div>
        <div className={`absolute -bottom-40 -right-40 w-80 h-80 rounded-full blur-3xl animate-pulse delay-1000 ${
          theme === 'dark' ? 'bg-blue-500/10' : 'bg-blue-400/20'
        }`}></div>
        <div className={`absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 rounded-full blur-3xl animate-pulse delay-500 ${
          theme === 'dark' ? 'bg-indigo-500/5' : 'bg-indigo-400/15'
        }`}></div>
      </div>

      <div className="relative z-10 py-8 px-4">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <motion.div
                        initial={{ opacity: 0, y: -30 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8 text-center"
          >
         <h1 className={`text-5xl font-bold bg-gradient-to-r from-blue-400 via-purple-400 to-blue-500 bg-clip-text text-transparent mb-4 drop-shadow-lg ${
  theme === 'dark' ? 'text-white' : 'text-gray-900'
}`}>
  Secure File Vault
</h1>
            <p className={`text-lg ${
              theme === 'dark' ? 'text-blue-200' : 'text-blue-600'
            }`}>Your blockchain-verified digital archive</p>
          </motion.div>

          {/* Controls */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className={`backdrop-blur-lg rounded-2xl shadow-2xl p-6 mb-8 border ${
              theme === 'dark'
                ? 'bg-white/10 border-white/20'
                : 'bg-white/80 border-gray-200'
            }`}
          >
            <div className="flex flex-col lg:flex-row gap-4 items-center justify-between">
              <div className="flex-1 relative">
                <Search className={`absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 ${
                  theme === 'dark' ? 'text-blue-300' : 'text-blue-500'
                }`} />
                <input
                  type="text"
                  placeholder="Search files..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className={`w-full pl-10 pr-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent placeholder-${
                    theme === 'dark' ? 'blue-200' : 'blue-400'
                  } ${
                    theme === 'dark'
                      ? 'bg-white/5 border-white/20 text-white'
                      : 'bg-white border-gray-300 text-gray-800'
                  }`}
                />
              </div>
              
              <div className="flex gap-4">
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className={`border rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-400 ${
                    theme === 'dark'
                      ? 'bg-white/5 border-white/20 text-white'
                      : 'bg-white border-gray-300 text-gray-800'
                  }`}
                >
                  <option value="newest" className={theme === 'dark' ? 'bg-slate-800' : 'bg-white'}>Newest First</option>
                  <option value="oldest" className={theme === 'dark' ? 'bg-slate-800' : 'bg-white'}>Oldest First</option>
                  <option value="name" className={theme === 'dark' ? 'bg-slate-800' : 'bg-white'}>Name A-Z</option>
                  <option value="size" className={theme === 'dark' ? 'bg-slate-800' : 'bg-white'}>Largest First</option>
                </select>
                
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => navigate("/upload")}
                  className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-xl font-semibold hover:from-blue-600 hover:to-purple-700 transition-all duration-200 shadow-lg border border-blue-400/30"
                >
                  <Upload className="w-5 h-5" />
                  Upload New
                </motion.button>
              </div>
            </div>
          </motion.div>

          {/* Bulk Actions Bar */}
          {selectedFiles.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              className={`backdrop-blur-lg rounded-2xl shadow-2xl p-4 mb-6 border ${
                theme === 'dark'
                  ? 'bg-white/10 border-white/20'
                  : 'bg-white/80 border-gray-200'
              } flex items-center justify-between`}
            >
              <div className="flex items-center">
                <span className={`font-medium ${
                  theme === 'dark' ? 'text-white' : 'text-gray-800'
                }`}>
                  {selectedFiles.length} file{selectedFiles.length !== 1 ? 's' : ''} selected
                </span>
                <button
                  onClick={selectAllFiles}
                  className={`ml-4 text-sm ${
                    theme === 'dark' ? 'text-blue-300 hover:text-blue-200' : 'text-blue-600 hover:text-blue-700'
                  }`}
                >
                  {selectedFiles.length === filteredFiles.length ? 'Deselect All' : 'Select All'}
                </button>
              </div>

              <div className="flex gap-3">
               {/* Bulk Download Button */}
<motion.button
  whileHover={{ scale: 1.05 }}
  whileTap={{ scale: 0.95 }}
  onClick={handleBulkDownload}
  disabled={downloading === 'bulk'}
  className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-xl font-semibold hover:from-blue-600 hover:to-blue-700 transition-all shadow-lg disabled:opacity-50"
>
                  {downloading === 'bulk' ? (
                    <>
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                        className="w-4 h-4 border-2 border-white border-t-transparent rounded-full"
                      />
                      Downloading...
                    </>
                  ) : (
                    <>
                      <Download className="w-4 h-4" />
                      Download Selected ({selectedFiles.length})
                    </>
                  )}
                </motion.button>
                
               <motion.button
  whileHover={{ scale: 1.05 }}
  whileTap={{ scale: 0.95 }}
  onClick={() => setShowBulkDeleteModal(true)}
  className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-xl font-semibold hover:from-red-600 hover:to-red-700 transition-all shadow-lg"
>
                  <Trash2 className="w-4 h-4" />
                  Delete Selected
                </motion.button>
              </div>
            </motion.div>
          )}

          {/* Files Grid */}
          {filteredFiles.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className={`backdrop-blur-lg rounded-2xl shadow-2xl p-12 text-center border ${
                theme === 'dark'
                  ? 'bg-white/10 border-white/20'
                  : 'bg-white/80 border-gray-200'
              }`}
            >
              <motion.div
                animate={{ y: [0, -10, 0] }}
                transition={{ duration: 2, repeat: Infinity }}
                className={`inline-flex items-center justify-center w-24 h-24 rounded-full mb-6 border ${
                  theme === 'dark'
                    ? 'bg-gradient-to-r from-blue-500/20 to-purple-500/20 border-white/20'
                    : 'bg-gradient-to-r from-blue-500/10 to-purple-500/10 border-gray-200'
                }`}
              >
                <File className={`w-12 h-12 ${
                  theme === 'dark' ? 'text-blue-300' : 'text-blue-500'
                }`} />
              </motion.div>
              <h3 className={`text-2xl font-semibold mb-3 ${
                theme === 'dark' ? 'text-white' : 'text-gray-800'
              }`}>No files found</h3>
              <p className={`mb-8 max-w-md mx-auto ${
                theme === 'dark' ? 'text-blue-200' : 'text-blue-600'
              }`}>
                {searchTerm ? "Try adjusting your search terms" : "Upload your first file to start building your secure vault"}
              </p>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => navigate("/upload")}
                className="inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-xl font-semibold hover:from-blue-600 hover:to-purple-700 transition-all duration-200 shadow-lg border border-blue-400/30"
              >
                <Upload className="w-5 h-5" />
                Upload Files
              </motion.button>
            </motion.div>
          ) : (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              <AnimatePresence>
                {filteredFiles.map((file) => (
                  <motion.div
                    key={file.id}
                    layout
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    whileHover={{ y: -8, scale: 1.02 }}
                    className={`backdrop-blur-lg rounded-2xl shadow-2xl border overflow-hidden transition-all duration-300 group relative ${
                      theme === 'dark'
                        ? 'bg-white/10 border-white/20 hover:border-white/40'
                        : 'bg-white/80 border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    {/* Selection Checkbox */}
                    <div 
                      className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 z-10"
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleFileSelection(file.id);
                      }}
                    >
                      <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center cursor-pointer ${
                        selectedFiles.includes(file.id) 
                          ? 'bg-blue-500 border-blue-500' 
                          : theme === 'dark'
                            ? 'bg-white/20 border-white/40'
                            : 'bg-gray-200 border-gray-400'
                      }`}>
                        {selectedFiles.includes(file.id) && <Check className="w-4 h-4 text-white" />}
                      </div>
                    </div>

                    {/* File Header */}
                 <div className={`p-4 bg-gradient-to-r ${getFileTypeColor(file.name)} border-b ${
  theme === 'dark' ? 'border-white/20' : 'border-gray-200'
} ${theme === 'dark' ? 'bg-opacity-20' : 'bg-opacity-10'}`}>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          {getFileIcon(file.name)}
                          <span className="text-sm font-semibold text-white capitalize drop-shadow-lg">
                            {file.extension}
                          </span>
                        </div>
                        <button
                          onClick={() => setSelectedFile(file)}
                          className={`opacity-0 group-hover:opacity-100 transition-opacity duration-200 p-1 rounded ${
                            theme === 'dark' 
                              ? 'hover:bg-white/20 text-white'
                              : 'hover:bg-gray-200 text-gray-600'
                          }`}
                        >
                          <MoreVertical className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    {/* File Content */}
                    <div className="p-5">
                      <h3 className={`font-semibold mb-3 truncate drop-shadow-lg ${
                        theme === 'dark' ? 'text-white' : 'text-gray-800'
                      }`} title={file.name}>
                        {file.name}
                      </h3>

                      <div className="space-y-2 mb-4">
                        <div className={`flex items-center text-sm ${
                          theme === 'dark' ? 'text-blue-200' : 'text-blue-600'
                        }`}>
                          <Clock className="w-4 h-4 mr-2 flex-shrink-0" />
                          <span>{new Date(file.uploaded_at).toLocaleDateString()}</span>
                        </div>
                        
                        <div className={`flex items-center text-sm ${
                          theme === 'dark' ? 'text-blue-200' : 'text-blue-600'
                        }`}>
                          <Database className="w-4 h-4 mr-2 flex-shrink-0" />
                          <span className="truncate font-mono">{file.cid.substring(0, 12)}...</span>
                        </div>

                        <div className={`text-sm font-semibold drop-shadow-lg ${
                          theme === 'dark' ? 'text-white' : 'text-gray-800'
                        }`}>
                          {formatFileSize(file.size)}
                        </div>
                      </div>

                      {/* Enhanced Verify Status */}
                      <div className="mb-4">
                        {(file.txHash && !file.txHash.startsWith('legacy') && !file.txHash.startsWith('temp')) || 
                         (file.blockchain_transactions && file.blockchain_transactions.length > 0 && 
                          file.blockchain_transactions[0].tx_hash && 
                          !file.blockchain_transactions[0].tx_hash.startsWith('legacy') && 
                          !file.blockchain_transactions[0].tx_hash.startsWith('temp')) ? (
                        <div className={`inline-flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-semibold border ${
  theme === 'dark' 
    ? 'bg-green-500/20 border-green-400/30 text-green-300' 
    : 'bg-green-100 border-green-200 text-green-700'
}`}>
  <ShieldCheck className="w-4 h-4" />
  <span>Verified on Blockchain</span>
</div>
                        ) : (
                         <div className={`inline-flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-semibold border ${
  theme === 'dark' 
    ? 'bg-yellow-500/20 border-yellow-400/30 text-yellow-300' 
    : 'bg-yellow-100 border-yellow-200 text-yellow-700'
}`}>
  <ShieldAlert className="w-4 h-4" />
  <span>Awaiting Verification</span>
</div>
                        )}
                      </div>

                      {/* Action Buttons */}
                      <div className="flex gap-2">
                        <motion.button
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={() => handleDownload(file)}
                          disabled={downloading === file.id}
                          className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg text-sm font-semibold hover:from-blue-600 hover:to-blue-700 transition-all duration-200 disabled:opacity-50 shadow-lg border border-blue-400/30"
                        >
                          {downloading === file.id ? (
                            <>
                              <motion.div
                                animate={{ rotate: 360 }}
                                transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                                className="w-3 h-3 border-2 border-white border-t-transparent rounded-full"
                              />
                              Downloading...
                            </>
                          ) : (
                            <>
                              <Download className="w-4 h-4" />
                              Download
                            </>
                          )}
                        </motion.button>

                        {/* Enhanced Verify Button */}
                        <motion.button
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={() => handleVerify(file.cid, file.id)}
                          disabled={verifying === file.cid || 
                                    (file.txHash && !file.txHash.startsWith('legacy') && !file.txHash.startsWith('temp')) ||
                                    (file.blockchain_transactions && file.blockchain_transactions.length > 0 && 
                                     file.blockchain_transactions[0].tx_hash && 
                                     !file.blockchain_transactions[0].tx_hash.startsWith('legacy') && 
                                     !file.blockchain_transactions[0].tx_hash.startsWith('temp'))}
                          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-200 disabled:opacity-50 shadow-lg border ${
                            verifying === file.cid
                              ? theme === 'dark'
                                ? 'bg-gray-500/30 text-gray-300 border-gray-400/30'
                                : 'bg-gray-400/30 text-gray-500 border-gray-400/30'
                             : (file.txHash && !file.txHash.startsWith('legacy') && !file.txHash.startsWith('temp')) ||
  (file.blockchain_transactions && file.blockchain_transactions.length > 0 && 
   file.blockchain_transactions[0].tx_hash && 
   !file.blockchain_transactions[0].tx_hash.startsWith('legacy') && 
   !file.blockchain_transactions[0].tx_hash.startsWith('temp'))
? theme === 'dark'
  ? 'bg-green-500/20 text-green-300 border-green-400/30 cursor-default'
  : 'bg-green-100 text-green-700 border-green-300 cursor-default'
: 'bg-gradient-to-r from-blue-500 to-blue-600 text-white border-blue-400/30 hover:from-blue-600 hover:to-blue-700'
                          }`}
                        >
                          {verifying === file.cid ? (
                            <>
                              <motion.div
                                animate={{ rotate: 360 }}
                                transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                                className="w-3 h-3 border-2 border-white border-t-transparent rounded-full"
                              />
                              Verifying...
                            </>
                          ) : (file.txHash && !file.txHash.startsWith('legacy') && !file.txHash.startsWith('temp')) ||
                              (file.blockchain_transactions && file.blockchain_transactions.length > 0 && 
                               file.blockchain_transactions[0].tx_hash && 
                               !file.blockchain_transactions[0].tx_hash.startsWith('legacy') && 
                               !file.blockchain_transactions[0].tx_hash.startsWith('temp')) ? (
                            <>
                              <ShieldCheck className="w-4 h-4" />
                              Verified
                            </>
                          ) : (
                            <>
                              <Shield className="w-4 h-4" />
                              Verify
                            </>
                          )}
                        </motion.button>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )}

          {/* File Count */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className={`mt-8 text-center text-sm ${
              theme === 'dark' ? 'text-blue-200' : 'text-blue-600'
            }`}
          >
            Showing {filteredFiles.length} of {files.length} secured files
          </motion.div>
        </div>
      </div>

      {/* File Detail Modal */}
      <AnimatePresence>
        {selectedFile && (
          <FileDetailModal file={selectedFile} onClose={() => setSelectedFile(null)} />
        )}
      </AnimatePresence>

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {showDeleteModal && (
          <DeleteConfirmationModal 
            file={showDeleteModal} 
            onConfirm={handleDelete} 
            onCancel={() => setShowDeleteModal(null)} 
          />
        )}
      </AnimatePresence>

      {/* Bulk Delete Confirmation Modal */}
      <AnimatePresence>
        {showBulkDeleteModal && (
          <BulkDeleteConfirmationModal 
            files={filteredFiles.filter(file => selectedFiles.includes(file.id))}
            onConfirm={handleBulkDelete}
            onCancel={() => setShowBulkDeleteModal(false)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}