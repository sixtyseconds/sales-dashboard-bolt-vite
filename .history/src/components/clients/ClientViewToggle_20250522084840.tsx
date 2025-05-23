import React from 'react';
import { TableRows, LayoutGrid } from 'lucide-react'; // Using LayoutGrid for Kanban as ViewKanban isn't in lucide-react standard
import { cn } from '@/lib/utils'; // Assuming you have a cn utility for classnames

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
        <TableRows className="w-4 h-4" /> {/* Using lucide icon */}
        <span>Table</span>
      </button>
      <button
        onClick={() => onViewChange('kanban')}
        className={cn(
          commonButtonClasses,
          activeView === 'kanban' ? activeButtonClasses : inactiveButtonClasses
        )}
      >
        <LayoutGrid className="w-4 h-4" /> {/* Using lucide icon */}
        <span>Kanban</span>
      </button>
    </div>
  );
};

export default ClientViewToggle; 