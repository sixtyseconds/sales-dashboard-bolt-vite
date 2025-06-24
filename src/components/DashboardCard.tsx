import React from 'react';
import { TrendingUp, TrendingDown, LucideIcon } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface DashboardCardProps {
  title: string;
  value: string | number;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  icon: LucideIcon;
  color: string;
  isPrimary?: boolean;
  target?: number;
  onClick?: () => void;
}

export function DashboardCard({ title, value, trend, icon: Icon, color, isPrimary = false, target, onClick }: DashboardCardProps) {
  const navigate = useNavigate();

  const handleClick = () => {
    if (onClick) {
      onClick();
      navigate('/activity');
    }
  };

  const progressPercentage = target && typeof value === 'number' ? Math.min((value / target) * 100, 100) : 0;

  return (
    <div
      className={`
        p-6 rounded-2xl border transition-all duration-300 cursor-pointer group
        ${isPrimary 
          ? 'bg-gradient-to-br from-blue-600 to-purple-600 border-blue-500/30 text-white shadow-lg shadow-blue-500/20 hover:shadow-xl hover:shadow-blue-500/30 hover:scale-105' 
          : 'bg-gray-900/60 border-gray-700/50 text-gray-300 hover:bg-gray-800/70 hover:border-gray-600/50'
        }
      `}
      onClick={handleClick}
    >
      <div className="flex items-center justify-between mb-4">
        <div className={`p-3 rounded-xl ${isPrimary ? 'bg-white/10' : 'bg-gray-800/50'}`}>
          <Icon className={`w-6 h-6 ${isPrimary ? 'text-white' : color}`} />
        </div>
        {trend && (
          <div className={`flex items-center space-x-1 text-sm ${
            trend.isPositive ? 'text-green-400' : 'text-red-400'
          }`}>
            {trend.isPositive ? (
              <TrendingUp className="w-4 h-4" />
            ) : (
              <TrendingDown className="w-4 h-4" />
            )}
            <span>{Math.abs(trend.value)}%</span>
          </div>
        )}
      </div>

      <h3 className={`text-sm font-medium mb-2 ${isPrimary ? 'text-white/80' : 'text-gray-400'}`}>
        {title}
      </h3>
      
      <p className={`text-3xl font-bold mb-2 ${isPrimary ? 'text-white' : 'text-white'}`}>
        {value}
      </p>

      {target && (
        <div className="mt-4">
          <div className="flex justify-between text-xs mb-1">
            <span className={isPrimary ? 'text-white/60' : 'text-gray-400'}>
              Target: {target}
            </span>
            <span className={isPrimary ? 'text-white/60' : 'text-gray-400'}>
              {progressPercentage.toFixed(0)}%
            </span>
          </div>
          <div className={`h-2 rounded-full ${isPrimary ? 'bg-white/20' : 'bg-gray-700'}`}>
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                isPrimary ? 'bg-white/60' : 'bg-blue-500'
              }`}
              style={{ width: `${progressPercentage}%` }}
            />
          </div>
        </div>
      )}
    </div>
  );
}