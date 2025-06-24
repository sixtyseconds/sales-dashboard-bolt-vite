import React, { useState } from 'react';
import { Plus, User, Phone, Mail, Calendar, Clock, CheckCircle2 } from 'lucide-react';
import { format } from 'date-fns';

import { useTasks } from '@/lib/hooks/useTasks';
import { useContacts } from '@/lib/hooks/useContacts';
import { Task } from '@/lib/database/models';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import TaskForm from './TaskForm';

interface ContactTaskListProps {
  contactId?: string;
  showAllContacts?: boolean;
}

const ContactTaskList: React.FC<ContactTaskListProps> = ({ 
  contactId, 
  showAllContacts = false 
}) => {
  const { 
    tasks, 
    isLoading, 
    getTasksByContact, 
    getTasksGroupedByContact, 
    createContactTask,
    completeTask 
  } = useTasks();
  const { contacts } = useContacts();
  const [isTaskFormOpen, setIsTaskFormOpen] = useState(false);
  const [selectedContactId, setSelectedContactId] = useState<string>('');

  // Filter tasks based on props
  const relevantTasks = React.useMemo(() => {
    if (contactId) {
      return tasks.filter(task => task.contact_id === contactId);
    }
    if (showAllContacts) {
      return getTasksGroupedByContact();
    }
    return tasks.filter(task => task.contact_id); // Only tasks with contacts
  }, [tasks, contactId, showAllContacts, getTasksGroupedByContact]);

  const handleCreateTask = (forContactId?: string) => {
    setSelectedContactId(forContactId || contactId || '');
    setIsTaskFormOpen(true);
  };

  const handleCompleteTask = async (taskId: string) => {
    try {
      await completeTask(taskId);
    } catch (error) {
      console.error('Error completing task:', error);
    }
  };

  const getPriorityColor = (priority: Task['priority']) => {
    switch (priority) {
      case 'urgent': return 'bg-red-500';
      case 'high': return 'bg-orange-500';
      case 'medium': return 'bg-yellow-500';
      case 'low': return 'bg-green-500';
      default: return 'bg-gray-500';
    }
  };

  const getStatusColor = (status: Task['status']) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800';
      case 'in_progress': return 'bg-blue-100 text-blue-800';
      case 'overdue': return 'bg-red-100 text-red-800';
      case 'cancelled': return 'bg-gray-100 text-gray-800';
      default: return 'bg-yellow-100 text-yellow-800';
    }
  };

  if (isLoading) {
    return <div className="flex justify-center p-4">Loading tasks...</div>;
  }

  // Single contact view
  if (contactId) {
    const contact = contacts.find(c => c.id === contactId);
    const contactTasks = Array.isArray(relevantTasks) ? relevantTasks : [];

    return (
      <div className="space-y-4">
        {contact && (
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <User className="w-5 h-5 text-blue-500" />
                  <div>
                    <CardTitle className="text-lg">{contact.full_name}</CardTitle>
                    <div className="flex items-center space-x-4 text-sm text-gray-600">
                      <span className="flex items-center space-x-1">
                        <Mail className="w-4 h-4" />
                        <span>{contact.email}</span>
                      </span>
                      {contact.phone && (
                        <span className="flex items-center space-x-1">
                          <Phone className="w-4 h-4" />
                          <span>{contact.phone}</span>
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <Button 
                  onClick={() => handleCreateTask(contactId)} 
                  size="sm"
                  className="flex items-center space-x-1"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add Task</span>
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {contactTasks.length === 0 ? (
                  <p className="text-gray-500 text-center py-4">No tasks for this contact</p>
                                 ) : (
                   contactTasks.map((task: Task) => (
                     <TaskItem 
                       key={task.id} 
                       task={task} 
                       onComplete={handleCompleteTask}
                       getPriorityColor={getPriorityColor}
                       getStatusColor={getStatusColor}
                     />
                   ))
                 )}
              </div>
            </CardContent>
          </Card>
        )}

        <TaskForm
          isOpen={isTaskFormOpen}
          onClose={() => setIsTaskFormOpen(false)}
          contactId={selectedContactId}
          contactName={contact?.full_name}
          contactEmail={contact?.email}
        />
      </div>
    );
  }

  // Grouped by contact view
  if (showAllContacts && typeof relevantTasks === 'object') {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold">Tasks by Contact</h2>
          <Button onClick={() => handleCreateTask()} variant="outline">
            <Plus className="w-4 h-4 mr-2" />
            New Task
          </Button>
        </div>

        {Object.entries(relevantTasks).map(([contactKey, contactTasks]) => {
          const contact = contactKey !== 'unassigned' 
            ? contacts.find(c => c.id === contactKey)
            : null;

          return (
            <Card key={contactKey}>
              <CardHeader className="pb-3">
                <div className="flex items-center space-x-3">
                  <User className="w-5 h-5 text-blue-500" />
                  <CardTitle className="text-lg">
                    {contact ? contact.full_name : 'Unassigned Tasks'}
                  </CardTitle>
                  <Badge variant="secondary">{contactTasks.length}</Badge>
                </div>
                {contact && (
                  <div className="flex items-center space-x-4 text-sm text-gray-600">
                    <span className="flex items-center space-x-1">
                      <Mail className="w-4 h-4" />
                      <span>{contact.email}</span>
                    </span>
                  </div>
                )}
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {contactTasks.map((task) => (
                    <TaskItem 
                      key={task.id} 
                      task={task} 
                      onComplete={handleCompleteTask}
                      getPriorityColor={getPriorityColor}
                      getStatusColor={getStatusColor}
                    />
                  ))}
                </div>
              </CardContent>
            </Card>
          );
        })}

        <TaskForm
          isOpen={isTaskFormOpen}
          onClose={() => setIsTaskFormOpen(false)}
          contactId={selectedContactId}
        />
      </div>
    );
  }

  // Default list view
  const taskList = Array.isArray(relevantTasks) ? relevantTasks : [];
  
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Contact Tasks</h2>
        <Button onClick={() => handleCreateTask()} variant="outline">
          <Plus className="w-4 h-4 mr-2" />
          New Task
        </Button>
      </div>

      <div className="space-y-2">
        {taskList.length === 0 ? (
          <p className="text-gray-500 text-center py-8">No contact tasks found</p>
        ) : (
          taskList.map((task) => (
            <TaskItem 
              key={task.id} 
              task={task} 
              onComplete={handleCompleteTask}
              getPriorityColor={getPriorityColor}
              getStatusColor={getStatusColor}
            />
          ))
        )}
      </div>

      <TaskForm
        isOpen={isTaskFormOpen}
        onClose={() => setIsTaskFormOpen(false)}
        contactId={selectedContactId}
      />
    </div>
  );
};

