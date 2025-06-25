import React, { useState } from 'react';
import { LayoutGrid, List, Lightbulb } from 'lucide-react';
import ImprovementRequestList from '@/components/ImprovementRequestList';
import ImprovementRequestKanban from '@/components/ImprovementRequestKanban';
import ImprovementRequestForm from '@/components/ImprovementRequestForm';
import { Button } from '@/components/ui/button';
import { ImprovementRequest, ImprovementRequestStatus } from '@/types/improvementRequests';

const ImprovementRequestsPage: React.FC = () => {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingRequest, setEditingRequest] = useState<ImprovementRequest | undefined>(undefined);
  const [view, setView] = useState<'list' | 'kanban'>('kanban');
  const [initialStatus, setInitialStatus] = useState<ImprovementRequestStatus | undefined>(undefined);

  const handleCreateRequest = (status?: ImprovementRequestStatus) => {
    setEditingRequest(undefined);
    setInitialStatus(status);
    setIsFormOpen(true);
  };

  const handleEditRequest = (request: ImprovementRequest) => {
    setEditingRequest(request);
    setInitialStatus(undefined);
    setIsFormOpen(true);
  };

  const handleCloseForm = () => {
    setIsFormOpen(false);
    setEditingRequest(undefined);
    setInitialStatus(undefined);
  };

  return (
    <div className="min-h-screen bg-gray-950 p-4 sm:p-6 lg:p-8">
      {/* Header with View Toggle */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-white flex items-center gap-3">
            <div className="p-2 rounded-lg bg-blue-600/20">
              <Lightbulb className="w-6 h-6 text-blue-400" />
            </div>
            Improvement Requests
          </h1>
          <p className="text-gray-400 mt-1">Collaborate on dashboard improvements with your team</p>
        </div>
        
        {/* View Toggle */}
        <div className="flex items-center gap-2 bg-gray-800/50 rounded-lg p-1">
          <Button
            variant={view === 'list' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setView('list')}
            className={`
              ${view === 'list' 
                ? 'bg-blue-600 hover:bg-blue-700 text-white' 
                : 'text-gray-400 hover:text-white hover:bg-gray-700/50'
              }
              transition-all duration-200
            `}
          >
            <List className="w-4 h-4 mr-2" />
            List View
          </Button>
          <Button
            variant={view === 'kanban' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setView('kanban')}
            className={`
              ${view === 'kanban' 
                ? 'bg-blue-600 hover:bg-blue-700 text-white' 
                : 'text-gray-400 hover:text-white hover:bg-gray-700/50'
              }
              transition-all duration-200
            `}
          >
            <LayoutGrid className="w-4 h-4 mr-2" />
            Kanban View
          </Button>
        </div>
      </div>

      {/* Content based on view */}
      {view === 'list' ? (
        <ImprovementRequestList 
          onCreateRequest={() => handleCreateRequest()}
          onEditRequest={handleEditRequest}
        />
      ) : (
        <ImprovementRequestKanban 
          onCreateRequest={handleCreateRequest}
          onEditRequest={handleEditRequest}
        />
      )}
      
      {/* Form Modal */}
      <ImprovementRequestForm
        request={editingRequest}
        isOpen={isFormOpen}
        onClose={handleCloseForm}
      />
    </div>
  );
};

export default ImprovementRequestsPage;