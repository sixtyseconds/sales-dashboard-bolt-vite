import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Plus, Lightbulb, Bug, ArrowUp, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';
import { useRoadmap, RoadmapSuggestion } from '@/lib/hooks/useRoadmap';

interface SuggestionFormProps {
  trigger?: React.ReactNode;
  onSuccess?: () => void;
}

export function SuggestionForm({ trigger, onSuccess }: SuggestionFormProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    type: 'feature' as RoadmapSuggestion['type'],
    priority: 'medium' as RoadmapSuggestion['priority'],
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { createSuggestion } = useRoadmap();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.title.trim() || !formData.description.trim()) {
      toast.error('Please fill in all required fields');
      return;
    }

    try {
      setIsSubmitting(true);
      await createSuggestion(formData);
      
      toast.success('Your suggestion has been submitted successfully!');
      setFormData({
        title: '',
        description: '',
        type: 'feature',
        priority: 'medium',
      });
      setIsOpen(false);
      onSuccess?.();
    } catch (error) {
      console.error('Error creating suggestion:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to submit suggestion');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getTypeIcon = (type: RoadmapSuggestion['type']) => {
    switch (type) {
      case 'feature':
        return <Lightbulb className="w-4 h-4" />;
      case 'bug':
        return <Bug className="w-4 h-4" />;
      case 'improvement':
        return <ArrowUp className="w-4 h-4" />;
      case 'other':
        return <AlertTriangle className="w-4 h-4" />;
      default:
        return <Lightbulb className="w-4 h-4" />;
    }
  };

  const getPriorityColor = (priority: RoadmapSuggestion['priority']) => {
    switch (priority) {
      case 'critical':
        return 'text-red-500 bg-red-500/10 border-red-500/20';
      case 'high':
        return 'text-orange-500 bg-orange-500/10 border-orange-500/20';
      case 'medium':
        return 'text-yellow-500 bg-yellow-500/10 border-yellow-500/20';
      case 'low':
        return 'text-green-500 bg-green-500/10 border-green-500/20';
      default:
        return 'text-gray-500 bg-gray-500/10 border-gray-500/20';
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button className="bg-emerald-600 hover:bg-emerald-700 text-white">
            <Plus className="w-4 h-4 mr-2" />
            New Suggestion
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="bg-gray-900/95 backdrop-blur-xl border-gray-800/50 text-white max-w-2xl">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold">
            Submit a Feature Request or Bug Report
          </DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Title */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-300">
              Title <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              required
              value={formData.title}
              onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
              placeholder="Brief, descriptive title for your suggestion"
              className="w-full bg-gray-800/50 border border-gray-700/50 rounded-lg px-3 py-2 text-white placeholder-gray-500 focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
            />
          </div>

          {/* Type and Priority */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-300">
                Type <span className="text-red-400">*</span>
              </label>
              <div className="grid grid-cols-2 gap-2">
                {(['feature', 'bug', 'improvement', 'other'] as const).map((type) => (
                  <button
                    key={type}
                    type="button"
                    onClick={() => setFormData(prev => ({ ...prev, type }))}
                    className={`p-3 rounded-lg border transition-all flex items-center gap-2 ${
                      formData.type === type
                        ? 'border-emerald-500 bg-emerald-500/10 text-emerald-400'
                        : 'border-gray-700/50 bg-gray-800/50 text-gray-400 hover:border-gray-600 hover:text-gray-300'
                    }`}
                  >
                    {getTypeIcon(type)}
                    <span className="text-sm font-medium capitalize">{type}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-300">
                Priority
              </label>
              <div className="grid grid-cols-2 gap-2">
                {(['low', 'medium', 'high', 'critical'] as const).map((priority) => (
                  <button
                    key={priority}
                    type="button"
                    onClick={() => setFormData(prev => ({ ...prev, priority }))}
                    className={`p-2 rounded-lg border transition-all text-sm font-medium capitalize ${
                      formData.priority === priority
                        ? getPriorityColor(priority)
                        : 'border-gray-700/50 bg-gray-800/50 text-gray-400 hover:border-gray-600 hover:text-gray-300'
                    }`}
                  >
                    {priority}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Description */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-300">
              Description <span className="text-red-400">*</span>
            </label>
            <textarea
              required
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Provide detailed information about your suggestion. For bugs, include steps to reproduce. For features, explain the use case and expected behavior."
              rows={6}
              className="w-full bg-gray-800/50 border border-gray-700/50 rounded-lg px-3 py-2 text-white placeholder-gray-500 focus:ring-2 focus:ring-emerald-500 focus:border-transparent resize-none"
            />
          </div>

          {/* Guidelines */}
          <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4">
            <h4 className="text-sm font-medium text-blue-400 mb-2">Guidelines for Good Suggestions</h4>
            <ul className="text-xs text-blue-300 space-y-1">
              <li>• Be specific and detailed in your description</li>
              <li>• For bugs: Include steps to reproduce and expected vs actual behavior</li>
              <li>• For features: Explain the business value and use cases</li>
              <li>• Search existing suggestions to avoid duplicates</li>
              <li>• Use descriptive titles that summarize the request</li>
            </ul>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-4">
            <Button
              type="button"
              variant="ghost"
              onClick={() => setIsOpen(false)}
              disabled={isSubmitting}
              className="text-gray-400 hover:text-white"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="bg-emerald-600 hover:bg-emerald-700 text-white"
            >
              {isSubmitting ? 'Submitting...' : 'Submit Suggestion'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}