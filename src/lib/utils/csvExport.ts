import { Activity } from '@/lib/hooks/useActivities';
import { format } from 'date-fns';

export interface CSVExportOptions {
  filename?: string;
  includeColumns?: string[];
  excludeColumns?: string[];
}

/**
 * Properly escapes a value for CSV format
 * - Wraps in quotes if contains comma, quote, or newline
 * - Doubles any internal quotes
 * - Handles null/undefined values
 */
const escapeCSVValue = (value: any): string => {
  if (value === null || value === undefined) {
    return '';
  }
  
  const stringValue = String(value);
  
  // Check if the value needs to be quoted (contains comma, quote, newline, or starts/ends with whitespace)
  const needsQuoting = /[,"\n\r]/.test(stringValue) || 
                      stringValue.startsWith(' ') || 
                      stringValue.endsWith(' ');
  
  if (needsQuoting) {
    // Double any existing quotes and wrap in quotes
    return `"${stringValue.replace(/"/g, '""')}"`;
  }
  
  return stringValue;
};

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
  const validColumns = Object.keys(allColumns) as (keyof typeof allColumns)[];
  let columnsToInclude: (keyof typeof allColumns)[];
  
  if (includeColumns) {
    // Validate each column in includeColumns against valid column names
    columnsToInclude = includeColumns.filter((col): col is keyof typeof allColumns => 
      validColumns.includes(col as keyof typeof allColumns)
    ) as (keyof typeof allColumns)[];
    
    // Log warning if any invalid columns were filtered out
    const invalidColumns = includeColumns.filter(col => 
      !validColumns.includes(col as keyof typeof allColumns)
    );
    if (invalidColumns.length > 0) {
      console.warn(`Invalid column names filtered out from CSV export: ${invalidColumns.join(', ')}`);
    }
  } else {
    columnsToInclude = validColumns;
  }

  // Remove excluded columns
  columnsToInclude = columnsToInclude.filter(col => !excludeColumns.includes(col));

  // Create CSV headers
  const headers = columnsToInclude.map(col => allColumns[col]);
  
  // Convert activities to CSV rows
  const csvRows = activities.map(activity => {
    return columnsToInclude.map(column => {
      let value = activity[column as keyof Activity];
      
      // Format specific columns with proper CSV escaping
      switch (column) {
        case 'date':
          if (!value) return escapeCSVValue('');
          try {
            const dateObj = new Date(value as string);
            // Check if the date is valid
            if (isNaN(dateObj.getTime())) {
              console.warn(`Invalid date value in activity: ${value}`);
              return escapeCSVValue(''); // Return empty string for invalid dates
            }
            const formattedDate = format(dateObj, 'yyyy-MM-dd HH:mm');
            return escapeCSVValue(formattedDate);
          } catch (error) {
            console.warn(`Error parsing date for CSV export: ${value}`, error);
            return escapeCSVValue(''); // Return empty string on parsing error
          }
        case 'type':
          const formattedType = (value as string)?.charAt(0).toUpperCase() + (value as string)?.slice(1) || '';
          return escapeCSVValue(formattedType);
        case 'status':
          let formattedStatus = '';
          if (value === 'no_show') {
            formattedStatus = 'No Show';
          } else {
            formattedStatus = (value as string)?.charAt(0).toUpperCase() + (value as string)?.slice(1) || '';
          }
          return escapeCSVValue(formattedStatus);
        case 'priority':
          const formattedPriority = (value as string)?.charAt(0).toUpperCase() + (value as string)?.slice(1) || '';
          return escapeCSVValue(formattedPriority);
        case 'amount':
          if (!value) return escapeCSVValue('');
          try {
            const numericValue = Number(value);
            if (isNaN(numericValue)) {
              console.warn(`Invalid amount value in activity: ${value}`);
              return escapeCSVValue('');
            }
            const formattedAmount = `£${numericValue.toLocaleString()}`;
            return escapeCSVValue(formattedAmount);
          } catch (error) {
            console.warn(`Error parsing amount for CSV export: ${value}`, error);
            return escapeCSVValue('');
          }
        case 'quantity':
          if (!value) return escapeCSVValue('1');
          try {
            const quantityValue = value.toString();
            return escapeCSVValue(quantityValue);
          } catch (error) {
            console.warn(`Error formatting quantity for CSV export: ${value}`, error);
            return escapeCSVValue('1');
          }
        default:
          return escapeCSVValue(value);
      }
    });
  });

  // Combine headers and rows
  const csvContent = [
    headers.join(','),
    ...csvRows.map(row => row.join(','))
  ].join('\n');

  // Create and download the file
  try {
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
    } else {
      throw new Error('File download not supported in this browser');
    }
  } catch (error) {
    console.error('Error downloading CSV file:', error);
    alert('Failed to download CSV file. Please try again or contact support if the problem persists.');
    throw error; // Re-throw to allow calling code to handle if needed
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
    
    // Track date range with error handling
    try {
      const activityDate = new Date(activity.date);
      // Check if the date is valid
      if (!isNaN(activityDate.getTime())) {
        if (!summary.dateRange.start || activityDate < summary.dateRange.start) {
          summary.dateRange.start = activityDate;
        }
        if (!summary.dateRange.end || activityDate > summary.dateRange.end) {
          summary.dateRange.end = activityDate;
        }
      } else {
        console.warn(`Invalid date value in activity for summary: ${activity.date} (Activity ID: ${activity.id || 'unknown'})`);
      }
    } catch (error) {
      console.warn(`Error parsing date for export summary: ${activity.date} (Activity ID: ${activity.id || 'unknown'})`, error);
      // Continue processing other activities even if this one has a bad date
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