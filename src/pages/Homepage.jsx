import React from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Shield, Lock, Zap, Globe, Cpu, Database, Sparkles, Rocket, FileText, Cloud, Server } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';

export default function Homepage() {
  const { theme } = useTheme();

  return (
   <div className={`min-h-screen relative overflow-hidden transition-colors duration-300 ${
  theme === 'dark' ? 'bg-[#0a0f2c]' : 'bg-gradient-to-br from-gray-50 via-blue-50 to-purple-50'
}`}>
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden">
        {/* Floating Particles */}
        <div className={`absolute top-1/4 left-1/4 w-4 h-4 rounded-full animate-float opacity-60 ${
          theme === 'dark' ? 'bg-cyan-400' : 'bg-cyan-500'
        }`}></div>
        <div className={`absolute top-1/3 right-1/4 w-3 h-3 rounded-full animate-float opacity-40 ${
          theme === 'dark' ? 'bg-purple-400' : 'bg-purple-500'
        }`} style={{ animationDelay: '1s' }}></div>
        <div className={`absolute bottom-1/4 left-1/3 w-5 h-5 rounded-full animate-float opacity-50 ${
          theme === 'dark' ? 'bg-blue-400' : 'bg-blue-500'
        }`} style={{ animationDelay: '2s' }}></div>
        <div className={`absolute top-2/3 right-1/3 w-4 h-4 rounded-full animate-float opacity-60 ${
          theme === 'dark' ? 'bg-pink-400' : 'bg-pink-500'
        }`} style={{ animationDelay: '3s' }}></div>
        
        {/* Glowing Orbs */}
        <div className={`absolute -top-40 -left-40 w-80 h-80 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse-slow ${
          theme === 'dark' ? 'bg-cyan-500' : 'bg-cyan-400'
        }`}></div>
        <div className={`absolute -bottom-40 -right-40 w-80 h-80 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse-slow ${
          theme === 'dark' ? 'bg-purple-500' : 'bg-purple-400'
        }`} style={{ animationDelay: '2s' }}></div>
        <div className={`absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 rounded-full mix-blend-multiply filter blur-3xl opacity-10 animate-pulse-slow ${
          theme === 'dark' ? 'bg-blue-500' : 'bg-blue-400'
        }`} style={{ animationDelay: '1s' }}></div>
      </div>

      <div className="relative z-10">
        {/* Navigation */}
        <nav className="px-6 py-4">
          <div className="max-w-7xl mx-auto flex justify-between items-center">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="flex items-center space-x-2"
            >
              <div className="w-8 h-8 bg-gradient-to-r from-cyan-400 to-purple-500 rounded-lg flex items-center justify-center">
                <Shield className="w-5 h-5 text-white" />
              </div>
              <span className={`font-bold text-xl ${
                theme === 'dark' ? 'text-white' : 'text-gray-900'
              }`}>SecureVault</span>
            </motion.div>
            
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="flex items-center space-x-4"
            >
              <Link 
                to="/login" 
                className={`transition-colors ${
                  theme === 'dark' ? 'text-gray-300 hover:text-white' : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Login
              </Link>
              <Link 
                to="/register" 
                className="bg-gradient-to-r from-cyan-500 to-purple-600 text-white px-6 py-2 rounded-full font-semibold hover:from-cyan-600 hover:to-purple-700 transition-all duration-300 shadow-lg hover:shadow-cyan-500/25"
              >
                Get Started
              </Link>
            </motion.div>
          </div>
        </nav>

        {/* Hero Section */}
        <section className="px-6 py-20 text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="max-w-6xl mx-auto"
          >
            {/* Animated Badge */}
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: "spring" }}
              className={`inline-flex items-center px-4 py-2 backdrop-blur-sm rounded-full border mb-8 ${
                theme === 'dark' 
                  ? 'bg-white/10 border-white/20' 
                  : 'bg-gray-900/5 border-gray-200'
              }`}
            >
              <Sparkles className="w-4 h-4 text-cyan-400 mr-2" />
              <span className="text-cyan-500 text-sm font-medium">Blockchain-Powered Security</span>
            </motion.div>

            <motion.h1 
              className="text-6xl md:text-8xl font-bold mb-6 bg-gradient-to-r from-cyan-400 via-purple-500 to-blue-500 bg-clip-text text-transparent"
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.8 }}
            >
              Secure
              <motion.span 
                className="block bg-gradient-to-r from-cyan-400 to-purple-500 bg-clip-text text-transparent"
                animate={{ 
                  backgroundPosition: ['0%', '100%', '0%']
                }}
                transition={{ 
                  duration: 3,
                  repeat: Infinity,
                  repeatType: "reverse"
                }}
                style={{ 
                  backgroundSize: '200% 100%',
                  backgroundImage: 'linear-gradient(90deg, #22d3ee, #a855f7, #22d3ee)'
                }}
              >
                Vault
              </motion.span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className={`text-xl md:text-2xl mb-12 max-w-3xl mx-auto leading-relaxed ${
                theme === 'dark' ? 'text-gray-300' : 'text-gray-600'
              }`}
            >
              Military-grade encryption meets blockchain verification. 
              <span className="text-cyan-500"> Your files, secured like never before.</span>
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.7 }}
              className="flex flex-col sm:flex-row gap-4 justify-center items-center"
            >
              <Link
                to="/register"
                className="group relative bg-gradient-to-r from-cyan-500 to-purple-600 text-white px-12 py-4 rounded-2xl font-bold text-lg hover:from-cyan-600 hover:to-purple-700 transition-all duration-300 shadow-2xl hover:shadow-cyan-500/30 overflow-hidden"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent transform -skew-x-12 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000"></div>
                <span className="relative flex items-center">
                  <Rocket className="w-5 h-5 mr-3" />
                  Start Securing Files
                </span>
              </Link>
              
              <button className={`group border-2 rounded-2xl font-semibold transition-all duration-300 backdrop-blur-sm px-8 py-4 ${
                theme === 'dark' 
                  ? 'border-cyan-400/30 text-cyan-300 hover:bg-cyan-400/10 hover:border-cyan-400/50' 
                  : 'border-cyan-500/30 text-cyan-600 hover:bg-cyan-500/10 hover:border-cyan-500/50'
              }`}>
                <span className="flex items-center">
                  <FileText className="w-5 h-5 mr-3" />
                  View Demo
                </span>
              </button>
            </motion.div>
          </motion.div>
        </section>

        {/* Features Grid */}
        <section className="px-6 py-20">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            transition={{ duration: 0.8 }}
            className="max-w-7xl mx-auto"
          >
            <div className="grid md:grid-cols-3 gap-8">
              {/* Feature 1 - Encryption */}
              <motion.div
                whileHover={{ scale: 1.05, y: -10 }}
                className={`backdrop-blur-lg rounded-3xl p-8 border transition-all duration-300 group ${
                  theme === 'dark' 
                    ? 'bg-white/5 border-white/10 hover:border-cyan-400/30' 
                    : 'bg-white/80 border-gray-200 hover:border-cyan-400/50'
                }`}
              >
                <div className="w-16 h-16 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-2xl flex items-center justify-center mb-6 group-hover:animate-glow">
                  <Lock className="w-8 h-8 text-white" />
                </div>
                <h3 className={`text-2xl font-bold mb-4 ${
                  theme === 'dark' ? 'text-white' : 'text-gray-900'
                }`}>Military Encryption</h3>
                <p className={`leading-relaxed ${
                  theme === 'dark' ? 'text-gray-300' : 'text-gray-600'
                }`}>
                  AES-256 encryption with homomorphic capabilities. Your files remain encrypted even during processing.
                </p>
              </motion.div>

              {/* Feature 2 - Blockchain */}
              <motion.div
                whileHover={{ scale: 1.05, y: -10 }}
                className={`backdrop-blur-lg rounded-3xl p-8 border transition-all duration-300 group ${
                  theme === 'dark' 
                    ? 'bg-white/5 border-white/10 hover:border-purple-400/30' 
                    : 'bg-white/80 border-gray-200 hover:border-purple-400/50'
                }`}
              >
                <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-pink-600 rounded-2xl flex items-center justify-center mb-6 group-hover:animate-glow">
                  <Globe className="w-8 h-8 text-white" />
                </div>
                <h3 className={`text-2xl font-bold mb-4 ${
                  theme === 'dark' ? 'text-white' : 'text-gray-900'
                }`}>Blockchain Verified</h3>
                <p className={`leading-relaxed ${
                  theme === 'dark' ? 'text-gray-300' : 'text-gray-600'
                }`}>
                  Every file is timestamped and verified on the blockchain for immutable proof of existence.
                </p>
              </motion.div>

              {/* Feature 3 - IPFS */}
              <motion.div
                whileHover={{ scale: 1.05, y: -10 }}
                className={`backdrop-blur-lg rounded-3xl p-8 border transition-all duration-300 group ${
                  theme === 'dark' 
                    ? 'bg-white/5 border-white/10 hover:border-green-400/30' 
                    : 'bg-white/80 border-gray-200 hover:border-green-400/50'
                }`}
              >
                <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl flex items-center justify-center mb-6 group-hover:animate-glow">
                  <Database className="w-8 h-8 text-white" />
                </div>
                <h3 className={`text-2xl font-bold mb-4 ${
                  theme === 'dark' ? 'text-white' : 'text-gray-900'
                }`}>Decentralized Storage</h3>
                <p className={`leading-relaxed ${
                  theme === 'dark' ? 'text-gray-300' : 'text-gray-600'
                }`}>
                  Files stored on IPFS through Filebase - distributed, resilient, and censorship-resistant.
                </p>
              </motion.div>
            </div>
          </motion.div>
        </section>

        {/* Tech Stack */}
        <section className="px-6 py-20">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            className="max-w-6xl mx-auto text-center"
          >
            <h2 className={`text-4xl font-bold mb-4 ${
              theme === 'dark' ? 'text-white' : 'text-gray-900'
            }`}>Powered by Cutting-Edge Tech</h2>
            <p className={`mb-12 ${
              theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
            }`}>Built with the most advanced technologies available</p>
            
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-8">
              {[
                { name: 'React', icon: '⚛️', color: 'from-cyan-400 to-blue-500' },
                { name: 'Supabase', icon: '🛢️', color: 'from-green-400 to-emerald-500' },
                { name: 'IPFS', icon: '🌐', color: 'from-orange-400 to-red-500' },
                { name: 'Ethereum', icon: '⛓️', color: 'from-purple-400 to-indigo-500' },
                { name: 'Node.js', icon: '🟢', color: 'from-green-500 to-lime-500' },
                { name: 'Homomorphic', icon: '🔐', color: 'from-pink-400 to-rose-500' },
              ].map((tech, index) => (
                <motion.div
                  key={tech.name}
                  initial={{ opacity: 0, scale: 0 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  transition={{ delay: index * 0.1 }}
                  whileHover={{ scale: 1.1, y: -5 }}
                  className={`backdrop-blur-sm rounded-2xl p-6 border transition-all duration-300 ${
                    theme === 'dark' 
                      ? 'bg-white/5 border-white/10 hover:border-white/20' 
                      : 'bg-white/80 border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className={`w-12 h-12 bg-gradient-to-r ${tech.color} rounded-xl flex items-center justify-center text-2xl mx-auto mb-3`}>
                    {tech.icon}
                  </div>
                  <div className={`font-semibold ${
                    theme === 'dark' ? 'text-white' : 'text-gray-900'
                  }`}>{tech.name}</div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </section>

        {/* CTA Section */}
        <section className="px-6 py-20">
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            className={`max-w-4xl mx-auto text-center rounded-3xl p-12 border backdrop-blur-lg ${
              theme === 'dark' 
                ? 'bg-gradient-to-r from-cyan-500/10 to-purple-500/10 border-cyan-400/20' 
                : 'bg-gradient-to-r from-cyan-500/10 to-purple-500/10 border-cyan-400/30'
            }`}
          >
            <h2 className={`text-4xl font-bold mb-6 ${
              theme === 'dark' ? 'text-white' : 'text-gray-900'
            }`}>
              Ready to Secure Your Digital Assets?
            </h2>
            <p className={`text-xl mb-8 ${
              theme === 'dark' ? 'text-gray-300' : 'text-gray-600'
            }`}>
              Join thousands of users who trust SecureVault with their most important files.
            </p>
            <Link
              to="/register"
              className="inline-flex items-center bg-gradient-to-r from-cyan-500 to-purple-600 text-white px-12 py-4 rounded-2xl font-bold text-lg hover:from-cyan-600 hover:to-purple-700 transition-all duration-300 shadow-2xl hover:shadow-cyan-500/30"
            >
              <Zap className="w-5 h-5 mr-3" />
              Get Started Free
            </Link>
          </motion.div>
        </section>
      </div>
    </div>
  );
}