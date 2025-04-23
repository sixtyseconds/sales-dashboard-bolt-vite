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
import { format, startOfDay, endOfDay, startOfWeek, endOfWeek, startOfMonth, endOfMonth, subDays, subWeeks, subMonths } from 'date-fns';
import { IdentifierType } from '../components/IdentifierField';
import { EditActivityForm } from './EditActivityForm';

// Define type for date range presets
type DateRangePreset = 'today' | 'thisWeek' | 'thisMonth' | 'last30Days' | 'custom';

interface StatCardProps {
  title: string;
  value: string | number;
  trendPercentage: number;
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

  // Calculate the current and previous date ranges based on the selected type
  const { currentDateRange, previousDateRange } = useMemo(() => {
    const now = new Date();
    let currentStart, currentEnd, previousStart, previousEnd;

    switch (selectedRangeType) {
      case 'today':
        currentStart = startOfDay(now);
        currentEnd = endOfDay(now);
        const yesterday = subDays(now, 1);
        previousStart = startOfDay(yesterday);
        previousEnd = endOfDay(yesterday);
        break;
      case 'thisWeek':
        currentStart = startOfWeek(now, { weekStartsOn: 0 });
        currentEnd = endOfWeek(now, { weekStartsOn: 0 });
        const lastWeek = subWeeks(now, 1);
        previousStart = startOfWeek(lastWeek, { weekStartsOn: 0 });
        previousEnd = endOfWeek(lastWeek, { weekStartsOn: 0 });
        break;
      case 'last30Days':
        currentStart = startOfDay(subDays(now, 29));
        currentEnd = endOfDay(now);
        previousStart = startOfDay(subDays(now, 59)); // 30 days before the current start
        previousEnd = endOfDay(subDays(now, 30)); // Day before the current start
        break;
      case 'thisMonth': // Default case
      default:
        currentStart = startOfMonth(now);
        currentEnd = endOfMonth(now);
        const lastMonth = subMonths(now, 1);
        previousStart = startOfMonth(lastMonth);
        previousEnd = endOfMonth(lastMonth);
        break;
    }
    return {
      currentDateRange: { start: currentStart, end: currentEnd },
      previousDateRange: { start: previousStart, end: previousEnd }
    };
  }, [selectedRangeType]);

