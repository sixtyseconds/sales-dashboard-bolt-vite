'use client';

import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface DashboardCardProps {
  title: string;
  value: string | number;
  trend: string;
  icon: React.ElementType;
  color: 'emerald' | 'blue' | 'violet' | 'orange';
  isPrimary?: boolean;
  target?: number;
  onClick?: () => void;
}

interface DashboardCardProps {
  title: string;
  value: string | number;
  trend: string;
  icon: React.ElementType;
  color: 'emerald' | 'blue' | 'violet' | 'orange';
  isPrimary?: boolean;
  target?: number;
  onClick?: () => void;
}

export function DashboardCard({
  title,
  value,
  trend,
  icon: Icon,
  color,
  isPrimary = false,
  target,
  onClick
}: DashboardCardProps): JSX.Element {
  const progress = target ? Math.min((Number(value) / target) * 100, 100) : 0;

  return (
    <motion.div
      whileHover={{ y: -4, scale: 1.01 }}
      whileTap={{ scale: 0.99 }}
      onClick={onClick}
      className={cn(
        'relative backdrop-blur-xl bg-gray-900/40 rounded-3xl p-6 md:p-8 border border-gray-800/50',
        'hover:border-[#37bd7e]/50 transition-all duration-300 group',
        'hover:shadow-2xl hover:shadow-[#37bd7e]/20 overflow-hidden cursor-pointer',
        isPrimary ? 'md:col-span-2' : ''
      )}
    >
      {/* Background Effects */}
      <div className="absolute inset-0 bg-gradient-to-br from-gray-900/95 via-gray-900/75 to-gray-900/40 rounded-3xl" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(74,74,117,0.25),transparent)] rounded-3xl" />
      <div className={cn(
        'absolute -right-20 -top-20 w-40 h-40 blur-3xl rounded-full transition-all duration-500',
        `bg-${color}-500/10 group-hover:bg-${color}-500/20`
      )} />

      <div className="relative">
        {/* Header */}
        <div className="flex items-start justify-between mb-6">
          <div className="flex items-center gap-3">
            <motion.div 
              className={cn(
                'p-3 md:p-4 rounded-2xl transition-all duration-300 group-hover:scale-110',
                `bg-${color}-500/20 ring-2 ring-${color}-500/40 group-hover:ring-${color}-500/60`,
                'backdrop-blur-sm'
              )}
              whileHover={{ rotate: [0, -10, 10, -5, 5, 0] }}
              transition={{ duration: 0.5 }}
            >
              <Icon className="w-5 h-5 md:w-6 md:h-6 text-white drop-shadow-glow group-hover:animate-pulse" />
            </motion.div>
            <div>
              <h3 className={cn(
                'font-semibold tracking-wide text-white',
                isPrimary ? 'text-lg md:text-xl' : 'text-base md:text-lg'
              )}>{title}</h3>
              <p className="text-gray-200 text-sm">This month</p>
            </div>
          </div>
          <div className={cn(
            'px-3 py-1 rounded-full text-xs md:text-sm font-medium',
            `bg-${color}-500/10 text-white border border-${color}-500/30`,
            'shadow-lg shadow-${color}-500/20 backdrop-blur-sm flex items-center gap-1'
          )}>
            <div className={`w-1.5 h-1.5 rounded-full bg-${color}-400 animate-pulse`} />
            {trend}
          </div>
        </div>

        {/* Value */}
        <div className="flex items-baseline gap-2 mb-6">
          <span className={cn(
            'font-mono font-bold text-white tracking-tight transition-colors drop-shadow-glow',
            isPrimary ? 'text-4xl md:text-5xl' : 'text-3xl md:text-4xl'
          )}>
            {typeof value === 'number' ? value.toLocaleString() : value}
          </span>
          {target && (
            <span className="text-xs md:text-sm text-gray-200 font-medium">
              / {target.toLocaleString()}
            </span>
          )}
        </div>

        {/* Progress Bar */}
        {target && (
          <div className="mt-4">
            <div className="flex justify-between text-sm mb-1">
              <span className="text-gray-200 font-medium">Progress</span>
              <span className="text-white font-semibold">{progress}%</span>
            </div>
            <div className="h-2 md:h-3 bg-gray-800/60 rounded-full overflow-hidden backdrop-blur-sm ring-1 ring-gray-700/50">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                transition={{ duration: 1, ease: "easeOut" }}
                className={cn(
                  'h-full rounded-full transition-all duration-700 relative overflow-hidden',
                  'bg-gradient-to-r from-[#37bd7e] to-[#2da76c]',
                  'after:absolute after:inset-0',
                  'after:bg-gradient-to-r after:from-transparent after:via-white/30 after:to-transparent',
                  'after:animate-shimmer'
                )}
              />
            </div>
          </div>
        )}

        {/* Bottom Accent */}
        {isPrimary && (
          <div className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-[#37bd7e]/20 to-transparent" />
        )}
      </div>
    </motion.div>
  );
}