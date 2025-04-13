import React from 'react';
import { cn } from '@/lib/utils';

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  children: React.ReactNode;
  color?: 'blue' | 'emerald' | 'violet' | 'orange' | 'yellow' | 'red' | 'gray';
  onClick?: () => void;
}

const colorVariants = {
  blue: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  emerald: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  violet: 'bg-violet-500/10 text-violet-400 border-violet-500/20',
  orange: 'bg-orange-500/10 text-orange-400 border-orange-500/20',
  yellow: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
  red: 'bg-red-500/10 text-red-400 border-red-500/20',
  gray: 'bg-gray-500/10 text-gray-400 border-gray-500/20',
};

export function Badge({ 
  children, 
  color = 'gray', 
  onClick,
  className,
  ...props 
}: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium border',
        colorVariants[color] || colorVariants.gray,
        onClick && 'cursor-pointer hover:opacity-80',
        className
      )}
      onClick={onClick}
      {...props}
    >
      {children}
    </span>
  );
} 