  // Filter activities for the CURRENT selected period
  const filteredActivities = useMemo(() => {
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

  // Filter activities for the PREVIOUS equivalent period
  const previousPeriodActivities = useMemo(() => {
    if (!previousDateRange) return []; // Should not happen with default
    return activities.filter(activity => {
      try {
        const activityDate = new Date(activity.date);
        // Ensure previous range dates are valid before comparing
        return previousDateRange.start && previousDateRange.end && 
               activityDate >= previousDateRange.start && activityDate <= previousDateRange.end;
      } catch (e) {
        console.error("Error parsing activity date for previous period:", activity.date, e);
        return false; 
      }
    });
  }, [activities, previousDateRange]);

  // Calculate stats for the CURRENT period including meeting -> proposal rate
  const currentStats = useMemo(() => {
    const totalRevenue = filteredActivities
      .filter(a => a.type === 'sale')
      .reduce((sum, a) => sum + (a.amount || 0), 0);
    const activeDeals = filteredActivities
      .filter(a => a.status === 'completed').length; // Assuming completed = won deal
    const salesActivities = filteredActivities.filter(a => a.type === 'sale').length;
    const proposalActivities = filteredActivities.filter(a => a.type === 'proposal').length;
    const meetingActivities = filteredActivities.filter(a => a.type === 'meeting').length;
    const proposalWinRate = Math.round( // Renamed for clarity: Proposal -> Deal (Sale)
      (salesActivities / Math.max(1, proposalActivities)) * 100
    ) || 0;
    const meetingToProposalRate = Math.round(
      (proposalActivities / Math.max(1, meetingActivities)) * 100
    ) || 0;
    const avgDeal = totalRevenue / (salesActivities || 1); // Prevent division by zero
    return {
      totalRevenue,
      activeDeals,
      proposalWinRate, // Use the more descriptive name
      meetingToProposalRate,
      avgDeal
    };
  }, [filteredActivities]);

  // Calculate stats for the PREVIOUS period including meeting -> proposal rate
  const previousStats = useMemo(() => {
    const totalRevenue = previousPeriodActivities
      .filter(a => a.type === 'sale')
      .reduce((sum, a) => sum + (a.amount || 0), 0);
    const activeDeals = previousPeriodActivities
      .filter(a => a.status === 'completed').length;
    const salesActivities = previousPeriodActivities.filter(a => a.type === 'sale').length;
    const proposalActivities = previousPeriodActivities.filter(a => a.type === 'proposal').length;
    const meetingActivities = previousPeriodActivities.filter(a => a.type === 'meeting').length;
    const proposalWinRate = Math.round( // Renamed for clarity: Proposal -> Deal (Sale)
      (salesActivities / Math.max(1, proposalActivities)) * 100
    ) || 0;
    const meetingToProposalRate = Math.round(
        (proposalActivities / Math.max(1, meetingActivities)) * 100
      ) || 0;
    const avgDeal = totalRevenue / (salesActivities || 1); // Prevent division by zero
    return {
      totalRevenue,
      activeDeals,
      proposalWinRate, // Use the more descriptive name
      meetingToProposalRate,
      avgDeal
    };
  }, [previousPeriodActivities]);

  // Calculate percentage change
  const calculatePercentageChange = (current: number, previous: number): number => {
    if (previous === 0) {
      // If previous is 0, return 100% if current is positive, -100% if negative, 0% if both are 0.
      // Or simply return 0 to avoid infinity/large numbers. Let's go with 0 for simplicity.
      return current === 0 ? 0 : (current > 0 ? 100 : -100); // Alternative: return 0;
    }
    const change = ((current - previous) / previous) * 100;
    return Math.round(change); // Round to nearest integer
  };

  // Calculate trend percentages
  const revenueTrend = calculatePercentageChange(currentStats.totalRevenue, previousStats.totalRevenue);
  const dealsTrend = calculatePercentageChange(currentStats.activeDeals, previousStats.activeDeals);
  const proposalWinRateTrend = calculatePercentageChange(currentStats.proposalWinRate, previousStats.proposalWinRate); // Updated trend name
  const meetingToProposalRateTrend = calculatePercentageChange(currentStats.meetingToProposalRate, previousStats.meetingToProposalRate);
  const avgDealTrend = calculatePercentageChange(currentStats.avgDeal, previousStats.avgDeal);

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
  const StatCard = ({ title, value, trendPercentage, icon: Icon, color }: StatCardProps) => {
    const trendText = trendPercentage > 0 ? `+${trendPercentage}%` : `${trendPercentage}%`;
    const trendColor = trendPercentage > 0 ? `text-emerald-500` : trendPercentage < 0 ? `text-red-500` : `text-gray-500`;

    return (
      <div className={`bg-gray-900/50 backdrop-blur-xl rounded-xl p-4 border border-gray-800/50`}>
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-lg bg-${color}-500/10`}>
            <Icon className={`w-5 h-5 text-${color}-500`} />
          </div>
          <div>
            <p className="text-sm text-gray-400">{title}</p>
            <div className="flex items-baseline gap-2">
              <span className="text-xl font-bold text-white">{value}</span>
              <span className={`text-xs font-medium ${trendColor}`}>{trendText}</span>
            </div>
          </div>
        </div>
      </div>
    );
  };

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

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 px-4 sm:px-0">
            <StatCard
              key="revenue"
              title="Total Revenue"
              value={`£${currentStats.totalRevenue.toLocaleString()}`}
              trendPercentage={revenueTrend}
              icon={PoundSterling}
              color="emerald"
            />
            <StatCard
              key="meetingConversion"
              title="Meeting Conversion"
              value={`${currentStats.meetingToProposalRate}%`}
              trendPercentage={meetingToProposalRateTrend}
              icon={Users}
              color="cyan"
            />
            <StatCard
              key="proposalWinRate"
              title="Proposal Win Rate"
              value={`${currentStats.proposalWinRate}%`}
              trendPercentage={proposalWinRateTrend}
              icon={FileText}
              color="blue"
            />
            <StatCard
              key="deals"
              title="Won Deals"
              value={currentStats.activeDeals.toString()}
              trendPercentage={dealsTrend}
              icon={BarChartIcon}
              color="violet"
            />
            <StatCard
              key="avgdeal"
              title="Average Deal Value"
              value={`£${Math.round(currentStats.avgDeal).toLocaleString()}`}
              trendPercentage={avgDealTrend}
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
                  {filteredActivities.map((activity, index) => (
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
              {filteredActivities.length === 0 && (
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