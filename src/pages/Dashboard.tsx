import { useState, useMemo, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useUser } from '@/lib/hooks/useUser';
import { useTargets } from '@/lib/hooks/useTargets';
import { useActivityFilters } from '@/lib/hooks/useActivityFilters';
import { useNavigate } from 'react-router-dom';
import { useActivities } from '@/lib/hooks/useActivities';
import { format, startOfMonth, endOfMonth, subMonths, addMonths } from 'date-fns';
import {
  DollarSign,
  PoundSterling,
  Phone,
  Users,
  FileText,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import SalesActivityChart from '@/components/SalesActivityChart';

interface MetricCardProps {
  title: string;
  value: number;
  target: number;
  trend: number;
  icon: React.ElementType;
  type?: string;
  dateRange: {
    start: Date;
    end: Date;
  };
}

const MetricCard = ({ title, value, target, trend, icon: Icon, type, dateRange }: MetricCardProps) => {
  const navigate = useNavigate();
  const { setFilters } = useActivityFilters();

  const handleClick = () => {
    if (type) {
      setFilters({ type, dateRange });
      navigate('/activity');
    }
  };

  const handleDealClick = (deal) => {
    setFilters({ 
      type: 'sale',
      dateRange: {
        start: new Date(deal.date),
        end: new Date(deal.date)
      }
    });
    navigate('/activity');
  };

  const getIconColor = (title) => {
    switch (title) {
      case 'Revenue':
        return 'emerald';
      case 'Outbound':
        return 'blue';
      case 'Meetings':
        return 'violet';
      case 'Proposals':
        return 'orange';
      default:
        return 'gray';
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      onClick={handleClick}
      className="relative overflow-hidden bg-gradient-to-br from-gray-900/80 to-gray-900/40 backdrop-blur-xl rounded-3xl p-6 border border-gray-800/50"
    >
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className={`p-2.5 rounded-xl ${
            title === 'Outbound'
              ? 'bg-blue-500/5 border-blue-500/50'
              : `bg-${getIconColor(title)}-500/10 border border-${getIconColor(title)}-500/20`
          }`}>
            <Icon className={`w-5 h-5 ${
              title === 'Outbound'
                ? 'text-blue-400'
                : `text-${getIconColor(title)}-500`
            }`} />
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-medium text-white bg-gradient-to-r from-white to-white/70 bg-clip-text text-transparent">{title}</span>
            <span className="text-xs text-gray-500">This month</span>
          </div>
        </div>
        <div className={`px-2.5 py-1 rounded-full text-xs font-medium 
          ${trend >= 0 
            ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20' 
            : 'bg-red-500/10 text-red-500 border border-red-500/20'}`}>
          {trend >= 0 ? '+' : ''}{trend}%
        </div>
      </div>
      
      <div className="space-y-2">
        <div className="flex items-baseline gap-2">
          <span className="text-3xl font-bold text-white">
            {title === 'Revenue' ? `£${value.toLocaleString()}` : value}
          </span>
          <span className="text-sm text-gray-500 font-medium">
            / {title === 'Revenue' ? `£${target.toLocaleString()}` : target}
          </span>
        </div>
        
        <div className="space-y-1">
          <div className="flex justify-between text-xs text-white">
            <span>Progress</span>
            <span>{Math.round((value / target) * 100)}%</span>
          </div>
          <div className="h-2 rounded-full bg-gray-800/50 overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${Math.min(100, (value / target) * 100)}%` }}
              transition={{ duration: 1, ease: "easeOut" }}
              className={`h-full rounded-full ${
                title === 'Revenue' ? 'bg-gradient-to-r from-emerald-500 to-emerald-400' :
                title === 'Outbound' ? 'bg-gradient-to-r from-blue-500 to-blue-400' :
                title === 'Meetings' ? 'bg-gradient-to-r from-violet-500 to-violet-400' :
                'bg-gradient-to-r from-orange-500 to-orange-400'
              }`}
            />
          </div>
        </div>
      </div>
    </motion.div>
  );
};

// Skeleton loader component for the dashboard
function DashboardSkeleton() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
      {/* Header Skeleton */}
      <div className="space-y-1 mt-12 lg:mt-0 mb-6 sm:mb-8">
        <div className="h-9 w-64 bg-gray-800 rounded-lg" /> {/* Welcome back text */}
        <div className="h-5 w-96 bg-gray-800 rounded-lg mt-2" /> {/* Month tracking text */}
      </div>

      {/* Metrics Grid - Matches the 2x2 layout */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 mb-8">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="bg-gray-900/50 backdrop-blur-xl rounded-xl p-6 border border-gray-800/50">
            <div className="flex justify-between items-start mb-4">
              <div className="h-6 w-32 bg-gray-800 rounded-lg" /> {/* Title */}
              <div className="w-8 h-8 bg-gray-800 rounded-lg" /> {/* Icon */}
            </div>
            <div className="space-y-2">
              <div className="flex items-baseline gap-2">
                <div className="h-8 w-32 bg-gray-800 rounded-lg" /> {/* Value */}
                <div className="h-5 w-24 bg-gray-800 rounded-lg" /> {/* Target */}
              </div>
              <div className="space-y-1">
                <div className="flex justify-between">
                  <div className="h-3 w-16 bg-gray-800 rounded-lg" /> {/* Progress text */}
                  <div className="h-3 w-8 bg-gray-800 rounded-lg" /> {/* Percentage */}
                </div>
                <div className="h-2 w-full bg-gray-800/50 rounded-full" /> {/* Progress bar */}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Sales Activity Chart Skeleton */}
      <div className="mb-8">
        <div className="bg-gray-900/50 backdrop-blur-xl rounded-xl p-6 border border-gray-800/50">
          <div className="h-6 w-48 bg-gray-800 rounded-lg mb-4" /> {/* Chart title */}
          <div className="h-[300px] bg-gray-800/50 rounded-lg" /> {/* Chart area */}
        </div>
      </div>

      {/* Recent Deals Section Skeleton */}
      <div className="bg-gray-900/50 backdrop-blur-xl rounded-3xl p-4 sm:p-6 border border-gray-800/50 mt-6 sm:mt-8">
        <div className="flex justify-between items-center mb-6">
          <div className="h-6 w-32 bg-gray-800 rounded-lg" /> {/* Section title */}
          <div className="h-9 w-64 bg-gray-800 rounded-lg" /> {/* Search input */}
        </div>
        <div className="space-y-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="flex items-center gap-4 p-4 bg-gray-800/50 rounded-xl">
              <div className="w-10 h-10 bg-gray-800 rounded-lg" /> {/* Deal icon */}
              <div className="flex-1">
                <div className="h-5 w-48 bg-gray-800 rounded-lg mb-1" /> {/* Deal title */}
                <div className="h-4 w-32 bg-gray-800 rounded-lg" /> {/* Deal details */}
              </div>
              <div className="h-6 w-24 bg-gray-800 rounded-lg" /> {/* Deal amount */}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function Dashboard() {
  // Move all hooks to the top
  const [searchQuery, setSearchQuery] = useState('');
  const [showContent, setShowContent] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState(new Date());
  const { userData } = useUser();
  const navigate = useNavigate();
  const { activities, isLoadingActivities } = useActivities();
  const { data: targets, isLoadingSales } = useTargets(userData?.id);

  const selectedMonthRange = useMemo(() => ({
    start: startOfMonth(selectedMonth),
    end: endOfMonth(selectedMonth),
  }), [selectedMonth]);

  const previousMonthRange = useMemo(() => ({
    start: startOfMonth(subMonths(selectedMonth, 1)),
    end: endOfMonth(subMonths(selectedMonth, 1)),
  }), [selectedMonth]);

  // Filter activities for selected month and calculate metrics
  const selectedMonthActivities = useMemo(() => 
    activities?.filter(activity => {
      const activityDate = new Date(activity.date);
      return activityDate >= selectedMonthRange.start && activityDate <= selectedMonthRange.end;
    }) || [], [activities, selectedMonthRange]);

  // Get previous month's activities for trend calculation
  const previousMonthActivities = useMemo(() => 
    activities?.filter(activity => {
      const activityDate = new Date(activity.date);
      return activityDate >= previousMonthRange.start && activityDate <= previousMonthRange.end;
    }) || [], [activities, previousMonthRange]);

  // Calculate metrics for selected month
  const metrics = useMemo(() => ({
    revenue: selectedMonthActivities
      .filter(a => a.type === 'sale')
      .reduce((sum, a) => sum + (a.amount || 0), 0),
    outbound: selectedMonthActivities
      .filter(a => a.type === 'outbound')
      .reduce((sum, a) => sum + (a.quantity || 1), 0),
    meetings: selectedMonthActivities
      .filter(a => a.type === 'meeting')
      .reduce((sum, a) => sum + (a.quantity || 1), 0),
    proposals: selectedMonthActivities
      .filter(a => a.type === 'proposal')
      .reduce((sum, a) => sum + (a.quantity || 1), 0)
  }), [selectedMonthActivities]);

  // Calculate metrics for previous month
  const previousMetrics = useMemo(() => ({
    revenue: previousMonthActivities
      .filter(a => a.type === 'sale')
      .reduce((sum, a) => sum + (a.amount || 0), 0),
    outbound: previousMonthActivities
      .filter(a => a.type === 'outbound')
      .reduce((sum, a) => sum + (a.quantity || 1), 0),
    meetings: previousMonthActivities
      .filter(a => a.type === 'meeting')
      .reduce((sum, a) => sum + (a.quantity || 1), 0),
    proposals: previousMonthActivities
      .filter(a => a.type === 'proposal')
      .reduce((sum, a) => sum + (a.quantity || 1), 0)
  }), [previousMonthActivities]);

  // Calculate trends
  const calculateTrend = (current: number, previous: number) => {
    if (previous === 0) return 0;
    return Math.round(((current - previous) / previous) * 100);
  };

  const trends = useMemo(() => ({
    revenue: calculateTrend(metrics.revenue, previousMetrics.revenue),
    outbound: calculateTrend(metrics.outbound, previousMetrics.outbound),
    meetings: calculateTrend(metrics.meetings, previousMetrics.meetings),
    proposals: calculateTrend(metrics.proposals, previousMetrics.proposals)
  }), [metrics, previousMetrics]);

  // Filter deals based on search query
  const filteredDeals = useMemo(() => 
    selectedMonthActivities.filter(activity => 
      activity.type === 'sale' &&
      (activity.client_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
       activity.amount?.toString().includes(searchQuery) ||
       activity.details?.toLowerCase().includes(searchQuery.toLowerCase()))
    ), [selectedMonthActivities, searchQuery]);

  // Check if any data is loading
  const isAnyLoading = isLoadingActivities || isLoadingSales || !userData;

  // Use effect to handle stable loading state
  useEffect(() => {
    let timeout: number;
    if (!isAnyLoading && !showContent) {
      timeout = window.setTimeout(() => {
        setShowContent(true);
      }, 500);
    }
    return () => {
      if (timeout) {
        window.clearTimeout(timeout);
      }
    };
  }, [isAnyLoading]);

  // Early return for loading state
  if (!showContent) {
    return <DashboardSkeleton />;
  }

  // Early return for missing data
  if (!targets) {
    return null;
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
      {/* Header with Month Selection */}
      <div className="space-y-1 mt-12 lg:mt-0 mb-6 sm:mb-8">
        <h1 className="text-3xl font-bold">Welcome back, {userData?.first_name}</h1>
        <div className="flex items-center justify-between mt-2">
          <p className="text-gray-400">Here's how your sales performance is tracking</p>
          <div className="flex items-center gap-3 bg-gray-900/50 backdrop-blur-xl rounded-xl p-2 border border-gray-800/50">
            <button
              onClick={() => setSelectedMonth(prev => subMonths(prev, 1))}
              className="p-1.5 hover:bg-gray-800/50 rounded-lg transition-colors"
            >
              <ChevronLeft className="w-4 h-4 text-gray-400" />
            </button>
            <span className="text-sm font-medium text-white min-w-[100px] text-center">
              {format(selectedMonth, 'MMMM yyyy')}
            </span>
            <button
              onClick={() => setSelectedMonth(prev => addMonths(prev, 1))}
              className="p-1.5 hover:bg-gray-800/50 rounded-lg transition-colors"
              disabled={selectedMonth >= new Date()}
            >
              <ChevronRight className="w-4 h-4 text-gray-400" />
            </button>
          </div>
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 mb-8">
        <MetricCard
          title="Revenue"
          value={metrics.revenue}
          target={targets.revenue_target}
          trend={trends.revenue}
          icon={PoundSterling}
          type="sale"
          dateRange={selectedMonthRange}
        />
        <MetricCard
          title="Outbound"
          value={metrics.outbound}
          target={targets.outbound_target}
          trend={trends.outbound}
          icon={Phone}
          type="outbound"
          dateRange={selectedMonthRange}
        />
        <MetricCard
          title="Meetings"
          value={metrics.meetings}
          target={targets.meetings_target}
          trend={trends.meetings}
          icon={Users}
          type="meeting"
          dateRange={selectedMonthRange}
        />
        <MetricCard
          title="Proposals"
          value={metrics.proposals}
          target={targets.proposal_target}
          trend={trends.proposals}
          icon={FileText}
          type="proposal"
          dateRange={selectedMonthRange}
        />
      </div>

      {/* Sales Activity Chart */}
      <div className="mb-8">
        <SalesActivityChart selectedMonth={selectedMonth} />
      </div>

      {/* Recent Deals Section */}
      <div className="bg-gray-900/50 backdrop-blur-xl rounded-3xl p-4 sm:p-6 border border-gray-800/50 mt-6 sm:mt-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <h2 className="text-xl font-bold">
              {searchQuery ? 'Search Results' : 'Recent Deals'}
            </h2>
            <p className="text-sm text-gray-400">
              {searchQuery 
                ? `Found ${filteredDeals.length} matching deals`
                : 'Track your latest sales activities'
              }
            </p>
          </div>
          <button
            className="hidden sm:block px-4 py-2 rounded-xl bg-violet-500/10 text-violet-500 border border-violet-500/20 hover:bg-violet-500/20 transition-colors"
            onClick={() => navigate('/activity')}
          >
            View All
          </button>
        </div>
        
        {/* Deals List */}
        <div className="space-y-4">
          {filteredDeals.map((deal) => (
            <motion.div
              key={deal.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              whileHover={{ 
                scale: 1.02,
                transition: { duration: 0.2 }
              }}
              whileTap={{ scale: 0.98 }}
              className="bg-gray-800/50 rounded-xl p-3 sm:p-4 hover:bg-gray-800/70 transition-all duration-300 group hover:shadow-lg hover:shadow-emerald-500/10 border border-transparent hover:border-emerald-500/20 relative overflow-hidden cursor-pointer"
              onClick={() => handleDealClick(deal)}
            >
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/[0.03] to-transparent translate-x-[-200%] group-hover:translate-x-[200%] transition-transform duration-1000" />
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <motion.div 
                    className="w-10 h-10 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center group-hover:scale-110 transition-transform duration-300"
                    whileHover={{ rotate: [0, -10, 10, -5, 5, 0] }}
                    transition={{ duration: 0.5 }}
                    onClick={(e) => {
                      e.stopPropagation();
                      setFilters({ 
                        type: 'sale',
                        dateRange: {
                          start: new Date(deal.date),
                          end: new Date(deal.date)
                        }
                      });
                      navigate('/activity');
                    }}
                    onClick={() => {
                      setFilters({ 
                        type: 'sale',
                        dateRange: {
                          start: new Date(deal.date),
                          end: new Date(deal.date)
                        }
                      });
                      navigate('/activity');
                    }}
                  >
                    <PoundSterling className="w-5 h-5 text-emerald-500" />
                  </motion.div>
                  <div>
                    <h3 className="font-medium text-white group-hover:text-emerald-500 transition-colors duration-300">
                      {deal.client_name}
                    </h3>
                    <p className="text-sm text-gray-400">
                      {deal.details} • {format(new Date(deal.date), 'MMM d, yyyy')}
                    </p>
                  </div>
                </div>
                <div className="text-left sm:text-right">
                  <div className="text-lg font-bold text-white group-hover:text-emerald-400 transition-colors duration-300">
                    £{deal.amount.toLocaleString()}
                  </div>
                  <div className="text-sm text-emerald-500 group-hover:text-emerald-400 transition-colors duration-300">Signed</div>
                </div>
              </div>
            </motion.div>
          ))}
          
          {filteredDeals.length === 0 && (
            <div className="text-center py-8">
              <div className="text-gray-400">No matching deals found</div>
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="mt-2 text-violet-500 hover:text-violet-400 text-sm"
                >
                  Clear search
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}