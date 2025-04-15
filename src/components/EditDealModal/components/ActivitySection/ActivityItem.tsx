import React from 'react';
import { formatDistanceToNow } from 'date-fns';
import { MessageSquare, TrendingUp, Plus } from 'lucide-react';

export interface Activity {
  type: 'note' | 'stage_change' | 'creation' | 'task' | 'call' | 'email';
  title: string;
  description: string;
  timestamp: string;
  user: string;
}

interface ActivityItemProps {
  activity: Activity;
}

const ActivityItem: React.FC<ActivityItemProps> = ({ activity }) => {
  const getActivityIcon = () => {
    switch (activity.type) {
      case 'note':
        return <MessageSquare className="w-3.5 h-3.5" />;
      case 'stage_change':
        return <TrendingUp className="w-3.5 h-3.5" />;
      default:
        return <Plus className="w-3.5 h-3.5" />;
    }
  };
  
  const getActivityIconClass = () => {
    switch (activity.type) {
      case 'note':
        return 'bg-blue-500/10 text-blue-400';
      case 'stage_change':
        return 'bg-violet-500/10 text-violet-400';
      case 'task':
        return 'bg-yellow-500/10 text-yellow-400';
      case 'call':
        return 'bg-emerald-500/10 text-emerald-400';
      case 'email':
        return 'bg-indigo-500/10 text-indigo-400';
      default:
        return 'bg-emerald-500/10 text-emerald-400';
    }
  };
  
  const formatTimestamp = (timestamp: string) => {
    try {
      return formatDistanceToNow(new Date(timestamp), { addSuffix: true });
    } catch (error) {
      return 'Unknown date';
    }
  };
  
  return (
    <div className="flex gap-4 mb-5 relative">
      <div className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 ${getActivityIconClass()}`}>
        {getActivityIcon()}
      </div>
      
      <div className="flex-1">
        <div className="flex justify-between mb-1">
          <div className="text-sm font-medium text-white">
            {activity.title}
          </div>
          <div className="text-xs text-gray-500">
            {formatTimestamp(activity.timestamp)}
          </div>
        </div>
        
        <div className="text-sm text-gray-400 mb-1.5">
          {activity.description}
        </div>
        
        <div className="text-xs text-gray-500">
          {activity.user}
        </div>
      </div>
      
      {/* Timeline connector */}
      <div className="absolute left-3 top-6 bottom-0 w-px bg-gray-800" aria-hidden="true" />
    </div>
  );
};

export default ActivityItem; 