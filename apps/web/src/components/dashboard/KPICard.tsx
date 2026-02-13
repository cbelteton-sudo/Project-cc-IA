import React from 'react';
import { ArrowUp, ArrowDown } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import CountUp from 'react-countup';
import { motion } from 'framer-motion';

interface KPICardProps {
  title: string;
  value: number;
  icon: LucideIcon;
  color: 'green' | 'blue' | 'red' | 'yellow' | 'purple' | 'indigo' | 'amber';
  trend?: {
    value: number;
    direction: 'up' | 'down';
  };
  suffix?: string;
  decimals?: number;
}

const colorClasses = {
  green: {
    bg: 'bg-green-50',
    text: 'text-green-600',
    icon: 'bg-green-100 text-green-600',
  },
  blue: {
    bg: 'bg-blue-50',
    text: 'text-blue-600',
    icon: 'bg-blue-100 text-blue-600',
  },
  red: {
    bg: 'bg-red-50',
    text: 'text-red-600',
    icon: 'bg-red-100 text-red-600',
  },
  yellow: {
    bg: 'bg-yellow-50',
    text: 'text-yellow-600',
    icon: 'bg-yellow-100 text-yellow-600',
  },
  purple: {
    bg: 'bg-purple-50',
    text: 'text-purple-600',
    icon: 'bg-purple-100 text-purple-600',
  },
  indigo: {
    bg: 'bg-indigo-50',
    text: 'text-indigo-600',
    icon: 'bg-indigo-100 text-indigo-600',
  },
  amber: {
    bg: 'bg-amber-50',
    text: 'text-amber-600',
    icon: 'bg-amber-100 text-amber-600',
  },
};

export const KPICard: React.FC<KPICardProps> = ({
  title,
  value,
  icon: Icon,
  color,
  trend,
  suffix = '',
  decimals = 0,
}) => {
  const styles = colorClasses[color];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ scale: 1.02 }}
      transition={{ duration: 0.3 }}
      className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 flex flex-col justify-between h-full"
    >
      <div className="flex justify-between items-start mb-4">
        <div className={`p-3 rounded-lg ${styles.icon}`}>
          <Icon className="w-8 h-8" />
        </div>
        {trend && (
          <div
            className={`flex items-center text-sm font-medium ${
              trend.direction === 'up' ? 'text-green-600' : 'text-red-600'
            }`}
          >
            {trend.direction === 'up' ? (
              <ArrowUp className="w-4 h-4 mr-1" />
            ) : (
              <ArrowDown className="w-4 h-4 mr-1" />
            )}
            {trend.value}%
          </div>
        )}
      </div>

      <div>
        <h3 className="text-4xl font-bold text-gray-900 mb-1">
          <CountUp end={value} duration={2} decimal="." decimals={decimals} suffix={suffix} />
        </h3>
        <p className="text-sm text-gray-500 uppercase tracking-wide font-medium">{title}</p>
      </div>
    </motion.div>
  );
};
