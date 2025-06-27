import React, { useState, useRef, useEffect } from 'react';
import { Users, PencilLine, Calendar, PhoneCall, Mail, Plus, Clock, AlertCircle, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '../../../ui/badge';
import ActivityItem from './ActivityItem';
import { DealActivity } from '@/lib/database/models';
import { useEditDeal } from '../../contexts/EditDealContext';
import { useFormContext } from 'react-hook-form';
import { supabase } from '@/lib/supabase/clientV2';
import { toast } from 'sonner';
import { format, addDays, addHours } from 'date-fns';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';

interface ActivitySectionProps {
  dealId?: string;
}

const ActivitySection: React.FC<ActivitySectionProps> = ({ dealId }) => {
  const [activityNote, setActivityNote] = useState('');
  const [showTaskForm, setShowTaskForm] = useState(false);
  const [showCallForm, setShowCallForm] = useState(false);
  const [showEmailForm, setShowEmailForm] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const { watch } = useFormContext();
  
  // Get deal and contact information from form
  const dealName = watch('name');
  const contactName = watch('contactName');
  const contactEmail = watch('contactEmail');
  const company = watch('company');
  
  // Simple state for activities
  const [activities, setActivities] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Simplified activity creation functions using direct database calls
  const createDealActivity = async (activityData: {
    activity_type: string;
    notes?: string;
    due_date?: string;
    contact_email?: string;
  }): Promise<void> => {
    if (!dealId) {
      toast.error('No deal ID available');
      return;
    }

    try {
      console.log('Creating activity:', { activityData, dealId });
      
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) {
        throw new Error('User not authenticated');
      }

      console.log('User authenticated:', userData.user.email);

      // Use simple user email as sales rep name
      const salesRepName = userData.user.email || 'Unknown Rep';

      if (activityData.activity_type === 'note') {
        console.log('Adding note to deal...');
        
        // For notes, get current notes and append new one
        const { data: currentDeal, error: fetchError } = await (supabase as any)
          .from('deals')
          .select('notes')
          .eq('id', dealId)
          .single();

        if (fetchError) {
          console.error('Error fetching current deal:', fetchError);
          throw fetchError;
        }

        console.log('Current deal notes:', currentDeal?.notes);

        const currentNotes = currentDeal?.notes || '';
        const newNote = `${new Date().toLocaleDateString()}: ${activityData.notes}\n\n${currentNotes}`;
        
        const { error: updateError } = await (supabase as any)
          .from('deals')
          .update({ notes: newNote })
          .eq('id', dealId);

        if (updateError) {
          console.error('Error updating deal notes:', updateError);
          throw updateError;
        }

        console.log('Note added successfully');
        toast.success('Note added to deal');
        return;
        
      } else if (activityData.activity_type === 'task') {
        console.log('Creating task activity...');
        
        // For tasks, add to main activities as outbound
        // Try with enhanced columns first, fallback to basic if they don't exist
        const basicData = {
          user_id: userData.user.id,
          type: 'outbound',
          status: 'pending',
          priority: 'medium',
          client_name: company || 'Unknown Company',
          sales_rep: salesRepName,
          details: `Task: ${activityData.notes}${activityData.due_date ? ` (Due: ${new Date(activityData.due_date).toLocaleDateString()})` : ''}`,
          date: new Date().toISOString()
        };

        // Try to add enhanced tracking columns
        const enhancedData = {
          ...basicData,
          deal_id: dealId,
          contact_identifier: contactEmail,
          contact_identifier_type: 'email',
          quantity: 1
        };

        let { error: insertError } = await (supabase as any)
          .from('activities')
          .insert(enhancedData);

        // If enhanced insert fails, try basic insert
        if (insertError && insertError.message?.includes('column')) {
          console.log('Enhanced columns not available, trying basic insert...');
          const { error: basicError } = await (supabase as any)
            .from('activities')
            .insert(basicData);
          insertError = basicError;
        }

        if (insertError) {
          console.error('Error creating task activity:', insertError);
          throw insertError;
        }

        console.log('Task activity created successfully');
        toast.success('Task scheduled and added to activity log');
        return;
        
      } else if (activityData.activity_type === 'call' || activityData.activity_type === 'email') {
        console.log(`Creating ${activityData.activity_type} activity...`);
        
        // For calls and emails, add to main activities as outbound
        const basicData = {
          user_id: userData.user.id,
          type: 'outbound',
          status: 'completed',
          priority: 'medium',
          client_name: company || 'Unknown Company',
          sales_rep: salesRepName,
          details: `${activityData.activity_type === 'call' ? 'Call' : 'Email'}: ${activityData.notes || 'No details provided'}`,
          date: new Date().toISOString()
        };

        // Try to add enhanced tracking columns
        const enhancedData = {
          ...basicData,
          deal_id: dealId,
          contact_identifier: contactEmail,
          contact_identifier_type: 'email',
          quantity: 1
        };

        let { error: insertError } = await (supabase as any)
          .from('activities')
          .insert(enhancedData);

        // If enhanced insert fails, try basic insert
        if (insertError && insertError.message?.includes('column')) {
          console.log('Enhanced columns not available, trying basic insert...');
          const { error: basicError } = await (supabase as any)
            .from('activities')
            .insert(basicData);
          insertError = basicError;
        }

        if (insertError) {
          console.error(`Error creating ${activityData.activity_type} activity:`, insertError);
          throw insertError;
        }

        console.log(`${activityData.activity_type} activity created successfully`);
        toast.success(`${activityData.activity_type === 'call' ? 'Call' : 'Email'} logged successfully and added to activity tracking`);
        return;
      }
      
    } catch (error: any) {
      console.error('Error creating activity:', error);
      toast.error(`Failed to add activity: ${error?.message || 'Unknown error'}`);
    }
  };
  
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
  
  // Handle adding a note
  const handleAddNote = async (e?: React.MouseEvent) => {
    console.log('handleAddNote called');
    if (e) {
      e.preventDefault();
      e.stopPropagation();
      console.log('Event prevented and stopped');
    }
    
    if (activityNote.trim() && dealId) {
      console.log('About to create note activity');
      await createDealActivity({
        activity_type: 'note',
        notes: activityNote.trim()
      });
      
      setActivityNote('');
      
      // Focus back on textarea after adding note
      if (textareaRef.current) {
        textareaRef.current.focus();
      }
    } else {
      console.log('Note not added - missing note or dealId:', { note: activityNote.trim(), dealId });
    }
  };

  // Handle scheduling a task
  const handleScheduleTask = (e?: React.MouseEvent) => {
    console.log('handleScheduleTask called');
    if (e) {
      e.preventDefault();
      e.stopPropagation();
      console.log('Event prevented and stopped');
    }
    setShowTaskForm(true);
  };

  // Handle logging a call
  const handleLogCall = (e?: React.MouseEvent) => {
    console.log('handleLogCall called');
    if (e) {
      e.preventDefault();
      e.stopPropagation();
      console.log('Event prevented and stopped');
    }
    setShowCallForm(true);
  };

  // Handle logging an email
  const handleLogEmail = (e?: React.MouseEvent) => {
    console.log('handleLogEmail called');
    if (e) {
      e.preventDefault();
      e.stopPropagation();
      console.log('Event prevented and stopped');
    }
    setShowEmailForm(true);
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
            type="button"
            size="sm"
            onClick={handleAddNote}
            disabled={!activityNote.trim() || !dealId}
            className="gap-1.5"
          >
            <PencilLine className="w-3.5 h-3.5" />
            Add Note
          </Button>
          
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="gap-1.5"
            onClick={handleScheduleTask}
          >
            <Calendar className="w-3.5 h-3.5" />
            Schedule Task
          </Button>
          
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="gap-1.5"
            onClick={handleLogCall}
          >
            <PhoneCall className="w-3.5 h-3.5" />
            Log Call
          </Button>
          
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="gap-1.5"
            onClick={handleLogEmail}
          >
            <Mail className="w-3.5 h-3.5" />
            Log Email
          </Button>
        </div>
      </div>
      
      {/* Activities List */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h4 className="text-sm font-medium text-gray-700">Activity Tracking</h4>
        </div>
        
        <div className="text-sm text-gray-600 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-start gap-2">
            <div className="text-blue-500 mt-0.5">
              <FileText className="w-4 h-4" />
            </div>
            <div>
              <p className="font-medium text-blue-900 mb-1">Activity Logging Active</p>
              <p className="text-blue-700">
                • <strong>Notes</strong> are saved to this deal<br/>
                • <strong>Tasks, Calls & Emails</strong> are logged to your Activity Dashboard<br/>
                • View all activities in the main Activity Log or Dashboard
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Task Form Modal */}
      {showTaskForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <TaskForm 
            dealId={dealId}
            contactName={contactName}
            contactEmail={contactEmail}
            company={company}
            onClose={() => setShowTaskForm(false)}
            onSubmit={createDealActivity}
          />
        </div>
      )}

      {/* Call Log Form Modal */}
      {showCallForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <CallLogForm 
            dealId={dealId}
            contactName={contactName}
            contactEmail={contactEmail}
            company={company}
            onClose={() => setShowCallForm(false)}
            onSubmit={createDealActivity}
          />
        </div>
      )}

      {/* Email Log Form Modal */}
      {showEmailForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <EmailLogForm 
            dealId={dealId}
            contactName={contactName}
            contactEmail={contactEmail}
            company={company}
            onClose={() => setShowEmailForm(false)}
            onSubmit={createDealActivity}
          />
        </div>
      )}
    </div>
  );
};

