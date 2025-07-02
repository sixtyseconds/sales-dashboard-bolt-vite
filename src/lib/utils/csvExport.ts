import { Activity } from '@/lib/hooks/useActivities';
import { format } from 'date-fns';

export interface CSVExportOptions {
  filename?: string;
  includeColumns?: string[];
  excludeColumns?: string[];
}

/**
 * Converts activities data to CSV format and downloads it
 */
export const exportActivitiesToCSV = (
  activities: Activity[],
  options: CSVExportOptions = {}
) => {
  if (activities.length === 0) {
    throw new Error('No data to export');
  }

  const {
    filename = `sales-activities-${format(new Date(), 'yyyy-MM-dd')}.csv`,
    includeColumns,
    excludeColumns = []
  } = options;

  // Define all possible columns with their display names
  const allColumns = {
    date: 'Date',
    type: 'Activity Type',
    sales_rep: 'Sales Rep',
    client_name: 'Client Name',
    amount: 'Amount (£)',
    status: 'Status',
    priority: 'Priority',
    details: 'Details',
    quantity: 'Quantity'
  };

  // Determine which columns to include
  let columnsToInclude: (keyof typeof allColumns)[];
  if (includeColumns) {
    columnsToInclude = includeColumns as (keyof typeof allColumns)[];
  } else {
    columnsToInclude = Object.keys(allColumns) as (keyof typeof allColumns)[];
  }

  // Remove excluded columns
  columnsToInclude = columnsToInclude.filter(col => !excludeColumns.includes(col));

  // Create CSV headers
  const headers = columnsToInclude.map(col => allColumns[col]);
  
  // Convert activities to CSV rows
  const csvRows = activities.map(activity => {
    return columnsToInclude.map(column => {
      let value = activity[column as keyof Activity];
      
      // Format specific columns
      switch (column) {
        case 'date':
          return value ? format(new Date(value as string), 'yyyy-MM-dd HH:mm') : '';
        case 'type':
          return (value as string)?.charAt(0).toUpperCase() + (value as string)?.slice(1) || '';
        case 'status':
          if (value === 'no_show') return 'No Show';
          return (value as string)?.charAt(0).toUpperCase() + (value as string)?.slice(1) || '';
        case 'priority':
          return (value as string)?.charAt(0).toUpperCase() + (value as string)?.slice(1) || '';
        case 'amount':
          return value ? `£${Number(value).toLocaleString()}` : '';
        case 'quantity':
          return value ? value.toString() : '1';
        default:
          // Escape quotes and commas for CSV
          if (typeof value === 'string') {
            return `"${value.replace(/"/g, '""')}"`;
          }
          return value?.toString() || '';
      }
    });
  });

  // Combine headers and rows
  const csvContent = [
    headers.join(','),
    ...csvRows.map(row => row.join(','))
  ].join('\n');

  // Create and download the file
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  
  if (link.download !== undefined) {
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }
};

/**
 * Get a summary of the data being exported
 */
export const getExportSummary = (activities: Activity[]) => {
  const summary = {
    totalActivities: activities.length,
    activityTypes: {} as Record<string, number>,
    dateRange: {
      start: null as Date | null,
      end: null as Date | null
    },
    totalRevenue: 0,
    salesReps: new Set<string>(),
    clients: new Set<string>()
  };

  activities.forEach(activity => {
    // Count activity types
    summary.activityTypes[activity.type] = (summary.activityTypes[activity.type] || 0) + 1;
    
    // Track date range
    const activityDate = new Date(activity.date);
    if (!summary.dateRange.start || activityDate < summary.dateRange.start) {
      summary.dateRange.start = activityDate;
    }
    if (!summary.dateRange.end || activityDate > summary.dateRange.end) {
      summary.dateRange.end = activityDate;
    }
    
    // Sum revenue
    if (activity.type === 'sale' && activity.amount) {
      summary.totalRevenue += activity.amount;
    }
    
    // Track unique sales reps and clients
    if (activity.sales_rep) summary.salesReps.add(activity.sales_rep);
    if (activity.client_name) summary.clients.add(activity.client_name);
  });

  return {
    ...summary,
    salesReps: Array.from(summary.salesReps),
    clients: Array.from(summary.clients)
  };
};