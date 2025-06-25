import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Plus, Save, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useImprovementRequests } from '@/lib/hooks/useImprovementRequests';
import { useUser } from '@/lib/hooks/useUser';
import {
  ImprovementRequest,
  CreateImprovementRequestData,
  UpdateImprovementRequestData,
  ImprovementRequestCategory,
  ImprovementRequestPriority,
  BusinessImpact,
  EffortEstimate,
} from '@/types/improvementRequests';

interface ImprovementRequestFormProps {
  request?: ImprovementRequest;
  isOpen: boolean;
  onClose: () => void;
}

const categories: { value: ImprovementRequestCategory; label: string; description: string }[] = [
  { value: 'ui', label: 'UI/UX', description: 'User interface improvements' },
  { value: 'feature', label: 'Feature', description: 'New functionality' },
  { value: 'bug', label: 'Bug Fix', description: 'Fix existing issues' },
  { value: 'performance', label: 'Performance', description: 'Speed and optimization' },
  { value: 'workflow', label: 'Workflow', description: 'Process improvements' },
  { value: 'reporting', label: 'Reporting', description: 'Analytics and reports' },
  { value: 'other', label: 'Other', description: 'Miscellaneous improvements' },
];

const priorities: { value: ImprovementRequestPriority; label: string; color: string }[] = [
  { value: 'low', label: 'Low', color: 'bg-gray-500' },
  { value: 'medium', label: 'Medium', color: 'bg-blue-500' },
  { value: 'high', label: 'High', color: 'bg-orange-500' },
  { value: 'urgent', label: 'Urgent', color: 'bg-red-500' },
];

const businessImpacts: { value: BusinessImpact; label: string; description: string }[] = [
  { value: 'low', label: 'Low Impact', description: 'Nice to have' },
  { value: 'medium', label: 'Medium Impact', description: 'Improves efficiency' },
  { value: 'high', label: 'High Impact', description: 'Critical for business' },
];

const effortEstimates: { value: EffortEstimate; label: string; description: string }[] = [
  { value: 'small', label: 'Small', description: '1-2 days' },
  { value: 'medium', label: 'Medium', description: '3-7 days' },
  { value: 'large', label: 'Large', description: '1-2 weeks' },
  { value: 'xl', label: 'XL', description: '3+ weeks' },
];

