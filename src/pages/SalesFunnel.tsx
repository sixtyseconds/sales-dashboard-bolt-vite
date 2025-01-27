import { useState, useMemo, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useUser } from '@/lib/hooks/useUser';
import { useSalesData } from '@/lib/hooks/useSalesData';
import { useTargets } from '@/lib/hooks/useTargets';
import { Users, Phone, FileText, DollarSign, Loader2 } from 'lucide-react';
import { useActivityFilters } from '@/lib/hooks/useActivityFilters';
import { useNavigate } from 'react-router-dom';
import { useActivities } from '@/lib/hooks/useActivities';
import { startOfMonth } from 'date-fns';

// Separate loading skeleton component for better code splitting
function FunnelSkeleton() {
  return (
    <div className="p-4 sm:p-6 lg:p-8 mt-12 lg:mt-0 animate-pulse">
      <div className="max-w-7xl mx-auto">
        <div className="mb-6 sm:mb-8 lg:mb-12">
          <div className="h-8 w-48 bg-gray-800 rounded-lg mb-2" />
          <div className="h-4 w-64 bg-gray-800 rounded-lg" />
        </div>
        <div className="relative max-w-4xl mx-auto space-y-4">
          {[100, 80, 60, 40].map((width, i) => (
            <div key={i} className="mb-4">
              <div className="flex items-center gap-4 mb-2">
                <div className="w-10 h-10 bg-gray-800 rounded-lg" />
                <div>
                  <div className="h-6 w-32 bg-gray-800 rounded-lg mb-1" />
                  <div className="h-8 w-16 bg-gray-800 rounded-lg" />
                </div>
              </div>
              <div className="h-16 bg-gray-800 rounded-xl" style={{ width: `${width}%` }} />
            </div>
          ))}
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 mt-8">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-gray-900/50 backdrop-blur-xl rounded-xl p-6 border border-gray-800/50">
              <div className="h-6 w-32 bg-gray-800 rounded-lg mb-2" />
              <div className="h-10 w-24 bg-gray-800 rounded-lg mb-1" />
              <div className="h-4 w-40 bg-gray-800 rounded-lg" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// Separate metrics calculation for better memoization
function useFunnelMetrics(activities: any[] | undefined) {
  return useMemo(() => {
    if (!activities) return {
      outbound: 0,
      meetings: 0,
      proposals: 0,
      closed: 0,
      overallConversion: 0,
      avgDealSize: 0,
      avgSalesVelocity: 18
    };

    const monthStart = startOfMonth(new Date());
    const monthActivities = activities.filter(activity => {
      const activityDate = new Date(activity.date);
      return activityDate >= monthStart && activityDate <= new Date();
    });

    const outboundCount = monthActivities
      .filter(a => a.type === 'outbound')
      .reduce((sum, a) => sum + (a.quantity || 1), 0);
    const meetingsCount = monthActivities
      .filter(a => a.type === 'meeting')
      .reduce((sum, a) => sum + (a.quantity || 1), 0);
    const proposalsCount = monthActivities
      .filter(a => a.type === 'proposal')
      .reduce((sum, a) => sum + (a.quantity || 1), 0);
    const closedCount = monthActivities
      .filter(a => a.type === 'sale')
      .reduce((sum, a) => sum + (a.quantity || 1), 0);

    const overallConversion = closedCount > 0 ? Math.round((closedCount / outboundCount) * 100) : 0;
    const totalRevenue = monthActivities
      .filter(a => a.type === 'sale')
      .reduce((sum, a) => sum + (a.amount || 0), 0);
    const avgDealSize = closedCount > 0 ? Math.round(totalRevenue / closedCount) : 0;

    return {
      outbound: outboundCount,
      meetings: meetingsCount,
      proposals: proposalsCount,
      closed: closedCount,
      overallConversion,
      avgDealSize,
      avgSalesVelocity: 18
    };
  }, [activities]);
}

export default function SalesFunnel() {
  const { userData } = useUser();
  const navigate = useNavigate();
  const [dateRange] = useState({
    start: new Date(new Date().setDate(1)),
    end: new Date(),
  });
  const { setFilters } = useActivityFilters();
  const { activities, isLoading: isLoadingActivities } = useActivities();
  const { data: salesData, isLoading: isLoadingSales } = useSalesData(dateRange.start, dateRange.end);
  const { data: targets, isLoading: isLoadingTargets } = useTargets(userData?.id);
  const [showContent, setShowContent] = useState(false);

  // Check if any data is loading
  const isAnyLoading = isLoadingActivities || isLoadingSales || isLoadingTargets || !userData;

  // Use effect to handle stable loading state
  useEffect(() => {
    let timeout: number;
    if (!isAnyLoading && !showContent) {
      // Add a longer delay before showing content
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

  // Use the separated metrics hook
  const funnelMetrics = useFunnelMetrics(activities);

  // Define funnel stages with memoization
  const funnelStages = useMemo(() => [
    {
      id: 'outbound',
      label: 'Outbound',
      value: funnelMetrics.outbound,
      icon: Phone,
      color: 'blue',
      description: 'Initial outreach attempts'
    },
    {
      id: 'meetings',
      label: 'Meetings',
      value: funnelMetrics.meetings,
      icon: Users,
      color: 'violet',
      description: 'Qualified meetings held'
    },
    {
      id: 'proposals',
      label: 'Proposals',
      value: funnelMetrics.proposals,
      icon: FileText,
      color: 'orange',
      description: 'Proposals sent'
    },
    {
      id: 'closed',
      label: 'Signed',
      value: funnelMetrics.closed,
      icon: DollarSign,
      color: 'emerald',
      description: 'Deals signed'
    },
  ], [funnelMetrics]);

  // Show loading skeleton until content is ready
  if (!showContent) {
    return <FunnelSkeleton />;
  }

  // Show error state if any required data is missing
  if (!targets) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-4rem)] gap-4">
        <p className="text-lg text-gray-400">Unable to load sales funnel data</p>
        <button 
          onClick={() => window.location.reload()}
          className="px-4 py-2 text-sm font-medium text-white bg-[#37bd7e] rounded-lg hover:bg-[#2da76c] transition-colors"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.2 }}
      className="p-4 sm:p-6 lg:p-8 mt-12 lg:mt-0"
    >
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6 sm:mb-8 lg:mb-12">
          <h1 className="text-3xl font-bold">Sales Funnel</h1>
          <p className="text-gray-400 mt-1">Visualise your sales pipeline conversion rates</p>
        </div>

        {/* Funnel Visualization */}
        <div className="relative max-w-4xl mx-auto">
          {funnelStages.map((stage, index) => {
            const maxValue = Math.max(...funnelStages.map(s => s.value));
            const width = maxValue > 0 ? (stage.value / maxValue) * 100 : 0;
            
            return (
              <div key={stage.id} className="mb-4">
                <div className="flex items-center gap-4 mb-2">
                  <div className={`p-2 rounded-lg ${
                    stage.color === 'blue'
                      ? 'bg-blue-400/5'
                      : `bg-${stage.color}-500/10`
                  } border ${
                    stage.color === 'blue'
                      ? 'border-blue-500/10'
                      : `border-${stage.color}-500/20`
                  }`}>
                    <stage.icon className={`w-5 h-5 ${
                      stage.color === 'blue'
                        ? 'text-blue-400'
                        : `text-${stage.color}-500`
                    }`} />
                  </div>
                  <div>
                    <div className="flex items-baseline gap-2">
                      <span className="font-medium text-white">{stage.label}</span>
                      <span className="text-sm text-gray-400">{stage.description}</span>
                    </div>
                    <div className="text-2xl font-bold text-white">{stage.value}</div>
                  </div>
                </div>
                <div className="relative">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${width}%` }}
                    transition={{ duration: 0.4, ease: "easeOut" }}
                    onClick={() => {
                      setFilters({ 
                        type: stage.id === 'closed' ? 'sale' : stage.id,
                        dateRange
                      });
                      navigate('/activity');
                    }}
                    className={`h-16 ${
                      stage.color === 'blue'
                        ? 'bg-blue-400/5 border-blue-500/10 hover:bg-blue-400/10 hover:border-blue-500/20 hover:shadow-blue-400/10'
                        : `bg-${stage.color}-500/10 border-${stage.color}-500/20 hover:bg-${stage.color}-500/20 hover:border-${stage.color}-500/40 hover:shadow-${stage.color}-500/20`
                    } backdrop-blur-xl border rounded-xl relative overflow-hidden group transition-all duration-300 hover:shadow-lg cursor-pointer`}
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-all duration-500" />
                    {index < funnelStages.length - 1 && (
                      <div className="absolute -bottom-4 left-1/2 w-0 h-0 border-l-[12px] border-l-transparent border-r-[12px] border-r-transparent border-t-[16px] border-gray-800/50" style={{ transform: 'translateX(-50%)' }} />
                    )}
                  </motion.div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Conversion Metrics */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 mt-8 sm:mt-10 lg:mt-12">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-gray-900/50 backdrop-blur-xl rounded-xl p-6 border border-gray-800/50 hover:border-[#37bd7e]/30 transition-all duration-300 hover:shadow-lg hover:shadow-[#37bd7e]/20 group"
          >
            <h3 className="text-lg font-medium mb-2">Overall Conversion</h3>
            <div className="text-3xl font-bold text-[#37bd7e] group-hover:scale-105 transition-transform duration-300">{funnelMetrics.overallConversion}%</div>
            <p className="text-sm text-gray-400 mt-1">Outbound to Closed Won</p>
          </motion.div>
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-gray-900/50 backdrop-blur-xl rounded-xl p-6 border border-gray-800/50 hover:border-[#37bd7e]/30 transition-all duration-300 hover:shadow-lg hover:shadow-[#37bd7e]/20 group"
          >
            <h3 className="text-lg font-medium mb-2">Avg. Deal Size</h3>
            <div className="text-3xl font-bold text-[#37bd7e] group-hover:scale-105 transition-transform duration-300">£{funnelMetrics.avgDealSize.toLocaleString()}</div>
            <p className="text-sm text-gray-400 mt-1">Per closed deal</p>
          </motion.div>
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="bg-gray-900/50 backdrop-blur-xl rounded-xl p-6 border border-gray-800/50 hover:border-[#37bd7e]/30 transition-all duration-300 hover:shadow-lg hover:shadow-[#37bd7e]/20 group"
          >
            <h3 className="text-lg font-medium mb-2">Sales Velocity</h3>
            <div className="text-3xl font-bold text-[#37bd7e] group-hover:scale-105 transition-transform duration-300">{funnelMetrics.avgSalesVelocity} days</div>
            <p className="text-sm text-gray-400 mt-1">Average sales cycle</p>
          </motion.div>
        </div>
      </div>
    </motion.div>
  );
}