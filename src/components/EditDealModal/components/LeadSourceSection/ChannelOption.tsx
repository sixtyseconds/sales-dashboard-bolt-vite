import React from 'react';

interface ChannelOptionProps {
  id: string;
  label: string;
  isSelected: boolean;
  onClick: () => void;
}

const ChannelOption: React.FC<ChannelOptionProps> = ({
  id,
  label,
  isSelected,
  onClick
}) => {
  return (
    <button
      type="button"
      id={`channel-${id}`}
      onClick={onClick}
      className={`flex items-center gap-1.5 p-2 border rounded transition-all
        ${isSelected 
          ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-400' 
          : 'border-gray-700 bg-gray-900/80 text-gray-400 hover:bg-gray-800 hover:border-gray-600'
        }`}
      aria-pressed={isSelected}
    >
      <div 
        className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center 
          ${isSelected 
            ? 'border-emerald-400' 
            : 'border-gray-600'
          }`}
      >
        {isSelected && (
          <div className="w-1.5 h-1.5 rounded-full bg-emerald-400" aria-hidden="true" />
        )}
      </div>
      <span className="text-xs font-medium">{label}</span>
    </button>
  );
};

export default ChannelOption; 