// Task Form Component
const TaskForm: React.FC<{
  dealId?: string;
  contactName?: string;
  contactEmail?: string;
  company?: string;
  onClose: () => void;
  onSubmit: (data: any) => Promise<void>;
}> = ({ dealId, contactName, contactEmail, company, onClose, onSubmit }) => {
  const [taskTitle, setTaskTitle] = useState('');
  const [taskNotes, setTaskNotes] = useState('');
  const [dueDate, setDueDate] = useState(format(addDays(new Date(), 1), 'yyyy-MM-dd'));
  const [dueTime, setDueTime] = useState('09:00');
  const [priority, setPriority] = useState('medium');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!taskTitle.trim()) return;

    const dueDatetime = `${dueDate}T${dueTime}:00`;
    
    await onSubmit({
      activity_type: 'task',
      notes: `Task: ${taskTitle}\n\nNotes: ${taskNotes}\n\nPriority: ${priority}`,
      due_date: dueDatetime,
      contact_email: contactEmail
    });
    
    onClose();
  };

  return (
    <div className="bg-gray-900 rounded-lg p-6 w-full max-w-md mx-4">
      <h3 className="text-lg font-semibold text-white mb-4">Schedule Task</h3>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1">Task Title</label>
          <Input
            value={taskTitle}
            onChange={(e) => setTaskTitle(e.target.value)}
            placeholder="Enter task title..."
            className="bg-gray-800 border-gray-700 text-white"
            required
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1">Notes</label>
          <textarea
            value={taskNotes}
            onChange={(e) => setTaskNotes(e.target.value)}
            placeholder="Additional notes..."
            className="w-full p-2 bg-gray-800 border border-gray-700 rounded text-white placeholder-gray-500"
            rows={3}
          />
        </div>
        
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">Due Date</label>
            <Input
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              className="bg-gray-800 border-gray-700 text-white"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">Due Time</label>
            <Input
              type="time"
              value={dueTime}
              onChange={(e) => setDueTime(e.target.value)}
              className="bg-gray-800 border-gray-700 text-white"
            />
          </div>
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1">Priority</label>
          <Select value={priority} onValueChange={setPriority}>
            <SelectTrigger className="bg-gray-800 border-gray-700 text-white">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="low">Low</SelectItem>
              <SelectItem value="medium">Medium</SelectItem>
              <SelectItem value="high">High</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        <div className="flex gap-2 pt-4">
          <Button type="submit" className="flex-1">Schedule Task</Button>
          <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
        </div>
      </form>
    </div>
  );
};

