import React, { useMemo } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Badge } from './Badge';
import { 
  Clock, 
  AlertCircle, 
  User, 
  Calendar
} from 'lucide-react';
import { format } from 'date-fns';

interface DealCardProps {
  deal: any;
  index?: number;
  onClick: (deal: any) => void;
  isDragOverlay?: boolean;
}

export function DealCard({ deal, onClick, isDragOverlay = false }: DealCardProps) {
  // Set up sortable drag behavior
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: deal.id,
    data: deal,
    disabled: isDragOverlay
  });
  
  // Apply transform styles for dragging with animations
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? '0.3' : '1',
    ...(isDragOverlay ? { zIndex: 9999 } : {}),
  };
  
  // Determine time indicator status
  const timeIndicator = useMemo(() => {
    if (!deal.daysInStage) return { status: 'normal', text: 'New deal' };
    
    if (deal.daysInStage > 14) {
      return { 
        status: 'danger', 
        text: `${deal.daysInStage} days in stage`, 
        icon: AlertCircle 
      };
    } else if (deal.daysInStage > 7) {
      return { 
        status: 'warning', 
        text: `${deal.daysInStage} days in stage`, 
        icon: Clock 
      };
    } else {
      return { 
        status: 'normal', 
        text: `${deal.daysInStage} days in stage`, 
        icon: Clock 
      };
    }
  }, [deal.daysInStage]);
  
  // Format deal value
  const formattedValue = useMemo(() => {
    return new Intl.NumberFormat('en-GB', {
      style: 'currency',
      currency: 'GBP',
      maximumFractionDigits: 0
    }).format(deal.value);
  }, [deal.value]);
  
  // Calculate probability
  const probability = deal.probability || deal.deal_stages?.default_probability || 0;
  
  // Determine stage color for indicators
  const stageColor = deal.deal_stages?.color || '#3b82f6';

  // Get stage name from the deal data
  const stageName = useMemo(() => {
    console.log('Deal stages in DealCard:', deal.id, deal.company, deal.deal_stages, 'Stage ID:', deal.stage_id);
    
    // Primary: Get stage name from deal_stages object if available
    if (deal.deal_stages?.name) {
      return deal.deal_stages.name;
    }
    
    // Secondary: If deal_stages is missing but we have a stage_id that doesn't match deal_stages.id,
    // we should try to find the stage info from the pipeline context
    if (deal.stage_id && (!deal.deal_stages || deal.stage_id !== deal.deal_stages.id)) {
      // This would require access to the stages from the pipeline context
      // For now we'll fall back to known stages
      console.log("Stage ID mismatch or missing deal_stages:", deal.stage_id);
    }
    
    // Tertiary: Check if stage_id matches a known stage name
    const knownStages: Record<string, string> = {
      'lead': 'Lead',
      'mql': 'MQL',
      'sql': 'SQL',
      'discovery': 'Discovery',
      'proposal': 'Proposal',
      'negotiation': 'Negotiation',
      'closed': 'Closed/Won'
    };
    
    if (deal.stage_id && knownStages[deal.stage_id.toLowerCase()]) {
      return knownStages[deal.stage_id.toLowerCase()];
    }
    
    // Fallback to showing the stage_id if nothing else is available
    return deal.stage_id || 'Unknown Stage';
  }, [deal.deal_stages, deal.id, deal.company, deal.stage_id]);

  // Custom badge styles based on stage color
  const stageBadgeStyle = useMemo(() => {
    if (deal.deal_stages?.color) {
      return {
        backgroundColor: `${deal.deal_stages.color}20`,
        color: deal.deal_stages.color,
        borderColor: `${deal.deal_stages.color}40`,
        border: '1px solid'
      };
    }
    return {};
  }, [deal.deal_stages?.color]);

  return (
    <div
      ref={setNodeRef}
      {...attributes}
      {...listeners}
      onClick={() => isDragging ? null : onClick(deal)}
      className={`
        bg-gray-800/50 rounded-xl p-4 hover:bg-gray-800/70 
        transition-all border border-gray-800/80
        hover:border-gray-700 shadow-md hover:shadow-lg group
        ${isDragging || isDragOverlay ? 'shadow-xl cursor-grabbing z-[9999]' : 'cursor-grab'}
        relative overflow-hidden
      `}
      style={style}
    >
      {/* Only show shine effect when not dragging */}
      {!isDragging && !isDragOverlay && (
        <div className="absolute inset-0 bg-gradient-to-r from-transparent 
          via-white/[0.03] to-transparent translate-x-[-200%] 
          group-hover:translate-x-[200%] transition-transform duration-1000 pointer-events-none
          z-[1]"
        />
      )}
      
      <div className="relative z-[2] flex justify-between items-start">
        <div>
          <h3 className="font-medium text-white group-hover:text-blue-400 
            transition-colors duration-300 text-lg"
          >
            {deal.company}
          </h3>
          <div className="flex items-center gap-1.5 text-gray-400 text-sm mt-1">
            <User className="w-3.5 h-3.5" />
            <span>{deal.contact_name || 'No contact'}</span>
          </div>
        </div>
        <div className="text-emerald-400 font-bold">
          {formattedValue}
        </div>
      </div>
      
      <div className="relative z-[2] flex flex-wrap gap-1.5 mt-3">
        {/* Stage badge */}
        {deal.deal_stages?.color ? (
          <span
            className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium border"
            style={stageBadgeStyle}
          >
            {stageName}
          </span>
        ) : (
          <Badge 
            color={getColorFromHex(deal.deal_stages?.color)}
          >
            {stageName}
          </Badge>
        )}
        
        {/* Due date badge if exists */}
        {deal.expected_close_date && (
          <Badge 
            color={isPastDue(deal.expected_close_date) ? 'red' : 'blue'}
          >
            <Calendar className="w-3 h-3 mr-1" />
            {format(new Date(deal.expected_close_date), 'MMM d')}
          </Badge>
        )}
        
        {/* Additional badges could be added here */}
      </div>
      
      <div className="relative z-[2] flex items-center justify-between mt-4">
        {/* Time in stage indicator */}
        <div className={`
          flex items-center gap-1.5 text-xs
          ${timeIndicator.status === 'danger' ? 'text-red-400' : 
            timeIndicator.status === 'warning' ? 'text-yellow-400' : 'text-gray-400'}
        `}>
          {timeIndicator.icon && <timeIndicator.icon className="w-3.5 h-3.5" />}
          <span>{timeIndicator.text}</span>
        </div>
        
        {/* Probability indicator */}
        <div className="flex items-center gap-2">
          <div className="w-12 h-1 bg-gray-700 rounded-full overflow-hidden">
            <div 
              className="h-full rounded-full"
              style={{ 
                width: `${probability}%`,
                backgroundColor: stageColor 
              }}
            />
          </div>
          <span className="text-xs font-medium text-gray-300">
            {probability}%
          </span>
        </div>
      </div>
    </div>
  );
}

// Helper functions
function getColorFromHex(hex: string | undefined): "blue" | "emerald" | "violet" | "orange" | "yellow" | "red" | "gray" {
  if (!hex) return 'gray';
  
  // This is a simple mapping - you'd want to extend this 
  // based on your color scheme
  if (hex.includes('#10b981') || hex.includes('emerald')) return 'emerald';
  if (hex.includes('#3b82f6') || hex.includes('blue')) return 'blue';
  if (hex.includes('#8b5cf6') || hex.includes('violet')) return 'violet';
  if (hex.includes('#f97316') || hex.includes('orange')) return 'orange';
  if (hex.includes('#eab308') || hex.includes('yellow')) return 'yellow';
  if (hex.includes('#ef4444') || hex.includes('red')) return 'red';
  
  return 'gray';
}

function isPastDue(dateString: string): boolean {
  const date = new Date(dateString);
  return date < new Date();
} 