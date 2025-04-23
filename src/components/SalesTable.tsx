'use client';

import React, { useState, useMemo } from 'react';
import {
  // useReactTable, // Unused
  // getCoreRowModel, // Unused
  // getSortedRowModel, // Unused
  // getFilteredRowModel, // Unused
  // SortingState, // Unused
  CellContext,
} from '@tanstack/react-table';
import {
  Edit2, 
  Trash2, 
  ArrowUpRight, 
  Users, 
  PoundSterling, 
  LinkIcon,
  TrendingUp,
  BarChart as BarChartIcon,
  Phone,
  FileText
} from 'lucide-react';
import { motion } from 'framer-motion';
import { useActivities, Activity } from '@/lib/hooks/useActivities';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from '@/components/ui/dialog';
import { format, startOfDay, endOfDay, startOfWeek, endOfWeek, startOfMonth, endOfMonth, subDays, subWeeks, subMonths, differenceInDays, addDays } from 'date-fns';
import { IdentifierType } from '../components/IdentifierField';
import { EditActivityForm } from './EditActivityForm';

// Define type for date range presets
type DateRangePreset = 'today' | 'thisWeek' | 'thisMonth' | 'last30Days' | 'custom';

interface StatCardProps {
  title: string;
  value: string | number;
  trend: string;
  icon: React.ElementType;
  color: string;
}

