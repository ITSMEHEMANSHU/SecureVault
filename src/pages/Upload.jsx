import React, { useState, useEffect } from "react";
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import axios from "axios";
import { supabase } from '../lib/supabaseClient';
import { useTheme } from '../contexts/ThemeContext';
import { useNotificationPreferences } from '../contexts/NotificationPreferencesContext';
import { Upload as UploadIcon, File, CheckCircle, ExternalLink, User, FileText, Image, Video, Music, Archive, Shield, Lock, Globe, Zap } from 'lucide-react';
import { createCofheClient, createCofheConfig } from "@cofhe/sdk/web";
import { getChainById } from "@cofhe/sdk/chains";

import {
  createPublicClient,
  createWalletClient,
  custom,
  http
} from "viem";

import { sepolia } from "viem/chains";
import { Encryptable } from "@cofhe/sdk";

export default function Upload() {
  const [files, setFiles] = useState([]);
  const [uploaded, setUploaded] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [user, setUser] = useState(null);
  const navigate = useNavigate();
  const { theme } = useTheme();
  const { preferences } = useNotificationPreferences(); 
  const [userProfile, setUserProfile] = useState(null); 

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
      
      if (user) {
        const { data: profile, error } = await supabase
          .from('profiles')
          .select('username, profile_picture_url')
          .eq('id', user.id)
          .single();
          
        if (!error && profile) {
          setUserProfile(profile);
        }
      }
      
      if (!user) {
        alert("❌ Please login first!");
        navigate('/login');
        return;
      }
    };
    
    getUser();
  }, [navigate]); 

  const getCurrentUsername = () => {
    return userProfile?.username || user?.user_metadata?.username || user?.email || 'User';
  };

  const handleFileChange = (e) => {
    const selectedFiles = Array.from(e.target.files);
    setFiles(selectedFiles);
  };

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const droppedFiles = Array.from(e.dataTransfer.files);
      setFiles(droppedFiles);
    }
  };

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
    return <IconComponent className="w-5 h-5" />;
  };

  const getFileTypeColor = (fileName) => {
    const extension = fileName.split('.').pop().toLowerCase();
    const colorMap = {
      'pdf': 'bg-red-500/20 text-red-600 border-red-200',
      'doc': 'bg-blue-500/20 text-blue-600 border-blue-200',
      'docx': 'bg-blue-500/20 text-blue-600 border-blue-200',
      'txt': 'bg-gray-500/20 text-gray-600 border-gray-200',
      'jpg': 'bg-pink-500/20 text-pink-600 border-pink-200',
      'jpeg': 'bg-pink-500/20 text-pink-600 border-pink-200',
      'png': 'bg-pink-500/20 text-pink-600 border-pink-200',
      'gif': 'bg-pink-500/20 text-pink-600 border-pink-200',
      'mp4': 'bg-purple-500/20 text-purple-600 border-purple-200',
      'avi': 'bg-purple-500/20 text-purple-600 border-purple-200',
      'mov': 'bg-purple-500/20 text-purple-600 border-purple-200',
      'mp3': 'bg-green-500/20 text-green-600 border-green-200',
      'wav': 'bg-green-500/20 text-green-600 border-green-200',
      'zip': 'bg-yellow-500/20 text-yellow-600 border-yellow-200',
      'rar': 'bg-yellow-500/20 text-yellow-600 border-yellow-200',
      '7z': 'bg-yellow-500/20 text-yellow-600 border-yellow-200',
    };
    
    return colorMap[extension] || 'bg-gray-500/20 text-gray-600 border-gray-200';
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const handleUpload = async () => {
    if (!user) {
      alert("❌ Please login first!");
      navigate('/login');
      return;
    }

    if (files.length === 0) {
      alert("Please select files to upload");
      return;
    }

    setUploading(true);
    let results = [];

    try {
      if (!window.ethereum) throw new Error("MetaMask is not installed!");

      const provider = window.ethereum;
      
      const accounts = await provider.request({ 
        method: 'eth_requestAccounts' 
      });
      
      if (!accounts || accounts.length === 0) {
        throw new Error("No accounts found. Please connect MetaMask.");
      }

      const account = accounts[0];
      console.log("Connected account:", account);

      let chainId = await provider.request({ method: 'eth_chainId' });
      console.log("Current chain ID:", chainId);
      
      if (chainId !== '0xaa36a7') { 
        try {
          await provider.request({
            method: 'wallet_switchEthereumChain',
            params: [{ chainId: '0xaa36a7' }],
          });
        } catch (switchError) {
          if (switchError.code === 4902) {
            await provider.request({
              method: 'wallet_addEthereumChain',
              params: [{
                chainId: '0xaa36a7',
                chainName: 'Sepolia Test Network',
                nativeCurrency: { name: 'SepoliaETH', symbol: 'ETH', decimals: 18 },
                rpcUrls: ['https://rpc2.sepolia.org'],
                blockExplorerUrls: ['https://sepolia.etherscan.io']
              }]
            });
          }
        }
        await new Promise(resolve => setTimeout(resolve, 2000));
        chainId = await provider.request({ method: 'eth_chainId' });
        console.log("Updated chain ID:", chainId);
      }

      console.log("Initializing CoFHE client...");

      const publicClient = createPublicClient({
        chain: sepolia,
        transport: http("https://rpc.sepolia.org")
      });

      const walletClient = createWalletClient({
        chain: sepolia,
        transport: custom(window.ethereum)
      });

      const cofheChain = getChainById(11155111);

      if (!cofheChain) {
        throw new Error("Sepolia chain not found");
      }

      const cofheConfig = createCofheConfig({
        supportedChains: [cofheChain],
        useWorkers: true
      });

      const fhenixClient = createCofheClient(cofheConfig);

      await fhenixClient.connect(publicClient, walletClient);

      console.log(fhenixClient.connection);
      console.log("Client connection:", fhenixClient.connection);
      console.log("Connected:", fhenixClient.connected);

      for (let i = 0; i < files.length; i++) {
        const formData = new FormData();
        formData.append("file", files[i]);
        formData.append("userId", user.id);
        formData.append("notificationPreferences", JSON.stringify(preferences));

        console.log("🔐 Starting FHE encryption for:", files[i].name);
        
        const fileSize = BigInt(files[i].size);
        
        const encrypted = await fhenixClient
          .encryptInputs([
            Encryptable.uint32(fileSize)
          ])
          .execute();

        console.dir(encrypted, { depth: null });

        const serializedEncrypted = JSON.parse(
          JSON.stringify(encrypted, (_, v) => typeof v === 'bigint' ? v.toString() : v)
        );

        console.log("Serialized encrypted:", serializedEncrypted);

        const encryptedKeywords = Array.isArray(serializedEncrypted)
          ? serializedEncrypted.map(encValue => ({
              ctHash: String(encValue.ctHash),
              securityZone: encValue.securityZone || 0,
              utype: encValue.utype || 0,
              signature: encValue.signature || "0x"
            }))
          : [{
              ctHash: String(serializedEncrypted.ctHash),
              securityZone: serializedEncrypted.securityZone || 0,
              utype: serializedEncrypted.utype || 0,
              signature: serializedEncrypted.signature || "0x"
            }];

        console.log("Final encrypted keywords:", encryptedKeywords);
        formData.append("encryptedKeywords", JSON.stringify(encryptedKeywords));

        const res = await axios.post("http://localhost:5000/api/upload", formData, {
          headers: { "Content-Type": "multipart/form-data" },
          onUploadProgress: (progressEvent) => {
            const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
            console.log(`Upload progress for ${files[i].name}: ${percentCompleted}%`);
          }
        });

        results.push({ ...res.data, fileName: files[i].name, fileSize: files[i].size });
        setUploaded([...results]);

        if (window.refreshNotifications) {
          setTimeout(() => window.refreshNotifications(), 500);
        }
      }
      
      console.log("✅ All files uploaded successfully with FHE encryption");
      
    } catch (err) {
      console.error("Setup Error:", err);
      alert(`⚠️ ${err.message}`);
    } finally {
      setUploading(false);
      setFiles([]);
    }
  };

  return (
    <div className="min-h-screen relative overflow-hidden transition-colors duration-300">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className={`absolute -top-40 -right-40 w-80 h-80 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse pointer-events-none ${
          theme === 'dark' ? 'bg-purple-500/20' : 'bg-purple-400/30'
        }`}></div>

        <div className={`absolute -bottom-40 -left-40 w-80 h-80 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse pointer-events-none ${
          theme === 'dark' ? 'bg-pink-500/20' : 'bg-pink-400/30'
        }`}></div>

        <div className={`absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-80 h-80 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse pointer-events-none ${
          theme === 'dark' ? 'bg-blue-500/20' : 'bg-blue-400/30'
        }`}></div>
      </div>

      <div className="max-w-6xl mx-auto relative z-10">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full mb-4 shadow-lg">
            <UploadIcon className="w-8 h-8 text-white" />
          </div>
          <h1 className={`text-4xl font-bold mb-2 ${
            theme === 'dark' ? 'text-white' : 'text-gray-900'
          }`}>Secure File Upload</h1>
          <p className={theme === 'dark' ? 'text-gray-300 text-lg' : 'text-gray-600 text-lg'}>
            Upload and encrypt your files with blockchain verification
          </p>
          
          <div className="mt-6 flex flex-wrap justify-center gap-4">
            <div className={`inline-flex items-center px-4 py-2 rounded-full text-sm border ${
              theme === 'dark'
                ? 'bg-blue-500/20 text-blue-300 border-blue-400/30'
                : 'bg-blue-500/15 text-blue-600 border-blue-400/40'
            }`}>
              <Shield className="w-4 h-4 mr-2" />
              Military-Grade Encryption
            </div>
            <div className={`inline-flex items-center px-4 py-2 rounded-full text-sm border ${
              theme === 'dark'
                ? 'bg-purple-500/20 text-purple-300 border-purple-400/30'
                : 'bg-purple-500/15 text-purple-600 border-purple-400/40'
            }`}>
              <Lock className="w-4 h-4 mr-2" />
              Blockchain Verified
            </div>
            <div className={`inline-flex items-center px-4 py-2 rounded-full text-sm border ${
              theme === 'dark'
                ? 'bg-green-500/20 text-green-300 border-green-400/30'
                : 'bg-green-500/15 text-green-600 border-green-400/40'
            }`}>
              <Zap className="w-4 h-4 mr-2" />
              Lightning Fast
            </div>
          </div>

          <div className={`mt-6 inline-flex items-center px-6 py-3 rounded-full text-sm border backdrop-blur-sm ${
            theme === 'dark'
              ? 'bg-gradient-to-r from-blue-600/30 to-purple-600/30 text-white border-white/20'
              : 'bg-gradient-to-r from-blue-500/15 to-purple-500/15 text-gray-800 border-gray-300'
          }`}>
            <User className="w-5 h-5 mr-2" />
            Welcome, <strong className="ml-1">{getCurrentUsername()}!</strong>
          </div>
        </motion.div>

        <div className="grid gap-8 lg:grid-cols-2">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className={`backdrop-blur-lg rounded-2xl shadow-2xl p-8 border ${
              theme === 'dark'
                ? 'bg-white/10 border-white/20'
                : 'bg-white/80 border-gray-200/60 shadow-lg'
            }`}
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className={`text-2xl font-bold ${
                theme === 'dark' ? 'text-white' : 'text-gray-900'
              }`}>Upload Files</h2>
              <div className={`flex items-center px-3 py-1 rounded-full text-sm ${
                theme === 'dark'
                  ? 'bg-green-500/20 text-green-400'
                  : 'bg-green-500/15 text-green-600'
              }`}>
                <Globe className="w-4 h-4 mr-1" />
                IPFS Network
              </div>
            </div>
            
            <div
              className={`relative border-2 border-dashed rounded-xl p-8 text-center transition-all duration-300 mb-6 backdrop-blur-sm ${
                dragActive
                  ? theme === 'dark'
                    ? 'border-blue-400 bg-blue-500/10'
                    : 'border-blue-500 bg-blue-500/10'
                  : theme === 'dark'
                    ? 'border-white/30 hover:border-white/50 bg-white/5'
                    : 'border-gray-300 hover:border-gray-400 bg-white/50'
              }`}
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
            >
              <input
                type="file"
                multiple
                onChange={handleFileChange}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              />
              <div className="space-y-4">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full">
                  <UploadIcon className="w-8 h-8 text-white" />
                </div>
                <div>
                  <p className={`text-xl font-semibold mb-2 ${
                    theme === 'dark' ? 'text-white' : 'text-gray-900'
                  }`}>
                    Drop files here or click to browse
                  </p>
                  <p className={theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}>
                    Support for all file types. Multiple files allowed.
                  </p>
                  <p className={`text-sm mt-2 ${
                    theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
                  }`}>
                    Files are automatically encrypted before upload
                  </p>
                </div>
              </div>
            </div>

            {files.length > 0 && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="mb-6"
              >
                <div className="flex items-center justify-between mb-3">
                  <h3 className={`text-lg font-semibold ${
                    theme === 'dark' ? 'text-white' : 'text-gray-900'
                  }`}>Selected Files ({files.length})</h3>
                  <button
                    onClick={() => setFiles([])}
                    className={`transition-colors duration-200 text-sm ${
                      theme === 'dark' ? 'text-gray-400 hover:text-red-400' : 'text-gray-500 hover:text-red-500'
                    }`}
                  >
                    Clear All
                  </button>
                </div>
                <div className="space-y-3 max-h-60 overflow-y-auto">
                  {files.map((file, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      className={`flex items-center justify-between p-4 rounded-lg border ${
                        theme === 'dark'
                          ? 'bg-white/5 border-white/10'
                          : 'bg-white border-gray-200'
                      }`}
                    >
                      <div className="flex items-center">
                        <div className={`p-3 rounded-lg border ${getFileTypeColor(file.name)}`}>
                          {getFileIcon(file.name)}
                        </div>
                        <div className="ml-4 flex-1 min-w-0">
                          <p className={`font-medium truncate ${
                            theme === 'dark' ? 'text-white' : 'text-gray-900'
                          }`}>
                            {file.name}
                          </p>
                          <p className={theme === 'dark' ? 'text-gray-400 text-sm' : 'text-gray-600 text-sm'}>
                            {formatFileSize(file.size)}
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={() => {
                          const newFiles = files.filter((_, i) => i !== index);
                          setFiles(newFiles);
                        }}
                        className={`transition-colors duration-200 ml-2 ${
                          theme === 'dark' ? 'text-gray-400 hover:text-red-400' : 'text-gray-500 hover:text-red-500'
                        }`}
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            )}

            <motion.button
              whileHover={{ scale: files.length > 0 ? 1.02 : 1 }}
              whileTap={{ scale: files.length > 0 ? 0.98 : 1 }}
              onClick={handleUpload}
              disabled={files.length === 0 || uploading}
              className={`w-full py-4 rounded-xl font-bold text-lg transition-all duration-300 shadow-xl ${
                files.length === 0 || uploading
                  ? theme === 'dark'
                    ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
                    : 'bg-gray-400 text-gray-600 cursor-not-allowed'
                  : 'bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:from-blue-700 hover:to-purple-700 shadow-blue-500/25'
              }`}
            >
              {uploading ? (
                <div className="flex items-center justify-center">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white mr-3"></div>
                  🔐 Encrypting & Uploading...
                </div>
              ) : (
                <div className="flex items-center justify-center">
                  <UploadIcon className="w-6 h-6 mr-3" />
                  Upload {files.length > 0 ? `${files.length} File${files.length > 1 ? 's' : ''}` : 'Files'}
                </div>
              )}
            </motion.button>

            {files.length > 0 && (
              <div className={`mt-4 text-center text-sm ${
                theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
              }`}>
                Total size: {formatFileSize(files.reduce((acc, file) => acc + file.size, 0))}
              </div>
            )}
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className={`backdrop-blur-lg rounded-2xl shadow-2xl p-8 border ${
              theme === 'dark'
                ? 'bg-white/10 border-white/20'
                : 'bg-white/80 border-gray-200/60 shadow-lg'
            }`}
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className={`text-2xl font-bold ${
                theme === 'dark' ? 'text-white' : 'text-gray-900'
              }`}>Upload Results</h2>
              {uploaded.length > 0 && (
                <div className={`flex items-center px-3 py-1 rounded-full text-sm ${
                  theme === 'dark'
                    ? 'bg-green-500/20 text-green-400'
                    : 'bg-green-500/15 text-green-600'
                }`}>
                  <CheckCircle className="w-4 h-4 mr-1" />
                  {uploaded.length} Success
                </div>
              )}
            </div>
            
            {uploaded.length === 0 ? (
              <div className="text-center py-16">
                <div className={`inline-flex items-center justify-center w-20 h-20 rounded-full mb-6 ${
                  theme === 'dark' ? 'bg-white/10' : 'bg-gray-100'
                }`}>
                  <File className={`w-10 h-10 ${
                    theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
                  }`} />
                </div>
                <h3 className={`text-xl font-semibold mb-2 ${
                  theme === 'dark' ? 'text-white' : 'text-gray-900'
                }`}>No uploads yet</h3>
                <p className={theme === 'dark' ? 'text-gray-400 mb-6' : 'text-gray-600 mb-6'}>
                  Upload files to see encrypted results here
                </p>
                <div className={`flex flex-col space-y-3 text-sm ${
                  theme === 'dark' ? 'text-gray-500' : 'text-gray-600'
                }`}>
                  <div className="flex items-center justify-center">
                    <Shield className={`w-4 h-4 mr-2 ${
                      theme === 'dark' ? 'text-blue-400' : 'text-blue-500'
                    }`} />
                    Files are encrypted before upload
                  </div>
                  <div className="flex items-center justify-center">
                    <Globe className={`w-4 h-4 mr-2 ${
                      theme === 'dark' ? 'text-purple-400' : 'text-purple-500'
                    }`} />
                    Stored on decentralized IPFS network
                  </div>
                  <div className="flex items-center justify-center">
                    <Lock className={`w-4 h-4 mr-2 ${
                      theme === 'dark' ? 'text-green-400' : 'text-green-500'
                    }`} />
                    Blockchain verified for authenticity
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                {uploaded.map((file, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className={`p-5 rounded-xl backdrop-blur-sm border ${
                      theme === 'dark'
                        ? 'bg-gradient-to-r from-green-500/10 to-emerald-500/10 border-green-400/20'
                        : 'bg-gradient-to-r from-green-500/10 to-emerald-500/10 border-green-400/30'
                    }`}
                  >
                    <div className="flex items-start">
                      <div className="flex-shrink-0 mt-1">
                        <CheckCircle className="w-6 h-6 text-green-400" />
                      </div>
                      <div className="ml-4 flex-1">
                        <h4 className={`text-lg font-semibold mb-2 ${
                          theme === 'dark' ? 'text-white' : 'text-gray-900'
                        }`}>
                          {file.fileName}
                        </h4>
                        <div className="grid grid-cols-2 gap-2 mb-3">
                          <div className="text-sm">
                            <span className={theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}>Size:</span>
                            <span className="text-green-400 ml-2">{formatFileSize(file.fileSize)}</span>
                          </div>
                          <div className="text-sm">
                            <span className={theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}>Status:</span>
                            <span className="text-green-400 ml-2">✓ Encrypted</span>
                          </div>
                        </div>
                        <div className="mb-3">
                          <span className={`text-sm ${
                            theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                          }`}>CID:</span>
                          <div className={`text-xs text-green-300 p-2 rounded mt-1 font-mono break-all ${
                            theme === 'dark' ? 'bg-green-900/30' : 'bg-green-500/10'
                          }`}>
                            {file.cid}
                          </div>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          <a
                            href={file.link}
                            target="_blank"
                            rel="noreferrer"
                            className={`inline-flex items-center px-4 py-2 rounded-lg text-sm transition-colors duration-200 border ${
                              theme === 'dark'
                                ? 'bg-green-500/20 text-green-300 hover:bg-green-500/30 border-green-400/30'
                                : 'bg-green-500/15 text-green-600 hover:bg-green-500/25 border-green-400/40'
                            }`}
                          >
                            <ExternalLink className="w-4 h-4 mr-2" />
                            View on IPFS
                          </a>
                          <button
                            onClick={() => navigator.clipboard.writeText(file.cid)}
                            className={`px-4 py-2 rounded-lg text-sm transition-colors duration-200 border ${
                              theme === 'dark'
                                ? 'bg-blue-500/20 text-blue-300 hover:bg-blue-500/30 border-blue-400/30'
                                : 'bg-blue-500/15 text-blue-600 hover:bg-blue-500/25 border-blue-400/40'
                            }`}
                          >
                            Copy CID
                          </button>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}

            {uploaded.length > 0 && (
              <div className={`mt-8 pt-6 border-t ${
                theme === 'dark' ? 'border-white/20' : 'border-gray-200'
              }`}>
                <div className="text-center">
                  <button
                    onClick={() => navigate('/files')}
                    className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl font-semibold hover:from-blue-700 hover:to-indigo-700 transition-all duration-300 shadow-lg"
                  >
                    View All Files in Dashboard
                    <ExternalLink className="w-5 h-5 ml-2" />
                  </button>
                </div>
              </div>
            )}
          </motion.div>
        </div>
      </div>
    </div>
  );
}