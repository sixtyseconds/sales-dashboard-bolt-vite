import React, { useState, useEffect } from 'react';
import { format, addDays } from 'date-fns';
import { Calendar, Clock, User, Target, Star, Save, X, Zap, Plus } from 'lucide-react';

import { Task } from '@/lib/database/models';
import { useTasks } from '@/lib/hooks/useTasks';
import { useUser } from '@/lib/hooks/useUser';
import { useUsers } from '@/lib/hooks/useUsers';
import { useContacts } from '@/lib/hooks/useContacts';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';

interface TaskFormProps {
  task?: Task;
  isOpen: boolean;
  onClose: () => void;
  dealId?: string;
  companyId?: string;
  contactId?: string;
  contactEmail?: string;
  contactName?: string;
  company?: string;
}

interface SimpleTaskFormData {
  title: string;
  description: string;
  task_type: Task['task_type'];
  priority: Task['priority'];
  due_date: string;
  assigned_to: string;
  // Optional context - simplified
  deal_id: string;
  contact_name: string;
  company: string;
}

const TaskForm: React.FC<TaskFormProps> = ({
  task,
  isOpen,
  onClose,
  dealId = '',
  companyId = '',
  contactId = '',
  contactEmail = '',
  contactName = '',
  company = ''
}) => {
  const { userData } = useUser();
  const { users } = useUsers();
  const { contacts } = useContacts();
  const { createTask, updateTask } = useTasks();
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [formData, setFormData] = useState<SimpleTaskFormData>({
    title: '',
    description: '',
    task_type: 'call',
    priority: 'medium',
    due_date: '',
    assigned_to: userData?.id || '',
    deal_id: dealId,
    contact_name: contactName,
    company: company
  });

  // Quick due date options
  const quickDueDates = [
    { label: 'Today', value: format(new Date(), "yyyy-MM-dd'T'09:00") },
    { label: 'Tomorrow', value: format(addDays(new Date(), 1), "yyyy-MM-dd'T'09:00") },
    { label: 'Next Week', value: format(addDays(new Date(), 7), "yyyy-MM-dd'T'09:00") },
  ];

  // Task type options with icons and colors
  const taskTypes = [
    { value: 'call', label: 'Phone Call', icon: '📞', color: 'bg-blue-500/20 text-blue-400' },
    { value: 'email', label: 'Email', icon: '✉️', color: 'bg-green-500/20 text-green-400' },
    { value: 'meeting', label: 'Meeting', icon: '🤝', color: 'bg-purple-500/20 text-purple-400' },
    { value: 'follow_up', label: 'Follow Up', icon: '🔄', color: 'bg-orange-500/20 text-orange-400' },
    { value: 'demo', label: 'Demo', icon: '🎯', color: 'bg-indigo-500/20 text-indigo-400' },
    { value: 'proposal', label: 'Proposal', icon: '📋', color: 'bg-yellow-500/20 text-yellow-400' },
    { value: 'general', label: 'General', icon: '⚡', color: 'bg-gray-500/20 text-gray-400' },
  ];

  // Priority options with visual indicators
  const priorities = [
    { value: 'low', label: 'Low', icon: '🟢', color: 'bg-green-500/20 text-green-400 border-green-500/30' },
    { value: 'medium', label: 'Medium', icon: '🟡', color: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30' },
    { value: 'high', label: 'High', icon: '🟠', color: 'bg-orange-500/20 text-orange-400 border-orange-500/30' },
    { value: 'urgent', label: 'Urgent', icon: '🔴', color: 'bg-red-500/20 text-red-400 border-red-500/30' },
  ];

  // Update form data when task prop changes
  useEffect(() => {
    if (task) {
      setFormData({
        title: task.title,
        description: task.description || '',
        task_type: task.task_type,
        priority: task.priority,
        due_date: task.due_date ? format(new Date(task.due_date), "yyyy-MM-dd'T'HH:mm") : '',
        assigned_to: task.assigned_to,
        deal_id: task.deal_id || '',
        contact_name: task.contact_name || '',
        company: task.company || ''
      });
    } else {
      // Reset for new task with provided context
      setFormData({
        title: '',
        description: '',
        task_type: 'call',
        priority: 'medium',
        due_date: '',
        assigned_to: userData?.id || '',
        deal_id: dealId,
        contact_name: contactName,
        company: company
      });
    }
  }, [task, userData?.id, dealId, contactName, company]);

  const handleInputChange = (field: keyof SimpleTaskFormData, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleQuickDate = (dateValue: string) => {
    setFormData(prev => ({
      ...prev,
      due_date: dateValue
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.title.trim()) {
      toast.error('Task title is required');
      return;
    }

    if (!formData.assigned_to) {
      toast.error('Please assign this task to someone');
      return;
    }

    setIsSubmitting(true);

    try {
      const taskData = {
        title: formData.title.trim(),
        description: formData.description.trim() || undefined,
        task_type: formData.task_type,
        priority: formData.priority,
        due_date: formData.due_date ? new Date(formData.due_date).toISOString() : undefined,
        assigned_to: formData.assigned_to,
        // Simplified context
        deal_id: formData.deal_id || undefined,
        contact_name: formData.contact_name.trim() || undefined,
        company: formData.company.trim() || undefined,
        // Default other fields
        contact_email: contactEmail || undefined,
        company_id: companyId || undefined,
        contact_id: contactId || undefined,
      };

      if (task) {
        await updateTask(task.id, taskData);
        toast.success('Task updated successfully');
      } else {
        await createTask(taskData);
        toast.success('Task created successfully');
      }

      onClose();
    } catch (error) {
      console.error('Error saving task:', error);
      toast.error('Failed to save task. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const selectedTaskType = taskTypes.find(t => t.value === formData.task_type);
  const selectedPriority = priorities.find(p => p.value === formData.priority);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-2xl glassmorphism border-gray-700/50">
        <DialogHeader className="pb-4">
          <DialogTitle className="text-2xl font-bold text-white flex items-center gap-3">
            <Plus className="w-6 h-6 text-blue-400" />
            {task ? 'Edit Task' : 'Create New Task'}
          </DialogTitle>
          <DialogDescription className="text-gray-400 text-base">
            {task ? 'Update your task details' : 'Set up a new task quickly and efficiently'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Task Title */}
          <div className="space-y-3">
            <Label htmlFor="title" className="text-lg font-semibold text-white flex items-center gap-2">
              <Target className="w-5 h-5 text-blue-400" />
              What needs to be done? *
            </Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => handleInputChange('title', e.target.value)}
              placeholder="e.g., Call John about the proposal"
              className="bg-gray-800/70 border-gray-600/50 text-white text-lg p-4 rounded-xl focus:border-blue-500/50 focus:ring-blue-500/20"
              required
            />
          </div>

          {/* Task Type & Priority Row */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-3">
              <Label className="text-base font-medium text-white flex items-center gap-2">
                ⚡ Task Type
              </Label>
              <Select value={formData.task_type} onValueChange={(value) => handleInputChange('task_type', value)}>
                <SelectTrigger className="bg-gray-800/70 border-gray-600/50 h-12 text-base rounded-xl">
                  <SelectValue>
                    <div className="flex items-center gap-3">
                      <span className="text-lg">{selectedTaskType?.icon}</span>
                      <span>{selectedTaskType?.label}</span>
                    </div>
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {taskTypes.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      <div className="flex items-center gap-3">
                        <span className="text-lg">{type.icon}</span>
                        <span>{type.label}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-3">
              <Label className="text-base font-medium text-white flex items-center gap-2">
                <Star className="w-4 h-4 text-yellow-400" />
                Priority
              </Label>
              <Select value={formData.priority} onValueChange={(value) => handleInputChange('priority', value)}>
                <SelectTrigger className="bg-gray-800/70 border-gray-600/50 h-12 text-base rounded-xl">
                  <SelectValue>
                    <div className="flex items-center gap-3">
                      <span className="text-lg">{selectedPriority?.icon}</span>
                      <span>{selectedPriority?.label}</span>
                    </div>
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {priorities.map((priority) => (
                    <SelectItem key={priority.value} value={priority.value}>
                      <div className="flex items-center gap-3">
                        <span className="text-lg">{priority.icon}</span>
                        <span>{priority.label}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Due Date */}
          <div className="space-y-3">
            <Label className="text-base font-medium text-white flex items-center gap-2">
              <Clock className="w-4 h-4 text-green-400" />
              When is this due?
            </Label>
            
            {/* Quick Date Buttons */}
            <div className="flex gap-2 flex-wrap">
              {quickDueDates.map((quick) => (
                <Button
                  key={quick.label}
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => handleQuickDate(quick.value)}
                  className="bg-gray-800/50 border-gray-600/50 text-gray-300 hover:bg-gray-700/70 hover:text-white"
                >
                  {quick.label}
                </Button>
              ))}
            </div>
            
            <div className="relative">
              <Calendar className="absolute left-4 top-4 h-5 w-5 text-gray-400" />
              <Input
                id="due_date"
                type="datetime-local"
                value={formData.due_date}
                onChange={(e) => handleInputChange('due_date', e.target.value)}
                className="bg-gray-800/70 border-gray-600/50 text-white pl-12 h-12 rounded-xl"
              />
            </div>
          </div>

                     {/* Assignee */}
           <div className="space-y-3">
             <Label className="text-base font-medium text-white flex items-center gap-2">
               <User className="w-4 h-4 text-purple-400" />
               Who's responsible? *
             </Label>
             <Select value={formData.assigned_to} onValueChange={(value) => handleInputChange('assigned_to', value)}>
               <SelectTrigger className="bg-gray-800/70 border-gray-600/50 h-12 text-base rounded-xl">
                 <SelectValue placeholder="Choose someone..." className="text-gray-400" />
               </SelectTrigger>
               <SelectContent>
                 {/* Team Members Section */}
                 <div className="px-2 py-1 text-xs font-semibold text-blue-400 uppercase tracking-wide">
                   Team Members
                 </div>
                 {users.map((user) => (
                   <SelectItem key={`user-${user.id}`} value={user.id}>
                     <div className="flex items-center gap-3">
                       <div className="w-6 h-6 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white text-xs font-bold">
                         {user.first_name?.[0]}{user.last_name?.[0]}
                       </div>
                       <span>{user.first_name} {user.last_name}</span>
                       {user.id === userData?.id && <Badge variant="outline" className="ml-2 text-xs">You</Badge>}
                     </div>
                   </SelectItem>
                 ))}
                 
                 {/* Prospects/Contacts Section */}
                 {contacts.length > 0 && (
                   <>
                     <div className="px-2 py-1 text-xs font-semibold text-orange-400 uppercase tracking-wide mt-2">
                       Prospects/Contacts
                     </div>
                     {contacts.slice(0, 10).map((contact) => (
                       <SelectItem key={`contact-${contact.id}`} value={`contact-${contact.id}`}>
                         <div className="flex items-center gap-3">
                           <div className="w-6 h-6 bg-gradient-to-br from-orange-500 to-red-500 rounded-full flex items-center justify-center text-white text-xs font-bold">
                             {contact.first_name?.[0] || contact.full_name?.[0] || '?'}
                           </div>
                           <div className="flex flex-col">
                             <span>{contact.full_name || `${contact.first_name || ''} ${contact.last_name || ''}`.trim()}</span>
                             {contact.email && <span className="text-xs text-gray-400">{contact.email}</span>}
                           </div>
                           <Badge variant="outline" className="ml-2 text-xs bg-orange-500/20 text-orange-400 border-orange-500/30">
                             Prospect
                           </Badge>
                         </div>
                       </SelectItem>
                     ))}
                   </>
                 )}
               </SelectContent>
             </Select>
           </div>

          {/* Optional Description */}
          <div className="space-y-3">
            <Label htmlFor="description" className="text-base font-medium text-gray-300">
              Additional Details (Optional)
            </Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
              placeholder="Any extra context or notes..."
              rows={3}
              className="bg-gray-800/70 border-gray-600/50 text-white resize-none rounded-xl"
            />
          </div>

          {/* Context Info (Auto-filled) */}
          {(formData.contact_name || formData.company) && (
            <div className="glassmorphism-light p-4 rounded-xl border border-blue-500/20">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
                <span className="text-sm font-medium text-blue-400">Task Context</span>
              </div>
              <div className="space-y-2 text-sm">
                {formData.contact_name && (
                  <div className="flex items-center gap-2 text-gray-300">
                    <User className="w-3 h-3" />
                    <span>Contact: {formData.contact_name}</span>
                  </div>
                )}
                {formData.company && (
                  <div className="flex items-center gap-2 text-gray-300">
                    <span className="w-3 h-3 text-center">🏢</span>
                    <span>Company: {formData.company}</span>
                  </div>
                )}
              </div>
            </div>
          )}

          <DialogFooter className="flex gap-3 pt-6">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="bg-gray-800/50 border-gray-600/50 text-gray-300 hover:bg-gray-700/70 hover:text-white h-12 px-6"
            >
              <X className="w-4 h-4 mr-2" />
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-500 hover:to-blue-600 text-white h-12 px-8 rounded-xl shadow-lg shadow-blue-500/20 hover:shadow-blue-500/30 transition-all duration-300"
            >
              {isSubmitting ? (
                <>
                  <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full mr-2" />
                  {task ? 'Updating...' : 'Creating...'}
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  {task ? 'Update Task' : 'Create Task'}
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default TaskForm;