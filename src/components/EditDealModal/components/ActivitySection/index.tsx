import React, { useState, useRef } from 'react';
import { Users, PencilLine, Calendar, PhoneCall, Mail } from 'lucide-react';
import { Button } from '../../../ui/button';
import ActivityItem from './ActivityItem';
import { DealActivity } from '@/lib/database/models';
import { useDealActivities } from '@/lib/hooks/useDealActivities';
import { useEditDeal } from '../../contexts/EditDealContext';

interface ActivitySectionProps {
  dealId?: string;
}

const ActivitySection: React.FC<ActivitySectionProps> = ({ dealId }) => {
  const [activityNote, setActivityNote] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const { state } = useEditDeal();
  
  // Use the deal activities hook to fetch and manage activities
  const { 
    activities, 
    isLoading, 
    error, 
    createActivity 
  } = useDealActivities(dealId || state?.deal?.id);
  
  // Default example activities (only shown when no real activities exist)
  const defaultActivities = [
    {
      type: 'stage_change',
      title: 'Stage updated to Proposal',
      description: 'Sarah changed the deal stage from Discovery to Proposal',
      timestamp: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
      user: 'Sarah'
    },
    {
      type: 'note',
      title: 'Note added',
      description: 'Had a detailed discovery call with John. They expressed strong interest in our Growth Plan and requested a detailed proposal to present to their leadership team next week.',
      timestamp: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
      user: 'Sarah'
    },
    {
      type: 'creation',
      title: 'Deal created',
      description: 'Deal was created and assigned to Sarah',
      timestamp: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
      user: 'System'
    }
  ];
  
  // Display loading state
  if (isLoading) {
    return (
      <div id="activity-section" role="tabpanel" aria-labelledby="tab-activity">
        <SectionHeading icon={<Users className="w-4 h-4" />} title="Deal Activity" />
        <div className="py-8 text-center text-gray-500">
          Loading activities...
        </div>
      </div>
    );
  }
  
  // Display error state
  if (error) {
    return (
      <div id="activity-section" role="tabpanel" aria-labelledby="tab-activity">
        <SectionHeading icon={<Users className="w-4 h-4" />} title="Deal Activity" />
        <div className="py-8 text-center text-red-500">
          Error loading activities. Please try again.
        </div>
      </div>
    );
  }
  
  // Determine what activities to display
  const displayActivities = activities && activities.length > 0 
    ? activities.map(activity => ({
        type: activity.activity_type,
        title: getActivityTitle(activity),
        description: activity.notes || '',
        timestamp: activity.created_at,
        user: activity.profiles?.full_name || 'Unknown'
      }))
    : defaultActivities;
  
  const handleAddNote = async () => {
    if (activityNote.trim() && dealId) {
      try {
        await createActivity({
          deal_id: dealId,
          activity_type: 'note',
          notes: activityNote.trim(),
          completed: true
        });
        
        setActivityNote('');
        
        // Focus back on textarea after adding note
        if (textareaRef.current) {
          textareaRef.current.focus();
        }
      } catch (error) {
        console.error('Error adding note:', error);
      }
    }
  };
  
  const handleKeyDown = (e: React.KeyboardEvent) => {
    // Submit on Ctrl/Cmd + Enter
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      e.preventDefault();
      handleAddNote();
    }
  };
  
  return (
    <div id="activity-section" role="tabpanel" aria-labelledby="tab-activity">
      <SectionHeading 
        icon={<Users className="w-4 h-4" />} 
        title="Deal Activity"
      />
      
      <div className="mb-6">
        <label 
          htmlFor="activityNote" 
          className="block text-sm font-medium text-gray-400 mb-1.5"
        >
          Add Activity Note
        </label>
        <div className="relative mb-3">
          <div className="absolute left-3 top-3 text-gray-500">
            <PencilLine className="w-4 h-4" />
          </div>
          <textarea
            id="activityNote"
            ref={textareaRef}
            className="w-full p-2.5 pl-10 bg-gray-900/80 border border-gray-700 
              rounded-lg focus:border-violet-500/50 focus:outline-none transition-colors
              text-white placeholder-gray-500 resize-vertical"
            value={activityNote}
            onChange={(e) => setActivityNote(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Add a note about this deal..."
            rows={3}
            aria-label="Add a note about this deal"
          />
        </div>
        
        <div className="flex flex-wrap gap-2">
          <Button
            size="sm"
            onClick={handleAddNote}
            disabled={!activityNote.trim() || !dealId}
            className="gap-1.5"
          >
            <PencilLine className="w-3.5 h-3.5" />
            Add Note
          </Button>
          
          <Button
            variant="outline"
            size="sm"
            className="gap-1.5"
          >
            <Calendar className="w-3.5 h-3.5" />
            Schedule Task
          </Button>
          
          <Button
            variant="outline"
            size="sm"
            className="gap-1.5"
          >
            <PhoneCall className="w-3.5 h-3.5" />
            Log Call
          </Button>
          
          <Button
            variant="outline"
            size="sm"
            className="gap-1.5"
          >
            <Mail className="w-3.5 h-3.5" />
            Log Email
          </Button>
        </div>
      </div>
      
      <div className="mt-6 space-y-0">
        {displayActivities.map((activity, index) => (
          <ActivityItem 
            key={`${activity.type}-${index}`}
            activity={activity}
          />
        ))}
        
        {displayActivities.length === 0 && (
          <div className="text-center py-6 text-gray-500">
            No activity recorded yet.
          </div>
        )}
      </div>
    </div>
  );
};

// Helper function to get activity title
const getActivityTitle = (activity: DealActivity): string => {
  switch (activity.activity_type) {
    case 'note':
      return 'Note added';
    case 'call':
      return 'Call logged';
    case 'email':
      return 'Email logged';
    case 'meeting':
      return 'Meeting scheduled';
    case 'task':
      return 'Task created';
    case 'stage_change':
      return 'Stage changed';
    default:
      return 'Activity recorded';
  }
};

// Helper component
interface SectionHeadingProps {
  icon: React.ReactNode;
  title: string;
}

const SectionHeading: React.FC<SectionHeadingProps> = ({ icon, title }) => (
  <div className="flex items-center gap-2 mb-4 text-gray-400 text-sm font-medium">
    <div className="flex items-center justify-center">
      {icon}
    </div>
    <span>{title}</span>
  </div>
);

export default ActivitySection; 