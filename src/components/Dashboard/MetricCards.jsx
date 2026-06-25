import React from 'react';
import { motion } from 'framer-motion';
import { FileText, Database, ShieldCheck, Lock, TrendingUp } from 'lucide-react';

const MetricCard = ({ title, value, subtitle, icon: Icon, color, delay = 0, onClick }) => {
  const gradientMap = {
    blue: 'from-blue-500/20 to-blue-600/20 border-blue-200/20',
    purple: 'from-purple-500/20 to-purple-600/20 border-purple-200/20', 
    green: 'from-green-500/20 to-green-600/20 border-green-200/20',
    cyan: 'from-cyan-500/20 to-cyan-600/20 border-cyan-200/20',
    orange: 'from-orange-500/20 to-orange-600/20 border-orange-200/20'
  };

  const iconColorMap = {
    blue: 'text-blue-400',
    purple: 'text-purple-400',
    green: 'text-green-400', 
    cyan: 'text-cyan-400',
    orange: 'text-orange-400'
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
      whileHover={{ scale: 1.02, y: -5 }}
      onClick={onClick}
      className={`bg-gradient-to-br ${gradientMap[color]} backdrop-blur-lg rounded-3xl p-6 border shadow-2xl hover:shadow-${color}-500/10 transition-all duration-300 group cursor-pointer ${
        onClick ? 'hover:border-white/30' : ''
      }`}
    >
      <div className="flex items-center justify-between mb-4">
        <div className={`p-3 bg-white/20 rounded-2xl ${iconColorMap[color]}`}>
          <Icon className="w-6 h-6" />
        </div>
        <TrendingUp className={`w-5 h-5 ${iconColorMap[color]} opacity-60 group-hover:opacity-80 transition-opacity`} />
      </div>
      <h3 className="text-2xl font-bold text-white mb-2">{value}</h3>
      <p className="text-white/90 font-semibold mb-1">{title}</p>
      <p className="text-white/70 text-sm">{subtitle}</p>
      
      {/* Animated underline on hover */}
      {onClick && (
        <motion.div 
          className="h-0.5 bg-gradient-to-r from-transparent via-white to-transparent mt-3"
          initial={{ scale: 0 }}
          whileHover={{ scale: 1 }}
          transition={{ duration: 0.3 }}
        />
      )}
    </motion.div>
  );
};

export default function MetricCards({ metrics, onMetricClick }) {
  const metricData = [
    {
      title: "Total Files",
      value: metrics.totalFiles,
      subtitle: "Secured in your vault",
      icon: FileText,
      color: "blue",
      delay: 0.1
    },
    {
      title: "Storage Used", 
      value: metrics.storageUsed,
      subtitle: "Across all files",
      icon: Database,
      color: "purple",
      delay: 0.2
    },
    {
      title: "Blockchain Verified",
      value: metrics.verifiedFiles,
      subtitle: "Immutable records", 
      icon: ShieldCheck,
      color: "green",
      delay: 0.3
    },
    {
      title: "Security Score",
      value: "100%",
      subtitle: "Maximum protection",
      icon: Lock,
      color: "cyan", 
      delay: 0.4
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      {metricData.map((metric, index) => (
        <MetricCard
          key={metric.title}
          title={metric.title}
          value={metric.value}
          subtitle={metric.subtitle}
          icon={metric.icon}
          color={metric.color}
          delay={metric.delay}
          onClick={() => onMetricClick && onMetricClick(metric.title)}
        />
      ))}
    </div>
  );
}