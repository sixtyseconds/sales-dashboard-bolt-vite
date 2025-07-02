import React from 'react';
import { useDroppable } from '@dnd-kit/core';
import { motion } from 'framer-motion';
import { LucideIcon } from 'lucide-react';

interface RoadmapColumnProps {
  id: string;
  title: string;
  icon: LucideIcon;
  color: string;
  description: string;
  count: number;
  children: React.ReactNode;
  isAdmin: boolean;
}

const colorClasses = {
  gray: {
    bg: 'bg-gray-500/10',
    border: 'border-gray-500/20',
    text: 'text-gray-400',
    icon: 'text-gray-500'
  },
  yellow: {
    bg: 'bg-yellow-500/10',
    border: 'border-yellow-500/20',
    text: 'text-yellow-400',
    icon: 'text-yellow-500'
  },
  blue: {
    bg: 'bg-blue-500/10',
    border: 'border-blue-500/20',
    text: 'text-blue-400',
    icon: 'text-blue-500'
  },
  purple: {
    bg: 'bg-purple-500/10',
    border: 'border-purple-500/20',
    text: 'text-purple-400',
    icon: 'text-purple-500'
  },
  green: {
    bg: 'bg-green-500/10',
    border: 'border-green-500/20',
    text: 'text-green-400',
    icon: 'text-green-500'
  },
  red: {
    bg: 'bg-red-500/10',
    border: 'border-red-500/20',
    text: 'text-red-400',
    icon: 'text-red-500'
  }
};

export function RoadmapColumn({ 
  id, 
  title, 
  icon: Icon, 
  color, 
  description, 
  count, 
  children, 
  isAdmin 
}: RoadmapColumnProps) {
  const { setNodeRef, isOver } = useDroppable({
    id,
    disabled: !isAdmin
  });

  const colorClass = colorClasses[color as keyof typeof colorClasses] || colorClasses.gray;

  return (
    <div
      ref={setNodeRef}
      className={`
        min-w-[320px] max-w-[320px] bg-gray-900/50 backdrop-blur-xl rounded-xl border border-gray-800/50 
        flex flex-col h-[calc(100vh-200px)] transition-all duration-200
        ${isOver && isAdmin ? 'ring-2 ring-emerald-500/50 border-emerald-500/50' : ''}
      `}
    >
      {/* Column Header */}
      <div className={`p-4 border-b border-gray-800/50 ${colorClass.bg} ${colorClass.border} rounded-t-xl`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg ${colorClass.bg} ${colorClass.border}`}>
              <Icon className={`w-4 h-4 ${colorClass.icon}`} />
            </div>
            <div>
              <h3 className={`font-semibold ${colorClass.text}`}>{title}</h3>
              <p className="text-xs text-gray-500">{description}</p>
            </div>
          </div>
          <div className={`
            ${colorClass.bg} ${colorClass.border} rounded-full px-2 py-1 min-w-[2rem] text-center
          `}>
            <span className={`text-sm font-medium ${colorClass.text}`}>{count}</span>
          </div>
        </div>
      </div>

      {/* Column Content */}
      <div className="p-4 flex-1 overflow-y-auto">
        {count === 0 ? (
          <div className="flex flex-col items-center justify-center h-32 text-gray-500">
            <Icon className="w-8 h-8 mb-2 opacity-50" />
            <p className="text-sm text-center">No suggestions in this stage</p>
            {!isAdmin && id !== 'submitted' && (
              <p className="text-xs text-center mt-1 text-gray-600">
                Only admins can move items here
              </p>
            )}
          </div>
        ) : (
          children
        )}
      </div>

      {/* Admin notice for certain columns */}
      {!isAdmin && ['under_review', 'in_progress', 'testing', 'completed', 'rejected'].includes(id) && count > 0 && (
        <div className="px-4 pb-2">
          <p className="text-xs text-gray-600 text-center">
            Only admins can manage suggestions in this stage
          </p>
        </div>
      )}
    </div>
  );
}