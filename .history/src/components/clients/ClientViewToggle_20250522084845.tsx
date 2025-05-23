import React from 'react';
import { List, LayoutGrid } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ClientViewToggleProps {
  activeView: 'table' | 'kanban';
  onViewChange: (view: 'table' | 'kanban') => void;
}

const ClientViewToggle: React.FC<ClientViewToggleProps> = ({ activeView, onViewChange }) => {
  const commonButtonClasses = 'flex items-center justify-center gap-1 rounded-md h-9 px-3 text-sm font-medium transition-colors';
  const activeButtonClasses = 'bg-blue-600 text-white';
  const inactiveButtonClasses = 'bg-[#2C3035] hover:bg-[#383c42] text-[#dce7f3]';

  return (
    <div className="flex items-center gap-2">
      <button
        onClick={() => onViewChange('table')}
        className={cn(
          commonButtonClasses,
          activeView === 'table' ? activeButtonClasses : inactiveButtonClasses
        )}
      >
        <List className="w-4 h-4" />
        <span>Table</span>
      </button>
      <button
        onClick={() => onViewChange('kanban')}
        className={cn(
          commonButtonClasses,
          activeView === 'kanban' ? activeButtonClasses : inactiveButtonClasses
        )}
      >
        <LayoutGrid className="w-4 h-4" />
        <span>Kanban</span>
      </button>
    </div>
  );
};

export default ClientViewToggle;