const ImprovementRequestForm: React.FC<ImprovementRequestFormProps> = ({
  request,
  isOpen,
  onClose,
}) => {
  const { userData } = useUser();
  const { createRequest, updateRequest, isCreating, isUpdating } = useImprovementRequests();
  
  const [formData, setFormData] = useState<CreateImprovementRequestData>({
    title: '',
    description: '',
    category: 'feature',
    priority: 'medium',
    business_impact: 'medium',
    effort_estimate: 'medium',
    current_workaround: '',
    expected_outcome: '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const isEditing = !!request;
  const isLoading = isCreating || isUpdating;

  useEffect(() => {
    if (request) {
      setFormData({
        title: request.title,
        description: request.description,
        category: request.category,
        priority: request.priority,
        business_impact: request.business_impact,
        effort_estimate: request.effort_estimate,
        current_workaround: request.current_workaround || '',
        expected_outcome: request.expected_outcome || '',
        assigned_to: request.assigned_to || '',
      });
    } else {
      setFormData({
        title: '',
        description: '',
        category: 'feature',
        priority: 'medium',
        business_impact: 'medium',
        effort_estimate: 'medium',
        current_workaround: '',
        expected_outcome: '',
      });
    }
    setErrors({});
  }, [request, isOpen]);

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.title.trim()) {
      newErrors.title = 'Title is required';
    }

    if (!formData.description.trim()) {
      newErrors.description = 'Description is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    try {
      if (isEditing && request) {
        const updateData: UpdateImprovementRequestData = {
          title: formData.title,
          description: formData.description,
          category: formData.category,
          priority: formData.priority,
          business_impact: formData.business_impact,
          effort_estimate: formData.effort_estimate,
          current_workaround: formData.current_workaround || undefined,
          expected_outcome: formData.expected_outcome || undefined,
        };

        await updateRequest(request.id, updateData);
      } else {
        await createRequest(formData);
      }
      
      onClose();
    } catch (error) {
      console.error('Error submitting form:', error);
    }
  };

  const handleInputChange = (field: keyof CreateImprovementRequestData) => 
    (value: string) => {
      setFormData(prev => ({ ...prev, [field]: value }));
      if (errors[field]) {
        setErrors(prev => ({ ...prev, [field]: '' }));
      }
    };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto bg-gray-900 border-gray-700">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold text-white flex items-center gap-2">
            {isEditing ? (
              <>
                <Save className="w-5 h-5" />
                Edit Improvement Request
              </>
            ) : (
              <>
                <Plus className="w-5 h-5" />
                New Improvement Request
              </>
            )}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Title */}
          <div className="space-y-2">
            <Label htmlFor="title" className="text-white">
              Title <span className="text-red-400">*</span>
            </Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => handleInputChange('title')(e.target.value)}
              placeholder="Brief description of the improvement"
              className="bg-gray-800 border-gray-600 text-white"
              disabled={isLoading}
            />
            {errors.title && (
              <p className="text-red-400 text-sm flex items-center gap-1">
                <AlertCircle className="w-4 h-4" />
                {errors.title}
              </p>
            )}
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description" className="text-white">
              Description <span className="text-red-400">*</span>
            </Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => handleInputChange('description')(e.target.value)}
              placeholder="Detailed description of what needs to be improved and why"
              rows={4}
              className="bg-gray-800 border-gray-600 text-white resize-none"
              disabled={isLoading}
            />
            {errors.description && (
              <p className="text-red-400 text-sm flex items-center gap-1">
                <AlertCircle className="w-4 h-4" />
                {errors.description}
              </p>
            )}
          </div>

          {/* Category and Priority Row */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-white">Category</Label>
              <Select
                value={formData.category}
                onValueChange={handleInputChange('category')}
                disabled={isLoading}
              >
                <SelectTrigger className="bg-gray-800 border-gray-600 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-gray-800 border-gray-600">
                  {categories.map((category) => (
                    <SelectItem
                      key={category.value}
                      value={category.value}
                      className="text-white hover:bg-gray-700"
                    >
                      <div className="flex flex-col">
                        <span>{category.label}</span>
                        <span className="text-xs text-gray-400">{category.description}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="text-white">Priority</Label>
              <Select
                value={formData.priority}
                onValueChange={handleInputChange('priority')}
                disabled={isLoading}
              >
                <SelectTrigger className="bg-gray-800 border-gray-600 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-gray-800 border-gray-600">
                  {priorities.map((priority) => (
                    <SelectItem
                      key={priority.value}
                      value={priority.value}
                      className="text-white hover:bg-gray-700"
                    >
                      <div className="flex items-center gap-2">
                        <div className={`w-2 h-2 rounded-full ${priority.color}`} />
                        {priority.label}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Impact and Effort Row */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-white">Business Impact</Label>
              <Select
                value={formData.business_impact || 'medium'}
                onValueChange={handleInputChange('business_impact')}
                disabled={isLoading}
              >
                <SelectTrigger className="bg-gray-800 border-gray-600 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-gray-800 border-gray-600">
                  {businessImpacts.map((impact) => (
                    <SelectItem
                      key={impact.value}
                      value={impact.value}
                      className="text-white hover:bg-gray-700"
                    >
                      <div className="flex flex-col">
                        <span>{impact.label}</span>
                        <span className="text-xs text-gray-400">{impact.description}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="text-white">Effort Estimate</Label>
              <Select
                value={formData.effort_estimate || 'medium'}
                onValueChange={handleInputChange('effort_estimate')}
                disabled={isLoading}
              >
                <SelectTrigger className="bg-gray-800 border-gray-600 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-gray-800 border-gray-600">
                  {effortEstimates.map((effort) => (
                    <SelectItem
                      key={effort.value}
                      value={effort.value}
                      className="text-white hover:bg-gray-700"
                    >
                      <div className="flex flex-col">
                        <span>{effort.label}</span>
                        <span className="text-xs text-gray-400">{effort.description}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Current Workaround */}
          <div className="space-y-2">
            <Label htmlFor="workaround" className="text-white">
              Current Workaround
            </Label>
            <Textarea
              id="workaround"
              value={formData.current_workaround || ''}
              onChange={(e) => handleInputChange('current_workaround')(e.target.value)}
              placeholder="How do you currently handle this issue?"
              rows={3}
              className="bg-gray-800 border-gray-600 text-white resize-none"
              disabled={isLoading}
            />
          </div>

          {/* Expected Outcome */}
          <div className="space-y-2">
            <Label htmlFor="outcome" className="text-white">
              Expected Outcome
            </Label>
            <Textarea
              id="outcome"
              value={formData.expected_outcome || ''}
              onChange={(e) => handleInputChange('expected_outcome')(e.target.value)}
              placeholder="What should happen after this improvement is implemented?"
              rows={3}
              className="bg-gray-800 border-gray-600 text-white resize-none"
              disabled={isLoading}
            />
          </div>

          {/* Form Actions */}
          <div className="flex items-center justify-end gap-3 pt-4">
            <Button
              type="button"
              variant="ghost"
              onClick={onClose}
              disabled={isLoading}
              className="text-gray-400 hover:text-white hover:bg-gray-800"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isLoading}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              {isLoading ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  {isEditing ? 'Updating...' : 'Creating...'}
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  {isEditing ? <Save className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                  {isEditing ? 'Update Request' : 'Create Request'}
                </div>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default ImprovementRequestForm;