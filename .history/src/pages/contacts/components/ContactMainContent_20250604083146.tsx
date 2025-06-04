import React, { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Send, RefreshCw, CheckCircle2, Calendar, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ApiContactService } from '@/lib/services/apiContactService';
import type { Contact } from '@/lib/database/models';

interface ContactMainContentProps {
  contact: Contact;
  activeTab: string;
}

export function ContactMainContent({ contact, activeTab }: ContactMainContentProps) {
  const [tasks, setTasks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTasks = async () => {
      if (!contact.id) return;
      
      try {
        setLoading(true);
        const tasksData = await ApiContactService.getContactTasks(contact.id);
        setTasks(tasksData || []);
      } catch (error) {
        console.error('Error fetching tasks:', error);
      } finally {
        setLoading(false);
      }
    };

    if (activeTab === 'overview') {
      fetchTasks();
    }
  }, [contact.id, activeTab]);

  const getPriorityColor = (priority: string) => {
    switch (priority?.toLowerCase()) {
      case 'high': return 'border-l-red-500 bg-red-500/5';
      case 'medium': return 'border-l-yellow-500 bg-yellow-500/5';
      case 'low': return 'border-l-green-500 bg-green-500/5';
      default: return 'border-l-gray-500 bg-gray-500/5';
    }
  };

  const getPriorityBadge = (priority: string) => {
    switch (priority?.toLowerCase()) {
      case 'high': return <Badge className="bg-red-500/20 text-red-400 border-red-500/30">High</Badge>;
      case 'medium': return <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30">Medium</Badge>;
      case 'low': return <Badge className="bg-green-500/20 text-green-400 border-green-500/30">Low</Badge>;
      default: return <Badge variant="outline">Normal</Badge>;
    }
  };

  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return 'Unknown';
    }
  };

  if (activeTab === 'overview') {
    return (
      <div className="lg:col-span-2 space-y-6">
        {/* Tasks Section */}
        <div className="section-card">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-blue-400" />
              Active Tasks
            </h2>
            <button className="btn-primary">
              <Plus className="w-4 h-4 mr-2" />
              Create Task
            </button>
          </div>

          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3].map(i => (
                <div key={i} className="h-24 bg-gray-700 rounded animate-pulse"></div>
              ))}
            </div>
          ) : (
            <div className="space-y-3">
              {tasks.length > 0 ? (
                tasks.map((task) => (
                  <div key={task.id} className={`p-4 rounded-lg border-l-4 bg-gray-800/50 ${getPriorityColor(task.priority)}`}>
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <input 
                          type="checkbox"
                          checked={task.completed}
                          className="mt-1 w-4 h-4 text-blue-600 bg-gray-700 border-gray-600 rounded focus:ring-blue-500"
                          onChange={() => {}}
                        />
                        <div>
                          <h3 className={`text-white font-medium ${task.completed ? 'line-through opacity-60' : ''}`}>
                            {task.title}
                          </h3>
                          <p className={`text-gray-400 text-sm ${task.completed ? 'opacity-60' : ''}`}>
                            {task.description}
                          </p>
                        </div>
                      </div>
                      {getPriorityBadge(task.priority)}
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2 text-gray-400">
                        <Calendar className="w-4 h-4" />
                        <span>Due: {formatDate(task.due_date)}</span>
                      </div>
                      <div className="flex gap-2">
                        <button className="btn-icon btn-ghost">
                          <Edit className="w-4 h-4 text-gray-400 hover:text-white" />
                        </button>
                        <button className="btn-icon btn-ghost">
                          <Trash2 className="w-4 h-4 text-gray-400 hover:text-red-400" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-12 text-gray-400">
                  <CheckCircle2 className="w-16 h-16 mx-auto mb-4 opacity-30" />
                  <p className="text-lg font-medium mb-2">No tasks found</p>
                  <p className="text-sm">Create a new task to get started with managing your contact activities.</p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* AI Email Composer */}
        <div className="section-card bg-gradient-to-br from-purple-900/20 to-blue-900/20 border-purple-500/20">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-purple-400" />
              AI Email Follow-up
            </h2>
            <Badge className="bg-purple-500/20 text-purple-400 border-purple-500/30">
              Based on contact data
            </Badge>
          </div>

          <div className="space-y-4">
            <div className="p-4 rounded-lg bg-blue-500/10 border border-blue-500/30">
              <h3 className="text-white font-medium mb-2">Suggested Email</h3>
              <div className="text-sm text-gray-300 space-y-2">
                <p><strong>Subject:</strong> Following up on our recent conversation</p>
                <p><strong>Hi {contact.first_name || 'there'},</strong></p>
                <p>Hope you're doing well! I wanted to follow up on our recent discussions about {
                  tasks.length > 0 ? 'the opportunities we discussed' : 'potential collaboration'
                }.</p>
                {contact.companies && (
                  <p>I believe our solutions could be a great fit for {contact.companies.name}'s needs.</p>
                )}
                <p>Would you have time for a brief call this week to discuss next steps?</p>
                <p><strong>Best regards,<br />Your Sales Team</strong></p>
              </div>
            </div>

            <div className="flex gap-3">
              <Button className="bg-blue-600 hover:bg-blue-700 text-white flex-1">
                <Send className="w-4 h-4 mr-2" />
                Send Email
              </Button>
              <Button variant="outline" className="border-gray-600 text-gray-300 hover:bg-gray-800">
                <Edit className="w-4 h-4 mr-2" />
                Edit
              </Button>
              <Button variant="outline" className="border-gray-600 text-gray-300 hover:bg-gray-800">
                <RefreshCw className="w-4 h-4 mr-2" />
                Regenerate
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // For other tabs, show placeholder content
  return (
    <div className="lg:col-span-2 space-y-6">
      <div className="section-card">
        <div className="text-center py-12">
          <h3 className="text-lg font-medium text-gray-400 mb-2">
            {activeTab.charAt(0).toUpperCase() + activeTab.slice(1)} Content
          </h3>
          <p className="text-gray-500 text-sm">
            This section will display {activeTab}-related information for {contact.first_name || contact.email}.
          </p>
        </div>
      </div>
    </div>
  );
} 