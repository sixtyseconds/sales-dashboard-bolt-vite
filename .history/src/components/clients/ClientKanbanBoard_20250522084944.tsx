import React from 'react';

// Placeholder data for Kanban board
const kanbanData = {
  onboarding: {
    title: 'Onboarding',
    count: 3,
    titleColor: 'text-blue-400',
    clients: [
      { id: 'k1', name: 'Client Alpha', mrr: '$5,000 MRR' },
      { id: 'k2', name: 'Client Beta', mrr: '$2,500 MRR' },
    ],
  },
  active: {
    title: 'Active',
    count: 5,
    titleColor: 'text-green-400',
    clients: [
      { id: 'k3', name: 'Client Gamma', mrr: '$10,000 MRR' },
      { id: 'k4', name: 'Client Delta', mrr: '$7,200 MRR' },
    ],
  },
  notice: {
    title: 'Notice Given',
    count: 2,
    titleColor: 'text-yellow-400',
    clients: [{ id: 'k5', name: 'Client Epsilon', mrr: '$3,000 MRR' }],
  },
  cancelled: {
    title: 'Cancelled',
    count: 1,
    titleColor: 'text-red-400',
    clients: [{ id: 'k6', name: 'Client Zeta', mrr: 'Lost $1,500 MRR' }],
  },
};

interface KanbanColumnProps {
  columnId: keyof typeof kanbanData;
  data: (typeof kanbanData)[keyof typeof kanbanData];
}

const KanbanColumn: React.FC<KanbanColumnProps> = ({ data }) => {
  return (
    <div className="bg-[#1E2022] border border-[#2C3035] rounded-xl p-4 flex flex-col">
      <h3 className={`${data.titleColor} text-lg font-semibold mb-3 flex items-center justify-between`}>
        {data.title}
        <span className="text-sm text-[#A2ABB3]">{data.count} Clients</span>
      </h3>
      <div className="space-y-3 overflow-y-auto flex-grow" style={{maxHeight: 'calc(100vh - 250px)'}}> {/* Adjust maxHeight as needed */}
        {data.clients.map((client) => (
          <div key={client.id} className="bg-[#2C3035] p-3 rounded-lg shadow">
            <p className="text-white font-medium text-sm">{client.name}</p>
            <p className="text-xs text-[#A2ABB3]">{client.mrr}</p>
          </div>
        ))}
        {data.clients.length === 0 && (
            <p className="text-sm text-center text-gray-500 py-4">No clients in this stage.</p>
        )}
      </div>
    </div>
  );
};

interface ClientKanbanBoardProps {
  // Props for filtering will be added later
}

const ClientKanbanBoard: React.FC<ClientKanbanBoardProps> = () => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {Object.keys(kanbanData).map((columnId) => (
        <KanbanColumn 
          key={columnId} 
          columnId={columnId as keyof typeof kanbanData} 
          data={kanbanData[columnId as keyof typeof kanbanData]} 
        />
      ))}
    </div>
  );
};

export default ClientKanbanBoard; 