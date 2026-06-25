import React from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { 
  Upload, 
  FileText, 
  Shield, 
  Download, 
  ArrowRight,
  Zap,
  Cloud,
  Lock,
  Database
} from 'lucide-react';

const QuickAction = ({ title, description, icon: Icon, color, delay = 0, onClick }) => {
  const colorMap = {
    cyan: {
      bg: 'bg-cyan-500/20',
      icon: 'text-cyan-400',
      border: 'hover:border-cyan-400/30',
      hover: 'hover:bg-cyan-500/10'
    },
    purple: {
      bg: 'bg-purple-500/20', 
      icon: 'text-purple-400',
      border: 'hover:border-purple-400/30',
      hover: 'hover:bg-purple-500/10'
    },
    green: {
      bg: 'bg-green-500/20',
      icon: 'text-green-400',
      border: 'hover:border-green-400/30',
      hover: 'hover:bg-green-500/10'
    },
    blue: {
      bg: 'bg-blue-500/20',
      icon: 'text-blue-400', 
      border: 'hover:border-blue-400/30',
      hover: 'hover:bg-blue-500/10'
    }
  };

  const colors = colorMap[color] || colorMap.cyan;

  return (
    <motion.button
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay }}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      onClick={onClick}
      className={`bg-white/5 backdrop-blur-lg rounded-2xl p-6 border border-white/10 text-left group transition-all duration-300 ${colors.hover} ${colors.border}`}
    >
      <div className="flex items-start justify-between mb-4">
        <div className={`p-3 rounded-xl ${colors.bg}`}>
          <Icon className={`w-6 h-6 ${colors.icon}`} />
        </div>
        <ArrowRight className={`w-5 h-5 ${colors.icon} opacity-60 group-hover:opacity-100 group-hover:translate-x-1 transition-all`} />
      </div>
      <h3 className="text-lg font-semibold text-white mb-2 group-hover:text-cyan-300 transition-colors">
        {title}
      </h3>
      <p className="text-gray-400 text-sm leading-relaxed group-hover:text-gray-300 transition-colors">
        {description}
      </p>
      
      {/* Glow effect on hover */}
      <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-transparent via-white/5 to-transparent transform -skew-x-12 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000" />
    </motion.button>
  );
};

export default function QuickActions() {
  const navigate = useNavigate();

  const actions = [
    {
      title: "Upload Files",
      description: "Encrypt and store new files with blockchain verification",
      icon: Upload,
      color: "cyan",
      delay: 0.1,
      onClick: () => navigate('/upload')
    },
    {
      title: "My Files", 
      description: "Manage and access your secured files",
      icon: FileText,
      color: "purple",
      delay: 0.2,
      onClick: () => navigate('/files')
    },
    {
      title: "Security Settings",
      description: "Configure 2FA and security preferences", 
      icon: Shield,
      color: "green",
      delay: 0.3,
      onClick: () => navigate('/profile?tab=security')
    },
    {
      title: "Bulk Download",
      description: "Download multiple files at once",
      icon: Download,
      color: "blue",
      delay: 0.4,
      onClick: () => alert('Bulk download coming soon!')
    },
    {
      title: "Quick Verify",
      description: "Verify all files on blockchain",
      icon: Zap,
      color: "cyan", 
      delay: 0.5,
      onClick: () => alert('Bulk verification starting...')
    },
    {
      title: "Storage Overview",
      description: "View storage usage and analytics",
      icon: Database,
      color: "purple",
      delay: 0.6,
      onClick: () => navigate('/files')
    }
  ];

  return (
    <div className="mb-8">
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        className="mb-6"
      >
        <h2 className="text-2xl font-bold text-white mb-4">Quick Actions</h2>
        <p className="text-gray-400">Fast access to frequently used features</p>
      </motion.div>
      
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {actions.map((action, index) => (
          <QuickAction
            key={action.title}
            title={action.title}
            description={action.description}
            icon={action.icon}
            color={action.color}
            delay={action.delay}
            onClick={action.onClick}
          />
        ))}
      </div>
    </div>
  );
}