// Call Log Form Component
const CallLogForm: React.FC<{
  dealId?: string;
  contactName?: string;
  contactEmail?: string;
  company?: string;
  onClose: () => void;
  onSubmit: (data: any) => Promise<void>;
}> = ({ dealId, contactName, contactEmail, company, onClose, onSubmit }) => {
  const [callNotes, setCallNotes] = useState('');
  const [outcome, setOutcome] = useState('');
  const [duration, setDuration] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!callNotes.trim()) return;

    await onSubmit({
      activity_type: 'call',
      notes: `Call with ${contactName || contactEmail}\n\nOutcome: ${outcome}\nDuration: ${duration} minutes\n\nNotes: ${callNotes}`,
      contact_email: contactEmail
    });
    
    onClose();
  };

  return (
    <div className="bg-gray-900 rounded-lg p-6 w-full max-w-md mx-4">
      <h3 className="text-lg font-semibold text-white mb-4">Log Call</h3>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1">Call Outcome</label>
          <Select value={outcome} onValueChange={setOutcome}>
            <SelectTrigger className="bg-gray-800 border-gray-700 text-white">
              <SelectValue placeholder="Select outcome..." />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="connected">Connected</SelectItem>
              <SelectItem value="voicemail">Left Voicemail</SelectItem>
              <SelectItem value="no-answer">No Answer</SelectItem>
              <SelectItem value="busy">Busy</SelectItem>
              <SelectItem value="meeting-scheduled">Meeting Scheduled</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1">Duration (minutes)</label>
          <Input
            type="number"
            value={duration}
            onChange={(e) => setDuration(e.target.value)}
            placeholder="5"
            className="bg-gray-800 border-gray-700 text-white"
            min="1"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1">Call Notes</label>
          <textarea
            value={callNotes}
            onChange={(e) => setCallNotes(e.target.value)}
            placeholder="What was discussed during the call..."
            className="w-full p-2 bg-gray-800 border border-gray-700 rounded text-white placeholder-gray-500"
            rows={4}
            required
          />
        </div>
        
        <div className="flex gap-2 pt-4">
          <Button type="submit" className="flex-1">Log Call</Button>
          <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
        </div>
      </form>
    </div>
  );
};

