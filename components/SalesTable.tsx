'use client';

import React, { useState, useMemo, useCallback, useEffect } from 'react';
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  flexRender,
} from '@tanstack/react-table';
import {
  Edit2, 
  Trash2, 
  Download, 
  Filter, 
  Search, 
  ChevronDown, 
  ChevronUp,
  Calendar, 
  X, 
  MoreVertical, 
  ArrowUpRight, 
  Users, 
  PoundSterling, 
  Link as LinkIcon,
  Star, 
  BadgeCheck, 
  Circle,
  Plus,
  TrendingUp,
  BarChart as BarChartIcon,
  Phone,
  FileText
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useActivities } from '@/lib/hooks/useActivities';
import { Button } from '@/components/ui/button';
import { toast, Toaster } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { DateRangePicker } from './DateRangePicker';
import { DateRange } from 'react-day-picker';
import { format } from 'date-fns';
import { useActivityFilters } from '@/lib/hooks/useActivityFilters';
import { IdentifierField } from './IdentifierField';

export default function SalesTable() {
  const [isPortrait, setIsPortrait] = useState(false);
  const [sorting, setSorting] = useState([]);
  const { filters, setFilters, resetFilters } = useActivityFilters();
  const [showFilters, setShowFilters] = useState(false);
  const [editingActivity, setEditingActivity] = useState(null);
  const [expandedRow, setExpandedRow] = useState<string | null>(null);
  const { activities, removeActivity, updateActivity } = useActivities();

  // Filter activities based on current filters
  const filteredActivities = useMemo(() => {
    return activities.filter(activity => {
      const matchesType = !filters.type || activity.type === filters.type;
      const matchesSalesRep = !filters.salesRep || activity.salesRep === filters.salesRep;
      const matchesSearch = !filters.searchQuery || 
        activity.clientName.toLowerCase().includes(filters.searchQuery.toLowerCase()) ||
        activity.type.toLowerCase().includes(filters.searchQuery.toLowerCase()) ||
        activity.salesRep.toLowerCase().includes(filters.searchQuery.toLowerCase());
      const activityDate = new Date(activity.date);
      const matchesDate = activityDate >= filters.dateRange.start && 
                         activityDate <= filters.dateRange.end;

      return matchesType && matchesSalesRep && matchesSearch && matchesDate;
    });
  }, [activities, filters]);

  // Calculate stats from filtered activities
  const stats = useMemo(() => {
    const totalRevenue = filteredActivities
      .filter(a => a.type === 'sale')
      .reduce((sum, a) => sum + (a.amount || 0), 0);

    const activeDeals = filteredActivities
      .filter(a => a.status === 'completed').length;

    const winRate = Math.round(
      (filteredActivities.filter(a => a.type === 'sale').length /
      filteredActivities.filter(a => a.type === 'proposal').length) * 100
    ) || 0;

    const avgDeal = totalRevenue / 
      filteredActivities.filter(a => a.type === 'sale').length || 0;

    return {
      totalRevenue,
      activeDeals,
      winRate,
      avgDeal
    };
  }, [filteredActivities]);

  useEffect(() => {
    const checkOrientation = () => {
      setIsPortrait(window.innerHeight > window.innerWidth);
    };

    checkOrientation();
    window.addEventListener('resize', checkOrientation);
    return () => window.removeEventListener('resize', checkOrientation);
  }, []);

  const handleRowClick = useCallback((id: string) => {
    setExpandedRow(expandedRow === id ? null : id);
  }, [expandedRow]);

  const handleEdit = (activity) => {
    setEditingActivity(activity);
  };

  const handleDelete = (id) => {
    removeActivity(id);
    toast.success('Activity deleted successfully');
  };

  const handleUpdate = (updatedActivity) => {
    // Get form values
    const clientName = document.querySelector('input[defaultValue="' + updatedActivity.clientName + '"]').value;
    const details = document.querySelector('input[defaultValue="' + updatedActivity.details + '"]').value;
    
    // Create update object
    const updates = {
      client_name: clientName,
      details: details
    };
    
    // Add amount if it exists
    if (updatedActivity.amount) {
      const amountInput = document.querySelector('input[defaultValue="' + updatedActivity.amount + '"]');
      if (amountInput) {
        updates.amount = parseFloat(amountInput.value);
      }
    }
    
    // Add status field for all activities
    const statusSelect = document.querySelector('select[defaultValue="' + updatedActivity.status + '"]');
    if (statusSelect) {
      updates.status = statusSelect.value;
    }
    
    // Add contact identifier fields
    if (updatedActivity.contact_identifier !== undefined) {
      updates.contact_identifier = updatedActivity.contact_identifier;
      updates.contact_identifier_type = updatedActivity.contact_identifier_type;
    }
    
    // Call updateActivity from useActivities
    updateActivity(updatedActivity.id, updates);
    
    // Close modal
    setEditingActivity(null);
    toast.success('Activity updated successfully');
  };

  const handleExport = () => {
    // Get filtered activities
    const dataToExport = filteredActivities.map(activity => ({
      Date: format(new Date(activity.date), 'dd/MM/yyyy'),
      Type: activity.type.charAt(0).toUpperCase() + activity.type.slice(1),
      Client: activity.clientName,
      Details: activity.details,
      Amount: activity.amount ? `£${activity.amount.toLocaleString()}` : '-',
      Status: activity.status.charAt(0).toUpperCase() + activity.status.slice(1),
      'Sales Rep': activity.salesRep
    }));

    // Convert to CSV
    const headers = Object.keys(dataToExport[0]);
    const csvContent = [
      headers.join(','),
      ...dataToExport.map(row => 
        headers.map(header => 
          JSON.stringify(row[header] || '')
        ).join(',')
      )
    ].join('\n');

    // Create and trigger download
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `sales_activities_${format(new Date(), 'yyyy-MM-dd')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('Export completed successfully');
  };

  const getActivityIcon = (type) => {
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

  const getActivityColor = (type) => {
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

  const StatCard = ({ title, value, trend, icon: Icon, color }) => (
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

  const getStatusColor = (status) => {
    const statusColors = {
      'Active': 'emerald',
      'Pending': 'amber',
      'Cancelled': 'red',
      'Draft': 'gray'
    };
    return statusColors[status] || 'gray';
  };

  const getPriorityIcon = (priority) => {
    switch (priority) {
      case 'high':
        return <Star className="w-4 h-4 text-amber-500" />;
      case 'medium':
        return <BadgeCheck className="w-4 h-4 text-blue-500" />;
      default:
        return <Circle className="w-4 h-4 text-gray-500" />;
    }
  };

  const columns = useMemo(
    () => [
      {
        accessorKey: 'salesRep',
        header: 'Sales Rep',
        size: 200,
        cell: info => (
          <div className="flex items-center gap-3">
            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-[#37bd7e]/10 border border-[#37bd7e]/20 flex items-center justify-center">
              <span className="text-xs sm:text-sm font-medium text-[#37bd7e]" suppressHydrationWarning>
                {info.getValue()?.split(' ').map(n => n[0]).join('') || '??'}
              </span>
            </div>
            <span className="text-sm sm:text-base text-white">
              {info.getValue() || 'Unknown'}
            </span>
          </div>
        ),
      },
      {
        accessorKey: 'type',
        header: 'Activity Type',
        cell: ({ row, getValue }) => (
          <div 
            className="flex items-center gap-2 cursor-pointer"
            onClick={() => handleRowClick(row.original.id)}
          >
            <div className={`p-1.5 sm:p-2 rounded-lg ${
              getActivityColor(getValue()) === 'blue'
                ? 'bg-blue-400/5'
                : getActivityColor(getValue()) === 'orange'
                  ? 'bg-orange-500/10'
                  : `bg-${getActivityColor(getValue())}-500/10`
            } border ${
              getActivityColor(getValue()) === 'blue' 
                ? 'border-blue-500/10'
                : getActivityColor(getValue()) === 'orange'
                  ? 'border-orange-500/20'
                  : `border-${getActivityColor(getValue())}-500/20`
            }`}>
              {React.createElement(getActivityIcon(getValue()), {
                className: `w-4 h-4 ${
                  getActivityColor(getValue()) === 'blue'
                    ? 'text-blue-400'
                    : getActivityColor(getValue()) === 'orange'
                      ? 'text-orange-500'
                      : `text-${getActivityColor(getValue())}-500`
                }`
              })}
            </div>
            <div>
              <div className="text-sm font-medium text-white capitalize">{getValue()}</div>
              <div className="text-[10px] text-gray-400">{format(new Date(row.original.date), 'MMM d')}</div>
            </div>
            {row.original.amount && (
              <div className="ml-auto text-sm font-medium text-emerald-500">
                £{row.original.amount.toLocaleString()}
              </div>
            )}
            {expandedRow === row.original.id && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="absolute left-0 right-0 top-full bg-gray-800/90 backdrop-blur-sm p-4 rounded-lg border border-gray-700/50 shadow-xl z-10 space-y-3"
              >
                <div className="flex justify-between">
                  <span className="text-sm text-gray-400">Client</span>
                  <span className="text-sm text-white">{row.original.clientName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-400">Details</span>
                  <span className="text-sm text-white">{row.original.details}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-400">Date</span>
                  <span className="text-sm text-white">{format(new Date(row.original.date), 'MMM d, yyyy')}</span>
                </div>
              </motion.div>
            )}
          </div>
        ),
      },
      {
        accessorKey: 'clientName',
        header: 'Client',
        size: 250,
        enableHiding: true,
        cell: info => (
          <div className="flex items-center gap-3">
            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-gray-800/50 flex items-center justify-center text-white text-xs sm:text-sm font-medium">
              {info.getValue()?.split(' ').map(n => n[0]).join('') || '??'}
            </div>
            <div>
              <div className="text-sm sm:text-base font-medium text-white">{info.getValue() || 'Unknown'}</div>
              <div className="text-[10px] sm:text-xs text-gray-400 flex items-center gap-1">
                <LinkIcon className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
                {info.row.original.details || 'No details'}
              </div>
            </div>
          </div>
        ),
      },
      {
        accessorKey: 'amount',
        header: 'Amount',
        size: 150,
        enableHiding: true,
        cell: info => (
          <div className="font-medium">
            <div className="text-sm sm:text-base text-white">
              {info.getValue() ? `£${Number(info.getValue()).toLocaleString()}` : '-'}
            </div>
            <div className="text-[10px] sm:text-xs text-gray-400 capitalize">
              {info.row.original.status || 'Unknown'}
            </div>
          </div>
        ),
      },
      {
        accessorKey: 'details',
        header: 'Details',
        size: 200,
        enableHiding: true,
        cell: info => (
          <div className="text-xs sm:text-sm text-gray-400">
            {info.getValue() || 'No details'}
          </div>
        ),
      },
      {
        accessorKey: 'actions',
        header: '',
        size: 80,
        enableHiding: true,
        cell: info => (
          <Dialog>
            <div className="flex items-center justify-end gap-2">
              <DialogTrigger asChild>
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  className="p-2 hover:bg-[#37bd7e]/20 rounded-lg transition-colors"
                >
                  <Edit2 className="w-4 h-4 text-gray-400 hover:text-[#37bd7e]" />
                </motion.button>
              </DialogTrigger>
              <DialogContent className="bg-gray-900/95 backdrop-blur-xl border-gray-800/50 text-white p-6 rounded-xl">
                <DialogHeader>
                  <DialogTitle>Edit Activity</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-400">Client Name</label>
                    <input
                      type="text"
                      defaultValue={info.row.original.clientName}
                      className="w-full bg-gray-800/50 border border-gray-700/50 rounded-xl px-4 py-2 text-white focus:ring-2 focus:ring-[#37bd7e] focus:border-transparent"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-400">Details</label>
                    <input
                      type="text"
                      defaultValue={info.row.original.details}
                      className="w-full bg-gray-800/50 border border-gray-700/50 rounded-xl px-4 py-2 text-white focus:ring-2 focus:ring-[#37bd7e] focus:border-transparent"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-400">Email Address</label>
                    <IdentifierField
                      value={info.row.original.contact_identifier || ''}
                      onChange={(value, type) => {
                        // This will be handled in the final save
                        info.row.original.contact_identifier = value;
                        info.row.original.contact_identifier_type = type;
                      }}
                      required={false}
                      placeholder="Enter email address"
                      label={null}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-400">Status</label>
                    <select
                      defaultValue={info.row.original.status}
                      className="w-full bg-gray-800/50 border border-gray-700/50 rounded-xl px-4 py-2 text-white focus:ring-2 focus:ring-[#37bd7e] focus:border-transparent"
                    >
                      <option value="completed">Completed</option>
                      <option value="no_show">No Show</option>
                      <option value="cancelled">Cancelled</option>
                      <option value="pending">Pending</option>
                    </select>
                  </div>
                  {info.row.original.amount && (
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-gray-400">Amount</label>
                      <input
                        type="number"
                        defaultValue={info.row.original.amount}
                        className="w-full bg-gray-800/50 border border-gray-700/50 rounded-xl px-4 py-2 text-white focus:ring-2 focus:ring-[#37bd7e] focus:border-transparent"
                      />
                    </div>
                  )}
                </div>
                <DialogFooter>
                  <Button
                    type="button"
                    onClick={() => handleUpdate(info.row.original)}
                    className="bg-[#37bd7e] hover:bg-[#2da76c] text-white rounded-xl px-4 py-2"
                  >
                    Save Changes
                  </Button>
                </DialogFooter>
              </DialogContent>
            </div>
          </Dialog>
        ),
      },
    ],
    []
  );

  const table = useReactTable({
    data: filteredActivities,
    columns,
    state: {
      sorting,
    },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getColumnVisibility: () => ({
      clientName: window.innerWidth >= 1024,
      amount: window.innerWidth >= 1024,
      details: window.innerWidth >= 1024,
      actions: window.innerWidth >= 1024,
    }),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
  });

  return (
    <div suppressHydrationWarning className="min-h-screen text-gray-100 p-4 sm:p-6 lg:p-8">
      <div suppressHydrationWarning className="max-w-7xl mx-auto space-y-6">
        <div className="space-y-6">
          <Toaster />
          {/* Header */}
          <div suppressHydrationWarning className="flex flex-col gap-4 sm:gap-6 md:flex-row md:items-center md:justify-between">
            <div>
              <div suppressHydrationWarning className="flex items-center justify-between">
                <div>
                  <h1 className="text-2xl font-bold text-white">Activity Log</h1>
                  <p className="text-sm text-gray-400 mt-1">Track and manage your sales activities</p>
                </div>
              </div>
            </div>
          </div>

          {/* Compact Stats */}
          <div suppressHydrationWarning className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 px-4 sm:px-0">
            <StatCard
              key="revenue"
              title="Total Revenue"
              value={`£${stats.totalRevenue.toLocaleString()}`}
              trend="+0%"
              icon={PoundSterling}
              color="emerald"
            />
            <StatCard
              key="deals"
              title="Active Deals"
              value={stats.activeDeals.toString()}
              trend="+0%"
              icon={BarChartIcon}
              color="violet"
            />
            <StatCard
              key="winrate"
              title="Win Rate"
              value={`${stats.winRate}%`}
              trend="+0%"
              icon={ArrowUpRight}
              color="blue"
            />
            <StatCard
              key="avgdeal"
              title="Average Deal"
              value={`£${Math.round(stats.avgDeal).toLocaleString()}`}
              trend="+0%"
              icon={TrendingUp}
              color="amber"
            />
          </div>

          {isPortrait ? (
            <div className="px-4 sm:px-0 py-12 text-center space-y-4">
              <div className="w-16 h-16 mx-auto rounded-xl bg-gray-800/50 flex items-center justify-center border border-gray-700/50">
                <FileText className="w-8 h-8 text-gray-400" />
              </div>
              <div>
                <h3 className="text-lg font-medium text-white">Landscape View Required</h3>
                <p className="text-gray-400 mt-2 max-w-sm mx-auto">Please rotate your device to view the complete activity table and all details.</p>
              </div>
            </div>
          ) : (
            <div suppressHydrationWarning className="bg-gray-900/50 backdrop-blur-xl rounded-lg border border-gray-800/50 overflow-hidden w-full">
              {/* Table Controls */}
              <div suppressHydrationWarning className="p-2 sm:p-4 border-b border-gray-800/50 space-y-2 sm:space-y-4">
            <div suppressHydrationWarning className="flex flex-col sm:flex-row sm:items-center gap-4">
              <div className="w-full sm:flex-1">
                <div suppressHydrationWarning className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search activities..."
                    value={filters.searchQuery}
                    suppressHydrationWarning
                    onChange={e => setFilters({ searchQuery: e.target.value })}
                    className="w-full bg-gray-800/50 border border-gray-700/50 rounded-lg pl-10 pr-4 py-2 text-white placeholder-gray-500 focus:ring-2 focus:ring-[#37bd7e] focus:border-transparent"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  suppressHydrationWarning
                  onClick={() => setShowFilters(!showFilters)}
                  className="flex items-center gap-2 px-3 py-2 rounded-lg bg-gray-800/50 text-gray-300 hover:bg-[#37bd7e]/20 hover:text-white transition-all duration-300 text-sm border border-transparent hover:border-[#37bd7e]/30"
                >
                  <Filter className="w-4 h-4" />
                  Filters
                </motion.button>

                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  suppressHydrationWarning
                  onClick={handleExport}
                  className="flex items-center gap-2 px-3 py-2 rounded-lg bg-[#37bd7e]/10 text-[#37bd7e] hover:bg-[#37bd7e]/20 transition-all duration-300 text-sm border border-[#37bd7e]/30 hover:border-[#37bd7e]/50 hover:shadow-lg hover:shadow-[#37bd7e]/20"
                >
                  <Download className="w-4 h-4" />
                  Export
                </motion.button>
              </div>
            </div>

            {/* Filter Panel */}
            <AnimatePresence>
              {showFilters && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="overflow-hidden"
                  suppressHydrationWarning
                >
                  <div suppressHydrationWarning className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                    <select
                      suppressHydrationWarning
                      className="bg-gray-800/50 border border-gray-700/50 rounded-xl px-4 py-2.5 text-white text-sm"
                      value={filters.type || 'all'}
                      onChange={(e) => setFilters({ type: e.target.value === 'all' ? undefined : e.target.value })}
                    >
                      <option value="all">All Types</option>
                      <option value="sale">Sales</option>
                      <option value="outbound">Outbound</option>
                      <option value="meeting">Meetings</option>
                      <option value="proposal">Proposals</option>
                    </select>
                    <select
                      suppressHydrationWarning
                      className="bg-gray-800/50 border border-gray-700/50 rounded-xl px-4 py-2.5 text-white text-sm"
                      value={filters.salesRep || 'all'}
                      onChange={(e) => setFilters({ salesRep: e.target.value === 'all' ? undefined : e.target.value })}
                    >
                      <option value="all">All Sales Reps</option>
                      {Array.from(new Set(activities.map(a => a.salesRep))).sort().map(rep => (
                        <option key={rep} value={rep}>{rep}</option>
                      ))}
                    </select>
                    <DateRangePicker
                      dateRange={{ from: filters.dateRange.start, to: filters.dateRange.end }}
                      onDateRangeChange={(range) => 
                        setFilters({ 
                          dateRange: { 
                            start: range?.from || new Date(), 
                            end: range?.to || new Date() 
                          } 
                        })
                      }
                      className="md:col-span-2"
                    />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
              </div>

              {/* Table */}
              <div className="overflow-hidden">
            <table suppressHydrationWarning className="w-full">
              <thead>
                {table.getHeaderGroups().map(headerGroup => (
                  <tr suppressHydrationWarning key={headerGroup.id} className="border-b border-gray-800/50">
                    {headerGroup.headers.map(header => (
                      header.column.getIsVisible() && (
                      <th
                        key={header.id}
                        suppressHydrationWarning
                        className="px-2 py-2 text-left text-xs font-medium text-gray-400 whitespace-nowrap"
                      >
                        {header.isPlaceholder ? null : (
                          <div
                            suppressHydrationWarning
                            {...{
                              className: header.column.getCanSort()
                                ? 'cursor-pointer select-none flex items-center gap-2 group'
                                : '',
                              onClick: header.column.getToggleSortingHandler(),
                            }}
                          >
                            {flexRender(
                              header.column.columnDef.header,
                              header.getContext()
                            )}
                            <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                              {{
                                asc: <ChevronUp className="w-4 h-4" />,
                                desc: <ChevronDown className="w-4 h-4" />,
                              }[header.column.getIsSorted()] ?? null}
                            </div>
                          </div>
                        )}
                      </th>)
                    ))}
                  </tr>
                ))}
              </thead>
              <tbody>
                  {table.getRowModel().rows.map(row => (
                    <motion.tr 
                      onClick={() => handleRowClick(row.original.id)}
                      suppressHydrationWarning
                      key={row.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ 
                        duration: 0.2,
                        // Only animate on mount, not during filtering
                        delay: filters.searchQuery ? 0 : row.index * 0.05
                      }}
                      className="relative border-b border-gray-800/50 hover:bg-gray-800/20 cursor-pointer"
                    >
                      {row.getVisibleCells().map(cell => (
                        cell.column.getIsVisible() && (
                        <td
                          suppressHydrationWarning
                          key={cell.id}
                          className="px-2 py-2"
                        >
                          {flexRender(
                            cell.column.columnDef.cell,
                            cell.getContext()
                          )}
                        </td>)
                      ))}
                    </motion.tr>
                  ))}
              </tbody>
            </table>
            {table.getRowModel().rows.length === 0 && (
              <div className="text-center py-8">
                <div className="text-gray-400">No activities found</div>
                {filters.searchQuery && (
                  <button
                    onClick={() => setFilters({ searchQuery: '' })}
                    className="mt-2 text-violet-500 hover:text-violet-400 text-sm"
                  >
                    Clear search
                  </button>
                )}
              </div>
            )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}