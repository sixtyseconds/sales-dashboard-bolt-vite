import React, { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { Calendar, User, Building2, Save, X, ExternalLink } from 'lucide-react';

import { Task } from '@/lib/database/models';
import { useTasks } from '@/lib/hooks/useTasks';
import { useUser } from '@/lib/hooks/useUser';
import { useUsers } from '@/lib/hooks/useUsers';
import { useCompanies } from '@/lib/hooks/useCompanies';
import { useContacts } from '@/lib/hooks/useContacts';
import { useDeals } from '@/lib/hooks/useDeals';
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

interface TaskFormData {
  title: string;
  description: string;
  notes: string;
  due_date: string;
  priority: Task['priority'];
  task_type: Task['task_type'];
  assigned_to: string;
  deal_id: string;
  company_id: string;
  contact_id: string;
  contact_email: string;
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
  const { companies } = useCompanies();
  const { contacts } = useContacts();
  const { deals } = useDeals();
  const { createTask, updateTask } = useTasks();
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [formData, setFormData] = useState<TaskFormData>({
    title: '',
    description: '',
    notes: '',
    due_date: '',
    priority: 'medium',
    task_type: 'general',
    assigned_to: userData?.id || '',
    deal_id: dealId,
    company_id: companyId,
    contact_id: contactId,
    contact_email: contactEmail,
    contact_name: contactName,
    company: company
  });

  // Update form data when task prop changes or props change
  useEffect(() => {
    if (task) {
      setFormData({
        title: task.title,
        description: task.description || '',
        notes: task.notes || '',
        due_date: task.due_date ? format(new Date(task.due_date), "yyyy-MM-dd'T'HH:mm") : '',
        priority: task.priority,
        task_type: task.task_type,
        assigned_to: task.assigned_to,
        deal_id: task.deal_id || '',
        company_id: task.company_id || '',
        contact_id: task.contact_id || '',
        contact_email: task.contact_email || '',
        contact_name: task.contact_name || '',
        company: task.company || ''
      });
    } else {
      // Reset for new task with provided context
      setFormData({
        title: '',
        description: '',
        notes: '',
        due_date: '',
        priority: 'medium',
        task_type: 'general',
        assigned_to: userData?.id || '',
        deal_id: dealId,
        company_id: companyId,
        contact_id: contactId,
        contact_email: contactEmail,
        contact_name: contactName,
        company: company
      });
    }
  }, [task, userData?.id, dealId, companyId, contactId, contactEmail, contactName, company]);

  const handleInputChange = (field: keyof TaskFormData, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // When company changes, auto-populate related data
  const handleCompanyChange = (companyId: string) => {
    const actualCompanyId = companyId === 'none' ? '' : companyId;
    const selectedCompany = companies.find(c => c.id === actualCompanyId);
    setFormData(prev => ({
      ...prev,
      company_id: actualCompanyId,
      company: selectedCompany?.name || '',
      // Reset contact if company changes
      contact_id: '',
      contact_name: '',
      contact_email: ''
    }));
  };

  // When contact changes, auto-populate related data
  const handleContactChange = (contactId: string) => {
    const actualContactId = contactId === 'none' ? '' : contactId;
    const selectedContact = contacts.find(c => c.id === actualContactId);
    setFormData(prev => ({
      ...prev,
      contact_id: actualContactId,
      contact_name: selectedContact?.full_name || `${selectedContact?.first_name} ${selectedContact?.last_name}` || '',
      contact_email: selectedContact?.email || '',
      // Auto-select company if contact has one
      company_id: selectedContact?.company_id || prev.company_id,
      company: selectedContact?.companies?.name || prev.company
    }));
  };

  // When deal changes, auto-populate related data
  const handleDealChange = (dealId: string) => {
    const actualDealId = dealId === 'none' ? '' : dealId;
    const selectedDeal = deals.find(d => d.id === actualDealId);
    setFormData(prev => ({
      ...prev,
      deal_id: actualDealId,
      // Auto-populate contact info from deal if available
      contact_email: prev.contact_email,
      contact_name: prev.contact_name,
      company: prev.company,
      // Try to link to structured data if available
      company_id: prev.company_id,
      contact_id: prev.contact_id
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.title.trim()) {
      toast.error('Task title is required');
      return;
    }

    if (!formData.assigned_to) {
      toast.error('Assignee is required');
      return;
    }

    setIsSubmitting(true);

    try {
      const taskData = {
        title: formData.title.trim(),
        description: formData.description.trim() || undefined,
        notes: formData.notes.trim() || undefined,
        due_date: formData.due_date ? new Date(formData.due_date).toISOString() : undefined,
        priority: formData.priority,
        task_type: formData.task_type,
        assigned_to: formData.assigned_to,
        deal_id: formData.deal_id || undefined,
        company_id: formData.company_id || undefined,
        contact_id: formData.contact_id || undefined,
        contact_email: formData.contact_email.trim() || undefined,
        contact_name: formData.contact_name.trim() || undefined,
        company: formData.company.trim() || undefined,
      };

      if (task) {
        // Update existing task
        await updateTask(task.id, taskData);
        toast.success('Task updated successfully');
      } else {
        // Create new task
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

  // Get filtered contacts based on selected company
  const filteredContacts = formData.company_id 
    ? contacts.filter(c => c.company_id === formData.company_id)
    : contacts;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold text-white">
            {task ? 'Edit Task' : 'Create New Task'}
          </DialogTitle>
          <DialogDescription className="text-gray-400">
            {task ? 'Update task details' : 'Create a new task and assign it to a team member'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Title */}
          <div className="space-y-2">
            <Label htmlFor="title" className="text-sm font-medium text-gray-300">
              Task Title *
            </Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => handleInputChange('title', e.target.value)}
              placeholder="Enter task title..."
              className="bg-gray-800/50 border-gray-700 text-white"
              required
            />
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description" className="text-sm font-medium text-gray-300">
              Description
            </Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
              placeholder="Describe the task..."
              rows={3}
              className="bg-gray-800/50 border-gray-700 text-white resize-none"
            />
          </div>

          {/* Task Type, Priority, and Assignee */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="task_type" className="text-sm font-medium text-gray-300">
                Task Type
              </Label>
              <Select value={formData.task_type} onValueChange={(value) => handleInputChange('task_type', value)}>
                <SelectTrigger className="bg-gray-800/50 border-gray-700">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="call">Call</SelectItem>
                  <SelectItem value="email">Email</SelectItem>
                  <SelectItem value="meeting">Meeting</SelectItem>
                  <SelectItem value="follow_up">Follow Up</SelectItem>
                  <SelectItem value="proposal">Proposal</SelectItem>
                  <SelectItem value="demo">Demo</SelectItem>
                  <SelectItem value="general">General</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="priority" className="text-sm font-medium text-gray-300">
                Priority
              </Label>
              <Select value={formData.priority} onValueChange={(value) => handleInputChange('priority', value)}>
                <SelectTrigger className="bg-gray-800/50 border-gray-700">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="urgent">Urgent</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="assigned_to" className="text-sm font-medium text-gray-300">
                Assigned To *
              </Label>
              <Select value={formData.assigned_to} onValueChange={(value) => handleInputChange('assigned_to', value)}>
                <SelectTrigger className="bg-gray-800/50 border-gray-700">
                  <SelectValue placeholder="Select assignee" />
                </SelectTrigger>
                <SelectContent>
                  {users.map((user) => (
                    <SelectItem key={user.id} value={user.id}>
                      {user.first_name} {user.last_name} {user.id === userData?.id && '(Me)'}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Due Date */}
          <div className="space-y-2">
            <Label htmlFor="due_date" className="text-sm font-medium text-gray-300">
              Due Date & Time
            </Label>
            <div className="relative">
              <Calendar className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                id="due_date"
                type="datetime-local"
                value={formData.due_date}
                onChange={(e) => handleInputChange('due_date', e.target.value)}
                className="bg-gray-800/50 border-gray-700 text-white pl-10"
              />
            </div>
          </div>

          {/* CRM Relationships */}
          <div className="space-y-4">
            <h3 className="text-sm font-medium text-gray-300 flex items-center gap-2">
              <Building2 className="w-4 h-4" />
              CRM Context
            </h3>

            {/* Deal Selection */}
            <div className="space-y-2">
              <Label htmlFor="deal_id" className="text-sm font-medium text-gray-400">
                Related Deal
              </Label>
              <Select value={formData.deal_id || 'none'} onValueChange={handleDealChange}>
                <SelectTrigger className="bg-gray-800/50 border-gray-700">
                  <SelectValue placeholder="Select a deal (optional)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No deal selected</SelectItem>
                  {deals.map((deal) => (
                    <SelectItem key={deal.id} value={deal.id}>
                      <div className="flex items-center justify-between w-full">
                        <span>{deal.name}</span>
                        <Badge variant="outline" className="ml-2">
                          £{deal.value.toLocaleString()}
                        </Badge>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Company and Contact Selection */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="company_id" className="text-sm font-medium text-gray-400">
                  Company
                </Label>
                <Select value={formData.company_id || 'none'} onValueChange={handleCompanyChange}>
                  <SelectTrigger className="bg-gray-800/50 border-gray-700">
                    <SelectValue placeholder="Select company (optional)" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">No company selected</SelectItem>
                    {companies.map((company) => (
                      <SelectItem key={company.id} value={company.id}>
                        {company.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="contact_id" className="text-sm font-medium text-gray-400">
                  Contact
                </Label>
                <Select value={formData.contact_id} onValueChange={handleContactChange}>
                  <SelectTrigger className="bg-gray-800/50 border-gray-700">
                    <SelectValue placeholder="Select contact (optional)" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">No contact selected</SelectItem>
                    {filteredContacts.map((contact) => (
                      <SelectItem key={contact.id} value={contact.id}>
                        <div>
                          <div>{contact.full_name || `${contact.first_name} ${contact.last_name}`}</div>
                          <div className="text-xs text-gray-400">{contact.email}</div>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Manual Contact Information (fallback) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="contact_name" className="text-sm font-medium text-gray-400">
                  Contact Name <span className="text-xs text-gray-500">(or manual entry)</span>
                </Label>
                <Input
                  id="contact_name"
                  value={formData.contact_name}
                  onChange={(e) => handleInputChange('contact_name', e.target.value)}
                  placeholder="Contact person name"
                  className="bg-gray-800/50 border-gray-700 text-white"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="contact_email" className="text-sm font-medium text-gray-400">
                  Contact Email <span className="text-xs text-gray-500">(or manual entry)</span>
                </Label>
                <Input
                  id="contact_email"
                  type="email"
                  value={formData.contact_email}
                  onChange={(e) => handleInputChange('contact_email', e.target.value)}
                  placeholder="contact@company.com"
                  className="bg-gray-800/50 border-gray-700 text-white"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="company" className="text-sm font-medium text-gray-400">
                Company Name <span className="text-xs text-gray-500">(or manual entry)</span>
              </Label>
              <Input
                id="company"
                value={formData.company}
                onChange={(e) => handleInputChange('company', e.target.value)}
                placeholder="Company name"
                className="bg-gray-800/50 border-gray-700 text-white"
              />
            </div>
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes" className="text-sm font-medium text-gray-300">
              Notes
            </Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => handleInputChange('notes', e.target.value)}
              placeholder="Additional notes or context..."
              rows={3}
              className="bg-gray-800/50 border-gray-700 text-white resize-none"
            />
          </div>

          <DialogFooter className="flex gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="border-gray-700 text-gray-300 hover:bg-gray-800"
            >
              <X className="w-4 h-4 mr-2" />
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="bg-[#37bd7e] hover:bg-[#37bd7e]/90"
            >
              {isSubmitting ? (
                <>
                  <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full mr-2" />
                  Saving...
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