// Task item component
interface TaskItemProps {
  task: Task;
  onComplete: (taskId: string) => void;
  getPriorityColor: (priority: Task['priority']) => string;
  getStatusColor: (status: Task['status']) => string;
}

const TaskItem: React.FC<TaskItemProps> = ({ 
  task, 
  onComplete, 
  getPriorityColor, 
  getStatusColor 
}) => {
  return (
    <div className="flex items-center space-x-3 p-3 border rounded-lg hover:bg-gray-50">
      <button
        onClick={() => onComplete(task.id)}
        className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
          task.completed 
            ? 'bg-green-500 border-green-500 text-white' 
            : 'border-gray-300 hover:border-green-500'
        }`}
      >
        {task.completed && <CheckCircle2 className="w-3 h-3" />}
      </button>

      <div className="flex-1 min-w-0">
        <div className="flex items-center space-x-2">
          <h4 className={`font-medium ${task.completed ? 'line-through text-gray-500' : ''}`}>
            {task.title}
          </h4>
          <div className={`w-2 h-2 rounded-full ${getPriorityColor(task.priority)}`} />
        </div>
        
        {task.description && (
          <p className="text-sm text-gray-600 mt-1">{task.description}</p>
        )}
        
        <div className="flex items-center space-x-4 mt-2 text-xs text-gray-500">
          <Badge className={getStatusColor(task.status)} variant="secondary">
            {task.status}
          </Badge>
          
          <Badge variant="outline">{task.task_type}</Badge>
          
          {task.due_date && (
            <span className="flex items-center space-x-1">
              <Calendar className="w-3 h-3" />
              <span>{format(new Date(task.due_date), 'MMM d, yyyy')}</span>
            </span>
          )}
          
          {task.assignee && (
            <span className="flex items-center space-x-1">
              <User className="w-3 h-3" />
              <span>{task.assignee.first_name} {task.assignee.last_name}</span>
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

export default ContactTaskList; 