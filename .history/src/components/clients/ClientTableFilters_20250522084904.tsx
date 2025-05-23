import React from 'react';

interface ClientTableFiltersProps {
  onStatusChange: (status: string) => void;
  onRevenueTypeChange: (revenueType: string) => void;
  onSortByChange: (sortBy: string) => void;
  // Add current filter values if they need to be controlled from parent
  // currentStatus?: string;
  // currentRevenueType?: string;
  // currentSortBy?: string;
}

const ClientTableFilters: React.FC<ClientTableFiltersProps> = ({
  onStatusChange,
  onRevenueTypeChange,
  onSortByChange,
}) => {
  const selectClasses = "block w-full bg-[#1E2022] border border-[#2C3035] text-white rounded-lg p-2.5 focus:ring-blue-500 focus:border-blue-500 text-sm";
  const labelClasses = "block text-sm font-medium text-[#A2ABB3] mb-1";

  return (
    <div className="flex flex-wrap gap-4 mb-6">
      <div className="flex-1 min-w-[200px]">
        <label htmlFor="filter-status-table" className={labelClasses}>Status</label>
        <select 
          id="filter-status-table" 
          name="filter-status-table"
          className={selectClasses} 
          onChange={(e) => onStatusChange(e.target.value)}
          defaultValue=""
        >
          <option value="">All Statuses</option>
          <option value="onboarding">Onboarding</option>
          <option value="active">Active</option>
          <option value="notice">Notice Given</option>
          <option value="cancelled">Cancelled</option>
        </select>
      </div>
      <div className="flex-1 min-w-[200px]">
        <label htmlFor="filter-revenue-table" className={labelClasses}>Revenue Type</label>
        <select 
          id="filter-revenue-table" 
          name="filter-revenue-table"
          className={selectClasses}
          onChange={(e) => onRevenueTypeChange(e.target.value)}
          defaultValue=""
        >
          <option value="">All Types</option>
          <option value="subscription">Subscription</option>
          <option value="one-off">One-Off Project</option>
        </select>
      </div>
      <div className="flex-1 min-w-[200px]">
        <label htmlFor="sort-by-table" className={labelClasses}>Sort By</label>
        <select 
          id="sort-by-table" 
          name="sort-by-table"
          className={selectClasses}
          onChange={(e) => onSortByChange(e.target.value)}
          defaultValue="value"
        >
          <option value="name">Client Name</option>
          <option value="value">Contract Value</option>
          <option value="renewal">Renewal Date</option>
        </select>
      </div>
    </div>
  );
};

export default ClientTableFilters; 