export function SalesTable() {
  // Removed unused sorting state
  // const [sorting, setSorting] = useState<SortingState>([]); 
  const [editingActivity, setEditingActivity] = useState<Activity | null>(null);
  const { activities, removeActivity, updateActivity } = useActivities();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [activityToDelete, setActivityToDelete] = useState<string | null>(null);
  
  // State for date filtering
  const [selectedRangeType, setSelectedRangeType] = useState<DateRangePreset>('thisMonth');
  // State for custom date range (implement date pickers later if needed)
  // const [customRange, setCustomRange] = useState<{ start: Date; end: Date } | null>(null);

  // Calculate the current date range based on the selected type
  const currentDateRange = useMemo(() => {
    const now = new Date();
    switch (selectedRangeType) {
      case 'today':
        return { start: startOfDay(now), end: endOfDay(now) };
      case 'thisWeek':
        // Assuming week starts on Sunday for startOfWeek
        return { start: startOfWeek(now, { weekStartsOn: 0 }), end: endOfWeek(now, { weekStartsOn: 0 }) }; 
      case 'thisMonth':
        return { start: startOfMonth(now), end: endOfMonth(now) };
      case 'last30Days':
        return { start: startOfDay(subDays(now, 29)), end: endOfDay(now) }; // Include today
      // case 'custom':
      //   return customRange || { start: startOfMonth(now), end: endOfMonth(now) }; // Fallback to thisMonth if custom not set
      default:
        return { start: startOfMonth(now), end: endOfMonth(now) }; // Default to this month
    }
  }, [selectedRangeType]); // Removed customRange dependency for now

  // Calculate the PREVIOUS date range based on the selected type
  const previousDateRange = useMemo(() => {
    const { start: currentStart, end: currentEnd } = currentDateRange;
    const duration = differenceInDays(currentEnd, currentStart) + 1; // Get duration in days

    switch (selectedRangeType) {
      case 'today':
        const yesterday = subDays(currentStart, 1);
        return { start: startOfDay(yesterday), end: endOfDay(yesterday) };
      case 'thisWeek':
        const startOfLastWeek = subWeeks(currentStart, 1);
        return { start: startOfLastWeek, end: endOfWeek(startOfLastWeek, { weekStartsOn: 0 }) };
      case 'thisMonth':
        const startOfLastMonth = subMonths(currentStart, 1);
        return { start: startOfLastMonth, end: endOfMonth(startOfLastMonth) };
      case 'last30Days':
        // Previous 30 days before the current 30-day window started
        const previousEnd = subDays(currentStart, 1); // Day before current window started
        const previousStart = subDays(previousEnd, 29); // Go back 29 more days
        return { start: startOfDay(previousStart), end: endOfDay(previousEnd) };
      default:
        // Default case (e.g., custom range) - for now, mirror current logic for simplicity
        // A proper implementation for custom would need more logic
        const startOfLastMonthDefault = subMonths(currentStart, 1);
        return { start: startOfLastMonthDefault, end: endOfMonth(startOfLastMonthDefault) };
    }
  }, [currentDateRange, selectedRangeType]);

  // Filter activities based on the CURRENT calculated date range
  const currentPeriodActivities = useMemo(() => {
    return activities.filter(activity => {
      try {
        const activityDate = new Date(activity.date);
        return activityDate >= currentDateRange.start && activityDate <= currentDateRange.end;
      } catch (e) {
        console.error("Error parsing activity date:", activity.date, e);
        return false; // Exclude activities with invalid dates
      }
    });
  }, [activities, currentDateRange]);

  // Filter activities based on the PREVIOUS calculated date range
  const previousPeriodActivities = useMemo(() => {
    return activities.filter(activity => {
      try {
        const activityDate = new Date(activity.date);
        // Ensure the date is within the previous period bounds
        return activityDate >= previousDateRange.start && activityDate <= previousDateRange.end;
      } catch (e) {
        console.error("Error parsing previous period activity date:", activity.date, e);
        return false; 
      }
    });
  }, [activities, previousDateRange]);

  // Calculate stats from CURRENT filtered activities
  const currentPeriodStats = useMemo(() => {
    const totalRevenue = currentPeriodActivities // Use currentPeriodActivities
      .filter(a => a.type === 'sale')
      .reduce((sum, a) => sum + (a.amount || 0), 0);

    const activeDeals = currentPeriodActivities // Use currentPeriodActivities
      .filter(a => a.status === 'completed').length;

    const winRate = Math.round(
      (currentPeriodActivities.filter(a => a.type === 'sale').length / // Use currentPeriodActivities
      Math.max(1, currentPeriodActivities.filter(a => a.type === 'proposal').length)) * 100 // Use currentPeriodActivities
    ) || 0;

    const avgDeal = totalRevenue / 
      (currentPeriodActivities.filter(a => a.type === 'sale').length || 1); // Use currentPeriodActivities

    return {
      totalRevenue,
      activeDeals,
      winRate,
      avgDeal
    };
  }, [currentPeriodActivities]); // Depend only on currentPeriodActivities

  // Calculate stats from PREVIOUS filtered activities
  const previousPeriodStats = useMemo(() => {
    const totalRevenue = previousPeriodActivities // Use previousPeriodActivities
      .filter(a => a.type === 'sale')
      .reduce((sum, a) => sum + (a.amount || 0), 0);

    const activeDeals = previousPeriodActivities // Use previousPeriodActivities
      .filter(a => a.status === 'completed').length;

    const winRate = Math.round(
      (previousPeriodActivities.filter(a => a.type === 'sale').length / // Use previousPeriodActivities
      Math.max(1, previousPeriodActivities.filter(a => a.type === 'proposal').length)) * 100 // Use previousPeriodActivities
    ) || 0;

    const avgDeal = totalRevenue / 
      (previousPeriodActivities.filter(a => a.type === 'sale').length || 1); // Use previousPeriodActivities

    return {
      totalRevenue,
      activeDeals,
      winRate,
      avgDeal
    };
  }, [previousPeriodActivities]); // Depend only on previousPeriodActivities

  // Helper function to calculate percentage change and format it
  const calculatePercentageChange = (current: number, previous: number): string => {
    if (previous === 0) {
      // If previous value is 0, can't calculate percentage.
      // Return increase if current > 0, otherwise no change.
      return current > 0 ? "+100%" : "0%"; // Or consider returning "N/A" or similar
    }
    const change = ((current - previous) / previous) * 100;
    const roundedChange = Math.round(change); // Round to nearest integer
    
    if (roundedChange === 0) return "0%";
    return `${roundedChange > 0 ? '+' : ''}${roundedChange}%`;
  };

  const handleEdit = (activity: Activity) => {
    setEditingActivity(activity);
  };

  const handleDelete = (id: string | null) => {
    console.log('Attempting to delete activity with id:', id);
    if (!id) {
      console.error('No activity ID provided for deletion');
      return;
    }
    removeActivity(id);
    setDeleteDialogOpen(false);
    setActivityToDelete(null);
  };

  const handleDeleteClick = (id: string) => {
    console.log('Setting activity to delete:', id);
    setActivityToDelete(id);
    setDeleteDialogOpen(true);
  };

  const handleSave = async (activityId: string, updates: Partial<Activity>) => {
    if (updates.amount === undefined) {
      delete updates.amount;
    }

    try {
      await updateActivity({ id: activityId, updates });
      setEditingActivity(null);
    } catch (error) {
      console.error("Failed to update activity:", error);
      toast.error("Failed to update activity. Please try again.");
    }
  };

  const getActivityIcon = (type: Activity['type']) => {
    switch (type) {
      case 'sale':
        return PoundSterling;
      case 'outbound':
        return Phone;
      case 'meeting':
        return Users;
      case 'proposal':
        return FileText;
      default:
        return FileText;
    }
  };

  const getActivityColor = (type: Activity['type']) => {
    switch (type) {
      case 'sale':
        return 'emerald';
      case 'outbound':
        return 'blue';
      case 'meeting':
        return 'violet';
      case 'proposal':
        return 'orange';
      default:
        return 'gray';
    }
  };

  const columns = useMemo(
    () => [
      {
        accessorKey: 'sales_rep',
        header: 'Sales Rep',
        size: 200,
        cell: (info: CellContext<Activity, unknown>) => {
          const salesRep = info.getValue() as string;
          const initials = salesRep?.split(' ').map((n: string) => n[0]).join('');
          
          return (
            <div className="flex items-center gap-3">
              <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-[#37bd7e]/10 border border-[#37bd7e]/20 flex items-center justify-center">
                <span className="text-xs sm:text-sm font-medium text-[#37bd7e]">
                  {initials || '??'}
                </span>
              </div>
              <span className="text-sm sm:text-base text-white">
                {salesRep || 'Loading...'}
              </span>
            </div>
          );
        },
      },
      {
        accessorKey: 'type',
        header: 'Activity Type',
        cell: ({ row, getValue }: CellContext<Activity, unknown>) => {
          const activity = row.original as Activity;
          if (!activity) return null;
          const quantity = activity.quantity || 1;
          const type = getValue() as Activity['type'];
          return (
            <div className="flex items-center gap-2">
              <div className={`p-1.5 sm:p-2 rounded-lg ${
                getActivityColor(type) === 'blue'
                  ? 'bg-blue-400/5'
                  : getActivityColor(type) === 'orange'
                    ? 'bg-orange-500/10'
                    : `bg-${getActivityColor(type)}-500/10`
              } border ${
                getActivityColor(type) === 'blue' 
                  ? 'border-blue-500/10'
                  : getActivityColor(type) === 'orange'
                    ? 'border-orange-500/20'
                    : `border-${getActivityColor(type)}-500/20`
              }`}>
                {React.createElement(getActivityIcon(type), {
                  className: `w-4 h-4 ${
                    getActivityColor(type) === 'blue'
                      ? 'text-blue-400'
                      : getActivityColor(type) === 'orange'
                        ? 'text-orange-500'
                        : `text-${getActivityColor(type)}-500`
                  }`
                })}
              </div>
              <div>
                <div className="text-sm font-medium text-white capitalize">
                  {type}
                  {type === 'outbound' && quantity > 1 && (
                    <span className="ml-2 text-xs text-blue-400">×{quantity}</span>
                  )}
                </div>
                <div className="text-[10px] text-gray-400">{format(new Date(activity.date), 'MMM d')}</div>
              </div>
              {activity.amount && (
                <div className="ml-auto text-sm font-medium text-emerald-500">
                  £{activity.amount.toLocaleString()}
                </div>
              )}
            </div>
          );
        },
      },
      {
        accessorKey: 'client_name',
        header: 'Client',
        size: 250,
        enableHiding: true,
        cell: (info: CellContext<Activity, unknown>) => {
          const activity = info.row.original as Activity;
          if (!activity) return null;
          const clientName = info.getValue() as string;
          return (
            <div className="flex items-center gap-3">
              <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-gray-800/50 flex items-center justify-center text-white text-xs sm:text-sm font-medium">
                {clientName?.split(' ').map((n: string) => n?.[0]).join('') || '??'}
              </div>
              <div>
                <div className="text-sm sm:text-base font-medium text-white">{clientName || 'Unknown'}</div>
                <div className="text-[10px] sm:text-xs text-gray-400 flex items-center gap-1">
                  <LinkIcon className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
                  {activity.details || 'No details'}
                </div>
              </div>
            </div>
          );
        },
      },
      {
        accessorKey: 'amount',
        header: 'Amount',
        size: 150,
        enableHiding: true,
        cell: (info: CellContext<Activity, unknown>) => {
          const activity = info.row.original as Activity;
          if (!activity) return null;
          const amount = info.getValue() as number | undefined;
          const status = activity.status;
          return (
            <div className="font-medium">
              <div className="text-sm sm:text-base text-white">
                {amount ? `£${Number(amount).toLocaleString()}` : '-'}
              </div>
              <div className={`text-[10px] sm:text-xs capitalize ${
                status === 'no_show' 
                  ? 'text-red-400' 
                  : status === 'completed'
                    ? 'text-green-400'
                    : status === 'cancelled'
                      ? 'text-yellow-400'
                      : 'text-gray-400'
              }`}>
                {status === 'no_show' ? 'No Show' : status || 'Unknown'}
              </div>
            </div>
          );
        },
      },
      {
        accessorKey: 'details',
        header: 'Details',
        size: 200,
        enableHiding: true,
        cell: (info: CellContext<Activity, unknown>) => {
          const activity = info.row.original as Activity;
          if (!activity) return null;
          const details = info.getValue() as string;
          return (
            <div className="text-xs sm:text-sm text-gray-400">
              {details || 'No details'}
            </div>
          );
        },
      },
      {
        accessorKey: 'actions',
        header: '',
        size: 80,
        enableHiding: true,
        cell: (info: CellContext<Activity, unknown>) => {
          const activity = info.row.original as Activity;
          if (!activity) return null;
          return (
            <div className="flex items-center justify-end gap-2">
              <Dialog 
                open={editingActivity?.id === activity.id} 
                onOpenChange={(isOpen) => {
                  if (!isOpen) {
                    setEditingActivity(null);
                  }
                }}
              >
                <DialogTrigger asChild>
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => handleEdit(activity)}
                    className="p-2 hover:bg-[#37bd7e]/20 rounded-lg transition-colors"
                  >
                    <Edit2 className="w-4 h-4 text-gray-400 hover:text-[#37bd7e]" />
                  </motion.button>
                </DialogTrigger>
                <DialogContent className="bg-gray-900/95 backdrop-blur-xl border-gray-800/50 text-white p-6 rounded-xl">
                  {editingActivity && editingActivity.id === activity.id && (
                    <EditActivityForm 
                      activity={editingActivity}
                      onSave={handleSave}
                      onCancel={() => setEditingActivity(null)}
                    />
                  )}
                </DialogContent>
              </Dialog>
              
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                className="p-2 hover:bg-red-500/20 rounded-lg transition-colors"
                onClick={(e) => {
                  e.stopPropagation();
                  handleDeleteClick(activity.id);
                }}
              >
                <Trash2 className="w-4 h-4 text-gray-400 hover:text-red-500" />
              </motion.button>
            </div>
          );
        },
      },
    ],
    [editingActivity]
  );

  // Define StatCard component here, before the return statement
  const StatCard = ({ title, value, trend, icon: Icon, color }: StatCardProps) => (
    <div
      className={`bg-gray-900/50 backdrop-blur-xl rounded-xl p-4 border border-gray-800/50`}
    >
      <div className="flex items-center gap-3">
        <div className={`p-2 rounded-lg bg-${color}-500/10`}>
          <Icon className={`w-5 h-5 text-${color}-500`} />
        </div>
        <div>
          <p className="text-sm text-gray-400">{title}</p>
          <div className="flex items-baseline gap-2">
            <span className="text-xl font-bold text-white">{value}</span>
            <span className={`text-xs font-medium text-${color}-500`}>{trend}</span>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen text-gray-100 p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="space-y-6">
          <div className="flex flex-col gap-4 sm:gap-6 md:flex-row md:items-center md:justify-between">
            <div>
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-2xl font-bold text-white">Activity Log</h1>
                  <p className="text-sm text-gray-400 mt-1">Track and manage your sales activities</p>
                </div>
              </div>
            </div>
            {/* Date Range Filter Buttons */} 
            <div className="flex flex-wrap items-center gap-2">
              {(['today', 'thisWeek', 'thisMonth', 'last30Days'] as DateRangePreset[]).map((range) => (
                  <Button
                    key={range}
                    variant={selectedRangeType === range ? "default" : "outline"}
                    size="sm"
                    onClick={() => setSelectedRangeType(range)}
                    className={`
                      ${selectedRangeType === range 
                        ? 'bg-[#37bd7e] text-white border-[#37bd7e]/50 hover:bg-[#2da76c]' 
                        : 'bg-gray-800/50 border-gray-700/50 text-gray-300 hover:bg-gray-700/70 hover:text-white'}
                    `}
                  >
                    {/* Simple label generation */} 
                    {range === 'today' && 'Today'}
                    {range === 'thisWeek' && 'This Week'}
                    {range === 'thisMonth' && 'This Month'}
                    {range === 'last30Days' && 'Last 30 Days'}
                  </Button>
              ))}
              {/* Placeholder for Custom Date button/trigger */}
              {/* 
              <Button 
                variant={selectedRangeType === 'custom' ? "default" : "outline"} 
                size="sm" 
                onClick={() => setSelectedRangeType('custom')}
                className={`...'}
              >
                Custom
              </Button> 
              */}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 px-4 sm:px-0">
            <StatCard
              key="revenue"
              title="Total Revenue"
              value={`£${currentPeriodStats.totalRevenue.toLocaleString()}`}
              trend={calculatePercentageChange(currentPeriodStats.totalRevenue, previousPeriodStats.totalRevenue)}
              icon={PoundSterling}
              color="emerald"
            />
            <StatCard
              key="deals"
              title="Active Deals"
              value={currentPeriodStats.activeDeals.toString()}
              trend={calculatePercentageChange(currentPeriodStats.activeDeals, previousPeriodStats.activeDeals)}
              icon={BarChartIcon}
              color="violet"
            />
            <StatCard
              key="winrate"
              title="Win Rate"
              value={`${currentPeriodStats.winRate}%`}
              trend={calculatePercentageChange(currentPeriodStats.winRate, previousPeriodStats.winRate)}
              icon={ArrowUpRight}
              color="blue"
            />
            <StatCard
              key="avgdeal"
              title="Average Deal"
              value={`£${Math.round(currentPeriodStats.avgDeal).toLocaleString()}`}
              trend={calculatePercentageChange(currentPeriodStats.avgDeal, previousPeriodStats.avgDeal)}
              icon={TrendingUp}
              color="amber"
            />
          </div>

          <div className="bg-gray-900/50 backdrop-blur-xl rounded-lg border border-gray-800/50 overflow-hidden w-full">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-800/50">
                    {columns.map(column => (
                      <th 
                        key={(column as any).accessorKey || (column as any).id || Math.random()}
                        className="px-2 py-2 text-left text-xs font-medium text-gray-400 whitespace-nowrap"
                        style={{ width: (column as any).size ? `${(column as any).size}px` : 'auto' }}
                      >
                        {(column as any).header ? (column as any).header.toString() : ''}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {currentPeriodActivities.map((activity, index) => (
                    <motion.tr 
                      key={activity.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ 
                        duration: 0.2,
                        delay: index * 0.02
                      }}
                      className="relative border-b border-gray-800/50 hover:bg-gray-800/20 cursor-pointer"
                    >
                      {columns.map(column => {
                        const cellContextMock = {
                          row: { original: activity },
                          getValue: () => (activity as any)[(column as any).accessorKey]
                        } as CellContext<Activity, unknown>;
                        
                        return (
                          <td
                             key={(column as any).accessorKey || (column as any).id || `${activity.id}-${(column as any).accessorKey}`}
                            className="px-2 py-2"
                            style={{ width: (column as any).size ? `${(column as any).size}px` : 'auto' }}
                          >
                            {(column as any).cell ? (column as any).cell(cellContextMock) : JSON.stringify((activity as any)[(column as any).accessorKey])}
                          </td>
                        );
                      })}
                    </motion.tr>
                  ))}
                </tbody>
              </table>
              {currentPeriodActivities.length === 0 && (
                <div className="text-center py-8">
                  <div className="text-gray-400">No activities found for the selected period.</div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent className="bg-gray-900/95 backdrop-blur-xl border-gray-800/50 text-white p-6 rounded-xl">
          <DialogHeader>
            <DialogTitle>Delete Activity</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p className="text-gray-400">
              Are you sure you want to delete this activity? This action cannot be undone.
            </p>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="ghost"
              onClick={() => setDeleteDialogOpen(false)}
              className="bg-gray-800/50 text-gray-300 hover:bg-gray-800 transition-colors"
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={() => {
                console.log('Delete button clicked, id:', activityToDelete);
                handleDelete(activityToDelete);
              }}
              className="bg-red-500 hover:bg-red-600 text-white"
            >
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}