// Email Log Form Component
const EmailLogForm: React.FC<{
  dealId?: string;
  contactName?: string;
  contactEmail?: string;
  company?: string;
  onClose: () => void;
  onSubmit: (data: any) => Promise<void>;
}> = ({ dealId, contactName, contactEmail, company, onClose, onSubmit }) => {
  const [subject, setSubject] = useState('');
  const [direction, setDirection] = useState('outbound');
  const [emailNotes, setEmailNotes] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subject.trim() || !emailNotes.trim()) return;

    await onSubmit({
      activity_type: 'email',
      notes: `Email ${direction} - ${contactName || contactEmail}\n\nSubject: ${subject}\n\nNotes: ${emailNotes}`,
      contact_email: contactEmail
    });
    
    onClose();
  };

  return (
    <div className="bg-gray-900 rounded-lg p-6 w-full max-w-md mx-4">
      <h3 className="text-lg font-semibold text-white mb-4">Log Email</h3>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1">Direction</label>
          <Select value={direction} onValueChange={setDirection}>
            <SelectTrigger className="bg-gray-800 border-gray-700 text-white">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="outbound">Sent Email</SelectItem>
              <SelectItem value="inbound">Received Email</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1">Subject</label>
          <Input
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            placeholder="Email subject..."
            className="bg-gray-800 border-gray-700 text-white"
            required
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1">Email Summary</label>
          <textarea
            value={emailNotes}
            onChange={(e) => setEmailNotes(e.target.value)}
            placeholder="Summary of the email content and any follow-up actions..."
            className="w-full p-2 bg-gray-800 border border-gray-700 rounded text-white placeholder-gray-500"
            rows={4}
            required
          />
        </div>
        
        <div className="flex gap-2 pt-4">
          <Button type="submit" className="flex-1">Log Email</Button>
          <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
        </div>
      </form>
    </div>
  );
};

// Helper function to get activity title
const getActivityTitle = (activity: any): string => {
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