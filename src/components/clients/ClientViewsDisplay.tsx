import React, { useState, useCallback } from 'react';
import ClientViewToggle from './ClientViewToggle';
import ClientTableFilters from './ClientTableFilters';
import ClientTable from './ClientTable';
import ClientKanbanBoard from './ClientKanbanBoard';

// Placeholder data for table - this would normally come from a data source and be filtered/sorted
const initialClientsData = [
  { id: '1', name: 'Tech Solutions Inc.', status: 'Onboarding', statusColor: 'blue', contractValue: '$75,000', mrr: '$6,250', renewalDate: 'Dec 15, 2024' },
  { id: '2', name: 'Innovate Systems', status: 'Active', statusColor: 'green', contractValue: '$120,000', mrr: '$10,000', renewalDate: 'Mar 22, 2025' },
  { id: '3', name: 'Global Dynamics', status: 'Notice Given', statusColor: 'yellow', contractValue: '$50,000', mrr: '$4,167', renewalDate: 'Oct 01, 2024' },
  { id: '4', name: 'Quantum Leap Corp', status: 'Cancelled', statusColor: 'red', contractValue: '$90,000', mrr: '-', renewalDate: 'Aug 10, 2024 (Cancelled)' },
  // Add more clients for testing filters/sorting if needed
];

const ClientViewsDisplay: React.FC = () => {
  const [activeView, setActiveView] = useState<'table' | 'kanban'>('table');
  // State for filters - to be implemented fully later
  const [statusFilter, setStatusFilter] = useState('');
  const [revenueTypeFilter, setRevenueTypeFilter] = useState('');
  const [sortBy, setSortBy] = useState('value');

  // Dummy client data for now, will be replaced with actual data fetching and filtering
  const [filteredClients, setFilteredClients] = useState(initialClientsData);

  const handleViewChange = useCallback((view: 'table' | 'kanban') => {
    setActiveView(view);
  }, []);

  const handleStatusChange = useCallback((status: string) => {
    setStatusFilter(status);
    // console.log('Status filter:', status);
    // Add filtering logic here
  }, []);

  const handleRevenueTypeChange = useCallback((revenueType: string) => {
    setRevenueTypeFilter(revenueType);
    // console.log('Revenue Type filter:', revenueType);
    // Add filtering logic here
  }, []);

  const handleSortByChange = useCallback((sortOption: string) => {
    setSortBy(sortOption);
    // console.log('Sort by:', sortOption);
    // Add sorting logic here
  }, []);

  // TODO: Implement actual filtering and sorting logic based on state

  return (
    <section className="mb-8">
      <div className="flex justify-between items-center px-4 pb-3 pt-2">
        <h2 className="text-white text-xl md:text-2xl font-semibold leading-tight tracking-[-0.015em]">
          Client Views
        </h2>
        <ClientViewToggle activeView={activeView} onViewChange={handleViewChange} />
      </div>

      {activeView === 'table' && (
        <div className="p-4" id="clientTableView">
          <ClientTableFilters 
            onStatusChange={handleStatusChange}
            onRevenueTypeChange={handleRevenueTypeChange}
            onSortByChange={handleSortByChange}
          />
          <ClientTable clients={filteredClients} />
        </div>
      )}

      {activeView === 'kanban' && (
        <div className="p-4" id="clientKanbanView">
          {/* Filters for Kanban can be added here if needed */}
          <ClientKanbanBoard />
        </div>
      )}
    </section>
  );
};

export default ClientViewsDisplay; 